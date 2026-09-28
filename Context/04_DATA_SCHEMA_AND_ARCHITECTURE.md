# 04 — Data Schema & Project Architecture

## 1. Domain Entities & TypeScript Models

### A. Medicine Definition (`src/types/medicine.ts`)
```typescript
export type DosageUnit = 'mg' | 'mcg' | 'ml' | 'tablets' | 'capsules' | 'drops' | 'puffs' | 'units' | 'IU';

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
export type VibrationPattern = 'light' | 'medium' | 'heavy';

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
  photoUri?: string; // Local file path or cached image URI
  scheduleTimes: string[]; // Array of "HH:mm" strings, e.g. ["08:00", "20:00"]
  daysOfWeek: number[]; // 0 (Sun) - 6 (Sat)
  reminderSettings: ReminderSettings;
  forMemberId: string; // "self" or specific CareCircleMember.id
  inventoryCount?: number; // Remaining doses left in supply
  refillThreshold?: number; // Low-supply alert triggers at or below this count
  pharmacyPhone?: string; // Optional; enables one-tap refill call
  notificationIds?: string[]; // IDs registered with expo-notifications
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}
```

### B. Care Circle Models (`src/types/careCircle.ts`)
```typescript
export type MemberRelation = 'Self' | 'Parent' | 'Child' | 'Spouse' | 'Grandparent' | 'Friend' | 'Other';

export interface CareCircleMember {
  id: string;
  name: string;
  relation: MemberRelation;
  avatarColor: string;
  avatarUri?: string;
  isOwner: boolean;
  joinedAt: string;
}

export interface CareCircle {
  id: string;
  name: string;
  inviteCode: string; // Encrypted or formatted token for QR Code
  createdById: string;
  members: CareCircleMember[];
  createdAt: string;
}
```

### C. Medication Logs & User Profile (`src/types/log.ts` & `src/types/user.ts`)
```typescript
export type DoseStatus = 'taken' | 'skipped' | 'snoozed';

/** UI-facing status: logged statuses plus computed 'pending' | 'missed'. */
export type DoseDisplayStatus = DoseStatus | 'pending' | 'missed';

export interface MedicationLog {
  id: string;
  medicineId: string;
  memberId: string;
  scheduledTime: string; // Local timestamp "YYYY-MM-DDTHH:mm:00"
  actionTime: string; // ISO date string when button was pressed
  status: DoseStatus;
  notes?: string;
}

export interface DailyAdherenceSummary {
  date: string; // YYYY-MM-DD (local)
  totalDue: number;
  taken: number;
  skipped: number;
  snoozed: number;
  missed: number;
  percentage: number;
}

export interface UserProfile {
  id: string;
  name: string;
  avatarUri?: string;
  emergencyContact?: string;
  allergies: string[];
  defaultReminderSettings: ReminderSettings;
}
```

### D. Derived Adherence & Inventory APIs (`useMedicineStore`)

Derived values are computed in the store (never persisted redundantly):

- `MISSED_DOSE_GRACE_MINUTES = 60` — an unlogged dose becomes `missed` this long after its scheduled time.
- `DEFAULT_REFILL_THRESHOLD = 3` — fallback alert threshold when inventory tracking is on.
- `toLocalDateStr(date)` — timezone-safe `YYYY-MM-DD` helper used for all lookups.
- `getDosesForDate(date)` / `getTodayDoses()` — scheduled doses for a day with computed status (`pending` / `missed` / logged status), excluding days before a medicine was created.
- `getAdherenceForDate(date)` / `getTodayAdherence()` — taken/skipped/snoozed/missed counts + percentage.
- `getDoseHistory(days = 35)` — chronological `DailyAdherenceSummary[]` powering the History calendar.
- `getLowSupplyMedicines()` — medicines at or below their refill threshold.
- `logDose(...)` — writes the log **and** adjusts `inventoryCount` exactly once per taken/un-taken transition, firing `notificationService.notifyLowSupply` when crossing the threshold.
- Theme preference (`system` / `light` / `dark`) is persisted under `StorageKeys.THEME_PREF` by `src/theme/ThemeProvider.tsx`.

---

## 2. Directory & Component Architecture

```
sep29hackpractice/
├── Context/                         # Persistent Context Hub (MANDATORY UPDATE ON EVERY CHANGE)
│   ├── README.md
│   ├── 01_APP_OVERVIEW.md
│   ├── 02_TECH_STACK_AND_FRAMEWORK.md
│   ├── 03_SECTIONS_AND_FEATURES.md
│   ├── 04_DATA_SCHEMA_AND_ARCHITECTURE.md
│   └── 05_UPDATE_RULES_AND_MAINTENANCE.md
├── src/
│   ├── app/                         # Expo Router File-Based Navigation
│   │   ├── _layout.tsx              # Root Provider (Zustand hydration, Theme, Toast)
│   │   ├── (tabs)/                  # 4 Tab Navigation Group
│   │   │   ├── _layout.tsx          # Tab bar layout & icons
│   │   │   ├── index.tsx            # 1. Dashboard Tab
│   │   │   ├── medicines.tsx        # 2. Medicine Section Tab
│   │   │   ├── care-circle.tsx      # 3. Care Circle Tab
│   │   │   └── profile.tsx          # 4. Profile Tab
│   │   ├── medicine/
│   │   │   ├── add.tsx              # Add Medicine Screen (Modal)
│   │   │   └── [id].tsx             # Medicine Details / Edit Screen
│   │   ├── care-circle/
│   │   │   ├── create.tsx           # Create Circle & View QR Code Modal
│   │   │   ├── scan.tsx             # QR Camera Scanner Screen
│   │   │   └── add-member-med.tsx   # Add Medicine for Care Circle Member
│   │   ├── history.tsx              # Adherence Calendar & History Audit (stack screen)
│   │   └── +not-found.tsx
│   ├── components/
│   │   ├── common/                  # Buttons, Headers, Inputs, EmptyStates
│   │   ├── dashboard/               # TodayTimeline, DoseCard, AdherenceCard
│   │   ├── medicine/                # FormPicker, DosageSelector, PhotoUpload, AlarmConfig
│   │   └── care-circle/             # QRCodeCard, QRScannerView, MemberRoster
│   ├── constants/
│   │   ├── colors.ts                # Strict Health Palette (Teal, Slate, Emerald)
│   │   └── defaultData.ts           # Initial demo data for seamless onboarding
│   ├── services/
│   │   ├── notifications.ts         # Expo Notifications scheduler & snooze logic
│   │   ├── audioHaptics.ts          # Expo AV sound triggers & Expo Haptics patterns
│   │   ├── report.ts                # Clinical PDF doctor-report builder & share
│   │   ├── camera.ts                # ImagePicker launcher & storage manager
│   │   └── storage.ts               # AsyncStorage engine
│   ├── theme/
│   │   └── ThemeProvider.tsx        # system/light/dark provider + useThemedStyles hook
│   ├── store/
│   │   ├── medicineStore.ts         # Zustand store for medicines and logs
│   │   ├── careCircleStore.ts       # Zustand store for circles and members
│   │   └── userStore.ts             # Zustand store for user info and settings
│   └── types/
│       ├── medicine.ts
│       ├── careCircle.ts
│       └── user.ts
├── app.json                         # Expo configuration (permissions, plugins, icons)
├── package.json
└── tsconfig.json
```

---

## 3. Alarm & Notification Flow

```
[User Adds/Edits Medicine]
          │
          ▼
[Save to Zustand Store & AsyncStorage]
          │
          ▼
[Notification Service: notifications.ts]
  ├── Cancel prior notifications for this medicine (if editing)
  ├── Calculate daily trigger times for specified daysOfWeek
  └── Register expo-notifications triggers:
        - Title: "Time to take {Medicine Name}"
        - Body: "{Dosage}{Unit} - {Instruction}"
        - Sound: {Selected Sound}
        - Category: "MEDICATION_REMINDER" (Action buttons: "Take", "Snooze")
          │
          ▼
[Alarm Fires on Device]
  ├── Trigger Expo Haptics (Heavy / Warning pattern)
  ├── Play Custom Audio (expo-av)
  └── User Actions:
        ├── "Take"   → Mark MedicationLog as 'taken', update Dashboard streak
        └── "Snooze" → Schedule one-off alarm in {snoozeMinutes} mins
```
