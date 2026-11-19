// Písemky z MA1 z minulých let, přepsané přesně podle fotek (zadání = TeX 1:1 kvůli tisku).
// Výsledky se nepíšou ručně: počítá je build.js z parametrů. chk = zadání ještě jednou jako text pro sym.js,
// podle kterého audit (tools/audit-pisemka.mjs) výsledek nezávisle ověří numericky.
import { Q, qi, P } from './build.js';
import { D, EX, L, TY, IN, DI } from './types.js';
import { byId } from './tf.js';
import { limit, extremes, taylor, asymptote, numeric } from './build.js';

const R = String.raw;
export const T1o = 'Určete definiční obor funkce';
export const T1n = 'Určete (a zapište jako sjednocení intervalů) definiční obor funkce';
export const T2o = 'Najděte intervaly ryzí monotonie a lokální extrémy funkce';
export const T2n = 'Najděte všechny lokální extrémy funkce';
export const T3 = 'Vypočtěte limitu';
export const T4 = 'Určete Taylorův polynom 2. řádu funkce $f$ se středem v bodě $x_0$, je-li';
export const T5 = 'Vypočtěte';
export const T7a = 'Rozhodněte, která z následujících tvrzení jsou pravdivá/nepravdivá.';
export const T7b = 'Rozhodněte, která z následujících tvrzení jsou pravdivá a která nepravdivá.';
export const FOOT = 'Za správnou odpověď obdržíte 2 body a za špatnou se 2 body odečtou. Nemusíte však odpovídat na všechny otázky. Maximálně můžete získat 10 bodů a minimálně 0 bodů.';
const dx = R`\,\mathrm{d}x`;

/** příklad 7: tvrzení z banky podle id */
export function tfProblem(text, ids) {
  const items = ids.map(id => { const s = byId(id); if (!s) throw new Error('tvrzení ' + id); return s; });
  return {
    text, items, kind: 'tf',
    answerTex: items.map((s, i) => `\\text{(${'abcde'[i]}) ${s.truth ? 'P' : 'N'}}`).join(',\\ '),
    steps: items.map((s, i) => `(${'abcde'[i]}) <b>${s.truth ? 'Pravda' : 'Nepravda'}</b>: ${s.why}`),
    card: () => ({ type: 'tf5', key: 'p7', prompt: text, items, steps: null }),
  };
}

const ex = (id, group, course, letter, probs, opts = {}) => ({ id, group, course, letter, probs, ...opts });
const lim0 = s => `\\lim_{x\\to 0} ${s}`;

// ---------------------------------------------------------------- jednotlivé písemky
// Pořadí příkladů: 1 definiční obor, 2 extrémy, 3 limita, 4 Taylor, 5 neurčitý integrál, 6 určitý integrál, 7 pravda/nepravda.
const LIST = [
  // ============================================ Matematická analýza 1, zadání s letopočtem 2026
  ex('26A', 'n26', 'Matematická analýza 1', 'A', () => [
    D.sqrtQuadOverLin({ q: P(-3, 1, 2), m: -2, text: T1n, tex: R`f(x) = \frac{\sqrt{2x^2 + x - 3}}{x + 2}` }),
    EX.poly({ f: P(0, 0, 0, 1, 2), mono: false, text: T2n, tex: R`f(x) = x^3(2x + 1)` }),
    L.oneCos({ b: 4, c: 7, d: 5, flip: true, tex: lim0(R`\frac{\mathrm{e}^{5x} - 1}{1 + 4x - \cos 7x}`) }),
    TY.trig({ A: 2, B: 3, x0: 2, tex: R`f(x) = 2\sin x + 3\cos x, \quad x_0 = \pi` }),
    IN.powTrig({ n: 3, a: 1, b: -2, g: 'sin', tex: R`\int x^2\sin\left(x^3 - 2\right)${dx}` }),
    DI.frac({ num: [[1, 3], [2, 0]], den: 2, a: 1, b: 2, tex: R`\int\limits_1^2 \frac{x^3 + 2}{x^2}${dx}` }),
    tfProblem(T7a, ['spoj-R-omez', 'period-suda-licha', 'int-2026', 'f1-0-f2-neg1b', 'asym-nespoj2']),
  ], { chk: ['sqrt(2x^2+x-3)/(x+2)', 'x^3*(2x+1)', '(e^(5x)-1)/(1+4x-cos(7x))', '2*sin(x)+3*cos(x)', 'x^2*sin(x^3-2)', '(x^3+2)/x^2'] }),
  ex('26B', 'n26', 'Matematická analýza 1', 'B', () => [
    D.sqrtQuadOverLin({ q: P(-4, -3, 1), m: -3, text: T1n, tex: R`f(x) = \frac{\sqrt{x^2 - 3x - 4}}{x + 3}` }),
    EX.poly({ f: P(0, 0, 0, 2, -3), mono: false, text: T2n, tex: R`f(x) = x^3(2 - 3x)` }),
    L.xSinLn({ a: 3, b: 2, flip: true, tex: lim0(R`\frac{\ln(1 + 2x)}{x + \sin 3x}`) }),
    TY.trig({ A: 3, B: -4, x0: 1, tex: R`f(x) = 3\sin x - 4\cos x, \quad x_0 = \frac{\pi}{2}` }),
    IN.powTrig({ n: 4, a: 1, b: -2, g: 'cos', tex: R`\int x^3\cos\left(x^4 - 2\right)${dx}` }),
    DI.frac({ num: [[1, 4], [1, 1]], den: 3, a: 1, b: 2, tex: R`\int\limits_1^2 \frac{x^4 + x}{x^3}${dx}` }),
    tfProblem(T7a, ['int-sin2x-sin', 'deriv-klad-rost2', 'asym-DR2', 'spoj-deriv2', 'max-f2-5']),
  ], { chk: ['sqrt(x^2-3x-4)/(x+3)', 'x^3*(2-3x)', 'ln(1+2x)/(x+sin(3x))', '3*sin(x)-4*cos(x)', 'x^3*cos(x^4-2)', '(x^4+x)/x^3'] }),
  ex('26C', 'n26', 'Matematická analýza 1', 'C', () => [
    D.lnQuadOverLin({ q: P(12, 1, -1), m: -1, qTex: '12 + x - x^2', text: T1n, tex: R`f(x) = \frac{\ln\left(12 + x - x^2\right)}{x + 1}` }),
    EX.poly({ f: P(0, 0, 0, 1, -4), mono: false, text: T2n, tex: R`f(x) = x^3(1 - 4x)` }),
    L.sinFact({ c: 1, tex: R`\lim_{x\to -1} \frac{\sin(x^2 - 1)}{x^3 + 1}` }),
    TY.expTrig({ A: 1, B: 6, g: 'cos', tex: R`f(x) = \mathrm{e}^x + 6\cos x, \quad x_0 = 0` }),
    IN.powPow({ n: 4, c: 2, d: 1, m: 26, tex: R`\int x^3(x^4 + 2)^{26}${dx}` }),
    DI.frac({ num: [[2, 1], [1, 0]], den: 3, a: 1, b: 3, tex: R`\int\limits_1^3 \frac{1 + 2x}{x^3}${dx}` }),
    tfProblem(T7a, ['deriv0-ext3', 'omez-asym', 'int-2026x', 'spoj-uzavr-omez2', 'nek-deriv-spoj5']),
  ], { chk: ['ln(12+x-x^2)/(x+1)', 'x^3*(1-4x)', 'sin(x^2-1)/(x^3+1)', 'e^x+6*cos(x)', 'x^3*(x^4+2)^26', '(1+2x)/x^3'] }),
  ex('26D', 'n26', 'Matematická analýza 1', 'D', () => [
    D.lnQuadOverLin({ q: P(-2, 1, 1), m: 3, text: T1n, tex: R`f(x) = \frac{\ln\left(x^2 + x - 2\right)}{x - 3}` }),
    EX.poly({ f: P(0, 0, 0, 4, -1), mono: false, text: T2n, tex: R`f(x) = x^3(4 - x)` }),
    L.lnPow({ a: 2, k: 3, tex: R`\lim_{x\to 1} \frac{\ln(2x - 1)}{x^3 - 1}` }),
    TY.expTrig({ A: 2, B: -3, g: 'sin', tex: R`f(x) = 2\mathrm{e}^x - 3\sin x, \quad x_0 = 0` }),
    IN.powPow({ n: 6, c: 1, d: -1, m: 13, tex: R`\int x^5(1 - x^6)^{13}${dx}` }),
    DI.frac({ num: [[1, 1], [2, 0]], den: 4, a: 1, b: 2, tex: R`\int\limits_1^2 \frac{2 + x}{x^4}${dx}` }),
    tfProblem(T7a, ['deriv-nezap-nekles2', 'deriv-Rstar2', 'f2-min3', 'int-sin2x-cos', 'asym-k2b']),
  ], { chk: ['ln(x^2+x-2)/(x-3)', 'x^3*(4-x)', 'ln(2x-1)/(x^3-1)', '2*e^x-3*sin(x)', 'x^5*(1-x^6)^13', '(2+x)/x^4'] }),

  // ============================================ Matematická analýza 1, zadání s letopočtem 2025
  ex('25A', 'n25', 'Matematická analýza 1', 'A', () => [
    D.sqrtQuadOverLin({ q: P(-2, 1, 1), m: 3, text: T1n, tex: R`f(x) = \frac{\sqrt{x^2 + x - 2}}{x - 3}` }),
    EX.poly({ f: P(0, 0, 0, -20, 9), mono: false, text: T2n, tex: R`f(x) = x^3(9x - 20)` }),
    L.oneCos({ b: 3, c: 4, d: 2, tex: lim0(R`\frac{1 + 3x - \cos 4x}{\mathrm{e}^{2x} - 1}`) }),
    TY.power({ r: Q(-1, 2), fTex: R`\frac{1}{\sqrt{x}}`, tex: R`f(x) = \frac{1}{\sqrt{x}}, \quad x_0 = 1` }),
    IN.powTrig({ n: 3, a: 2, b: 7, g: 'cos', tex: R`\int x^2\cos\left(2x^3 + 7\right)${dx}` }),
    DI.frac({ num: [[1, 3], [1, 2], [1, 0]], den: 2, a: 1, b: 2, tex: R`\int\limits_1^2 \frac{x^3 + x^2 + 1}{x^2}${dx}` }),
    tfProblem(T7a, ['int-2025', 'spoj-R-omez', 'period-suda-licha', 'asym-nespoj2', 'f1-0-f2-neg1b']),
  ], { chk: ['sqrt(x^2+x-2)/(x-3)', 'x^3*(9x-20)', '(1+3x-cos(4x))/(e^(2x)-1)', '1/sqrt(x)', 'x^2*cos(2x^3+7)', '(x^3+x^2+1)/x^2'] }),
  ex('25B', 'n25', 'Matematická analýza 1', 'B', () => [
    D.sqrtQuadOverLin({ q: P(-3, -2, 1), m: -4, text: T1n, tex: R`f(x) = \frac{\sqrt{x^2 - 2x - 3}}{x + 4}` }),
    EX.poly({ f: P(0, 0, 0, -2, 1), mono: false, text: T2n, tex: R`f(x) = x^3(x - 2)` }),
    L.xSinLn({ a: 2, b: 4, tex: lim0(R`\frac{x + \sin 2x}{\ln(1 + 4x)}`) }),
    TY.power({ r: Q(-1, 3), fTex: R`\frac{1}{\sqrt[3]{x}}`, tex: R`f(x) = \frac{1}{\sqrt[3]{x}}, \quad x_0 = 1` }),
    IN.powTrig({ n: 4, a: 3, b: 5, g: 'sin', tex: R`\int x^3\sin\left(3x^4 + 5\right)${dx}` }),
    DI.frac({ num: [[1, 4], [1, 3], [4, 0]], den: 3, a: 1, b: 2, tex: R`\int\limits_1^2 \frac{x^4 + x^3 + 4}{x^3}${dx}` }),
    tfProblem(T7a, ['asym-DR2', 'int-sin2x-sin', 'deriv-klad-rost', 'max-f2-5', 'spoj-deriv2']),
  ], { chk: ['sqrt(x^2-2x-3)/(x+4)', 'x^3*(x-2)', '(x+sin(2x))/ln(1+4x)', 'x^(-1/3)', 'x^3*sin(3x^4+5)', '(x^4+x^3+4)/x^3'] }),
  ex('25D', 'n25', 'Matematická analýza 1', 'D', () => [
    D.lnQuadOverLin({ q: P(8, 2, -1), m: 2, qTex: '2x + 8 - x^2', text: T1n, tex: R`f(x) = \frac{\ln\left(2x + 8 - x^2\right)}{x - 2}` }),
    EX.poly({ f: P(0, 0, 0, 4, -5), mono: false, text: T2n, tex: R`f(x) = x^3(4 - 5x)` }),
    L.shiftCosLn({ a: 3, b: 2, tex: R`\lim_{x\to 1} \frac{\cos(3x - 3) - x}{\ln(2x - 1)}` }),
    TY.power({ r: Q(-3), fTex: R`\frac{1}{x^3}`, tex: R`f(x) = \frac{1}{x^3}, \quad x_0 = 1` }),
    IN.powExp({ n: 3, a: -3, b: 1, tex: R`\int x^2\mathrm{e}^{(1 - 3x^3)}${dx}` }),
    DI.frac({ num: [[1, 0], [2, Q(1, 3)]], den: Q(2, 3), a: 1, b: 8, tex: R`\int\limits_1^8 \frac{1 + 2\sqrt[3]{x}}{\sqrt[3]{x^2}}${dx}` }),
    tfProblem(T7a, ['f2-min3', 'deriv-nezap-nekles', 'deriv-Rstar2', 'asym-k2b', 'int-sin2x-cos']),
  ], { chk: ['ln(2x+8-x^2)/(x-2)', 'x^3*(4-5x)', '(cos(3x-3)-x)/ln(2x-1)', '1/x^3', 'x^2*e^(1-3x^3)', '(1+2*cbrt(x))/cbrt(x^2)'] }),

  // ============================================ Matematická analýza I., starší zadání
  ex('IA1', 'old', 'Matematická analýza I.', 'A', () => [
    D.sqrtArc({ q: P(0, -2, 1), arc: 'arcsin', a: qi(1), b: qi(0), c: 2, argTex: 'x', text: T1o, tex: R`f(x) = \sqrt{x^2 - 2x} + 2\arcsin x` }),
    EX.poly({ f: P(7, -12, 9, 4), mono: true, text: T2o, tex: R`f(x) = 4x^3 + 9x^2 - 12x + 7` }),
    L.lnSq({ k: 2, sign: 1, tex: R`\lim_{x\to \frac{1}{2}} \frac{2x - 1 - \ln(2x)}{4x^2 - 4x + 1}` }),
    TY.sqrtLin({ a: 3, b: 1, x0: qi(0), tex: R`f(x) = \sqrt{3x + 1}, \quad x_0 = 0` }),
    IN.ratPow({ p: P(5, 3, 1), k: 3, tex: R`\int \frac{2x + 3}{(x^2 + 3x + 5)^3}${dx}` }),
    DI.frac({ num: [[1, 3], [1, 0]], den: 2, a: 1, b: 2, tex: R`\int\limits_1^2 \frac{x^3 + 1}{x^2}${dx}` }),
    tfProblem(T7a, ['asym-nespoj', 'omez-spoj', 'period-omez', 'int-ln3x', 'f1-0-f2-neg5']),
  ], { chk: ['sqrt(x^2-2x)+2*arcsin(x)', '4x^3+9x^2-12x+7', '(2x-1-ln(2x))/(4x^2-4x+1)', 'sqrt(3x+1)', '(2x+3)/(x^2+3x+5)^3', '(x^3+1)/x^2'] }),
  ex('IB1', 'old', 'Matematická analýza I.', 'B', () => [
    D.sqrtArc({ q: P(0, -3, 1), arc: 'arccos', a: qi(1), b: qi(0), c: 3, argTex: 'x', text: T1o, tex: R`f(x) = \sqrt{x^2 - 3x} + 3\arccos x` }),
    EX.poly({ f: P(1, -18, -15, 4), mono: true, text: T2o, tex: R`f(x) = 4x^3 - 15x^2 - 18x + 1` }),
    L.lnSq({ k: 3, sign: -1, tex: R`\lim_{x\to \frac{1}{3}} \frac{1 - 3x + \ln(3x)}{9x^2 - 6x + 1}` }),
    TY.sqrtLin({ a: 2, b: 1, x0: qi(0), tex: R`f(x) = \sqrt{2x + 1}, \quad x_0 = 0` }),
    IN.ratPow({ p: P(2, 1, 1), k: 4, tex: R`\int \frac{2x + 1}{(x^2 + x + 2)^4}${dx}` }),
    DI.frac({ num: [[1, 4], [2, 0]], den: 2, a: 1, b: 3, tex: R`\int\limits_1^3 \frac{x^4 + 2}{x^2}${dx}` }),
    tfProblem(T7a, ['f2-nemax', 'int-sin2x-sin', 'rost-deriv-kladna', 'asym-DR', 'spoj-deriv']),
  ], { chk: ['sqrt(x^2-3x)+3*arccos(x)', '4x^3-15x^2-18x+1', '(1-3x+ln(3x))/(9x^2-6x+1)', 'sqrt(2x+1)', '(2x+1)/(x^2+x+2)^4', '(x^4+2)/x^2'] }),
  ex('IC1', 'old', 'Matematická analýza I.', 'C', () => [
    D.sqrtArc({ q: P(0, 4, -1), arc: 'arcsin', a: Q(1, 3), b: qi(0), argTex: R`\frac{x}{3}`, text: T1o, tex: R`f(x) = \sqrt{4x - x^2} + \arcsin\left(\frac{x}{3}\right)` }),
    EX.poly({ f: P(9, -4, -5, 2), mono: true, text: T2o, tex: R`f(x) = 2x^3 - 5x^2 - 4x + 9` }),
    L.second({ a: 3, c: 2, tex: lim0(R`\frac{\mathrm{e}^{3x} - 3x - 1}{x^3 + 2x^2}`) }),
    TY.sqrtLin({ a: 2, b: 3, x0: Q(1, 2), tex: R`f(x) = \sqrt{2x + 3}, \quad x_0 = \frac{1}{2}` }),
    IN.trigSq({ g: 'cos', tex: R`\int \frac{2x}{\cos^2(x^2)}${dx}` }),
    DI.frac({ num: [[1, 2], [3, 0]], den: 1, a: 1, b: 3, tex: R`\int\limits_1^3 \frac{x^2 + 3}{x}${dx}` }),
    tfProblem(T7a, ['nek-deriv-spoj', 'deriv0-ext', 'omez-asym', 'int-1-2x', 'spoj-uzavr-omez']),
  ], { chk: ['sqrt(4x-x^2)+arcsin(x/3)', '2x^3-5x^2-4x+9', '(e^(3x)-3x-1)/(x^3+2x^2)', 'sqrt(2x+3)', '2x/cos(x^2)^2', '(x^2+3)/x'] }),
  ex('ID1', 'old', 'Matematická analýza I.', 'D', () => [
    D.sqrtArc({ q: P(0, 5, -1), arc: 'arccos', a: Q(1, 2), b: qi(0), argTex: R`\frac{x}{2}`, text: T1o, tex: R`f(x) = \sqrt{5x - x^2} + \arccos\left(\frac{x}{2}\right)` }),
    EX.poly({ f: P(11, -3, 4, 1), mono: true, text: T2o, tex: R`f(x) = x^3 + 4x^2 - 3x + 11` }),
    L.second({ a: 2, c: 3, flip: true, tex: lim0(R`\frac{2x + 1 - \mathrm{e}^{2x}}{x^3 - 3x^2}`) }),
    TY.sqrtLin({ a: 4, b: 3, x0: Q(1, 4), tex: R`f(x) = \sqrt{4x + 3}, \quad x_0 = \frac{1}{4}` }),
    IN.trigSq({ g: 'sin', tex: R`\int \frac{2x}{\sin^2(x^2)}${dx}` }),
    DI.frac({ num: [[1, 3], [2, 0]], den: 1, a: 1, b: 2, tex: R`\int\limits_1^2 \frac{x^3 + 2}{x}${dx}` }),
    tfProblem(T7a, ['nekles-deriv', 'deriv-Rstar', 'f2-min', 'asym-k2', 'int-sin2x-cos']),
  ], { chk: ['sqrt(5x-x^2)+arccos(x/2)', 'x^3+4x^2-3x+11', '(2x+1-e^(2x))/(x^3-3x^2)', 'sqrt(4x+3)', '2x/sin(x^2)^2', '(x^3+2)/x'] }),
  ex('IE1', 'old', 'Matematická analýza I.', 'E', () => [
    D.lnLinSqrtQuad({ q: P(-6, 1, 1), d: 4, text: T1o, tex: R`f(x) = \frac{\ln(x + 4)}{\sqrt{x^2 + x - 6}}` }),
    EX.poly({ f: P(0, 0, 0, -2, 1), mono: true, text: T2o, tex: R`f(x) = x^3(x - 2)` }),
    L.expXcos({ a: 2, b: 5, tex: lim0(R`\frac{1 - \mathrm{e}^{2x}}{x\cos(5x)}`) }),
    TY.recLin({ a: 2, b: 3, x0: qi(-1), tex: R`f(x) = \frac{1}{2x + 3}, \quad x_0 = -1` }),
    IN.powTrig({ n: 4, a: 1, b: 5, g: 'sin', tex: R`\int x^3\sin(x^4 + 5)${dx}` }),
    DI.frac({ num: [[1, 1], [1, Q(1, 2)]], den: 1, a: 1, b: 4, tex: R`\int\limits_1^4 \frac{x + \sqrt{x}}{x}${dx}` }),
    tfProblem(T7a, ['asym-jednostr', 'max-deriv0', 'post-rost-konv', 'rost-prosta', 'int-arccotg']),
  ], { chk: ['ln(x+4)/sqrt(x^2+x-6)', 'x^3*(x-2)', '(1-e^(2x))/(x*cos(5x))', '1/(2x+3)', 'x^3*sin(x^4+5)', '(x+sqrt(x))/x'] }),
  ex('IF', 'old', 'Matematická analýza I.', 'F', () => [
    D.lnQuadSqrtLin({ q: P(-2, 1, 1), d: 3, text: T1o, tex: R`f(x) = \frac{\ln(x^2 + x - 2)}{\sqrt{x + 3}}` }),
    EX.poly({ f: P(0, 0, 0, 10, -3), mono: true, text: T2o, tex: R`f(x) = x^3(10 - 3x)` }),
    L.prodSinExp({ p: 2, q: 5, a: 1, b: 3, tex: lim0(R`\frac{(2x + 5)\sin x}{\mathrm{e}^{3x} - 1}`) }),
    TY.recLin({ a: 3, b: -2, x0: qi(1), tex: R`f(x) = \frac{1}{3x - 2}, \quad x_0 = 1` }),
    IN.powTrig({ n: 5, a: 1, b: 3, g: 'cos', tex: R`\int x^4\cos(x^5 + 3)${dx}` }),
    DI.frac({ num: [[2, 0], [1, Q(1, 2)]], den: Q(1, 2), a: 1, b: 9, tex: R`\int\limits_1^9 \frac{2 + \sqrt{x}}{\sqrt{x}}${dx}` }),
    tfProblem(T7a, ['konv1', 'int-arcsin', 'licha-prosta', 'post-rost-limita', 'asym-lim5']),
  ], { chk: ['ln(x^2+x-2)/sqrt(x+3)', 'x^3*(10-3x)', '(2x+5)*sin(x)/(e^(3x)-1)', '1/(3x-2)', 'x^4*cos(x^5+3)', '(2+sqrt(x))/sqrt(x)'] }),
  ex('IE2', 'old', 'Matematická analýza I.', 'E', () => [
    D.lnLinSqrtQuad({ q: P(-2, -1, 1), d: 3, text: T1o, tex: R`f(x) = \frac{\ln(x + 3)}{\sqrt{x^2 - x - 2}}` }),
    EX.poly({ f: P(0, 0, 0, -3, 2), mono: true, text: T2o, tex: R`f(x) = 2x^4 - 3x^3` }),
    L.expXcos({ a: 3, b: 4, tex: lim0(R`\frac{1 - \mathrm{e}^{3x}}{x\cos(4x)}`) }),
    TY.recLin({ a: 5, b: -4, x0: qi(1), tex: R`f(x) = \frac{1}{5x - 4}, \quad x_0 = 1` }),
    IN.polyDer({ p: P(-1, 1, 3), g: 'sin', tex: R`\int (6x + 1)\sin(3x^2 + x - 1)${dx}` }),
    DI.frac({ num: [[1, 2], [1, Q(1, 2)]], den: 1, a: 1, b: 4, tex: R`\int\limits_1^4 \frac{x^2 + \sqrt{x}}{x}${dx}` }),
    tfProblem(T7b, ['max-deriv0', 'post-rost-konv', 'asym-jednostr', 'int-arccotg', 'rost-prosta']),
  ], { chk: ['ln(x+3)/sqrt(x^2-x-2)', '2x^4-3x^3', '(1-e^(3x))/(x*cos(4x))', '1/(5x-4)', '(6x+1)*sin(3x^2+x-1)', '(x^2+sqrt(x))/x'] }),
  ex('IG', 'old', 'Matematická analýza I.', 'G', () => [
    D.arcOverProd({ arc: 'arcsin', k: 2, f1: P(-3, 2), f2: P(-5, 2), text: T1o, tex: R`f(x) = \frac{\arcsin(x - 2)}{(2x - 3)(2x - 5)}` }),
    EX.poly({ f: P(5, 0, 0, -4, 7), mono: true, text: T2o, tex: R`f(x) = 7x^4 - 4x^3 + 5` }),
    L.trigQuot({ c: 3, a: 1, b: 5, top: 'sin', tex: lim0(R`\frac{\mathrm{e}^{3x}\sin x}{\operatorname{tg}(5x)}`) }),
    TY.xOverLin({ b: 1, x0: qi(0), tex: R`f(x) = \frac{x}{x + 1}, \quad x_0 = 0` }),
    IN.polyDer({ p: P(1, 0, 1, 1), g: 'exp', tex: R`\int (3x^2 + 2x)\mathrm{e}^{(x^3 + x^2 + 1)}${dx}` }),
    DI.frac({ num: [[3, 5], [2, 1], [8, 0]], den: 3, a: 1, b: 2, tex: R`\int\limits_1^2 \frac{3x^5 + 2x + 8}{x^3}${dx}` }),
    tfProblem(T7b, ['spoj-otevr-omez', 'f1-0-f2-5', 'ne-suda-licha', 'post-rost-klad', 'int-3-x']),
  ], { chk: ['arcsin(x-2)/((2x-3)*(2x-5))', '7x^4-4x^3+5', 'e^(3x)*sin(x)/tg(5x)', 'x/(x+1)', '(3x^2+2x)*e^(x^3+x^2+1)', '(3x^5+2x+8)/x^3'] }),
  ex('IH', 'old', 'Matematická analýza I.', 'H', () => [
    D.arcOverProd({ arc: 'arccos', k: 1, f1: P(-1, 3), f2: P(-5, 3), text: T1o, tex: R`f(x) = \frac{\arccos(x - 1)}{(3x - 1)(3x - 5)}` }),
    EX.poly({ f: P(7, 0, 0, 6, -4), mono: true, text: T2o, tex: R`f(x) = 6x^3 - 4x^4 + 7` }),
    L.trigQuot({ c: 5, a: 1, b: 3, top: 'tg', tex: lim0(R`\frac{\mathrm{e}^{5x}\operatorname{tg} x}{\sin 3x}`) }),
    TY.xOverLin({ b: -1, x0: qi(2), tex: R`f(x) = \frac{x}{x - 1}, \quad x_0 = 2` }),
    IN.polyDer({ p: P(1, 1, 0, 0, 2), g: 'exp', tex: R`\int (8x^3 + 1)\mathrm{e}^{(2x^4 + x + 1)}${dx}` }),
    DI.frac({ num: [[2, 3], [1, 2], [4, 0]], den: 2, a: 1, b: 2, tex: R`\int\limits_1^2 \frac{2x^3 + x^2 + 4}{x^2}${dx}` }),
    tfProblem(T7b, ['f1-0-f2-neg1', 'int-arctg-arccotg', 'licha-prosta2', 'post-kles-zap', 'spoj-poloprimka-omez']),
  ], { chk: ['arccos(x-1)/((3x-1)*(3x-5))', '6x^3-4x^4+7', 'e^(5x)*tg(x)/sin(3x)', 'x/(x-1)', '(8x^3+1)*e^(2x^4+x+1)', '(2x^3+x^2+4)/x^2'] }),
  ex('IA2', 'old', 'Matematická analýza I.', 'A', () => [
    D.sqrtX2({ k: 1, m: 2, text: T1o, tex: R`f(x) = \frac{\sqrt{x^2(x - 1)}}{x - 2}` }),
    EX.poly({ f: P(5, 0, 24, 16, 3), mono: true, text: T2o, tex: R`f(x) = 3x^4 + 16x^3 + 24x^2 + 5` }),
    L.cosLnSin({ a: 3, b: 4, c: 1, tex: lim0(R`\frac{\cos(3x) - \ln(1 + 4x) - 1}{\sin x}`) }),
    TY.power({ r: Q(1, 3), fTex: R`\sqrt[3]{x}`, tex: R`f(x) = \sqrt[3]{x}, \quad x_0 = 1` }),
    IN.powTrig({ n: 5, a: 1, b: 1, g: 'cos', tex: R`\int x^4\cos\left(x^5 + 1\right)${dx}` }),
    DI.frac({ num: [[1, 0], [1, Q(1, 2)]], den: Q(1, 2), a: 1, b: 4, tex: R`\int\limits_1^4 \frac{1 + \sqrt{x}}{\sqrt{x}}${dx}` }),
    tfProblem(T7a, ['period-omez', 'int-ln3x', 'omez-spoj', 'f1-0-f2-neg5', 'asym-nespoj']),
  ], { chk: ['sqrt(x^2*(x-1))/(x-2)', '3x^4+16x^3+24x^2+5', '(cos(3x)-ln(1+4x)-1)/sin(x)', 'cbrt(x)', 'x^4*cos(x^5+1)', '(1+sqrt(x))/sqrt(x)'] }),
];

// ---------------------------------------------------------------- praktická část (jiný formát)
const PRACT = ex('PR', 'prakt', 'praktická část', '', () => [
  { ...limit({ text: 'a) Určete limitu posloupnosti:', tex: R`\lim \frac{-15n^3 - 6n + 2\sin n}{-3n^3 + n + 1}`, ans: qi(5), x0: Infinity, fstr: '(-15x^3-6x+2*sin(x))/(-3x^3+x+1)',
    steps: [R`Vyděl čitatel i jmenovatel $n^3$: $\frac{-15 - \frac{6}{n^2} + \frac{2\sin n}{n^3}}{-3 + \frac{1}{n^2} + \frac{1}{n^3}}$.`, R`$\frac{\sin n}{n^3} \to 0$ (omezená krát nula), takže limita je $\frac{-15}{-3} = 5$.`] }), n: '1a', pts: 5, inline: true },
  { ...limit({ text: 'b) Určete limitu funkce:', tex: lim0(R`\frac{1 - \cos x}{x^2}`), ans: Q(1, 2), x0: 0, fstr: '(1-cos(x))/x^2',
    steps: [R`Standardní limita $\lim\limits_{x\to 0}\frac{1 - \cos x}{x^2} = \frac{1}{2}$.`, R`(L'Hospital dvakrát: $\frac{\sin x}{2x} \to \frac{1}{2}$.)`] }), n: '1b', pts: 5, inline: true },
  { ...extremes({ text: 'Nalezněte všechny lokální extrémy funkce $f(x) = 2x^3 + 3x^2 - 72x$ (určete ve kterých bodech jsou extrémy a o jaké extrémy se jedná).', tex: R`f(x) = 2x^3 + 3x^2 - 72x`, f: P(0, -72, 3, 2), mono: false }), n: '2', pts: 10, inline: true },
  { ...asymptote({ text: 'Určete asymptotu funkce $f(x) = \\frac{3x^3 - x + 1}{x^2 + 1}$ v $-\\infty$.', tex: R`f(x) = \frac{3x^3 - x + 1}{x^2 + 1}\ \text{ v } -\infty`, k: qi(3), q: qi(0),
    steps: [R`$k = \lim\limits_{x\to-\infty}\frac{f(x)}{x} = \lim\frac{3x^3 - x + 1}{x^3 + x} = 3$.`, R`$q = \lim\limits_{x\to-\infty}(f(x) - 3x) = \lim\frac{3x^3 - x + 1 - 3x^3 - 3x}{x^2 + 1} = \lim\frac{-4x + 1}{x^2 + 1} = 0$.`, R`Asymptota $y = 3x$.`] }), n: '3', pts: 10, inline: true },
  { ...TY.expQuad({ tex: R`f(x) = \mathrm{e}^{x^2 + x}, \quad x_0 = 1` }), text: 'Určete Taylorův polynom druhého řádu funkce $f(x) = e^{x^2+x}$ v bodě $x_0 = 1$.', n: '4', pts: 10, inline: true },
  { ...numeric({ text: 'Určete hodnotu určitého integrálu $\\int_0^{\\frac{\\pi}{2}} (x^2 + x + 1)\\sin x\\,\\mathrm{d}x$', tex: R`\int_0^{\frac{\pi}{2}} (x^2 + x + 1)\sin x\,\mathrm{d}x`, value: Math.PI, valTex: R`\pi`, valTxt: 'pi', key: 'p6',
    steps: [R`Per partes dvakrát ($u$ = polynom, $v' = \sin x$): $\int (x^2 + x + 1)\sin x\,\mathrm{d}x = -(x^2 + x + 1)\cos x + \int (2x + 1)\cos x\,\mathrm{d}x$.`,
      R`$\int (2x + 1)\cos x\,\mathrm{d}x = (2x + 1)\sin x - \int 2\sin x\,\mathrm{d}x = (2x + 1)\sin x + 2\cos x$.`,
      R`$F(x) = -(x^2 + x + 1)\cos x + (2x + 1)\sin x + 2\cos x$; $F\left(\frac{\pi}{2}\right) = \pi + 1$, $F(0) = -1 + 2 = 1$.`, R`Výsledek: $\pi + 1 - 1 = \pi$.`] }), n: '5', pts: 10, inline: true, fstrInt: '(x^2+x+1)*sin(x)', a: 0, b: Math.PI / 2 },
], { practical: true, chk: [] });

export const GROUPS = [
  { id: 'n26', title: 'Matematická analýza 1', sub: 'Zadání s letopočtem 2026 (nejnovější)' },
  { id: 'n25', title: 'Matematická analýza 1', sub: 'Zadání s letopočtem 2025' },
  { id: 'old', title: 'Matematická analýza I.', sub: 'Starší zadání' },
  { id: 'prakt', title: 'Praktická část', sub: 'Jiný formát (5 příkladů)' },
];
export const EXAMS = [...LIST, PRACT];
export const examById = id => EXAMS.find(e => e.id === id);

/** sestaví příklady písemky: [{ n, pts, text, tex, card(), answerTex, steps, kind?, items? }] */
export function examProblems(e) {
  const ps = e.probs();
  if (e.practical) return ps;
  return ps.map((p, i) => ({ ...p, n: String(i + 1), pts: 10 }));
}
