// Malý symbolický engine: výrazy v jedné proměnné x.
// parse (text → strom), ev (číselná hodnota), d (derivace), simplify, tex (sazba), equiv (porovnání).

// ---------------------------------------------------------------- konstruktory
export const N = v => ({ t: 'num', v });
export const X = { t: 'x' };
export const E = { t: 'e' };
export const PI = { t: 'pi' };
export const add = (...a) => ({ t: 'add', a });
export const mul = (...a) => ({ t: 'mul', a });
export const div = (n, d) => ({ t: 'div', n, d });
export const pow = (b, e) => ({ t: 'pow', b, e: typeof e === 'number' ? N(e) : e });
export const neg = a => ({ t: 'neg', a });
export const sub = (a, b) => add(a, neg(b));
export const fn = (f, a) => ({ t: 'fn', f, a });
export const root = (n, a) => ({ t: 'root', n, a });
export const exp = a => pow(E, a);
export const ln = a => fn('ln', a);

export const BOX = { t: 'box' };
/** dosadí výraz g místo x */
export function subst(e, g) {
  switch (e.t) {
    case 'x': return g;
    case 'add': case 'mul': return { t: e.t, a: e.a.map(f => subst(f, g)) };
    case 'div': return div(subst(e.n, g), subst(e.d, g));
    case 'pow': return pow(subst(e.b, g), subst(e.e, g));
    case 'neg': case 'fn': case 'root': return { ...e, a: subst(e.a, g) };
  }
  return e;
}
const isNum = e => e.t === 'num';
const hasX = e => e.t === 'x' || (e.t === 'add' || e.t === 'mul') && e.a.some(hasX) || e.t === 'div' && (hasX(e.n) || hasX(e.d))
  || e.t === 'pow' && (hasX(e.b) || hasX(e.e)) || (e.t === 'neg' || e.t === 'fn' || e.t === 'root') && hasX(e.a);
export { hasX };
export const key = e => JSON.stringify(e);

// ---------------------------------------------------------------- vyhodnocení
const F = {
  sin: Math.sin, cos: Math.cos, tg: Math.tan, cotg: a => 1 / Math.tan(a),
  ln: a => (a > 0 ? Math.log(a) : NaN), arcsin: a => (Math.abs(a) <= 1 ? Math.asin(a) : NaN), arccos: a => (Math.abs(a) <= 1 ? Math.acos(a) : NaN),
  arctg: Math.atan, arccotg: a => Math.PI / 2 - Math.atan(a), abs: Math.abs,
};
export function ev(e, x) {
  switch (e.t) {
    case 'num': return e.v;
    case 'x': return x;
    case 'e': return Math.E;
    case 'pi': return Math.PI;
    case 'add': return e.a.reduce((s, t) => s + ev(t, x), 0);
    case 'mul': return e.a.reduce((s, t) => s * ev(t, x), 1);
    case 'div': return ev(e.n, x) / ev(e.d, x);
    case 'neg': return -ev(e.a, x);
    case 'pow': {
      const b = ev(e.b, x), p = ev(e.e, x);
      if (b < 0 && !Number.isInteger(p)) {
        const q = denomOf(p);
        if (q && q % 2 === 1) return (Math.round(p * q) % 2 ? -1 : 1) * Math.pow(-b, p);
        return NaN;
      }
      return Math.pow(b, p);
    }
    case 'fn': return F[e.f](ev(e.a, x));
    case 'root': { const a = ev(e.a, x); return e.n % 2 ? Math.sign(a) * Math.pow(Math.abs(a), 1 / e.n) : a < 0 ? NaN : Math.pow(a, 1 / e.n); }
  }
  return NaN;
}
function denomOf(v) { for (let q = 1; q <= 12; q++) if (Math.abs(v * q - Math.round(v * q)) < 1e-9) return q; return 0; }

// ---------------------------------------------------------------- derivace
export function d(e) {
  switch (e.t) {
    case 'num': case 'e': case 'pi': return N(0);
    case 'x': return N(1);
    case 'add': return add(...e.a.map(d));
    case 'neg': return neg(d(e.a));
    case 'mul': {
      const consts = e.a.filter(f => !hasX(f)), vars = e.a.filter(hasX);
      if (!vars.length) return N(0);
      const terms = vars.map((f, i) => mul(...consts, ...vars.map((g, j) => (i === j ? d(g) : g))));
      return add(...terms);
    }
    case 'div':
      if (!hasX(e.d)) return div(d(e.n), e.d);
      if (!hasX(e.n)) return neg(div(mul(e.n, d(e.d)), pow(e.d, 2)));
      return div(sub(mul(d(e.n), e.d), mul(e.n, d(e.d))), pow(e.d, 2));
    case 'pow': {
      const bx = hasX(e.b), ex = hasX(e.e);
      if (!bx && !ex) return N(0);
      if (!ex) return mul(e.e, pow(e.b, add(e.e, N(-1))), d(e.b));
      if (!bx) return e.b.t === 'e' ? mul(e, d(e.e)) : mul(e, ln(e.b), d(e.e));
      return mul(e, d(mul(e.e, ln(e.b))));
    }
    case 'fn': return mul(outerD(e.f, e.a), d(e.a));
    case 'root': return div(d(e.a), mul(N(e.n), e.n === 2 ? root(2, e.a) : root(e.n, pow(e.a, e.n - 1))));
  }
}
/** derivace vnější funkce vyhodnocená ve vnitřku a */
export function outerD(f, a) {
  switch (f) {
    case 'sin': return fn('cos', a);
    case 'cos': return neg(fn('sin', a));
    case 'tg': return div(N(1), pow(fn('cos', a), 2));
    case 'cotg': return neg(div(N(1), pow(fn('sin', a), 2)));
    case 'ln': return div(N(1), a);
    case 'arcsin': return div(N(1), root(2, sub(N(1), pow(a, 2))));
    case 'arccos': return neg(div(N(1), root(2, sub(N(1), pow(a, 2)))));
    case 'arctg': return div(N(1), add(N(1), pow(a, 2)));
    case 'arccotg': return neg(div(N(1), add(N(1), pow(a, 2))));
    case 'abs': return div(fn('abs', a), a);
  }
}

// ---------------------------------------------------------------- zjednodušení
const num = v => N(Math.abs(v) < 1e-12 ? 0 : v);
export function simplify(e) {
  let prev, cur = e, n = 0;
  do { prev = key(cur); cur = s1(cur); } while (key(cur) !== prev && ++n < 12);
  return cur;
}
function negOf(e) {
  if (isNum(e)) return num(-e.v);
  if (e.t === 'neg') return e.a;
  if (e.t === 'mul' && isNum(e.a[0])) return mul(num(-e.a[0].v), ...e.a.slice(1));
  return neg(e);
}
function s1(e) {
  switch (e.t) {
    case 'neg': {
      const a = s1(e.a);
      if (isNum(a)) return num(-a.v);
      if (a.t === 'neg') return a.a;
      if (a.t === 'div' && a.n.t === 'neg') return div(a.n.a, a.d);
      // −(−3·sin x) → 3·sin x (jinak by se vysázelo „−−3 sin x“)
      if (a.t === 'mul' && isNum(a.a[0]) && a.a[0].v < 0) return s1(mul(num(-a.a[0].v), ...a.a.slice(1)));
      return neg(a);
    }
    case 'add': {
      let terms = [];
      for (const t of e.a.map(s1)) terms.push(...(t.t === 'add' ? t.a : [t]));
      let c = 0;
      terms = terms.filter(t => (isNum(t) ? ((c += t.v), false) : true));
      // sloučení stejných členů: k·A + m·A
      const groups = [];
      for (const t of terms) {
        const [k, rest] = coefSplit(t);
        const g = groups.find(g => key(g.rest) === key(rest));
        if (g) g.k += k; else groups.push({ k, rest });
      }
      terms = groups.filter(g => Math.abs(g.k) > 1e-12).map(g => (g.k === 1 ? g.rest : g.k === -1 ? negOf(g.rest) : s1(mul(N(g.k), g.rest))));
      if (Math.abs(c) > 1e-12) terms.push(num(c));
      if (!terms.length) return N(0);
      return terms.length === 1 ? terms[0] : add(...terms);
    }
    case 'mul': {
      let fs = [];
      for (const f of e.a.map(s1)) fs.push(...(f.t === 'mul' ? f.a : [f]));
      let c = 1;
      const nums = [], dens = [], others = [];
      for (let f of fs) {
        while (f.t === 'neg') { c = -c; f = f.a; }
        if (isNum(f)) c *= f.v;
        else if (f.t === 'div') { nums.push(f.n); dens.push(f.d); }
        else others.push(f);
      }
      if (c === 0) return N(0);
      if (dens.length) {
        const top = s1(mul(N(c), ...others, ...nums));
        return s1(div(top, dens.length === 1 ? dens[0] : mul(...dens)));
      }
      // sloučení mocnin stejného základu
      const bases = [];
      for (const f of others) {
        const [b, p] = f.t === 'pow' ? [f.b, f.e] : f.t === 'root' && !hasX(N(0)) && false ? [f, N(1)] : [f, N(1)];
        const g = bases.find(g => key(g.b) === key(b));
        if (g && isNum(g.p) && isNum(p)) g.p = num(g.p.v + p.v); else bases.push({ b, p });
      }
      let out = bases.filter(g => !(isNum(g.p) && g.p.v === 0)).map(g => (isNum(g.p) && g.p.v === 1 ? g.b : s1(pow(g.b, g.p))));
      out.sort((a, b) => rank(a) - rank(b));
      if (Math.abs(c - 1) > 1e-12) out.unshift(num(c));
      if (!out.length) return N(1);
      if (out.length === 1) return out[0];
      if (isNum(out[0]) && out[0].v === -1) return neg(out.length === 2 ? out[1] : mul(...out.slice(1)));
      return mul(...out);
    }
    case 'div': {
      let n = s1(e.n), dd = s1(e.d);
      if (isNum(n) && n.v === 0) return N(0);
      if (isNum(dd) && dd.v === 1) return n;
      if (isNum(n) && isNum(dd) && Number.isInteger(n.v / dd.v)) return num(n.v / dd.v);
      if (n.t === 'neg') return neg(s1(div(n.a, dd)));
      if (isNum(n) && n.v < 0) return neg(div(num(-n.v), dd));
      if (n.t === 'mul' && isNum(n.a[0]) && n.a[0].v < 0) return neg(s1(div(s1(mul(num(-n.a[0].v), ...n.a.slice(1))), dd)));
      if (dd.t === 'neg') return neg(s1(div(n, dd.a)));
      if (isNum(dd) && dd.v < 0) return neg(s1(div(n, num(-dd.v))));
      if (n.t === 'div') return s1(div(n.n, mul(n.d, dd)));
      if (dd.t === 'div') return s1(div(mul(n, dd.d), dd.n));
      if (key(n) === key(dd)) return N(1);
      // krácení společných činitelů (včetně mocnin stejného základu)
      {
        const fsN = n.t === 'mul' ? [...n.a] : [n], fsD = dd.t === 'mul' ? [...dd.a] : [dd];
        const bp = f => (f.t === 'pow' && isNum(f.e) ? [f.b, f.e.v] : [f, 1]);
        let changed = false;
        for (let a = 0; a < fsN.length; a++) for (let b = 0; b < fsD.length; b++) {
          if (!fsN[a] || !fsD[b] || isNum(fsN[a])) continue;
          const [ba, pa] = bp(fsN[a]), [bb, pb] = bp(fsD[b]);
          if (key(ba) !== key(bb)) continue;
          const r = pa - pb;
          fsN[a] = r > 0 ? (r === 1 ? ba : pow(ba, num(r))) : null;
          fsD[b] = r < 0 ? (r === -1 ? bb : pow(bb, num(-r))) : null;
          changed = true;
        }
        if (changed) {
          const nn = fsN.filter(Boolean), dn = fsD.filter(Boolean);
          const top = nn.length ? (nn.length === 1 ? nn[0] : mul(...nn)) : N(1);
          return dn.length ? s1(div(top, dn.length === 1 ? dn[0] : mul(...dn))) : s1(top);
        }
      }
      // krácení čísel: (6x)/(3y) → 2x/y
      const [kn, rn] = coefSplit(n), [kd, rd] = coefSplit(dd);
      if (kd !== 1 && Number.isInteger(kn / kd)) return s1(div(s1(mul(num(kn / kd), rn)), rd));
      if (isNum(dd) && !isNum(n) && Math.abs(kn) !== 1 && Number.isInteger(kn) && Number.isInteger(kd)) {
        const g = gcd(kn, kd);
        if (g > 1) return s1(div(s1(mul(num(kn / g), rn)), num(kd / g)));
      }
      return div(n, dd);
    }
    case 'pow': {
      const b = s1(e.b), p = s1(e.e);
      if (isNum(p) && p.v === 0) return N(1);
      if (isNum(p) && p.v === 1) return b;
      if (isNum(b) && isNum(p) && Number.isInteger(p.v) && p.v > 0) return num(Math.pow(b.v, p.v));
      if (isNum(b) && b.v === 1) return N(1);
      if (b.t === 'pow' && isNum(b.e) && isNum(p)) return s1(pow(b.b, num(b.e.v * p.v)));
      if (b.t === 'root' && isNum(p) && p.v === b.n) return b.a;
      if (b.t === 'div' && isNum(p) && Number.isInteger(p.v)) return s1(div(pow(b.n, p), pow(b.d, p)));
      return pow(b, p);
    }
    case 'fn': {
      const a = s1(e.a);
      if (e.f === 'ln' && a.t === 'e') return N(1);
      if (e.f === 'ln' && isNum(a) && a.v === 1) return N(0);
      if (e.f === 'ln' && a.t === 'pow' && a.b.t === 'e') return a.e;
      return fn(e.f, a);
    }
    case 'root': {
      const a = s1(e.a);
      if (isNum(a) && a.v === 0) return N(0);
      if (isNum(a) && a.v > 0) { const r = Math.round(Math.pow(a.v, 1 / e.n)); if (Math.pow(r, e.n) === a.v) return N(r); }
      return root(e.n, a);
    }
  }
  return e;
}
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
function coefSplit(t) {
  if (t.t === 'neg') { const [k, r] = coefSplit(t.a); return [-k, r]; }
  if (t.t === 'mul' && isNum(t.a[0])) return [t.a[0].v, t.a.length === 2 ? t.a[1] : mul(...t.a.slice(1))];
  if (isNum(t)) return [t.v, N(1)];
  return [1, t];
}
function rank(f) {
  if (isNum(f)) return 0;
  if (f.t === 'x' || (f.t === 'pow' && f.b.t === 'x')) return 1;
  if (f.t === 'e' || f.t === 'pi') return 1.5;
  if (f.t === 'pow' && hasX(f.e) && f.b.t !== 'e') return 1.8;
  if (f.t === 'add') return 2;
  if (f.t === 'pow' && f.b.t === 'e') return 2.5;
  if (f.t === 'root') return 3;
  if (f.t === 'pow' && f.b.t === 'add') return 3;
  return 4;
}

// ---------------------------------------------------------------- sazba (TeX)
const FN_TEX = { sin: '\\sin', cos: '\\cos', tg: '\\operatorname{tg}', cotg: '\\operatorname{cotg}', ln: '\\ln', arcsin: '\\arcsin', arccos: '\\arccos', arctg: '\\operatorname{arctg}', arccotg: '\\operatorname{arccotg}' };
export function fmtNum(v) {
  if (Number.isInteger(v)) return String(v);
  for (let q = 2; q <= 1000; q++) {
    const p = Math.round(v * q);
    if (Math.abs(p / q - v) < 1e-9) return `${p < 0 ? '-' : ''}\\frac{${Math.abs(p)}}{${q}}`;
  }
  return String(+v.toFixed(4));
}
const P = { add: 1, neg: 1.5, mul: 2, div: 3, pow: 4, fn: 2.5, root: 5, num: 6, x: 6, e: 6, pi: 6, box: 6 };
const par = s => `\\left(${s}\\right)`;
const simpleArg = a => a.t === 'x' || (isNum(a) && a.v >= 0) || a.t === 'pi' || a.t === 'box' || (a.t === 'fn' && a.f === 'abs');

export function tex(e) {
  switch (e.t) {
    case 'num': return fmtNum(e.v);
    case 'x': return 'x';
    case 'e': return '\\mathrm{e}';
    case 'pi': return '\\pi';
    case 'box': return '\\square';
    case 'add': {
      let s = '';
      const isN = t => t.t === 'neg' || (isNum(t) && t.v < 0) || (t.t === 'mul' && isNum(t.a[0]) && t.a[0].v < 0);
      let terms = e.a;
      if (isN(terms[0])) { const k = terms.findIndex(t => !isN(t)); if (k > 0) terms = [terms[k], ...terms.filter((_, j) => j !== k)]; }
      terms.forEach((t, i) => {
        if (i === 0) { s += tex(t); return; }
        const isNeg = t.t === 'neg' || (isNum(t) && t.v < 0) || (t.t === 'mul' && isNum(t.a[0]) && t.a[0].v < 0);
        if (isNeg) { const p = negOf(t); s += ' - ' + (p.t === 'add' ? par(tex(p)) : tex(p)); }
        else s += ' + ' + (t.t === 'add' ? par(tex(t)) : tex(t));
      });
      return s;
    }
    case 'neg': return '-' + (P[e.a.t] <= 1.5 ? par(tex(e.a)) : tex(e.a));
    case 'mul': {
      // záporné mocniny patří do jmenovatele: −2·x^(−1) → −2/x, (8/27)·x^(−7/3) → 8/(27 x^(7/3))
      const dens = e.a.filter(f => f.t === 'pow' && isNum(f.e) && f.e.v < 0);
      if (dens.length) {
        let c = 1; const rest = [];
        for (const f of e.a) { if (isNum(f)) c *= f.v; else if (!dens.includes(f)) rest.push(f); }
        const sign = c < 0 ? '-' : ''; c = Math.abs(c);
        let p = c, q = 1;
        if (!Number.isInteger(c)) for (let k = 2; k <= 1000; k++) { const pp = Math.round(c * k); if (Math.abs(pp / k - c) < 1e-9) { p = pp; q = k; break; } }
        const numF = [...(p !== 1 || !rest.length ? [N(p)] : []), ...rest];
        const denF = [...(q !== 1 ? [N(q)] : []), ...dens.map(f => (Math.abs(f.e.v + 1) < 1e-12 ? f.b : pow(f.b, N(-f.e.v))))];
        const one = fs => (fs.length === 1 ? fs[0] : mul(...fs));
        return `${sign}\\frac{${tex(one(numF))}}{${tex(one(denF))}}`;
      }
      let s = '', prev = null;
      for (const f of e.a) {
        if (prev && isNum(prev) && prev.v === -1 && s === '-1') s = '-';
        let ft = tex(f);
        if (P[f.t] <= 1.5 || (f.t === 'fn' && f !== e.a[e.a.length - 1] && !simpleArg(f.a))) ft = (P[f.t] <= 1.5) ? par(ft) : ft;
        if (prev) {
          const needDot = isNum(f) || (prev.t === 'fn') || (prev.t === 'pow' && prev.b.t === 'fn') || (prev.t === 'div' && f.t === 'div') || (isNum(prev) && f.t === 'div');
          s += needDot ? ' \\cdot ' : ' ';
        }
        s += ft;
        prev = f;
      }
      return s.replace(/^-1 (?!\\cdot)/, '-');
    }
    case 'div': return `\\frac{${tex(e.n)}}{${tex(e.d)}}`;
    case 'pow': {
      const b = e.b, p = e.e;
      if (b.t === 'e') return `\\mathrm{e}^{${tex(p)}}`;
      if (isNum(p) && p.v < 0) return `\\frac{1}{${Math.abs(p.v + 1) < 1e-12 ? tex(b) : tex(pow(b, num(-p.v)))}}`;
      if (isNum(p) && Math.abs(p.v - 0.5) < 1e-12) return `\\sqrt{${tex(b)}}`;
      if (b.t === 'fn' && isNum(p) && Number.isInteger(p.v) && p.v > 1) {
        const a = b.a;
        return `${FN_TEX[b.f]}^{${p.v}}${simpleArg(a) ? ' ' + tex(a) : par(tex(a))}`;
      }
      const bt = (P[b.t] < 6) ? par(tex(b)) : tex(b);
      return `${bt}^{${isNum(p) ? fmtNum(p.v) : tex(p)}}`;
    }
    case 'fn': {
      if (e.f === 'abs') return `\\left|${tex(e.a)}\\right|`;
      const a = e.a;
      return FN_TEX[e.f] + (simpleArg(a) ? ' ' + tex(a) : par(tex(a)));
    }
    case 'root': return e.n === 2 ? `\\sqrt{${tex(e.a)}}` : `\\sqrt[${e.n}]{${tex(e.a)}}`;
  }
  return '?';
}

// ---------------------------------------------------------------- čtení textu
const FNAMES = [['arccotg', 'arccotg'], ['arccot', 'arccotg'], ['arcsin', 'arcsin'], ['arccos', 'arccos'], ['arctg', 'arctg'], ['arctan', 'arctg'],
  ['cotg', 'cotg'], ['cot', 'cotg'], ['sin', 'sin'], ['cos', 'cos'], ['tg', 'tg'], ['tan', 'tg'], ['ln', 'ln'], ['log', 'ln'], ['exp', 'exp'], ['sqrt', 'sqrt'], ['cbrt', 'cbrt']];

function tokenize(src) {
  const SUP = { '⁰': 0, '¹': 1, '²': 2, '³': 3, '⁴': 4, '⁵': 5, '⁶': 6, '⁷': 7, '⁸': 8, '⁹': 9 };
  const s = src.replace(/·|×|\*/g, '*').replace(/−/g, '-').replace(/,/g, '.').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, m => '^' + [...m].map(c => SUP[c]).join('')).replace(/\s+/g, ' ');
  const out = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === ' ') { i++; continue; }
    const m = /^\d+(\.\d+)?|^\.\d+/.exec(s.slice(i));
    if (m) { out.push({ k: 'num', v: parseFloat(m[0]) }); i += m[0].length; continue; }
    if ('+-*/^()|'.includes(c)) { out.push({ k: c }); i++; continue; }
    if (c === '√') { out.push({ k: 'fn', f: 'sqrt' }); i++; continue; }
    if (c === '∛') { out.push({ k: 'fn', f: 'cbrt' }); i++; continue; }
    if (c === 'π') { out.push({ k: 'pi' }); i++; continue; }
    const rest = s.slice(i).toLowerCase();
    const f = FNAMES.find(([n]) => rest.startsWith(n));
    if (f) { out.push({ k: 'fn', f: f[1] }); i += f[0].length; continue; }
    if (rest.startsWith('pi')) { out.push({ k: 'pi' }); i += 2; continue; }
    if (c === 'x' || c === 'X') { out.push({ k: 'x' }); i++; continue; }
    if (c === 'e' || c === 'E') { out.push({ k: 'e' }); i++; continue; }
    throw new Error(`Nerozumím znaku „${c}“`);
  }
  return out;
}

export function parse(src) {
  const tk = tokenize(src);
  let i = 0;
  const peek = () => tk[i];
  const eat = k => { if (tk[i] && tk[i].k === k) { i++; return true; } return false; };
  const expect = k => { if (!eat(k)) throw new Error(k === ')' ? 'Chybí zavírací závorka' : `Čekám „${k}“`); };
  let absDepth = 0;   // jsme uvnitř |…|? Pak další | zavírá, jinak otevírá (2|x| = 2·|x|)
  const startsPrimary = t => t && (t.k === 'num' || t.k === 'x' || t.k === 'e' || t.k === 'pi' || t.k === 'fn' || t.k === '(' || (t.k === '|' && absDepth === 0));
  const isNumLike = e => e.t === 'num' || (e.t === 'neg' && e.a.t === 'num');
  /** „2x“ za funkcí nebo v exponentu patří k sobě: sin 2x = sin(2x), e^2x = e^(2x) */
  const absorb = (a, kinds) => { let r = a; while (peek() && kinds.includes(peek().k)) r = mul(r, power()); return r; };
  function expr() {
    let terms = [term()];
    for (;;) {
      if (eat('+')) terms.push(term());
      else if (eat('-')) terms.push(neg(term()));
      else break;
    }
    return terms.length === 1 ? terms[0] : add(...terms);
  }
  function term() {
    let v = unary();
    for (;;) {
      if (eat('*')) v = mul(v, unary());
      else if (eat('/')) v = div(v, unary());
      else if (startsPrimary(peek())) v = mul(v, power());
      else return v;
    }
  }
  function unary() {
    if (eat('-')) return neg(unary());
    if (eat('+')) return unary();
    return power();
  }
  function power() {
    const b = primary();
    if (eat('^')) {
      const ex = unary();
      // e^2x a 2^3x čteme jako e^(2x), 2^(3x); u x^2… se nic nepřibírá (x^2e^x = x²·eˣ)
      if (!((b.t === 'e' || b.t === 'num') && isNumLike(ex))) return pow(b, ex);
      return pow(b, ex.t === 'neg' ? neg(absorb(ex.a, ['x'])) : absorb(ex, ['x']));   // e^-2x = e^(−2x)
    }
    return b;
  }
  function fnArg() {
    if (peek() && peek().k === '(') { i++; const a = expr(); expect(')'); return a; }
    const a = power();
    return a.t === 'num' ? absorb(a, ['x', 'pi']) : a;
  }
  function primary() {
    const t = peek();
    if (!t) throw new Error('Výraz nějak končí uprostřed');
    i++;
    if (t.k === 'num') return N(t.v);
    if (t.k === 'x') return X;
    if (t.k === 'e') return E;
    if (t.k === 'pi') return PI;
    if (t.k === '(') { const a = expr(); expect(')'); return a; }
    if (t.k === '|') { absDepth++; const a = expr(); if (!eat('|')) throw new Error('Chybí zavírací |'); absDepth--; return fn('abs', a); }
    if (t.k === 'fn') {
      let p = null;
      if (peek() && peek().k === '^' && t.f !== 'sqrt' && t.f !== 'cbrt') { i++; const pt = peek(); if (!pt || pt.k !== 'num') throw new Error('Za sin^ čekám číslo'); i++; p = pt.v; }
      const a = fnArg();
      let r = t.f === 'sqrt' ? root(2, a) : t.f === 'cbrt' ? root(3, a) : t.f === 'exp' ? exp(a) : fn(t.f, a);
      return p != null ? pow(r, N(p)) : r;
    }
    throw new Error('Tady čekám číslo, x nebo závorku');
  }
  if (!tk.length) throw new Error('Prázdné');
  const r = expr();
  if (i < tk.length) throw new Error(tk[i].k === ')' ? 'Závorka navíc' : 'Něco navíc na konci');
  return r;
}
export const P0 = src => simplify(parse(src));

// ---------------------------------------------------------------- porovnání
const PTS = [-2.7, -1.6, -0.85, -0.3, 0.17, 0.42, 0.73, 1.21, 1.67, 2.3, 2.9, 3.6, 4.4, 5.3, 0.93, 1.43, 6.1, 7.4, -4.2];
/** je výraz a (student) stejný jako b (správně)? Porovná hodnoty v bodech, kde je b definované. */
const DENSE = Array.from({ length: 31 }, (_, i) => -1.5 + i * 0.1 + 0.013);
const WIDE = Array.from({ length: 32 }, (_, i) => -9.7 + i * 0.61);
export function equiv(a, b, pts = PTS) {
  let n = 0;
  for (const x of [...pts, ...DENSE, ...WIDE]) {
    if (n >= 8) break;
    const vb = ev(b, x);
    if (!Number.isFinite(vb) || Math.abs(vb) > 1e7) continue;
    const va = ev(a, x);
    if (!Number.isFinite(va)) return false;
    if (Math.abs(va - vb) > 1e-6 * Math.max(1, Math.abs(vb))) return false;
    n++;
  }
  return n >= 3;
}
export const isConst = e => !hasX(e);

/**
 * Je F primitivní funkce k f? Porovná F' s f. Body, kde F' není definovaná (třeba ln x místo ln|x| pro x < 0),
 * se přeskočí, ale musí sedět aspoň 4 body.
 */
export function equivAnti(F, f, pts = PTS) {
  const dF = d(F);
  let n = 0;
  for (const x of [...pts, ...DENSE, ...WIDE]) {
    if (n >= 8) break;
    const vf = ev(f, x);
    if (!Number.isFinite(vf) || Math.abs(vf) > 1e7) continue;
    const va = ev(dF, x);
    if (!Number.isFinite(va)) continue;
    if (Math.abs(va - vf) > 1e-6 * Math.max(1, Math.abs(vf))) return false;
    n++;
  }
  return n >= 4;
}
