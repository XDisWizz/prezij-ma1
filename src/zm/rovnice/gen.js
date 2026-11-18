// Generátory pro cestu „Rovnice a nerovnice“ (Základy matematiky):
// kvadratické, exponenciální, logaritmické a goniometrické rovnice a nerovnice.
import { ri, riNot, pick, shuffle } from '../../ui.js';
import { form, options } from '../form.js';
import * as X from '../expr.js';
import { frac, between, le, ge, lt, gt, union, iv, INF, toTexBoth } from '../../intervals.js';
import { circle, graph } from '../plot.js';
import { cosV, sinV, valTex, valTxt, radTex, radTxt, norm360 } from '../trig.js';

const R = String.raw;
const { fracTex, fracTxt } = X;
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
const REL = { '<': '<', '<=': '\\le', '>': '>', '>=': '\\ge' };
const flip = { '<': '>', '<=': '>=', '>': '<', '>=': '<=' };
const strict = r => r === '<' || r === '>';
const nums = (vals, texs, txts, label = '$x =$') => ({ kind: 'nums', label, answer: vals, tex: vals.length ? texs.join(';\\ ') : '\\text{žádné}', text: vals.length ? txts.join('; ') : 'žádné' });

/** a x² + b x + c → TeX */
export function polyTex(a, b, c) {
  const t = [];
  if (a) t.push(`${a === 1 ? '' : a === -1 ? '-' : a}x^2`);
  if (b) t.push(`${t.length ? (b < 0 ? '- ' : '+ ') : b < 0 ? '-' : ''}${Math.abs(b) === 1 ? '' : Math.abs(b)}x`);
  if (c || !t.length) t.push(`${t.length ? (c < 0 ? '- ' : '+ ') : c < 0 ? '-' : ''}${Math.abs(c)}`);
  return t.join(' ');
}

// =====================================================================
// Kvadratická rovnice
// =====================================================================
/** a(x − p/a')(x − q) s celočíselnými koeficienty; kořeny jako zlomky */
function quadData(kind = pick(['two', 'two', 'two', 'two', 'two', 'double', 'none'])) {
  if (kind === 'none') {
    let a, b, c;
    do { a = pick([1, 1, 2]); b = ri(-4, 4); c = ri(1, 7); } while (b * b - 4 * a * c >= 0);
    return { a, b, c, D: b * b - 4 * a * c, roots: [] };
  }
  if (kind === 'double') {
    const p = riNot(-4, 4, 0), a = pick([1, 1, -1]);
    return { a, b: -2 * a * p, c: a * p * p, D: 0, roots: [[p, 1]] };
  }
  // (m x − k)(x − n), m ∈ {1, 2, 3}
  let m, k, n;
  do { m = pick([1, 1, 2, 2, 3]); k = riNot(-6, 6, 0); n = riNot(-5, 5, 0); } while (gcd(m, k) !== 1 || k / m === n || (m === 1 && Math.abs(k) > 5));
  const s = pick([1, 1, 1, -1]);
  const a = s * m, b = s * (-m * n - k), c = s * k * n;
  const roots = [[k, m], [n, 1]].sort((u, v) => u[0] / u[1] - v[0] / v[1]);
  return { a, b, c, D: b * b - 4 * a * c, roots };
}
function quadSteps({ a, b, c, D, roots }) {
  const st = [`Koeficienty: $a = ${a}$, $b = ${b}$, $c = ${c}$.`, `Diskriminant: $D = b^2 - 4ac = ${b * b} ${-4 * a * c < 0 ? '-' : '+'} ${Math.abs(4 * a * c)} = ${D}$.`];
  if (D < 0) st.push('$D < 0$: rovnice nemá žádné reálné řešení (parabola osu $x$ neprotne).');
  else if (D === 0) st.push(`$D = 0$: jediný (dvojnásobný) kořen $x = \\frac{-b}{2a} = ${fracTex(...roots[0])}$.`);
  else {
    const sq = Math.round(Math.sqrt(D));
    st.push(`$x_{1,2} = \\frac{-b \\pm \\sqrt{D}}{2a} = \\frac{${-b} \\pm ${sq}}{${2 * a}}$`, `$x_1 = \\frac{${-b - sq}}{${2 * a}} = ${fracTex(-b - sq, 2 * a)}$, $\\;x_2 = \\frac{${-b + sq}}{${2 * a}} = ${fracTex(-b + sq, 2 * a)}$`);
  }
  return st;
}
export function quadEq(fixData) {
  const q = fixData || quadData();
  return form({
    key: 'quadEq', prompt: 'Najdi všechna $x \\in \\mathbb{R}$, která splňují rovnici', fn: `${polyTex(q.a, q.b, q.c)} = 0`,
    fields: [nums(q.roots.map(r => r[0] / r[1]), q.roots.map(r => fracTex(...r)), q.roots.map(r => fracTxt(...r)))],
    hint: 'D = b² − 4ac, x = (−b ± √D) / 2a. Kořeny odděl středníkem.',
    steps: quadSteps(q), data: q,
  });
}
export function quadEqGuided() {
  const c0 = quadEq(quadData(pick(['two', 'two', 'two', 'double', 'none'])));
  const q = c0.data;
  const g = [{ kind: 'form', title: 'Diskriminant', info: `$D = b^2 - 4ac$, kde $a = ${q.a}$, $b = ${q.b}$, $c = ${q.c}$`, fields: [{ kind: 'num', label: '$D =$', answer: q.D, tex: String(q.D), text: String(q.D) }] }];
  g.push({ kind: 'form', title: q.D < 0 ? 'Řešení' : 'Kořeny', info: q.D < 0 ? 'Záporný diskriminant: odmocnina neexistuje.' : `$x_{1,2} = \\frac{-b \\pm \\sqrt{D}}{2a}$${q.D > 0 ? `, $\\sqrt{${q.D}} = ${Math.round(Math.sqrt(q.D))}$` : ''}`, fields: c0.fields });
  return { type: 'guided', key: 'quadEq:guided', prompt: c0.prompt, fn: c0.fn, steps: c0.steps, gsteps: g };
}
export function discCount() {
  const q = quadData();
  const n = q.D > 0 ? 2 : q.D === 0 ? 1 : 0;
  const why = `$D = ${q.b}^2 - 4\\cdot ${q.a < 0 ? `(${q.a})` : q.a}\\cdot ${q.c < 0 ? `(${q.c})` : q.c} = ${q.D}$. Kladný = dva kořeny, nula = jeden, záporný = žádný.`;
  return { type: 'choice', key: 'discCount', prompt: 'Kolik reálných řešení má rovnice?', context: `${polyTex(q.a, q.b, q.c)} = 0`, options: [2, 1, 0].map(k => ({ label: k === 2 ? 'dvě' : k === 1 ? 'jedno' : 'žádné', correct: k === n })), explain: why };
}

// =====================================================================
// Kvadratická nerovnice
// =====================================================================
function ineqSet(q, rel) {
  const [r1, r2] = q.roots.map(r => frac(...r));
  const inside = (q.a > 0) === (rel === '<' || rel === '<=');
  const cl = !strict(rel);
  return { set: inside ? between(r1, r2, cl, cl) : union(cl ? le(r1) : lt(r1), cl ? ge(r2) : gt(r2)), inside, r1, r2 };
}
export function quadIneq(fixData, fixRel) {
  const q = fixData || quadData('two');
  const rel = fixRel || pick(['<', '<=', '>', '>=']);
  const { set, inside, r1, r2 } = ineqSet(q, rel);
  const up = q.a > 0;
  return {
    type: 'interval', key: 'quadIneq', prompt: 'Najdi všechna $x \\in \\mathbb{R}$, která splňují nerovnici', fn: `${polyTex(q.a, q.b, q.c)} ${REL[rel]} 0`, label: 'x ∈', answer: set,
    hint: 'Kořeny, pak náčrt paraboly: kde je pod osou (záporná) a kde nad ní?',
    steps: [
      `Nejdřív rovnice $${polyTex(q.a, q.b, q.c)} = 0$: kořeny $${r1.tex}$ a $${r2.tex}$.`,
      `$a = ${q.a}$ ${up ? '> 0' : '< 0'}: parabola je otevřená ${up ? 'nahoru (∪)' : 'dolů (∩)'}. ${graph(x => q.a * x * x + q.b * x + q.c, { ...fit(q), small: true, W: 220, H: 150, pts: [{ x: r1.v, y: 0 }, { x: r2.v, y: 0 }] })}`,
      `Chceš, kde je ${rel[0] === '<' ? 'pod osou' : 'nad osou'} (${rel[0] === '<' ? 'záporná' : 'kladná'}): to je ${inside ? '<b>mezi</b> kořeny' : '<b>vně</b> kořenů'}.`,
      `${strict(rel) ? 'Ostrá nerovnost: kořeny do výsledku nepatří, kulaté závorky.' : 'Neostrá nerovnost (je tam i „rovná se“): kořeny patří do výsledku, hranaté závorky ⟨ ⟩.'}`,
      `$x \\in ${toTexBoth(set)}$`,
    ],
    data: { q, rel, inside },
  };
}
function fit(q) {
  const xs = q.roots.map(r => r[0] / r[1]);
  const xv = -q.b / (2 * q.a), yv = q.a * xv * xv + q.b * xv + q.c;
  const xmin = Math.floor(Math.min(...xs, xv) - 2), xmax = Math.ceil(Math.max(...xs, xv) + 2);
  const ymin = Math.min(-2, Math.floor(yv) - 1), ymax = Math.max(2, Math.ceil(yv) + 1);
  return { xmin, xmax, ymin: q.a > 0 ? ymin : -Math.max(3, (ymax - ymin) / 3), ymax: q.a > 0 ? Math.max(3, (ymax - ymin) / 3) : ymax, step: Math.max(1, Math.round((xmax - xmin) / 10)), labelEvery: 1 };
}
export function quadIneqGuided() {
  const c0 = quadIneq();
  const { q, rel, inside } = c0.data;
  return {
    type: 'guided', key: 'quadIneq:guided', prompt: c0.prompt, fn: c0.fn, steps: c0.steps,
    gsteps: [
      { kind: 'form', title: `Kořeny rovnice $${polyTex(q.a, q.b, q.c)} = 0$`, fields: [nums(q.roots.map(r => r[0] / r[1]), q.roots.map(r => fracTex(...r)), q.roots.map(r => fracTxt(...r)))] },
      { kind: 'choice', title: `Parabola je otevřená ${q.a > 0 ? 'nahoru' : 'dolů'}. Kde je ${rel[0] === '<' ? 'pod' : 'nad'} osou $x$?`, options: [{ label: 'mezi kořeny', correct: inside, why: '' }, { label: 'vně kořenů (vlevo i vpravo)', correct: !inside, why: '' }] },
      { kind: 'interval', title: 'Výsledek', info: strict(rel) ? 'Ostrá nerovnost → kulaté závorky u kořenů.' : 'Je tam i „=“ → kořeny patří do výsledku, ⟨ ⟩.', label: 'x ∈', answer: c0.answer },
    ],
  };
}

// =====================================================================
// Exponenciální
// =====================================================================
const BASES = [[2, 1], [3, 1], [5, 1], [10, 1], [1, 2], [1, 3]];
/** b^n jako zlomek: [p, q] */
function bpow([bp, bq], n) { return n >= 0 ? [bp ** n, bq ** n] : [bq ** -n, bp ** -n]; }
const btex = ([p, q]) => (q === 1 ? String(p) : `\\frac{${p}}{${q}}`);
const btxt = ([p, q]) => (q === 1 ? String(p) : `${p}/${q}`);
const bpar = b => (b[1] === 1 ? btex(b) : `\\left(${btex(b)}\\right)`);
export function expEq() {
  const b = pick(BASES.slice(0, 4)), n = ri(-3, 4);
  if (b[0] === 10 && Math.abs(n) > 3) return expEq();
  const v = bpow(b, n);
  const m = ri(-2, 2);
  const e = m === 0 ? 'x' : `x ${m < 0 ? '-' : '+'} ${Math.abs(m)}`;
  return form({
    key: 'expEq', prompt: 'Vyřeš rovnici', fn: `${btex(b)}^{${e}} = ${btex(v)}`,
    fields: [nums([n - m], [String(n - m)], [String(n - m)])],
    hint: `Napiš pravou stranu jako mocninu ${btxt(b)}.`,
    steps: [`$${btex(v)} = ${btex(b)}^{${n}}$${n < 0 ? ' (záporný exponent = převrácená hodnota)' : n === 0 ? ' (cokoli na nultou je 1)' : ''}.`, `Stejné základy → stejné exponenty: $${e} = ${n}$.`, `$x = ${n - m}$`],
  });
}
export function expIneq(fix) {
  let b, n, k, m, rel;
  if (fix) [b, n, k, m, rel] = fix;
  else { b = pick(BASES); n = ri(-3, 3); k = pick([1, 1, 1, 2, -1]); m = pick([0, 0, ri(-3, 3)]); rel = pick(['<', '<=', '>', '>=']); }
  if ((b[0] === 10 || b[1] > 1 || b[0] === 5) && Math.abs(n) > 2) n = Math.sign(n) * 2;
  const v = bpow(b, n);
  const down = b[1] > 1;                  // základ < 1 → funkce klesá
  const r1 = down ? flip[rel] : rel;      // nerovnost mezi exponenty
  const r2 = k < 0 ? flip[r1] : r1;       // po vydělení k
  const bound = frac(n - m, k);
  const set = r2 === '<' ? lt(bound) : r2 === '<=' ? le(bound) : r2 === '>' ? gt(bound) : ge(bound);
  const e = `${k === 1 ? '' : k === -1 ? '-' : k}x${m ? ` ${m < 0 ? '-' : '+'} ${Math.abs(m)}` : ''}`;
  return {
    type: 'interval', key: 'expIneq', prompt: 'Najdi všechna $x \\in \\mathbb{R}$, která splňují nerovnici', fn: `${bpar(b)}^{${e}} ${REL[rel]} ${btex(v)}`, label: 'x ∈', answer: set,
    hint: 'Stejný základ na obou stranách, pak porovnej exponenty. Základ menší než 1 otočí znaménko.',
    steps: [
      `Pravá strana jako mocnina základu: $${btex(v)} = ${bpar(b)}^{${n}}$.`,
      down ? `Základ $${btex(b)} < 1$: funkce <b>klesá</b>, takže při přechodu na exponenty se znaménko <b>otočí</b>: $${e} ${REL[r1]} ${n}$.` : `Základ $${btex(b)} > 1$: funkce roste, znaménko zůstává: $${e} ${REL[r1]} ${n}$.`,
      k !== 1 ? `${m ? `Převeď $${m}$: $${k === -1 ? '-' : k}x ${REL[r1]} ${n - m}$. ` : ''}Vyděl $${k}$${k < 0 ? ' (záporné číslo → znaménko se otočí)' : ''}: $x ${REL[r2]} ${bound.tex}$.` : `$x ${REL[r2]} ${bound.tex}$`,
      `$x \\in ${toTexBoth(set)}$`,
    ],
    data: { b, n, k, m, rel, r1, down, v, set },
  };
}
export function expIneqGuided() {
  const c0 = expIneq();
  const { b, n, down, set, v } = c0.data;
  return {
    type: 'guided', key: 'expIneq:guided', prompt: c0.prompt, fn: c0.fn, steps: c0.steps,
    gsteps: [
      { kind: 'form', title: 'Pravá strana jako mocnina základu', info: `$${btex(v)} = ${bpar(b)}^{?}$`, fields: [{ kind: 'num', label: 'exponent $=$', answer: n, tex: String(n), text: String(n) }] },
      { kind: 'choice', title: 'Co se stane se znaménkem nerovnosti, až porovnáš exponenty?', options: [{ label: 'zůstane', correct: !down, why: '' }, { label: 'otočí se', correct: down, why: '' }], },
      { kind: 'interval', title: 'Výsledek', info: down ? `Základ $${btex(b)}$ je menší než 1: otočit.` : `Základ $${btex(b)}$ je větší než 1: nechat.`, label: 'x ∈', answer: set },
    ],
  };
}

// =====================================================================
// Logaritmy
// =====================================================================
const LB = [[2, 1], [3, 1], [5, 1], [10, 1], [1, 2], [1, 3]];
const logB = b => (b[1] === 1 ? `\\log_{${b[0]}}` : `\\log_{\\frac{${b[0]}}{${b[1]}}}`);
export function logVal() {
  const b = pick(LB.slice(0, 4)), n = ri(-2, b[0] === 2 ? 5 : 3);
  const v = bpow(b, n);
  return form({
    key: 'logVal', prompt: 'Kolik je', fn: `${logB(b)} ${btex(v)}`,
    fields: [{ kind: 'num', label: '$=$', answer: n, tex: String(n), text: String(n) }],
    hint: `Na kolikátou musím umocnit ${b[0]}, aby vyšlo ${btxt(v)}?`,
    steps: [`$\\log_a y$ je otázka: na kolikátou umocnit $a$, aby vyšlo $y$?`, `$${btex(b)}^{${n}} = ${btex(v)}$, takže $${logB(b)} ${btex(v)} = ${n}$.`],
  });
}
export function logIneq(fix, words = false) {
  let b, c, m, rel;
  if (fix) [b, c, m, rel] = fix;
  else { b = pick(LB); c = ri(-1, b[0] === 2 ? 3 : 2); m = pick([0, 0, 0, ri(-3, 3)]); rel = pick(['<', '<=', '>', '>=']); }
  const v = bpow(b, c);
  const down = b[1] > 1;
  const r1 = down ? flip[rel] : rel;
  const lo = frac(m), hi = frac(v[0] + m * v[1], v[1]);
  // definiční obor x > m, plus podmínka z nerovnosti
  const set = r1 === '<' || r1 === '<=' ? [iv(lo, hi, false, r1 === '<=')] : [iv(hi, INF, r1 === '>=', false)];
  const arg = m === 0 ? 'x' : `x ${m < 0 ? '+' : '-'} ${Math.abs(m)}`;
  const nm = { '<': 'menší než', '<=': 'menší nebo rovný', '>': 'větší než', '>=': 'větší nebo rovný' }[rel];
  const prompt = words ? `Urči všechna $x \\in \\mathbb{R}$, jejichž logaritmus o základu $${btex(b)}$ je ${nm} $${c}$.` : 'Najdi všechna $x \\in \\mathbb{R}$, která splňují nerovnici';
  return {
    type: 'interval', key: words ? 'logWords' : 'logIneq', prompt, fn: words ? null : `${logB(b)}\\left(${arg}\\right) ${REL[rel]} ${c}`, label: 'x ∈', answer: set,
    hint: 'Podmínka: logaritmovat jde jen kladné číslo. Pak odlogaritmuj.',
    steps: [
      words ? `Zápis: $${logB(b)} x ${REL[rel]} ${c}$.` : null,
      `Podmínka: argument logaritmu musí být kladný: $${arg} > 0$, tedy $x > ${m}$.`,
      `Odlogaritmuj (umocni základ): $${arg} ${REL[r1]} ${bpar(b)}^{${c}} = ${btex(v)}$${down ? ` (základ $${btex(b)} < 1$ → znaménko se <b>otočí</b>)` : ''}.`,
      m ? `$x ${REL[r1]} ${hi.tex}$` : null,
      `S podmínkou dohromady: $x \\in ${toTexBoth(set)}$`,
    ].filter(Boolean),
    data: { b, c, m, rel, r1, down, v, set, hi, arg },
  };
}
export const logWords = () => logIneq(null, true);
export function logIneqGuided() {
  const c0 = logIneq(Math.random() < 0.5 ? null : [pick(LB.slice(0, 4)), ri(1, 2), 0, pick(['<', '<=', '>', '>='])]);
  const { b, c, m, down, set, hi, arg } = c0.data;
  return {
    type: 'guided', key: 'logIneq:guided', prompt: c0.prompt, fn: c0.fn, steps: c0.steps,
    gsteps: [
      { kind: 'choice', title: 'Podmínka (co smí být v logaritmu)', options: options(`$x > ${m}$`, [`$x \\ge ${m}$`, `$x > ${hi.tex}$`, `$x \\ne ${m}$`], `Logaritmovat jde jen kladné číslo: $${arg} > 0$.`) },
      { kind: 'form', title: 'Odlogaritmuj', info: `$${bpar(b)}^{${c}}$`, fields: [{ kind: 'num', label: `$${bpar(b)}^{${c}} =$`, answer: hi.v - m, tex: btex(bpow(b, c)), text: btxt(bpow(b, c)) }] },
      { kind: 'choice', title: 'Znaménko nerovnosti po odlogaritmování', options: [{ label: 'zůstane', correct: !down, why: '' }, { label: 'otočí se', correct: down, why: '' }] },
      { kind: 'interval', title: 'Výsledek (i s podmínkou)', label: 'x ∈', answer: set },
    ],
  };
}

// =====================================================================
// Goniometrické rovnice
// =====================================================================
const TV = [[1, 2, 1], [1, 2, 2], [1, 2, 3], [-1, 2, 1], [-1, 2, 2], [-1, 2, 3]];
const vTex = ([p, q, n]) => valTex({ p, q, n });
const vVal = ([p, q, n]) => p / q * Math.sqrt(n);
/** základní řešení v ⟨0°, 360°) */
function basic(f, v) {
  const a = f === 'sin' ? Math.round(Math.asin(v) * 180 / Math.PI) : Math.round(Math.acos(v) * 180 / Math.PI);
  const s = f === 'sin' ? [a, 180 - a] : [a, -a];
  return [...new Set(s.map(norm360))].sort((x, y) => x - y);
}
const general = sols => sols.map(d => `x = ${radTex(d)} + 2k\\pi`).join(',\\ ');
export function trigEqData(fix) {
  const [f, t] = fix || [pick(['sin', 'cos']), pick(Math.random() < 0.15 ? [[0, 1, 1], [1, 1, 1], [-1, 1, 1]] : TV)];
  return { f, t, v: vVal(t), sols: basic(f, vVal(t)) };
}
export function trigEqBasic(fix) {
  const { f, t, sols } = trigEqData(fix);
  return form({
    key: 'trigEqBasic', prompt: `Najdi všechna řešení v intervalu $\\langle 0, 2\\pi)$`, fn: `\\${f} x = ${vTex(t)}`,
    fields: [{ kind: 'angles', label: '$x =$', answer: sols, tex: sols.map(radTex).join(';\\ '), text: sols.map(radTxt).join('; '), placeholder: 'např. π/6; 5π/6' }],
    hint: f === 'sin' ? 'sin = svislá souřadnice na kružnici. Dva body ve stejné výšce.' : 'cos = vodorovná souřadnice na kružnici. Dva body nad sebou.',
    steps: trigEqSteps(f, t, sols), data: { f, t, v: vVal(t), sols },
  });
}
function trigEqSteps(f, t, sols) {
  const v = vVal(t);
  return [
    `Na jednotkové kružnici: $\\${f} x$ je ${f === 'sin' ? 'svislá' : 'vodorovná'} souřadnice. Nakresli ${f === 'sin' ? 'vodorovnou přímku y' : 'svislou přímku x'} $= ${vTex(t)}$ a najdi, kde protne kružnici. ${circle({ angles: sols.map(d => ({ deg: d, label: radTxt(d) })), line: f === 'sin' ? { y: v } : { x: v }, W: 220, H: 220 })}`,
    sols.length === 1 ? `Je jen jeden takový bod: $x = ${radTex(sols[0])}$.` : `Dva body: $${radTex(sols[0])}$ a $${radTex(sols[1])}$ (${f === 'sin' ? 'souměrné podle svislé osy: $\\pi - \\alpha$' : 'souměrné podle vodorovné osy: $2\\pi - \\alpha$'}).`,
    `Funkce se opakuje po $2\\pi$, takže všechna řešení: $${general(sols)}$, $k \\in \\mathbb{Z}$.`,
  ];
}
export function trigEqGeneral(fix) {
  const { f, t, sols } = trigEqData(fix);
  const right = `$${general(sols)},\\ k \\in \\mathbb{Z}$`;
  const other = basic(f === 'sin' ? 'cos' : 'sin', vVal(t));
  const wr = [
    [`$${sols.map(d => `x = ${radTex(d)} + k\\pi`).join(',\\ ')},\\ k \\in \\mathbb{Z}$`, 'Sinus i kosinus se opakují po $2\\pi$, ne po $\\pi$.'],
    sols.length > 1 ? [`$x = ${radTex(sols[0])} + 2k\\pi,\\ k \\in \\mathbb{Z}$`, 'Chybí druhý bod na kružnici.'] : null,
    [`$${general(other)},\\ k \\in \\mathbb{Z}$`, `Tohle jsou řešení pro $\\${f === 'sin' ? 'cos' : 'sin'}$.`],
    [`$${general(sols.map(d => norm360(-d + (f === 'sin' ? 0 : 180))))},\\ k \\in \\mathbb{Z}$`, 'Zkontroluj znaménko a kvadranty.'],
  ].filter(Boolean);
  return { type: 'choice', key: 'trigEqGeneral', prompt: 'Všechna řešení rovnice', context: `\\${f} x = ${vTex(t)}`, wide: true, options: options(right, wr), explain: trigEqSteps(f, t, sols).join(' '), steps: trigEqSteps(f, t, sols) };
}

// =====================================================================
// Goniometrické nerovnice
// =====================================================================
/** oblouk (stupně, proti směru hodinek), kde platí f(x) rel v */
function arcOf(f, v, rel) {
  if (f === 'cos') {
    const a = Math.round(Math.acos(v) * 180 / Math.PI);
    return rel[0] === '>' ? [-a, a] : [a, 360 - a];
  }
  const b = Math.round(Math.asin(v) * 180 / Math.PI);
  return rel[0] === '>' ? [b, 180 - b] : [180 - b, 360 + b];
}
const ivTex = ([a, b], cl) => `x \\in ${cl ? '\\left\\langle' : '\\left('} ${radTex(a)} + 2k\\pi,\\ ${radTex(b)} + 2k\\pi ${cl ? '\\right\\rangle' : '\\right)'},\\ k \\in \\mathbb{Z}`;
export function trigIneq(fix) {
  const [f, t, rel] = fix || [pick(['sin', 'cos']), pick([...TV, [0, 1, 1]]), pick(['<', '>', '<=', '>='])];
  const v = vVal(t), arc = arcOf(f, v, rel), cl = !strict(rel);
  const comp = [arc[1], arc[0] + 360];
  const norm = ([a, b]) => (a >= 360 ? [a - 360, b - 360] : [a, b]);
  const compN = norm(comp);
  const right = `$${ivTex(arc, cl)}$`;
  const steps = [
    `Na kružnici nakresli ${f === 'sin' ? 'vodorovnou přímku $y' : 'svislou přímku $x'} = ${vTex(t)}$. Hraniční body: $${radTex(norm360(arc[0]))}$ a $${radTex(norm360(arc[1]))}$.`,
    `Chceš, kde je $\\${f} x$ ${rel[0] === '>' ? 'větší' : 'menší'}: ${f === 'sin' ? (rel[0] === '>' ? 'nad' : 'pod') : (rel[0] === '>' ? 'vpravo od' : 'vlevo od')} přímkou. To je zvýrazněný oblouk. ${circle({ arc: { from: arc[0], to: arc[1] }, line: f === 'sin' ? { y: v } : { x: v }, angles: [{ deg: norm360(arc[0]) }, { deg: norm360(arc[1]) }], W: 220, H: 220 })}`,
    `Oblouk jdi proti směru hodinek: od $${radTex(arc[0])}$ do $${radTex(arc[1])}$ (začátek musí být menší než konec, proto ${arc[0] < 0 ? 'záporný úhel' : arc[1] > 360 ? 'konec přes $2\\pi$' : 'tak, jak je'}).`,
    `${cl ? 'Neostrá nerovnost: krajní body patří, ⟨ ⟩.' : 'Ostrá nerovnost: kulaté závorky.'} Přidej periodu $2k\\pi$: $${ivTex(arc, cl)}$`,
  ];
  return {
    type: 'choice', key: 'trigIneq', prompt: 'Řešení nerovnice', context: `\\${f} x ${REL[rel]} ${vTex(t)}`, wide: true,
    options: options(right, [
      [`$${ivTex(compN, cl)}$`, 'To je opačná část kružnice (kde nerovnost neplatí).'],
      [`$${ivTex(arc, !cl)}$`, cl ? 'Je tam i „=“, takže krajní body patří: ⟨ ⟩.' : 'Ostrá nerovnost: krajní body nepatří, kulaté závorky.'],
      [`$${ivTex(arc, cl).replace(/2k\\pi/g, 'k\\pi')}$`, 'Perioda sinu i kosinu je $2\\pi$.'],
    ]),
    explain: steps[1], steps, data: { f, t, rel, arc, comp: compN, cl, v },
  };
}
export function trigIneqGuided() {
  const c0 = trigIneq();
  const { f, t, arc, comp, v } = c0.data;
  const pics = shuffle([{ a: arc, ok: true }, { a: comp, ok: false }]).map(o => ({ label: circle({ arc: { from: o.a[0], to: o.a[1] }, line: f === 'sin' ? { y: v } : { x: v }, W: 160, H: 160 }), correct: o.ok }));
  const sols = [...new Set([norm360(arc[0]), norm360(arc[1])])].sort((a, b) => a - b);
  return {
    type: 'guided', key: 'trigIneq:guided', prompt: c0.prompt, fn: c0.context, steps: c0.steps,
    gsteps: [
      { kind: 'form', title: `Kde je $\\${f} x = ${vTex(t)}$? (v $\\langle 0, 2\\pi)$)`, fields: [{ kind: 'angles', label: '$x =$', answer: sols, tex: sols.map(radTex).join(';\\ '), text: sols.map(radTxt).join('; '), placeholder: 'např. π/6; 5π/6' }] },
      { kind: 'form', title: 'Která část kružnice to je?', fields: [{ kind: 'pick', label: '', options: pics, answer: null, tex: '', text: null }] },
      { kind: 'choice', title: 'Zápis výsledku', options: c0.options },
    ],
  };
}

// =====================================================================
// Příklady z testu
// =====================================================================
const QA = { a: 2, b: 5, c: -3, D: 49, roots: [[-3, 1], [1, 2]] };
const QB = { a: 2, b: 5, c: 3, D: 1, roots: [[-3, 2], [-1, 1]] };
export const FIXED = {
  A3a: () => ({ ...quadEq(QA), key: 'A3a' }),
  A3b: () => ({ ...quadIneq(QA, '<='), key: 'A3b' }),
  A3c: () => ({ ...trigIneq(['cos', [1, 2, 1], '>']), key: 'A3c' }),
  A3d: () => ({ ...logIneq([[3, 1], 2, 0, '<'], true), key: 'A3d' }),
  B3a: () => ({ ...quadEq(QB), key: 'B3a' }),
  B3b: () => ({ ...quadIneq(QB, '<='), key: 'B3b' }),
  B3c: () => ({ ...expIneq([[2, 1], -1, 1, 0, '>']), key: 'B3c' }),
  B3d: () => ({ ...trigEqGeneral(['sin', [1, 2, 1]]), key: 'B3d', prompt: 'Urči všechna $x \\in \\mathbb{R}$, pro která je hodnota funkce $\\sin x$ rovna $\\frac{1}{2}$.' }),
};
export const GEN = { quadEq, discCount, quadIneq, expEq, expIneq, logVal, logIneq, logWords, trigEqBasic, trigEqGeneral, trigIneq };
export { quadData };
