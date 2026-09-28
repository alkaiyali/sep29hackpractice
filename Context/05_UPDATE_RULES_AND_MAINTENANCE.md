# 05 — Context Maintenance & Update Rules

> **MANDATORY SYSTEM DIRECTIVE FOR ALL DEVELOPERS AND AI AGENTS**
> 
> The `Context/` folder is the **Single Source of Truth (SSOT)** for Meddy's architecture, data contracts, feature specifications, and implementation decisions.
> 
> **ANY modification to the Meddy app code MUST BE ACCOMPANIED by an immediate update to the relevant files in the `Context/` directory.**

---

## 1. When Must the Context Folder Be Updated?

| If You Are Modifying... | You MUST Update... |
|---|---|
| **Tech stack, packages, libraries, or Expo SDK configurations** | `Context/02_TECH_STACK_AND_FRAMEWORK.md` |
| **Adding, changing, or removing app screens, sections, or UI flows** | `Context/03_SECTIONS_AND_FEATURES.md` |
| **Modifying TypeScript models, state stores, database schemas, or folder paths** | `Context/04_DATA_SCHEMA_AND_ARCHITECTURE.md` |
| **Updating product mission, scope, or target personas** | `Context/01_APP_OVERVIEW.md` |
| **Creating a major milestone or finishing an implementation sprint** | Append to the **Change Log** below |

---

## 2. Pre-Commit / Pre-Completion Verification Checklist

Before marking any task, feature, or bug fix as complete:

- [ ] **Check 1: Code vs. Context Alignment**: Did the code change add or alter any models, props, routes, or features? If yes, are they documented in `Context/`?
- [ ] **Check 2: Dependency Accuracy**: If any `npm` or `expo install` package was introduced or updated, is it reflected in `02_TECH_STACK_AND_FRAMEWORK.md`?
- [ ] **Check 3: Screen & Flow Accuracy**: If new routes or modal interactions were built, are they captured in `03_SECTIONS_AND_FEATURES.md`?
- [ ] **Check 4: Data Schema Integrity**: Are all interfaces in `04_DATA_SCHEMA_AND_ARCHITECTURE.md` identical to the live TypeScript types in `src/types/`?
- [ ] **Check 5: Change Log Recorded**: Has a brief entry been added to Section 3 of this document?

---

## 3. Project Change Log

| Date | Author / Agent | Changes Made | Files in `Context/` Updated |
|---|---|---|---|
| 2026-09-28 | Meddy Architect | Initialized complete context repository for Meddy (Expo SDK 54, 4 sections, Care Circle QR, Alarms) | All files (`01` through `05`) |
| 2026-09-28 | Mobile Developer | Implemented Expo SDK 54 application: 4 tab navigation, Dashboard timeline, Medicine section & add modal with photo/sound/vibration/snooze settings, Care Circle QR generation/scanner, Profile diagnostics, and Zustand stores | `Context/02_TECH_STACK_AND_FRAMEWORK.md`, `Context/05_UPDATE_RULES_AND_MAINTENANCE.md` |
| 2026-09-28 | Product Planner | Authored comprehensive product improvement catalog & 5-phase roadmap with priority matrix | `Context/06_ROADMAP_AND_IMPROVEMENTS.md`, `Context/README.md`, `Context/05_UPDATE_RULES_AND_MAINTENANCE.md` |
| 2026-09-28 | Mobile Developer | Added web platform capabilities (`react-dom`, `react-native-web`, `@expo/metro-runtime`) and updated `app.json` | `package.json`, `app.json`, `Context/02_TECH_STACK_AND_FRAMEWORK.md`, `Context/05_UPDATE_RULES_AND_MAINTENANCE.md` |
| 2026-09-28 | Debugger | Fixed `createPermissionHook` mismatch by downgrading `expo-camera` to SDK 54 compatible `~17.0.10`, `expo-haptics` to `~15.0.8`, `react-native-svg` to `15.12.1`, and `@react-native-async-storage/async-storage` to `2.2.0` | `package.json`, `package-lock.json`, `Context/02_TECH_STACK_AND_FRAMEWORK.md`, `Context/05_UPDATE_RULES_AND_MAINTENANCE.md` |
| 2026-09-28 | Mobile Developer | Removed all hardcoded initial medicines, mock circles, and mock profiles; implemented clean onboarding empty states; added real synthesized audio chime player (Web Audio API & base64 WAV for expo-av); added camera fallbacks and QR scan simulation | `src/constants/defaultData.ts`, `src/store/*`, `src/services/*`, `src/app/*`, `Context/05_UPDATE_RULES_AND_MAINTENANCE.md` |
| 2026-09-28 | Mobile Developer | Upgraded app to Expo SDK 57 (expo ~57.0.25, react 19.2.3, react-native 0.86.3, typescript ~6.0.3, expo-camera ~57.0.5, expo-notifications ~57.0.21, expo-router ~57.0.23); fixed TypeScript StyleSheet & Buffer types; verified clean web build | `package.json`, `package-lock.json`, `src/app/care-circle/scan.tsx`, `src/services/audioHaptics.ts`, `Context/*` |
| 2026-09-28 | Senior Engineer / Data Analyst | Diagnosed HTTP 500 error on Metro bundler: root-caused to `react-native-worklets` regex `/[?#].*$/` truncating file paths containing `#` (`Practice Hackathon #1`). Implemented automated hotfix in `scripts/patch-worklets.js` hooked to npm `postinstall`. Verified HTTP 200 on Android, iOS, and Web bundles | `scripts/patch-worklets.js`, `package.json`, `Context/05_UPDATE_RULES_AND_MAINTENANCE.md` |
| 2026-09-28 | Senior Engineer / Mobile Architect | Diagnosed mobile runtime issues: (1) unnested child view hierarchy from `CameraView` in `src/app/care-circle/scan.tsx` adhering to Fabric New Architecture constraints; (2) guarded `Notifications.setNotificationHandler` against platform evaluation errors; (3) added `fromImport` undefined safety guard to `expo-router` in `scripts/patch-worklets.js` | `src/app/care-circle/scan.tsx`, `src/services/notifications.ts`, `scripts/patch-worklets.js`, `Context/05_UPDATE_RULES_AND_MAINTENANCE.md` |
| 2026-09-28 | Mobile Developer (AI) | Housekeeping: removed demo seed data, mock QR simulation payloads, and hardcoded fallbacks ('My Profile', fake phone number, default 'O+' blood type) | `src/constants/defaultData.ts`, `src/store/*`, `src/app/*` |
| 2026-09-28 | Mobile Developer (AI) | Implemented roadmap Milestone 1 (1.1 Refill Tracker, 1.2 History Calendar, 1.4 Dark Mode) and 4.1 Doctor PDF Report, plus local missed-dose detection (2.2 Tier 1). Added `expo-print`/`expo-sharing`, `ThemeProvider`, `history.tsx`, `report.ts`; verified with `tsc --noEmit` and full web export | `Context/02_TECH_STACK_AND_FRAMEWORK.md`, `Context/03_SECTIONS_AND_FEATURES.md`, `Context/04_DATA_SCHEMA_AND_ARCHITECTURE.md`, `Context/05_UPDATE_RULES_AND_MAINTENANCE.md`, `Context/06_ROADMAP_AND_IMPROVEMENTS.md` |
| 2026-09-28 | Mobile Developer (AI) | Visual identity pass: true-AMOLED dark theme (pure-black canvas, neon teal, `onPrimary`/`hero`/`track`/`glow` tokens), adherence hero panel, status-rail dose cards, avatar/pill dashboard header, glowing FABs, pure-black QR scanner chrome; fixed all hardcoded whites for dark-mode contrast | `src/constants/colors.ts`, `src/components/*`, `src/app/*`, `Context/02_TECH_STACK_AND_FRAMEWORK.md`, `Context/03_SECTIONS_AND_FEATURES.md`, `Context/05_UPDATE_RULES_AND_MAINTENANCE.md` |
| 2026-09-28 | Mobile Developer (AI) | Fixed phantom 100% on empty schedules (neutral — state); generated branded splash/logo asset set (capsule + pulse mark) | `src/store/medicineStore.ts`, `src/components/dashboard/AdherenceCard.tsx`, `assets/*`, `app.json` |
| 2026-09-28 | Mobile Developer (AI) | Roadmap sweep part 1: bundled WAV chimes (1.3), local missed-dose escalation tiers + activity feed with cheers (2.2 local / 2.3 local) | `assets/sounds/*`, `src/services/audioHaptics.ts`, `src/services/notifications.ts`, `src/store/*`, `src/app/(tabs)/care-circle.tsx` |
| 2026-09-28 | Mobile Developer (AI) | Roadmap sweep part 2: precaution engine + interaction gate (3.2/3.3), vitals tracking with post-dose prompt (4.2), OCR label scanner (3.1), vitals in doctor PDF | `src/services/precautions.ts`, `src/services/interactions.ts`, `src/services/labelOcr.ts`, `src/store/vitalsStore.ts`, `src/components/vitals/*`, `src/app/medicine/*`, `src/services/report.ts` |
| 2026-09-28 | Mobile Developer (AI) | Custom alarm sounds (import MP3/WAV/M4A, per-medicine selection, preview, delete) + QoL batch: working notification actions, dose undo, repeat-day picker, cabinet search, relative time labels, supply stepper | `src/store/soundStore.ts`, `src/services/audioHaptics.ts`, `src/components/medicine/AlarmSettingsView.tsx`, `src/app/_layout.tsx`, `src/store/medicineStore.ts`, `src/app/medicine/add.tsx`, `src/app/(tabs)/medicines.tsx`, `src/components/dashboard/TodayDoseCard.tsx` |
| 2026-09-28 | Mobile Developer (AI) | Roadmap 2.1: optional Firebase (Firestore + anonymous Auth) Care Circle live sync — circle/member/roster sync, deterministic dose events, cross-device cheers, sync status pill, live merged activity feed; local-first fallback retained. Added `firebase` dep, rules, `.env.example`, and setup guide | `package.json`, `src/services/firebase.ts`, `src/services/circleSync.ts`, `src/store/careCircleStore.ts`, `src/store/medicineStore.ts`, `src/app/_layout.tsx`, `src/app/(tabs)/care-circle.tsx`, `src/app/care-circle/scan.tsx`, `src/components/dashboard/CareCircleSummary.tsx`, `src/types/careCircle.ts`, `firebase/*`, `.env.example`, `.gitignore`, `Context/02`, `Context/03`, `Context/04`, `Context/05`, `Context/06`, `Context/07`, `Context/README.md` |
| 2026-09-28 | Mobile Developer (AI) | Provisioned the live Firebase backend: project `onlypills-b105c` (web app, Firestore `(default)` in `nam5`, Anonymous provider via `auth.providers`), deployed `firestore.rules`, pinned `firebase/.firebaserc`, wrote `.env`, and added `npm run firebase:smoke` — live two-user test of rules/join/dose-sync/cheers, 12/12 checks passing | `firebase/firebase.json`, `firebase/.firebaserc`, `.env` (gitignored), `scripts/firebase-smoke.mjs`, `package.json`, `Context/02`, `Context/05`, `Context/07` |





