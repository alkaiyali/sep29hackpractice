import { Medicine } from '../types/medicine';
import { CareCircle } from '../types/careCircle';
import { UserProfile } from '../types/user';

export const INITIAL_USER: UserProfile = {
  id: 'user_self',
  name: '',
  allergies: [],
  notificationsEnabled: true,
  defaultReminderSettings: {
    soundEnabled: true,
    soundName: 'default',
    vibrationEnabled: true,
    vibrationPattern: 'medium',
    snoozeMinutes: 10,
  },
};

export const INITIAL_CARE_CIRCLE: CareCircle | null = null;

export const INITIAL_MEDICINES: Medicine[] = [];
