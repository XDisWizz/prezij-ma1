// Generátory pro cestu "Neurčité integrály".
// Karta typu 'integral': { f: integrand (AST), answer: jedna primitivní funkce (AST) }.
// Odpověď studenta se kontroluje derivováním, takže projde jakýkoli správný tvar.
import * as S from '../sym.js';
import { ri, riNot, pick, shuffle } from '../ui.js';

const { N, X, E, add, mul, div, pow, neg, sub, fn, root, ln } = S;
const P = S.parse;
const simp = S.simplify;
const D = e => simp(S.d(e));
const T = e => S.tex(e);
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
const Q = (p, q = 1) => { if (q < 0) { p = -p; q = -q; } const g = gcd(p, q); return q / g === 1 ? N(p / g) : div(N(p / g), N(q / g)); };
const absx = a => fn('abs', a);
const R = String.raw;   // text bez zdvojování zpětných lomítek
const wrap = f => (f.t === 'add' ? `\\left(${T(f)}\\right)` : T(f));
const INT = f => `\\int ${wrap(f)}\\,\\mathrm{d}x`;
const card = o => ({ type: 'integral', prompt: 'Spočítej integrál', label: '$=$', fn: INT(o.f), ...o });
/** koeficient × výraz, s mínusem venku */
const cm = (c, e) => { const v = S.ev(c, 0); if (Math.abs(v - 1) < 1e-12) return e; if (Math.abs(v + 1) < 1e-12) return neg(e); return v < 0 ? neg(mul(simp(neg(c)), e)) : mul(c, e); };
const sum = (...ts) => (ts.length === 1 ? ts[0] : add(...ts));

// =====================================================================
// Tabulka
// =====================================================================
const TBL = [
  ['x^2', 'x^3/3'], ['x^3', 'x^4/4'], ['x^4', 'x^5/5'], ['1', 'x'], ['√x', '2/3 x^(3/2)'], ['1/x^2', '-1/x'],
  ['1/x', 'ln|x|'], ['e^x', 'e^x'], ['sin x', '-cos x'], ['cos x', 'sin x'], ['1/cos^2 x', 'tg x'], ['1/sin^2 x', '-cotg x'],
  ['1/(1+x^2)', 'arctg x'], ['1/√(1-x^2)', 'arcsin x'], ['2^x', '2^x/ln 2'],
];
const TWHY = 'Kontrola: zderivuj výsledek, musí vyjít funkce pod integrálem.';
export function tableQ() {
  const [fT, FT] = pick(TBL.slice(1));
  const f = P(fT), F = P(FT);
  const opts = [{ label: `$${T(F)} + C$`, correct: true }];
  for (const c of shuffle([simp(neg(F)), D(f), ...shuffle(TBL).map(r => P(r[1]))])) {
    if (opts.length >= 4) break;
    const L = `$${T(simp(c))} + C$`;
    if (!opts.some(o => o.label === L) && !S.equivAnti(c, f)) opts.push({ label: L, correct: false });
  }
  const why = `$(${T(F)})' = ${T(f)}$. ${TWHY}`;
  return { type: 'choice', key: 'tableQ', prompt: `Kolik je $${INT(f)}$?`, options: shuffle(opts).map(o => ({ ...o, why })), explain: why };
}
export function tableTyped() {
  const [fT, FT] = pick(TBL);
  const c = pick([1, 1, 2, 3, 5, -2, 4]);
  const f = simp(c === 1 ? P(fT) : mul(N(c), P(fT))), F = c === 1 ? P(FT) : cm(N(c), P(FT));
  return card({ key: 'tableTyped', f, answer: simp(F), steps: [`Z tabulky: $\\int ${T(P(fT))}\\,\\mathrm{d}x = ${T(P(FT))}$.`, c !== 1 ? `Konstanta $${c}$ jen zůstane před integrálem.` : TWHY], hint: 'Která funkce má tuhle derivaci?' });
}

// =====================================================================
// Mocniny
// =====================================================================
// [exponent, tvar v zadání]
const POWS = [[2, 'x^2'], [3, 'x^3'], [4, 'x^4'], [1, 'x'], [0, '1'], [-2, '1/x^2'], [-3, '1/x^3'], [0.5, '√x'], [-0.5, '1/√x'], [1 / 3, '∛x'], [-1, '1/x']];
function powTerm(p, c) {
  const form = POWS.find(r => Math.abs(r[0] - p) < 1e-12)[1];
  const t = simp(c === 1 ? P(form) : mul(N(c), P(form)));
  let F;
  if (p === -1) F = cm(N(c), ln(absx(X)));
  else { const q = p + 1; const k = c / q; F = cm(S.ev(Q(Math.round(k * 6), 6), 0) === k ? Q(Math.round(k * 6), 6) : N(k), q === 1 ? X : pow(X, N(q))); }
  return { t, F };
}
export function powerSum() {
  const n = pick([2, 3, 3]);
  const ps = shuffle(POWS.map(r => r[0])).slice(0, n);
  const terms = ps.map(p => powTerm(p, pick([1, 2, 3, 4, 6, -1, -2, -3])));
  const f = sum(...terms.map(t => t.t)), F = simp(sum(...terms.map(t => t.F)));
  return card({
    key: 'powerSum', f, answer: F, hint: 'Každý člen zvlášť: x^n → x^(n+1)/(n+1). Odmocniny přepiš na mocniny.',
    steps: ['Integrál součtu = součet integrálů. Odmocniny a zlomky přepiš na mocniny: $\\sqrt{x} = x^{1/2}$, $\\frac{1}{x^2} = x^{-2}$.', '$\\int x^n\\,\\mathrm{d}x = \\frac{x^{n+1}}{n+1}$ (kromě $n = -1$, tam je $\\ln|x|$).', ...terms.map(t => `$\\int ${wrap(t.t)}\\,\\mathrm{d}x = ${T(simp(t.F))}$`)],
    parts: terms,
  });
}

/** úprava před integrováním: zlomek → součet mocnin */
export function rewrite() {
  const k = pick(['A', 'B', 'C']);
  let f, g, how;
  if (k === 'A') {               // (x^m + c)/x^j
    const m = ri(2, 4), j = ri(1, m - 1), c = riNot(-5, 5, 0);
    f = div(simp(add(pow(X, N(m)), N(c))), j === 1 ? X : pow(X, N(j)));
    g = simp(add(pow(X, N(m - j)), mul(N(c), pow(X, N(-j)))));
    const xj = j === 1 ? 'x' : `x^{${j}}`;
    how = [`V tabulce to není, ale zlomek se dá rozdělit na dva: $\\frac{x^{${m}}}{${xj}} ${c < 0 ? '-' : '+'} \\frac{${Math.abs(c)}}{${xj}}$.`,
      `Při dělení se exponenty odečítají: $\\frac{x^{${m}}}{${xj}} = ${m - j === 1 ? 'x' : `x^{${m - j}}`}$. Druhý zlomek je $${c < 0 ? '-' : ''}${Math.abs(c) === 1 ? '' : Math.abs(c)}x^{-${j}}$.`];
  } else if (k === 'B') {        // (x^2 - a^2)/(x - a) a podobně
    const a = riNot(-4, 4, 0);
    f = div(simp(add(pow(X, N(2)), N(-a * a))), simp(add(X, N(-a))));
    g = simp(add(X, N(a)));
    how = [`Čitatel je rozdíl čtverců: $x^2 - ${a * a} = (${T(f.d)})(${T(g)})$.`, `Závorka $(${T(f.d)})$ se zkrátí se jmenovatelem, zbyde $${T(g)}$.`];
  } else {                       // (x^2 + c) √x / ∛x
    const c = riNot(-4, 4, 0);
    f = div(mul(simp(add(pow(X, N(2)), N(c))), root(2, X)), root(3, X));
    g = simp(add(pow(X, N(13 / 6)), mul(N(c), pow(X, N(1 / 6)))));
    how = ['Odmocniny přepiš na mocniny: $\\frac{\\sqrt{x}}{\\sqrt[3]{x}} = x^{\\frac{1}{2} - \\frac{1}{3}} = x^{\\frac{1}{6}}$.',
      `Roznásob závorku (exponenty se sčítají, $2 + \\frac{1}{6} = \\frac{13}{6}$): $${T(g)}$.`];
  }
  const F = antiPowers(g);
  return card({
    key: 'rewrite', f, answer: F, hint: 'Nejdřív uprav na součet mocnin, pak integruj člen po členu.',
    steps: [...how, `Po úpravě: $${T(f)} = ${T(g)}$.`, 'Teď člen po členu podle $\\int x^n\\,\\mathrm{d}x = \\frac{x^{n+1}}{n+1}$ (jen $\\int \\frac{1}{x}\\,\\mathrm{d}x = \\ln|x|$):', `$${T(F)} + C$`], g,
  });
}
/** primitivní funkce k součtu c·x^p */
function antiPowers(g) {
  const terms = g.t === 'add' ? g.a : [g];
  return simp(sum(...terms.map(t => {
    let c = 1, b = t;
    if (t.t === 'neg') { c = -1; b = t.a; }
    if (b.t === 'mul' && b.a[0].t === 'num') { c *= b.a[0].v; b = b.a.length === 2 ? b.a[1] : mul(...b.a.slice(1)); }
    if (b.t === 'num') return mul(N(c * b.v), X);
    const p = b.t === 'x' ? 1 : b.t === 'pow' && b.e.t === 'num' ? b.e.v : null;
    if (p === null) throw new Error('antiPowers');
    if (Math.abs(p + 1) < 1e-12) return cm(N(c), ln(absx(X)));
    return mul(N(c / (p + 1)), pow(X, N(p + 1)));
  })));
}

// =====================================================================
// Lineární substituce ∫ g(ax + b)
// =====================================================================
const LIN = [
  { g: t => pow(E, t), G: t => pow(E, t), name: '\\mathrm{e}^{x}', Gn: '\\mathrm{e}^{x}' },
  { g: t => fn('sin', t), G: t => neg(fn('cos', t)), name: '\\sin x', Gn: '-\\cos x' },
  { g: t => fn('cos', t), G: t => fn('sin', t), name: '\\cos x', Gn: '\\sin x' },
  { g: t => div(N(1), t), G: t => ln(absx(t)), name: '\\frac{1}{x}', Gn: '\\ln|x|' },
  { g: t => pow(t, N(3)), G: t => div(pow(t, N(4)), N(4)), name: 'x^3', Gn: '\\frac{x^4}{4}' },
  { g: t => pow(t, N(4)), G: t => div(pow(t, N(5)), N(5)), name: 'x^4', Gn: '\\frac{x^5}{5}' },
  { g: t => div(N(1), pow(fn('cos', t), N(2))), G: t => fn('tg', t), name: '\\frac{1}{\\cos^2 x}', Gn: '\\operatorname{tg} x' },
  { g: t => root(2, t), G: t => mul(Q(2, 3), pow(t, N(1.5))), name: '\\sqrt{x}', Gn: '\\frac{2}{3}x^{3/2}' },
];
export function linSub() {
  const L = pick(LIN), a = pick([2, 3, 4, 5, -2, -3]), b = ri(-7, 7);
  const t = simp(add(mul(N(a), X), N(b)));
  const f = L.g(t), F = simp(mul(Q(1, a), L.G(t)));
  return card({
    key: 'linSub', f, answer: F, hint: '∫ g(ax + b) dx = G(ax + b) / a',
    steps: [`Uvnitř je lineární výraz $${T(t)}$. Integruj, jako by tam bylo jen $x$: $\\int ${L.name}\\,\\mathrm{d}x = ${L.Gn}$.`, `Dosaď $${T(t)}$ a vyděl číslem u $x$, tedy $${a}$.`, `$${T(F)} + C$`],
    wrongs: [{ ast: L.G(t), msg: `Skoro! Ještě musíš vydělit číslem u $x$, tedy $${a}$.` }],
    lin: { L, a, t },
  });
}

// =====================================================================
// Substituce f(g(x))·g'(x)
// =====================================================================
export function subst() {
  const k = pick(['pow', 'pow', 'ln', 'exp', 'trig', 'log']);
  let f, F, t, why;
  if (k === 'pow') {
    const m = pick([2, 3]), c = riNot(-5, 7, 0), n = pick([2, 3, 4, 0.5, -1 / 3, -0.5, -1, 1 / 3]);
    t = simp(add(pow(X, N(m)), N(c)));
    const g = n === 0.5 ? root(2, t) : n === 1 / 3 ? root(3, t) : n === -0.5 ? div(N(1), root(2, t)) : n === -1 / 3 ? div(N(1), root(3, t)) : n === -1 ? div(N(1), t) : pow(t, N(n));
    f = simp(n < 0 ? div(m === 2 ? X : pow(X, N(2)), g.t === 'div' ? g.d : t) : mul(m === 2 ? X : pow(X, N(2)), g));
    F = n === -1 ? mul(Q(1, m), ln(absx(t))) : simp(mul(N(1 / (m * (n + 1))), pow(t, N(n + 1))));
    if (n !== -1) { const k2 = 1 / (m * (n + 1)); let r = 1; while (r < 120 && Math.abs(k2 * r - Math.round(k2 * r)) > 1e-9) r++; F = mul(Q(Math.round(k2 * r), r), pow(t, N(n + 1))); }
    const xp = m === 2 ? 'x' : 'x^2', n1 = S.fmtNum(n + 1), kf = 1 / (m * (n + 1));
    why = [
      `Uvnitř je $${T(t)}$ a vedle stojí $${xp}$, což je až na číslo jeho derivace. Zvol $t = ${T(t)}$.`,
      `$\\mathrm{d}t = ${m}${xp}\\,\\mathrm{d}x$, takže $${xp}\\,\\mathrm{d}x = \\frac{1}{${m}}\\,\\mathrm{d}t$.`,
      n === -1 ? `V proměnné $t$: $\\frac{1}{${m}}\\int \\frac{1}{t}\\,\\mathrm{d}t = \\frac{1}{${m}}\\ln|t|$.`
        : `V proměnné $t$: $\\frac{1}{${m}}\\int t^{${S.fmtNum(n)}}\\,\\mathrm{d}t = \\frac{1}{${m}} \\cdot \\frac{t^{${n1}}}{${n1}} = ${Math.abs(kf - 1) < 1e-9 ? '' : S.fmtNum(kf) + '\\,'}t^{${n1}}$ (podle $\\int t^n = \\frac{t^{n+1}}{n+1}$).`,
    ];
  } else if (k === 'ln') {
    const n = ri(1, 3);
    t = ln(X); f = div(n === 1 ? ln(X) : pow(ln(X), N(n)), X); F = mul(Q(1, n + 1), pow(ln(X), N(n + 1)));
    why = [
      'V integrálu je $\\ln x$ a vedle něj $\\frac{1}{x}$, což je jeho derivace. Zvol $t = \\ln x$.',
      '$\\mathrm{d}t = \\frac{1}{x}\\,\\mathrm{d}x$, takže $\\frac{1}{x}\\,\\mathrm{d}x$ se celé nahradí $\\mathrm{d}t$.',
      `V proměnné $t$: $\\int ${n === 1 ? 't' : `t^{${n}}`}\\,\\mathrm{d}t = \\frac{t^{${n + 1}}}{${n + 1}}$.`,
    ];
  } else if (k === 'exp') {
    const a = pick([1, 2, 3, -1]);
    t = simp(mul(N(a), pow(X, N(2)))); f = simp(mul(X, pow(E, t))); F = simp(mul(Q(1, 2 * a), pow(E, t)));
    const inv = 2 * a < 0 ? `-\\frac{1}{${-2 * a}}` : `\\frac{1}{${2 * a}}`;
    why = [
      `V exponentu je $${T(t)}$ a vedle stojí $x$, což je až na číslo jeho derivace. Zvol $t = ${T(t)}$.`,
      `$\\mathrm{d}t = ${2 * a}x\\,\\mathrm{d}x$, takže $x\\,\\mathrm{d}x = ${inv}\\,\\mathrm{d}t$.`,
      `V proměnné $t$: $${inv}\\int \\mathrm{e}^t\\,\\mathrm{d}t = ${inv}\\,\\mathrm{e}^t$.`,
    ];
  } else if (k === 'trig') {
    const n = ri(2, 5), s = Math.random() < 0.5;
    t = fn(s ? 'sin' : 'cos', X);
    f = mul(pow(t, N(n)), fn(s ? 'cos' : 'sin', X));
    F = s ? mul(Q(1, n + 1), pow(t, N(n + 1))) : neg(mul(Q(1, n + 1), pow(t, N(n + 1))));
    why = s ? [
      'Vedle mocniny sinu stojí $\\cos x$, což je derivace sinu. Zvol $t = \\sin x$.',
      '$\\mathrm{d}t = \\cos x\\,\\mathrm{d}x$, takže $\\cos x\\,\\mathrm{d}x$ se celé nahradí $\\mathrm{d}t$.',
      `V proměnné $t$: $\\int t^{${n}}\\,\\mathrm{d}t = \\frac{t^{${n + 1}}}{${n + 1}}$.`,
    ] : [
      'Vedle mocniny kosinu stojí $\\sin x$, což je až na znaménko derivace kosinu. Zvol $t = \\cos x$.',
      '$\\mathrm{d}t = -\\sin x\\,\\mathrm{d}x$, takže $\\sin x\\,\\mathrm{d}x = -\\mathrm{d}t$. Pozor na to mínus.',
      `V proměnné $t$: $-\\int t^{${n}}\\,\\mathrm{d}t = -\\frac{t^{${n + 1}}}{${n + 1}}$.`,
    ];
  } else {
    const b = ri(-5, 5), c = ri(1, 9);
    t = simp(add(pow(X, N(2)), mul(N(b), X), N(c)));
    f = div(simp(add(mul(N(2), X), N(b))), t); F = ln(absx(t));
    why = [
      `Zderivuj si jmenovatel: $(${T(t)})' = ${T(D(t))}$. To je přesně čitatel.`,
      `Zvol $t = ${T(t)}$. Pak $\\mathrm{d}t = (${T(D(t))})\\,\\mathrm{d}x$ a celý čitatel s $\\mathrm{d}x$ se nahradí $\\mathrm{d}t$.`,
      'V proměnné $t$: $\\int \\frac{1}{t}\\,\\mathrm{d}t = \\ln|t|$.',
    ];
  }
  return card({ key: 'subst', f, answer: simp(F) , hint: 'Hledej funkci, jejíž derivace je vedle ní (až na číslo).', steps: [...why, `Vrať zpátky $x$: $${T(simp(F))} + C$.`, 'Kontrola: zderivuj výsledek, musí vyjít funkce pod integrálem.'], sub: { t } });
}

// =====================================================================
// Per partes
// =====================================================================
export function byParts(k = pick(['lin', 'lin', 'quad', 'ln', 'ln', 'atan', 'ln2', 'cyc'])) {
  let f, F, u, dv, steps;
  if (k === 'lin' || k === 'quad') {
    const w = pick(['sin', 'cos', 'exp']);
    const p = k === 'lin' ? simp(add(mul(N(pick([1, 2, 3])), X), N(ri(-5, 5)))) : simp(add(pow(X, N(2)), mul(N(ri(-3, 3)), X), N(ri(-3, 3))));
    const p1 = D(p), p2 = D(p1);
    u = p; dv = w === 'exp' ? pow(E, X) : fn(w, X);
    f = mul(p, dv);
    if (w === 'sin') F = add(neg(mul(p, fn('cos', X))), mul(p1, fn('sin', X)), mul(p2, fn('cos', X)));
    else if (w === 'cos') F = add(mul(p, fn('sin', X)), mul(p1, fn('cos', X)), neg(mul(p2, fn('sin', X))));
    else F = mul(add(p, neg(p1), p2), pow(E, X));
    const V = w === 'sin' ? neg(fn('cos', X)) : w === 'cos' ? fn('sin', X) : pow(E, X);
    const pa = e => (e.t === 'add' || e.t === 'neg' ? `\\left(${T(e)}\\right)` : T(e));
    // zbylý integrál ∫ u'·v dx
    const I2 = simpKeep(w === 'sin' ? add(neg(mul(p1, fn('sin', X))), neg(mul(p2, fn('cos', X)))) : w === 'cos' ? add(neg(mul(p1, fn('cos', X))), mul(p2, fn('sin', X))) : mul(add(p1, neg(p2)), pow(E, X)));
    steps = [
      `Součin polynomu a funkce $${T(dv)}$: per partes. Za $u$ ber polynom (derivací se zjednoduší): $u = ${T(p)}$, $v' = ${T(dv)}$.`,
      `$u' = ${T(p1)}$, $v = ${T(V)}$.`,
      `Dosaď do $\\int u v' = u v - \\int u' v$: $${pa(p)} \\cdot ${pa(V)} - \\int ${pa(p1)} \\cdot ${pa(V)}\\,\\mathrm{d}x$.`,
      ...(k === 'quad'
        ? [`Zbylý integrál je zase polynom krát funkce, takže per partes ještě jednou, tentokrát s $u = ${T(p1)}$, $u' = ${T(p2)}$.`, `Vyjde $\\int ${pa(p1)} \\cdot ${pa(V)}\\,\\mathrm{d}x = ${T(I2)}$.`]
        : [`Zbylý integrál je už z tabulky (číslo krát funkce): $\\int ${pa(p1)} \\cdot ${pa(V)}\\,\\mathrm{d}x = ${T(I2)}$.`]),
      'Odečti ho od prvního členu (pozor na znaménka):',
    ];
  } else if (k === 'ln') {
    const n = pick([0, 1, 2, 3, 0.5]);
    u = ln(X); dv = n === 0 ? N(1) : n === 0.5 ? root(2, X) : n === 1 ? X : pow(X, N(n));
    f = n === 0 ? ln(X) : mul(dv, ln(X));
    const q = n + 1;
    F = n === 0.5 ? mul(pow(X, N(1.5)), add(mul(Q(2, 3), ln(X)), neg(Q(4, 9)))) : add(mul(Q(1, q), pow(X, N(q)), ln(X)), neg(mul(Q(1, q * q), pow(X, N(q)))));
    const v = q === 1 ? X : simp(mul(N(1 / q), pow(X, N(q))));
    const inner = q === 1 ? N(1) : simp(mul(N(1 / q), pow(X, N(q - 1))));
    const I2 = simp(mul(N(1 / (q * q)), pow(X, N(q))));
    steps = [
      n === 0 ? "Samotný logaritmus v tabulce není. Trik: ber ho jako součin $1 \\cdot \\ln x$ a použij per partes s $u = \\ln x$, $v' = 1$."
        : `Je tam logaritmus, takže per partes s $u = \\ln x$ (jeho derivace je jednoduchá) a $v' = ${T(dv)}$.`,
      `$u' = \\frac{1}{x}$, $v = ${T(v)}$.`,
      `Dosaď do $\\int u v' = u v - \\int u' v$: $${T(v)} \\cdot \\ln x - \\int \\frac{1}{x} \\cdot ${T(v)}\\,\\mathrm{d}x$.`,
      `Pod integrálem se $x$ zkrátí: $\\frac{1}{x} \\cdot ${T(v)} = ${T(inner)}$, a to je jen mocnina: $\\int ${T(inner)}\\,\\mathrm{d}x = ${T(I2)}$.`,
      'Odečti:',
    ];
  } else if (k === 'atan') {
    u = fn('arctg', X); dv = X; f = mul(X, fn('arctg', X));
    F = add(mul(div(add(pow(X, N(2)), N(1)), N(2)), fn('arctg', X)), neg(div(X, N(2))));
    steps = [
      R`Per partes s $u = \operatorname{arctg} x$ (derivací se zjednoduší) a $v' = x$.`,
      R`$u' = \frac{1}{1 + x^2}$, $v = \frac{x^2}{2}$.`,
      R`$u v - \int u' v = \frac{x^2}{2}\operatorname{arctg} x - \frac{1}{2}\int \frac{x^2}{1 + x^2}\,\mathrm{d}x$.`,
      R`Trik na zbylý integrál: $\frac{x^2}{1 + x^2} = \frac{(1 + x^2) - 1}{1 + x^2} = 1 - \frac{1}{1 + x^2}$, takže $\int \frac{x^2}{1 + x^2}\,\mathrm{d}x = x - \operatorname{arctg} x$.`,
      R`$\frac{x^2}{2}\operatorname{arctg} x - \frac{1}{2}(x - \operatorname{arctg} x) = \frac{x^2 + 1}{2}\operatorname{arctg} x - \frac{x}{2}$.`,
    ];
  } else if (k === 'ln2') {
    u = pow(ln(X), N(2)); dv = N(1); f = pow(ln(X), N(2));
    F = add(mul(X, pow(ln(X), N(2))), neg(mul(N(2), X, ln(X))), mul(N(2), X));
    steps = [
      R`Není tu součin, ale trik je stejný jako u $\int \ln x$: per partes s $u = \ln^2 x$ a $v' = 1$.`,
      R`$u' = 2\ln x \cdot \frac{1}{x}$ (řetízek), $v = x$.`,
      R`$u v - \int u' v = x\ln^2 x - \int 2\ln x \cdot \frac{1}{x} \cdot x\,\mathrm{d}x = x\ln^2 x - 2\int \ln x\,\mathrm{d}x$.`,
      R`$\int \ln x\,\mathrm{d}x$ znovu per partes ($u = \ln x$, $v' = 1$): $x\ln x - \int \frac{1}{x} \cdot x\,\mathrm{d}x = x\ln x - x$.`,
      R`$x\ln^2 x - 2(x\ln x - x) = x\ln^2 x - 2x\ln x + 2x$.`,
    ];
  } else {
    u = fn('sin', X); dv = pow(E, X); f = mul(pow(E, X), fn('sin', X));
    F = mul(Q(1, 2), pow(E, X), add(fn('sin', X), neg(fn('cos', X))));
    steps = [
      R`Označ hledaný integrál $I = \int \mathrm{e}^x \sin x\,\mathrm{d}x$. Per partes: $u = \sin x$, $v' = \mathrm{e}^x$, tedy $u' = \cos x$, $v = \mathrm{e}^x$.`,
      R`$I = \mathrm{e}^x \sin x - \int \mathrm{e}^x \cos x\,\mathrm{d}x$.`,
      R`Zbylý integrál znovu per partes: $u = \cos x$, $v' = \mathrm{e}^x$, tedy $u' = -\sin x$: $\int \mathrm{e}^x \cos x\,\mathrm{d}x = \mathrm{e}^x \cos x + \int \mathrm{e}^x \sin x\,\mathrm{d}x = \mathrm{e}^x \cos x + I$.`,
      R`Dosaď zpátky: $I = \mathrm{e}^x \sin x - \mathrm{e}^x \cos x - I$. Původní integrál se vrátil, tak ho převeď na levou stranu: $2I = \mathrm{e}^x(\sin x - \cos x)$.`,
      'Vyděl dvěma:',
    ];
  }
  F = simpKeep(F);
  steps.push(`$${T(F)} + C$`);
  return card({ key: 'byParts', f, answer: F, steps, hint: "∫ u v' = u v − ∫ u' v. Za u ber to, co se derivací zjednoduší (polynom, ln, arctg).", pp: { u, dv, kind: k } });
}
/** první setkání s per partes: jen typy, které mají v řešení po krocích všechny mezikroky */
export const byPartsEasy = () => byParts(pick(['lin', 'lin', 'ln']));
/** lehké zjednodušení, které nerozbije čitelný tvar (nulové členy pryč, ať nevznikne „+ 0“) */
function simpKeep(F) {
  if (F.t === 'add') { const ts = F.a.map(simp).filter(t => !(t.t === 'num' && t.v === 0)); return ts.length > 1 ? add(...ts) : ts[0] || N(0); }
  return F.t === 'mul' ? mul(...F.a.map(simp)) : simp(F);
}

// =====================================================================
// Parciální zlomky
// =====================================================================
export function partial() {
  const k = pick(['two', 'two', 'rep', 'quad']);
  if (k === 'two') {
    const a = ri(-4, 4), b = riNot(-4, 4, a), p = riNot(-3, 4, 0), q = ri(-6, 6);
    if (p * a + q === 0 || p * b + q === 0) return partial();
    const A = Q(p * a + q, a - b), B = Q(p * b + q, b - a);
    const den = simp(add(pow(X, N(2)), mul(N(-(a + b)), X), N(a * b)));
    const f = div(simp(add(mul(N(p), X), N(q))), den);
    const xa = simp(add(X, N(-a))), xb = simp(add(X, N(-b)));
    const F = add(cm(A, ln(absx(xa))), cm(B, ln(absx(xb))));
    return card({
      key: 'partial', f, answer: F, hint: 'Rozlož jmenovatel, pak A/(x − a) + B/(x − b).',
      steps: [
        `Polynom lomeno polynom: parciální zlomky. Rozlož jmenovatel: $${T(den)} = (${T(xa)})(${T(xb)})$.`,
        `Hledáš čísla $A$, $B$ tak, aby $${T(f)} = \\frac{A}{${T(xa)}} + \\frac{B}{${T(xb)}}$.`,
        `Zakrývací trik pro $A$: zakryj $(${T(xa)})$ a do zbytku $\\frac{${T(f.n)}}{${T(xb)}}$ dosaď $x = ${a}$: $A = \\frac{${p * a + q}}{${a - b}} = ${T(A)}$.`,
        `Pro $B$: zakryj $(${T(xb)})$ a do $\\frac{${T(f.n)}}{${T(xa)}}$ dosaď $x = ${b}$: $B = \\frac{${p * b + q}}{${b - a}} = ${T(B)}$.`,
        'Každý zlomek zvlášť podle $\\int \\frac{A}{x - a}\\,\\mathrm{d}x = A\\ln|x - a|$:',
        `$${T(F)} + C$`],
      pf: { kind: k, coefs: [['A', A, `u $\\frac{1}{${T(xa)}}$`], ['B', B, `u $\\frac{1}{${T(xb)}}$`]] },
    });
  }
  if (k === 'rep') {
    const a = riNot(-3, 3, 0), p = riNot(-3, 4, 0), q = ri(-6, 6);
    const r = p * a + q;
    if (!r) return partial();
    const xa = simp(add(X, N(-a)));
    const f = div(simp(add(mul(N(p), X), N(q))), pow(xa, N(2)));
    const F = add(cm(N(p), ln(absx(xa))), cm(N(-r), div(N(1), xa)));
    return card({
      key: 'partial', f, answer: F, hint: 'Dvojnásobný kořen: A/(x − a) + B/(x − a)².',
      steps: [
        `Jmenovatel je $(${T(xa)})^2$, dvojnásobný kořen. Hledáš $\\frac{A}{${T(xa)}} + \\frac{B}{(${T(xa)})^2}$.`,
        `Po převedení na společný jmenovatel musí platit $A(${T(xa)}) + B = ${T(f.n)}$.`,
        `Dosaď $x = ${a}$ (závorka zmizí): $B = ${r}$. Číslo u $x$ musí být vlevo i vpravo stejné: $A = ${p}$.`,
        `$\\int \\frac{${p}}{${T(xa)}}\\,\\mathrm{d}x = ${T(cm(N(p), ln(absx(xa))))}$ a $\\int \\frac{${r}}{(${T(xa)})^2}\\,\\mathrm{d}x = ${T(simp(cm(N(-r), div(N(1), xa))))}$ (protože $\\int t^{-2}\\,\\mathrm{d}t = -\\frac{1}{t}$).`,
        `$${T(F)} + C$`],
      pf: { kind: k, coefs: [['A', N(p), `u $\\frac{1}{${T(xa)}}$`], ['B', N(r), `u $\\frac{1}{(${T(xa)})^2}$`]] },
    });
  }
  const A = riNot(-3, 3, 0), B = ri(-3, 3), C = riNot(-3, 3, 0);
  const f = div(simp(add(mul(N(A + B), pow(X, N(2))), mul(N(C), X), N(A))), P('x^3 + x'));
  const F = simp(add(mul(N(A), ln(absx(X))), mul(Q(B, 2), ln(add(pow(X, N(2)), N(1)))), mul(N(C), fn('arctg', X))));
  return card({
    key: 'partial', f, answer: F, hint: 'x³ + x = x(x² + 1): A/x + (Bx + C)/(x² + 1).',
    steps: [
      'Rozlož jmenovatel: $x^3 + x = x(x^2 + 1)$. Závorka $x^2 + 1$ nemá kořeny, takže hledáš $\\frac{A}{x} + \\frac{Bx + C}{x^2 + 1}$.',
      `Po převedení na společný jmenovatel: $A(x^2 + 1) + (Bx + C)x = (A + B)x^2 + Cx + A$. To se musí rovnat čitateli $${T(f.n)}$.`,
      `Porovnej čísla u stejných mocnin: samotné číslo dá $A = ${A}$, u $x$ je $C = ${C}$, u $x^2$ je $A + B = ${A + B}$, takže $B = ${B}$.`,
      'Tři integrály: $\\int \\frac{A}{x} = A\\ln|x|$, $\\;\\int \\frac{Bx}{x^2 + 1} = \\frac{B}{2}\\ln(x^2 + 1)$ (nahoře je až na číslo derivace jmenovatele), $\\;\\int \\frac{C}{x^2 + 1} = C\\operatorname{arctg} x$.',
      `$${T(F)} + C$`],
    pf: { kind: k, coefs: [['A', N(A), 'u $\\frac{1}{x}$'], ['B', N(B), 'u $\\frac{x}{x^2+1}$'], ['C', N(C), 'u $\\frac{1}{x^2+1}$']] },
  });
}

// =====================================================================
// Goniometrické
// =====================================================================
const TRIG = [
  ['sin^3 x', 'cos^3 x/3 - cos x', [
    R`Lichá mocnina sinu: jeden sinus oddělej a zbytek přepiš přes kosinus. $\sin^3 x = \sin^2 x \cdot \sin x = (1 - \cos^2 x)\sin x$.`,
    R`Substituce $t = \cos x$, $\mathrm{d}t = -\sin x\,\mathrm{d}x$, tedy $\sin x\,\mathrm{d}x = -\mathrm{d}t$.`,
    R`$-\int (1 - t^2)\,\mathrm{d}t = -t + \frac{t^3}{3}$. Vrať $t = \cos x$:`]],
  ['cos^3 x', 'sin x - sin^3 x/3', [
    R`Lichá mocnina kosinu: jeden kosinus oddělej a zbytek přepiš přes sinus. $\cos^3 x = \cos^2 x \cdot \cos x = (1 - \sin^2 x)\cos x$.`,
    R`Substituce $t = \sin x$, $\mathrm{d}t = \cos x\,\mathrm{d}x$.`,
    R`$\int (1 - t^2)\,\mathrm{d}t = t - \frac{t^3}{3}$. Vrať $t = \sin x$:`]],
  ['sin^2 x', 'x/2 - sin(2x)/4', [
    R`Sudá mocnina: použij vzorec $\sin^2 x = \frac{1 - \cos 2x}{2}$.`,
    R`$\int \left(\frac{1}{2} - \frac{\cos 2x}{2}\right)\mathrm{d}x$. První člen dá $\frac{x}{2}$.`,
    R`Druhý člen: $\int \cos 2x\,\mathrm{d}x = \frac{\sin 2x}{2}$ (lineární vnitřek, vyděl dvojkou), takže $\int \frac{\cos 2x}{2}\,\mathrm{d}x = \frac{\sin 2x}{4}$.`]],
  ['cos^2 x', 'x/2 + sin(2x)/4', [
    R`Sudá mocnina: použij vzorec $\cos^2 x = \frac{1 + \cos 2x}{2}$.`,
    R`$\int \left(\frac{1}{2} + \frac{\cos 2x}{2}\right)\mathrm{d}x$. První člen dá $\frac{x}{2}$.`,
    R`Druhý člen: $\int \cos 2x\,\mathrm{d}x = \frac{\sin 2x}{2}$ (lineární vnitřek, vyděl dvojkou), takže $\int \frac{\cos 2x}{2}\,\mathrm{d}x = \frac{\sin 2x}{4}$.`]],
  ['tg^2 x', 'tg x - x', [
    R`V tabulce $\operatorname{tg}^2 x$ není, ale $\frac{1}{\cos^2 x}$ ano. Uprav: $\operatorname{tg}^2 x = \frac{\sin^2 x}{\cos^2 x} = \frac{1 - \cos^2 x}{\cos^2 x} = \frac{1}{\cos^2 x} - 1$.`,
    R`Oba členy jsou z tabulky: $\int \frac{1}{\cos^2 x}\,\mathrm{d}x = \operatorname{tg} x$ a $\int 1\,\mathrm{d}x = x$.`]],
  ['cotg^2 x', '-cotg x - x', [
    R`V tabulce $\operatorname{cotg}^2 x$ není, ale $\frac{1}{\sin^2 x}$ ano. Uprav: $\operatorname{cotg}^2 x = \frac{\cos^2 x}{\sin^2 x} = \frac{1 - \sin^2 x}{\sin^2 x} = \frac{1}{\sin^2 x} - 1$.`,
    R`Oba členy jsou z tabulky: $\int \frac{1}{\sin^2 x}\,\mathrm{d}x = -\operatorname{cotg} x$ a $\int 1\,\mathrm{d}x = x$.`]],
  ['tg x', '-ln|cos x|', [
    R`Přepiš: $\operatorname{tg} x = \frac{\sin x}{\cos x}$. Nahoře je až na znaménko derivace jmenovatele.`,
    R`Substituce $t = \cos x$, $\mathrm{d}t = -\sin x\,\mathrm{d}x$, tedy $\sin x\,\mathrm{d}x = -\mathrm{d}t$.`,
    R`$-\int \frac{1}{t}\,\mathrm{d}t = -\ln|t|$. Vrať $t = \cos x$:`]],
  ['sin^3 x / cos^2 x', 'cos x + 1/cos x', [
    R`Lichá mocnina sinu nahoře: $\sin^3 x = (1 - \cos^2 x)\sin x$, takže integrand je $\frac{(1 - \cos^2 x)\sin x}{\cos^2 x}$.`,
    R`Substituce $t = \cos x$, $\mathrm{d}t = -\sin x\,\mathrm{d}x$: $-\int \frac{1 - t^2}{t^2}\,\mathrm{d}t$.`,
    R`Rozděl zlomek: $\frac{1 - t^2}{t^2} = t^{-2} - 1$, tedy $-\int (t^{-2} - 1)\,\mathrm{d}t = \frac{1}{t} + t$. Vrať $t = \cos x$:`]],
  ['sin x cos^2 x', '-cos^3 x / 3', [
    R`Vedle $\cos^2 x$ stojí $\sin x$, což je až na znaménko derivace kosinu. Zvol $t = \cos x$.`,
    R`$\mathrm{d}t = -\sin x\,\mathrm{d}x$, tedy $\sin x\,\mathrm{d}x = -\mathrm{d}t$.`,
    R`$-\int t^2\,\mathrm{d}t = -\frac{t^3}{3}$. Vrať $t = \cos x$:`]],
];
export function trig() {
  const [fT, FT, why] = pick(TRIG);
  const f = P(fT), F = P(FT);
  return card({ key: 'trig', f, answer: F, steps: [...why, `$${T(F)} + C$`], hint: 'Lichá mocnina → oddělej jeden sin/cos a substituuj. Sudá → vzorec pro poloviční úhel.' });
}

// =====================================================================
// Odmocniny: substituce t = √(…)
// =====================================================================
export function rootSub() {
  const k = pick(['A', 'B', 'C']);
  let f, F, why, t;
  if (k === 'A') {
    const b = ri(1, 4);
    t = root(2, X); f = div(N(1), add(N(b), root(2, X)));
    F = add(mul(N(2), root(2, X)), neg(mul(N(2 * b), ln(add(root(2, X), N(b))))));
    why = [
      'Vadí odmocnina, schovej ji do $t$: $t = \\sqrt{x}$, tedy $x = t^2$ a $\\mathrm{d}x = 2t\\,\\mathrm{d}t$.',
      `Přepiš integrál: $\\int \\frac{1}{${b} + t} \\cdot 2t\\,\\mathrm{d}t = \\int \\frac{2t}{t + ${b}}\\,\\mathrm{d}t$.`,
      `Uprav čitatel, ať se dá zlomek rozdělit: $\\frac{2t}{t + ${b}} = \\frac{2(t + ${b}) - ${2 * b}}{t + ${b}} = 2 - \\frac{${2 * b}}{t + ${b}}$.`,
      `$\\int \\left(2 - \\frac{${2 * b}}{t + ${b}}\\right)\\mathrm{d}t = 2t - ${2 * b}\\ln|t + ${b}|$.`,
    ];
  } else if (k === 'B') {
    const a = ri(1, 5);
    const xa = add(X, N(a));
    t = root(2, xa); f = mul(X, root(2, xa));
    F = add(mul(Q(2, 5), pow(xa, N(2.5))), neg(mul(Q(2 * a, 3), pow(xa, N(1.5)))));
    why = [
      `Schovej odmocninu do $t$: $t = \\sqrt{x + ${a}}$, tedy $x = t^2 - ${a}$ a $\\mathrm{d}x = 2t\\,\\mathrm{d}t$.`,
      `Přepiš integrál: $\\int (t^2 - ${a}) \\cdot t \\cdot 2t\\,\\mathrm{d}t = \\int (2t^4 - ${2 * a}t^2)\\,\\mathrm{d}t$.`,
      `Člen po členu: $\\frac{2t^5}{5} - \\frac{${2 * a}t^3}{3}$.`,
      `$t^5 = (x + ${a})^{\\frac{5}{2}}$ a $t^3 = (x + ${a})^{\\frac{3}{2}}$.`,
    ];
  } else {
    t = root(2, X); f = div(root(2, X), add(N(1), X));
    F = add(mul(N(2), root(2, X)), neg(mul(N(2), fn('arctg', root(2, X)))));
    why = [
      'Schovej odmocninu do $t$: $t = \\sqrt{x}$, tedy $x = t^2$ a $\\mathrm{d}x = 2t\\,\\mathrm{d}t$.',
      'Přepiš integrál: $\\int \\frac{t}{1 + t^2} \\cdot 2t\\,\\mathrm{d}t = \\int \\frac{2t^2}{1 + t^2}\\,\\mathrm{d}t$.',
      'Uprav čitatel: $\\frac{2t^2}{1 + t^2} = \\frac{2(1 + t^2) - 2}{1 + t^2} = 2 - \\frac{2}{1 + t^2}$.',
      '$\\int \\left(2 - \\frac{2}{1 + t^2}\\right)\\mathrm{d}t = 2t - 2\\operatorname{arctg} t$.',
    ];
  }
  return card({ key: 'rootSub', f, answer: F, steps: [...why, `Vrať zpátky $t = ${T(t)}$: $${T(F)} + C$`], hint: 'Odmocninu schovej do t: t = √(…), vyjádři x a dx.', sub: { t } });
}

// =====================================================================
// Koncepční otázky: kterou metodu?
// =====================================================================
const METHODS = ['tabulka / úprava', 'substituce', 'per partes', 'parciální zlomky'];
/** polynom v x (jen čísla, x, +, −, ·, celé kladné mocniny) */
const isPoly = e => e.t === 'num' || e.t === 'x' || ((e.t === 'add' || e.t === 'mul') && e.a.every(isPoly)) || (e.t === 'neg' && isPoly(e.a))
  || (e.t === 'pow' && isPoly(e.b) && e.e.t === 'num' && Number.isInteger(e.e.v) && e.e.v > 0);
export function methodQ() {
  const which = pick([0, 1, 1, 2, 2, 3]);
  // podíl dvou polynomů se dá skoro vždycky řešit i parciálními zlomky, takže ho u „tabulky“ a „substituce“
  // nenabízíme (otázka by měla dvě správné odpovědi); eˣ·sin x a samotné ln x jsou u per partes taky sporné
  const ratio = e => e.t === 'div' && isPoly(e.n) && isPoly(e.d);
  let c;
  do c = [() => pick([tableTyped, powerSum, rewrite])(), () => pick([subst, linSub])(), () => byParts(pick(['lin', 'lin', 'quad', 'ln', 'atan'])), partial][which]();
  while (which < 2 && ratio(c.f));
  const why = ['Stačí tabulka (případně po úpravě na součet mocnin).', 'Vedle funkce je její derivace (nebo lineární vnitřek): substituce.', 'Součin dvou různých typů funkcí (polynom × sin, ln, eˣ…) nebo samotný logaritmus: per partes.', 'Racionální funkce (polynom lomeno polynom): parciální zlomky.'][which];
  return { type: 'choice', key: 'methodQ', prompt: 'Jakou metodu použiješ?', context: c.fn, options: METHODS.map((l, i) => ({ label: l, correct: i === which, why })), explain: why };
}

// =====================================================================
// Řešení po krocích
// =====================================================================
export function toGuided(c, level = 'full') {
  const fin = { kind: 'integral', title: 'Výsledek', label: '$=$', f: c.f, answer: c.answer, wrongs: c.wrongs, final: true };
  const g = [];
  if (c.key === 'powerSum' && level === 'full') {
    c.parts.forEach(p => g.push({ kind: 'integral', title: `$\\int ${wrap(p.t)}\\,\\mathrm{d}x$`, label: '$=$', f: p.t, answer: simp(p.F) }));
    fin.info = 'Sečti to.';
  } else if (c.key === 'rewrite') {
    g.push({ kind: 'expr', title: 'Nejdřív uprav na součet mocnin', info: 'Rozděl zlomek / zkrať / převeď odmocniny na mocniny.', label: '$=$', answer: c.g });
  } else if (c.key === 'linSub' && level === 'full') {
    const L = c.lin.L;
    g.push({ kind: 'integral', title: `Bez vnitřku: $\\int ${L.name}\\,\\mathrm{d}x$`, label: '$=$', f: L.g(X), answer: simp(L.G(X)) });
    fin.info = `Teď místo $x$ dosaď $${T(c.lin.t)}$ a vyděl číslem $${c.lin.a}$.`;
  } else if (c.sub) {
    const right = T(c.sub.t);
    const cands = [...new Set([right, 'x', T(c.f.t === 'div' ? c.f.d : X), T(D(c.sub.t)), '\\sin x', '\\ln x', 'x^2'])].filter(Boolean);
    g.push({ kind: 'choice', title: 'Co zvolíš za $t$?', options: shuffle(cands.slice(0, 4).map(l => ({ label: `$t = ${l}$`, correct: l === right, why: `Vhodné je $t = ${right}$: jeho derivace je v integrálu (až na číslo).` }))) });
    if (level === 'full') g.push({ kind: 'expr', title: "Kolik je $t'$?", info: '$\\mathrm{d}t = t\'\\,\\mathrm{d}x$', label: "$t' =$", answer: D(c.sub.t) });
    fin.info = 'Přepiš integrál na $t$, zintegruj a vrať zpátky $x$.';
  } else if (c.key === 'byParts') {
    const u = T(c.pp.u);
    const opts = [...new Set([u, T(c.pp.dv)])].map(l => ({ label: `$u = ${l}$`, correct: l === u, why: `Za $u$ ber $${u}$: derivací se zjednoduší.` }));
    // u eˣ·sin x funguje obojí, tam se neptáme
    if (opts.length > 1 && c.pp.kind !== 'cyc') g.push({ kind: 'choice', title: 'Co bude $u$ (to, co budeš derivovat)?', options: shuffle(opts) });
    if (level === 'full' && ['lin', 'quad', 'ln'].includes(c.pp.kind)) {
      g.push({ kind: 'expr', title: "$u'$", label: "$u' =$", answer: D(c.pp.u) });
      g.push({ kind: 'integral', title: `$v = \\int ${wrap(c.pp.dv)}\\,\\mathrm{d}x$`, label: '$v =$', f: c.pp.dv, answer: simp(byV(c.pp.dv)) });
      fin.info = "$uv - \\int u'v\\,\\mathrm{d}x$";
    }
  } else if (c.key === 'partial' && level === 'full') {
    c.pf.coefs.forEach(([name, val, where]) => g.push({ kind: 'expr', numeric: true, title: `Koeficient $${name}$ ${where}`, label: `$${name} =$`, answer: val, why: c.steps[0] + ' ' + (c.steps[1] || '') }));
    fin.info = 'Každý zlomek zintegruj zvlášť: $\\int \\frac{A}{x - a} = A\\ln|x - a|$.';
  }
  return { type: 'guided', key: c.key + ':' + level, badge: c.badge, fn: c.fn, prompt: c.prompt, gsteps: [...g, fin], answer: c.answer, steps: c.steps, hint: c.hint };
}
function byV(dv) { if (dv.t === 'pow' && dv.b.t === 'e') return pow(E, X); if (dv.t === 'fn' && dv.f === 'sin') return neg(fn('cos', X)); if (dv.t === 'fn' && dv.f === 'cos') return fn('sin', X); if (dv.t === 'num') return mul(dv, X); if (dv.t === 'x') return div(pow(X, N(2)), N(2)); if (dv.t === 'root') return mul(Q(2, 3), pow(X, N(1.5))); if (dv.t === 'pow') return div(pow(X, N(dv.e.v + 1)), N(dv.e.v + 1)); return X; }
export const guided = f => () => toGuided(f(), 'full');
export const semi = f => () => toGuided(f(), 'semi');

// =====================================================================
// Série 5
// =====================================================================
// Plné postupy k příkladům ze Série 5 (ukážou se po „Nevím“ nebo po chybě)
const FULL = {
  i1: [
    R`Odmocniny přepiš na mocniny: $\sqrt{x} = x^{\frac{1}{2}}$, $\sqrt[3]{x} = x^{\frac{1}{3}}$, takže $\frac{\sqrt{x}}{\sqrt[3]{x}} = x^{\frac{1}{2} - \frac{1}{3}} = x^{\frac{1}{6}}$.`,
    R`Roznásob: $x^{\frac{1}{6}}(x^2 - 1) = x^{2 + \frac{1}{6}} - x^{\frac{1}{6}} = x^{\frac{13}{6}} - x^{\frac{1}{6}}$.`,
    R`Každý člen podle $\int x^n\,\mathrm{d}x = \frac{x^{n+1}}{n+1}$: $\int x^{\frac{13}{6}} = \frac{x^{19/6}}{19/6} = \frac{6}{19}x^{\frac{19}{6}}$ a $\int x^{\frac{1}{6}} = \frac{6}{7}x^{\frac{7}{6}}$.`,
    R`$\frac{6}{19}x^{\frac{19}{6}} - \frac{6}{7}x^{\frac{7}{6}} + C$`,
  ],
  i2: [
    R`Rozlož čitatel i jmenovatel: $x^3 - 1 = (x - 1)(x^2 + x + 1)$ a $x^2 - x = x(x - 1)$.`,
    R`Zkrať $(x - 1)$: zbyde $\frac{x^2 + x + 1}{x}$.`,
    R`Rozděl zlomek na tři: $x + 1 + \frac{1}{x}$.`,
    R`Člen po členu z tabulky: $\frac{x^2}{2} + x + \ln|x| + C$.`,
  ],
  i3: [
    R`Součin polynomu a kosinu: per partes. $u = 2x + 5$ (derivací se zjednoduší), $v' = \cos x$.`,
    R`$u' = 2$, $v = \sin x$.`,
    R`$\int u v' = u v - \int u' v$: $(2x + 5)\sin x - \int 2\sin x\,\mathrm{d}x$.`,
    R`$\int 2\sin x\,\mathrm{d}x = -2\cos x$, takže výsledek je $(2x + 5)\sin x + 2\cos x + C$.`,
  ],
  i4: [
    R`Per partes, $u$ je polynom: $u = x^2 + x + 1$, $v' = \sin x$, tedy $u' = 2x + 1$, $v = -\cos x$.`,
    R`$u v - \int u' v = -(x^2 + x + 1)\cos x + \int (2x + 1)\cos x\,\mathrm{d}x$.`,
    R`Zbylý integrál znovu per partes: $u = 2x + 1$, $v' = \cos x$, tedy $u' = 2$, $v = \sin x$: $\int (2x + 1)\cos x = (2x + 1)\sin x - \int 2\sin x = (2x + 1)\sin x + 2\cos x$.`,
    R`Dohromady: $-(x^2 + x + 1)\cos x + (2x + 1)\sin x + 2\cos x = (-x^2 - x + 1)\cos x + (2x + 1)\sin x + C$.`,
  ],
  i5: [
    R`Je tam logaritmus, takže per partes s $u = \ln x$ a $v' = \sqrt{x} = x^{\frac{1}{2}}$.`,
    R`$u' = \frac{1}{x}$, $v = \frac{x^{3/2}}{3/2} = \frac{2}{3}x^{\frac{3}{2}}$.`,
    R`$u v - \int u' v = \frac{2}{3}x^{\frac{3}{2}}\ln x - \int \frac{1}{x} \cdot \frac{2}{3}x^{\frac{3}{2}}\,\mathrm{d}x = \frac{2}{3}x^{\frac{3}{2}}\ln x - \frac{2}{3}\int x^{\frac{1}{2}}\,\mathrm{d}x$.`,
    R`$\frac{2}{3}\int x^{\frac{1}{2}} = \frac{2}{3} \cdot \frac{2}{3}x^{\frac{3}{2}} = \frac{4}{9}x^{\frac{3}{2}}$.`,
    R`$\frac{2}{3}x^{\frac{3}{2}}\ln x - \frac{4}{9}x^{\frac{3}{2}} + C$`,
  ],
  i6: [
    R`Uvnitř exponenciály je lineární výraz $3x + 7$.`,
    R`Integruj, jako by tam bylo jen $x$: $\int \mathrm{e}^x\,\mathrm{d}x = \mathrm{e}^x$, tedy $\mathrm{e}^{3x + 7}$.`,
    R`Vyděl číslem u $x$, tedy $3$: $\frac{1}{3}\mathrm{e}^{3x + 7} + C$.`,
    R`Kontrola derivací: $\left(\frac{1}{3}\mathrm{e}^{3x + 7}\right)' = \frac{1}{3}\mathrm{e}^{3x + 7} \cdot 3 = \mathrm{e}^{3x + 7}$. Sedí.`,
  ],
  i7: [
    R`Pod odmocninou je $x^3 + 1$ a vedle stojí $x^2$, což je až na číslo jeho derivace. Zvol $t = x^3 + 1$.`,
    R`$\mathrm{d}t = 3x^2\,\mathrm{d}x$, takže $x^2\,\mathrm{d}x = \frac{1}{3}\mathrm{d}t$.`,
    R`V proměnné $t$: $\frac{1}{3}\int \sqrt{t}\,\mathrm{d}t = \frac{1}{3}\int t^{\frac{1}{2}}\,\mathrm{d}t = \frac{1}{3} \cdot \frac{2}{3}t^{\frac{3}{2}} = \frac{2}{9}t^{\frac{3}{2}}$.`,
    R`Vrať $x$: $\frac{2}{9}(x^3 + 1)^{\frac{3}{2}} + C$, což je totéž co $\frac{2}{9}\sqrt{(x^3 + 1)^3} + C$.`,
  ],
  i8: [
    R`Pod odmocninou je $x^2 + 7$ a nahoře $x$, až na číslo jeho derivace. Zvol $t = x^2 + 7$.`,
    R`$\mathrm{d}t = 2x\,\mathrm{d}x$, takže $x\,\mathrm{d}x = \frac{1}{2}\mathrm{d}t$.`,
    R`V proměnné $t$: $\frac{1}{2}\int \frac{1}{\sqrt[3]{t}}\,\mathrm{d}t = \frac{1}{2}\int t^{-\frac{1}{3}}\,\mathrm{d}t = \frac{1}{2} \cdot \frac{t^{2/3}}{2/3} = \frac{3}{4}t^{\frac{2}{3}}$.`,
    R`Vrať $x$: $\frac{3}{4}(x^2 + 7)^{\frac{2}{3}} + C = \frac{3}{4}\sqrt[3]{(x^2 + 7)^2} + C$.`,
  ],
  i9: [
    R`Polynom lomeno polynom: parciální zlomky. $x^2 - 1 = (x - 1)(x + 1)$, hledáš $\frac{A}{x - 1} + \frac{B}{x + 1}$.`,
    R`Zakrývací trik pro $A$: zakryj $(x - 1)$ a do zbytku $\frac{x + 3}{x + 1}$ dosaď $x = 1$: $A = \frac{1 + 3}{1 + 1} = 2$.`,
    R`Pro $B$: zakryj $(x + 1)$ a do $\frac{x + 3}{x - 1}$ dosaď $x = -1$: $B = \frac{-1 + 3}{-1 - 1} = -1$.`,
    R`$\int \left(\frac{2}{x - 1} - \frac{1}{x + 1}\right)\mathrm{d}x = 2\ln|x - 1| - \ln|x + 1| + C$.`,
  ],
  i10: [
    R`Rozlož jmenovatel: $x^3 + x = x(x^2 + 1)$. Závorka $x^2 + 1$ nemá kořeny, takže hledáš $\frac{A}{x} + \frac{Bx + C}{x^2 + 1}$.`,
    R`Po převedení na společný jmenovatel musí platit $A(x^2 + 1) + (Bx + C)x = x^2 + x + 1$, tedy $(A + B)x^2 + Cx + A = x^2 + x + 1$.`,
    R`Porovnej čísla u stejných mocnin: $A = 1$, $C = 1$, $A + B = 1$, takže $B = 0$.`,
    R`$\int \left(\frac{1}{x} + \frac{1}{x^2 + 1}\right)\mathrm{d}x = \ln|x| + \operatorname{arctg} x + C$.`,
  ],
  i11: [
    R`Lichá mocnina sinu: jeden sinus oddělej, zbytek přepiš přes kosinus. $\sin^3 x = \sin^2 x \cdot \sin x = (1 - \cos^2 x)\sin x$.`,
    R`Substituce $t = \cos x$, $\mathrm{d}t = -\sin x\,\mathrm{d}x$, tedy $\sin x\,\mathrm{d}x = -\mathrm{d}t$.`,
    R`$-\int (1 - t^2)\,\mathrm{d}t = -t + \frac{t^3}{3}$.`,
    R`Vrať $x$: $\frac{\cos^3 x}{3} - \cos x + C$.`,
  ],
  i12: [
    R`Lichá mocnina sinu nahoře: $\sin^3 x = (1 - \cos^2 x)\sin x$, takže integrand je $\frac{(1 - \cos^2 x)\sin x}{\cos^2 x}$.`,
    R`Substituce $t = \cos x$, $\mathrm{d}t = -\sin x\,\mathrm{d}x$: $-\int \frac{1 - t^2}{t^2}\,\mathrm{d}t$.`,
    R`Rozděl zlomek: $\frac{1 - t^2}{t^2} = t^{-2} - 1$. Tedy $-\int (t^{-2} - 1)\,\mathrm{d}t = -\left(-\frac{1}{t} - t\right) = \frac{1}{t} + t$.`,
    R`Vrať $x$: $\frac{1}{\cos x} + \cos x + C$.`,
  ],
  i13: [
    R`Vadí odmocnina, schovej ji do $t$: $t = \sqrt{x}$, tedy $x = t^2$ a $\mathrm{d}x = 2t\,\mathrm{d}t$.`,
    R`$\int \frac{1}{1 + t} \cdot 2t\,\mathrm{d}t = \int \frac{2t}{1 + t}\,\mathrm{d}t$.`,
    R`Uprav čitatel: $\frac{2t}{1 + t} = \frac{2(1 + t) - 2}{1 + t} = 2 - \frac{2}{1 + t}$.`,
    R`$\int \left(2 - \frac{2}{1 + t}\right)\mathrm{d}t = 2t - 2\ln|1 + t|$.`,
    R`Vrať $x$: $2\sqrt{x} - 2\ln(1 + \sqrt{x}) + C$.`,
  ],
  i14: [
    R`Schovej odmocninu do $t$: $t = \sqrt{x + 2}$, tedy $x = t^2 - 2$ a $\mathrm{d}x = 2t\,\mathrm{d}t$.`,
    R`$\int (t^2 - 2)^2 \cdot t \cdot 2t\,\mathrm{d}t = 2\int (t^4 - 4t^2 + 4)\,t^2\,\mathrm{d}t = 2\int (t^6 - 4t^4 + 4t^2)\,\mathrm{d}t$.`,
    R`$= \frac{2t^7}{7} - \frac{8t^5}{5} + \frac{8t^3}{3}$.`,
    R`Vrať $t = \sqrt{x + 2}$: $\frac{2}{7}(x + 2)^{\frac{7}{2}} - \frac{8}{5}(x + 2)^{\frac{5}{2}} + \frac{8}{3}(x + 2)^{\frac{3}{2}} + C$. Tohle už je správná odpověď.`,
    R`Po vytknutí $(x + 2)^{\frac{3}{2}}$ a úpravě vyjde $\frac{2}{105}(15x^2 - 24x + 32)\sqrt{(x + 2)^3} + C$.`,
  ],
};
const du = (key, fT, FT, steps, hint) => () => card({ key, badge: 'Série 5', f: P(fT), answer: P(FT), steps: FULL[key] || steps, hint });
export const FIXED = {
  i1: du('i1', '√x (x^2 - 1)/∛x', '6/19 x^(19/6) - 6/7 x^(7/6)', ['$\\frac{\\sqrt{x}}{\\sqrt[3]{x}} = x^{1/2 - 1/3} = x^{1/6}$, takže integrand je $x^{13/6} - x^{1/6}$.', '$\\frac{6}{19}x^{19/6} - \\frac{6}{7}x^{7/6}$'], 'Převeď všechno na mocniny x.'),
  i2: du('i2', '(x^3 - 1)/(x^2 - x)', 'x^2/2 + x + ln|x|', ['$x^3 - 1 = (x - 1)(x^2 + x + 1)$, $x^2 - x = x(x - 1)$.', 'Po zkrácení $\\frac{x^2 + x + 1}{x} = x + 1 + \\frac{1}{x}$.'], 'Rozlož a zkrať.'),
  i3: du('i3', '(2x + 5) cos x', '2 cos x + (2x + 5) sin x', ['Per partes: $u = 2x + 5$, $v\' = \\cos x$.', '$(2x + 5)\\sin x - \\int 2\\sin x = (2x + 5)\\sin x + 2\\cos x$'], 'Per partes, u = polynom.'),
  i4: du('i4', '(x^2 + x + 1) sin x', '(-x^2 - x + 1) cos x + (2x + 1) sin x', ['Dvakrát per partes, $u$ = polynom.'], 'Per partes dvakrát.'),
  i5: du('i5', '√x ln x', '√(x^3) (2/3 ln x - 4/9)', ['Per partes: $u = \\ln x$, $v\' = \\sqrt{x}$, $v = \\frac{2}{3}x^{3/2}$.', '$\\frac{2}{3}x^{3/2}\\ln x - \\frac{2}{3}\\int x^{1/2} = \\frac{2}{3}x^{3/2}\\ln x - \\frac{4}{9}x^{3/2}$'], 'u = ln x.'),
  i6: du('i6', 'e^(3x + 7)', 'e^(3x + 7)/3', ['Lineární vnitřek: $\\frac{1}{3}\\mathrm{e}^{3x + 7}$.'], 'Vyděl číslem u x.'),
  i7: du('i7', 'x^2 √(x^3 + 1)', '2/9 √((x^3 + 1)^3)', ['$t = x^3 + 1$, $\\mathrm{d}t = 3x^2\\,\\mathrm{d}x$: $\\frac{1}{3}\\int \\sqrt{t}\\,\\mathrm{d}t = \\frac{2}{9}t^{3/2}$.'], 't = x³ + 1.'),
  i8: du('i8', 'x/∛(x^2 + 7)', '3/4 ∛((x^2 + 7)^2)', ['$t = x^2 + 7$, $\\mathrm{d}t = 2x\\,\\mathrm{d}x$: $\\frac{1}{2}\\int t^{-1/3}\\,\\mathrm{d}t = \\frac{3}{4}t^{2/3}$.'], 't = x² + 7.'),
  i9: du('i9', '(x + 3)/(x^2 - 1)', '2 ln|x - 1| - ln|x + 1|', ['$\\frac{A}{x - 1} + \\frac{B}{x + 1}$: $A = \\frac{1 + 3}{2} = 2$, $B = \\frac{-1 + 3}{-2} = -1$.'], 'Parciální zlomky.'),
  i10: du('i10', '(x^2 + x + 1)/(x^3 + x)', 'arctg x + ln|x|', ['$\\frac{A}{x} + \\frac{Bx + C}{x^2 + 1}$: $A = 1$, $B = 0$, $C = 1$.'], 'x³ + x = x(x² + 1).'),
  i11: du('i11', 'sin^3 x', 'cos^3 x/3 - cos x', ['$\\sin^3 x = (1 - \\cos^2 x)\\sin x$, $t = \\cos x$.'], 'Oddělej jeden sinus.'),
  i12: du('i12', 'sin^3 x / cos^2 x', 'cos x + 1/cos x', ['$t = \\cos x$: $-\\int \\frac{1 - t^2}{t^2}\\,\\mathrm{d}t = \\frac{1}{t} + t$.'], 't = cos x.'),
  i13: du('i13', '1/(1 + √x)', '2√x - 2 ln(√x + 1)', ['$t = \\sqrt{x}$, $\\mathrm{d}x = 2t\\,\\mathrm{d}t$: $\\int \\frac{2t}{1 + t}\\,\\mathrm{d}t = 2t - 2\\ln(1 + t)$.'], 't = √x.'),
  i14: du('i14', 'x^2 √(x + 2)', '2/105 (15x^2 - 24x + 32) √((x + 2)^3)', ['$t = \\sqrt{x + 2}$, $x = t^2 - 2$: $\\int (t^2 - 2)^2 t \\cdot 2t\\,\\mathrm{d}t$.'], 't = √(x + 2).'),
};

export const GEN = { tableQ, tableTyped, powerSum, rewrite, linSub, subst, byParts, partial, trig, rootSub, methodQ, ...FIXED };
