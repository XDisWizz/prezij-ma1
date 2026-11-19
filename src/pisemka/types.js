// Rodiny příkladů písemky z MA1. Každá rodina = funkce (parametry) → objekt z build.js (zadání, výsledek, postup, karta).
// Minulé písemky (exams.js) volají rodiny s pevnými parametry, nové písemky a trénink (gen.js) s náhodnými.
// fstr = zadání jako text pro sym.js: audit podle něj nezávisle ověřuje výsledek numericky.
import { ri, pick, shuffle } from '../ui.js';
import { Q, qi, qv, qtex, qtxt, qadd, qsub, qmul, qdiv, qneg, P, ptex, pmul, lin, domain, extremes, limit, taylor, indefinite, definite, coefTex } from './build.js';

const R = String.raw;
const riNot = (a, b, ...bad) => { for (;;) { const x = ri(a, b); if (!bad.includes(x)) return x; } };
/** a·x + b jako TeX (2x - 3, x + 4, -x) */
export const linTex = (a, b, v = 'x') => ptex([qi(b), qi(a)], v);
const par = s => `\\left(${s}\\right)`;
const sgn = n => (n < 0 ? `- ${Math.abs(n)}` : `+ ${n}`);
const num = n => (n < 0 ? `(${n})` : String(n));
/** kvadratický polynom z kořenů: lead·(x − r1)(x − r2) */
const fromRoots = (lead, ...rs) => rs.reduce((p, r) => pmul(p, lin(r)), [qi(lead)]);

// =====================================================================
// 1. definiční obor
// =====================================================================
const T1 = 'Určete definiční obor funkce', T1n = 'Určete (a zapište jako sjednocení intervalů) definiční obor funkce';
export const D = {
  /** ln(kvadr.)/√(x + d) */
  lnQuadSqrtLin({ q, d, text = T1n, tex }) {
    const l = P(d, 1);
    return domain({ text, tex: tex || `f(x) = \\frac{\\ln${par(ptex(q))}}{\\sqrt{${ptex(l)}}}`, conds: [{ k: 'ln', p: q }, { k: 'sqrtDen', p: l }], fstr: `ln(${polyTxt(q)})/sqrt(x+(${d}))` });
  },
  /** ln(x + d)/√(kvadr.) */
  lnLinSqrtQuad({ q, d, text = T1n, tex }) {
    const l = P(d, 1);
    return domain({ text, tex: tex || `f(x) = \\frac{\\ln(${ptex(l)})}{\\sqrt{${ptex(q)}}}`, conds: [{ k: 'ln', p: l }, { k: 'sqrtDen', p: q }], fstr: `ln(x+(${d}))/sqrt(${polyTxt(q)})` });
  },
  /** √(kvadr.) + c·arcsin/arccos(a·x + b) */
  sqrtArc({ q, arc, a, b, c = 1, text = T1n, tex, argTex }) {
    const inner = argTex || (a.q === 1 && qv(a) === 1 ? linTex(1, qv(b)) : `\\frac{x}{${qdiv(qi(1), a).p}}`);
    return domain({ text, tex: tex || `f(x) = \\sqrt{${ptex(q)}} + ${c === 1 ? '' : c}\\${arc}${par(inner)}`,
      conds: [{ k: 'sqrt', p: q }, { k: 'arc', a, b, arg: inner }], fstr: `sqrt(${polyTxt(q)}) + ${c}*${arc}((${qtxt(a)})*x+(${qtxt(b)}))` });
  },
  /** arcsin/arccos(x − k)/((ax − b)(cx − d)) */
  arcOverProd({ arc, k, f1, f2, text = T1n, tex }) {
    const den = pmul(f1, f2);
    return domain({ text, tex: tex || `f(x) = \\frac{\\${arc}(x ${sgn(-k)})}{(${ptex(f1)})(${ptex(f2)})}`,
      conds: [{ k: 'arc', a: qi(1), b: qi(-k), arg: `x ${sgn(-k)}` }, { k: 'den', p: den, arg: `(${ptex(f1)})(${ptex(f2)})` }], fstr: `${arc}(x-(${k}))/((${polyTxt(f1)})*(${polyTxt(f2)}))` });
  },
  /** √(x²(x − k))/(x − m) */
  sqrtX2({ k, m, text = T1n, tex }) {
    const p = pmul(P(0, 0, 1), P(-k, 1)), l = P(-m, 1);
    return domain({ text, tex: tex || `f(x) = \\frac{\\sqrt{x^2(x ${sgn(-k)})}}{x ${sgn(-m)}}`, conds: [{ k: 'sqrt', p, arg: `x^2(x ${sgn(-k)})` }, { k: 'den', p: l }], fstr: `sqrt(x^2*(x-(${k})))/(x-(${m}))` });
  },
  /** ln(kvadr.)/(x − m) */
  lnQuadOverLin({ q, m, text = T1n, tex, qTex }) {
    const l = P(-m, 1);
    return domain({ text, tex: tex || `f(x) = \\frac{\\ln${par(qTex || ptex(q))}}{${ptex(l)}}`, conds: [{ k: 'ln', p: q, arg: qTex }, { k: 'den', p: l }], fstr: `ln(${polyTxt(q)})/(x-(${m}))` });
  },
  /** √(kvadr.)/(x − m) */
  sqrtQuadOverLin({ q, m, text = T1n, tex }) {
    const l = P(-m, 1);
    return domain({ text, tex: tex || `f(x) = \\frac{\\sqrt{${ptex(q)}}}{${ptex(l)}}`, conds: [{ k: 'sqrt', p: q }, { k: 'den', p: l }], fstr: `sqrt(${polyTxt(q)})/(x-(${m}))` });
  },
};
/** polynom jako text pro sym.js */
export function polyTxt(p) { return p.map((c, k) => (k === 0 ? `(${qtxt(c)})` : k === 1 ? `(${qtxt(c)})*x` : `(${qtxt(c)})*x^${k}`)).join('+'); }

/** náhodný příklad 1 */
export function genDomain(text = T1n) {
  const t = pick(['lnQuadSqrtLin', 'lnLinSqrtQuad', 'sqrtArc', 'sqrtArc2', 'arcOverProd', 'sqrtX2', 'lnQuadOverLin', 'sqrtQuadOverLin', 'sqrtQuadOverLin']);
  const r2 = () => { const a = ri(-5, 3); return [a, a + ri(1, 5)]; };
  switch (t) {
    case 'lnQuadSqrtLin': { const [a, b] = r2(); return D.lnQuadSqrtLin({ q: fromRoots(1, a, b), d: riNot(-3, 5, 0), text }); }
    case 'lnLinSqrtQuad': { const [a, b] = r2(); return D.lnLinSqrtQuad({ q: fromRoots(1, a, b), d: riNot(Math.max(-a, -b) + 1, 6, 0), text }); }
    case 'sqrtArc': { const k = ri(2, 6), m = ri(2, 4); return D.sqrtArc({ q: P(0, k, -1), arc: pick(['arcsin', 'arccos']), a: Q(1, m), b: qi(0), text, argTex: `\\frac{x}{${m}}` }); }
    case 'sqrtArc2': { const k = riNot(-4, 4, 0, 1, -1), c = pick([1, 2, 3]); return D.sqrtArc({ q: P(0, -k, 1), arc: pick(['arcsin', 'arccos']), a: qi(1), b: qi(0), c, text, argTex: 'x' }); }
    case 'arcOverProd': {
      const k = ri(-1, 3), A = pick([2, 3]);
      // kořeny jmenovatele uvnitř intervalu ⟨k − 1, k + 1⟩, různé
      const cands = []; for (let n = (k - 1) * A + 1; n < (k + 1) * A; n++) if (n % A) cands.push(n);
      const [n1, n2] = shuffle(cands).slice(0, 2).sort((x, y) => x - y);
      return D.arcOverProd({ arc: pick(['arcsin', 'arccos']), k, f1: P(-n1, A), f2: P(-n2, A), text });
    }
    case 'sqrtX2': { const k = ri(1, 3); return D.sqrtX2({ k, m: k + ri(1, 3), text }); }
    case 'lnQuadOverLin': {
      const [a, b] = r2(), down = Math.random() < 0.5;
      return D.lnQuadOverLin({ q: fromRoots(down ? -1 : 1, a, b), m: down ? ri(a + 1, b - 1 > a ? b - 1 : a + 1) : pick([ri(b + 1, b + 3), ri(a - 3, a - 1)]), text });
    }
    default: {
      const lead = pick([1, 1, 1, 2]), [a, b] = lead === 2 ? [Q(-3, 2), qi(1)] : r2().map(qi);
      const q = lead === 2 ? fromRoots(2, ...[pick([Q(-3, 2), Q(1, 2), Q(-1, 2), Q(3, 2)]), qi(pick([-2, -1, 1, 2]))].sort((x, y) => qv(x) - qv(y))) : fromRoots(1, a, b);
      return D.sqrtQuadOverLin({ q, m: riNot(-6, 6, 0, ...(lead === 2 ? [] : [qv(a), qv(b)])), text });
    }
  }
}

// =====================================================================
// 2. monotonie a lokální extrémy
// =====================================================================
const T2o = 'Najděte intervaly ryzí monotonie a lokální extrémy funkce', T2n = 'Najděte všechny lokální extrémy funkce';
export const EX = {
  /** polynom zadaný koeficienty (od nejnižší mocniny) */
  poly({ f, tex, mono = true, text }) { return extremes({ text: text || (mono ? T2o : T2n), tex: tex || `f(x) = ${ptex(f)}`, f, mono }); },
};
/** náhodný příklad 2 (mono = i intervaly monotonie) */
export function genExtremes(mono = true, text) {
  const t = pick(['cubic', 'cubic', 'x3lin', 'x3lin', 'quartic', 'triple']);
  if (t === 'cubic') {
    // f' = 3a(x − r1)(x − r2), koeficienty celé
    for (;;) {
      const a = pick([1, 2, 4, 4, 2]), r1 = pick([Q(-2), Q(-3), Q(-1, 2), Q(-1, 3), Q(1, 2), Q(1, 3), Q(2), Q(3), Q(-3, 2)]), r2 = pick([Q(-2), Q(1, 2), Q(3), Q(-1, 2), Q(2), Q(1, 3), Q(-1)]);
      if (qv(r1) === qv(r2)) continue;
      const m = 3 * a, b = qdiv(qmul(qi(-m), qadd(r1, r2)), qi(2)), c = qmul(qi(m), qmul(r1, r2));
      if (b.q !== 1 || c.q !== 1) continue;
      const f = P(ri(-12, 12), c, b, a);
      return EX.poly({ f, mono, text });
    }
  }
  if (t === 'x3lin') {
    // x³(p + q x)
    const p = riNot(-10, 10, 0), q = riNot(-5, 5, 0);
    const f = P(0, 0, 0, p, q);
    const qx = (s, first) => `${first ? (s < 0 ? '-' : '') : s < 0 ? ' - ' : ' + '}${Math.abs(s) === 1 ? '' : Math.abs(s)}x`;
    const inner = q > 0 && Math.random() < 0.5 ? `${qx(q, true)} ${sgn(p)}` : `${p}${qx(q, false)}`;
    return EX.poly({ f, mono, text, tex: `f(x) = x^3(${inner})` });
  }
  if (t === 'quartic') {
    // a x⁴ + b x³ + c, f' = x²(4a x + 3b); zápis jako na písemkách: 7x^4 - 4x^3 + 5 nebo 6x^3 - 4x^4 + 7
    const a = riNot(-7, 7, 0), b = riNot(-6, 6, 0), c = ri(0, 9);
    const f = P(c, 0, 0, b, a);
    const mono4 = (k, d, first) => `${first ? (k < 0 ? '-' : '') : k < 0 ? ' - ' : ' + '}${Math.abs(k) === 1 ? '' : Math.abs(k)}x^${d}`;
    const swap = Math.random() < 0.4;
    return EX.poly({ f, mono, text, tex: `f(x) = ${swap ? mono4(b, 3, true) + mono4(a, 4, false) : mono4(a, 4, true) + mono4(b, 3, false)}${c ? ` + ${c}` : ''}` });
  }
  // f' = 12 t x (x + p)²  →  f = 3t x⁴ + 8 p t x³ + 6 p² t x² + c
  const tt = pick([1, -1]), p = riNot(-3, 3, 0), c = ri(0, 9);
  const f = P(c, 0, 6 * p * p * tt, 8 * p * tt, 3 * tt);
  return EX.poly({ f, mono, text });
}

// =====================================================================
// 3. limity (šablony)
// =====================================================================
const LIM0 = 'x\\to 0';
const lim0 = body => `\\lim_{${LIM0}} ${body}`;
const SIN = R`$\lim\limits_{u\to 0}\frac{\sin u}{u} = 1$`, EXP = R`$\lim\limits_{u\to 0}\frac{\mathrm{e}^{u} - 1}{u} = 1$`, LN = R`$\lim\limits_{u\to 0}\frac{\ln(1 + u)}{u} = 1$`, COS = R`$\lim\limits_{u\to 0}\frac{1 - \cos u}{u^2} = \frac{1}{2}$`;
const ax = (a, v = 'x') => (a === 1 ? v : a === -1 ? `-${v}` : `${a}${v}`);
const e = a => `\\mathrm{e}^{${ax(a)}}`;
export const L = {
  /** (px + q)·sin(ax)/(e^{bx} − 1) → q·a/b */
  prodSinExp({ p, q, a, b, tex }) {
    const ans = Q(q * a, b);
    return limit({ tex: tex || lim0(`\\frac{(${linTex(p, q)})\\sin ${ax(a)}}{${e(b)} - 1}`), ans, x0: 0, fstr: `(${p}x+(${q}))*sin(${a}x)/(e^(${b}x)-1)`,
      steps: [`Typ $\\frac{0}{0}$. Rozděl na součin standardních limit (${SIN}, ${EXP}):`,
        `$(${linTex(p, q)})\\cdot\\frac{\\sin ${ax(a)}}{${ax(a)}}\\cdot\\frac{${ax(b)}}{${e(b)} - 1}\\cdot\\frac{${ax(a)}}{${ax(b)}}$`,
        `$\\to ${q}\\cdot 1\\cdot 1\\cdot\\frac{${a}}{${b}} = ${qtex(ans)}$`] });
  },
  /** (1 − e^{ax})/(x cos(bx)) → −a */
  expXcos({ a, b, tex }) {
    const ans = qi(-a);
    return limit({ tex: tex || lim0(`\\frac{1 - ${e(a)}}{x\\cos(${ax(b)})}`), ans, x0: 0, fstr: `(1-e^(${a}x))/(x*cos(${b}x))`,
      steps: [`Typ $\\frac{0}{0}$. $\\cos(${ax(b)}) \\to 1$, takže stačí $\\frac{1 - ${e(a)}}{x}$.`,
        `$\\frac{1 - ${e(a)}}{x} = -${a === 1 ? '' : a}\\cdot\\frac{${e(a)} - 1}{${ax(a)}} \\to -${a === 1 ? '1' : a}$ (${EXP})`, `Výsledek $${-a}$.`] });
  },
  /** e^{cx}·T1(ax)/T2(bx), T1 ≠ T2 ∈ {sin, tg} → a/b */
  trigQuot({ c, a, b, top = 'tg', tex }) {
    const ans = Q(a, b), bot = top === 'tg' ? 'sin' : 'tg';
    const fn = n => (n === 'tg' ? '\\operatorname{tg}' : '\\sin');
    return limit({ tex: tex || lim0(`\\frac{${e(c)}${fn(top)} ${ax(a)}}{${fn(bot)} ${ax(b)}}`), ans, x0: 0, fstr: `e^(${c}x)*${top}(${a}x)/${bot}(${b}x)`,
      steps: [`$${e(c)} \\to 1$. Zbytek je typ $\\frac{0}{0}$: $\\frac{${fn(top)} ${ax(a)}}{${fn(bot)} ${ax(b)}} = \\frac{${fn(top)} ${ax(a)}}{${ax(a)}}\\cdot\\frac{${ax(b)}}{${fn(bot)} ${ax(b)}}\\cdot\\frac{${a}}{${b}}$`,
        `Obě standardní limity jsou $1$ (${SIN}, stejně $\\frac{\\operatorname{tg} u}{u} \\to 1$), výsledek $${qtex(ans)}$.`] });
  },
  /** (e^{ax} − ax − 1)/(x³ + cx²) → a²/(2c), nebo převrácené znaménko čitatele (ax + 1 − e^{ax})/(x³ − cx²) */
  second({ a, c, flip = false, tex }) {
    const ans = Q(a * a, 2 * c);
    const numT = flip ? `${ax(a)} + 1 - ${e(a)}` : `${e(a)} - ${ax(a)} - 1`, denT = flip ? `x^3 - ${c}x^2` : `x^3 + ${c}x^2`;
    return limit({ tex: tex || lim0(`\\frac{${numT}}{${denT}}`), ans, x0: 0, fstr: flip ? `(${a}x+1-e^(${a}x))/(x^3-${c}x^2)` : `(e^(${a}x)-${a}x-1)/(x^3+${c}x^2)`,
      steps: [`Typ $\\frac{0}{0}$. L'Hospital dvakrát (nebo Taylor $\\mathrm{e}^{u} = 1 + u + \\frac{u^2}{2} + \\dots$).`,
        `Čitatel: $${numT} = ${flip ? '-' : ''}\\frac{${a * a}}{2}x^2 + \\dots$, jmenovatel: $x^2(x ${flip ? '-' : '+'} ${c}) \\approx ${flip ? '-' : ''}${c}x^2$.`,
        `$\\frac{${flip ? '-' : ''}\\frac{${a * a}}{2}x^2}{${flip ? '-' : ''}${c}x^2} = ${qtex(ans)}$`] });
  },
  /** at 1/k: ±(kx − 1 − ln(kx))/(k²x² − 2kx + 1) → ±1/2 */
  lnSq({ k, sign = 1, tex }) {
    const ans = Q(sign, 2), x0 = Q(1, k);
    const numT = sign > 0 ? `${k}x - 1 - \\ln(${k}x)` : `1 - ${k}x + \\ln(${k}x)`;
    return limit({ tex: tex || `\\lim_{x\\to ${qtex(x0)}} \\frac{${numT}}{${k * k}x^2 - ${2 * k}x + 1}`, ans, x0: 1 / k,
      fstr: sign > 0 ? `(${k}x-1-ln(${k}x))/(${k * k}x^2-${2 * k}x+1)` : `(1-${k}x+ln(${k}x))/(${k * k}x^2-${2 * k}x+1)`,
      steps: [`Typ $\\frac{0}{0}$ (dosaď $x = ${qtex(x0)}$). Jmenovatel je $(${k}x - 1)^2$.`,
        `L'Hospital: $\\frac{${sign > 0 ? `${k} - \\frac{1}{x}` : `-${k} + \\frac{1}{x}`}}{${2 * k * k}x - ${2 * k}}$, pořád $\\frac{0}{0}$.`,
        `Ještě jednou: $\\frac{${sign > 0 ? '' : '-'}\\frac{1}{x^2}}{${2 * k * k}} \\to \\frac{${sign > 0 ? '' : '-'}${k * k}}{${2 * k * k}} = ${qtex(ans)}$`] });
  },
  /** (cos(ax) − ln(1 + bx) − 1)/sin(cx) → −b/c */
  cosLnSin({ a, b, c, tex }) {
    const ans = Q(-b, c);
    return limit({ tex: tex || lim0(`\\frac{\\cos(${ax(a)}) - \\ln(1 + ${ax(b)}) - 1}{\\sin ${ax(c)}}`), ans, x0: 0, fstr: `(cos(${a}x)-ln(1+${b}x)-1)/sin(${c}x)`,
      steps: [`Typ $\\frac{0}{0}$. L'Hospital: $\\frac{-${a}\\sin(${ax(a)}) - \\frac{${b}}{1 + ${ax(b)}}}{${c === 1 ? '' : c}\\cos ${ax(c)}}$`,
        `Dosaď $x = 0$: ${c === 1 ? `$0 - ${b} = ${qtex(ans)}$` : `$\\frac{0 - ${b}}{${c}} = ${qtex(ans)}$`}`] });
  },
  /** at 1: (cos(ax − a) − x)/ln(bx − (b − 1)) → −1/b */
  shiftCosLn({ a, b, tex }) {
    const ans = Q(-1, b);
    return limit({ tex: tex || `\\lim_{x\\to 1} \\frac{\\cos(${a}x - ${a}) - x}{\\ln(${b}x - ${b - 1})}`, ans, x0: 1, fstr: `(cos(${a}x-${a})-x)/ln(${b}x-${b - 1})`,
      steps: ['Typ $\\frac{0}{0}$ ($\\cos 0 - 1 = 0$, $\\ln 1 = 0$). L\'Hospital:', `$\\frac{-${a}\\sin(${a}x - ${a}) - 1}{\\frac{${b}}{${b}x - ${b - 1}}}$`, `Dosaď $x = 1$: $\\frac{0 - 1}{${b}} = ${qtex(ans)}$`] });
  },
  /** (x + sin(ax))/ln(1 + bx) → (1 + a)/b, flip: převrácená */
  xSinLn({ a, b, flip = false, tex }) {
    const ans = flip ? Q(b, 1 + a) : Q(1 + a, b);
    const top = `x + \\sin ${ax(a)}`, bot = `\\ln(1 + ${ax(b)})`;
    return limit({ tex: tex || lim0(flip ? `\\frac{${bot}}{${top}}` : `\\frac{${top}}{${bot}}`), ans, x0: 0, fstr: flip ? `ln(1+${b}x)/(x+sin(${a}x))` : `(x+sin(${a}x))/ln(1+${b}x)`,
      steps: [`Typ $\\frac{0}{0}$. Vyděl čitatel i jmenovatel $x$: $\\frac{x + \\sin ${ax(a)}}{x} = 1 + ${a}\\cdot\\frac{\\sin ${ax(a)}}{${ax(a)}} \\to ${1 + a}$ a $\\frac{\\ln(1 + ${ax(b)})}{x} = ${b}\\cdot\\frac{\\ln(1 + ${ax(b)})}{${ax(b)}} \\to ${b}$ (${SIN}, ${LN}).`,
        `Výsledek $${flip ? `\\frac{${b}}{${1 + a}}` : `\\frac{${1 + a}}{${b}}`} = ${qtex(ans)}$ (L'Hospital dá totéž).`] });
  },
  /** (1 + bx − cos(cx))/(e^{dx} − 1) → b/d, flip: převrácená */
  oneCos({ b, c, d, flip = false, tex }) {
    const ans = flip ? Q(d, b) : Q(b, d);
    const top = `1 + ${ax(b)} - \\cos ${ax(c)}`, bot = `${e(d)} - 1`;
    return limit({ tex: tex || lim0(flip ? `\\frac{${bot}}{${top}}` : `\\frac{${top}}{${bot}}`), ans, x0: 0, fstr: flip ? `(e^(${d}x)-1)/(1+${b}x-cos(${c}x))` : `(1+${b}x-cos(${c}x))/(e^(${d}x)-1)`,
      steps: [`Typ $\\frac{0}{0}$. L'Hospital: $\\frac{${flip ? `${d}${e(d)}` : `${b} + ${c}\\sin ${ax(c)}`}}{${flip ? `${b} + ${c}\\sin ${ax(c)}` : `${d}${e(d)}`}}$`,
        `Dosaď $x = 0$: $${qtex(ans)}$ (člen $1 - \\cos ${ax(c)}$ se chová jako $x^2$, proti $${ax(b)}$ je zanedbatelný).`] });
  },
  /** at 1: ln(ax − (a − 1))/(x^k − 1) → a/k */
  lnPow({ a, k, tex }) {
    const ans = Q(a, k);
    return limit({ tex: tex || `\\lim_{x\\to 1} \\frac{\\ln(${a}x - ${a - 1})}{x^${k} - 1}`, ans, x0: 1, fstr: `ln(${a}x-${a - 1})/(x^${k}-1)`,
      steps: ['Typ $\\frac{0}{0}$. L\'Hospital:', `$\\frac{\\frac{${a}}{${a}x - ${a - 1}}}{${k}${k - 1 === 1 ? 'x' : `x^{${k - 1}}`}}$`, `Dosaď $x = 1$: $\\frac{${a}}{${k}} = ${qtex(ans)}$`] });
  },
  /** at −c: sin(x² − c²)/(x³ + c³) → −2/(3c) */
  sinFact({ c, tex }) {
    const ans = Q(-2, 3 * c);
    return limit({ tex: tex || `\\lim_{x\\to ${-c}} \\frac{\\sin(x^2 - ${c * c === 1 ? 1 : c * c})}{x^3 + ${c ** 3}}`, ans, x0: -c, fstr: `sin(x^2-${c * c})/(x^3+${c ** 3})`,
      steps: [`Typ $\\frac{0}{0}$. $\\frac{\\sin(x^2 - ${c * c})}{x^2 - ${c * c}} \\to 1$ (${SIN}), zbude $\\frac{x^2 - ${c * c}}{x^3 + ${c ** 3}}$.`,
        `Rozlož: $\\frac{(x - ${c})(x + ${c})}{(x + ${c})(x^2 - ${ax(c)} + ${c * c})} = \\frac{x - ${c}}{x^2 - ${ax(c)} + ${c * c}} \\to \\frac{${-2 * c}}{${3 * c * c}} = ${qtex(ans)}$`] });
  },
};
/** náhodný příklad 3 */
export function genLimit() {
  const t = pick(Object.keys(L));
  const nz = () => riNot(-3, 4, 0);
  switch (t) {
    case 'prodSinExp': return L.prodSinExp({ p: riNot(-3, 3, 0), q: riNot(-6, 6, 0), a: pick([1, 1, 2, 3]), b: pick([2, 3, 4, 5]) });
    case 'expXcos': return L.expXcos({ a: ri(2, 5), b: ri(2, 7) });
    case 'trigQuot': { const a = pick([1, 1, 2]), b = pick([3, 4, 5, 2].filter(x => x !== a)); return L.trigQuot({ c: ri(2, 6), a, b, top: pick(['tg', 'sin']) }); }
    case 'second': return L.second({ a: ri(2, 4), c: ri(2, 4), flip: Math.random() < 0.5 });
    case 'lnSq': return L.lnSq({ k: ri(2, 4), sign: pick([1, -1]) });
    case 'cosLnSin': return L.cosLnSin({ a: ri(2, 5), b: ri(2, 6), c: pick([1, 1, 2, 3]) });
    case 'shiftCosLn': return L.shiftCosLn({ a: ri(2, 5), b: ri(2, 4) });
    case 'xSinLn': return L.xSinLn({ a: ri(2, 5), b: ri(2, 6), flip: Math.random() < 0.5 });
    case 'oneCos': return L.oneCos({ b: ri(2, 5), c: ri(3, 8), d: ri(2, 6), flip: Math.random() < 0.5 });
    case 'lnPow': return L.lnPow({ a: ri(2, 5), k: ri(2, 4) });
    default: return L.sinFact({ c: pick([1, 1, 2]) });
  }
}

// =====================================================================
// 4. Taylorův polynom 2. řádu
// =====================================================================
const xs = x0 => (qv(x0) === 0 ? 'x' : `x ${qv(x0) < 0 ? '+' : '-'} ${qtex(Q(Math.abs(x0.p), x0.q))}`);
const TT = (f, x0Tex) => `f(x) = ${f}, \\quad x_0 = ${x0Tex}`;
const pw = (r, v = 'x') => (r.q === 1 ? (r.p === 1 ? v : `${v}^{${r.p}}`) : `${v}^{${qtex(r)}}`);
export const TY = {
  /** 1/(ax + b) */
  recLin({ a, b, x0, tex }) {
    const L1 = linTex(a, b);
    return taylor({ tex: tex || TT(`\\frac{1}{${L1}}`, qtex(x0)), f: `1/(${a}x+(${b}))`, x0: qtxt(x0), x0Tex: qtex(x0), shift: xs(x0),
      d1Tex: `-\\frac{${a}}{(${L1})^2}`, d2Tex: `\\frac{${2 * a * a}}{(${L1})^3}` });
  },
  /** √(ax + b) */
  sqrtLin({ a, b, x0, tex }) {
    const L1 = linTex(a, b);
    return taylor({ tex: tex || TT(`\\sqrt{${L1}}`, qtex(x0)), f: `sqrt(${a}x+(${b}))`, x0: qtxt(x0), x0Tex: qtex(x0), shift: xs(x0),
      d1Tex: `\\frac{${a}}{2\\sqrt{${L1}}}`, d2Tex: `-\\frac{${a * a}}{4\\sqrt{(${L1})^3}}` });
  },
  /** x/(x + b) */
  xOverLin({ b, x0, tex }) {
    const L1 = linTex(1, b);
    return taylor({ tex: tex || TT(`\\frac{x}{${L1}}`, qtex(x0)), f: `x/(x+(${b}))`, x0: qtxt(x0), x0Tex: qtex(x0), shift: xs(x0),
      d1Tex: `\\frac{${b}}{(${L1})^2}`, d2Tex: `-\\frac{${2 * b}}{(${L1})^3}` });
  },
  /** x^r (zápis: odmocnina nebo zlomek) */
  power({ r, fTex, x0 = qi(1), tex }) {
    const r1 = qsub(r, qi(1)), r2 = qsub(r, qi(2)), c2 = qmul(r, r1);
    return taylor({ tex: tex || TT(fTex, qtex(x0)), f: `x^(${qtxt(r)})`, x0: qtxt(x0), x0Tex: qtex(x0), shift: xs(x0),
      d1Tex: `${coefTex(r)}${pw(r1)}`, d2Tex: `${coefTex(c2)}${pw(r2)}` });
  },
  /** A sin x + B cos x, x0 ∈ {0, π/2, π} */
  trig({ A, B, x0, tex }) {
    const x0t = { 0: '0', 1: '\\frac{\\pi}{2}', 2: '\\pi' }[x0], x0s = { 0: '0', 1: 'pi/2', 2: 'pi' }[x0], sh = { 0: 'x', 1: 'x - \\frac{\\pi}{2}', 2: 'x - \\pi' }[x0];
    const fT = `${A === 1 ? '' : A === -1 ? '-' : A}\\sin x ${B < 0 ? '-' : '+'} ${Math.abs(B) === 1 ? '' : Math.abs(B)}\\cos x`;
    return taylor({ tex: tex || TT(fT, x0t), f: `${A}*sin(x) + (${B})*cos(x)`, x0: x0s, x0Tex: x0t, shift: sh,
      d1Tex: `${A === 1 ? '' : A === -1 ? '-' : A}\\cos x ${B > 0 ? '-' : '+'} ${Math.abs(B) === 1 ? '' : Math.abs(B)}\\sin x`, d2Tex: `${-A === 1 ? '' : -A === -1 ? '-' : -A}\\sin x ${-B < 0 ? '-' : '+'} ${Math.abs(B) === 1 ? '' : Math.abs(B)}\\cos x` });
  },
  /** A e^x + B sin x nebo + B cos x, x0 = 0 */
  expTrig({ A, B, g = 'sin', tex }) {
    const Ae = `${A === 1 ? '' : A === -1 ? '-' : A}\\mathrm{e}^{x}`, Bt = (k, fn) => `${k < 0 ? '-' : '+'} ${Math.abs(k) === 1 ? '' : Math.abs(k)}\\${fn} x`;
    const d1 = g === 'sin' ? `${Ae} ${Bt(B, 'cos')}` : `${Ae} ${Bt(-B, 'sin')}`, d2 = g === 'sin' ? `${Ae} ${Bt(-B, 'sin')}` : `${Ae} ${Bt(-B, 'cos')}`;
    return taylor({ tex: tex || TT(`${Ae} ${Bt(B, g)}`, '0'), f: `${A}*e^x + (${B})*${g}(x)`, x0: '0', x0Tex: '0', shift: 'x', d1Tex: d1, d2Tex: d2 });
  },
  /** e^{x² + x} v bodě 1 (praktická část) */
  expQuad({ tex }) {
    return taylor({ tex, f: 'e^(x^2+x)', x0: '1', x0Tex: '1', shift: 'x - 1', d1Tex: '(2x + 1)\\mathrm{e}^{x^2 + x}', d2Tex: '\\left(2 + (2x + 1)^2\\right)\\mathrm{e}^{x^2 + x}' });
  },
};
const POWERS = [[Q(1, 3), '\\sqrt[3]{x}'], [Q(1, 2), '\\sqrt{x}'], [Q(-3), '\\frac{1}{x^3}'], [Q(-2), '\\frac{1}{x^2}'], [Q(-1, 3), '\\frac{1}{\\sqrt[3]{x}}'], [Q(-1, 2), '\\frac{1}{\\sqrt{x}}'], [Q(2, 3), '\\sqrt[3]{x^2}']];
export function genTaylor() {
  const t = pick(['recLin', 'recLin', 'sqrtLin', 'sqrtLin', 'xOverLin', 'power', 'power', 'trig', 'expTrig']);
  switch (t) {
    case 'recLin': { const a = riNot(-5, 5, 0, 1, -1), x0 = qi(ri(-2, 2)), b = pick([1, -1]) - a * qv(x0); return TY.recLin({ a, b, x0 }); }
    case 'sqrtLin': {
      const v = pick([1, 4]), a = pick([2, 3, 4, 5]);
      const x0 = v === 1 ? qi(0) : pick([qi(1), Q(1, a), Q(1, 2)]), b = qsub(qi(v), qmul(qi(a), x0));
      if (b.q !== 1 || b.p <= 0 && v === 1) return TY.sqrtLin({ a, b: 1, x0: qi(0) });
      return TY.sqrtLin({ a, b: b.p, x0 });
    }
    case 'xOverLin': { const b = pick([1, -1, 2, -2]), x0 = qi(b > 0 ? pick([0, 1]) : -b + pick([1, -1, 2]) * 1); if (qv(x0) + b === 0) return TY.xOverLin({ b, x0: qi(0) }); return TY.xOverLin({ b, x0 }); }
    case 'power': { const [r, fTex] = pick(POWERS); return TY.power({ r, fTex }); }
    case 'trig': return TY.trig({ A: riNot(-4, 4, 0), B: riNot(-4, 4, 0), x0: pick([0, 1, 2]) });
    default: return TY.expTrig({ A: riNot(-3, 3, 0), B: riNot(-6, 6, 0), g: pick(['sin', 'cos']) });
  }
}

// =====================================================================
// 5. neurčitý integrál substitucí
// =====================================================================
const dx = '\\,\\mathrm{d}x';
const xn = n => (n === 1 ? 'x' : `x^${n}`);
const xnTxt = n => `x^${n}`;
/** výsledek k·G(…) jako TeX */
const kTex = (k, body) => (k.p === 1 && k.q === 1 ? body : k.p === -1 && k.q === 1 ? `-${body}` : k.q === 1 ? `${k.p}${body}` : `${k.p < 0 ? '-' : ''}\\frac{${Math.abs(k.p)}}{${k.q}}${body}`);
export const IN = {
  /** c·x^{n−1}·g(a xⁿ + b), g ∈ {sin, cos} */
  powTrig({ c = 1, n, a, b, g, tex }) {
    const inner = `${a === 1 ? '' : a}x^${n} ${sgn(b)}`, innerTxt = `${a}x^${n}+(${b})`;
    const k = Q(c, n * a), G = g === 'cos' ? 'sin' : '-cos';
    const kk = g === 'cos' ? k : qneg(k);
    return indefinite({ tex: tex || `\\int ${c === 1 ? '' : c}${xn(n - 1)}\\${g}(${inner})${dx}`, f: `${c}*${xnTxt(n - 1)}*${g}(${innerTxt})`, F: `(${qtxt(kk)})*${G.replace('-', '')}(${innerTxt})`,
      FTex: kTex(kk, `\\${G.replace('-', '')}(${inner})`),
      steps: [`Substituce $t = ${inner}$, $\\mathrm{d}t = ${n * a}${xn(n - 1)}${dx}$, tedy $${xn(n - 1)}${dx} = \\frac{\\mathrm{d}t}{${n * a}}$.`,
        `$\\int ${c === 1 ? '' : c}\\cdot\\frac{1}{${n * a}}\\${g} t\\,\\mathrm{d}t = ${kTex(kk, `\\${G.replace('-', '')} t`)}$`, `Zpátky: $${kTex(kk, `\\${G.replace('-', '')}(${inner})`)} + C$`] });
  },
  /** p'(x)·sin/cos/exp(p(x)) s celým polynomem p */
  polyDer({ p, g, tex }) {
    const dp = p.slice(1).map((c, k) => qmul(c, qi(k + 1)));
    const pT = ptex(p), dT = ptex(dp), pTx = polyTxt(p), dTx = polyTxt(dp);
    const body = g === 'exp' ? `\\mathrm{e}^{(${pT})}` : `\\${g}(${pT})`;
    const F = g === 'exp' ? `e^(${pTx})` : g === 'sin' ? `-cos(${pTx})` : `sin(${pTx})`;
    const FTex = g === 'exp' ? `\\mathrm{e}^{${pT}}` : g === 'sin' ? `-\\cos(${pT})` : `\\sin(${pT})`;
    return indefinite({ tex: tex || `\\int (${dT})${body}${dx}`, f: `(${dTx})*${g === 'exp' ? `e^(${pTx})` : `${g}(${pTx})`}`, F, FTex,
      steps: [`Vedle funkce stojí přesně derivace jejího vnitřku: $(${pT})' = ${dT}$.`, `Substituce $t = ${pT}$, $\\mathrm{d}t = (${dT})${dx}$: $\\int ${g === 'exp' ? '\\mathrm{e}^{t}' : `\\${g} t`}\\,\\mathrm{d}t = ${g === 'exp' ? '\\mathrm{e}^{t}' : g === 'sin' ? '-\\cos t' : '\\sin t'}$`, `$${FTex} + C$`] });
  },
  /** c·x^{n−1}·e^{b + a xⁿ} */
  powExp({ c = 1, n, a, b, tex }) {
    const inner = b ? `${b} ${a < 0 ? '-' : '+'} ${Math.abs(a) === 1 ? '' : Math.abs(a)}x^${n}` : `${ax(a)}^${n}`;
    const innerTxt = `${b}+(${a})*x^${n}`, k = Q(c, n * a);
    return indefinite({ tex: tex || `\\int ${c === 1 ? '' : c}${xn(n - 1)}\\mathrm{e}^{(${inner})}${dx}`, f: `${c}*x^${n - 1}*e^(${innerTxt})`, F: `(${qtxt(k)})*e^(${innerTxt})`, FTex: kTex(k, `\\mathrm{e}^{${inner}}`),
      steps: [`Substituce $t = ${inner}$, $\\mathrm{d}t = ${n * a}${xn(n - 1)}${dx}$.`, `$\\int ${xn(n - 1)}\\mathrm{e}^{t}${dx} = \\frac{1}{${n * a}}\\int \\mathrm{e}^{t}\\,\\mathrm{d}t = ${kTex(Q(1, n * a), '\\mathrm{e}^{t}')}$`, `$${kTex(k, `\\mathrm{e}^{${inner}}`)} + C$`] });
  },
  /** p'/pᵏ (p kvadratický) */
  ratPow({ p, k, tex }) {
    const dp = p.slice(1).map((c, i) => qmul(c, qi(i + 1)));
    const pT = ptex(p), dT = ptex(dp), pTx = polyTxt(p), m = k - 1, kk = Q(-1, m);
    const FTex = `-\\frac{1}{${m === 1 ? '' : m}(${pT})^{${m}}}`.replace('^{1}', '');
    return indefinite({ tex: tex || `\\int \\frac{${dT}}{(${pT})^${k}}${dx}`, f: `(${polyTxt(dp)})/(${pTx})^${k}`, F: `(${qtxt(kk)})/(${pTx})^${m}`, FTex,
      steps: [`Čitatel je derivace závorky: $(${pT})' = ${dT}$. Substituce $t = ${pT}$.`, `$\\int \\frac{\\mathrm{d}t}{t^{${k}}} = \\int t^{-${k}}\\,\\mathrm{d}t = \\frac{t^{-${m}}}{-${m}} = -\\frac{1}{${m === 1 ? '' : m}t^{${m}}}$`.replace('t^{1}', 't'), `$${FTex} + C$`] });
  },
  /** 2x/sin²(x²) nebo 2x/cos²(x²) (obecně c·x^{n−1}/g²(xⁿ)) */
  trigSq({ g, n = 2, c = 2, tex }) {
    const k = Q(c, n), F = g === 'sin' ? `-(${qtxt(k)})*cotg(x^${n})` : `(${qtxt(k)})*tg(x^${n})`;
    const FTex = g === 'sin' ? `-${kTex(k, `\\operatorname{cotg}(x^${n})`)}` : kTex(k, `\\operatorname{tg}(x^${n})`);
    return indefinite({ tex: tex || `\\int \\frac{${c === 1 ? '' : c}${xn(n - 1)}}{\\${g}^2(x^${n})}${dx}`, f: `${c}*x^${n - 1}/${g}(x^${n})^2`, F, FTex: FTex.replace('--', ''),
      steps: [`Substituce $t = x^${n}$, $\\mathrm{d}t = ${n}${xn(n - 1)}${dx}$.`, `$\\int \\frac{${qtex(k)}}{\\${g}^2 t}\\,\\mathrm{d}t = ${g === 'sin' ? `-${qtex(k)}\\operatorname{cotg} t` : `${qtex(k)}\\operatorname{tg} t`}$ (tabulka: $\\int \\frac{1}{\\${g}^2 t} = ${g === 'sin' ? '-\\operatorname{cotg} t' : '\\operatorname{tg} t'}$)`.replace(/(^|[^\w])1\\operatorname/g, '$1\\operatorname'), `$${FTex.replace('--', '')} + C$`] });
  },
  /** x^{n−1}(c + d xⁿ)^m */
  powPow({ n, c, d, m, tex }) {
    const inner = Math.random() < 2 && c !== 0 && d < 0 ? `${c} - ${Math.abs(d) === 1 ? '' : Math.abs(d)}x^${n}` : `${d === 1 ? '' : d}x^${n} ${sgn(c)}`;
    const innerTxt = `${c}+(${d})*x^${n}`, k = Q(1, n * d * (m + 1));
    return indefinite({ tex: tex || `\\int ${xn(n - 1)}(${inner})^{${m}}${dx}`, f: `x^${n - 1}*(${innerTxt})^${m}`, F: `(${qtxt(k)})*(${innerTxt})^${m + 1}`, FTex: kTex(k, `(${inner})^{${m + 1}}`),
      steps: [`Substituce $t = ${inner}$, $\\mathrm{d}t = ${n * d}${xn(n - 1)}${dx}$.`, `$\\frac{1}{${n * d}}\\int t^{${m}}\\,\\mathrm{d}t = \\frac{1}{${n * d}}\\cdot\\frac{t^{${m + 1}}}{${m + 1}}$`, `$${kTex(k, `(${inner})^{${m + 1}}`)} + C$`] });
  },
};
export function genIndefinite() {
  const t = pick(['powTrig', 'powTrig', 'powTrig', 'polyDer', 'polyDer', 'powExp', 'ratPow', 'trigSq', 'powPow']);
  switch (t) {
    case 'powTrig': { const n = ri(2, 5); return IN.powTrig({ n, a: pick([1, 1, 2, 3]), b: riNot(-7, 7, 0), g: pick(['sin', 'cos']) }); }
    case 'polyDer': {
      const deg = pick([2, 3, 4]), p = [qi(riNot(-3, 3, 0)), qi(pick([0, 1, -1, 2])), qi(deg >= 3 ? 0 : pick([1, 2, 3])), qi(deg >= 3 ? pick([1, 2]) : 0), qi(deg === 4 ? pick([1, 2]) : 0)].slice(0, deg + 1);
      while (p.length > 1 && qv(p[p.length - 1]) === 0) p.pop();
      return IN.polyDer({ p, g: pick(['sin', 'cos', 'exp']) });
    }
    case 'powExp': return IN.powExp({ n: ri(2, 4), a: riNot(-3, 3, 0), b: ri(-2, 3) });
    case 'ratPow': { const r1 = ri(1, 4), r2 = ri(1, 6); return IN.ratPow({ p: P(r2 + 1, r1, 1), k: ri(2, 4) }); }
    case 'trigSq': return IN.trigSq({ g: pick(['sin', 'cos']) });
    default: return IN.powPow({ n: ri(2, 6), c: pick([1, 2, 3, -1]), d: pick([1, -1, 2]), m: ri(5, 30) });
  }
}

// =====================================================================
// 6. určitý integrál
// =====================================================================
/** integrand Σ cᵢ x^{eᵢ}, zadání jako zlomek */
export const DI = {
  frac({ num, den, a, b, tex, numTex, denTex }) {
    // num: [[c, e]], den: exponent (racionální)
    const terms = num.map(([c, e]) => [qi(c), qsub(qq(e), qq(den))]);
    return definite({ tex: tex || `\\int\\limits_{${a}}^{${b}} \\frac{${numTex}}{${denTex}}${dx}`, terms, a, b });
  },
};
const qq = x => (typeof x === 'number' ? qi(x) : x);
export function genDefinite() {
  const t = pick(['polyOverX', 'polyOverX', 'polyOverX2', 'polyOverX3', 'sqrt', 'cbrt']);
  if (t === 'sqrt') {
    // (c + √x)/√x nebo (x^k + √x)/x
    const b = pick([4, 9]);
    if (Math.random() < 0.5) { const c = ri(1, 4); return DI.frac({ num: [[c, 0], [1, Q(1, 2)]], den: Q(1, 2), a: 1, b, numTex: `${c} + \\sqrt{x}`, denTex: '\\sqrt{x}' }); }
    const k = pick([1, 2]); return DI.frac({ num: [[1, k], [1, Q(1, 2)]], den: 1, a: 1, b, numTex: `${xn(k)} + \\sqrt{x}`, denTex: 'x' });
  }
  if (t === 'cbrt') { const c = ri(1, 3), d = ri(1, 3); return DI.frac({ num: [[c, 0], [d, Q(1, 3)]], den: Q(2, 3), a: 1, b: 8, numTex: `${c} + ${d === 1 ? '' : d}\\sqrt[3]{x}`, denTex: '\\sqrt[3]{x^2}' }); }
  const k = t === 'polyOverX' ? 1 : t === 'polyOverX2' ? 2 : 3;
  const b = pick([2, 2, 3]);
  // čitatel: 2–3 členy, jeden vždy konstanta (dá ln u x¹, nebo zápornou mocninu)
  const degs = shuffle([k + 1, k + 2, k, k - 1].filter(d => d > 0 && d !== k)).slice(0, pick([1, 2]));
  const termsN = [...degs.map(d => [ri(1, 3), d]), [ri(1, 8), 0]].sort((x, y) => y[1] - x[1]);
  const numTex = termsN.map(([c, d], i) => (d === 0 ? `${i ? ' + ' : ''}${c}` : `${i ? ' + ' : ''}${c === 1 ? '' : c}${xn(d)}`)).join('');
  return DI.frac({ num: termsN, den: k, a: 1, b, numTex, denTex: xn(k) });
}
