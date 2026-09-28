import { create } from 'zustand';
import {
  CareCircle,
  CareCircleMember,
  CareCircleInvitePayload,
  CircleDoseEvent,
  CircleSyncStatus,
  MemberRelation,
} from '../types/careCircle';
import { safeStorage, StorageKeys } from '../services/storage';
import { audioHapticsService } from '../services/audioHaptics';
import { ensureFirebaseUser, isFirebaseConfigured } from '../services/firebase';
import {
  addMemberRemote,
  createCircleRemote,
  deleteDoseEventRemote,
  doseEventId,
  joinCircleRemote,
  publishDoseEventRemote,
  remoteMemberToLocal,
  subscribeCircle,
  toRemoteMember,
  toggleRemoteCheer,
  type RemoteCircle,
} from '../services/circleSync';

/** Everything the store needs to mirror one logged dose into the circle. */
export interface DoseEventInput {
  medicineId: string;
  medicineName: string;
  memberId: string;
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:mm
  status: 'taken' | 'skipped' | 'snoozed';
  actionTime: string;
}

export interface JoinResult {
  success: boolean;
  message: string;
  circle?: CareCircle;
}

interface CareCircleState {
  circles: CareCircle[];
  activeCircleId: string | null;
  isLoaded: boolean;

  /** 'local' means no Firebase keys are configured — offline-only mode. */
  syncStatus: CircleSyncStatus;
  syncError?: string;
  myUid: string | null;
  /** Live dose events mirrored from Firestore across every joined circle. */
  circleFeed: CircleDoseEvent[];

  loadData: () => Promise<void>;
  initSync: () => Promise<void>;
  createCircle: (name: string, inviterName: string) => Promise<CareCircle>;
  joinCircleFromQR: (rawQrString: string, currentUserName: string) => Promise<JoinResult>;
  joinCircleByCode: (inviteCode: string, currentUserName: string) => Promise<JoinResult>;
  addMemberToCircle: (
    circleId: string,
    name: string,
    relation: CareCircleMember['relation'],
    avatarColor?: string
  ) => Promise<void>;
  getActiveCircle: () => CareCircle | undefined;
  getGenerateQRPayload: (circleId: string) => string;

  /** Mirrors a logged dose to Firestore so the whole circle sees it live. */
  publishDoseEvent: (input: DoseEventInput) => Promise<void>;
  /** Retracts a mirrored dose (dose undo). */
  retractDoseEvent: (input: Omit<DoseEventInput, 'medicineName' | 'status' | 'actionTime'>) => Promise<void>;
  sendRemoteCheer: (eventId: string, emoji: string) => Promise<void>;
}

const AVATAR_COLORS = ['#0D9488', '#0284C7', '#F59E0B', '#10B981', '#E11D48'];

/** Module-scope so subscriptions survive re-renders and are never duplicated. */
const unsubscribers: Array<() => void> = [];
const subscribedCircleIds = new Set<string>();
let syncInFlight = false;

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
}

function makeInviteCode(name: string): string {
  return `MEDDY-${name.slice(0, 3).toUpperCase() || 'FAM'}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function isInviteCodeTaken(err: unknown): boolean {
  return err instanceof Error && err.message === 'INVITE_CODE_TAKEN';
}

function toSelfMember(name: string, uid: string | null, isOwner: boolean): CareCircleMember {
  return {
    id: 'user_self',
    uid: uid ?? undefined,
    name: name.trim() || 'You',
    relation: 'Self',
    avatarColor: AVATAR_COLORS[0],
    isOwner,
    joinedAt: new Date().toISOString(),
  };
}

export const useCareCircleStore = create<CareCircleState>((set, get) => {
  const persistCircles = (circles: CareCircle[], activeCircleId = get().activeCircleId) => {
    set({ circles, activeCircleId });
    void safeStorage.setItem(StorageKeys.CARE_CIRCLES, circles);
    void safeStorage.setItem(StorageKeys.ACTIVE_CIRCLE_ID, activeCircleId);
  };

  const subscribeToCircle = (circleId: string) => {
    if (!isFirebaseConfigured || subscribedCircleIds.has(circleId)) return;
    subscribedCircleIds.add(circleId);

    const unsubscribe = subscribeCircle(circleId, {
      onCircle: (remote) => {
        const updated = get().circles.map((c) =>
          c.id === circleId
            ? { ...c, name: remote.name, inviteCode: remote.inviteCode, createdById: remote.createdById }
            : c
        );
        persistCircles(updated);
      },
      onMembers: (remoteMembers) => {
        const myUid = get().myUid;
        const mapped = remoteMembers.map((m) => remoteMemberToLocal(m, myUid));
        const updated = get().circles.map((c) => {
          if (c.id !== circleId) return c;
          const remoteIds = new Set(mapped.map((m) => m.id));
          // Keep loved ones added on this device until their write lands.
          const pendingLocal = c.members.filter((m) => !m.uid && !remoteIds.has(m.id));
          return { ...c, members: [...mapped, ...pendingLocal] };
        });
        persistCircles(updated);
      },
      onEvents: (events) => {
        const otherCircles = get().circleFeed.filter((e) => e.circleId !== circleId);
        set({ circleFeed: [...events, ...otherCircles].slice(0, 120) });
      },
      onError: (error) => set({ syncStatus: 'error', syncError: error.message }),
    });

    unsubscribers.push(unsubscribe);
  };

  /**
   * Offline fallback: the pre-Firebase behaviour where scanning a QR creates a
   * local copy of the circle. Keeps the demo working without any credentials.
   */
  const localJoin = async (
    parsed: CareCircleInvitePayload,
    currentUserName: string
  ): Promise<JoinResult> => {
    const existingCircles = get().circles;
    const alreadyJoined = existingCircles.find((c) => c.id === parsed.circleId);

    if (alreadyJoined) {
      persistCircles(existingCircles, alreadyJoined.id);
      return { success: true, message: `Switched to "${alreadyJoined.name}"!`, circle: alreadyJoined };
    }

    const joinedCircle: CareCircle = {
      id: parsed.circleId,
      name: parsed.circleName,
      inviteCode: parsed.inviteCode || 'MEDDY-JOINED',
      createdById: parsed.inviterName || 'Care Circle Admin',
      createdAt: new Date().toISOString(),
      members: [
        {
          id: 'admin_member',
          name: parsed.inviterName || 'Admin',
          relation: 'Caregiver',
          avatarColor: AVATAR_COLORS[1],
          isOwner: true,
          joinedAt: new Date().toISOString(),
        },
        toSelfMember(currentUserName, null, false),
      ],
    };

    persistCircles([joinedCircle, ...existingCircles], joinedCircle.id);
    await audioHapticsService.triggerSuccessFeedback();

    return {
      success: true,
      message: `Joined "${parsed.circleName}" (local only — connect Firebase for live sync).`,
      circle: joinedCircle,
    };
  };

  return {
    circles: [],
    activeCircleId: null,
    isLoaded: false,

    syncStatus: isFirebaseConfigured ? 'connecting' : 'local',
    myUid: null,
    circleFeed: [],

    loadData: async () => {
      const savedCircles = await safeStorage.getItem<CareCircle[]>(StorageKeys.CARE_CIRCLES, []);
      const savedActiveId = await safeStorage.getItem<string | null>(
        StorageKeys.ACTIVE_CIRCLE_ID,
        null
      );

      set({
        circles: savedCircles,
        activeCircleId: savedActiveId || (savedCircles.length > 0 ? savedCircles[0].id : null),
        isLoaded: true,
      });
    },

    initSync: async () => {
      if (!isFirebaseConfigured) {
        set({ syncStatus: 'local' });
        return;
      }
      if (syncInFlight) return;
      syncInFlight = true;
      set({ syncStatus: get().myUid ? get().syncStatus : 'connecting' });

      try {
        const uid = await ensureFirebaseUser();
        if (!uid) {
          set({
            syncStatus: 'error',
            syncError: 'Firebase sign-in failed. Enable the Anonymous provider in the Firebase console.',
          });
          return;
        }
        set({ myUid: uid });
        get().circles.forEach((circle) => subscribeToCircle(circle.id));
        set({ syncStatus: 'online', syncError: undefined });
      } catch (err) {
        set({
          syncStatus: 'error',
          syncError: err instanceof Error ? err.message : 'Care Circle sync failed.',
        });
      } finally {
        syncInFlight = false;
      }
    },

    createCircle: async (name, inviterName) => {
      const myUid = get().myUid;
      const selfMember = toSelfMember(inviterName, myUid, true);
      const circle: CareCircle = {
        id: makeId('circle'),
        name,
        inviteCode: makeInviteCode(name),
        createdById: 'user_self',
        createdAt: new Date().toISOString(),
        members: [selfMember],
      };

      persistCircles([circle, ...get().circles], circle.id);
      await audioHapticsService.triggerSuccessFeedback();

      if (!isFirebaseConfigured || !myUid) return circle;

      const remoteCircle: RemoteCircle = {
        ...circle,
        createdById: myUid, // rules require the creator's uid
      };

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await createCircleRemote(remoteCircle, toRemoteMember(selfMember));
          subscribeToCircle(circle.id);
          set({ syncStatus: 'online', syncError: undefined });
          return circle;
        } catch (err) {
          if (isInviteCodeTaken(err) && attempt < 2) {
            remoteCircle.inviteCode = makeInviteCode(name);
            circle.inviteCode = remoteCircle.inviteCode;
            persistCircles(get().circles.map((c) => (c.id === circle.id ? { ...c, inviteCode: circle.inviteCode } : c)));
            continue;
          }
          set({
            syncStatus: 'error',
            syncError: err instanceof Error ? err.message : 'Could not publish the circle.',
          });
          return circle;
        }
      }

      return circle;
    },

    joinCircleFromQR: async (rawQrString, currentUserName) => {
      try {
        let parsed: CareCircleInvitePayload;
        try {
          parsed = JSON.parse(rawQrString);
        } catch {
          return { success: false, message: 'Invalid QR Code format. Please scan a valid Meddy Care Circle code.' };
        }

        if (!parsed.circleId || !parsed.circleName) {
          return { success: false, message: 'QR Code does not contain valid Care Circle information.' };
        }

        if (isFirebaseConfigured && parsed.inviteCode) {
          return get().joinCircleByCode(parsed.inviteCode, currentUserName);
        }

        return localJoin(parsed, currentUserName);
      } catch (err) {
        console.warn('[careCircleStore] Error joining circle from QR:', err);
        return { success: false, message: 'Failed to process QR code. Please try again.' };
      }
    },

    joinCircleByCode: async (inviteCode, currentUserName) => {
      const code = inviteCode.trim().toUpperCase();
      if (!code) return { success: false, message: 'Please enter an invite code.' };

      if (!isFirebaseConfigured) {
        const payload: CareCircleInvitePayload = {
          version: '1.0',
          circleId: `circle_code_${code}`,
          circleName: `Care Circle (${code})`,
          inviterName: 'Circle Admin',
          inviteCode: code,
          timestamp: Date.now(),
        };
        return localJoin(payload, currentUserName);
      }

      const uid = get().myUid ?? (await ensureFirebaseUser());
      if (!uid) {
        return { success: false, message: 'Cloud sync is unavailable. Check your connection and Firebase setup.' };
      }
      set({ myUid: uid });

      try {
        const joined = await joinCircleRemote(code, toRemoteMember(toSelfMember(currentUserName, uid, false)));
        if (!joined) {
          return { success: false, message: `No Care Circle found for invite code ${code}.` };
        }

        const members = joined.members.map((m) => remoteMemberToLocal(m, uid));
        const existing = get().circles.find((c) => c.id === joined.circle.id);

        if (existing) {
          const merged: CareCircle = { ...existing, ...joined.circle, members };
          persistCircles(get().circles.map((c) => (c.id === merged.id ? merged : c)), merged.id);
          subscribeToCircle(merged.id);
          set({ syncStatus: 'online', syncError: undefined });
          return { success: true, message: `Switched to "${merged.name}" — live sync on.`, circle: merged };
        }

        const circle: CareCircle = { ...joined.circle, members };
        persistCircles([circle, ...get().circles], circle.id);
        subscribeToCircle(circle.id);
        set({ syncStatus: 'online', syncError: undefined });
        await audioHapticsService.triggerSuccessFeedback();

        return { success: true, message: `Joined "${circle.name}" — live sync on!`, circle };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        set({ syncStatus: 'error', syncError: message });
        return { success: false, message: `Could not join: ${message}` };
      }
    },

    addMemberToCircle: async (circleId, name, relation, avatarColor) => {
      const circles = get().circles;
      const target = circles.find((c) => c.id === circleId);
      if (!target) return;

      const chosenColor = avatarColor || AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
      const newMember: CareCircleMember = {
        id: makeId('member'),
        name,
        relation: relation as MemberRelation,
        avatarColor: chosenColor,
        isOwner: false,
        joinedAt: new Date().toISOString(),
      };

      const updatedCircle: CareCircle = { ...target, members: [...target.members, newMember] };
      persistCircles(circles.map((c) => (c.id === circleId ? updatedCircle : c)));
      await audioHapticsService.triggerSuccessFeedback();

      if (!isFirebaseConfigured || !get().myUid) return;
      try {
        await addMemberRemote(circleId, toRemoteMember(newMember));
      } catch (err) {
        set({ syncError: err instanceof Error ? err.message : 'Member did not sync.' });
      }
    },

    getActiveCircle: () => {
      const { circles, activeCircleId } = get();
      if (!activeCircleId) return circles.length > 0 ? circles[0] : undefined;
      return circles.find((c) => c.id === activeCircleId) || (circles.length > 0 ? circles[0] : undefined);
    },

    getGenerateQRPayload: (circleId) => {
      const circle = get().circles.find((c) => c.id === circleId) || get().getActiveCircle();
      if (!circle) return '';

      const payload: CareCircleInvitePayload = {
        version: '1.0',
        circleId: circle.id,
        circleName: circle.name,
        inviterName: circle.members.find((m) => m.isOwner)?.name || 'Care Circle Admin',
        inviteCode: circle.inviteCode,
        timestamp: Date.now(),
      };

      return JSON.stringify(payload);
    },

    publishDoseEvent: async (input) => {
      const { circles, activeCircleId, myUid } = get();
      if (!isFirebaseConfigured || !myUid) return;

      const circle = circles.find((c) => c.id === activeCircleId) || circles[0];
      if (!circle) return;

      const canonicalMemberId = input.memberId === 'user_self' ? myUid : input.memberId;
      const member = circle.members.find((m) => m.id === input.memberId);
      const selfName = circle.members.find((m) => m.id === 'user_self')?.name;

      const event: CircleDoseEvent = {
        id: doseEventId(input.medicineId, canonicalMemberId, input.dateStr, input.timeStr),
        circleId: circle.id,
        medicineId: input.medicineId,
        medicineName: input.medicineName,
        memberId: canonicalMemberId,
        memberName: member?.name ?? (input.memberId === 'user_self' ? 'You' : 'Someone'),
        dateStr: input.dateStr,
        timeStr: input.timeStr,
        status: input.status,
        actionTime: input.actionTime,
        actorUid: myUid,
        actorName: selfName,
        cheers: {},
      };

      // Optimistic: show it on this device immediately, the listener reconciles.
      set({
        circleFeed: [event, ...get().circleFeed.filter((e) => e.id !== event.id)].slice(0, 120),
      });

      try {
        await publishDoseEventRemote(event);
      } catch (err) {
        console.warn('[careCircleStore] Could not publish dose event:', err);
      }
    },

    retractDoseEvent: async (input) => {
      const { circles, activeCircleId, myUid } = get();
      if (!isFirebaseConfigured || !myUid) return;

      const circle = circles.find((c) => c.id === activeCircleId) || circles[0];
      if (!circle) return;

      const canonicalMemberId = input.memberId === 'user_self' ? myUid : input.memberId;
      const eventId = doseEventId(input.medicineId, canonicalMemberId, input.dateStr, input.timeStr);

      set({ circleFeed: get().circleFeed.filter((e) => e.id !== eventId) });

      try {
        await deleteDoseEventRemote(circle.id, eventId);
      } catch (err) {
        console.warn('[careCircleStore] Could not retract dose event:', err);
      }
    },

    sendRemoteCheer: async (eventId, emoji) => {
      const { circleFeed, myUid } = get();
      if (!myUid) return;

      const event = circleFeed.find((e) => e.id === eventId);
      if (!event) return;

      const nextEmoji = event.cheers?.[myUid] === emoji ? null : emoji;
      const cheers = { ...(event.cheers ?? {}) };
      if (nextEmoji) cheers[myUid] = nextEmoji;
      else delete cheers[myUid];

      set({ circleFeed: circleFeed.map((e) => (e.id === eventId ? { ...e, cheers } : e)) });
      await audioHapticsService.triggerSuccessFeedback();

      if (!isFirebaseConfigured) return;
      try {
        await toggleRemoteCheer(event.circleId, eventId, myUid, nextEmoji);
      } catch (err) {
        console.warn('[careCircleStore] Could not send cheer:', err);
      }
    },
  };
});
