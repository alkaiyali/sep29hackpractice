export interface VitalLog {
  id: string;
  medicineId?: string; // linked dose, if captured right after taking
  memberId: string; // "user_self" or CareCircleMember.id
  date: string; // YYYY-MM-DD (local)
  systolic?: number; // mmHg
  diastolic?: number; // mmHg
  glucose?: number; // mg/dL
  createdAt: string; // ISO timestamp
}

export interface VitalsInput {
  systolic?: number;
  diastolic?: number;
  glucose?: number;
}

export function isValidVitals(input: VitalsInput): string | null {
  const { systolic, diastolic, glucose } = input;
  if (systolic == null && diastolic == null && glucose == null) {
    return 'Enter at least one reading.';
  }
  if (systolic != null && (isNaN(systolic) || systolic < 70 || systolic > 300)) {
    return 'Systolic should be between 70 and 300.';
  }
  if (diastolic != null && (isNaN(diastolic) || diastolic < 40 || diastolic > 200)) {
    return 'Diastolic should be between 40 and 200.';
  }
  if (systolic != null && diastolic != null && systolic <= diastolic) {
    return 'Systolic should be higher than diastolic.';
  }
  if (glucose != null && (isNaN(glucose) || glucose < 20 || glucose > 1000)) {
    return 'Glucose should be between 20 and 1000 mg/dL.';
  }
  return null;
}
