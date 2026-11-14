// Generátory pro cestu "Průběh funkce + Taylor".
import * as S from '../sym.js';
import { ri, riNot, pick, shuffle } from '../ui.js';
import { frac, expE, NINF, INF as PINF, normalize, toTex } from '../intervals.js';
import { signTable } from '../numberline.js';

const { N, X, E, PI, add, mul, div, pow, neg, sub, fn, root, ln } = S;
const P = S.parse;
const simp = S.simplify;
const D = e => simp(S.d(e));
const T = e => S.tex(e);
const fx = e => `f(x) = ${T(e)}`;
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };

/** číslo → AST (zlomek, e^k) */
export function snap(v) {
  for (let k = -3; k <= 3; k++) if (k && Math.abs(Math.exp(k) - v) < 1e-9) return k === 1 ? E : pow(E, N(k));
  // jmenovatele až do 1000: Taylor s třetí odmocninou má koeficienty jako 5/81 nebo 14/81
  for (let q = 1; q <= 1000; q++) { const p = Math.round(v * q); if (Math.abs(p / q - v) < 1e-9) { const g = gcd(p, q); return simp(div(N(p / g), N(q / g))); } }
  return N(v);
}
/** číslo → krajní bod intervalu */
function ep(v) {
  if (v === Infinity) return PINF;
  if (v === -Infinity) return NINF;
  for (let k = -3; k <= 3; k++) if (k && Math.abs(Math.exp(k) - v) < 1e-9) return expE(k);
  for (let q = 1; q <= 1000; q++) { const p = Math.round(v * q); if (Math.abs(p / q - v) < 1e-9) return frac(p, q); }
  return { v, tex: S.fmtNum(v), txt: String(+v.toFixed(3)) };
}
const fin = v => Number.isFinite(v);

/**
 * Z derivace (nebo druhé derivace) d a seznamu důležitých bodů spočítá, kde je d > 0 a kde d < 0.
 * breaks = body, kde funkce není definovaná (otevřené), lo/hi = okraje definičního oboru.
 */
function signSets(f, d, crit, { breaks = [], lo = -Infinity, hi = Infinity } = {}) {
  const pts = [...new Set([...crit, ...breaks, lo, hi].filter(fin))].sort((a, b) => a - b);
  const bounds = [lo, ...pts.filter(p => p > lo && p < hi), hi];
  const pos = [], negs = [], signs = [], tests = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const a = bounds[i], b = bounds[i + 1];
    const mid = !fin(a) ? b - 1 : !fin(b) ? a + 1 : (a + b) / 2;
    const s = S.ev(d, mid);
    if (!fin(s)) continue;
    const closedA = fin(a) && fin(S.ev(f, a)) && !breaks.includes(a), closedB = fin(b) && fin(S.ev(f, b)) && !breaks.includes(b);
    const I = { a: ep(a), b: ep(b), ai: closedA, bi: closedB };
    (s > 0 ? pos : negs).push(I);
    signs.push(s > 0 ? '+' : '-');
    // bod na dosazení do postupu: když v úseku leží celé číslo, vezmeme ho (hezčí než zlomek)
    const nice = [Math.round(mid), Math.floor(mid), Math.ceil(mid)].find(v => v > a + 1e-9 && v < b - 1e-9 && fin(S.ev(d, v)));
    tests.push({ x: nice ?? mid, s });
  }
  return { pos: normalize(pos), neg: normalize(negs), signs, tests, pts: bounds.slice(1, -1) };
}
/** číslo do textu postupu: celé, polovina, jinak zaokrouhlené na 2 místa s desetinnou čárkou */
const tv = v => { const r = Math.round(v * 2) / 2; return Math.abs(r - v) < 1e-9 ? S.fmtNum(r) : String(Math.round(v * 100) / 100).replace('.', '{,}'); };
/** „f'(−3) > 0, f'(0) < 0, …“: dosazení jednoho čísla z každého úseku */
const testsText = (name, tests) => tests.map(t => `$${name}(${tv(t.x)}) ${t.s > 0 ? '> 0' : '< 0'}$`).join(', ');
// ---- pomocníci pro sazbu postupů ----
const R = String.raw;
const pm = v => `${v < 0 ? '-' : '+'} ${Math.abs(v)}`;                               // „+ 3“, „- 3“
const lf = r => (r === 0 ? 'x' : `(x ${r < 0 ? '+' : '-'} ${Math.abs(r)})`);         // činitel (x − r)
const xpl = p => (p === 0 ? 'x' : `x ${pm(p)}`);                                     // x + p
const sqT = p => (p === 0 ? 'x^2' : `(${xpl(p)})^2`);                                // (x + p)²
/** x² + px + q bez nulových členů a jedniček */
const quadT = (p, q) => `x^2${p ? ` ${p < 0 ? '-' : '+'} ${Math.abs(p) === 1 ? '' : Math.abs(p)}x` : ''}${q ? ` ${pm(q)}` : ''}`;
const ptsT = xs => xs.map(s => T(snap(s))).join(';\\ ');
function tableOf(label, pts, signs, lo) {
  if (fin(lo)) return ''; // tabulka jen pro celý R (jinak by mátla)
  return signTable(pts.map(p => ({ tex: T(snap(p)) })), [{ label, signs, result: true }]);
}

// =====================================================================
// Rodiny funkcí se známými stacionárními body
// =====================================================================
const FAM = [
  // kubika: f' = 6s(x-a)(x-b)
  // (solve = jak se řeší f'(x) = 0; ukazuje se v postupu)
  () => { const a = ri(-3, 2), b = ri(a + 1, 3), s = pick([1, -1]), C = ri(-5, 5); return { f: simp(add(mul(N(2 * s), pow(X, N(3))), mul(N(-3 * s * (a + b)), pow(X, N(2))), mul(N(6 * s * a * b), X), N(C))), stat: [a, b],
    solve: `Vyřeš $f'(x) = 0$. Vytkni $${6 * s}$: $f'(x) = ${6 * s}(${quadT(-(a + b), a * b)})$. Závorku rozlož na součin (hledáš dvě čísla se součinem $${a * b}$ a součtem $${a + b}$): $f'(x) = ${6 * s}${lf(a)}${lf(b)}$. Součin je nula, když je nula některý činitel: $x = ${a}$ nebo $x = ${b}$.` }; },
  // (x+p)^3 - 3k^2 x + C: f' = 3((x+p)^2 - k^2)
  () => { const p = ri(-2, 2), k = ri(1, 3), C = ri(-6, 6); return { f: simp(add(pow(add(X, N(p)), N(3)), mul(N(-3 * k * k), X), N(C))), stat: [-p - k, -p + k],
    solve: `Vyřeš $f'(x) = 0$: $3${sqT(p)} - ${3 * k * k} = 0$, tedy $${sqT(p)} = ${k * k}$, tedy $${xpl(p)} = ${k}$ nebo $${xpl(p)} = ${-k}$. Vyjde $x = ${-p + k}$ nebo $x = ${-p - k}$.` }; },
  // (x+p) e^x
  () => { const p = ri(-3, 3); return { f: simp(mul(add(X, N(p)), pow(E, X))), stat: [-p - 1],
    solve: R`Derivace součinu je $1 \cdot \mathrm{e}^x + (${xpl(p)})\,\mathrm{e}^x$. Vytkni $\mathrm{e}^x$: $f'(x) = \mathrm{e}^x(${xpl(p + 1)})$. $\mathrm{e}^x$ není nula nikdy, takže musí být $${xpl(p + 1)} = 0$, tedy $x = ${-p - 1}$.` }; },
  // (x+p) e^(-x)
  () => { const p = ri(-3, 3); return { f: simp(mul(add(X, N(p)), pow(E, neg(X)))), stat: [1 - p],
    solve: R`Derivace (součin a řetízek) je $1 \cdot \mathrm{e}^{-x} - (${xpl(p)})\,\mathrm{e}^{-x}$. Vytkni $\mathrm{e}^{-x}$: $f'(x) = \mathrm{e}^{-x}(${1 - p === 0 ? '-x' : `${1 - p} - x`})$. $\mathrm{e}^{-x}$ není nula nikdy, takže $x = ${1 - p}$.` }; },
  () => ({ f: P('x^2 e^x'), stat: [-2, 0], solve: R`Derivace součinu je $2x\,\mathrm{e}^x + x^2\mathrm{e}^x$. Vytkni $x\,\mathrm{e}^x$: $f'(x) = x\,\mathrm{e}^x(2 + x)$. $\mathrm{e}^x$ není nula nikdy, takže $x = 0$ nebo $x = -2$.` }),
  () => ({ f: P('x^2 e^(-x)'), stat: [0, 2], solve: R`Derivace (součin a řetízek) je $2x\,\mathrm{e}^{-x} - x^2\mathrm{e}^{-x}$. Vytkni $x\,\mathrm{e}^{-x}$: $f'(x) = x\,\mathrm{e}^{-x}(2 - x)$. $\mathrm{e}^{-x}$ není nula nikdy, takže $x = 0$ nebo $x = 2$.` }),
  // x - a ln x
  () => { const a = ri(1, 5); return { f: simp(sub(X, mul(N(a), ln(X)))), stat: [a], lo: 0,
    solve: R`Převeď na jeden zlomek: $f'(x) = 1 - \frac{${a}}{x} = \frac{x - ${a}}{x}$. Zlomek je nula, když je nula čitatel: $x = ${a}$.` }; },
  () => ({ f: P('ln(x)/x'), stat: [Math.E], lo: 0, solve: R`Derivace podílu: $f'(x) = \frac{\frac{1}{x} \cdot x - \ln x \cdot 1}{x^2} = \frac{1 - \ln x}{x^2}$. Zlomek je nula, když je nula čitatel: $\ln x = 1$, tedy $x = \mathrm{e}$.` }),
  // x/a^2 + 1/x
  () => { const a = ri(2, 4); return { f: simp(add(div(X, N(a * a)), div(N(1), X))), stat: [-a, a], breaks: [0],
    solve: R`$f'(x) = \frac{1}{${a * a}} - \frac{1}{x^2}$. Polož rovno nule: $\frac{1}{x^2} = \frac{1}{${a * a}}$, tedy $x^2 = ${a * a}$, tedy $x = ${a}$ nebo $x = ${-a}$.` }; },
  // 3x^4 - 4c x^3: f' = 12x^2(x-c) (v nule extrém není!)
  () => { const c = riNot(-2, 2, 0); return { f: simp(add(mul(N(3), pow(X, N(4))), mul(N(-4 * c), pow(X, N(3))), N(ri(0, 7)))), stat: [0, c], trap: 0,
    solve: `Vyřeš $f'(x) = 0$. Vytkni $12x^2$: $f'(x) = 12x^3 ${-12 * c < 0 ? '-' : '+'} ${Math.abs(12 * c)}x^2 = 12x^2${lf(c)}$. Nula pro $x = 0$ nebo $x = ${c}$.` }; },
  // x^2 - 2x - 4 ln x (z videa) zobecněno: x^2 - 2(r-1)... → f' = 2(x-r)(x+1)/x
  () => { const r = ri(2, 4); return { f: simp(add(pow(X, N(2)), mul(N(-(r - 1) * 2 + 0), X), mul(N(-2 * r), ln(X)))), stat: [r], lo: 0,
    solve: R`Převeď na jeden zlomek: $f'(x) = 2x - ${2 * (r - 1)} - \frac{${2 * r}}{x} = \frac{2x^2 - ${2 * (r - 1)}x - ${2 * r}}{x} = \frac{2(x - ${r})(x + 1)}{x}$. Čitatel je nula pro $x = ${r}$ nebo $x = -1$, ale $-1$ není v definičním oboru ($x > 0$).` }; },
];
export function family(idx) {
  for (;;) {
    const F = (idx != null ? FAM[idx] : pick(FAM))();
    if (!F.f) continue;
    const df = D(F.f);
    // kontrola: derivace je ve stacionárních bodech opravdu nula
    if (F.stat.some(s => Math.abs(S.ev(df, s)) > 1e-7)) continue;
    const sets = signSets(F.f, df, F.stat, { breaks: F.breaks || [], lo: F.lo ?? -Infinity });
    // extrémy: změna znaménka f'
    const mins = [], maxs = [];
    for (const s of F.stat) {
      const l = S.ev(df, s - 1e-4), r = S.ev(df, s + 1e-4);
      if (l < 0 && r > 0) mins.push(s); else if (l > 0 && r < 0) maxs.push(s);
    }
    return { ...F, df, inc: sets.pos, dec: sets.neg, signs: sets.signs, tests: sets.tests, pts: sets.pts, mins, maxs };
  }
}
/** společný začátek postupu: derivace → řešení f' = 0 → znaménka v úsecích */
function signSteps(F) {
  return [
    `Derivace: $f'(x) = ${T(F.df)}$.`,
    ...(F.solve ? [F.solve] : []),
    `Stacionární body: $x = ${ptsT(F.stat)}$${domText(F)}. Rozdělí osu na úseky a v každém má $f'$ pořád stejné znaménko.`,
    `Z každého úseku dosaď do $f'$ jedno číslo a podívej se jen na znaménko: ${testsText("f'", F.tests || [])}.${tableOf("f'(x)", F.pts, F.signs, F.lo)}`,
  ];
}

const domText = F => F.lo === 0 ? ' (definiční obor je $x > 0$)' : F.breaks?.length ? ` (pozor, v $x = ${F.breaks[0]}$ funkce není definovaná)` : '';

export function mono(F = family()) {
  const pre = signSteps(F), signStep = pre[pre.length - 1];
  const steps = [...pre, `Kde je $f' > 0$, funkce roste; kde je $f' < 0$, klesá. Rostoucí na $${toTex(F.inc)}$, klesající na $${toTex(F.dec)}$.`];
  return {
    type: 'guided', key: 'mono', badge: F.badge, fn: fx(F.f), prompt: 'Najdi intervaly monotonie',
    gsteps: [
      { kind: 'expr', title: 'Derivace', label: "$f'(x) =$", answer: F.df, original: F.f },
      { kind: 'points', title: "Kde je $f'(x) = 0$?", sub: 'Stacionární body (jen v definičním oboru).', label: '$x =$', answer: F.stat.map(snap) },
      { kind: 'interval', loose: true, title: 'Kde je funkce <b>rostoucí</b>?', info: `Kde je $f'(x) > 0$.${domText(F)} Na závorkách v krajních bodech tu nezáleží.`, label: '', answer: F.inc, why: signStep },
      { kind: 'interval', loose: true, final: true, title: 'Kde je <b>klesající</b>?', info: "Kde je $f'(x) < 0$.", label: '', answer: F.dec, why: signStep },
    ],
    steps, hint: "Rostoucí tam, kde f' > 0. Nulové body f' rozdělí osu na úseky.",
  };
}

export function extrema(F = family()) {
  const pre = signSteps(F);
  const change = `Extrém je tam, kde $f'$ mění znaménko: z $+$ na $-$ je maximum (funkce roste, pak klesá), z $-$ na $+$ minimum.${F.trap != null ? ` V bodě $${F.trap}$ se znaménko <b>nemění</b>, takže tam extrém není.` : ''}`;
  const steps = [...pre, change,
    `Minimum: $${F.mins.length ? ptsT(F.mins) : '\\text{žádné}'}$, maximum: $${F.maxs.length ? ptsT(F.maxs) : '\\text{žádné}'}$.`];
  const signWhy = pre[pre.length - 1] + ' ' + change;
  return {
    type: 'guided', key: 'extrema', badge: F.badge, fn: fx(F.f), prompt: 'Najdi lokální extrémy',
    gsteps: [
      { kind: 'expr', title: 'Derivace', label: "$f'(x) =$", answer: F.df, original: F.f },
      { kind: 'points', title: "Kde je $f'(x) = 0$?", label: '$x =$', answer: F.stat.map(snap) },
      { kind: 'points', title: 'Lokální <b>minimum</b> v bodech', info: "$f'$ se mění z $-$ na $+$. Když žádné není, klikni na „žádné“.", label: '$x =$', answer: F.mins.map(snap), why: signWhy },
      { kind: 'points', final: true, title: 'Lokální <b>maximum</b> v bodech', info: "$f'$ se mění z $+$ na $-$.", label: '$x =$', answer: F.maxs.map(snap), why: signWhy },
    ],
    steps, hint: 'Extrém je jen tam, kde f′ mění znaménko.',
  };
}

// =====================================================================
// Konvexita a inflexe
// =====================================================================
const IFAM = [
  // f'' = 12(x-a)(x-b)
  () => { const a = ri(-2, 1), b = ri(a + 1, 3); return { f: simp(add(P(`x^4 - (${2 * (a + b)})x^3 + (${6 * a * b})x^2`), mul(N(ri(-5, 5)), X), N(ri(-5, 5)))), infl: [a, b], z: [a, b],
    solve: `Vyřeš $f''(x) = 0$. Vytkni $12$: $f''(x) = 12(${quadT(-(a + b), a * b)}) = 12${lf(a)}${lf(b)}$. Nula pro $x = ${a}$ nebo $x = ${b}$.` }; },
  // f'' = 60x^2(x-c): inflexe jen v c
  () => { const c = riNot(-2, 2, 0); return { f: simp(add(mul(N(3), pow(X, N(5))), mul(N(-5 * c), pow(X, N(4))), mul(N(ri(-9, 9)), X))), infl: [c], z: [0, c], trap: 0,
    solve: `Vyřeš $f''(x) = 0$. Vytkni $60x^2$: $f''(x) = 60x^3 ${-60 * c < 0 ? '-' : '+'} ${Math.abs(60 * c)}x^2 = 60x^2${lf(c)}$. Nula pro $x = 0$ nebo $x = ${c}$.` }; },
  // (x+p) e^x: f'' = (x+p+2) e^x
  () => { const p = ri(-3, 3); return { f: simp(mul(add(X, N(p)), pow(E, X))), infl: [-p - 2], z: [-p - 2],
    solve: R`Vytkni $\mathrm{e}^x$: $f'(x) = \mathrm{e}^x(${xpl(p + 1)})$ a stejně $f''(x) = \mathrm{e}^x(${xpl(p + 2)})$. $\mathrm{e}^x$ není nula nikdy, takže $f''(x) = 0$ jen pro $x = ${-p - 2}$.` }; },
  // ln(x^2 + a^2): inflexe ±a
  () => { const a = ri(1, 3); return { f: simp(ln(add(pow(X, N(2)), N(a * a)))), infl: [-a, a], z: [-a, a],
    solve: R`$f'(x) = \frac{2x}{x^2 + ${a * a}}$ (řetízek), druhá derivace podílem: $f''(x) = \frac{2(x^2 + ${a * a}) - 2x \cdot 2x}{(x^2 + ${a * a})^2} = \frac{${2 * a * a} - 2x^2}{(x^2 + ${a * a})^2}$. Zlomek je nula, když je nula čitatel: $x^2 = ${a * a}$, tedy $x = ${a}$ nebo $x = ${-a}$.` }; },
  // x^3 + 3m x^2 + ...: f'' = 6x + 6m
  () => { const m = ri(-3, 3); return { f: simp(add(pow(X, N(3)), mul(N(3 * m), pow(X, N(2))), mul(N(ri(-6, 6)), X), N(ri(-5, 5)))), infl: [-m], z: [-m],
    solve: `Vyřeš $f''(x) = 0$: $6x ${pm(6 * m)} = 0$, tedy $x = ${-m}$.`.replace('6x + 0 = 0', '6x = 0') }; },
];
export function inflection(i) {
  const F = (i != null ? IFAM[i] : pick(IFAM))();
  const d2 = D(D(F.f));
  const sets = signSets(F.f, d2, F.z);
  const signStep = `Z každého úseku dosaď do $f''$ jedno číslo: ${testsText("f''", sets.tests)}.${tableOf("f''(x)", sets.pts, sets.signs)} $+$ znamená konvexní ∪, $-$ konkávní ∩. Inflexe je tam, kde se znaménko mění.${F.trap != null ? ` V bodě $${F.trap}$ se nemění, takže tam inflexe není!` : ''}`;
  const steps = [`Nejdřív první derivace: $f'(x) = ${T(D(F.f))}$.`, `Zderivuj ještě jednou: $f''(x) = ${T(d2)}$.`,
    ...(F.solve ? [F.solve] : []),
    `Nulové body $f''$: $x = ${ptsT(F.z)}$. Rozdělí osu na úseky.`,
    signStep,
    `Inflexní body: $${ptsT(F.infl)}$. Konvexní na $${toTex(sets.pos)}$.`];
  return {
    type: 'guided', key: 'inflection', badge: F.badge, fn: fx(F.f), prompt: 'Najdi inflexní body a konvexitu',
    gsteps: [
      { kind: 'expr', title: 'Druhá derivace', label: "$f''(x) =$", answer: d2, original: F.f },
      { kind: 'points', title: "Kde je $f''(x) = 0$?", label: '$x =$', answer: F.z.map(snap) },
      { kind: 'points', title: '<b>Inflexní</b> body', info: "Jen tam, kde $f''$ mění znaménko.", label: '$x =$', answer: F.infl.map(snap), why: signStep },
      { kind: 'interval', loose: true, final: true, title: 'Kde je funkce <b>konvexní</b> (∪)?', info: "Kde je $f''(x) > 0$.", label: '', answer: sets.pos, why: signStep },
    ],
    steps, hint: "f'' > 0 → konvexní ∪, f'' < 0 → konkávní ∩. Inflexe = změna znaménka f''.",
  };
}

// =====================================================================
// Asymptoty
// =====================================================================
const lin = r => r === 0 ? X : add(X, N(-r));
export function vertAsym() {
  const t1 = ri(-3, 3), t2 = riNot(-3, 3, t1), u = riNot(-4, 4, t1, t2);
  const cancel = Math.random() < 0.7;
  const numE = expand2(cancel ? [t1, u] : [u, u]), denE = expand2([t1, t2]);
  const f = div(numE, denE);
  const ans = cancel ? [t2] : [t1, t2].sort((a, b) => a - b);
  const steps = [`Jmenovatel $${T(denE)} = (${T(lin(t1))})(${T(lin(t2))})$ je nula v bodech $${t1}$ a $${t2}$.`,
    cancel ? `Čitatel $= (${T(lin(t1))})(${T(lin(u))})$. Společný činitel $(${T(lin(t1))})$ se zkrátí, v bodě $${t1}$ je jen „díra“, ne asymptota.` : 'Čitatel tam nulový není, takže v obou bodech jde funkce do $\\pm\\infty$.',
    `Svislé asymptoty: $x = ${ans.join(',\\ x = ')}$.`];
  return {
    type: 'guided', key: 'vertAsym', fn: fx(f), prompt: 'Najdi svislé asymptoty',
    gsteps: [
      { kind: 'points', title: 'Kde je jmenovatel nulový?', label: '$x =$', answer: [t1, t2].map(v => N(v)) },
      { kind: 'points', final: true, title: 'Svislé asymptoty $x = \\dots$', info: 'Rozlož i čitatel. Když se činitel zkrátí, asymptota tam není.', label: '$x =$', answer: ans.map(v => N(v)), why: steps[1] },
    ],
    steps, hint: 'Asymptota jen tam, kde limita je ±∞. Zkracování ji „zruší“.',
  };
}
/** (x - r1)(x - r2) roznásobené */
function expand2([r1, r2]) { const p = -(r1 + r2), q = r1 * r2; return simp(add(pow(X, N(2)), mul(N(p), X), N(q))); }

export function obliqueAsym(given) {
  let a, b, c, d;
  if (given) ({ a, b, c, d } = given);
  else do { a = ri(1, 4); b = ri(-6, 6); c = ri(-9, 9); d = riNot(-3, 3, 0); } while (c + d * (b + a * d) === 0);
  const f = div(simp(add(mul(N(a), pow(X, N(2))), mul(N(b), X), N(c))), simp(add(X, N(-d))));
  const k = a, q = b + a * d;
  const kx = k === 1 ? 'x' : `${k}x`;
  const line = simp(add(mul(N(k), X), N(q)));
  const where = given?.where || '\\pm\\infty';
  return {
    type: 'guided', key: given?.key || 'obliqueAsym', badge: given?.badge, fn: fx(f), prompt: `Najdi šikmou asymptotu v $${where}$`,
    gsteps: [
      { kind: 'expr', numeric: true, title: 'Směrnice $k = \\lim \\frac{f(x)}{x}$', info: 'Stupeň nahoře je o jedna větší než dole, takže stačí poměr čísel u nejvyšších mocnin.', label: '$k =$', answer: N(k) },
      { kind: 'expr', numeric: true, title: 'Posun $q = \\lim (f(x) - kx)$', info: `$f(x) - ${kx} = \\frac{\\dots}{x ${d < 0 ? '+' : '-'} ${Math.abs(d)}}$, opět poměr čísel u nejvyšších mocnin.`, label: '$q =$', answer: N(q) },
      { kind: 'expr', final: true, title: 'Asymptota', label: '$y =$', answer: line },
    ],
    steps: [`$k = \\lim \\frac{f(x)}{x} = ${k}$.`, `$f(x) - ${kx} = \\frac{${T(simp(add(mul(N(b + a * d), X), N(c))))}}{${T(simp(add(X, N(-d))))}} \\to ${q}$.`, `$y = ${T(line)}$`],
    hint: 'k = lim f(x)/x, q = lim (f(x) − kx).',
  };
}

export function horizAsym() {
  const a = riNot(-5, 6, 0), c = ri(1, 4), b = ri(-5, 5), d = ri(1, 9), deg = pick([1, 2]);
  const f = div(simp(add(mul(N(a), pow(X, N(deg))), N(b))), simp(add(mul(N(c), pow(X, N(deg))), N(d))));
  const val = snap(a / c);
  return {
    type: 'expr', key: 'horizAsym', fn: fx(f), prompt: 'Najdi asymptotu v $\\pm\\infty$', label: '$y =$', answer: val,
    steps: [`Stejný stupeň nahoře i dole, takže limita v $\\pm\\infty$ je poměr čísel u nejvyšších mocnin: $${a}$ lomeno $${c}$, tedy $${T(val)}$.`, `Vodorovná asymptota $y = ${T(val)}$ (směrnice $k = 0$).`],
    hint: 'Stejné stupně → poměr čísel u nejvyšších mocnin.',
  };
}

// =====================================================================
// Globální extrémy na intervalu
// =====================================================================
export function globalExt(given) {
  for (;;) {
    let f, stat, lo, hi, solve;
    if (given) ({ f, stat, lo, hi, solve } = given);
    else {
      const m = ri(-2, 2), k = ri(1, 3), C = ri(-5, 9);
      f = simp(add(pow(X, N(3)), mul(N(3 * m), pow(X, N(2))), mul(N(3 * (m * m - k * k)), X), N(C)));
      stat = [-m - k, -m + k];
      solve = `Vyřeš $f'(x) = 0$. Vytkni $3$: $f'(x) = 3(${quadT(2 * m, m * m - k * k)}) = 3${lf(-m - k)}${lf(-m + k)}$. Nula pro $x = ${-m - k}$ nebo $x = ${-m + k}$.`;
      lo = ri(-m - k - 3, -m - k + 1); hi = ri(Math.max(lo + 2, -m + k - 1), -m + k + 3);
    }
    const df = D(f);
    const inside = stat.filter(s => s > lo && s < hi);
    const cand = [lo, ...inside, hi];
    const vals = cand.map(x => S.ev(f, x));
    const mn = Math.min(...vals), mx = Math.max(...vals);
    if (vals.filter(v => Math.abs(v - mn) < 1e-9).length > 1 || vals.filter(v => Math.abs(v - mx) < 1e-9).length > 1) { if (given) break; continue; }
    const xmin = cand[vals.indexOf(mn)], xmax = cand[vals.indexOf(mx)];
    const table = `<table class="rules"><tr><th>$x$</th>${cand.map(c => `<td>$${T(snap(c))}$</td>`).join('')}</tr><tr><th>$f(x)$</th>${vals.map(v => `<td>$${T(snap(v))}$</td>`).join('')}</tr></table>`;
    return {
      type: 'guided', key: given?.key || 'globalExt', badge: given?.badge, fn: `${fx(f)},\\quad M = \\langle ${T(snap(lo))}, ${T(snap(hi))} \\rangle`, prompt: 'Najdi globální extrémy na $M$',
      gsteps: [
        { kind: 'expr', title: 'Derivace', label: "$f'(x) =$", answer: df, original: f },
        { kind: 'points', title: 'Stacionární body <b>uvnitř</b> $M$', info: 'Body mimo interval nepočítej.', label: '$x =$', answer: inside.map(snap) },
        { kind: 'points', title: 'Globální <b>minimum</b> v bodě', info: `Kandidáti: krajní body a stacionární body. Porovnej hodnoty:${table}`, label: '$x =$', answer: [snap(xmin)] },
        { kind: 'points', final: true, title: 'Globální <b>maximum</b> v bodě', label: '$x =$', answer: [snap(xmax)] },
      ],
      steps: [`Derivace: $f'(x) = ${T(df)}$.`, ...(solve ? [solve] : []),
        `Stacionární body: $${ptsT(stat)}$. Uvnitř intervalu $M$ z nich leží: $${inside.length ? ptsT(inside) : '\\text{žádný}'}$.`,
        `Kandidáti na extrém jsou stacionární body uvnitř $M$ a oba krajní body. Dosaď je do $f$ (do původní funkce, ne do derivace):${table}`,
        `Nejmenší hodnota je v $x = ${T(snap(xmin))}$ (globální minimum), největší v $x = ${T(snap(xmax))}$ (globální maximum).`],
      hint: 'Kandidáti = krajní body + stacionární body uvnitř. Spočítej hodnoty a porovnej.',
    };
  }
}

// =====================================================================
// Taylorův polynom
// =====================================================================
const TFAM = [
  () => { const a = ri(1, 4), b = ri(-3, 3), c = ri(-3, 3); return { f: simp(add(mul(N(a), pow(E, X)), mul(N(b), fn('sin', X)), mul(N(c), fn('cos', X)))), x0: N(0) }; },
  () => { const a = riNot(-3, 3, 0), b = riNot(-3, 3, 0); return { f: simp(add(mul(N(a), fn('sin', X)), mul(N(b), fn('cos', X)))), x0: pick([PI, div(PI, N(2))]) }; },
  // mocniny x^(p/q): zadání se ukáže s odmocninou, derivace se počítají z mocninného tvaru (vyjdou čitelně)
  () => { const r = pick([[1, 2], [-1, 2], [1, 3], [-1, 3], [-1, 1], [2, 3], [3, 2]]); return { f: r[1] === 1 ? div(N(1), X) : r[0] === 1 && r[1] === 2 ? root(2, X) : r[0] === 1 && r[1] === 3 ? root(3, X) : r[0] === -1 ? div(N(1), root(r[1], X)) : pow(X, N(r[0] / r[1])), fd: pow(X, N(r[0] / r[1])), x0: N(1) }; },
  () => ({ f: ln(X), x0: N(1) }),
  () => { const a = riNot(-3, 3, 0); return { f: simp(pow(E, mul(N(a), X))), x0: N(0) }; },
  () => { const a = ri(1, 3); return { f: simp(ln(add(N(1), mul(N(a), X)))), x0: N(0) }; },
  () => ({ f: P('1/(1-x)'), x0: N(0) }),
];
export function taylor(given) {
  const { f, x0, fd } = given || pick(TFAM)();
  const n = given?.n ?? pick([2, 2, 3]);
  const xv = S.ev(x0, 0);
  const ders = [fd || f];
  for (let k = 1; k <= n; k++) ders.push(D(ders[k - 1]));
  const vals = ders.map(d => snap(S.ev(d, xv)));
  let fact = 1;
  const terms = [];
  vals.forEach((v, k) => {
    if (k) fact *= k;
    const c = S.ev(v, 0) / fact;
    if (Math.abs(c) < 1e-12) return;
    const base = xv === 0 ? X : sub(X, x0);
    const part = k === 0 ? null : k === 1 ? base : pow(base, N(k));
    const cAbs = snap(Math.abs(c));
    const isOne = Math.abs(Math.abs(c) - 1) < 1e-12;
    const t = !part ? cAbs : isOne ? part : mul(cAbs, part);
    terms.push(c < 0 ? neg(t) : t);
  });
  const Tn = terms.length ? (terms.length === 1 ? terms[0] : add(...terms)) : N(0);
  const x0t = T(x0);
  const shift = xv === 0 ? 'x' : `(x - ${x0t})`;
  const formula = `T_${n}(x) = f(${x0t}) + f'(${x0t})\\,${shift} + \\frac{f''(${x0t})}{2!}${shift}^2${n === 3 ? ` + \\frac{f'''(${x0t})}{3!}${shift}^3` : ''}`;
  const names = ['f', "f'", "f''", "f'''"];
  return {
    type: 'guided', key: given?.key || 'taylor', badge: given?.badge, fn: `${fx(f)},\\quad x_0 = ${x0t},\\quad n = ${n}`, prompt: 'Najdi Taylorův polynom',
    gsteps: [
      ...vals.map((v, k) => ({ kind: 'expr', numeric: true, title: `$${names[k]}(${x0t})$`, info: k ? `$${names[k]}(x) = ${T(ders[k])}$` : fd ? `Přepiš na mocninu: $f(x) = x^{${S.fmtNum(fd.e.v)}}$, pak se derivuje pravidlem $(x^n)' = n x^{n-1}$.` : '', label: `$${names[k]}(${x0t}) =$`, answer: v })),
      { kind: 'expr', final: true, title: `Polynom $T_${n}(x)$`, info: `$${formula}$`, label: `$T_${n}(x) =$`, answer: Tn },
    ],
    steps: [ders.slice(1).map((d, k) => `$${names[k + 1]}(x) = ${T(d)}$`).join(', '), `Hodnoty v $x_0 = ${x0t}$: ${vals.map((v, k) => `$${names[k]} = ${T(v)}$`).join(', ')}.`, `$${formula}$`, `$T_${n}(x) = ${T(Tn)}$`],
    hint: 'Spočítej derivace v bodě x₀ a dosaď do vzorce. Nezapomeň dělit faktoriálem.',
    answer: Tn,
  };
}
/** rozvoj polynomu podle mocnin (x - x0): jen koeficienty */
export function polyShift() {
  const x0 = pick([1, -1, 2]);
  const co = [ri(-4, 4), ri(-5, 5), ri(-5, 5), pick([1, 2, -1])];
  const p = simp(add(N(co[0]), mul(N(co[1]), X), mul(N(co[2]), pow(X, N(2))), mul(N(co[3]), pow(X, N(3)))));
  const ders = [p, D(p), D(D(p)), D(D(D(p)))];
  const fac = [1, 1, 2, 6];
  const c = ders.map((d, k) => snap(S.ev(d, x0) / fac[k]));
  const sh = x0 < 0 ? `(x + ${-x0})` : `(x - ${x0})`;
  // výsledný rozvoj vysázený bez „+ -3“ a bez nulových členů
  const base = add(X, N(-x0));
  const parts = c.map((v, k) => { const cv = S.ev(v, 0); if (!cv) return null; const pwr = k === 0 ? null : k === 1 ? base : pow(base, N(k)); const t = !pwr ? N(Math.abs(cv)) : Math.abs(cv) === 1 ? pwr : mul(N(Math.abs(cv)), pwr); return cv < 0 ? neg(t) : t; }).filter(Boolean);
  const shifted = parts.length > 1 ? add(...parts) : parts[0] || N(0);
  return {
    type: 'guided', key: 'polyShift', fn: fx(p), prompt: `Rozviň podle mocnin $${sh}$`,
    gsteps: c.map((v, k) => ({ kind: 'expr', numeric: true, final: k === 3, title: k === 0 ? `Číslo u $${sh}^0$: to je $f(${x0})$` : `Koeficient u $${sh}${k > 1 ? `^{${k}}` : ''}$`, info: k ? `$= \\frac{f^{(${k})}(${x0})}{${k}!}$` : '', label: '', answer: v })),
    steps: [`Koeficienty jsou $\\frac{f^{(k)}(${x0})}{k!}$: $${c.map(v => T(v)).join(',\\ ')}$.`, `$f(x) = ${T(shifted)}$`],
    hint: 'Je to Taylorův polynom stupně 3 se středem v x₀. Vyjde přesně ten samý polynom.',
  };
}

// =====================================================================
// Celý průběh (kubika)
// =====================================================================
export function fullRun() {
  const F = family(pick([0, 1]));
  const d2 = D(F.df);
  const z2 = (F.stat[0] + F.stat[1]) / 2;   // u kubiky leží inflexe přesně v půlce
  return {
    type: 'guided', key: 'fullRun', fn: fx(F.f), prompt: 'Průběh funkce: všechno najednou',
    gsteps: [
      { kind: 'expr', title: 'První derivace', label: "$f'(x) =$", answer: F.df, original: F.f },
      { kind: 'points', title: 'Stacionární body', label: '$x =$', answer: F.stat.map(snap) },
      { kind: 'interval', loose: true, title: '<b>Rostoucí</b> na', label: '', answer: F.inc },
      { kind: 'points', title: 'Lokální <b>minimum</b>', label: '$x =$', answer: F.mins.map(snap) },
      { kind: 'points', title: 'Lokální <b>maximum</b>', label: '$x =$', answer: F.maxs.map(snap) },
      { kind: 'expr', title: 'Druhá derivace', label: "$f''(x) =$", answer: d2 },
      { kind: 'points', final: true, title: '<b>Inflexní</b> bod', label: '$x =$', answer: [snap(z2)] },
    ],
    steps: [...signSteps(F),
      `Kde je $f' > 0$, funkce roste: rostoucí na $${toTex(F.inc)}$, klesající na $${toTex(F.dec)}$.`,
      `Extrémy jsou tam, kde $f'$ mění znaménko: minimum v $${F.mins.length ? ptsT(F.mins) : '\\text{žádné}'}$, maximum v $${F.maxs.length ? ptsT(F.maxs) : '\\text{žádné}'}$.`,
      `Druhá derivace: $f''(x) = ${T(d2)}$. Je nulová pro $x = ${T(snap(z2))}$ a mění tam znaménko, takže je tam inflexní bod.`],
    hint: 'Pořád stejný recept: f′ → stacionární body → znaménka → extrémy → f″ → inflexe.',
  };
}

// =====================================================================
// Koncepční otázky
// =====================================================================
const CONCEPTS = [
  ["Když je $f'(x) > 0$ na intervalu, funkce je tam…", ['rostoucí', 'klesající', 'konvexní', 'konstantní'], 0, 'Kladná derivace = kladný sklon = funkce roste.'],
  ["Když je $f''(x) > 0$, funkce je…", ['konvexní ∪', 'konkávní ∩', 'rostoucí', 'klesající'], 0, "Druhá derivace říká, jak se graf ohýbá. $f'' > 0$ je ∪."],
  ["$f'$ se v bodě mění z $+$ na $-$. Co tam je?", ['lokální maximum', 'lokální minimum', 'inflexe', 'nic'], 0, 'Funkce nejdřív roste, pak klesá: vrchol kopce.'],
  ["$f'$ se v bodě mění z $-$ na $+$. Co tam je?", ['lokální minimum', 'lokální maximum', 'inflexe', 'nic'], 0, 'Nejdřív klesá, pak roste: dno údolí.'],
  ["$f'(x_0) = 0$, ale znaménko $f'$ se kolem $x_0$ nemění. Co tam je?", ['žádný extrém', 'lokální maximum', 'lokální minimum', 'asymptota'], 0, 'Extrém je jen tam, kde se mění znaménko. Příklad: $x^3$ v nule.'],
  ['Kde hledat svislé asymptoty?', ['kde funkce není definovaná a limita je $\\pm\\infty$', 'kde $f\'(x) = 0$', 'kde $f(x) = 0$', 'v nekonečnu'], 0, 'Typicky nulové body jmenovatele (které se nezkrátí).'],
  ['Kde hledat globální extrémy na uzavřeném intervalu?', ['ve stacionárních bodech uvnitř a v krajních bodech', 'jen ve stacionárních bodech', 'jen v krajních bodech', 'tam, kde $f = 0$'], 0, 'Kandidáti jsou stacionární body uvnitř intervalu a oba krajní body.'],
  ['Inflexní bod je tam, kde…', ["$f''$ mění znaménko", "$f'' = 0$ (vždycky)", "$f' = 0$", "$f$ mění znaménko"], 0, "Nestačí $f'' = 0$, musí se změnit znaménko (třeba $x^4$ v nule inflexi nemá)."],
];
/** témata otázek: ať se lekce neptá na látku, která ještě nebyla */
const TOPIC = { mono: [0], extrema: [0, 2, 3, 4], convex: [1, 7], global: [6], asym: [5] };
export const conceptFor = topic => () => concept(TOPIC[topic]);
export function concept(idx) {
  const [q, opts, k, why] = idx ? CONCEPTS[pick(idx)] : pick(CONCEPTS);
  return { type: 'choice', key: 'concept', prompt: q, options: shuffle(opts.map((l, i) => ({ label: l, correct: i === k, why }))), explain: why };
}

// =====================================================================
// Série 4
// =====================================================================
const famFixed = (key, f, stat, opts = {}) => () => { const df = D(f); const s = signSets(f, df, stat, opts); const mins = [], maxs = [];
  for (const x of stat) { const l = S.ev(df, x - 1e-4), r = S.ev(df, x + 1e-4); if (l < 0 && r > 0) mins.push(x); else if (l > 0 && r < 0) maxs.push(x); }
  return { f, stat, df, inc: s.pos, dec: s.neg, signs: s.signs, tests: s.tests, pts: s.pts, mins, maxs, badge: 'Série 4', ...opts }; };
const M1 = famFixed('m1', P('x^3/e^x'), [0, 3], { solve: R`Derivace podílu: $f'(x) = \frac{3x^2\,\mathrm{e}^x - x^3\,\mathrm{e}^x}{\mathrm{e}^{2x}}$. Vytkni nahoře $x^2\,\mathrm{e}^x$ a zkrať: $f'(x) = \frac{x^2(3 - x)}{\mathrm{e}^x}$. Zlomek je nula, když je nula čitatel: $x = 0$ nebo $x = 3$. Pozor: $x^2 \ge 0$, takže v nule se znaménko nezmění.` });
const M2 = famFixed('m2', P('-x^2/2 + arctg(x^2)'), [-1, 0, 1], { solve: R`$\left(\operatorname{arctg}(x^2)\right)' = \frac{1}{1 + x^4} \cdot 2x$ (řetízek), takže $f'(x) = -x + \frac{2x}{1 + x^4}$. Na společný jmenovatel: $f'(x) = \frac{-x - x^5 + 2x}{1 + x^4} = \frac{x(1 - x^4)}{1 + x^4}$. Čitatel je nula pro $x = 0$ nebo $x^4 = 1$, tedy $x = \pm 1$.` });
const E1 = famFixed('e1', P('√x ln x'), [Math.exp(-2)], { lo: 0, solve: R`Derivace součinu: $f'(x) = \frac{1}{2\sqrt{x}} \cdot \ln x + \sqrt{x} \cdot \frac{1}{x}$. Protože $\frac{\sqrt{x}}{x} = \frac{1}{\sqrt{x}} = \frac{2}{2\sqrt{x}}$, je $f'(x) = \frac{\ln x + 2}{2\sqrt{x}}$. Čitatel je nula pro $\ln x = -2$, tedy $x = \mathrm{e}^{-2}$.` });
const E3 = famFixed('e3', P('(x+1)^3 - 12x + 6'), [-3, 1], { solve: R`$f'(x) = 3(x + 1)^2 - 12$. Polož rovno nule: $(x + 1)^2 = 4$, tedy $x + 1 = 2$ nebo $x + 1 = -2$. Vyjde $x = 1$ nebo $x = -3$.` });
export const FIXED = {
  m1: () => ({ ...mono(M1()), key: 'm1' }),
  m2: () => ({ ...mono(M2()), key: 'm2' }),
  e1: () => ({ ...extrema(E1()), key: 'e1' }),
  e2: () => ({
    type: 'points', key: 'e2', badge: 'Série 4', fn: 'f(x) = |x|(x-1)^2', prompt: 'Kde má funkce lokální <b>minima</b>?', label: '$x =$', answer: [N(0), N(1)],
    steps: ['Pro $x > 0$: $f = x(x-1)^2$, $f\' = (x-1)(3x-1)$: nuly $\\frac{1}{3}$ a $1$.', 'Pro $x < 0$: $f = -x(x-1)^2$, klesá. V nule je „špička“ dolů: minimum.', 'Minima v $0$ a $1$, maximum v $\\frac{1}{3}$.'],
    hint: 'Rozděl na x ≥ 0 a x < 0. Pozor na bod 0, tam derivace neexistuje.',
  }),
  e3: () => ({ ...extrema(E3()), key: 'e3' }),
  i1: () => ({
    type: 'points', key: 'i1', badge: 'Série 4', fn: 'f(x) = 5x^7 + 7x^6 - 470x + 1', prompt: 'Najdi inflexní body', label: '$x =$', answer: [N(-1)],
    steps: ["První derivace: $f'(x) = 35x^6 + 42x^5 - 470$.", "Druhá derivace: $f''(x) = 210x^5 + 210x^4$. Vytkni $210x^4$: $f''(x) = 210x^4(x + 1)$.",
      "$f''(x) = 0$ pro $x = 0$ nebo $x = -1$.",
      "$x^4 \\ge 0$ znaménko nemění, takže o znaménku $f''$ rozhoduje jen závorka $(x + 1)$: pro $x < -1$ je $f'' < 0$, pro $x > -1$ je $f'' \\ge 0$.",
      'Znaménko se mění jen v $x = -1$, to je jediný inflexní bod. V nule se nemění, tam inflexe není.'], hint: 'Vytkni z f″ co nejvíc.',
  }),
  a1: () => ({
    type: 'points', key: 'a1', badge: 'Série 4', fn: 'f(x) = \\frac{x^3 - 6x^2 + 11x - 6}{x^2 - x - 6}', prompt: 'Najdi svislé asymptoty $x = \\dots$', label: '$x =$', answer: [N(-2)],
    steps: ['Svislá asymptota může být jen tam, kde je jmenovatel nula. Rozlož ho: $x^2 - x - 6 = (x - 3)(x + 2)$, nulový je pro $x = 3$ a $x = -2$.',
      'Zkontroluj v těch bodech čitatel. Pro $x = 3$: $27 - 54 + 33 - 6 = 0$, takže i čitatel má činitel $(x - 3)$. Celý rozklad čitatele je $(x - 1)(x - 2)(x - 3)$.',
      '$(x - 3)$ se zkrátí: $f(x) = \\frac{(x - 1)(x - 2)}{x + 2}$ pro $x \\ne 3$. V bodě $3$ je jen „díra“, limita je tam konečná.',
      'Pro $x = -2$ je čitatel $(-3) \\cdot (-4) = 12 \\ne 0$ a jmenovatel jde k nule, takže funkce jde do $\\pm\\infty$. Jediná svislá asymptota je $x = -2$.'], hint: 'Rozlož čitatel i jmenovatel.',
  }),
  a2: () => obliqueAsym({ a: 4, b: -11, c: 10, d: 1, key: 'a2', badge: 'Série 4', where: '-\\infty' }),
  g1: () => globalExt({ f: P('x^3 + 3x^2 - 9x + 7'), stat: [-3, 1], lo: -4, hi: 4, key: 'g1', badge: 'Série 4',
    solve: "Vyřeš $f'(x) = 0$. Vytkni $3$: $f'(x) = 3(x^2 + 2x - 3) = 3(x + 3)(x - 1)$. Nula pro $x = -3$ nebo $x = 1$." }),
  g2: () => globalExt({ f: P('3x + ∛(1-x)'), stat: [26 / 27], lo: 0, hi: 1, key: 'g2', badge: 'Série 4',
    solve: R`Polož $f'(x) = 0$: $\frac{1}{3\sqrt[3]{(1 - x)^2}} = 3$, tedy $\sqrt[3]{(1 - x)^2} = \frac{1}{9}$, tedy $(1 - x)^2 = \frac{1}{729}$. Na intervalu $\langle 0, 1\rangle$ je $1 - x \ge 0$, takže $1 - x = \frac{1}{27}$ a $x = \frac{26}{27}$.` }),
  t1: () => taylor({ f: P('2 sin x + 3 cos x'), x0: PI, n: 2, key: 't1', badge: 'Série 4' }),
  t2: () => taylor({ f: P('e^x + 6 cos x'), x0: N(0), n: 3, key: 't2', badge: 'Série 4' }),
  t3: () => taylor({ f: P('1/∛x'), fd: pow(X, N(-1 / 3)), x0: N(1), n: 2, key: 't3', badge: 'Série 4' }),
};

export const GEN = {
  mono: () => mono(), extrema: () => extrema(), inflection: () => inflection(), vertAsym, obliqueAsym: () => obliqueAsym(), horizAsym,
  globalExt: () => globalExt(), taylor: () => taylor(), polyShift, fullRun, concept: () => concept(), ...FIXED,
};
