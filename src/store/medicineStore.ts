import { create } from 'zustand';
import { Medicine } from '../types/medicine';
import { MedicationLog, DailyAdherenceSummary, DoseDisplayStatus, DoseStatus } from '../types/log';
import { safeStorage, StorageKeys } from '../services/storage';
import { notificationService } from '../services/notifications';
import { audioHapticsService } from '../services/audioHaptics';
import { INITIAL_MEDICINES } from '../constants/defaultData';

/** A scheduled dose is considered missed this long after its time if never logged. */
export const MISSED_DOSE_GRACE_MINUTES = 60;

/** Fallback low-supply threshold when a medicine tracks inventory but has none set. */
export const DEFAULT_REFILL_THRESHOLD = 3;

export interface TodayDoseItem {
  id: string; // log id or virtual dose id
  medicine: Medicine;
  timeStr: string; // "08:00"
  status: DoseDisplayStatus;
  logId?: string;
  actionTime?: string;
}

/** Local-time YYYY-MM-DD (safe across timezones, unlike toISOString). */
export function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface MedicineState {
  medicines: Medicine[];
  logs: MedicationLog[];
  isLoaded: boolean;

  loadData: () => Promise<void>;
  addMedicine: (medicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt' | 'notificationIds'>) => Promise<Medicine>;
  updateMedicine: (id: string, updates: Partial<Medicine>) => Promise<void>;
  deleteMedicine: (id: string) => Promise<void>;
  logDose: (medicineId: string, memberId: string, timeStr: string, status: DoseStatus, notes?: string) => Promise<void>;
  getDosesForDate: (date: Date) => TodayDoseItem[];
  getTodayDoses: () => TodayDoseItem[];
  getAdherenceForDate: (date: Date) => DailyAdherenceSummary;
  getTodayAdherence: () => DailyAdherenceSummary;
  getDoseHistory: (days?: number) => DailyAdherenceSummary[];
  getLowSupplyMedicines: () => Medicine[];
  getStreakDays: () => number;
}

export const useMedicineStore = create<MedicineState>((set, get) => ({
  medicines: [],
  logs: [],
  isLoaded: false,

  loadData: async () => {
    const savedMeds = await safeStorage.getItem<Medicine[]>(StorageKeys.MEDICINES, INITIAL_MEDICINES);
    const savedLogs = await safeStorage.getItem<MedicationLog[]>(StorageKeys.LOGS, []);
    set({ medicines: savedMeds, logs: savedLogs, isLoaded: true });
  },

  addMedicine: async (medicineData) => {
    const id = `med_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const newMedicine: Medicine = {
      ...medicineData,
      id,
      createdAt: nowIso,
      updatedAt: nowIso,
      notificationIds: [],
    };

    // Schedule local notification alarms
    const notificationIds = await notificationService.scheduleMedicineAlarms(newMedicine);
    newMedicine.notificationIds = notificationIds;

    const updated = [newMedicine, ...get().medicines];
    set({ medicines: updated });
    await safeStorage.setItem(StorageKeys.MEDICINES, updated);
    await audioHapticsService.triggerSuccessFeedback();

    return newMedicine;
  },

  updateMedicine: async (id, updates) => {
    const current = get().medicines;
    const target = current.find((m) => m.id === id);
    if (!target) return;

    const updatedMed: Medicine = {
      ...target,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Reschedule alarms
    const notificationIds = await notificationService.scheduleMedicineAlarms(updatedMed);
    updatedMed.notificationIds = notificationIds;

    const updatedList = current.map((m) => (m.id === id ? updatedMed : m));
    set({ medicines: updatedList });
    await safeStorage.setItem(StorageKeys.MEDICINES, updatedList);
    await audioHapticsService.triggerSuccessFeedback();
  },

  deleteMedicine: async (id) => {
    const current = get().medicines;
    const target = current.find((m) => m.id === id);
    if (target) {
      // Cancel notifications
      await notificationService.scheduleMedicineAlarms({ ...target, scheduleTimes: [] });
    }

    const updated = current.filter((m) => m.id !== id);
    set({ medicines: updated });
    await safeStorage.setItem(StorageKeys.MEDICINES, updated);
  },

  logDose: async (medicineId, memberId, timeStr, status, notes) => {
    const now = new Date();
    const todayDateStr = toLocalDateStr(now);
    const scheduledTime = `${todayDateStr}T${timeStr}:00`;

    const medicine = get().medicines.find((m) => m.id === medicineId);

    // Provide haptic feedback
    if (status === 'taken') {
      await audioHapticsService.triggerSuccessFeedback();
    } else if (status === 'snoozed') {
      await audioHapticsService.triggerWarningFeedback();
      if (medicine) {
        await notificationService.scheduleSnoozeAlarm(
          medicine,
          medicine.reminderSettings.snoozeMinutes || 10
        );
      }
    }

    const existingLogs = get().logs;
    // Check if a log already exists for this exact dose today
    const existingIndex = existingLogs.findIndex(
      (l) => l.medicineId === medicineId && l.scheduledTime === scheduledTime
    );

    let updatedLogs: MedicationLog[];
    if (existingIndex >= 0) {
      updatedLogs = [...existingLogs];
      updatedLogs[existingIndex] = {
        ...updatedLogs[existingIndex],
        status,
        actionTime: now.toISOString(),
        notes,
      };
    } else {
      const newLog: MedicationLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        medicineId,
        memberId,
        scheduledTime,
        actionTime: now.toISOString(),
        status,
        notes,
      };
      updatedLogs = [newLog, ...existingLogs];
    }

    // Inventory: decrement on first "taken", restore if un-taken.
    const previousStatus = existingIndex >= 0 ? existingLogs[existingIndex].status : undefined;
    const becameTaken = status === 'taken' && previousStatus !== 'taken';
    const unTaken = status !== 'taken' && previousStatus === 'taken';

    set({ logs: updatedLogs });
    await safeStorage.setItem(StorageKeys.LOGS, updatedLogs);

    if (medicine && (becameTaken || unTaken) && medicine.inventoryCount != null) {
      const delta = becameTaken ? -1 : 1;
      const prevCount = medicine.inventoryCount;
      const newCount = Math.max(0, prevCount + delta);
      const threshold = medicine.refillThreshold ?? DEFAULT_REFILL_THRESHOLD;
      const updatedMedicines = get().medicines.map((m) =>
        m.id === medicineId ? { ...m, inventoryCount: newCount } : m
      );
      set({ medicines: updatedMedicines });
      await safeStorage.setItem(StorageKeys.MEDICINES, updatedMedicines);

      // Crossing into low supply → alert once per crossing
      if (delta === -1 && newCount <= threshold && prevCount > threshold) {
        await notificationService.notifyLowSupply({ ...medicine, inventoryCount: newCount }, newCount);
      }
    }
  },

  getDosesForDate: (date) => {
    const dateStr = toLocalDateStr(date);
    const weekday = date.getDay(); // 0=Sun, ..., 6=Sat
    const { medicines, logs } = get();
    const now = Date.now();
    const graceMs = MISSED_DOSE_GRACE_MINUTES * 60 * 1000;

    const items: TodayDoseItem[] = [];

    medicines.forEach((med) => {
      // Don't project medicines into days before they were created
      if (toLocalDateStr(new Date(med.createdAt)) > dateStr) return;

      // Check if scheduled for this weekday
      if (!med.daysOfWeek.includes(weekday)) return;

      med.scheduleTimes.forEach((timeStr) => {
        // Look up corresponding log (exact scheduled timestamp match)
        const log = logs.find(
          (l) =>
            l.medicineId === med.id &&
            l.scheduledTime === `${dateStr}T${timeStr}:00`
        );

        let status: DoseDisplayStatus = log ? log.status : 'pending';
        if (!log) {
          const scheduledMs = new Date(`${dateStr}T${timeStr}:00`).getTime();
          if (now > scheduledMs + graceMs) status = 'missed';
        }

        items.push({
          id: `${med.id}_${timeStr}`,
          medicine: med,
          timeStr,
          status,
          logId: log?.id,
          actionTime: log?.actionTime,
        });
      });
    });

    // Sort items chronologically by timeStr ("08:00", "12:00", "20:00")
    items.sort((a, b) => a.timeStr.localeCompare(b.timeStr));

    return items;
  },

  getTodayDoses: () => get().getDosesForDate(new Date()),

  getAdherenceForDate: (date) => {
    const doses = get().getDosesForDate(date);

    const totalDue = doses.length;
    const taken = doses.filter((d) => d.status === 'taken').length;
    const skipped = doses.filter((d) => d.status === 'skipped').length;
    const snoozed = doses.filter((d) => d.status === 'snoozed').length;
    const missed = doses.filter((d) => d.status === 'missed').length;

    const percentage = totalDue > 0 ? Math.round((taken / totalDue) * 100) : 100;

    return {
      date: toLocalDateStr(date),
      totalDue,
      taken,
      skipped,
      snoozed,
      missed,
      percentage,
    };
  },

  getTodayAdherence: () => get().getAdherenceForDate(new Date()),

  getDoseHistory: (days = 35) => {
    const out: DailyAdherenceSummary[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      out.push(get().getAdherenceForDate(d));
    }
    return out;
  },

  getLowSupplyMedicines: () => {
    return get().medicines.filter(
      (m) =>
        m.inventoryCount != null &&
        m.inventoryCount <= (m.refillThreshold ?? DEFAULT_REFILL_THRESHOLD)
    );
  },

  getStreakDays: () => {
    const logs = get().logs;
    if (logs.length === 0) return 0;
    const takenLogs = logs.filter((l) => l.status === 'taken');
    if (takenLogs.length === 0) return 0;

    // Count unique days where at least one dose was taken
    const uniqueDays = new Set(takenLogs.map((l) => l.scheduledTime.split('T')[0]));
    return uniqueDays.size;
  },
}));
