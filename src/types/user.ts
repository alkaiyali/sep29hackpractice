import { ReminderSettings } from './medicine';

export interface UserProfile {
  id: string;
  name: string;
  avatarUri?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  allergies: string[];
  bloodType?: string;
  defaultReminderSettings: ReminderSettings;
  notificationsEnabled: boolean;
}
