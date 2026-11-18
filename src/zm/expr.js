// Základy matematiky: čtení a vyhodnocení zápisu studenta.
// Umí reálná i komplexní čísla (i), π, √, mocniny, zlomky a proměnné x, y, z (rovnice roviny).
// Všechno se počítá v komplexních číslech [re, im], takže 2 + 3i, (1 + i)^3 i 3/10 − 1/10 i projdou stejně.

// ------------------------------------------------------------ komplexní aritmetika
export const C = (re, im = 0) => [re, im];
export const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
export function cdiv(a, b) {
  const q = b[0] * b[0] + b[1] * b[1];
  if (q === 0) return [NaN, NaN];
  return [(a[0] * b[0] + a[1] * b[1]) / q, (a[1] * b[0] - a[0] * b[1]) / q];
}
export const cabs = a => Math.hypot(a[0], a[1]);
export const carg = a => Math.atan2(a[1], a[0]);
export const polar = (r, phi) => [r * Math.cos(phi), r * Math.sin(phi)];
export function cpow(a, e) {
  if (e[1] === 0 && Number.isInteger(e[0]) && Math.abs(e[0]) <= 64) {
    let r = [1, 0];
    for (let k = 0; k < Math.abs(e[0]); k++) r = cmul(r, a);
    return e[0] < 0 ? cdiv([1, 0], r) : r;
  }
  if (a[1] === 0 && e[1] === 0 && a[0] >= 0) return [Math.pow(a[0], e[0]), 0];
  if (a[0] === 0 && a[1] === 0) return [0, 0];
  // obecně přes polární tvar (hlavní hodnota)
  const lr = Math.log(cabs(a)), th = carg(a);
  const re = Math.exp(e[0] * lr - e[1] * th), ang = e[1] * lr + e[0] * th;
  return polar(re, ang);
}
export const csqrt = a => (a[1] === 0 && a[0] >= 0 ? [Math.sqrt(a[0]), 0] : polar(Math.sqrt(cabs(a)), carg(a) / 2));
export const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
export const cnear = (a, b, tol = 1e-6) => cabs(csub(a, b)) <= tol * Math.max(1, cabs(b));

// ------------------------------------------------------------ čtení
const SUP = { '⁰': 0, '¹': 1, '²': 2, '³': 3, '⁴': 4, '⁵': 5, '⁶': 6, '⁷': 7, '⁸': 8, '⁹': 9 };
function tokenize(src, vars) {
  const s = src.replace(/·|×|\*/g, '*').replace(/[−–]/g, '-').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, m => '^' + [...m].map(c => SUP[c]).join(''));
  const out = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    const m = /^\d+([.,]\d+)?|^[.,]\d+/.exec(s.slice(i));
    if (m) { out.push({ k: 'num', v: parseFloat(m[0].replace(',', '.')) }); i += m[0].length; continue; }
    if ('+-*/^()'.includes(c)) { out.push({ k: c }); i++; continue; }
    if (c === '[' || c === '{') { out.push({ k: '(' }); i++; continue; }
    if (c === ']' || c === '}') { out.push({ k: ')' }); i++; continue; }
    if (c === '√') { out.push({ k: 'sqrt' }); i++; continue; }
    if (c === 'π') { out.push({ k: 'pi' }); i++; continue; }
    if (c === '°') { out.push({ k: 'deg' }); i++; continue; }
    const rest = s.slice(i).toLowerCase();
    if (rest.startsWith('sqrt')) { out.push({ k: 'sqrt' }); i += 4; continue; }
    if (rest.startsWith('pi')) { out.push({ k: 'pi' }); i += 2; continue; }
    if (c === 'i' || c === 'j') { out.push({ k: 'i' }); i++; continue; }
    if (vars.includes(c.toLowerCase())) { out.push({ k: 'var', n: c.toLowerCase() }); i++; continue; }
    throw new Error(`Nerozumím znaku „${c}“`);
  }
  return out;
}

/** text → strom. vars = povolené proměnné, např. 'xyz' */
export function parse(src, { vars = '' } = {}) {
  const tk = tokenize(String(src), vars);
  let i = 0;
  const peek = () => tk[i];
  const eat = k => { if (tk[i] && tk[i].k === k) { i++; return true; } return false; };
  const starts = t => t && ['num', 'i', 'pi', 'var', 'sqrt', '('].includes(t.k);
  function expr() {
    let a = term();
    for (;;) {
      if (eat('+')) a = { t: 'add', a, b: term() };
      else if (eat('-')) a = { t: 'sub', a, b: term() };
      else return a;
    }
  }
  function term() {
    let a = unary();
    for (;;) {
      if (eat('*')) a = { t: 'mul', a, b: unary() };
      else if (eat('/')) a = { t: 'div', a, b: unary() };
      else if (starts(peek())) a = { t: 'mul', a, b: power(), imp: true };
      else return a;
    }
  }
  function unary() {
    if (eat('-')) return { t: 'neg', a: unary() };
    if (eat('+')) return unary();
    return power();
  }
  function power() {
    let b = primary();
    while (eat('deg')) b = { t: 'deg', a: b };
    if (eat('^')) return { t: 'pow', b, e: unary() };
    return b;
  }
  function primary() {
    const t = peek();
    if (!t) throw new Error('Zápis nějak končí uprostřed');
    i++;
    if (t.k === 'num') return { t: 'num', v: t.v };
    if (t.k === 'i') return { t: 'i' };
    if (t.k === 'pi') return { t: 'pi' };
    if (t.k === 'var') return { t: 'var', n: t.n };
    if (t.k === 'sqrt') return { t: 'sqrt', a: primary() };
    if (t.k === '(') { const a = expr(); if (!eat(')')) throw new Error('Chybí zavírací závorka'); return { t: 'par', a }; }
    throw new Error(t.k === ')' ? 'Závorka navíc' : 'Tady čekám číslo nebo závorku');
  }
  if (!tk.length) throw new Error('Prázdné');
  const r = expr();
  if (i < tk.length) throw new Error(tk[i].k === ')' ? 'Závorka navíc' : 'Něco navíc na konci');
  return r;
}

export const hasPi = e => !!e && (e.t === 'pi' || ['a', 'b', 'e'].some(k => e[k] && typeof e[k] === 'object' && hasPi(e[k])));
export const hasVar = e => !!e && (e.t === 'var' || ['a', 'b', 'e'].some(k => e[k] && typeof e[k] === 'object' && hasVar(e[k])));
export const hasI = e => !!e && (e.t === 'i' || ['a', 'b', 'e'].some(k => e[k] && typeof e[k] === 'object' && hasI(e[k])));

/** strom → komplexní číslo; env = { x: 1, y: 2, z: 3 } */
export function ev(e, env = {}) {
  switch (e.t) {
    case 'num': return [e.v, 0];
    case 'i': return [0, 1];
    case 'pi': return [Math.PI, 0];
    case 'var': return [env[e.n] ?? 0, 0];
    case 'par': case 'deg': return ev(e.a, env);
    case 'neg': { const a = ev(e.a, env); return [-a[0], -a[1]]; }
    case 'add': return cadd(ev(e.a, env), ev(e.b, env));
    case 'sub': return csub(ev(e.a, env), ev(e.b, env));
    case 'mul': return cmul(ev(e.a, env), ev(e.b, env));
    case 'div': return cdiv(ev(e.a, env), ev(e.b, env));
    case 'pow': return cpow(ev(e.b, env), ev(e.e, env));
    case 'sqrt': return csqrt(ev(e.a, env));
  }
  return [NaN, NaN];
}

// ------------------------------------------------------------ sazba (náhled „čtu to jako“)
const PREC = { add: 1, sub: 1, neg: 2, mul: 3, div: 4, pow: 5 };
function fmt(v) {
  if (Number.isInteger(v)) return String(v);
  return String(+v.toFixed(6)).replace('.', '{,}');
}
export function tex(e) {
  const p = x => PREC[x.t] ?? 9;
  const wrap = (x, min) => (p(x) < min ? `\\left(${tex(x)}\\right)` : tex(x));
  switch (e.t) {
    case 'num': return fmt(e.v);
    case 'i': return '\\mathrm{i}';
    case 'pi': return '\\pi';
    case 'var': return e.n;
    case 'par': return `\\left(${tex(e.a)}\\right)`;
    case 'deg': return tex(e.a) + '^{\\circ}';
    case 'neg': return '-' + wrap(e.a, 3);
    case 'add': return `${tex(e.a)} + ${e.b.t === 'neg' ? `\\left(${tex(e.b)}\\right)` : tex(e.b)}`;
    case 'sub': return `${tex(e.a)} - ${wrap(e.b, 2)}`;
    case 'mul': {
      const L = wrap(e.a, 3), R = wrap(e.b, 3);
      const dot = !e.imp || (/\d$/.test(L) && /^[\d.]/.test(R));
      return dot ? `${L} \\cdot ${R}` : `${L}\\,${R}`;
    }
    case 'div': return `\\frac{${tex(e.a.t === 'par' ? e.a.a : e.a)}}{${tex(e.b.t === 'par' ? e.b.a : e.b)}}`;
    case 'pow': return `${p(e.b) < 9 || e.b.t === 'deg' ? `\\left(${tex(e.b)}\\right)` : tex(e.b)}^{${tex(e.e.t === 'par' ? e.e.a : e.e)}}`;
    case 'sqrt': return `\\sqrt{${tex(e.a.t === 'par' ? e.a.a : e.a)}}`;
  }
  return '?';
}

// ------------------------------------------------------------ hezký zápis čísel pro zadání a výsledky
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
/** zlomek p/q zkrácený → TeX */
export function fracTex(p, q = 1) {
  if (q < 0) { p = -p; q = -q; }
  const g = gcd(p, q); p /= g; q /= g;
  if (q === 1) return String(p);
  return `${p < 0 ? '-' : ''}\\frac{${Math.abs(p)}}{${q}}`;
}
/** zlomek p/q → text pro políčko */
export function fracTxt(p, q = 1) {
  if (q < 0) { p = -p; q = -q; }
  const g = gcd(p, q); p /= g; q /= g;
  return q === 1 ? String(p) : `${p}/${q}`;
}
/** a + bi (a, b celá nebo zlomky) → TeX; re, im = [p, q] nebo číslo */
export function cxTex(re, im) {
  const R = Array.isArray(re) ? re : [re, 1], I = Array.isArray(im) ? im : [im, 1];
  const rz = R[0] === 0, iz = I[0] === 0;
  const rt = fracTex(...R);
  if (iz) return rt;
  const ia = Math.abs(I[0]), ineg = I[0] < 0;
  const g = gcd(ia, I[1]);
  const num = ia / g, den = I[1] / g;
  const it2 = den === 1 ? (num === 1 ? '\\mathrm{i}' : `${num}\\mathrm{i}`) : `\\frac{${num}}{${den}}\\mathrm{i}`;
  if (rz) return (ineg ? '-' : '') + it2;
  return `${rt} ${ineg ? '-' : '+'} ${it2}`;
}
export function cxTxt(re, im) {
  const R = Array.isArray(re) ? re : [re, 1], I = Array.isArray(im) ? im : [im, 1];
  const r = fracTxt(...R), ia = fracTxt(Math.abs(I[0]), I[1]);
  if (I[0] === 0) return r;
  const it = ia === '1' ? 'i' : ia.includes('/') ? `(${ia})i` : `${ia}i`;
  if (R[0] === 0) return (I[0] < 0 ? '-' : '') + it;
  return `${r} ${I[0] < 0 ? '-' : '+'} ${it}`;
}
/** k·√n s malým n (√2, √3) */
export const surdTex = (k, n) => (n === 1 ? String(k) : `${k === 1 ? '' : k === -1 ? '-' : k}\\sqrt{${n}}`);
export const surdTxt = (k, n) => (n === 1 ? String(k) : `${k === 1 ? '' : k === -1 ? '-' : k}√${n}`);
/** √m zjednodušená: [k, n] s m = k²·n */
export function simplifySqrt(m) {
  let k = 1, n = m;
  for (let d = 2; d * d <= n; d++) while (n % (d * d) === 0) { n /= d * d; k *= d; }
  return [k, n];
}
