import { create } from 'zustand';
import { safeStorage, StorageKeys } from '../services/storage';
import { audioHapticsService } from '../services/audioHaptics';

export const REACTION_EMOJIS = ['❤️', '👍', '🌟'] as const;

interface ActivityState {
  reactions: Record<string, Record<string, number>>;
  isLoaded: boolean;

  loadData: () => Promise<void>;
  sendCheer: (logId: string, emoji: string) => Promise<void>;
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  reactions: {},
  isLoaded: false,

  loadData: async () => {
    const saved = await safeStorage.getItem<Record<string, Record<string, number>>>(
      StorageKeys.REACTIONS,
      {}
    );
    set({ reactions: saved, isLoaded: true });
  },

  sendCheer: async (logId, emoji) => {
    const current = get().reactions[logId] || {};
    const updated = {
      ...get().reactions,
      [logId]: { ...current, [emoji]: (current[emoji] || 0) + 1 },
    };
    set({ reactions: updated });
    await safeStorage.setItem(StorageKeys.REACTIONS, updated);
    await audioHapticsService.triggerSuccessFeedback();
  },
}));
