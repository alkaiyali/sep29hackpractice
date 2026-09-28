/**
 * Live smoke test for the Meddy Care Circle Firestore backend.
 *
 * Exercises the real project with two anonymous users and one signed-out
 * client: membership rules, join-by-invite, dose sync, live listeners and
 * cross-device cheers. Cleans up after itself.
 *
 * Requires Firebase keys in `.env` (see Context/07_FIREBASE_BACKEND_SETUP.md):
 *   npm run firebase:smoke
 */
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (!config.apiKey || !config.projectId || !config.appId) {
  console.error('Missing EXPO_PUBLIC_FIREBASE_* keys. Run: node --env-file=.env scripts/firebase-smoke.mjs');
  process.exit(2);
}

const runId = Math.random().toString(36).slice(2, 8);
const CIRCLE_ID = `smoke_circle_${runId}`;
const INVITE = `MEDDY-SMK-${runId.toUpperCase()}`;
const MED = 'med_smoke_1';
const DATE = new Date().toISOString().slice(0, 10);
const TIME = '08:00';

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const expectDenied = async (name, fn) => {
  try {
    await fn();
    check(name, false, 'expected permission-denied, but it succeeded');
  } catch (err) {
    check(name, err?.code === 'permission-denied', err?.code ?? String(err));
  }
};

const appA = initializeApp(config, `A_${runId}`);
const appB = initializeApp(config, `B_${runId}`);
const appAnon = initializeApp(config, `anon_${runId}`);
const dbA = getFirestore(appA);
const dbB = getFirestore(appB);
const dbAnon = getFirestore(appAnon);

const uidA = (await signInAnonymously(getAuth(appA))).user.uid;
const uidB = (await signInAnonymously(getAuth(appB))).user.uid;
console.log(`project=${config.projectId}\nuserA=${uidA}\nuserB=${uidB}\n`);

const eventId = `${MED}__${uidB}__${DATE}__${TIME}`.replace(/[^a-zA-Z0-9_-]/g, '-');

try {
  const batch = writeBatch(dbA);
  batch.set(doc(dbA, 'circles', CIRCLE_ID), {
    name: 'Smoke Test Circle',
    inviteCode: INVITE,
    createdById: uidA,
    createdAt: new Date().toISOString(),
    memberUids: [uidA],
  });
  batch.set(doc(dbA, 'circles', CIRCLE_ID, 'members', uidA), {
    id: uidA, uid: uidA, name: 'Owner A', relation: 'Self',
    avatarColor: '#0D9488', isOwner: true, joinedAt: new Date().toISOString(),
  });
  batch.set(doc(dbA, 'invites', INVITE), {
    circleId: CIRCLE_ID, circleName: 'Smoke Test Circle', inviterName: 'Owner A',
    createdBy: uidA, createdAt: serverTimestamp(), active: true,
  });
  await batch.commit();
  check('owner creates circle + invite + member', true);

  await expectDenied('signed-out read is denied', () => getDoc(doc(dbAnon, 'circles', CIRCLE_ID)));
  await expectDenied('non-member read is denied', () => getDoc(doc(dbB, 'circles', CIRCLE_ID)));

  const invite = await getDoc(doc(dbB, 'invites', INVITE));
  check('joiner can read invite doc', invite.exists(), `circleId=${invite.data()?.circleId}`);

  await expectDenied('non-member write is denied', () =>
    setDoc(doc(dbB, 'circles', CIRCLE_ID, 'doseEvents', 'evil'), { status: 'taken' })
  );

  const join = writeBatch(dbB);
  join.set(
    doc(dbB, 'circles', CIRCLE_ID, 'members', uidB),
    {
      id: uidB, uid: uidB, name: 'Joiner B', relation: 'Self',
      avatarColor: '#0284C7', isOwner: false, joinedAt: new Date().toISOString(),
    },
    { merge: true }
  );
  join.update(doc(dbB, 'circles', CIRCLE_ID), { memberUids: arrayUnion(uidB) });
  await join.commit();
  check('joiner adds self to circle via invite', true);

  const circleB = await getDoc(doc(dbB, 'circles', CIRCLE_ID));
  check('member can read circle after join', circleB.exists() && circleB.data().memberUids.includes(uidB));

  const roster = await getDocs(collection(dbB, 'circles', CIRCLE_ID, 'members'));
  check('member can read roster', roster.size === 2, `${roster.size} members`);

  await setDoc(doc(dbB, 'circles', CIRCLE_ID, 'doseEvents', eventId), {
    id: eventId, circleId: CIRCLE_ID, medicineId: MED, medicineName: 'Lisinopril',
    memberId: uidB, memberName: 'Joiner B', dateStr: DATE, timeStr: TIME,
    status: 'taken', actionTime: new Date().toISOString(),
    actorUid: uidB, actorName: 'Joiner B', cheers: {},
  });
  const seenByA = await getDoc(doc(dbA, 'circles', CIRCLE_ID, 'doseEvents', eventId));
  check('dose logged by B is visible to A', seenByA.exists(), `status=${seenByA.data()?.status}`);

  const live = await new Promise((resolve) => {
    const timeout = setTimeout(() => { unsub(); resolve(false); }, 15000);
    const unsub = onSnapshot(collection(dbA, 'circles', CIRCLE_ID, 'doseEvents'), (snap) => {
      if (snap.docs.length > 0) { clearTimeout(timeout); unsub(); resolve(true); }
    });
  });
  check('live listener on A receives the event', live === true);

  await updateDoc(doc(dbA, 'circles', CIRCLE_ID, 'doseEvents', eventId), { [`cheers.${uidA}`]: '👍' });
  const cheered = await getDoc(doc(dbB, 'circles', CIRCLE_ID, 'doseEvents', eventId));
  check('cross-device cheer visible', cheered.data()?.cheers?.[uidA] === '👍');

  await expectDenied('non-member cannot edit circle settings', () =>
    updateDoc(doc(dbAnon, 'circles', CIRCLE_ID), { name: 'hijacked' })
  );
} catch (err) {
  check('unexpected failure', false, err?.code ?? String(err));
} finally {
  // Cleanup: invite first (its delete rule needs the circle to still exist).
  try {
    await deleteDoc(doc(dbA, 'invites', INVITE));
    const evs = await getDocs(collection(dbA, 'circles', CIRCLE_ID, 'doseEvents'));
    for (const d of evs.docs) await deleteDoc(d.ref);
    const ms = await getDocs(collection(dbA, 'circles', CIRCLE_ID, 'members'));
    for (const d of ms.docs) await deleteDoc(d.ref);
    await deleteDoc(doc(dbA, 'circles', CIRCLE_ID));
    console.log('\ncleanup: test docs removed');
  } catch (err) {
    console.log('\ncleanup warning:', err?.code ?? String(err));
  }

  await Promise.all([deleteApp(appA), deleteApp(appB), deleteApp(appAnon)]);
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length === 0 ? 0 : 1);
}
