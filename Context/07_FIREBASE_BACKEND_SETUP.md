# 07 — Firebase Backend Setup (Care Circle Live Sync)

> **Optional by design.** Meddy runs fully offline on Zustand + AsyncStorage. Firebase is only wired in when `EXPO_PUBLIC_FIREBASE_*` keys exist — without them the Care Circle pill reads **“Local only”** and every sync call is a no-op.

---

## 1. What Syncs (and What Doesn’t)

| Synced through Firestore | Stays local |
|---|---|
| Care Circle roster (members, relations, avatars colors) | Medicine catalog (`useMedicineStore`) |
| Circle name + invite code | Alarm schedules / notifications |
| Dose events (`taken` / `skipped` / `snoozed`) with actor + timestamp | Vitals, refill inventory, custom sounds |
| Emoji cheers on dose events (one per member per dose) | Doctor PDF, history calendar |

Every device keeps its own AsyncStorage cache. The cloud is a mirror for the **circle**, not a replacement for offline-first storage.

---

## 2. Create the Firebase Project (~5 minutes)

1. Go to <https://console.firebase.google.com> → **Add project** (e.g. `meddy-hackathon`). Google Analytics is not required.
2. In the project, click the **Web** icon (`</>`) → register an app (e.g. `Meddy App`). Copy the `firebaseConfig` values.
3. **Enable Anonymous sign-in.** Preferred — deploy it as code (already configured in `firebase/firebase.json`):
   ```bash
   cd firebase && npx firebase-tools deploy --only auth
   ```
   Or toggle it once in the console: **Build → Authentication → Sign-in method → Anonymous → Enable**. The app signs each device in silently; nothing else is required.
4. **Build → Firestore Database → Create database.** Start in **production mode**, pick a region close to you.

> The free **Spark** plan covers Anonymous Auth and Firestore at family/hackathon scale. No billing account needed.

---

## 3. Configure the App

```bash
cp .env.example .env
```

Fill in the values copied from the Firebase Web app config:

```dotenv
EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=meddy-hackathon.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=meddy-hackathon
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=meddy-hackathon.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
EXPO_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef
```

Restart the bundler with a cleared cache so the new env vars are inlined:

```bash
npx expo start -c
```

---

## 4. Deploy the Security Rules

The rules live in [`firebase/firestore.rules`](../firebase/firestore.rules) and enforce that only circle members can read/write a circle’s data. `firebase/firebase.json` + `firebase/.firebaserc` are committed, so deploying is one command:

```bash
cd firebase
npx firebase-tools login            # once per machine
npx firebase-tools deploy --only auth,firestore:rules
```

`--only auth` applies the `auth.providers` block (Anonymous); `firestore:rules` publishes the rules. You can also paste `firestore.rules` into **Firestore → Rules → Publish** in the console.

> **Configured project:** this repo points at `onlypills-b105c` (`firebase/.firebaserc`). To use a different project, run `npx firebase-tools use --add` and update `.env`.

---

## 5. Firestore Data Model

```
invites/{inviteCode}                      # public lookup so a QR/typed code can resolve
  { circleId, circleName, inviterName, createdBy, createdAt, active }

circles/{circleId}
  { name, inviteCode, createdById, createdAt, memberUids: [uid, ...] }   # memberUids drives rules

circles/{circleId}/members/{memberId}     # memberId = uid for device members
  { id, uid?, name, relation, avatarColor, avatarUri?, isOwner, joinedAt }

circles/{circleId}/doseEvents/{eventId}   # eventId is deterministic → idempotent upsert
  { id, circleId, medicineId, medicineName, memberId, memberName,
    dateStr, timeStr, status, actionTime, actorUid, actorName,
    cheers: { [uid]: emoji }, updatedAt }
```

`eventId = normalize(medicineId__memberId__dateStr__timeStr)` — the same logical dose always lands on the same document, so two devices logging it upsert instead of duplicating.

**Member identity:** a member who joins from their own device is keyed by their Firebase `uid`; loved ones added by a caregiver (no device) keep a generated `member_…` id. Locally, the signed-in member is still `user_self`.

---

## 6. Code Map

| File | Role |
|---|---|
| `src/services/firebase.ts` | Lazy, config-gated init. Anonymous auth + Firestore (long-polling auto-detect). |
| `src/services/circleSync.ts` | Pure Firestore layer: create/join/subscribe/member/dose/cheer. No store imports. |
| `src/store/careCircleStore.ts` | Local-first store + Firestore mirror: `syncStatus`, `myUid`, `circleFeed`, `initSync`, `publishDoseEvent`, `sendRemoteCheer`. |
| `src/store/medicineStore.ts` | Calls `publishDoseEvent` on log and `retractDoseEvent` on dose undo. |
| `src/app/(tabs)/care-circle.tsx` | Sync status pill + merged live activity feed (local logs ∪ cloud events, deduped). |
| `scripts/firebase-smoke.mjs` | Live backend smoke test (`npm run firebase:smoke`). |
| `firebase/firestore.rules` | Membership-gated security rules. |
| `firebase/firebase.json` | Deploy targets: `firestore.rules` + `auth.providers.anonymous`. |
| `firebase/.firebaserc` | Default project alias (`onlypills-b105c`). |

Uses the **Firebase JS SDK** (`firebase`), not React Native Firebase — so it works in **Expo Go** with no development build.

---

## 7. Verifying Sync Works

**Automated (backend):**

```bash
npm run firebase:smoke
```

Signs in two anonymous users plus a signed-out client against the real project and asserts: circle create, invite read, join-by-invite, signed-out/non-member reads **and** writes denied, dose visibility across users, a live listener firing, and a cross-device cheer. Cleans up after itself and exits non-zero on failure.

**Manual (app):**

1. Open the app → **Care Circle** tab. The pill should read **“Live sync on · updates across devices”**.
2. Device A: create a circle → a QR code appears (the circle is now in Firestore).
3. Device B: **Scan QR** → roster shows both members on **both** devices.
4. Device B: log a dose (Take) → it appears on Device A’s Circle Activity feed with a **LIVE** badge.
5. Device A: tap a cheer → the count appears on Device B.
6. Undo a dose on Device B → the event disappears from Device A.

---

## 8. Security & Privacy Notes

- **Rules**: reads/writes to a circle require the caller’s uid to be in `memberUids`. A joiner may only add *themselves* to that list.
- **Invite codes** are readable by any signed-in user (that is how joining works). Codes are unguessable-ish (`MEDDY-XXX-1234`); treat them as secrets. Before production, add **Firebase App Check** and shorten invite lifetime.
- **Anonymous accounts**: the uid is tied to the app install + stored AsyncStorage. Reinstalling creates a new uid; the user rejoins with the invite code. Production upgrade path: `linkWithCredential` to email/Apple/Google so the account survives reinstalls.
- **Health data**: dose events live in Firestore. For a real launch review Google’s BAA/HIPAA posture and consider a dedicated project + data-retention policy.

---

## 9. Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| Pill stuck on **“Local only”** | `.env` missing or bundler not restarted → `npx expo start -c`. |
| **“Sync issue – tap to retry”** | Anonymous auth disabled, or rules not deployed. Check the Metro console for `permission-denied`. |
| `permission-denied` when creating a circle | Rules not published, or the project’s Firestore is in a different region than the app. Re-deploy rules. |
| Join says *“No Care Circle found”* | Wrong code, or the invite doc wasn’t created (the owner’s device was offline when creating). |
| Committed `.env` by accident | It is gitignored; rotate the API key in the Firebase console. |

---

## 10. Not Included (Roadmap)

- **Push escalation (2.2 Tier 3)** — needs Cloud Functions + a development build (remote push is unavailable in Expo Go on Android since SDK 53).
- **Medicine catalog sync** — only dose events sync today; editing a prescription on one device does not yet appear on others.
- **Avatar/photo upload** — Firestore stores avatar colors only (no Firebase Storage wiring).
- **Real (non-anonymous) accounts** — see §8.
- **Adopting pre-existing local circles** — a circle created while Firebase keys were absent stays local. Create a fresh circle (or re-scan) after configuring Firebase to have it mirrored.
