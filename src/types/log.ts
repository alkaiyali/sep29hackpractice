export type DoseStatus = 'taken' | 'skipped' | 'snoozed';

/** Status shown in the UI: logged statuses plus computed ones. */
export type DoseDisplayStatus = DoseStatus | 'pending' | 'missed';

export interface MedicationLog {
  id: string;
  medicineId: string;
  memberId: string; // "self" or CareCircleMember.id
  scheduledTime: string; // e.g. "2026-09-28T08:00:00"
  actionTime: string; // ISO timestamp when action was taken
  status: DoseStatus;
  notes?: string;
}

export interface DailyAdherenceSummary {
  date: string; // YYYY-MM-DD
  totalDue: number;
  taken: number;
  skipped: number;
  snoozed: number;
  missed: number;
  percentage: number;
}
