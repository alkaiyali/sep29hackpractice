import { create } from 'zustand';
import { UserProfile } from '../types/user';
import { safeStorage, StorageKeys } from '../services/storage';
import { INITIAL_USER } from '../constants/defaultData';
import { notificationService } from '../services/notifications';

interface UserState {
  profile: UserProfile;
  isLoaded: boolean;

  loadData: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  toggleNotifications: (enabled: boolean) => Promise<void>;
  resetAllData: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: INITIAL_USER,
  isLoaded: false,

  loadData: async () => {
    let saved = await safeStorage.getItem<UserProfile>(StorageKeys.USER_PROFILE, INITIAL_USER);
    if (saved.name === 'Alex Rivera') {
      saved = INITIAL_USER;
      await safeStorage.setItem(StorageKeys.USER_PROFILE, INITIAL_USER);
    }
    set({ profile: saved, isLoaded: true });
  },

  updateProfile: async (updates) => {
    const updated = { ...get().profile, ...updates };
    set({ profile: updated });
    await safeStorage.setItem(StorageKeys.USER_PROFILE, updated);
  },

  toggleNotifications: async (enabled) => {
    if (enabled) {
      await notificationService.requestPermissions();
    }
    const updated = { ...get().profile, notificationsEnabled: enabled };
    set({ profile: updated });
    await safeStorage.setItem(StorageKeys.USER_PROFILE, updated);
  },

  resetAllData: async () => {
    await safeStorage.clearAll();
    set({ profile: INITIAL_USER });
  },
}));
