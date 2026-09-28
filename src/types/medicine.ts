export type DosageUnit =
  | 'mg'
  | 'mcg'
  | 'ml'
  | 'tablets'
  | 'capsules'
  | 'drops'
  | 'puffs'
  | 'units'
  | 'IU';

export type MedicineForm =
  | 'pill'
  | 'capsule'
  | 'liquid'
  | 'injection'
  | 'inhaler'
  | 'drops'
  | 'topical';

export type MedicineInstruction =
  | 'before_meal'
  | 'with_meal'
  | 'after_meal'
  | 'empty_stomach'
  | 'before_bed'
  | 'anytime';

export type AlertSound = 'default' | 'gentle' | 'bell' | 'radar' | 'medical_pulse';

export type VibrationPattern = 'light' | 'medium' | 'heavy' | 'off';

export interface ReminderSettings {
  soundEnabled: boolean;
  soundName: AlertSound;
  vibrationEnabled: boolean;
  vibrationPattern: VibrationPattern;
  snoozeMinutes: number; // e.g. 5, 10, 15, 30
}

export interface Medicine {
  id: string;
  name: string;
  dosage: number;
  dosageUnit: DosageUnit;
  form: MedicineForm;
  instruction: MedicineInstruction;
  optionalNotes?: string;
  photoUri?: string;
  scheduleTimes: string[]; // ["HH:mm"], e.g. ["08:00", "20:00"]
  daysOfWeek: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  reminderSettings: ReminderSettings;
  forMemberId: string; // "self" or CareCircleMember.id
  notificationIds?: string[];
  createdAt: string;
  updatedAt: string;
}
