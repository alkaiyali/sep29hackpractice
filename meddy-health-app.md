# Implementation Plan — Meddy (React Native Expo SDK 54)

Comprehensive engineering and implementation plan for **Meddy**, a health check and medicine tracking mobile app built with React Native and Expo SDK 54 for personal medication adherence and Care Circle family coordination.

---

## 🎯 Goal Description
Build **Meddy**, an intuitive and reliable mobile application for tracking medications for oneself and loved ones. The application features 4 core sections:
1. **Dashboard**: Daily timeline of due medicines, quick Take/Snooze/Skip interactions, adherence health streak, and Care Circle status summary.
2. **Medicine Section**: Complete medication management featuring an Add/Edit modal supporting:
   - Medicine name, dosage and dosage unit (mg, ml, drops, etc.)
   - Medicine form (tablet, capsule, liquid, injection, inhaler, drops, topical)
   - Instructions (before meal, after meal, with food, empty stomach, etc.)
   - Optional notes
   - Photo attachment (Camera capture or Gallery selection)
   - Alarm scheduling with reminder configurations (Sound, Vibration, Snooze interval)
3. **Care Circle**: Family/caregiver coordination hub enabling users to:
   - Create a Care Circle and generate an on-screen QR Code
   - Join an existing Care Circle by scanning a QR Code using the device camera
   - View circle members and assign/track medicine reminders for loved ones
4. **Profile**: User health details, emergency contact, notification diagnostics, and data export/reset.

In addition, establish and maintain a persistent **`Context/`** documentation repository that is updated on every app modification.

---

## ⚠️ User Review Required

> [!IMPORTANT]
> **Expo SDK 54 & Architecture Strategy**
> - **Navigation**: Expo Router (file-based navigation with `(tabs)` and modal stacks) for native-feel transitions.
> - **State & Persistence**: Offline-first Zustand stores backed by `@react-native-async-storage/async-storage` for instantaneous load times and zero network friction.
> - **Notifications & Alarms**: `expo-notifications` with local scheduling, categories with interactive actions (**"Take"** and **"Snooze"**), backed by `expo-av` for audio alerts and `expo-haptics` for tactile feedback.
> - **Hardware Permissions**: Graceful fallback UI for Camera and Notification permissions.
> - **Strict Palette**: Clean, medical-grade styling using Teal (`#0D9488`), Slate (`#0F172A`), and Emerald (`#059669`). Free from generic violet/purple slop.

---

## ❓ Open Questions

> [!NOTE]
> 1. **Initial Seed Data**: Would you like Meddy to start with sample demonstration data (e.g. 2 scheduled daily medicines and 1 pre-configured Care Circle member like *"Mom"*) so the app can be immediately experienced on first launch?
> 2. **Audio Alerts**: For custom alarm sounds, would you prefer standard system chimes or bundled peaceful tone assets (e.g. gentle chime, bell pulse)?

---

## 📐 Proposed Changes & Architecture

```
sep29hackpractice/
├── Context/                         # ✅ Completed - Mandatory SSOT Documentation
│   ├── README.md
│   ├── 01_APP_OVERVIEW.md
│   ├── 02_TECH_STACK_AND_FRAMEWORK.md
│   ├── 03_SECTIONS_AND_FEATURES.md
│   ├── 04_DATA_SCHEMA_AND_ARCHITECTURE.md
│   └── 05_UPDATE_RULES_AND_MAINTENANCE.md
├── src/
│   ├── app/                         # Expo Router screens
│   │   ├── _layout.tsx              # Root Stack & providers
│   │   ├── (tabs)/                  # 4 Tabs Layout
│   │   │   ├── _layout.tsx          # Tab bar navigation
│   │   │   ├── index.tsx            # [Section 1] Dashboard
│   │   │   ├── medicines.tsx        # [Section 2] Medicine Catalog
│   │   │   ├── care-circle.tsx      # [Section 4] Care Circle Hub
│   │   │   └── profile.tsx          # [Section 3] Profile
│   │   ├── medicine/
│   │   │   ├── add.tsx              # Add / Edit Medicine Modal
│   │   │   └── [id].tsx             # Medicine Details View
│   │   └── care-circle/
│   │       ├── create.tsx           # Create Circle & View QR
│   │       ├── scan.tsx             # QR Code Camera Scanner
│   │       └── add-member-med.tsx   # Assign Medicine to Circle Member
│   ├── components/
│   │   ├── ui/                      # Base buttons, cards, text inputs, badges
│   │   ├── dashboard/               # TodayTimeline, DoseItem, StreakBanner
│   │   ├── medicine/                # FormPicker, DosageInput, PhotoPicker, AlarmSettings
│   │   └── care-circle/             # QRCodeDisplay, QRScannerModal, MemberCard
│   ├── services/
│   │   ├── notifications.ts         # Expo Notifications scheduler & snooze
│   │   ├── audioHaptics.ts          # Expo AV & Expo Haptics triggers
│   │   └── camera.ts                # Expo ImagePicker photo helpers
│   ├── store/
│   │   ├── medicineStore.ts         # Medicines and dose logs
│   │   ├── careCircleStore.ts       # Circles, members, and shared reminders
│   │   └── userStore.ts             # User settings and permissions
│   └── types/
│       ├── medicine.ts              # Data contracts for medicines and alarms
│       ├── careCircle.ts            # Data contracts for Care Circle & QR payloads
│       └── user.ts                  # Data contracts for profile & logs
└── package.json & app.json
```

---

## 📋 Task Breakdown & Execution Order

### Phase 1: Foundation & Project Scaffolding
- **Task 1.1**: Initialize Expo SDK 54 project structure with TypeScript and Expo Router configuration.
- **Task 1.2**: Install required core dependencies (`expo-notifications`, `expo-image-picker`, `expo-camera`, `react-native-qrcode-svg`, `expo-av`, `expo-haptics`, `@react-native-async-storage/async-storage`, `zustand`, `react-native-svg`, `@expo/vector-icons`).
- **Task 1.3**: Configure `app.json` with Camera, Gallery, and Notification permission strings and plugin declarations.
- *Verify*: `npm run start` / Expo config validation completes without errors.

### Phase 2: Domain Types & State Management
- **Task 2.1**: Implement TypeScript definitions in `src/types/` (`medicine.ts`, `careCircle.ts`, `user.ts`).
- **Task 2.2**: Implement `src/store/medicineStore.ts` with full CRUD, dose logging (`taken`, `skipped`, `snoozed`), and AsyncStorage persistence.
- **Task 2.3**: Implement `src/store/careCircleStore.ts` with create circle, QR payload encoder/decoder, join circle, and member medicine tracking.
- **Task 2.4**: Implement `src/store/userStore.ts` for profile info and global reminder defaults.
- *Verify*: Unit test store actions with mock storage to confirm state transitions and persistence.

### Phase 3: Hardware Services (Notifications, Sound, Haptics, Camera)
- **Task 3.1**: Implement `src/services/notifications.ts` to request permissions, register interactive categories ("Take", "Snooze"), and schedule recurring daily alarms.
- **Task 3.2**: Implement `src/services/audioHaptics.ts` with customizable haptic feedback patterns (Light, Medium, Heavy) and alert audio triggers using `expo-av`.
- **Task 3.3**: Implement `src/services/camera.ts` using `expo-image-picker` to support taking photos via camera and selecting from the gallery.
- *Verify*: Simulate alarm scheduling, test notification listener callback, and confirm photo URI generation.

### Phase 4: Tab Navigation & Design System
- **Task 4.1**: Set up `src/app/_layout.tsx` and `src/app/(tabs)/_layout.tsx` with customized bottom navigation icons (Home/Dashboard, Pill/Medicine, Users/Care Circle, User/Profile).
- **Task 4.2**: Build UI primitives in `src/components/ui/` (Button, Card, Badge, TextInput, Header, ModalHeader) using the Meddy health token system.
- *Verify*: Smooth navigation across all 4 tab destinations.

### Phase 5: Section 1 — Dashboard
- **Task 5.1**: Build `TodayTimeline` showing chronological medication cards (Morning, Afternoon, Evening, Bedtime).
- **Task 5.2**: Implement inline action buttons (**Take**, **Snooze**, **Skip**) with immediate visual feedback, haptics, and log recording.
- **Task 5.3**: Build `AdherenceCard` (daily progress percentage & streak counter).
- **Task 5.4**: Build `CareCircleSummary` card displaying active circle members and overdue indicators for loved ones.
- *Verify*: Mark medicine taken; verify adherence percentage increases and streak updates.

### Phase 6: Section 2 — Medicine Section & Add/Edit Flow
- **Task 6.1**: Build `src/app/(tabs)/medicines.tsx` listing all active medicines grouped by member or schedule.
- **Task 6.2**: Build `src/app/medicine/add.tsx` form modal:
  - Medicine Name input
  - Dosage value and Dosage Unit picker (`mg`, `ml`, `tablets`, etc.)
  - Medicine Form selector (visual grid: Pill, Capsule, Liquid, Inhaler, Drops, etc.)
  - Instruction selector (Before meal, With meal, After meal, Empty stomach, etc.)
  - Optional Notes field
  - Photo attachment component (Choose Camera or Gallery)
  - Alarm Scheduler: multi-time picker, frequency selector
  - Reminder Settings: Sound toggle + sound picker, Vibration toggle + pattern picker, Snooze duration (5m, 10m, 15m, 30m)
- **Task 6.3**: Wire form submission to `medicineStore` and automatically register notification triggers in `notifications.ts`.
- *Verify*: Add medicine with photo and alarm; confirm it appears on Dashboard and in Medicine catalog.

### Phase 7: Section 4 — Care Circle & QR Integration
- **Task 7.1**: Build `src/app/(tabs)/care-circle.tsx` displaying circle roster, member cards, and assigned loved-one medicines.
- **Task 7.2**: Build `src/app/care-circle/create.tsx` modal: generate Care Circle name, encode invite payload, and render QR Code via `react-native-qrcode-svg`.
- **Task 7.3**: Build `src/app/care-circle/scan.tsx` screen: activate `expo-camera` barcode scanner, parse scanned QR payload, validate token, and add user to the Care Circle.
- **Task 7.4**: Build `src/app/care-circle/add-member-med.tsx` enabling caregivers to schedule medication reminders directly for circle members.
- *Verify*: Generate QR code, simulate scan/decode, confirm joined circle and member-assigned medicines.

### Phase 8: Section 3 — Profile & Settings
- **Task 8.1**: Build `src/app/(tabs)/profile.tsx` with user personal details and emergency contacts.
- **Task 8.2**: Add notification diagnostic toggle and test button (fires a test alarm in 5 seconds).
- **Task 8.3**: Add data export summary and reset data option with confirmation dialog.
- *Verify*: Trigger test alarm; verify audio and haptic alert fire as expected.

### Phase 9: Context Verification & Maintenance Check
- **Task 9.1**: Validate all 5 files in `Context/` against the final implemented code.
- **Task 9.2**: Append Phase 1 completion entry to `Context/05_UPDATE_RULES_AND_MAINTENANCE.md`.
- *Verify*: Code and Context are 100% synchronized.

---

## 🔍 Verification Plan

### Automated Checks
```bash
# 1. TypeScript compilation check
npx tsc --noEmit

# 2. Project security scan
python .agents/skills/vulnerability-scanner/scripts/security_scan.py .

# 3. Mobile UI & accessibility audit
python .agents/skills/mobile-design/scripts/mobile_audit.py .
```

### Manual Verification Flows
1. **Medication Flow**:
   - Tap "+" to Add Medicine.
   - Fill in name "Amoxicillin", dose "500 mg", form "Capsule", instruction "After meal".
   - Select photo from camera/gallery.
   - Set alarm time for 2 minutes in the future; set vibration to "Heavy" and snooze to "5 mins".
   - Confirm medicine saves and shows on Dashboard.
   - Wait for notification or test trigger; verify sound and haptic vibration; tap "Take" or "Snooze".
2. **Care Circle QR Flow**:
   - Go to Care Circle tab; tap "Create Circle" -> verify QR code renders clearly.
   - Tap "Join Circle with QR" -> verify camera viewfinder opens and scans code.
   - Verify member appears in roster and can have medicines assigned to them.
3. **Context Sync Check**:
   - Verify `Context/` folder files match the exact code and configuration.
