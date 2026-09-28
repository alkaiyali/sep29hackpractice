# Meddy — Context Repository & App Blueprint

> **CRITICAL DIRECTIVE**: Whenever any part of the Meddy application is updated, refactored, or expanded, the documentation in this `Context/` directory **MUST** be updated to reflect the new state of the application.

---

## 📁 Directory Structure

| File | Purpose |
|------|---------|
| [01_APP_OVERVIEW.md](file:///c:/Users/Manel/OneDrive/Desktop/Practice%20Hackathon%20%231/sep29hackpractice/Context/01_APP_OVERVIEW.md) | High-level product summary, target personas, and core value proposition. |
| [02_TECH_STACK_AND_FRAMEWORK.md](file:///c:/Users/Manel/OneDrive/Desktop/Practice%20Hackathon%20%231/sep29hackpractice/Context/02_TECH_STACK_AND_FRAMEWORK.md) | Technical stack specifications (Expo SDK 57, Expo Router, libraries, hardware APIs). |
| [03_SECTIONS_AND_FEATURES.md](file:///c:/Users/Manel/OneDrive/Desktop/Practice%20Hackathon%20%231/sep29hackpractice/Context/03_SECTIONS_AND_FEATURES.md) | Detailed specifications of the 4 core sections: Dashboard, Medicine, Profile, and Care Circle. |
| [04_DATA_SCHEMA_AND_ARCHITECTURE.md](file:///c:/Users/Manel/OneDrive/Desktop/Practice%20Hackathon%20%231/sep29hackpractice/Context/04_DATA_SCHEMA_AND_ARCHITECTURE.md) | Data models, state management, directory architecture, and alarm notification flows. |
| [05_UPDATE_RULES_AND_MAINTENANCE.md](file:///c:/Users/Manel/OneDrive/Desktop/Practice%20Hackathon%20%231/sep29hackpractice/Context/05_UPDATE_RULES_AND_MAINTENANCE.md) | Mandatory protocol and checklist for keeping this Context folder updated on every app modification. |
| [06_ROADMAP_AND_IMPROVEMENTS.md](file:///c:/Users/Manel/OneDrive/Desktop/Practice%20Hackathon%20%231/sep29hackpractice/Context/06_ROADMAP_AND_IMPROVEMENTS.md) | Phased product roadmap, milestone breakdown, and prioritized improvement proposals. |

---

## 🔄 Rule for Developers and AI Agents

Any code change that alters:
1. Navigation or screens
2. Data schemas or state management
3. Notification or alarm handling
4. Hardware integrations (Camera, QR, Audio, Haptics)
5. UI components or theme conventions

**Must include a simultaneous update to the corresponding file(s) in this `Context/` folder.**
