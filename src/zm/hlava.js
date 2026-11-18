// Režim „Z hlavy“ pro Základy matematiky: krátká rozhodnutí bez psaní, po cestách.
import { ri, riNot, pick, shuffle } from '../ui.js';
import { M, sw, tf, yn, two, ch, opts } from '../zhlavy.js';
import * as K from './komplex/gen.js';
import * as G from './gonio/gen.js';
import * as Q from './rovnice/gen.js';
import * as F from './grafy/gen.js';
import * as V from './geometrie/gen.js';
import { degRad } from './paths.js';
import { cxTex } from './expr.js';
import { radTex, norm360, valTex } from './trig.js';

const I = '\\mathrm{i}';
const deg = d => `${d}^{\\circ}`;
const nz = () => riNot(-6, 6, 0);

// ---------------------------------------------------------------- komplexní čísla
function i2() {
  const k = riNot(-5, 5, 0, 1, -1), ok = Math.random() < 0.5;
  const right = -k * k, wrong = k * k;
  return tf('i2', M(`(${k}${I})^2 = ${ok ? right : wrong}`), ok, `$(${k}${I})^2 = ${k * k}\\cdot ${I}^2 = ${k * k}\\cdot(-1) = ${right}$.`);
}
function conjQ() {
  const a = nz(), b = nz();
  return two('conjQ', 'Komplexně sdružené číslo k', M(`z = ${cxTex(a, b)}`), `$${cxTex(a, -b)}$`, `$${cxTex(-a, b)}$`, 'Sdružené: stejná reálná část, opačné znaménko u $\\mathrm{i}$.');
}
function divWhat() {
  const c = nz(), d = nz();
  return two('divWhat', 'Čím rozšíříš zlomek?', M(`\\frac{1}{${cxTex(c, d)}}`), `$${cxTex(c, -d)}$`, `$${cxTex(c, d)}$`, 'Číslem sdruženým ke jmenovateli. Pak je dole $c^2 + d^2$, bez $\\mathrm{i}$.');
}
function zzbar() {
  const a = nz(), b = nz(), ok = Math.random() < 0.5;
  return tf('zzbar', M(`${`\\left(${cxTex(a, b)}\\right)\\left(${cxTex(a, -b)}\\right)`} = ${ok ? a * a + b * b : a * a - b * b}`), ok, `$z\\cdot\\bar z = a^2 + b^2 = ${a * a} + ${b * b} = ${a * a + b * b}$.`);
}

// ---------------------------------------------------------------- goniometrický tvar
function ruleQ() {
  return pick([
    () => two('ruleQ', 'Při násobení $z_1 z_2$ se úhly', null, 'sčítají', 'násobí', 'Délky se násobí, úhly sčítají.'),
    () => two('ruleQ', 'Při dělení $\\frac{z_1}{z_2}$ se délky', null, 'dělí', 'odečítají', 'Délky se dělí, úhly odečítají.'),
    () => two('ruleQ', 'U $z^n$ se úhel', null, 'násobí $n$', 'umocní na $n$', 'Moivre: délka na $n$, úhel krát $n$.'),
    () => two('ruleQ', 'U $z^n$ se délka $r$', null, 'umocní na $n$', 'násobí $n$', 'Moivre: $r^n$.'),
  ])();
}
const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [1, 1, null], [0, 7, 7], [8, 6, 10]];
function absQ() {
  const [a0, b0, c] = pick(TRIPLES);
  const a = a0 * pick([1, -1]), b = b0 * pick([1, -1]);
  const right = c == null ? '\\sqrt{2}' : String(c);
  return ch('absQ', 'Kolik je $|z|$?', M(`z = ${cxTex(a, b)}`), opts(`$${right}$`, [[`$${Math.abs(a) + Math.abs(b)}$`, 'Délky se nesčítají, je to Pythagoras.'], [`$${a * a + b * b}$`, 'Ještě odmocnit.'], [`$\\sqrt{${Math.abs(a - b) || 3}}$`, '']]), `$|z| = \\sqrt{${a * a} + ${b * b}} = ${right}$`);
}
function stepQ() {
  const n = pick([2, 3, 4, 5, 6]);
  const nm = { 2: 'druhé', 3: 'třetí', 4: 'čtvrté', 5: 'páté', 6: 'šesté' }[n];
  return ch('stepQ', `Úhly sousedních ${nm.replace(/é$/, 'ých')} odmocnin se liší o`, null, opts(`$${deg(360 / n)}$`, [`$${deg(180 / n)}$`, `$${deg(90)}$`, `$${deg(360 * n > 720 ? 60 : 360 * n)}$`, `$${deg(30)}$`]), `Kořeny jsou rovnoměrně po kružnici: $\\frac{360^\\circ}{${n}} = ${deg(360 / n)}$.`);
}
function normQ() {
  const d = 5 * ri(1, 71), raw = d + 360 * pick([1, 1, 2]);
  return ch('normQ', `Úhel $${deg(raw)}$ je stejný jako`, null, opts(`$${deg(norm360(raw))}$`, [`$${deg(raw - 180)}$`, `$${deg(Math.max(5, raw - 300))}$`, `$${deg(raw % 100)}$`]), `Odečítej $360^\\circ$, dokud nejsi pod $360^\\circ$: $${deg(norm360(raw))}$.`);
}

// ---------------------------------------------------------------- rovnice
function insideQ() {
  const q = Q.quadData('two');
  const rel = pick(['<', '>']);
  const inside = (q.a > 0) === (rel === '<');
  return two('insideQ', 'Řešení leží', M(`${Q.polyTex(q.a, q.b, q.c)} ${rel} 0`), inside ? 'mezi kořeny' : 'vně kořenů', inside ? 'vně kořenů' : 'mezi kořeny',
    `$a ${q.a > 0 ? '> 0' : '< 0'}$: parabola ${q.a > 0 ? '∪' : '∩'}. ${rel === '<' ? 'Pod' : 'Nad'} osou je ${inside ? 'mezi kořeny' : 'vně kořenů'}.`);
}
function flipQ() {
  const b = pick(['2', '3', '\\frac{1}{2}', '\\frac{1}{3}', '5', '\\frac{1}{5}']), down = b.includes('frac');
  const log = Math.random() < 0.5;
  return yn('flipQ', 'Otočí se znaménko, až přejdeš k exponentům / argumentům?', M(log ? `\\log_{${b}} x < 2` : `\\left(${b}\\right)^{x} > 4`), down, down ? `Základ $${b} < 1$: funkce klesá, znaménko se otočí.` : `Základ $${b} > 1$: funkce roste, znaménko zůstává.`);
}
function logDom() {
  const m = ri(-4, 4);
  const arg = m === 0 ? 'x' : `x ${m < 0 ? '+' : '-'} ${Math.abs(m)}`;
  return ch('logDom', 'Podmínka (definiční obor)', M(`\\log_{3}\\left(${arg}\\right) < 2`), opts(`$x > ${m}$`, [`$x \\ge ${m}$`, `$x > ${-m}$`, `$x < ${m}$`]), `V logaritmu smí být jen kladné číslo: $${arg} > 0$.`);
}
function sinBasic() {
  const c0 = Q.trigEqData();
  const sols = c0.sols, f = c0.f;
  const right = `$${sols.map(radTex).join(',\\ ')}$`;
  return ch('sinBasic', 'Řešení v $\\langle 0, 2\\pi)$', M(`\\${f} x = ${valTex({ p: c0.t[0], q: c0.t[1], n: c0.t[2] })}`),
    opts(right, [`$${sols.map(d => radTex(norm360(180 - d))).join(',\\ ')}$`, `$${sols.map(d => radTex(norm360(-d))).join(',\\ ')}$`, `$${radTex(sols[0])}$`]), 'Nakresli si přímku na kružnici: sinus = výška, kosinus = vodorovně.');
}

// ---------------------------------------------------------------- grafy
function vtxQ() {
  const u = riNot(-4, 4, 0), v = riNot(-4, 4, 0);
  const inner = `x ${u < 0 ? '+' : '-'} ${Math.abs(u)}`;
  const P = (x, y) => `$[${x};\\ ${y}]$`;
  return ch('vtxQ', 'Kde je špička grafu?', M(`\\left|${inner}\\right| ${v < 0 ? '-' : '+'} ${Math.abs(v)}`), opts(P(u, v), [P(-u, v), P(u, -v), P(-u, -v)]), `Uvnitř opačně ($x - 2$ = doprava), venku normálně. Špička $[${u};\\ ${v}]$.`);
}
function openQ() {
  const a = riNot(-3, 3, 0), b = ri(-5, 5), c = ri(-6, 6);
  return two('openQ', 'Parabola je otevřená', M(`f(x) = ${Q.polyTex(a, b, c)}`), a > 0 ? 'nahoru ∪' : 'dolů ∩', a > 0 ? 'dolů ∩' : 'nahoru ∪', `Rozhoduje jen číslo u $x^2$: $a = ${a}$.`);
}
function y0Q() {
  const a = riNot(-3, 3, 0), b = ri(-5, 5), c = riNot(-8, 8, 0);
  return ch('y0Q', 'Průsečík s osou $y$', M(`f(x) = ${Q.polyTex(a, b, c)}`), opts(`$[0;\\ ${c}]$`, [`$[${c};\\ 0]$`, `$[0;\\ ${a}]$`, `$[0;\\ ${b || 1}]$`]), `$f(0) = ${c}$: dosaď nulu, zbyde jen číslo bez $x$.`);
}

// ---------------------------------------------------------------- prostor
const P3 = () => [ri(-3, 4), ri(-3, 4), ri(-3, 4)];
const vT = v => `(${v.join(',\\ ')})`;
function abQ() {
  const A = P3(); let B; do { B = P3(); } while (B.every((x, i) => x === A[i]));
  const u = B.map((x, i) => x - A[i]), w = u.map(x => -x);
  return two('abQ', `$\\overrightarrow{AB}$ pro $A = [${A.join(',\\ ')}]$, $B = [${B.join(',\\ ')}]$`, null, `$${vT(u)}$`, `$${vT(w)}$`, 'Konec mínus začátek: $B - A$.');
}
function normalQ() {
  const c0 = V.normalRead(), n = c0.fields[0].answer;
  return ch('normalQ', 'Normálový vektor roviny', M(c0.fn), opts(`$${vT(n)}$`, [`$${vT(n.map(x => x + 1))}$`, `$${vT([n[1], n[0], n[2]])}$`, `$${vT(n.map((x, i) => (i === 2 ? -x : x)))}$`]), 'Čísla u $x$, $y$, $z$, i se znaménky.');
}

export const DECKS = {
  'zm-komplex': [
    { id: 'reim', title: 'Reálná a imaginární část', after: 'zk1l1', weak: 'reIm', make: K.reIm },
    { id: 'ipow', title: 'Mocniny i', after: 'zk1l1', weak: 'iPow', make: K.iPow },
    { id: 'i2', title: 'i² = −1 v praxi', after: 'zk2l2', weak: 'mulCx', make: i2 },
    { id: 'conj', title: 'Komplexně sdružené', after: 'zk3l1', weak: 'conj', make: () => (Math.random() < 0.5 ? conjQ() : zzbar()) },
    { id: 'div', title: 'Čím rozšířit zlomek', after: 'zk3l2', weak: 'divCx', make: divWhat },
  ],
  'zm-gonio': [
    { id: 'tab1', title: 'Tabulka: první kvadrant', after: 'zg1l1', weak: 'trigVal1', make: G.trigVal1 },
    { id: 'taball', title: 'Tabulka: celá kružnice', after: 'zg1l2', weak: 'trigValAll', make: G.trigValAll },
    { id: 'abs', title: 'Absolutní hodnota |z|', after: 'zg3l1', weak: 'algToPolar', make: absQ },
    { id: 'rule', title: 'Násobení, dělení, mocnina', after: 'zg5l1', weak: 'mulPolar', make: ruleQ },
    { id: 'norm', title: 'Úhel přes 360°', after: 'zg4l1', weak: 'mulPolar', make: normQ },
    { id: 'step', title: 'Odmocniny: krok úhlu', after: 'zg6l1', weak: 'rootsPolar', make: stepQ },
  ],
  'zm-rovnice': [
    { id: 'disc', title: 'Kolik řešení', after: 'zr1l1', weak: 'quadEq', make: Q.discCount },
    { id: 'inside', title: 'Mezi, nebo vně kořenů', after: 'zr2l1', weak: 'quadIneq', make: insideQ },
    { id: 'flip', title: 'Otáčí se znaménko?', after: 'zr3l2', weak: 'expIneq', make: flipQ },
    { id: 'logdom', title: 'Podmínka logaritmu', after: 'zr4l2', weak: 'logIneq', make: logDom },
    { id: 'rad', title: 'Stupně na radiány', after: 'zr5l1', weak: 'trigEqBasic', make: degRad },
    { id: 'basic', title: 'Body na kružnici', after: 'zr5l1', weak: 'trigEqBasic', make: sinBasic },
  ],
  'zm-grafy': [
    { id: 'y0', title: 'Průsečík s osou y', after: 'zf1l1', weak: 'yInt', make: y0Q },
    { id: 'open', title: 'Nahoru, nebo dolů', after: 'zf2l1', weak: 'graphPick', make: openQ },
    { id: 'shift', title: 'Posuny grafu', after: 'zf3l1', weak: 'shiftQ', make: F.shiftQ },
    { id: 'vtx', title: 'Špička |x − u| + v', after: 'zf3l1', weak: 'absVertex', make: vtxQ },
  ],
  'zm-geometrie': [
    { id: 'ab', title: 'Vektor AB', after: 'zv1l1', weak: 'vecAB', make: abQ },
    { id: 'online', title: 'Leží bod na přímce?', after: 'zv1l2', weak: 'lineEq', make: V.onLineQ },
    { id: 'normal', title: 'Normálový vektor', after: 'zv2l1', weak: 'normalRead', make: normalQ },
    { id: 'pos', title: 'Poloha dvou rovin', after: 'zv3l1', weak: 'planePos', make: V.planePos },
  ],
};
