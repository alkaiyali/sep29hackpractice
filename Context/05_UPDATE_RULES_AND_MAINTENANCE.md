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

