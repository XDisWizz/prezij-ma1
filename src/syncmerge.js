// Slučování pokroku mezi zařízeními. Čisté funkce bez DOM, testuje je tools/test-sync.mjs.
//
// Pravidlo: sloučený pokrok je vždycky aspoň tak dobrý jako každá ze stran,
// takže synchronizace nikdy nic nesmaže. Jediná výjimka je „Začít úplně od začátku“:
// to zvýší `epoch` a novější epocha přebije starší.

import { tierFromAcc } from './trophy.js';

const FLUENCY_PER_PATH = 10;   // posledních 10 pokusů na cestu + vždy ten nejlepší
const MAX_LESSONS = 2000;
const MAX_WEAK = 500;
const ID = /^[\w.:\/-]{1,80}$/;

const num = (x, lo = 0, hi = 1e12) => (typeof x === 'number' && Number.isFinite(x) && x >= lo && x <= hi ? x : undefined);
const isObj = x => x != null && typeof x === 'object' && !Array.isArray(x);
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** část stavu, která se posílá na server (log, motiv a „odemknout vše“ zůstávají v zařízení) */
export function syncSubset(s) {
  return {
    epoch: s.epoch || 0,
    xp: s.xp || 0,
    seenWelcome: !!s.seenWelcome,
    streak: s.streak,
    done: compactDone(s.done || {}),
    weak: s.weak,
    weakAt: s.weakAt || 0,
    fluency: trimFluency(s.fluency || []),
  };
}

/** Data ze serveru se berou jako nedůvěryhodná: zahodí se všechno, co nemá očekávaný tvar. */
export function sanitize(raw) {
  const r = isObj(raw) ? raw : {};
  const out = {
    epoch: num(r.epoch) ?? 0,
    xp: num(r.xp) ?? 0,
    seenWelcome: r.seenWelcome === true,
    streak: { count: 0, last: null },
    done: {},
    weak: {},
    weakAt: num(r.weakAt) ?? 0,
    fluency: [],
  };
  if (isObj(r.streak)) {
    out.streak.count = Math.floor(num(r.streak.count, 0, 1e5) ?? 0);
    out.streak.last = typeof r.streak.last === 'string' && DAY.test(r.streak.last) ? r.streak.last : null;
  }
  if (isObj(r.done)) {
    for (const [id, v] of Object.entries(r.done).slice(0, MAX_LESSONS)) {
      if (!ID.test(id) || !isObj(v)) continue;
      const e = { at: num(v.at) ?? 0, acc: num(v.acc, 0, 1) ?? 0, time: num(v.time, 0, 1e7) ?? 0, runs: Math.floor(num(v.runs, 0, 1e6) ?? 1) };
      const la = num(v.lastAvg, 0, 1e6), ba = num(v.bestAvg, 0, 1e6);
      if (la !== undefined) e.lastAvg = la;
      if (ba !== undefined) e.bestAvg = ba;
      const tier = num(v.tier, 0, 3), mist = num(v.mist, 0, 1e4);
      if (tier !== undefined) e.tier = Math.floor(tier);
      if (mist !== undefined) e.mist = Math.floor(mist);
      out.done[id] = e;
    }
  }
  if (isObj(r.weak)) {
    for (const [k, v] of Object.entries(r.weak).slice(0, MAX_WEAK)) {
      const n = num(v, 0, 1e4);
      if (ID.test(k) && n) out.weak[k] = Math.floor(n);
    }
  }
  if (Array.isArray(r.fluency)) {
    for (const f of r.fluency.slice(0, 500)) {
      if (!isObj(f) || typeof f.path !== 'string' || !ID.test(f.path)) continue;
      const d = num(f.d), time = num(f.time, 0, 1e7), correct = num(f.correct, 0, 1e4), total = num(f.total, 0, 1e4);
      if (d === undefined || time === undefined || correct === undefined || total === undefined) continue;
      out.fluency.push({ path: f.path, d, time, correct, total });
    }
    out.fluency = trimFluency(out.fluency);
  }
  return out;
}

const r1 = x => Math.round(x * 10) / 10;
const r3 = x => Math.round(x * 1000) / 1000;
/** zaokrouhlí čísla, ať je payload malý (desetiny sekundy a promile přesnosti stačí) */
function compactDone(done) {
  const out = {};
  for (const [id, v] of Object.entries(done)) {
    const e = { at: v.at ?? 0, acc: r3(v.acc ?? 0), time: r1(v.time ?? 0), runs: v.runs ?? 1 };
    if (v.lastAvg != null) e.lastAvg = r1(v.lastAvg);
    if (v.bestAvg != null) e.bestAvg = r1(v.bestAvg);
    if (v.tier != null) e.tier = v.tier;
    if (v.mist != null) e.mist = v.mist;
    out[id] = e;
  }
  return out;
}

const better = (a, b) => (a.total ? a.correct / a.total : 0) - (b.total ? b.correct / b.total : 0) || b.time - a.time;
function trimFluency(list) {
  const by = new Map();
  for (const f of list) {
    if (!by.has(f.path)) by.set(f.path, []);
    by.get(f.path).push(f);
  }
  const out = [];
  for (const arr of by.values()) {
    arr.sort((a, b) => a.d - b.d);
    const keep = arr.slice(-FLUENCY_PER_PATH);
    const best = arr.reduce((x, y) => (better(y, x) > 0 ? y : x));
    if (!keep.includes(best)) keep.unshift(best);
    out.push(...keep);
  }
  return out.sort((a, b) => a.d - b.d);
}

function mergeDone(a, b) {
  const out = { ...a };
  for (const [id, r] of Object.entries(b)) {
    const l = out[id];
    if (!l) { out[id] = { ...r }; continue; }
    const newer = (r.at ?? 0) > (l.at ?? 0) ? r : l;
    const e = {
      at: Math.max(l.at ?? 0, r.at ?? 0),
      acc: Math.max(l.acc ?? 0, r.acc ?? 0),
      time: Math.min(l.time ?? Infinity, r.time ?? Infinity),
      runs: Math.max(l.runs ?? 1, r.runs ?? 1),
    };
    if (!Number.isFinite(e.time)) e.time = 0;
    const lastAvg = newer.lastAvg ?? l.lastAvg ?? r.lastAvg;
    if (lastAvg !== undefined) e.lastAvg = lastAvg;
    const bests = [l.bestAvg, r.bestAvg].filter(x => x !== undefined);
    if (bests.length) e.bestAvg = Math.min(...bests);
    // pohárek: lepší z obou (záznam bez uloženého pohárku se hodnotí po staru podle přesnosti)
    if (l.tier !== undefined || r.tier !== undefined) e.tier = Math.max(l.tier ?? tierFromAcc(l.acc), r.tier ?? tierFromAcc(r.acc));
    const mists = [l.mist, r.mist].filter(x => x !== undefined);
    if (mists.length) e.mist = Math.min(...mists);
    out[id] = e;
  }
  return out;
}

function mergeStreak(a, b) {
  if (!a?.last) return { ...b };
  if (!b?.last) return { ...a };
  if (a.last === b.last) return { count: Math.max(a.count, b.count), last: a.last };
  return a.last > b.last ? { ...a } : { ...b };
}

/**
 * Sloučí lokální stav s daty ze serveru (už prošlými přes sanitize).
 * Vrací jen synchronizované položky; zbytek lokálního stavu se nemění.
 */
export function merge(local, remote) {
  const l = syncSubset(local), r = remote;
  if ((r.epoch || 0) > (l.epoch || 0)) return { ...r };   // na jiném zařízení se začínalo od nuly
  if ((l.epoch || 0) > (r.epoch || 0)) return l;          // tady se začínalo od nuly
  const seen = new Set();
  const fluency = [...l.fluency, ...r.fluency].filter(f => { const k = f.path + '|' + f.d; if (seen.has(k)) return false; seen.add(k); return true; });
  const weakNewer = (r.weakAt || 0) > (l.weakAt || 0) ? r : l;
  return {
    epoch: l.epoch || 0,
    xp: Math.max(l.xp || 0, r.xp || 0),
    seenWelcome: l.seenWelcome || r.seenWelcome,
    streak: mergeStreak(l.streak, r.streak),
    done: mergeDone(l.done || {}, r.done || {}),
    weak: { ...(weakNewer.weak || {}) },
    weakAt: weakNewer.weakAt || 0,
    fluency: trimFluency(fluency),
  };
}

/** stabilní JSON (seřazené klíče), aby se dalo porovnat „změnilo se něco?“ */
export function stableJson(x) {
  if (Array.isArray(x)) return '[' + x.map(stableJson).join(',') + ']';
  if (isObj(x)) return '{' + Object.keys(x).sort().map(k => JSON.stringify(k) + ':' + stableJson(x[k])).join(',') + '}';
  return JSON.stringify(x ?? null);
}
