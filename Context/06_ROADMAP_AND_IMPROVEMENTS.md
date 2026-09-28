# 06 — Meddy Product Roadmap & Future Improvements

> **Context**: This document provides a structured, phased roadmap and comprehensive catalog of improvements for **Meddy**. Rather than attempting to implement every complex feature simultaneously, this roadmap breaks down potential enhancements into iterative, high-impact milestones.

---

## 🧭 Executive Summary

Meddy has established a solid, production-grade foundation with Expo SDK 54, offline-first state architecture, full 4-tab navigation, custom alarm reminder settings (sound, vibration, snooze), photo capture, and QR-based Care Circle connectivity.

To take Meddy from an agile MVP to a market-leading, clinically reliable health companion, improvements are grouped into five strategic pillars:
1. **Safety & Medication Intelligence** (Prevent adverse events & mix-ups)
2. **Caregiver Escalation & Real-Time Sync** (Peace of mind for families)
3. **Refill & Inventory Automation** (Never run out of critical meds)
4. **Clinical Reporting & Doctor Integration** (Actionable medical history)
5. **Universal Accessibility & Hardware Ecosystem** (Elderly-friendly UX & wearables)

---

## 🗺️ Phased Roadmap (Iterative Milestones)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MEDDY ROADMAP TIMELINE                          │
├─────────────────┬─────────────────┬──────────────────┬─────────────────┤
│   MILESTONE 1   │   MILESTONE 2   │   MILESTONE 3    │   MILESTONE 4   │
│  Polish & Supply│ Caregiver Sync  │ Smart OCR & Safety│ Doctor Reports  │
├─────────────────┼─────────────────┼──────────────────┼─────────────────┤
│ • Refill Tracker│ • Cloud Backend │ • OCR Label Scan │ • PDF Doctor Rpt│
│ • Custom Sound  │ • Missed Alert  │ • Drug-Drug Check│ • Vitals Tracker│
│ • History Log   │   Escalation    │ • Food Warnings  │ • Senior High-  │
│ • Dark Mode     │ • Family Activity│ • NFC Smart Tap  │   Contrast Mode │
│                 │   Feed & Chat   │                  │                 │
└─────────────────┴─────────────────┴──────────────────┴─────────────────┘
```

---

## 📦 Milestone 1: Polish, Inventory & Usability (Short-Term / Quick Wins)

*Focus: Enhance daily habit adherence, prevent running out of medicine, and refine UX polish.*

### 1.1 Pill Inventory & Low-Supply Refill Alerts
- **Problem**: Patients frequently realize they have run out of pills only when opening an empty bottle.
- **Solution**:
  - Add `inventoryCount` and `refillThreshold` to `Medicine` model.
  - Automatically decrement count by the dose amount every time user taps **"Take"**.
  - Trigger a high-priority banner and notification: *"Low Supply: Only 4 pills left of Amoxicillin. Time to request a refill!"*
  - One-tap button to call pharmacy or copy prescription details.

### 1.2 Dedicated History & Adherence Calendar
- **Problem**: Currently, the Dashboard prioritizes *today's* doses. Users cannot easily audit last week's compliance.
- **Solution**:
  - Add an interactive monthly/weekly calendar grid on the Dashboard or in Profile.
  - Color-coded daily dots: Green (100% taken), Amber (partial/snoozed), Red (missed).
  - Tap any past date to view full historical dose logs with exact timestamps.

### 1.3 Native Audio Bundling for Chimes
- **Problem**: Relying only on standard system chime tones limits customization.
- **Solution**:
  - Bundle lightweight, calming audio assets (`.mp3`/`.wav`) in `assets/sounds/` (*Gentle Chime*, *Tibetan Bell*, *Clinical Pulse*).
  - Use `expo-av` Sound API to play user-chosen audio files with smooth volume fade-in.

### 1.4 System Dark Mode & Theme Toggle
- **Problem**: Taking nighttime medication in a dark bedroom with a bright white UI strains the eyes.
- **Solution**:
  - Implement full dark mode leveraging our predefined `Colors.dark` tokens in `src/constants/colors.ts`.
  - Automatically match device system appearance or allow manual toggle in Profile.

---

## 📡 Milestone 2: Real-Time Caregiver Sync & Escalation (Medium-Term)

*Focus: Transition Care Circle from local QR sharing to collaborative family caregiving with proactive emergency escalation.*

### 2.1 Cloud Backend Synchronization (Supabase / Firebase)
- **Problem**: QR codes currently establish peer metadata offline, but cross-device status sync requires cloud connectivity.
- **Solution**:
  - Integrate a lightweight backend (e.g. Supabase Auth + PostgreSQL with Row-Level Security, or Firebase Firestore).
  - Real-time subscriptions: When Mom taps "Take" in another state, the caregiver's app instantly updates from "Pending" to "✓ Taken at 8:32 AM".

### 2.2 Missed Dose Escalation System (Safety Net)
- **Problem**: If an elderly parent forgets their blood pressure medicine or falls, an ignored phone notification does not help.
- **Solution**:
  - **Tier 1 (0 min)**: Regular local alarm triggers on parent's device.
  - **Tier 2 (+30 min)**: Gentle reminder notification to parent.
  - **Tier 3 (+60 min)**: Automatic SMS or High-Priority Push Notification sent to Care Circle caregivers:
    > *"Alert: Maria Rivera has not confirmed taking her morning Lisinopril scheduled for 8:30 AM. Please check in."*

### 2.3 Care Circle Family Feed & Encouragement Reactions
- **Problem**: Medication management feels solitary and stressful.
- **Solution**:
  - Simple shared activity feed in the Care Circle tab showing recent adherence wins.
  - Family members can send quick emoji cheers (❤️, 👍, 🌟) or celebratory messages when a loved one completes their regimen.

---

## 🧠 Milestone 3: Computer Vision (OCR) & Clinical Safety (Advanced)

*Focus: Eliminate manual typing errors and prevent dangerous drug interactions.*

### 3.1 AI / OCR Prescription Label Scanner
- **Problem**: Typing long medication names (e.g., *Atorvastatin Calcium*, *Levothyroxine Sodium*) and dosage instructions manually is tedious and error-prone for seniors.
- **Solution**:
  - Integrate on-device OCR (using `expo-camera` with Google ML Kit Text Recognition or vision API).
  - User points camera at prescription bottle: the app extracts **Medicine Name**, **Dosage (mg/ml)**, and **Instructions ("Take 1 tablet daily with food")** directly into the form fields.

### 3.2 Drug-Drug Interaction Warning Engine
- **Problem**: Patients seeing multiple doctors or taking supplements can accidentally take conflicting substances (e.g. Blood thinners + Ibuprofen).
- **Solution**:
  - Integrate with open medical datasets (e.g. NIH National Library of Medicine RxNorm API).
  - When saving a new medicine, scan existing active prescriptions and flag potential interactions:
    > *"⚠️ Warning: Taking Aspirin alongside Warfarin increases bleeding risk. Please consult your physician."*

### 3.3 Food & Beverage Precautions
- **Problem**: Many medicines fail or become toxic when combined with common foods (grapefruit, dairy, alcohol).
- **Solution**:
  - Built-in cautionary badges auto-populated by medicine category:
    - 🥛 *Avoid dairy within 2 hours* (Tetracyclines)
    - 🍊 *Avoid grapefruit juice* (Statins)
    - 🚫 *Do not consume alcohol*

---

## 📄 Milestone 4: Doctor PDF Reports & Vitals Correlation (Clinical Impact)

*Focus: Empower doctor visits with verifiable data.*

### 4.1 Physician-Ready Adherence PDF Export
- **Problem**: When doctors ask, *"Have you been taking your blood pressure medication consistently?"*, patients usually guess.
- **Solution**:
  - Generate a formatted, multi-page clinical PDF report using `expo-print` / `expo-sharing`.
  - Includes: Adherence rate percentage, timeline of doses taken vs. missed, notes, doctor name, and emergency contact.
  - One-tap share via Email, AirDrop, or WhatsApp to doctor.

### 4.2 Health Vitals & Symptom Correlation
- **Problem**: Medicine efficacy is tied to biometric vitals.
- **Solution**:
  - Optional quick vitals prompt when taking certain meds:
    - Lisinopril → Prompt for Blood Pressure (SYS/DIA)
    - Insulin / Metformin → Prompt for Blood Glucose (mg/dL)
  - Correlation chart showing how medication adherence stabilizes vital trends over time.

---

## ⌚ Milestone 5: Wearables, Smart NFC & Universal Accessibility

*Focus: Zero-friction interaction for aging adults and users with motor/vision impairments.*

### 5.1 Senior & High-Legibility Mode
- **Features**:
  - Extra-large typography option with Dynamic Type scaling.
  - High-contrast color mode exceeding WCAG AAA standards.
  - Audio voice-readout: Tap a button to have the app speak aloud: *"Take two white capsules of Amoxicillin with water."*

### 5.2 Wear OS & Apple Watch Companion
- **Features**:
  - Wrist notifications with actionable "Taken" / "Snooze" buttons.
  - Complication on watch face showing next dose time and medicine icon.

### 5.3 NFC Smart Pillbox / Tag Tapping
- **Features**:
  - Users stick a cheap $0.20 NFC sticker on their pill container.
  - Tapping the phone against the pill bottle instantly logs the dose as taken without unlocking the phone or opening menus.

---

## 📊 Effort vs. Value Prioritization Matrix

| Feature | Effort | Clinical Value | User Value | Recommended Priority |
|---|---|---|---|---|
| **Refill & Inventory Tracker** | Low | High | High | **P0 (Next Sprint)** |
| **History & Calendar Audit View** | Low | Medium | High | **P0 (Next Sprint)** |
| **Cloud Sync & Escalation Alerts** | Medium | Critical | Very High | **P1 (Sprint 2)** |
| **OCR Prescription Label Scanner** | Medium | High | High | **P2 (Sprint 3)** |
| **Doctor Adherence PDF Export** | Low | High | High | **P2 (Sprint 3)** |
| **Drug Interaction Checker** | High | Critical | High | **P3 (Sprint 4)** |
| **Senior Voice / High-Legibility Mode** | Low | Medium | High | **P3 (Sprint 4)** |
| **Smartwatch Wearable Support** | High | Medium | Medium | **P4 (Future)** |
| **NFC Tap-to-Take** | Medium | Medium | Cool factor | **P4 (Future)** |
