import { create } from 'zustand';
import { CareCircle, CareCircleMember, CareCircleInvitePayload } from '../types/careCircle';
import { safeStorage, StorageKeys } from '../services/storage';
import { INITIAL_CARE_CIRCLE } from '../constants/defaultData';
import { audioHapticsService } from '../services/audioHaptics';

interface CareCircleState {
  circles: CareCircle[];
  activeCircleId: string | null;
  isLoaded: boolean;

  loadData: () => Promise<void>;
  createCircle: (name: string, inviterName: string) => Promise<CareCircle>;
  joinCircleFromQR: (rawQrString: string, currentUserName: string) => Promise<{ success: boolean; message: string; circle?: CareCircle }>;
  addMemberToCircle: (circleId: string, name: string, relation: CareCircleMember['relation'], avatarColor?: string) => Promise<void>;
  getActiveCircle: () => CareCircle | undefined;
  getGenerateQRPayload: (circleId: string) => string;
}

export const useCareCircleStore = create<CareCircleState>((set, get) => ({
  circles: [],
  activeCircleId: null,
  isLoaded: false,

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

  createCircle: async (name, inviterName) => {
    const circleId = `circle_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const randomCode = `MEDDY-${name.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newCircle: CareCircle = {
      id: circleId,
      name,
      inviteCode: randomCode,
      createdById: 'user_self',
      createdAt: new Date().toISOString(),
      members: [
        {
          id: 'user_self',
          name: inviterName.trim() || 'You',
          relation: 'Self',
          avatarColor: '#0D9488',
          isOwner: true,
          joinedAt: new Date().toISOString(),
        },
      ],
    };

    const updated = [newCircle, ...get().circles];
    set({ circles: updated, activeCircleId: circleId });

    await safeStorage.setItem(StorageKeys.CARE_CIRCLES, updated);
    await safeStorage.setItem(StorageKeys.ACTIVE_CIRCLE_ID, circleId);
    await audioHapticsService.triggerSuccessFeedback();

    return newCircle;
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

      const existingCircles = get().circles;
      const alreadyJoined = existingCircles.find((c) => c.id === parsed.circleId);

      if (alreadyJoined) {
        set({ activeCircleId: alreadyJoined.id });
        await safeStorage.setItem(StorageKeys.ACTIVE_CIRCLE_ID, alreadyJoined.id);
        return { success: true, message: `Switched to "${alreadyJoined.name}"!`, circle: alreadyJoined };
      }

      // Create new joined circle entry
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
            avatarColor: '#0284C7',
            isOwner: true,
            joinedAt: new Date().toISOString(),
          },
          {
            id: 'user_self',
            name: currentUserName.trim() || 'You',
            relation: 'Self',
            avatarColor: '#0D9488',
            isOwner: false,
            joinedAt: new Date().toISOString(),
          },
        ],
      };

      const updated = [joinedCircle, ...existingCircles];
      set({ circles: updated, activeCircleId: joinedCircle.id });

      await safeStorage.setItem(StorageKeys.CARE_CIRCLES, updated);
      await safeStorage.setItem(StorageKeys.ACTIVE_CIRCLE_ID, joinedCircle.id);
      await audioHapticsService.triggerSuccessFeedback();

      return { success: true, message: `Successfully joined "${parsed.circleName}"!`, circle: joinedCircle };
    } catch (err) {
      console.warn('[careCircleStore] Error joining circle from QR:', err);
      return { success: false, message: 'Failed to process QR code. Please try again.' };
    }
  },

  addMemberToCircle: async (circleId, name, relation, avatarColor) => {
    const circles = get().circles;
    const target = circles.find((c) => c.id === circleId);
    if (!target) return;

    const colors = ['#0D9488', '#0284C7', '#F59E0B', '#10B981', '#E11D48'];
    const chosenColor = avatarColor || colors[Math.floor(Math.random() * colors.length)];

    const newMember: CareCircleMember = {
      id: `member_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      relation,
      avatarColor: chosenColor,
      isOwner: false,
      joinedAt: new Date().toISOString(),
    };

    const updatedCircle: CareCircle = {
      ...target,
      members: [...target.members, newMember],
    };

    const updatedList = circles.map((c) => (c.id === circleId ? updatedCircle : c));
    set({ circles: updatedList });
    await safeStorage.setItem(StorageKeys.CARE_CIRCLES, updatedList);
    await audioHapticsService.triggerSuccessFeedback();
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
}));
