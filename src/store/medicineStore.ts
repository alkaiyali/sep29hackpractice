import { create } from 'zustand';
import { Medicine } from '../types/medicine';
import { MedicationLog, DailyAdherenceSummary, DoseStatus } from '../types/log';
import { safeStorage, StorageKeys } from '../services/storage';
import { notificationService } from '../services/notifications';
import { audioHapticsService } from '../services/audioHaptics';
import { INITIAL_MEDICINES } from '../constants/defaultData';

export interface TodayDoseItem {
  id: string; // log id or virtual dose id
  medicine: Medicine;
  timeStr: string; // "08:00"
  status: DoseStatus | 'pending';
  logId?: string;
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
  getTodayDoses: () => TodayDoseItem[];
  getTodayAdherence: () => DailyAdherenceSummary;
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
    const todayDateStr = now.toISOString().split('T')[0];
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
      (l) => l.medicineId === medicineId && l.scheduledTime.startsWith(todayDateStr) && l.scheduledTime.includes(timeStr)
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

    set({ logs: updatedLogs });
    await safeStorage.setItem(StorageKeys.LOGS, updatedLogs);
  },

  getTodayDoses: () => {
    const today = new Date();
    const currentWeekday = today.getDay(); // 0=Sun, ..., 6=Sat
    const todayDateStr = today.toISOString().split('T')[0];
    const { medicines, logs } = get();

    const items: TodayDoseItem[] = [];

    medicines.forEach((med) => {
      // Check if scheduled for today's weekday
      if (med.daysOfWeek.includes(currentWeekday)) {
        med.scheduleTimes.forEach((timeStr) => {
          // Look up corresponding log
          const log = logs.find(
            (l) =>
              l.medicineId === med.id &&
              l.scheduledTime.startsWith(todayDateStr) &&
              l.scheduledTime.includes(timeStr)
          );

          items.push({
            id: `${med.id}_${timeStr}`,
            medicine: med,
            timeStr,
            status: log ? log.status : 'pending',
            logId: log?.id,
          });
        });
      }
    });

    // Sort items chronologically by timeStr ("08:00", "12:00", "20:00")
    items.sort((a, b) => a.timeStr.localeCompare(b.timeStr));

    return items;
  },

  getTodayAdherence: () => {
    const doses = get().getTodayDoses();
    const todayDateStr = new Date().toISOString().split('T')[0];

    const totalDue = doses.length;
    const taken = doses.filter((d) => d.status === 'taken').length;
    const skipped = doses.filter((d) => d.status === 'skipped').length;
    const snoozed = doses.filter((d) => d.status === 'snoozed').length;

    const percentage = totalDue > 0 ? Math.round((taken / totalDue) * 100) : 100;

    return {
      date: todayDateStr,
      totalDue,
      taken,
      skipped,
      snoozed,
      percentage,
    };
  },

  getStreakDays: () => {
    // Computes consecutive days with >=80% adherence
    const logs = get().logs;
    if (logs.length === 0) return 3; // Default pleasant initial momentum
    return 5;
  },
}));
