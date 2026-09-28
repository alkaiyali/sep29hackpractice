import { create } from 'zustand';
import { VitalLog } from '../types/vitals';
import { safeStorage, StorageKeys } from '../services/storage';
import { toLocalDateStr } from './medicineStore';

interface VitalsState {
  vitals: VitalLog[];
  isLoaded: boolean;

  loadData: () => Promise<void>;
  addVital: (
    input: { systolic?: number; diastolic?: number; glucose?: number },
    memberId?: string,
    medicineId?: string
  ) => Promise<VitalLog | null>;
  getRecentVitals: (limit?: number) => VitalLog[];
}

export const useVitalsStore = create<VitalsState>((set, get) => ({
  vitals: [],
  isLoaded: false,

  loadData: async () => {
    const saved = await safeStorage.getItem<VitalLog[]>(StorageKeys.VITALS, []);
    set({ vitals: saved, isLoaded: true });
  },

  addVital: async (input, memberId = 'user_self', medicineId) => {
    const hasData =
      input.systolic != null || input.diastolic != null || input.glucose != null;
    if (!hasData) return null;

    const now = new Date();
    const entry: VitalLog = {
      id: `vital_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      medicineId,
      memberId,
      date: toLocalDateStr(now),
      systolic: input.systolic,
      diastolic: input.diastolic,
      glucose: input.glucose,
      createdAt: now.toISOString(),
    };

    const updated = [entry, ...get().vitals].slice(0, 500);
    set({ vitals: updated });
    await safeStorage.setItem(StorageKeys.VITALS, updated);
    return entry;
  },

  getRecentVitals: (limit = 7) => get().vitals.slice(0, limit),
}));
