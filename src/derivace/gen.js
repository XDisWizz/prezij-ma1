// Generátory příkladů pro cestu "Derivace".
import * as S from '../sym.js';
import { ri, riNot, pick, shuffle } from '../ui.js';

const { N, X, E, BOX, add, mul, div, pow, neg, sub, fn, root, ln, subst } = S;
const P = S.parse;
const simp = S.simplify;
const D = e => simp(S.d(e));
const T = e => S.tex(e);
const fx = e => `f(x) = ${T(e)}`;
const card = o => ({ type: 'expr', prompt: 'Zderivuj', label: "$f'(x) =$", ...o });

// =====================================================================
// Tabulka derivací
// =====================================================================
export const TABLE = [
  { f: '5', d: '0', why: 'Konstanta se nemění, derivace je 0.' },
  { f: 'x', d: '1', why: '$x$ roste rychlostí 1.' },
  { f: 'x^2', d: '2x', why: 'Exponent dopředu, o jedna menší.' },
  { f: 'x^3', d: '3x^2', why: 'Exponent dopředu, o jedna menší.' },
  { f: '√x', d: '1/(2√x)', why: '$\\sqrt{x} = x^{1/2}$, takže $\\frac{1}{2}x^{-1/2}$.' },
  { f: '1/x', d: '-1/x^2', why: '$\\frac{1}{x} = x^{-1}$, takže $-x^{-2}$.' },
  { f: 'e^x', d: 'e^x', why: '$\\mathrm{e}^x$ je jediná funkce, která je sama sobě derivací.' },
  { f: '2^x', d: '2^x ln 2', why: '$(a^x)\' = a^x \\ln a$.' },
  { f: 'ln x', d: '1/x', why: '$(\\ln x)\' = \\frac{1}{x}$.' },
  { f: 'sin x', d: 'cos x', why: '$(\\sin x)\' = \\cos x$.' },
  { f: 'cos x', d: '-sin x', why: '$(\\cos x)\' = -\\sin x$. Pozor na mínus!' },
  { f: 'tg x', d: '1/cos^2 x', why: '$(\\operatorname{tg} x)\' = \\frac{1}{\\cos^2 x}$.' },
  { f: 'cotg x', d: '-1/sin^2 x', why: '$(\\operatorname{cotg} x)\' = -\\frac{1}{\\sin^2 x}$.' },
  { f: 'arcsin x', d: '1/√(1-x^2)', why: '$(\\arcsin x)\' = \\frac{1}{\\sqrt{1-x^2}}$.' },
  { f: 'arccos x', d: '-1/√(1-x^2)', why: '$(\\arccos x)\' = -\\frac{1}{\\sqrt{1-x^2}}$, jako arcsin, jen s mínusem.' },
  { f: 'arctg x', d: '1/(1+x^2)', why: '$(\\operatorname{arctg} x)\' = \\frac{1}{1+x^2}$.' },
  { f: 'arccotg x', d: '-1/(1+x^2)', why: '$(\\operatorname{arccotg} x)\' = -\\frac{1}{1+x^2}$, jako arctg, jen s mínusem.' },
];
const tbl = e => ({ ...e, F: P(e.f), Dd: P(e.d) });

/** základní řádky tabulky pro úplně první lekci (bez arcsin, arccotg, a^x…) */
const BASIC_ROWS = TABLE.filter(t => ['x', 'x^2', 'x^3', '√x', '1/x', 'e^x', 'ln x', 'sin x', 'cos x'].includes(t.f));
export const tableChoiceBasic = () => tableChoice(BASIC_ROWS);
export const tableReverseBasic = () => tableReverse(BASIC_ROWS.filter(t => t.f !== 'x'));
export function tableChoice(rows = TABLE.slice(1)) {
  const e = tbl(pick(rows));
  const opts = [{ label: `$${T(e.Dd)}$`, correct: true, why: e.why }];
  const cands = shuffle([simp(neg(e.Dd)), ...shuffle(rows.length < TABLE.length - 1 ? [...rows, TABLE[0]] : TABLE).map(t => P(t.d))]);
  for (const c of cands) {
    if (opts.length >= 4) break;
    const L = `$${T(simp(c))}$`;
    if (!opts.some(o => o.label === L) && !S.equiv(c, e.Dd)) opts.push({ label: L, correct: false, why: e.why });
  }
  return { type: 'choice', key: 'tableChoice', prompt: `Kolik je $\\left(${T(e.F)}\\right)'$?`, options: shuffle(opts), explain: e.why };
}

export function tableReverse(rows = TABLE.slice(2)) {
  const e = tbl(pick(rows));
  const opts = [{ label: `$${T(e.F)}$`, correct: true, why: e.why }];
  for (const t of shuffle(rows.length < TABLE.length - 2 ? [...rows, TABLE[1]] : TABLE.slice(1))) {
    if (opts.length >= 4) break;
    const L = `$${T(P(t.f))}$`;
    if (!opts.some(o => o.label === L) && !S.equiv(P(t.d), e.Dd)) opts.push({ label: L, correct: false, why: `$(${T(P(t.f))})' = ${T(P(t.d))}$` });
  }
  return { type: 'choice', key: 'tableReverse', prompt: `Která funkce má derivaci $${T(e.Dd)}$?`, options: shuffle(opts), explain: e.why };
}

export function tableTyped() {
  const e = tbl(pick(TABLE.slice(1)));
  return card({ key: 'tableTyped', fn: fx(e.F), answer: e.Dd, original: e.F, steps: [e.why], hint: 'Tohle je přímo z tabulky.' });
}

// =====================================================================
// Mocniny
// =====================================================================
const POW_FORMS = [
  () => { const n = ri(2, 9); return { f: P(`x^${n}`), n, re: null }; },
  () => { const k = ri(1, 4); return { f: P(k === 1 ? '1/x' : `1/x^${k}`), n: -k, re: `\\frac{1}{x${k === 1 ? '' : '^' + k}} = x^{${-k}}` }; },
  () => ({ f: P('√x'), n: 1 / 2, re: '\\sqrt{x} = x^{\\frac{1}{2}}' }),
  () => ({ f: P('∛x'), n: 1 / 3, re: '\\sqrt[3]{x} = x^{\\frac{1}{3}}' }),
  () => ({ f: P('1/√x'), n: -1 / 2, re: '\\frac{1}{\\sqrt{x}} = x^{-\\frac{1}{2}}' }),
  () => ({ f: P('∛(x^2)'), n: 2 / 3, re: '\\sqrt[3]{x^2} = x^{\\frac{2}{3}}' }),
];
export function powerRule() {
  const F = pick(POW_FORMS)();
  const c = pick([1, 1, 2, 3, 4, 5, -2, -3]);
  const f = simp(c === 1 ? F.f : mul(N(c), F.f));
  const n = F.n, nt = S.fmtNum(n), n1 = S.fmtNum(n - 1);
  const ans = D(f);
  const steps = [];
  if (F.re) steps.push(`Přepiš na mocninu: $${F.re}$.`);
  steps.push(`Exponent dopředu, exponent o jedna menší: $(x^{${nt}})' = ${nt}\\, ${n - 1 === 1 ? 'x' : `x^{${n1}}`}$.`);
  if (c !== 1) steps.push(`Konstanta $${c}$ před funkcí jen zůstane a vynásobí se.`);
  steps.push(`$f'(x) = ${T(ans)}$`);
  return card({
    key: 'powerRule', fn: fx(f), answer: ans, original: f, steps, hint: 'Přepiš na x na něco, exponent dopředu, exponent mínus jedna.',
    wrongs: [{ ast: simp(mul(N(c * n), pow(X, N(n)))), msg: 'Exponent dopředu je dobře, ale ještě ho musíš o jedna zmenšit.' }],
  });
}

// =====================================================================
// Součet a konstanta
// =====================================================================
const TERMS = ['x^2', 'x^3', 'x^4', 'x^5', '√x', '1/x', 'e^x', 'ln x', 'sin x', 'cos x', 'tg x', 'arctg x', 'x'];
export function linearCombo() {
  const k = pick([2, 3, 3]);
  const gs = shuffle(TERMS).slice(0, k);
  const terms = gs.map(g => { const c = pick([1, 2, 3, 4, 5, -1, -2, -3, 7]); return simp(c === 1 ? P(g) : mul(N(c), P(g))); });
  if (Math.random() < 0.6) terms.push(N(pick([1, 2, 3, 5, 7, -4, -6])));
  const f = simp(add(...terms));
  const ans = D(f);
  const steps = [`Derivuj každý člen zvlášť: ${terms.map(t => `$(${T(t)})' = ${T(D(t))}$`).join(', ')}.`, 'Číslo před funkcí zůstane, samotné číslo (konstanta) zmizí.', `$f'(x) = ${T(ans)}$`];
  return card({
    key: 'linearCombo', fn: fx(f), answer: ans, original: f, steps, hint: 'Každý člen zvlášť. Konstanta → 0.',
    parts: terms.filter(t => !S.isConst(t)).map(t => ({ title: `Zderivuj člen $${T(t)}$`, answer: D(t) })),
  });
}

// =====================================================================
// Součin a podíl
// =====================================================================
const U = ['x^2', 'x^3', 'x', 'e^x', 'sin x', 'cos x', 'ln x', 'x^2+1', '2x+3', '√x', 'arctg x', 'x^2-3x'];
export function product() {
  let u, v;
  do { u = pick(U); v = pick(U); } while (u === v || (u.includes('x^') && v.includes('x^') && !u.includes('+') && !v.includes('+')) || (u === 'x' && v.startsWith('x^')) || (v === 'x' && u.startsWith('x^')));
  const Uu = P(u), Vv = P(v);
  const f = mul(Uu, Vv);
  const du = D(Uu), dv = D(Vv);
  const ans = D(f);
  return card({
    key: 'product', fn: `f(x) = ${texProd(Uu, Vv)}`, answer: ans, original: f,
    steps: [`Součin: $(u \\cdot v)' = u' v + u v'$, kde $u = ${T(Uu)}$, $v = ${T(Vv)}$.`, `$u' = ${T(du)}$, $v' = ${T(dv)}$.`, `$f'(x) = ${T(add(simp(mul(du, Vv)), simp(mul(Uu, dv))))}$`],
    hint: "(uv)' = u'v + uv'",
    wrongs: [{ ast: simp(mul(du, dv)), msg: "Derivace součinu <b>není</b> součin derivací. Platí $(uv)' = u'v + uv'$." }],
    rule: 'součin', u: Uu, v: Vv,
  });
}
function texProd(a, b) {
  const w = e => (e.t === 'add' ? `\\left(${T(e)}\\right)` : T(e));
  return `${w(a)} ${a.t === 'fn' || b.t === 'add' && a.t !== 'add' ? '\\cdot ' : ''}${w(b)}`;
}

const QU = ['x+1', 'x-2', 'x^2', 'sin x', 'e^x', 'ln x', 'x', '2x-1', '1', 'x+5', '3'];
const QV = ['x', 'x+2', 'x^2+1', 'cos x', '4-x', 'x^2', 'x-1', 'e^x', '2x+1'];
export function quotient() {
  let u, v;
  do { u = pick(QU); v = pick(QV); } while (u === v || (u === 'x' && v === 'x^2') || (u === 'x^2' && v === 'x'));
  const Uu = P(u), Vv = P(v);
  const f = div(Uu, Vv);
  const du = D(Uu), dv = D(Vv);
  const ans = D(f);
  const vt = Vv.t === 'x' ? 'x' : `\\left(${T(Vv)}\\right)`;
  const numer = [simp(mul(du, Vv)), simp(neg(mul(Uu, dv)))].filter(t => !(t.t === 'num' && t.v === 0));
  return card({
    key: 'quotient', fn: fx(f), answer: ans, original: f,
    steps: [`Podíl: $\\left(\\frac{u}{v}\\right)' = \\frac{u' v - u v'}{v^2}$, kde $u = ${T(Uu)}$, $v = ${T(Vv)}$.`, `$u' = ${T(du)}$, $v' = ${T(dv)}$.`,
      `$f'(x) = \\frac{${T(numer.length === 1 ? numer[0] : add(...numer))}}{${vt}^2}$`, `Po úpravě: $${T(ans)}$`],
    hint: "(u/v)' = (u'v − uv') / v²",
    wrongs: [{ ast: simp(div(du, dv)), msg: "Derivace podílu <b>není</b> podíl derivací. Platí $\\left(\\frac{u}{v}\\right)' = \\frac{u'v - uv'}{v^2}$." },
      { ast: simp(div(sub(mul(du, Vv), mul(Uu, dv)), Vv)), msg: 'Skoro! Jmenovatel má být <b>na druhou</b>: $v^2$.' }],
    rule: 'podíl', u: Uu, v: Vv,
  });
}

// =====================================================================
// Složená funkce (řetízek)
// =====================================================================
export const OUTER = [
  { k: 'sin', mk: g => fn('sin', g) }, { k: 'cos', mk: g => fn('cos', g) }, { k: 'ln', mk: g => ln(g) },
  { k: 'exp', mk: g => pow(E, g) }, { k: 'sqrt', mk: g => root(2, g) }, { k: 'pow', mk: (g, n) => pow(g, N(n)) },
  { k: 'tg', mk: g => fn('tg', g) }, { k: 'arctg', mk: g => fn('arctg', g) },
];
const INNER = () => pick([
  () => P(`${ri(2, 5)}x${pick(['+', '-'])}${ri(1, 6)}`), () => P(`x^2+${ri(1, 5)}`), () => P(`x^3-${ri(2, 4)}x`), () => P(`${ri(2, 4)}x^2`),
  () => P('sin x'), () => P('cos x'), () => P('ln x'), () => P('e^x'), () => P('√x'), () => P(`${ri(2, 6)}x`),
])();
const outerLabel = (o, n) => T(o.mk(BOX, n));
function chainParts(o, g, n) {
  const outerFx = o.mk(X, n);
  const dOuter = simp(subst(S.d(outerFx), g));
  return { dOuter, dInner: D(g) };
}
export function chain() {
  let o, g, n;
  // vynecháváme kombinace, které se dají zjednodušit dřív, než se začne derivovat: ln(eˣ), e^(ln x), (eˣ)ⁿ, (√x)ⁿ, ln(√x), √(eˣ)
  const isExp = e => e.t === 'pow' && e.b.t === 'e', isRoot = e => e.t === 'root';
  do { o = pick(OUTER); g = INNER(); n = ri(2, 5); } while ((o.k === 'ln' && (isExp(g) || isRoot(g))) || (o.k === 'exp' && g.t === 'fn' && g.f === 'ln') || (o.k === 'sqrt' && ((g.t === 'fn' && g.f === 'cos') || isExp(g) || isRoot(g))) || (o.k === 'pow' && (isExp(g) || isRoot(g))));
  const f = o.mk(g, n);
  const { dOuter, dInner } = chainParts(o, g, n);
  const ans = D(f);
  return card({
    key: 'chain', fn: fx(f), answer: ans, original: f,
    steps: [`Vnější funkce: $${outerLabel(o, n)}$, vnitřek: $\\square = ${T(g)}$.`, `Derivace vnější (vnitřek nech být): $${T(dOuter)}$.`, `Krát derivace vnitřku: $${T(dInner)}$.`, `$f'(x) = ${T(ans)}$`],
    hint: 'Vnější derivace (vnitřek nech) × derivace vnitřku.',
    wrongs: [{ ast: dOuter, msg: `Chybí <b>vnitřní derivace</b>. Vynásob ještě derivací vnitřku: $${T(dInner)}$.` }],
    rule: 'složená', outer: o, n, g, dOuter, dInner,
  });
}

/** cibule: dvě vrstvy */
const MID = [{ k: 'sin', mk: g => fn('sin', g) }, { k: 'cos', mk: g => fn('cos', g) }, { k: 'ln', mk: g => ln(g) }, { k: 'exp', mk: g => pow(E, g) }, { k: 'tg', mk: g => fn('tg', g) }, { k: 'arctg', mk: g => fn('arctg', g) }];
export function chain2() {
  let o, mdl, g, n;
  do { o = pick([OUTER[5], OUTER[5], OUTER[4], OUTER[2], OUTER[0], OUTER[3]]); mdl = pick(MID); g = P(pick([`${ri(2, 4)}x`, 'x^2', `x^2+${ri(1, 3)}`, `${ri(2, 3)}x+1`])); n = ri(2, 4); }
  while (o.k === mdl.k || (o.k === 'ln' && mdl.k === 'exp') || (o.k === 'exp' && mdl.k === 'ln') || ((o.k === 'sin' || o.k === 'exp') && (mdl.k === 'exp' || mdl.k === 'tg')) || (o.k === 'sqrt' && mdl.k === 'tg') || (o.k === 'pow' && mdl.k === 'exp') || (o.k === 'sqrt' && (mdl.k === 'cos' || mdl.k === 'sin')) || (o.k === 'ln' && (mdl.k === 'cos' || mdl.k === 'sin' || mdl.k === 'tg')));
  const inner = mdl.mk(g);
  const f = o.mk(inner, n);
  const l1 = simp(subst(S.d(o.mk(X, n)), inner)), l2 = simp(subst(S.d(mdl.mk(X)), g)), l3 = D(g);
  const ans = D(f);
  return card({
    key: 'chain2', fn: fx(f), answer: ans, original: f,
    steps: [`Tři vrstvy: $${outerLabel(o, n)}$, pod ní $${T(mdl.mk(BOX))}$, uvnitř $${T(g)}$.`, `Vnější: $${T(l1)}$.`, `Prostřední: $${T(l2)}$.`, `Nejvnitřnější: $${T(l3)}$.`, `Všechno vynásob: $f'(x) = ${T(ans)}$`],
    hint: 'Loupej jako cibuli: derivace každé vrstvy, všechno vynásob.',
    wrongs: [{ ast: simp(mul(l1, l2)), msg: `Chybí derivace nejvnitřnější vrstvy: $${T(l3)}$.` }, { ast: l1, msg: 'Máš jen derivaci vnějšího obalu. Pokračuj dovnitř a všechno vynásob.' }],
    layers: [{ t: outerLabel(o, n), d: l1, inner: inner }, { t: T(mdl.mk(BOX)), d: l2, inner: g }, { t: T(g), d: l3 }],
  });
}

/** Co je vnější funkce? */
export function cibuleQ() {
  const c = Math.random() < 0.5 ? chain() : chain2();
  const right = c.outer ? outerLabel(c.outer, c.n) : c.layers[0].t;
  const others = shuffle(OUTER).map(o => outerLabel(o, ri(2, 4))).filter(l => l !== right);
  const opts = [{ label: `$${right}$`, correct: true }, ...[...new Set(others)].slice(0, 3).map(l => ({ label: `$${l}$`, correct: false }))];
  const why = `Vnější funkce je ta, která se na kalkulačce počítá <b>poslední</b>. Tady: $${right}$.`;
  return { type: 'choice', key: 'cibuleQ', prompt: 'Co je <b>vnější</b> funkce (poslední vrstva cibule)?', context: c.fn, options: shuffle(opts).map(o => ({ ...o, why })), explain: why };
}

// =====================================================================
// f(x)^g(x)
// =====================================================================
export function fpowg() {
  let b, g;
  do { b = pick(['x', 'sin x', 'x^2+1', 'ln x', 'cos x', 'x+1']); g = pick(['x', 'x^2', 'sin x', '√x', 'ln x', '2x']); } while (b === g && b !== 'x');   // x^x je klasika, ostatní stejné dvojice ne
  const B = P(b), G = P(g);
  const f = pow(B, G);
  const inner = simp(mul(G, ln(B)));
  const dIn = D(inner);
  const ans = D(f);
  const pts = b === 'ln x' ? [1.21, 1.67, 2.3, 2.9, 3.6, 4.4, 5.3] : undefined;
  return card({
    key: 'fpowg', fn: fx(f), answer: ans, original: f, pts,
    steps: [`Proměnná je v základu i v exponentu, tabulka nepomůže. Přepiš podle $f^g = \\mathrm{e}^{g \\ln f}$: $f = \\mathrm{e}^{${T(inner)}}$.`,
      `Teď je to řetízek: $\\left(\\mathrm{e}^{\\square}\\right)' = \\mathrm{e}^{\\square} \\cdot \\square'$. Potřebuješ derivaci exponentu.`,
      `Exponent je součin: $(${T(G)})' = ${T(D(G))}$ a $(${T(ln(B))})' = ${T(D(ln(B)))}$, takže $(${T(inner)})' = ${T(dIn)}$.`,
      `$\\mathrm{e}^{${T(inner)}}$ je původní funkce, takže $f'(x) = ${T(f)} \\cdot \\left(${T(dIn)}\\right)$.`],
    hint: 'f^g = e^(g·ln f). Pak řetízek.',
    wrongs: [{ ast: simp(mul(G, pow(B, sub(G, N(1))), D(B))), msg: 'Mocninné pravidlo $(x^n)\' = nx^{n-1}$ platí jen pro <b>konstantní</b> exponent.' },
      { ast: simp(mul(f, ln(B), D(G))), msg: 'Tohle by platilo jen pro konstantní základ. Tady je $x$ i v základu.' }],
    rule: 'f^g', inner, dIn, B, G,
  });
}

// =====================================================================
// Které pravidlo?
// =====================================================================
const RULES = { součet: 'součet (každý člen zvlášť)', součin: 'součin', podíl: 'podíl', složená: 'složená funkce (řetízek)', 'f^g': 'f(x)^g(x) přes e' };
export function ruleWhich() {
  const kind = pick(['součet', 'součin', 'podíl', 'složená', 'složená', 'f^g']);
  const c = kind === 'součet' ? linearCombo() : kind === 'součin' ? product() : kind === 'podíl' ? quotient() : kind === 'složená' ? chain() : fpowg();
  const why = {
    součet: 'Navrchu je <b>plus nebo mínus</b>: derivuješ každý člen zvlášť.',
    součin: 'Navrchu jsou dvě funkce <b>vynásobené</b>: $(uv)\' = u\'v + uv\'$.',
    podíl: 'Navrchu je <b>zlomek</b> s $x$ ve jmenovateli: $\\left(\\frac{u}{v}\\right)\' = \\frac{u\'v - uv\'}{v^2}$.',
    složená: 'Funkce <b>uvnitř funkce</b>: vnější derivace × vnitřní derivace.',
    'f^g': '$x$ je v základu <b>i</b> v exponentu: přepiš na $\\mathrm{e}^{g \\ln f}$.',
  }[kind];
  return { type: 'choice', key: 'ruleWhich', prompt: 'Jaké pravidlo použiješ <b>jako první</b>?', context: c.fn, options: shuffle(Object.entries(RULES).map(([k, l]) => ({ label: l, correct: k === kind, why }))), explain: why };
}

// =====================================================================
// Řešení po krocích
// =====================================================================
const RULE_OPTS = (right, why) => shuffle(Object.entries(RULES).filter(([k]) => k !== 'f^g' || right === 'f^g').slice(0, 5)
  .map(([k, l]) => ({ label: l, correct: k === right, why })));

export function toGuided(c, level = 'full') {
  const fin = { kind: 'expr', title: 'Teď celá derivace', label: "$f'(x) =$", answer: c.answer, wrongs: c.wrongs, original: c.original, pts: c.pts, final: true };
  let g = [];
  if (c.key === 'linearCombo') {
    g = level === 'full' ? c.parts.map(p => ({ kind: 'expr', title: p.title, label: "$(\\dots)' =$", answer: p.answer, pts: c.pts })) : [];
  } else if (c.rule === 'součin' || c.rule === 'podíl') {
    const why = c.rule === 'součin' ? "$(uv)' = u'v + uv'$" : "$\\left(\\frac{u}{v}\\right)' = \\frac{u'v - uv'}{v^2}$";
    g.push({ kind: 'choice', title: 'Jaké pravidlo použiješ?', options: RULE_OPTS(c.rule, why) });
    if (level === 'full') {
      g.push({ kind: 'expr', title: `$u = ${T(c.u)}$, zderivuj: `, label: "$u' =$", answer: D(c.u) });
      g.push({ kind: 'expr', title: `$v = ${T(c.v)}$, zderivuj: `, label: "$v' =$", answer: D(c.v) });
      fin.info = `Dosaď do ${why}.`;
    }
  } else if (c.rule === 'složená') {
    const why = 'Funkce uvnitř funkce.';
    const right = outerLabel(c.outer, c.n);
    const others = [...new Set(shuffle(OUTER).map(o => outerLabel(o, c.n)).filter(l => l !== right))].slice(0, 3);
    g.push({ kind: 'choice', title: 'Co je vnější funkce?', options: shuffle([{ label: `$${right}$`, correct: true, why }, ...others.map(l => ({ label: `$${l}$`, correct: false, why: `Vnější je $${right}$, počítá se poslední.` }))]) });
    if (level === 'full') {
      g.push({ kind: 'expr', title: 'Derivace vnější funkce, <b>vnitřek nech být</b>', info: `vnitřek $= ${T(c.g)}$`, label: '', answer: c.dOuter });
      g.push({ kind: 'expr', title: `Derivace vnitřku $${T(c.g)}$`, label: '', answer: c.dInner });
      fin.info = 'Vynásob: vnější × vnitřní.';
    }
  } else if (c.key === 'chain2') {
    if (level === 'full') {
      g = c.layers.map((L, i) => ({ kind: 'expr', title: i === 0 ? `Vnější vrstva $${L.t}$` : i === 1 ? `Prostřední vrstva $${L.t}$` : `Nejvnitřnější $${L.t}$`, info: L.inner ? `(to, co je pod ní, nech být: $${T(L.inner)}$)` : '', label: '', answer: L.d }));
      fin.info = 'Všechny tři vrstvy vynásob.';
    }
  } else if (c.rule === 'f^g') {
    const fgOpts = [
      { label: `$\\mathrm{e}^{${T(c.inner)}}$`, correct: true, why: '$f^g = \\mathrm{e}^{g \\ln f}$' },
      { label: `$\\mathrm{e}^{${T(simp(mul(c.B, ln(c.G))))}}$`, correct: false, why: 'Obráceně: $f^g = \\mathrm{e}^{g \\ln f}$, logaritmus je ze <b>základu</b>.' },
      { label: `$${T(simp(mul(c.G, pow(c.B, sub(c.G, N(1))))))}$`, correct: false, why: 'Mocninné pravidlo platí jen pro konstantní exponent.' },
      { label: `$${T(simp(mul(c.original, ln(c.B))))}$`, correct: false, why: 'Pravidlo $(a^x)\' = a^x \\ln a$ platí jen pro konstantní základ.' },
    ];
    // u x^x vyjde „obrácená“ možnost stejně jako správná, takže ji vyhodíme (stejné popisky jen jednou)
    g.push({ kind: 'choice', title: 'Jak to přepíšeš?', options: shuffle(fgOpts.filter((o, i) => fgOpts.findIndex(p => p.label === o.label) === i).slice(0, 3)) });
    if (level === 'full') g.push({ kind: 'expr', title: `Zderivuj exponent $${T(c.inner)}$`, label: '', answer: c.dIn, pts: c.pts });
    fin.info = `Výsledek $= ${T(c.original)} \\cdot (\\text{derivace exponentu})$.`;
  }
  return { type: 'guided', key: c.key + ':' + level, badge: c.badge, fn: c.fn, prompt: level === 'full' ? 'Zderivuj krok po kroku' : 'Zderivuj', gsteps: [...g, fin], answer: c.answer, steps: c.steps, hint: c.hint };
}
export const guided = f => () => toGuided(f(), 'full');
export const semi = f => () => toGuided(f(), 'semi');

// =====================================================================
// Tečna
// =====================================================================
const TANG = [
  () => { const a = ri(-3, 3), b = ri(-4, 4), c = ri(-2, 2); return { f: P(`x^2 ${a < 0 ? '-' : '+'} ${Math.abs(a)}x ${b < 0 ? '-' : '+'} ${Math.abs(b)}`), c }; },
  () => { const [a, b] = pick([[3, 4], [4, 3], [6, 8], [8, 6], [5, 12], [12, 5]]); return { f: P(`√(x^2+${b * b})`), c: pick([a, -a]) }; },
  () => { const [c, k] = pick([[2, 3], [3, 5], [3, 8], [4, 12]]); return { f: P(`1/√(x^2-${k})`), c }; },
  () => { const a = ri(1, 5); return { f: P(`(x+${a})/(x^2+x+1)`), c: 0 }; },
  () => ({ f: P('ln x'), c: 1 }),
  () => { const k = ri(2, 3); return { f: P(`e^(${k}x)`), c: 0 }; },
  () => { const a = ri(1, 3); return { f: P(`x^3 - ${a}x`), c: pick([-1, 1, 2]) }; },
];
export function tangent(given) {
  const src = given || pick(TANG)();
  const c = src.c, f = given ? src.f : simp(src.f);   // simp: ať v zadání není „x² + 0x + 0“ nebo „x³ − 1x“
  const fc = simp(N(S.ev(f, c))), df = D(f), k = simp(N(S.ev(df, c)));
  const line = simp(add(fc, mul(k, sub(X, N(c)))));
  const cT = c < 0 ? `(${c})` : c;
  // dosazení do vzorce vysázené bez „+ −2“ a „(x − 0)“
  const kv = S.ev(k, 0), shift = c === 0 ? 'x' : `(x ${c < 0 ? '+' : '-'} ${Math.abs(c)})`;
  const plugged = `${T(fc)} ${kv < 0 ? '-' : '+'} ${T(simp(N(Math.abs(kv))))}\\,${shift}`;
  const steps = [`Rovnice tečny v bodě $x_0 = ${c}$: $y = f(x_0) + f'(x_0)(x - x_0)$.`, `$f(${c}) = ${T(fc)}$.`, `$f'(x) = ${T(df)}$, takže $f'(${c}) = ${T(k)}$.`, `$y = ${plugged}$, tedy $y = ${T(line)}$.`];
  return {
    type: 'guided', key: given?.key || 'tangent', badge: given?.badge, fn: `${fx(f)},\\quad x_0 = ${c}`, prompt: 'Najdi rovnici tečny',
    gsteps: [
      { kind: 'expr', numeric: true, title: `Hodnota funkce v bodě: $f(${c})$`, label: `$f(${c}) =$`, answer: fc },
      { kind: 'expr', title: 'Derivace', label: "$f'(x) =$", answer: df, original: f },
      { kind: 'expr', numeric: true, title: `Sklon tečny: $f'(${c})$`, label: `$f'(${c}) =$`, answer: k },
      { kind: 'expr', final: true, title: 'Rovnice tečny', info: `$y = f(${c}) + f'(${c})\\,${c === 0 ? 'x' : `(x - ${cT})`}$`, label: '$y =$', answer: line },
    ],
    answer: line, steps, hint: "y = f(x₀) + f'(x₀)(x − x₀)",
  };
}

// =====================================================================
// Pevné příklady ze Série 2 a z videí
// =====================================================================
// Plné postupy k pevným příkladům (ukážou se po „Nevím“ nebo po chybě). R = text bez zdvojování zpětných lomítek.
const R = String.raw;
const FULL = {
  d1: [
    R`Je to složená funkce: vnější $\arcsin\square$, vnitřek $\square = \frac{1}{x}$.`,
    R`Derivace vnější funkce je z tabulky $\frac{1}{\sqrt{1 - \square^2}}$. Vnitřek do ní jen opiš: $\frac{1}{\sqrt{1 - \frac{1}{x^2}}}$.`,
    R`Derivace vnitřku: $\left(\frac{1}{x}\right)' = -\frac{1}{x^2}$.`,
    R`Vynásob: $f'(x) = \frac{1}{\sqrt{1 - \frac{1}{x^2}}} \cdot \left(-\frac{1}{x^2}\right) = -\frac{1}{x^2\sqrt{1 - \frac{1}{x^2}}}$.`,
    'Dál to upravovat nemusíš, kontrola pozná každý správný tvar.',
  ],
  d2: [
    R`$x$ je v základu i v exponentu, takže tabulka nestačí. Přepiš: $f = \mathrm{e}^{x^2 \ln(\sin x)}$.`,
    R`$\left(\mathrm{e}^{\square}\right)' = \mathrm{e}^{\square} \cdot \square'$. Potřebuješ tedy derivaci exponentu $x^2 \ln(\sin x)$.`,
    R`Exponent je součin: $u = x^2$, $u' = 2x$ a $v = \ln(\sin x)$, $v' = \frac{1}{\sin x} \cdot \cos x$ (řetízek).`,
    R`$u'v + uv' = 2x \ln(\sin x) + x^2 \frac{\cos x}{\sin x}$.`,
    R`$\mathrm{e}^{x^2 \ln(\sin x)}$ je původní funkce, takže $f'(x) = (\sin x)^{x^2}\left(2x \ln(\sin x) + x^2 \frac{\cos x}{\sin x}\right)$.`,
  ],
  d3: [
    R`Čtyři vrstvy, zvenku dovnitř: $\square^2$, $\sin\square$, $\square^3$, $\cos x$. Zderivuj každou a všechno vynásob.`,
    R`$\square^2$: derivace $2\square$, tedy $2\sin(\cos^3 x)$.`,
    R`$\sin\square$: derivace $\cos\square$, tedy $\cos(\cos^3 x)$.`,
    R`$\square^3$: derivace $3\square^2$, tedy $3\cos^2 x$.`,
    R`$\cos x$: derivace $-\sin x$.`,
    R`Vynásob: $f'(x) = 2\sin(\cos^3 x) \cdot \cos(\cos^3 x) \cdot 3\cos^2 x \cdot (-\sin x) = -6 \sin(\cos^3 x) \cos(\cos^3 x) \cos^2 x \sin x$.`,
  ],
  d4: [
    R`Složená funkce: vnější $\ln\square$, vnitřek $\square = \operatorname{arctg} x$.`,
    R`Derivace vnější: $\frac{1}{\square}$, tedy $\frac{1}{\operatorname{arctg} x}$.`,
    R`Derivace vnitřku: $(\operatorname{arctg} x)' = \frac{1}{1 + x^2}$.`,
    R`Vynásob: $f'(x) = \frac{1}{\operatorname{arctg} x} \cdot \frac{1}{1 + x^2} = \frac{1}{(1 + x^2)\operatorname{arctg} x}$.`,
  ],
  d5: [
    'Je to rozdíl dvou členů, každý zderivuj zvlášť.',
    R`První člen je podíl: $u = x + 5$, $u' = 1$ a $v = 4 - x$, $v' = -1$.`,
    R`$\frac{u'v - uv'}{v^2} = \frac{1 \cdot (4 - x) - (x + 5) \cdot (-1)}{(4 - x)^2} = \frac{4 - x + x + 5}{(4 - x)^2} = \frac{9}{(4 - x)^2}$.`,
    R`Druhý člen je složená funkce: vnější $\sqrt{\square}$ má derivaci $\frac{1}{2\sqrt{\square}}$, vnitřek $x^2 + 1$ má derivaci $2x$. Dohromady $\frac{2x}{2\sqrt{x^2 + 1}} = \frac{x}{\sqrt{x^2 + 1}}$.`,
    R`$f'(x) = \frac{9}{(4 - x)^2} - \frac{x}{\sqrt{x^2 + 1}}$.`,
  ],
  d6: [
    R`Odmocninu přepiš na mocninu: $f = (x^3 + x^2 - 6)^{\frac{1}{3}}$. Vnější $\square^{\frac{1}{3}}$, vnitřek $x^3 + x^2 - 6$.`,
    R`Derivace vnější: $\frac{1}{3}\square^{-\frac{2}{3}} = \frac{1}{3\sqrt[3]{\square^2}}$.`,
    R`Derivace vnitřku: $3x^2 + 2x$.`,
    R`Vynásob: $f'(x) = \frac{3x^2 + 2x}{3\sqrt[3]{(x^3 + x^2 - 6)^2}}$.`,
  ],
  d7: [
    R`Složená funkce: vnější $\ln\square$, vnitřek $\square = x + \sqrt{x^2 - 1}$.`,
    R`Derivace vnější: $\frac{1}{x + \sqrt{x^2 - 1}}$.`,
    R`Derivace vnitřku: $(x)' = 1$ a $\left(\sqrt{x^2 - 1}\right)' = \frac{2x}{2\sqrt{x^2 - 1}} = \frac{x}{\sqrt{x^2 - 1}}$, dohromady $1 + \frac{x}{\sqrt{x^2 - 1}}$.`,
    R`$f'(x) = \frac{1}{x + \sqrt{x^2 - 1}} \cdot \left(1 + \frac{x}{\sqrt{x^2 - 1}}\right)$. Tohle už je správná odpověď.`,
    R`Jde to ještě zkrátit: $1 + \frac{x}{\sqrt{x^2 - 1}} = \frac{\sqrt{x^2 - 1} + x}{\sqrt{x^2 - 1}}$, čitatel se pokrátí s prvním zlomkem a zbyde $f'(x) = \frac{1}{\sqrt{x^2 - 1}}$.`,
  ],
  d8: [
    R`Nejdřív uprav podle $\ln(a^b) = b \ln a$: $f(x) = \ln(x^x) = x \ln x$.`,
    R`Teď je to součin: $u = x$, $u' = 1$ a $v = \ln x$, $v' = \frac{1}{x}$.`,
    R`$f'(x) = u'v + uv' = 1 \cdot \ln x + x \cdot \frac{1}{x} = \ln x + 1$.`,
  ],
  d9: [
    R`Tři členy, každý zvlášť. $(5)' = 0$.`,
    R`$\operatorname{arccotg}$ je složená funkce s vnitřkem $u = \frac{2 - x}{1 + 2x}$. Z tabulky $(\operatorname{arccotg}\square)' = -\frac{1}{1 + \square^2}$.`,
    R`Derivace vnitřku (podíl): $u' = \frac{(-1)(1 + 2x) - (2 - x) \cdot 2}{(1 + 2x)^2} = \frac{-1 - 2x - 4 + 2x}{(1 + 2x)^2} = \frac{-5}{(1 + 2x)^2}$.`,
    R`$1 + u^2 = \frac{(1 + 2x)^2 + (2 - x)^2}{(1 + 2x)^2} = \frac{1 + 4x + 4x^2 + 4 - 4x + x^2}{(1 + 2x)^2} = \frac{5 + 5x^2}{(1 + 2x)^2}$.`,
    R`Dohromady: $-\frac{(1 + 2x)^2}{5 + 5x^2} \cdot \frac{-5}{(1 + 2x)^2} = \frac{5}{5 + 5x^2} = \frac{1}{1 + x^2}$.`,
    R`Poslední člen: $(\operatorname{arctg} x)' = \frac{1}{1 + x^2}$.`,
    R`$f'(x) = 0 + \frac{1}{1 + x^2} - \frac{1}{1 + x^2} = 0$. Funkce je ve skutečnosti konstantní.`,
  ],
  dv1: [
    R`Složená funkce: vnější $\ln\square$, vnitřek $\square = \ln x$.`,
    R`Derivace vnější: $\frac{1}{\square} = \frac{1}{\ln x}$. Derivace vnitřku: $\frac{1}{x}$.`,
    R`Vynásob: $f'(x) = \frac{1}{\ln x} \cdot \frac{1}{x} = \frac{1}{x \ln x}$.`,
  ],
  dv2: [
    R`Navrchu je zlomek, takže podíl: $u = x^2 \cos x$, $v = x^3 + 1$.`,
    R`$u$ je součin, zderivuj ho zvlášť: $u' = 2x \cos x + x^2 \cdot (-\sin x) = 2x \cos x - x^2 \sin x$.`,
    R`$v' = 3x^2$.`,
    R`Dosaď do $\frac{u'v - uv'}{v^2}$: $f'(x) = \frac{(2x \cos x - x^2 \sin x)(x^3 + 1) - x^2 \cos x \cdot 3x^2}{(x^3 + 1)^2}$.`,
    R`$x^2 \cdot 3x^2 = 3x^4$, takže $f'(x) = \frac{(2x \cos x - x^2 \sin x)(x^3 + 1) - 3x^4 \cos x}{(x^3 + 1)^2}$. Roznásobovat nemusíš.`,
  ],
  dv3: [
    R`Navrchu je součin: $u = x^2$, $v = \sin(x^3 + x^2)$.`,
    R`$u' = 2x$.`,
    R`$v$ je složená funkce: vnější $\sin\square$ dá $\cos(x^3 + x^2)$, vnitřek dá $3x^2 + 2x$. Tedy $v' = \cos(x^3 + x^2) \cdot (3x^2 + 2x)$.`,
    R`$f'(x) = u'v + uv' = 2x \sin(x^3 + x^2) + x^2 \cos(x^3 + x^2)(3x^2 + 2x)$.`,
  ],
  dv4: [
    R`$x$ je v základu i v exponentu. Přepiš: $f = \mathrm{e}^{x \ln(1 + x^2)}$.`,
    R`$\left(\mathrm{e}^{\square}\right)' = \mathrm{e}^{\square} \cdot \square'$, takže potřebuješ derivaci exponentu $x \ln(1 + x^2)$.`,
    R`Je to součin: $(x)' = 1$ a $\left(\ln(1 + x^2)\right)' = \frac{1}{1 + x^2} \cdot 2x = \frac{2x}{1 + x^2}$.`,
    R`$\left(x \ln(1 + x^2)\right)' = 1 \cdot \ln(1 + x^2) + x \cdot \frac{2x}{1 + x^2} = \ln(1 + x^2) + \frac{2x^2}{1 + x^2}$.`,
    R`$f'(x) = (1 + x^2)^x \left(\ln(1 + x^2) + \frac{2x^2}{1 + x^2}\right)$.`,
  ],
};
const du = (key, f, ans, steps, hint, badge = 'Série 2', pts) => () => {
  const F = P(f), A = P(ans);
  return card({ key, badge, fn: fx(F), answer: A, original: F, steps: FULL[key] || steps, hint, pts });
};
export const FIXED = {
  d1: du('d1', 'arcsin(1/x)', '-1/(x^2 √(1-1/x^2))', ['Složená: vnější $\\arcsin\\square$, vnitřek $\\frac{1}{x}$.', '$\\frac{1}{\\sqrt{1 - \\frac{1}{x^2}}} \\cdot \\left(-\\frac{1}{x^2}\\right)$'], 'Vnější arcsin, vnitřní 1/x.', 'Série 2', [-2.7, -1.6, 1.21, 1.67, 2.3, 2.9, 3.6]),
  d2: du('d2', '(sin x)^(x^2)', '(sin x)^(x^2) (2x ln(sin x) + x^2 cos x / sin x)', ['$f = \\mathrm{e}^{x^2 \\ln(\\sin x)}$.', "$(x^2 \\ln \\sin x)' = 2x \\ln(\\sin x) + x^2 \\frac{\\cos x}{\\sin x}$.", 'Krát původní funkce.'], 'f^g = e^(g ln f)', 'Série 2', [0.17, 0.42, 0.73, 1.21, 1.67, 2.3, 2.9]),
  d3: du('d3', 'sin^2(cos^3 x)', '-6 sin(cos^3 x) cos(cos^3 x) cos^2 x sin x', ['Čtyři vrstvy: $\\square^2$, $\\sin\\square$, $\\square^3$, $\\cos x$. Derivace každé vrstvy, všechno vynásob.', '$2\\sin(\\cos^3 x) \\cdot \\cos(\\cos^3 x) \\cdot 3\\cos^2 x \\cdot (-\\sin x)$'], 'Cibule: druhá mocnina, sin, třetí mocnina, cos.'),
  d4: du('d4', 'ln(arctg x)', '1/((x^2+1) arctg x)', ['$\\frac{1}{\\operatorname{arctg} x} \\cdot \\frac{1}{1 + x^2}$'], 'Vnější ln, vnitřní arctg.'),
  d5: du('d5', '(x+5)/(4-x) - √(x^2+1)', '9/(4-x)^2 - x/√(x^2+1)', ["Podíl: $\\frac{1 \\cdot (4-x) - (x+5)(-1)}{(4-x)^2} = \\frac{9}{(4-x)^2}$.", "$(\\sqrt{x^2+1})' = \\frac{2x}{2\\sqrt{x^2+1}}$."], 'Podíl a pak složená funkce.'),
  d6: du('d6', '∛(x^3+x^2-6)', '(3x^2+2x)/(3∛((x^3+x^2-6)^2))', ['$\\sqrt[3]{\\square} = \\square^{1/3}$, derivace $\\frac{1}{3}\\square^{-2/3}$.', 'Krát vnitřní derivace $3x^2 + 2x$.'], 'Třetí odmocnina = mocnina 1/3.'),
  d7: du('d7', 'ln(x+√(x^2-1))', '1/√(x^2-1)', ['$\\frac{1}{x + \\sqrt{x^2-1}} \\cdot \\left(1 + \\frac{x}{\\sqrt{x^2-1}}\\right)$', 'Závorka $= \\frac{\\sqrt{x^2-1} + x}{\\sqrt{x^2-1}}$, takže se to pokrátí: $\\frac{1}{\\sqrt{x^2-1}}$.'], 'Vnější ln, pak se to hezky pokrátí.', 'Série 2', [1.21, 1.67, 2.3, 2.9, 3.6, 4.4]),
  d8: du('d8', 'ln(x^x)', '1 + ln x', ['$\\ln(x^x) = x \\ln x$ (vlastnost logaritmu).', "$(x \\ln x)' = \\ln x + x \\cdot \\frac{1}{x} = 1 + \\ln x$."], 'Nejdřív uprav: ln(a^b) = b ln a.'),
  d9: du('d9', '5 + arccotg((2-x)/(1+2x)) - arctg x', '0', ['Zderivuj arccotg přes řetízek a zjednoduš.', 'Všechno se odečte: $f\'(x) = 0$ (funkce je konstantní).'], 'Výsledek je překvapivě jednoduchý.', 'Série 2', [0.17, 0.42, 0.73, 1.21, 1.67, 2.3]),
  dv1: du('dv1', 'ln(ln x)', '1/(x ln x)', ['$\\frac{1}{\\ln x} \\cdot \\frac{1}{x}$'], 'Vnější ln, vnitřní ln.', 'Z videa', [1.21, 1.67, 2.3, 2.9, 3.6]),
  dv2: du('dv2', 'x^2 cos x/(x^3+1)', '((2x cos x - x^2 sin x)(x^3+1) - 3x^4 cos x)/(x^3+1)^2', ["Podíl, kde čitatel je součin: $u = x^2\\cos x$, $u' = 2x\\cos x - x^2 \\sin x$.", '$v = x^3 + 1$, $v\' = 3x^2$.'], 'Podíl, v čitateli součin.', 'Z videa'),
  dv3: du('dv3', 'x^2 sin(x^3+x^2)', '2x sin(x^3+x^2) + x^2 cos(x^3+x^2)(3x^2+2x)', ['Součin: $u = x^2$, $v = \\sin(x^3 + x^2)$.', "$v' = \\cos(x^3+x^2) \\cdot (3x^2 + 2x)$ (řetízek)."], 'Součin, druhý činitel přes řetízek.', 'Z videa'),
  dv4: du('dv4', '(1+x^2)^x', '(1+x^2)^x (ln(1+x^2) + 2x^2/(1+x^2))', ['$f = \\mathrm{e}^{x \\ln(1+x^2)}$.', "$(x\\ln(1+x^2))' = \\ln(1+x^2) + \\frac{2x^2}{1+x^2}$."], 'f^g = e^(g ln f)', 'Z videa'),
  t1: () => tangent({ f: P('√(x^2+16)'), c: 3, key: 't1', badge: 'Série 2' }),
  t2: () => tangent({ f: P('(x+3)/(x^2+x+1)'), c: 0, key: 't2', badge: 'Série 2' }),
  tv: () => tangent({ f: P('1/√(x^2-3)'), c: 2, key: 'tv', badge: 'Z videa' }),
  tpar: () => ({
    type: 'guided', key: 'tpar', badge: 'Z videa', fn: 'f(x) = (3x-1)^3', prompt: 'Najdi tečny rovnoběžné s přímkou $y = 9x + 3$',
    gsteps: [
      { kind: 'choice', title: 'Rovnoběžné přímky mají stejný…', options: shuffle([{ label: 'sklon, tedy $f\'(x) = 9$', correct: true, why: 'Rovnoběžky mají stejnou směrnici (číslo u $x$).' }, { label: 'průsečík s osou $y$', correct: false, why: 'Rovnoběžky mají stejnou směrnici.' }, { label: 'hodnotu, tedy $f(x) = 9$', correct: false, why: 'Sklon tečny je derivace, ne hodnota funkce.' }]) },
      { kind: 'expr', title: 'Derivace', label: "$f'(x) =$", answer: P('9(3x-1)^2') },
      { kind: 'choice', title: "Kde je $f'(x) = 9$?", info: '$9(3x-1)^2 = 9$, tedy $(3x-1)^2 = 1$, tedy $3x - 1 = \\pm 1$.', options: shuffle([
        { label: '$x = 0$ a $x = \\frac{2}{3}$', correct: true, why: '$3x - 1 = 1$ dává $x = \\frac{2}{3}$, $3x - 1 = -1$ dává $x = 0$.' },
        { label: '$x = \\frac{2}{3}$', correct: false, why: 'Druhá mocnina má dvě řešení: $\\pm 1$.' }, { label: '$x = \\frac{1}{3}$', correct: false, why: '$(3x-1)^2 = 1$, ne $0$.' }]) },
      { kind: 'choice', final: true, title: 'Rovnice tečen', options: shuffle([
        { label: '$y = 9x - 1$ a $y = 9x - 5$', correct: true, why: '$f(0) = -1$, $f(\\frac{2}{3}) = 1$. Tečny: $y = -1 + 9x$ a $y = 1 + 9(x - \\frac{2}{3})$.' },
        { label: '$y = 9x + 3$', correct: false, why: 'To je zadaná přímka, ne tečna.' }, { label: '$y = 9x - 1$ a $y = 9x + 1$', correct: false, why: '$f(\\frac{2}{3}) = 1$, takže $y = 1 + 9(x - \\frac{2}{3}) = 9x - 5$.' }]) },
    ],
    steps: [
      'Rovnoběžné přímky mají stejnou směrnici (číslo u $x$). Přímka $y = 9x + 3$ má směrnici $9$, takže hledáš body, kde $f\'(x) = 9$.',
      'Derivace (řetízek, vnitřek $3x - 1$ má derivaci $3$): $f\'(x) = 3(3x - 1)^2 \\cdot 3 = 9(3x - 1)^2$.',
      '$9(3x - 1)^2 = 9$, tedy $(3x - 1)^2 = 1$, tedy $3x - 1 = 1$ nebo $3x - 1 = -1$. Vyjde $x = \\frac{2}{3}$ nebo $x = 0$.',
      'Hodnoty funkce v těch bodech: $f(0) = (-1)^3 = -1$ a $f\\left(\\frac{2}{3}\\right) = 1^3 = 1$.',
      'Tečny $y = f(x_0) + 9(x - x_0)$: první $y = -1 + 9x = 9x - 1$, druhá $y = 1 + 9\\left(x - \\frac{2}{3}\\right) = 9x - 5$.',
    ],
  }),
};

export const GEN = {
  tableChoice, tableReverse, tableTyped, powerRule, linearCombo, product, quotient, chain, chain2, cibuleQ, fpowg, ruleWhich, tangent: () => tangent(), ...FIXED,
};
