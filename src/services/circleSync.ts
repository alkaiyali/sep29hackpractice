/**
 * Firestore data layer for Care Circle live sync.
 *
 * Pure transport: this module never imports a Zustand store, so stores can
 * depend on it one-way. Every function is a no-op-safe throw when Firebase is
 * not configured — callers only reach it after `isFirebaseConfigured` checks.
 *
 * Data model (see Context/07_FIREBASE_BACKEND_SETUP.md):
 *   invites/{inviteCode}                     → circle lookup for QR / manual join
 *   circles/{circleId}                       → name, inviteCode, createdById, memberUids
 *   circles/{circleId}/members/{memberId}    → roster (memberId = uid for devices)
 *   circles/{circleId}/doseEvents/{eventId}  → one doc per logged dose (deterministic id)
 */
import {
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { getFirestoreDb } from './firebase';
import { CareCircle, CareCircleMember, CircleDoseEvent } from '../types/careCircle';

/** A circle document without its members subcollection. */
export type RemoteCircle = Omit<CareCircle, 'members'>;

export interface CircleSubscriptionHandlers {
  onCircle: (circle: RemoteCircle) => void;
  onMembers: (members: CareCircleMember[]) => void;
  onEvents: (events: CircleDoseEvent[]) => void;
  onError: (error: Error) => void;
}

const FEED_LIMIT = 80;

function requireDb() {
  const firestore = getFirestoreDb();
  if (!firestore) throw new Error('Firebase is not configured');
  return firestore;
}

/** Deterministic dose-event id so every device upserts the same logical dose. */
export function doseEventId(
  medicineId: string,
  memberId: string,
  dateStr: string,
  timeStr: string
): string {
  return `${medicineId}__${memberId}__${dateStr}__${timeStr}`.replace(/[^a-zA-Z0-9_-]/g, '-');
}

/**
 * Device members are keyed by their Firebase uid so any device can attribute
 * their actions. Loved ones without a device keep their generated id.
 */
export function toRemoteMember(member: CareCircleMember): CareCircleMember {
  if (member.uid) return { ...member, id: member.uid };
  return member;
}

/** Maps the signed-in member back to the local `user_self` convention. */
export function remoteMemberToLocal(member: CareCircleMember, myUid: string | null): CareCircleMember {
  if (myUid && member.uid === myUid) return { ...member, id: 'user_self' };
  return member;
}

export async function createCircleRemote(circle: RemoteCircle, self: CareCircleMember): Promise<void> {
  const firestore = requireDb();
  if (!self.id) throw new Error('Membership requires a signed-in user');

  const inviteRef = doc(firestore, 'invites', circle.inviteCode);
  const existingInvite = await getDoc(inviteRef);
  if (existingInvite.exists()) throw new Error('INVITE_CODE_TAKEN');

  const batch = writeBatch(firestore);
  batch.set(doc(firestore, 'circles', circle.id), {
    name: circle.name,
    inviteCode: circle.inviteCode,
    createdById: circle.createdById,
    createdAt: circle.createdAt,
    memberUids: [self.id],
  });
  batch.set(doc(firestore, 'circles', circle.id, 'members', self.id), self);
  batch.set(inviteRef, {
    circleId: circle.id,
    circleName: circle.name,
    inviterName: self.name,
    createdBy: self.id,
    createdAt: serverTimestamp(),
    active: true,
  });
  await batch.commit();
}

export async function joinCircleRemote(
  inviteCode: string,
  self: CareCircleMember
): Promise<{ circle: RemoteCircle; members: CareCircleMember[] } | null> {
  const firestore = requireDb();

  const inviteSnap = await getDoc(doc(firestore, 'invites', inviteCode));
  if (!inviteSnap.exists()) return null;
  const invite = inviteSnap.data() as { circleId?: string; active?: boolean };
  if (!invite.circleId || invite.active === false) return null;

  const circleId = invite.circleId;
  const batch = writeBatch(firestore);
  batch.set(doc(firestore, 'circles', circleId, 'members', self.id), self, { merge: true });
  batch.update(doc(firestore, 'circles', circleId), { memberUids: arrayUnion(self.id) });
  await batch.commit();

  const [circleSnap, memberSnaps] = await Promise.all([
    getDoc(doc(firestore, 'circles', circleId)),
    getDocs(collection(firestore, 'circles', circleId, 'members')),
  ]);
  if (!circleSnap.exists()) return null;

  const data = circleSnap.data() as {
    name: string;
    inviteCode: string;
    createdById: string;
    createdAt: string;
  };
  const members = memberSnaps.docs.map((d) => ({ ...(d.data() as CareCircleMember), id: d.id }));

  return {
    circle: {
      id: circleId,
      name: data.name,
      inviteCode: data.inviteCode,
      createdById: data.createdById,
      createdAt: data.createdAt,
    },
    members,
  };
}

export async function addMemberRemote(circleId: string, member: CareCircleMember): Promise<void> {
  const firestore = requireDb();
  await setDoc(doc(firestore, 'circles', circleId, 'members', member.id), member, { merge: true });
}

/** Subscribes to a circle plus its roster and recent dose feed. */
export function subscribeCircle(
  circleId: string,
  handlers: CircleSubscriptionHandlers
): () => void {
  const firestore = getFirestoreDb();
  if (!firestore) return () => {};

  const handleError = (error: unknown) =>
    handlers.onError(error instanceof Error ? error : new Error(String(error)));

  const unsubscribeCircle = onSnapshot(
    doc(firestore, 'circles', circleId),
    (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as {
        name: string;
        inviteCode: string;
        createdById: string;
        createdAt: string;
      };
      handlers.onCircle({
        id: circleId,
        name: data.name,
        inviteCode: data.inviteCode,
        createdById: data.createdById,
        createdAt: data.createdAt,
      });
    },
    handleError
  );

  const unsubscribeMembers = onSnapshot(
    collection(firestore, 'circles', circleId, 'members'),
    (snap) => {
      handlers.onMembers(snap.docs.map((d) => ({ ...(d.data() as CareCircleMember), id: d.id })));
    },
    handleError
  );

  const unsubscribeEvents = onSnapshot(
    query(
      collection(firestore, 'circles', circleId, 'doseEvents'),
      orderBy('actionTime', 'desc'),
      limit(FEED_LIMIT)
    ),
    (snap) => {
      handlers.onEvents(snap.docs.map((d) => ({ ...(d.data() as CircleDoseEvent), id: d.id })));
    },
    handleError
  );

  return () => {
    unsubscribeCircle();
    unsubscribeMembers();
    unsubscribeEvents();
  };
}

export async function publishDoseEventRemote(event: CircleDoseEvent): Promise<void> {
  const firestore = requireDb();
  const { circleId, id, ...rest } = event;
  await setDoc(
    doc(firestore, 'circles', circleId, 'doseEvents', id),
    { ...rest, id, circleId, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function deleteDoseEventRemote(circleId: string, eventId: string): Promise<void> {
  const firestore = requireDb();
  await deleteDoc(doc(firestore, 'circles', circleId, 'doseEvents', eventId));
}

/** One cheer per member per dose; passing null removes the cheer. */
export async function toggleRemoteCheer(
  circleId: string,
  eventId: string,
  uid: string,
  emoji: string | null
): Promise<void> {
  const firestore = requireDb();
  await updateDoc(doc(firestore, 'circles', circleId, 'doseEvents', eventId), {
    [`cheers.${uid}`]: emoji ?? deleteField(),
  });
}
