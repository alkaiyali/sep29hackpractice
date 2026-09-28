# 03 — Sections & Feature Specifications

This document defines the functional and UI specifications for the 4 core sections of **Meddy**.

---

## 1. 🏠 Dashboard Section

The Dashboard is the daily hub that gives users an immediate view of today's medication schedule and Care Circle status at a glance.

### Features & UI Elements
1. **Header & Date Navigator**:
   - Greeting with active profile avatar.
   - Horizontal date strip (scrollable week view with today highlighted).
2. **Adherence Status Card**:
   - Circular or bar progress indicator (e.g., "3 of 4 taken today · 75%").
   - Streak counter to encourage consistency.
3. **Today's Medicine Timeline (Tracked Medicines)**:
   - Grouped chronologically: **Morning**, **Afternoon**, **Evening**, **Night**.
   - Each card displays:
     - Medicine Name, Dosage + Unit (e.g., *Amoxicillin 500mg*).
     - Medicine Form icon (Pill, Liquid, Inhaler, etc.).
     - Scheduled time (e.g., *08:00 AM*).
     - Photo thumbnail (if attached).
     - Target individual badge (Self or Care Circle member name).
     - Interactive quick action buttons: **[Take]**, **[Snooze]**, or **[Skip]**.
4. **Care Circle Overview Widget**:
   - Mini card showing active Care Circles (e.g., *"Family Circle"* or *"Mom's Care"*).
   - Member avatars with status badges (e.g., *"All meds taken"*, *"1 dose pending"*).
   - Fast action to open QR scanner or share invite.
5. **Refill Alert Banner**:
   - High-priority banner appears when any medicine reaches its low-supply threshold.
   - Shows affected medicines with remaining counts; one-tap pharmacy call when a pharmacy phone is saved.
6. **History Entry Point**:
   - Adherence card surfaces missed-dose count and links to the full History & Adherence calendar.

---

## 1b. 📅 History & Adherence Calendar (Stack Screen — `/history`)

A dedicated audit view for compliance over time (opened from the Dashboard adherence card).

### Features & UI Elements
1. **Monthly Calendar Grid**:
   - Prev/next month navigation (bounded to the last 120 days of history).
   - Color-coded day dots: **Green** = all taken, **Amber** = partial/snoozed, **Red** = any missed dose, no dot = nothing scheduled.
   - Today is highlighted; future days are disabled.
2. **Monthly Summary Strip**: adherence percentage, doses taken/due, and missed count for the displayed month.
3. **Day Detail List**: tapping a day shows every scheduled dose with exact time, medicine name, status chip, and the recorded action time ("Taken at 8:32 AM" / "No dose recorded").
4. **Missed-Dose Semantics**: an unlogged dose automatically becomes **Missed** 60 minutes after its scheduled time (`MISSED_DOSE_GRACE_MINUTES`), keeping the calendar and adherence math honest without manual input.

---

## 2. 💊 Medicine Section

The Medicine Section handles the full lifecycle of medicine cataloging, scheduling, and reminder configuration.

### A. Medicine List View
- Search and filter by form (Pill, Syrup, Inhaler), time of day, or member.
- Detailed card view showing current active prescriptions, remaining quantity, and upcoming alarm.
- Stock badge per card: remaining count, turning red with "Refill soon" once at/below threshold.

### B. Add / Edit Medicine Flow (Modal or Multi-step Form)
The user provides comprehensive information to ensure accurate medication delivery:

| Field | Input Type | Options / Formats |
|---|---|---|
| **Medicine Name** | Text Input | e.g., *"Metformin"*, *"Vitamin D3"* |
| **Dosage & Unit** | Numeric + Unit Selector | Value (e.g., 500) + Unit (`mg`, `mcg`, `ml`, `tablets`, `capsules`, `drops`, `puffs`, `units`, `IU`) |
| **Medicine Form** | Visual Grid Selector | Tablet/Pill, Capsule, Liquid/Syrup, Injection, Inhaler, Drops, Topical/Patch |
| **Instruction** | Chip Selector / Dropdown | *Before Meal*, *With Food / After Meal*, *Empty Stomach*, *Before Bed*, *Anytime* |
| **Optional Notes** | Multiline Text | e.g., *"Drink with a full glass of water. Avoid taking with grapefruit."* |
| **Photo Upload** | Camera & Gallery Action Sheet | - **Take Photo**: Launches device camera with instant preview.<br>- **Choose from Gallery**: Picks an existing photo from the photo library.<br>- Ability to crop, replace, or delete photo. |
| **Schedule for Alarm** | Time Picker & Days Selector | - Select one or multiple times per day (e.g., 08:00 AM & 08:00 PM).<br>- Frequency: *Every day*, *Specific days of week*, *Every X hours*. |
| **Reminder Settings** | Nested Settings Panel | - **Sound**: On/Off toggle + Sound selection (*Default Chime*, *Gentle Bell*, *Radar*, *Medical Pulse*).<br>- **Vibration**: On/Off toggle + Pattern selection (*Gentle*, *Crisp*, *Heavy Alert*).<br>- **Snooze Time**: Duration selector (*5 mins*, *10 mins*, *15 mins*, *30 mins*). |
| **Target Recipient** | Member Selector | *Myself* or any member from *Care Circle* |
| **Supply & Refill Tracker** | Optional Numeric Fields + Phone | - **Doses left in supply** (optional).<br>- **Alert at or below** threshold (default 3).<br>- **Pharmacy phone** for one-tap `tel:` refill calls. |

---

## 3. 👥 Care Circle Section

The Care Circle feature coordinates family members, guardians, and caregivers to ensure medications are monitored cooperatively.

### Core Capabilities
1. **Create a Care Circle via QR**:
   - Generates a new Care Circle (e.g., *"Smith Family Care"*).
   - Generates an on-screen high-resolution **QR Code** containing an encrypted circle join token.
   - Option to share circle code as a direct alphanumeric text string.
2. **Join a Care Circle via QR**:
   - Activates the in-app **Camera Viewfinder** to scan another user's QR code.
   - Instantly decodes the token, previews the circle details (Name, Admin, Existing members), and confirms joining.
3. **Care Circle Hub & Member Roster**:
   - View all members in the circle (e.g., *Dad, Grandma, Sarah*).
   - View medication adherence and logs for each member in real time.
4. **Add Medicine for Reminder for Loved Ones**:
   - Caregivers can add or schedule medicines directly assigned to any member of the circle.
   - Notifications trigger locally on the caregiver's device as monitoring reminders, or sync to the member's profile.

---

## 4. 👤 Profile Section

Manages personal account details, system preferences, and app health settings.

### Features
1. **User Identity & Health Card**:
   - User Name, avatar, emergency contact phone number.
   - Basic health notes (e.g., Known Drug Allergies: *Penicillin*, *Sulfa*).
2. **Notification & Alarm Preferences**:
   - System notification permission diagnostic and request prompt.
   - Master toggle for sound alerts and vibration.
   - Global default snooze duration.
3. **Care Circle Management**:
   - List of all circles the user owns or belongs to.
   - Option to leave a circle or generate fresh invite QR codes.
4. **Data & Privacy**:
   - Local database export (JSON summary of medication history).
   - Clear all local cache / Reset app data.
   - App version, terms, and privacy notice.
5. **Appearance (Dark Mode)**:
   - System / Light / Dark selector persisted locally (`ThemeProvider`).
   - Full dual-palette support across every screen (tokens in `src/constants/colors.ts`).
6. **Doctor Report**:
   - One-tap generation of a 30-day adherence PDF (`expo-print` + `expo-sharing`).
   - Includes adherence stats, medication schedules, recent dose activity, allergies, and emergency contact.
