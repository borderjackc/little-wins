/* Little Wins sync: keeps the app's state in step between the two phones via Firebase.
 *
 * The app keeps one state object (LWApp.state()). Each habit, check-in, reaction, note
 * and joke is one Firestore document under couples/{cid}/{collection}/{id}; each
 * person's mood for a day is couples/{cid}/days/{date}_{who}. After every change the
 * app calls LWSync.changed(), we diff the state against what we last synced and write
 * only what changed. Changes from the other phone arrive through live listeners.
 */
import { initializeApp } from './vendor/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged, connectAuthEmulator } from './vendor/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache, persistentSingleTabManager, connectFirestoreEmulator,
  doc, getDoc, setDoc, deleteDoc, collection, onSnapshot,
} from './vendor/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const PAIR_KEY = 'littlewins-pair', KNOWN_KEY = 'littlewins-known';
const COLS = ['habits', 'goals', 'checkins', 'reactions', 'notes', 'jokes'];
const emulator = new URLSearchParams(location.search).has('emulator');

const fb = initializeApp(firebaseConfig);
const auth = getAuth(fb);
const db = initializeFirestore(fb, { localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() }) });
if (emulator) {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
}

const app = () => window.LWApp;
const read = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

let pair = read(PAIR_KEY);
let state = 'Connecting…', lastError = null;
let unsubs = [], ready = false, timer = null;
// What we last synced, per collection: id -> fingerprint. Kept in memory.
let base = {};
// Ids known to be on the server, kept on the phone so deletions made on the other phone
// while this one was closed are noticed on the next start.
let known = read(KNOWN_KEY) || {};

/* ---------- helpers ---------- */
const clean = (o) => JSON.parse(JSON.stringify(o));
function stable(v) {
  if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
  return JSON.stringify(v);
}
function print(o) { // short fingerprint of a document's content
  const s = stable(o); let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(36) + (h1 >>> 0).toString(36) + ':' + s.length;
}
function randomId(n) {
  const abc = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789', b = crypto.getRandomValues(new Uint8Array(n));
  return Array.from(b, (x) => abc[x % abc.length]).join('');
}
function parseLink(text) {
  const m = String(text).match(/([A-Za-z0-9]{16,})\.([A-Za-z0-9]{32,})/);
  if (!m) throw new Error('bad-link');
  return { cid: m[1], secret: m[2] };
}
const ref = (...p) => doc(db, 'couples', pair.cid, ...p);
const uid = () => new Promise((resolve, reject) => {
  const off = onAuthStateChanged(auth, (u) => {
    off();
    if (u) resolve(u.uid); else signInAnonymously(auth).then((c) => resolve(c.user.uid), reject);
  }, reject);
});
const fail = (e) => { lastError = e; state = 'Not syncing'; console.warn('[sync]', e); };

/* ---------- state <-> documents ---------- */
function daysOf(S) { // {date_who: {d, u, mood, note}}
  const out = {};
  const put = (d, u, k, v) => { if (!v) return; const id = d + '_' + u; (out[id] = out[id] || { d, u })[k] = v; };
  Object.entries(S.moods || {}).forEach(([d, m]) => Object.entries(m).forEach(([u, v]) => put(d, u, 'mood', v)));
  Object.entries(S.moodNotes || {}).forEach(([d, m]) => Object.entries(m).forEach(([u, v]) => put(d, u, 'note', v)));
  return out;
}
function docsOf(S, col) {
  if (col === 'days') return daysOf(S);
  const out = {}; (S[col] || []).forEach((x) => { out[x.id] = clean(x); }); return out;
}
function applyDay(S, id, data) { // data null = removed
  const [d, u] = id.split('_');
  S.moods[d] = S.moods[d] || {}; S.moodNotes[d] = S.moodNotes[d] || {};
  if (data && data.mood) S.moods[d][u] = data.mood; else delete S.moods[d][u];
  if (data && data.note) S.moodNotes[d][u] = data.note; else delete S.moodNotes[d][u];
}
function applyItem(S, col, id, data) {
  if (col === 'days') return applyDay(S, id, data);
  const list = S[col] = S[col] || [], i = list.findIndex((x) => x.id === id);
  if (!data) { if (i >= 0) list.splice(i, 1); return; }
  if (i >= 0) list[i] = data; else list.push(data);
}

/* ---------- pushing local changes ---------- */
function push() {
  timer = null;
  if (!ready || !pair || !app()) return;
  const S = app().state();
  for (const col of [...COLS, 'days']) {
    const cur = docsOf(S, col), b = base[col], k = new Set(known[col] || []);
    for (const [id, data] of Object.entries(cur)) {
      const f = print(data);
      if (b[id] === f) continue;
      b[id] = f; k.add(id);
      setDoc(ref(col, id), data).catch(fail);
    }
    for (const id of Object.keys(b)) {
      if (id in cur) continue;
      delete b[id]; k.delete(id);
      deleteDoc(ref(col, id)).catch(fail);
    }
    known[col] = [...k];
  }
  const names = clean(S.names || {});
  if (base.names !== print(names)) { base.names = print(names); setDoc(ref(), { names }, { merge: true }).catch(fail); }
  write(KNOWN_KEY, known);
}

/* ---------- listening for the other phone ---------- */
function start() {
  unsubs.forEach((u) => u()); unsubs = []; ready = false; base = {}; lastError = null; state = 'Connecting…';
  if (!pair || !pair.me) return;
  const cols = [...COLS, 'days'];
  let pending = cols.length + 1;
  const settled = () => { if (--pending === 0) { ready = true; state = 'Synced'; push(); } };

  uid().then(() => {
    let firstCouple = true;
    unsubs.push(onSnapshot(ref(), { includeMetadataChanges: true }, (snap) => {
      const names = snap.exists() ? snap.data().names : null;
      if (names && print(names) !== base.names) { base.names = print(names); app().setNames(names); app().refresh(); }
      if (snap.metadata.fromCache && ready) state = 'Offline, will sync';
      else if (ready) state = 'Synced';
      if (firstCouple) { firstCouple = false; settled(); }
    }, fail));

    cols.forEach((col) => {
      let first = true;
      base[col] = {};
      unsubs.push(onSnapshot(collection(db, 'couples', pair.cid, col), (snap) => {
        const S = app().state(), arrived = [];
        if (first) {
          // First look: the server copy wins. Keep only local items it has never seen
          // (made before sync started); drop ones the other phone deleted meanwhile.
          first = false;
          const remote = {}; snap.docs.forEach((d) => { remote[d.id] = d.data(); });
          const local = docsOf(S, col), seen = new Set(known[col] || []);
          for (const id of Object.keys(local)) if (!(id in remote) && seen.has(id)) applyItem(S, col, id, null);
          for (const [id, data] of Object.entries(remote)) {
            base[col][id] = print(data);
            if (!(id in local) || print(local[id]) !== base[col][id]) applyItem(S, col, id, data);
          }
          known[col] = Object.keys(remote);
          app().refresh(); settled(); return;
        }
        snap.docChanges().forEach((ch) => {
          const id = ch.doc.id;
          if (ch.type === 'removed') {
            if (id in base[col]) { delete base[col][id]; applyItem(S, col, id, null); }
            return;
          }
          const data = ch.doc.data(), f = print(data);
          if (base[col][id] === f) return; // our own write coming back
          base[col][id] = f; applyItem(S, col, id, data);
          if (ch.type === 'added' && !ch.doc.metadata.hasPendingWrites) arrived.push({ col, item: data });
        });
        if (Object.keys(base[col]).length) known[col] = Object.keys(base[col]);
        app().refresh();
        if (arrived.length) app().arrived(arrived);
      }, fail));
    });
  }).catch(fail);
}

/* ---------- public API for the app ---------- */
window.LWSync = {
  changed() { if (ready && !timer) timer = setTimeout(push, 400); },
  status() { return lastError ? 'Not syncing' : state; },
  explain(e) {
    const code = (e && (e.code || e.message)) || '';
    if (code === 'bad-link') return "That doesn't look like a Little Wins invite link.";
    if (/permission-denied/.test(code)) return "That invite link didn't work. Ask for a fresh copy.";
    if (/not-found/.test(code)) return "That space doesn't exist any more.";
    if (/unavailable|network|offline/i.test(code)) return "You're offline. Connect to the internet and try again.";
    if (/admin-restricted|operation-not-allowed|configuration-not-found/.test(code)) return 'Anonymous sign-in is not turned on in Firebase yet.';
    return 'Something went wrong: ' + code;
  },
  inviteLink() {
    return pair ? location.origin + location.pathname + '#join=' + pair.cid + '.' + pair.secret : null;
  },
  async create(names) {
    const me = await uid();
    const p = { cid: randomId(20), secret: randomId(32), me: 'j' };
    await setDoc(doc(db, 'couples', p.cid), { secret: p.secret, names, createdAt: Date.now() });
    await setDoc(doc(db, 'couples', p.cid, 'members', me), { secret: p.secret, at: Date.now() });
    pair = p; known = {}; write(PAIR_KEY, pair); write(KNOWN_KEY, known);
    setTimeout(start);
    return this.inviteLink();
  },
  async join(link) {
    const p = parseLink(link), me = await uid();
    const member = doc(db, 'couples', p.cid, 'members', me);
    const mine = await getDoc(member).catch(() => null);
    if (!mine || !mine.exists()) await setDoc(member, { secret: p.secret, at: Date.now() });
    const couple = await getDoc(doc(db, 'couples', p.cid));
    if (!couple.exists()) throw new Error('not-found');
    pair = { cid: p.cid, secret: p.secret, me: null }; known = {};
    write(PAIR_KEY, pair); write(KNOWN_KEY, known);
    return couple.data().names;
  },
  setMe(me) { pair.me = me; write(PAIR_KEY, pair); start(); },
};

start();
const hash = location.hash.match(/#join=(.+)$/);
if (hash && !(pair && pair.me)) { history.replaceState(null, '', location.pathname + location.search); app() && app().joinLink(decodeURIComponent(hash[1])); }
