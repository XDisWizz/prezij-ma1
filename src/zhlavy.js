// Režim „Z hlavy“: krátká kola jen na ťukání (bez papíru), s rozloženým opakováním.
// Tady je plánování opakování, stavba kola a pomocníci pro balíčky karet.
// Čisté funkce bez DOM, testuje je tools/audit-hlava.mjs.
//
// Dovednost (skill) = jeden druh rozhodnutí, např. „součin: sedí, nebo nesedí?“.
// Balíček cesty je seznam dovedností: { id, title, after, weak, make }
//   after = lekce, po které se dovednost odemkne (neopakuje se nic, co ještě nebylo)
//   weak  = klíč generátoru „na papír“, kterému se při chybě přičte slabé místo
//   make  = () => karta (typ 'swipe' nebo 'choice')
import { shuffle } from './ui.js';

// ------------------------------------------------------------ rozložené opakování
export const DAY = 86400000;
/** za kolik dní se dovednost vrátí podle stupně (0 = ještě nezažitá) */
export const STEPS = [0, 1, 3, 7, 16, 35];
export const TOP = STEPS.length - 1;
/** jak moc „v paměti“ dovednost na daném stupni je */
const LEVEL = [0, 0.35, 0.55, 0.7, 0.85, 1];

export const dayStart = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
export const isDue = (rec, now = Date.now()) => !rec || rec.due <= now;

/**
 * Nový záznam dovednosti po odpovědi, nebo null, když se nic nemění.
 * Správně a je čas opakovat → o stupeň výš. Správně dřív, než je čas → beze změny.
 * Špatně → o dva stupně níž a znovu zítra.
 */
export function schedule(rec, ok, now = Date.now()) {
  if (!ok) return { b: Math.max(0, (rec?.b ?? 0) - 2), due: dayStart(now) + DAY, at: now };
  if (rec && rec.due > now) return null;
  const b = Math.min(TOP, (rec?.b ?? 0) + 1);
  return { b, due: dayStart(now) + STEPS[b] * DAY, at: now };
}

/** 0–1: jak dobře dovednost teď drží (po termínu postupně slábne) */
export function strength(rec, now = Date.now()) {
  if (!rec) return 0;
  const base = LEVEL[rec.b] ?? 0;
  if (rec.due > now) return base;
  const late = (now - rec.due) / DAY / Math.max(1, STEPS[rec.b] || 1);
  return base * Math.max(0.4, 1 - 0.6 * late);
}

/** paměť sady dovedností v procentech (null = nic odemčeno) */
export function memoryOf(skills, mem, now = Date.now()) {
  if (!skills.length) return null;
  return Math.round(100 * skills.reduce((s, k) => s + strength(mem[k.key], now), 0) / skills.length);
}
export const dueCount = (skills, mem, now = Date.now()) => skills.filter(s => isDue(mem[s.key], now)).length;

/** za kolik dní je dovednost znovu na řadě (0 = dnes) */
export const dueInDays = (rec, now = Date.now()) => (rec ? Math.max(0, Math.round((dayStart(rec.due) - dayStart(now)) / DAY)) : 0);

/**
 * Sestaví kolo: nejdřív dovednosti, kterým vypršel termín (nejstarší první), pak pár nových,
 * a když je místo, i ty, co ještě čas mají. Vrací seznam dovedností (i opakovaně), promíchaný tak,
 * aby stejná dovednost nešla dvakrát za sebou.
 */
export function buildRound(skills, mem, now = Date.now(), n = 12) {
  const rec = s => mem[s.key];
  const byDue = (a, b) => rec(a).due - rec(b).due;
  const due = skills.filter(s => rec(s) && rec(s).due <= now).sort(byDue);
  const fresh = skills.filter(s => !rec(s));
  const later = skills.filter(s => rec(s) && rec(s).due > now).sort(byDue);
  const NEW = due.length >= 8 ? 2 : 4;   // nové dovednosti přibývají postupně
  const order = [...due, ...fresh.slice(0, NEW), ...later, ...fresh.slice(NEW)];
  if (!order.length) return [];
  const want = Math.min(order.length, n, Math.max(due.length + Math.min(fresh.length, NEW), 6));
  const chosen = order.slice(0, want);
  const total = Math.min(n, chosen.length * 3);
  const out = [];
  while (out.length < total) {
    let pass = shuffle(chosen);
    if (out.length && pass.length > 1 && pass[0] === out[out.length - 1]) pass = [...pass.slice(1), pass[0]];
    for (const s of pass) { if (out.length < total) out.push(s); }
  }
  return out;
}

// ------------------------------------------------------------ pomocníci pro karty
/** matematika na samostatném řádku */
export const M = tex => `$$${tex}$$`;

/** karta se švihem: dvě možnosti, vlevo a vpravo; correct = 'left' | 'right' */
export const sw = (key, prompt, show, left, right, correct, explain) => ({ type: 'swipe', key, prompt, show, left, right, correct, explain });
/** tvrzení: sedí / nesedí */
export const tf = (key, show, ok, explain, prompt = 'Sedí to?') => sw(key, prompt, show, 'Nesedí', 'Sedí', ok ? 'right' : 'left', explain);
/** otázka ano / ne */
export const yn = (key, prompt, show, ok, explain) => sw(key, prompt, show, 'Ne', 'Ano', ok ? 'right' : 'left', explain);
/** dvě možnosti, strany se losují */
export function two(key, prompt, show, right, wrong, explain) {
  return Math.random() < 0.5 ? sw(key, prompt, show, right, wrong, 'left', explain) : sw(key, prompt, show, wrong, right, 'right', explain);
}
/** výběr z možností (odpovídá se ťuknutím) */
export const ch = (key, prompt, show, options, explain) => ({ type: 'choice', key, prompt, show, options, explain });

/**
 * Možnosti: správná + špatné (label, nebo [label, proč je to špatně]).
 * Duplicitní popisky se vynechají, nejvýš `max` možností, pořadí náhodné.
 */
export function opts(right, wrongs, max = 4) {
  const out = [{ label: right, correct: true }];
  for (const w of wrongs) {
    if (out.length >= max) break;
    const [label, why] = Array.isArray(w) ? w : [w];
    if (label == null || out.some(o => o.label === label)) continue;
    out.push({ label, correct: false, why });
  }
  return shuffle(out);
}
/** pevná sada možností ve stálém pořadí (čte se rychleji než pokaždé jiné pořadí) */
export const fixed = (labels, right) => labels.map(label => ({ label, correct: label === right }));

/** hotová karta Ano/Ne (výběr ze dvou) → švih */
export function fromChoice(c) {
  const no = c.options.find(o => /^Ne(\b|,)/.test(o.label)), yes = c.options.find(o => o !== no);
  return { type: 'swipe', key: c.key, prompt: c.prompt, show: c.context ? M(c.context) : null, left: 'Ne', right: 'Ano', correct: yes.correct ? 'right' : 'left', explain: c.explain || yes.why };
}
