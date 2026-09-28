# 02 — Tech Stack & Framework Architecture

## 1. Core Platform

| Layer | Selected Technology | Version / Specification | Rationale |
|---|---|---|---|
| **Framework** | React Native + Expo | SDK 57 (React 19.2.3, RN 0.86.3) | Latest production-ready Expo release with full React 19 support and unified hardware APIs. |
| **Language** | TypeScript | ~6.0.3 (Strict Mode) | Type safety for medical dosage, schedule timestamps, and member permissions. |
| **Navigation** | Expo Router | File-based routing (~57.0.23) | Deep linking support, clean tab navigation (`(tabs)`), and intuitive modal presentations. |
| **UI Architecture** | Design Tokens + NativeWind / StyleSheet | Mobile-first Design System | Light clinical paper theme + true-AMOLED dark theme (pure-black canvas, neon teal `#2DD4BF`). Strict exclusion of arbitrary purple/violet. |

---

## 2. Key Modules & Hardware Capabilities

### A. Notifications & Alarm Scheduling (`expo-notifications`)
- Local scheduled notifications triggered at precise times (`CalendarNotificationTrigger` or `TimeIntervalNotificationTrigger`).
- Repeating daily and multi-day alarms.
- Custom categories with interactive notification actions: **"Take Now"** and **"Snooze (5m/10m/15m)"**.
- Foreground presentation handler to alert users while actively using the app.

### B. Audio & Haptics (`expo-av` & `expo-haptics`)
- **Sound Alerts**: Audio playback using `expo-av` for chime, gentle alarm, or standard alert tone.
- **Haptic Vibrations**: Tactile feedback via `expo-haptics` (`NotificationFeedbackType.Warning`, `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)`) adhering to user reminder preferences.

### C. Camera & Photo Storage (`expo-image-picker` & `expo-file-system`)
- **Take Photo**: Launch device camera directly inside the Medicine add flow.
- **Gallery Selection**: Pick existing medicine packaging/bottle photos.
- **Persistent Storage**: Save captured photo paths to the app's document directory so images persist across sessions.

### D. QR Code Generation & Scanning (`react-native-qrcode-svg` & `expo-camera`)
- **QR Generation**: Renders encrypted/formatted JSON payload containing `circleId`, `circleName`, `inviterName`, and `key` for effortless caregiver pairing.
- **QR Scanner**: Fullscreen or viewfinder camera scanner utilizing `CameraView` with `onBarcodeScanned` handler to instantly parse and join circles.

### E. State Management & Offline Persistence (`zustand` + `AsyncStorage`)
- **Zustand Stores**:
  - `useMedicineStore`: Medicine records, schedule definitions, reminder settings, inventory/refill state, computed dose statuses (pending / taken / snoozed / skipped / missed), dose logs, and per-day adherence queries for the history calendar.
  - `useCareCircleStore`: Active circles, joined members, permissions, and cross-member reminders.
  - `useUserStore`: User profile details, alarm preferences, and notification status.
- **Persistence**: Rehydrates automatically via `@react-native-async-storage/async-storage` ensuring complete offline capability.
- **Theme Preference**: `ThemeProvider` (`src/theme/ThemeProvider.tsx`) persists `system | light | dark` in AsyncStorage and serves WCAG-compliant palettes into every screen.
- **Dark = true AMOLED**: `Colors.dark` uses a pure-black `#000000` background, near-black surfaces (`#0C0C0E`), and a neon teal primary (`#2DD4BF`) with dark `onPrimary` (`#03211D`) text on fills. Shadows are replaced by 1px borders; the tab bar sits on pure black. The QR scanner uses fixed pure-black camera chrome in both modes.
- **Signature elements**: deep-pine adherence hero panel (`hero` tokens), status-rail dose cards, pill date badge + avatar monogram header, glowing neon FABs.

### F. Inventory & Refill Alerts (offline)
- Optional `inventoryCount`, `refillThreshold`, and `pharmacyPhone` per medicine.
- Each first-time "Take" decrements the count; un-marking a taken dose restores it.
- Crossing the threshold fires a high-priority local notification (`notificationService.notifyLowSupply`) and a Dashboard refill banner with one-tap `tel:` call when a pharmacy phone is set.

### G. Clinical PDF Reports (`expo-print` & `expo-sharing`)
- `src/services/report.ts` renders a self-contained HTML adherence report (30-day statistics, medication schedule, recent dose activity, vitals table, allergies/emergency contact).
- Native: `Print.printToFileAsync` → `Sharing.shareAsync` (PDF). Web: opens a print-ready window.

### H. Safety Engines (offline, educational)
- `src/services/precautions.ts`: 14 food/beverage/timing rules matched against medicine names (grapefruit, dairy, bleeding, alcohol…). Surfaced as tappable chips on dose cards and live cautions in the add form.
- `src/services/interactions.ts`: 10 high-risk drug-pair rules checked at save time; major risks block with an override alert.
- `src/services/labelOcr.ts`: prescription-label OCR via OCR.space (camera/gallery capture → parse name/strength/directions → confirm screen → prefill add form). Internet required; manual entry always available.

### I. Engagement & Vitals (offline)
- `src/store/activityStore.ts`: per-log emoji cheers (❤️/👍/🌟), persisted; rendered as the Circle Activity feed.
- `src/store/vitalsStore.ts` + `src/components/vitals/VitalsPrompt.tsx`: BP/glucose capture in a bottom sheet after each taken dose (plus manual entry); recent readings in Profile; vitals table in the PDF report.
- Missed-dose escalation runs inside `useMedicineStore.loadData` (`checkMissedEscalations`): gentle reminder at 60–120 min late, urgent nudge at 2–4 h, once per dose.

---

## 3. Dependency Blueprint

```json
{
  "dependencies": {
    "expo": "~57.0.25",
    "expo-router": "~57.0.23",
    "expo-status-bar": "~57.0.1",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "react-native": "0.86.3",
    "react-native-safe-area-context": "~5.7.0",
    "react-native-screens": "~4.26.0",
    "expo-notifications": "~57.0.21",
    "expo-image-picker": "~57.0.20",
    "expo-camera": "~57.0.5",
    "expo-av": "~16.0.8",
    "expo-haptics": "~57.0.3",
    "expo-file-system": "~57.0.7",
    "react-native-svg": "15.15.4",
    "react-native-qrcode-svg": "^6.3.26",
    "zustand": "^5.0.15",
    "@react-native-async-storage/async-storage": "2.2.0",
    "@expo/vector-icons": "^15.0.3",
    "expo-constants": "~57.0.19",
    "expo-linking": "~57.0.11",
    "expo-print": "~57.0.2",
    "expo-sharing": "~57.0.22",
    "react-native-web": "~0.21.0",
    "@expo/metro-runtime": "~57.0.16"
  },
  "devDependencies": {
    "@types/react": "~19.2.2",
    "typescript": "~6.0.3"
  }
}
```
