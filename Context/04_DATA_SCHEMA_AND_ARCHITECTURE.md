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
export type MemberRelation = 'Self' | 'Parent' | 'Child' | 'Spouse' | 'Grandparent' | 'Sibling' | 'Friend' | 'Caregiver' | 'Other';

export interface CareCircleMember {
  id: string;
  uid?: string; // Firebase uid for members joined from their own device
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
  inviteCode: string; // Invite token encoded in the QR payload
  createdById: string;
  members: CareCircleMember[];
  createdAt: string;
}

/** Cloud link health surfaced in the Care Circle UI. */
export type CircleSyncStatus = 'local' | 'connecting' | 'online' | 'error';

/** One logged dose mirrored through Firestore (deterministic id → idempotent). */
export interface CircleDoseEvent {
  id: string;
  circleId: string;
  medicineId: string;
  medicineName: string;
  memberId: string; // canonical: uid for device members, generated id otherwise
  memberName: string;
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:mm
  status: 'taken' | 'skipped' | 'snoozed';
  actionTime: string; // ISO timestamp of the action
  actorUid?: string;
  actorName?: string;
  cheers?: Record<string, string>; // uid → emoji (one cheer per member)
}
```

> **Cloud mirror (optional).** `useCareCircleStore` also holds `syncStatus`, `myUid`, and `circleFeed` (`CircleDoseEvent[]`), and exposes `initSync`, `publishDoseEvent`, `retractDoseEvent`, `sendRemoteCheer`. When `EXPO_PUBLIC_FIREBASE_*` keys are absent these are no-ops and the app stays local. Firestore layout + rules: `Context/07_FIREBASE_BACKEND_SETUP.md`.

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
  percentage: number; // 0 when nothing is due (empty days are neutral, never 100%)
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

### E. Vitals, Reactions & Escalation State

```typescript
export interface VitalLog {
  id: string;
  medicineId?: string; // linked dose, if captured right after taking
  memberId: string;
  date: string; // YYYY-MM-DD (local)
  systolic?: number; // mmHg
  diastolic?: number; // mmHg
  glucose?: number; // mg/dL
  createdAt: string; // ISO timestamp
}
```

- `useVitalsStore` (`src/store/vitalsStore.ts`): offline log capped at 500 entries, `StorageKeys.VITALS`.
- `useActivityStore` (`src/store/activityStore.ts`): `{ [logId]: { [emoji]: count } }` cheers, `StorageKeys.REACTIONS`.
- Escalation dedupe: alerted `YYYY-MM-DD|medicineId|timeStr` keys, `StorageKeys.ESCALATION_ALERTS` (last 200).

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
│   │   │   ├── add.tsx              # Add Medicine Screen (Modal, + OCR prefill via params)
│   │   │   ├── scan-label.tsx       # Prescription Label OCR Scanner (Modal)
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
│   │   ├── notifications.ts         # Expo Notifications scheduler, snooze, refill + escalation alerts
│   │   ├── audioHaptics.ts          # Bundled WAV chimes (assets/sounds) + Haptics patterns
│   │   ├── precautions.ts           # Food/beverage/timing precaution rules
│   │   ├── interactions.ts          # Drug-drug interaction pair rules
│   │   ├── labelOcr.ts              # OCR.space label extraction + sig parser
│   │   ├── report.ts                # Clinical PDF doctor-report builder & share
│   │   ├── camera.ts                # ImagePicker launcher & storage manager
│   │   ├── firebase.ts              # Optional Firebase init (anon auth + Firestore)
│   │   ├── circleSync.ts            # Firestore transport for circles/doses/cheers
│   │   └── storage.ts               # AsyncStorage engine
│   ├── theme/
│   │   └── ThemeProvider.tsx        # system/light/dark provider + useThemedStyles hook
│   ├── store/
│   │   ├── medicineStore.ts         # Zustand store for medicines and logs
│   │   ├── vitalsStore.ts           # Zustand store for BP/glucose logs
│   │   ├── activityStore.ts         # Zustand store for circle cheers
│   │   ├── careCircleStore.ts       # Zustand store for circles, members + cloud sync
│   │   └── userStore.ts             # Zustand store for user info and settings
│   └── types/
│       ├── medicine.ts
│       ├── careCircle.ts
│       └── user.ts
├── firebase/
│   ├── firebase.json                # Firestore rules deploy target
│   └── firestore.rules              # Membership-gated security rules
├── .env.example                     # Template for EXPO_PUBLIC_FIREBASE_* keys
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
