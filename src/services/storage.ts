import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  MEDICINES: '@meddy_medicines_v1',
  LOGS: '@meddy_dose_logs_v1',
  CARE_CIRCLES: '@meddy_care_circles_v1',
  ACTIVE_CIRCLE_ID: '@meddy_active_circle_id_v1',
  USER_PROFILE: '@meddy_user_profile_v1',
};

export const safeStorage = {
  async getItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const data = await AsyncStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch (err) {
      console.warn(`[safeStorage] Error getting ${key}:`, err);
      return defaultValue;
    }
  },

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`[safeStorage] Error setting ${key}:`, err);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (err) {
      console.warn(`[safeStorage] Error removing ${key}:`, err);
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (err) {
      console.warn('[safeStorage] Error clearing storage:', err);
    }
  },
};
