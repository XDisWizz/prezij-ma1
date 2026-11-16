// Pokrok studenta – ukládá se v prohlížeči (localStorage), volitelně se synchronizuje (src/sync.js).
import { syncSubset } from './syncmerge.js';
import { tierFromAcc } from './trophy.js';

const KEY = 'ma1-progress-v1';

const blank = () => ({
  xp: 0,
  streak: { count: 0, last: null },
  done: {},          // lessonId -> { at, acc, time, runs }
  weak: {},          // klíč generátoru -> skóre slabosti
  log: [],           // { k, ok, t, d } – poslední pokusy (pro statistiky tempa)
  fluency: [],       // { d, time, correct, total }
  seenWelcome: false,
  unlockAll: false,
  weakAt: 0,         // kdy se naposledy měnila slabá místa (pro slučování)
  epoch: 0,          // zvýší se při „Začít úplně od začátku“ (přebije starší pokrok na jiných zařízeních)
});

const listeners = new Set();

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...blank(), ...JSON.parse(raw) };
  } catch { /* soukromé okno apod. */ }
  return blank();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* nevadí */ }
  for (const fn of listeners) { try { fn(); } catch { /* posluchač nesmí rozbít ukládání */ } }
}

// den podle místního času (toISOString je v UTC, takže by se lekce po půlnoci připsala včerejšku)
const today = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

export const store = {
  get: () => state,
  set(patch) { Object.assign(state, patch); save(); },
  isDone: id => !!state.done[id],
  /** zaznamená dokončenou lekci, vrací { xp, streak, streakUp } */
  /** tier + mist (počet chyb) se ukládají jen u lekcí s pohárkem; pohárek i počet chyb se drží nejlepší */
  finishLesson(id, { acc, time, xp, avg, tier, mist }) {
    const prev = state.done[id];
    const rec = {
      at: Date.now(), acc: Math.max(acc, prev?.acc ?? 0), time: prev ? Math.min(time, prev.time) : time, runs: (prev?.runs ?? 0) + 1,
      lastAvg: avg ?? prev?.lastAvg, bestAvg: avg ? Math.min(avg, prev?.bestAvg ?? Infinity) : prev?.bestAvg,
    };
    if (tier != null) rec.tier = Math.max(tier, prev ? (prev.tier ?? tierFromAcc(prev.acc)) : 0);
    else if (prev?.tier != null) rec.tier = prev.tier;
    if (mist != null) rec.mist = Math.min(mist, prev?.mist ?? Infinity);
    else if (prev?.mist != null) rec.mist = prev.mist;
    state.done[id] = rec;
    state.xp += xp || 0;
    const t = today();
    let streakUp = false;
    if (state.streak.last !== t) {
      const gap = state.streak.last ? daysBetween(state.streak.last, t) : 99;
      // odpouštějící série: jeden vynechaný den série nepřeruší
      state.streak.count = gap <= 2 ? state.streak.count + 1 : 1;
      state.streak.last = t;
      streakUp = true;
    }
    save();
    return { streak: state.streak.count, streakUp };
  },
  record(key, ok, t) {
    if (!key) return;
    const base = key.split(':')[0];
    state.weak[base] = Math.max(0, (state.weak[base] ?? 0) + (ok ? -1 : 2));
    if (!state.weak[base]) delete state.weak[base];
    state.weakAt = Date.now();
    state.log.push({ k: base, ok, t: Math.round(t), d: Date.now() });
    if (state.log.length > 1500) state.log = state.log.slice(-1500);
    save();
  },
  weakKeys() {
    return Object.entries(state.weak).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  },
  addFluency(entry) { state.fluency.push(entry); save(); },
  streakAlive() {
    if (!state.streak.last) return 0;
    return daysBetween(state.streak.last, today()) <= 2 ? state.streak.count : 0;
  },
  doneToday: () => state.streak.last === today(),
  export: () => JSON.stringify(state),
  import(json) {
    const data = JSON.parse(json);
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('bad file');
    state = { ...blank(), ...data, epoch: state.epoch };
    save();
  },
  /** smaže pokrok; novější epocha zajistí, že ho synchronizace nevrátí z jiného zařízení */
  reset() { const keep = { theme: state.theme }; state = { ...blank(), ...keep, epoch: Date.now() }; save(); },
  /** synchronizace: část stavu, která jde na server */
  syncData: () => syncSubset(state),
  /** synchronizace: přepíše synchronizované položky sloučenými daty (bez upozornění posluchačů) */
  applySynced(data) {
    Object.assign(state, data);
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* nevadí */ }
  },
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};
