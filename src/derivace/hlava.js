// Balíček „Z hlavy“ pro cestu Derivace: tabulka, poznání pravidla a typické chyby, bez psaní.
import * as G from './gen.js';
import * as S from '../sym.js';
import { ri, riNot, pick } from '../ui.js';
import { M, sw, tf, two, ch, opts, fixed } from '../zhlavy.js';

const P = S.parse, T = S.tex, simp = S.simplify;
const D = e => simp(S.d(e));
const W = e => (e.t === 'add' || e.t === 'neg' ? `\\left(${T(e)}\\right)` : T(e));
const dot = (a, b) => `${W(a)} \\cdot ${W(b)}`;
/** možnosti z výrazů: správná + špatné [výraz, proč]; výrazy se ukládají i pro audit */
function optsAst(right, wrongs) {
  const lab = e => `$${T(simp(e))}$`;
  const asts = new Map([[lab(right), right], ...wrongs.map(([e]) => [lab(e), e])]);
  return opts(lab(right), wrongs.map(([e, why]) => [lab(e), why])).map(o => ({ ...o, ast: asts.get(o.label) }));
}

// ---------- sklon ----------
function slope() {
  const x = ri(-4, 6), v = riNot(-5, 5, 0);
  return sw('slope', `Co dělá funkce v bodě $x = ${x}$?`, M(`f'(${x}) = ${v}`), 'Klesá', 'Roste', v > 0 ? 'right' : 'left',
    `Derivace je sklon grafu. ${v > 0 ? 'Kladný sklon: funkce roste.' : 'Záporný sklon: funkce klesá.'}`);
}

// ---------- tabulka: pasti ----------
const CO = 'Funkce začínající na „co“ (cos, cotg, arccos, arccotg) mají v derivaci mínus.';
const TABTF = [
  ['\\cos x', '-\\sin x', '\\sin x', `$(\\cos x)' = -\\sin x$. ${CO}`],
  ['\\sin x', '\\cos x', '-\\cos x', "$(\\sin x)' = \\cos x$, bez mínusu. Mínus má až kosinus."],
  ['\\ln x', '\\frac{1}{x}', '\\frac{1}{x^2}', "$(\\ln x)' = \\frac{1}{x}$."],
  ['\\frac{1}{x}', '-\\frac{1}{x^2}', '\\ln x', '$\\frac{1}{x} = x^{-1}$, takže derivace je $-x^{-2} = -\\frac{1}{x^2}$. Logaritmus vyjde až při integrování.'],
  ['\\mathrm{e}^x', '\\mathrm{e}^x', 'x\\,\\mathrm{e}^{x-1}', '$\\mathrm{e}^x$ je sama sobě derivací. Pravidlo „exponent dopředu“ platí jen pro $x$ v základu.'],
  ['2^x', '2^x \\ln 2', 'x \\cdot 2^{x-1}', "$(a^x)' = a^x \\ln a$. Pravidlo „exponent dopředu“ platí jen pro $x$ v základu."],
  ['\\sqrt{x}', '\\frac{1}{2\\sqrt{x}}', '\\frac{1}{\\sqrt{x}}', '$\\sqrt{x} = x^{\\frac{1}{2}}$, takže derivace je $\\frac{1}{2}x^{-\\frac{1}{2}} = \\frac{1}{2\\sqrt{x}}$.'],
  ['\\operatorname{tg} x', '\\frac{1}{\\cos^2 x}', '\\frac{1}{\\sin^2 x}', "$(\\operatorname{tg} x)' = \\frac{1}{\\cos^2 x}$. Sinus ve jmenovateli (a mínus) patří ke kotangens."],
  ['\\operatorname{cotg} x', '-\\frac{1}{\\sin^2 x}', '\\frac{1}{\\sin^2 x}', `$(\\operatorname{cotg} x)' = -\\frac{1}{\\sin^2 x}$. ${CO}`],
  ['\\arcsin x', '\\frac{1}{\\sqrt{1-x^2}}', '\\frac{1}{1+x^2}', "$(\\arcsin x)' = \\frac{1}{\\sqrt{1-x^2}}$. Zlomek bez odmocniny patří k arkustangens."],
  ['\\operatorname{arctg} x', '\\frac{1}{1+x^2}', '\\frac{1}{\\sqrt{1-x^2}}', "$(\\operatorname{arctg} x)' = \\frac{1}{1+x^2}$. S odmocninou je to arkussinus."],
  ['\\arccos x', '-\\frac{1}{\\sqrt{1-x^2}}', '\\frac{1}{\\sqrt{1-x^2}}', `Stejně jako arkussinus, jen s mínusem. ${CO}`],
  ['x', '1', 'x', '$x$ roste rychlostí 1, takže $(x)\' = 1$.'],
  ['7', '0', '7', 'Číslo se nemění, jeho derivace je 0.'],
];
function tabTF() {
  const [f, good, bad, why] = pick(TABTF), ok = Math.random() < 0.5;
  return tf('tabTF', M(`\\left(${f}\\right)' = ${ok ? good : bad}`), ok, why);
}

// ---------- mocniny ----------
const REWR = [
  ['\\sqrt[3]{x^2}', 'x^{\\frac{2}{3}}', 'x^{\\frac{3}{2}}', 'Odmocnina jde do jmenovatele exponentu: $\\sqrt[3]{x^2} = x^{\\frac{2}{3}}$.'],
  ['\\sqrt{x^3}', 'x^{\\frac{3}{2}}', 'x^{\\frac{2}{3}}', 'Druhá odmocnina = jmenovatel 2: $\\sqrt{x^3} = x^{\\frac{3}{2}}$.'],
  ['\\frac{1}{x^3}', 'x^{-3}', 'x^{\\frac{1}{3}}', 'Mocnina ve jmenovateli = záporný exponent. Zlomek v exponentu znamená odmocninu.'],
  ['\\frac{1}{\\sqrt{x}}', 'x^{-\\frac{1}{2}}', 'x^{-2}', 'Odmocnina je exponent $\\frac{1}{2}$, ve jmenovateli dostane mínus: $x^{-\\frac{1}{2}}$.'],
  ['\\sqrt[3]{x}', 'x^{\\frac{1}{3}}', 'x^{-3}', 'Třetí odmocnina je exponent $\\frac{1}{3}$. Záporný exponent by znamenal zlomek.'],
  ['\\frac{1}{x}', 'x^{-1}', 'x^{0}', '$\\frac{1}{x} = x^{-1}$. Pozor: $x^0 = 1$.'],
  ['x\\sqrt{x}', 'x^{\\frac{3}{2}}', 'x^{\\frac{1}{2}}', 'Při násobení se exponenty sčítají: $x^1 \\cdot x^{\\frac{1}{2}} = x^{\\frac{3}{2}}$.'],
  ['\\frac{1}{x^2}', 'x^{-2}', 'x^{\\frac{1}{2}}', 'Mocnina ve jmenovateli = záporný exponent: $x^{-2}$.'],
];
function rewrite() {
  const [f, good, bad, why] = pick(REWR);
  return two('rewrite', 'Jak to přepíšeš na mocninu?', M(f), `$${good}$`, `$${bad}$`, why);
}

function powPick() {
  const c = pick([1, 1, 2, 3, 4]), k = c === 1 ? '' : c;
  if (Math.random() < 0.6) {
    const n = ri(2, 8), f = P(`${k}x^${n}`);
    return { ...ch('powPick', 'Zderivuj z hlavy', M(`f(x) = ${T(f)}`), optsAst(D(f), [
      [P(`${c * n}x^${n}`), 'Exponent dopředu je dobře, ale ještě ho o jedna zmenši.'],
      [P(`${k}x^${n - 1}`), 'Exponent se nejen zmenší, ale přijde i dopředu jako násobek.'],
      [P(`${c * (n - 1)}x^${n - 1}`), `Dopředu jde původní exponent $${n}$, ne ten zmenšený.`],
    ]), `Exponent dopředu, exponent o jedna menší: $(x^{${n}})' = ${n}x^{${n - 1}}$.`.replace('x^{1}', 'x')), chk: { kind: 'deriv', f } };
  }
  const n = ri(1, 4), f = P(n === 1 ? `${c}/x` : `${c}/x^${n}`);
  return { ...ch('powPick', 'Zderivuj z hlavy', M(`f(x) = ${T(f)}`), optsAst(D(f), [
    [P(`${c * n}/x^${n + 1}`), `Chybí mínus: exponent $-${n}$ jde dopředu i se znaménkem.`],
    [P(n === 1 ? `-${c}` : n === 2 ? `-${c * n}/x` : `-${c * n}/x^${n - 1}`), `Exponent se zmenšuje: z $-${n}$ je $-${n + 1}$, takže ve jmenovateli přibude.`],
    [P(`-${c}/(${n + 1}x^${n + 1})`), 'Exponentem se násobí. Dělí se až při integrování.'],
  ]), `Přepiš na mocninu: $x^{-${n}}$. Exponent dopředu a o jedna menší: $${n === 1 ? '-' : -n}x^{-${n + 1}}$.`), chk: { kind: 'deriv', f } };
}

// ---------- konstanta a součet ----------
function constTF() {
  const k = ri(2, 9), c = ri(2, 5);
  const [fs, good, bad, why] = pick([
    [`${c} sin x + ${k}`, `${c} cos x`, `${c} cos x + ${k}`, `Samotné číslo $${k}$ se nemění, jeho derivace je 0 a zmizí.`],
    [`${c}x^3`, `${3 * c}x^2`, '3x^2', `Číslo $${c}$ před funkcí zůstává a násobí se: $${c} \\cdot 3x^2$.`],
    [`x^2 + ln ${k}`, '2x', `2x + 1/${k}`, `$\\ln ${k}$ je jen číslo (není v něm $x$), takže zmizí.`],
    ['e^x + e^2', 'e^x', 'e^x + 2e', '$\\mathrm{e}^2$ je jen číslo, jeho derivace je 0.'],
    [`${k}x + ${c}`, `${k}`, `${k}x`, `$(${k}x)' = ${k}$ a samotné číslo $${c}$ zmizí.`],
    [`${c} ln x - ${k}x`, `${c}/x - ${k}`, `${c}/x - ${k}x`, `Každý člen zvlášť: $(${k}x)' = ${k}$.`],
    ['sin x + cos x', 'cos x - sin x', 'cos x + sin x', "$(\\cos x)' = -\\sin x$, mínus se nesmí ztratit."],
    [`x^${c + 1} - ${k}`, `${c + 1}x^${c}`, `${c + 1}x^${c} - ${k}`, `Samotné číslo $${k}$ zmizí, ať je před ním plus, nebo mínus.`],
  ]);
  const f = P(fs), ok = Math.random() < 0.5, shown = P(ok ? good : bad);
  return { ...tf('constTF', M(`\\left(${T(f)}\\right)' = ${T(shown)}`), ok, why), chk: { kind: 'deriv', f, shown, ok } };
}

// ---------- součin a podíl ----------
function prodTF() {
  for (;;) {
    const c = G.product(), u = c.u, v = c.v, du = D(u), dv = D(v);
    const [ok, tex, ast, why] = pick([
      [true, `${dot(du, v)} + ${dot(u, dv)}`, S.add(S.mul(du, v), S.mul(u, dv)), `Přesně podle $(uv)' = u'v + uv'$: první zderivuj a druhou nech, plus první nech a druhou zderivuj.`],
      [true, `${dot(du, v)} + ${dot(u, dv)}`, S.add(S.mul(du, v), S.mul(u, dv)), `Přesně podle $(uv)' = u'v + uv'$: první zderivuj a druhou nech, plus první nech a druhou zderivuj.`],
      [false, dot(du, dv), S.mul(du, dv), "Derivace součinu není součin derivací. Platí $(uv)' = u'v + uv'$."],
      [false, `${dot(du, v)} - ${dot(u, dv)}`, S.sub(S.mul(du, v), S.mul(u, dv)), 'U součinu je mezi členy plus. Mínus patří k podílu.'],
    ]);
    if (S.equiv(ast, c.answer) !== ok) continue;
    return { ...tf('prodTF', M(c.fn) + M(`f'(x) = ${tex}`), ok, why), chk: { kind: 'deriv', f: c.original, shown: ast, ok } };
  }
}

const QU = ['x', 'x^2', 'sin x', 'e^x', 'ln x', '2x+1'], QV = ['x+1', 'x^2+1', 'cos x', 'e^x', 'x-2'];
function quotTF() {
  for (;;) {
    const us = pick(QU), vs = pick(QV);
    if (us === vs) continue;
    const u = P(us), v = P(vs), du = D(u), dv = D(v), f = S.div(u, v), v2 = S.pow(v, S.N(2));
    const a = S.mul(du, v), b = S.mul(u, dv), ta = dot(du, v), tb = dot(u, dv), den = T(v2);
    const [ok, tex, ast, why] = pick([
      [true, `\\frac{${ta} - ${tb}}{${den}}`, S.div(S.sub(a, b), v2), "Přesně podle $\\left(\\frac{u}{v}\\right)' = \\frac{u'v - uv'}{v^2}$."],
      [true, `\\frac{${ta} - ${tb}}{${den}}`, S.div(S.sub(a, b), v2), "Přesně podle $\\left(\\frac{u}{v}\\right)' = \\frac{u'v - uv'}{v^2}$."],
      [false, `\\frac{${tb} - ${ta}}{${den}}`, S.div(S.sub(b, a), v2), "Na pořadí v čitateli záleží: nejdřív $u'v$, potom mínus $uv'$."],
      [false, `\\frac{${ta} + ${tb}}{${den}}`, S.div(S.add(a, b), v2), 'V čitateli podílu je mínus. Plus patří k součinu.'],
      [false, `\\frac{${ta} - ${tb}}{${W(v)}}`, S.div(S.sub(a, b), v), 'Jmenovatel je na druhou: $v^2$.'],
      [false, `\\frac{${T(du)}}{${T(dv)}}`, S.div(du, dv), "Podíl derivací to není. Platí $\\left(\\frac{u}{v}\\right)' = \\frac{u'v - uv'}{v^2}$."],
    ]);
    if (S.equiv(ast, D(f)) !== ok || (tex.endsWith(`{${T(dv)}}`) && S.isConst(dv))) continue;   // u'/v' s číslem ve jmenovateli by vypadalo divně
    return { ...tf('quotTF', M(`f(x) = \\frac{${T(u)}}{${T(v)}}`) + M(`f'(x) = ${tex}`), ok, why), chk: { kind: 'deriv', f, shown: ast, ok } };
  }
}

// ---------- řetízek ----------
function chainMiss() {
  const c = G.chain(), outerD = simp(S.d(c.outer.mk(S.X, c.n)));
  return {
    ...ch('chainMiss', 'Čím se to ještě násobí?', M(c.fn) + M(`f'(x) = ${W(c.dOuter)} \\cdot \\;\\boxed{?}`), optsAst(c.dInner, [
      [c.g, 'Vnitřek sám nestačí, násobí se jeho <b>derivací</b>.'],
      [S.N(1), `Jedničkou by se násobilo, jen kdyby uvnitř bylo samotné $x$. Tady je uvnitř $${T(c.g)}$.`],
      [outerD, 'Vnější funkce už zderivovaná je. Chybí derivace vnitřku.'],
    ]).map(({ ast, ...o }) => o), `Řetízek: derivace vnější funkce krát derivace vnitřku. Vnitřek je $${T(c.g)}$, jeho derivace $${T(c.dInner)}$.`),
  };
}
function chainTF() {
  const c = G.chain(), ok = Math.random() < 0.5;
  const shown = ok ? c.answer : c.dOuter;
  return { ...tf('chainTF', M(c.fn) + M(`f'(x) = ${T(shown)}`), ok, ok ? `Vnější derivace krát derivace vnitřku $${T(c.dInner)}$. Nic nechybí.` : c.wrongs[0].msg), chk: { kind: 'deriv', f: c.original, shown, ok } };
}

// ---------- x v základu, v exponentu, nebo obojí ----------
const ETYPE = [
  ['x^{7}', 0], ['x^{\\frac{2}{3}}', 0], ['x^{\\pi}', 0], ['x^{-4}', 0],
  ['3^{x}', 1], ['10^{x}', 1], ['\\pi^{x}', 1], ['\\left(\\frac{1}{2}\\right)^{x}', 1],
  ['x^{x}', 2], ['x^{\\sin x}', 2], ['(\\sin x)^{x}', 2], ['(x^2+1)^{x}', 2], ['(\\ln x)^{2x}', 2], ['x^{\\sqrt{x}}', 2],
];
const ETYPE_OPT = ['jako $x^n$: exponent dopředu', 'jako $a^x$: krát $\\ln a$', 'přes $\\mathrm{e}^{g \\ln f}$'];
const ETYPE_WHY = [
  "Proměnná je jen v základu, exponent je číslo: $(x^n)' = n x^{n-1}$.",
  "Proměnná je jen v exponentu, základ je číslo: $(a^x)' = a^x \\ln a$.",
  'Proměnná je v základu i v exponentu. Tabulka nepomůže, přepiš na $\\mathrm{e}^{g \\ln f}$.',
];
function expType() {
  const [f, k] = pick(ETYPE);
  return ch('expType', 'Jak to zderivuješ?', M(f), fixed(ETYPE_OPT, ETYPE_OPT[k]), ETYPE_WHY[k]);
}

// ---------- tečna ----------
const TAN = [['x^2', [1, 2, 3, -1, -2]], ['x^3', [1, 2, -1]], ['ln x', [1, 2, 4]], ['e^x', [0]], ['sin x', [0]], ['√x', [1, 4]], ['1/x', [1, 2, -1]], ['x^2+3x', [0, 1, -1]], ['x^2-4x', [1, 2, 3]]];
const nice = v => Number.isFinite(v) && Math.abs(v * 4 - Math.round(v * 4)) < 1e-9;
function tangent() {
  if (Math.random() < 0.25) {
    return ch('tangent', 'Co patří do rovnice tečny místo otazníku?', M("y = f(x_0) + \\;\\boxed{?}\\; \\cdot (x - x_0)"),
      opts("$f'(x_0)$", [["$f'(x)$", 'Sklon tečny je jedno číslo: derivace vyčíslená v bodě $x_0$.'], ['$f(x_0)$', 'To je výška bodu dotyku. Sklon udává derivace.'], ['$x_0$', 'Sklon tečny je hodnota derivace v bodě $x_0$.']]),
      "Tečna má sklon $f'(x_0)$ a prochází bodem $[x_0, f(x_0)]$.");
  }
  const [fs, xs] = pick(TAN), x0 = pick(xs), f = P(fs), df = D(f), k = S.ev(df, x0), y = S.ev(f, x0);
  const n = v => `$${S.fmtNum(v)}$`;
  const wrongs = [[y, 'To je hodnota funkce $f(x_0)$. Sklon je hodnota <b>derivace</b>.'], [-k, 'Pozor na znaménko.'], [x0, 'To je bod dotyku. Sklon je hodnota derivace v něm.'], [k + 1], [0]]
    .filter(([v]) => nice(v) && Math.abs(v - k) > 1e-9).map(([v, why]) => [n(v), why]);
  return ch('tangent', 'Jaký sklon má tečna?', M(`f(x) = ${T(f)},\\quad x_0 = ${x0}`), opts(n(k), wrongs),
    `Sklon tečny je $f'(x_0)$. Tady $f'(x) = ${T(df)}$, takže $f'(${x0}) = ${S.fmtNum(k)}$.`);
}

const half = (a, b, p = 0.5) => () => (Math.random() < p ? a() : b());

export const DECK = [
  { id: 'slope', title: 'Znaménko derivace: roste, klesá', after: 'd1l1', make: slope },
  { id: 'tab0', title: 'Tabulka: základní řádky', after: 'd1l1', weak: 'tableTyped', make: G.tableChoiceBasic },
  { id: 'tab', title: 'Tabulka derivací', after: 'd2l1', weak: 'tableTyped', make: half(G.tableChoice, G.tableReverse, 0.65) },
  { id: 'tabtf', title: 'Tabulka: znaménka a pasti', after: 'd2l1', weak: 'tableTyped', make: tabTF },
  { id: 'rewrite', title: 'Odmocniny a zlomky jako mocnina', after: 'd3l1', weak: 'powerRule', make: rewrite },
  { id: 'pow', title: 'Mocninné pravidlo z hlavy', after: 'd3l1', weak: 'powerRule', make: powPick },
  { id: 'const', title: 'Číslo zmizí, násobek zůstane', after: 'd4l1', weak: 'linearCombo', make: constTF },
  { id: 'prod', title: 'Součin: sedí, nebo nesedí', after: 'd5l1', weak: 'product', make: prodTF },
  { id: 'quot', title: 'Podíl: sedí, nebo nesedí', after: 'd6l1', weak: 'quotient', make: quotTF },
  { id: 'onion', title: 'Vnější a vnitřní funkce', after: 'd7l1', weak: 'chain', make: G.cibuleQ },
  { id: 'chain', title: 'Řetízek: derivace vnitřku', after: 'd7l2', weak: 'chain', make: half(chainMiss, chainTF) },
  { id: 'rule', title: 'Které pravidlo jako první', after: 'd8l1', weak: 'chain2', make: G.ruleWhich },
  { id: 'exptype', title: 'x v základu, v exponentu, nebo obojí', after: 'd9l1', weak: 'fpowg', make: expType },
  { id: 'tangent', title: 'Tečna: sklon z hlavy', after: 'd10l1', weak: 'tangent', make: tangent },
];
