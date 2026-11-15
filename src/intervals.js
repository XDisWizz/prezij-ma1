// Množiny reálných čísel jako sjednocení intervalů.
// Krajní bod: { v: číslo, tex: KaTeX, txt: obyčejný text }
// Interval: { a, b, ai: levý kraj patří?, bi: pravý kraj patří? }

export const INF = { v: Infinity, tex: '+\\infty', txt: '+∞' };
export const NINF = { v: -Infinity, tex: '-\\infty', txt: '−∞' };

const EPS = 1e-9;
export const eq = (x, y) => x === y || Math.abs(x - y) < EPS * Math.max(1, Math.abs(x));

export function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; }

/** racionální krajní bod p/q */
export function frac(p, q = 1) {
  if (q < 0) { p = -p; q = -q; }
  const g = gcd(p, q); p /= g; q /= g;
  if (q === 1) return { v: p, tex: String(p), txt: p < 0 ? '−' + (-p) : String(p) };
  const neg = p < 0, ap = Math.abs(p);
  return { v: p / q, tex: (neg ? '-' : '') + `\\frac{${ap}}{${q}}`, txt: (neg ? '−' : '') + `${ap}/${q}` };
}
/** ±√n */
export function sqrtE(n, sign = 1) {
  const r = Math.sqrt(n);
  if (Number.isInteger(r)) return frac(sign * r);
  return { v: sign * r, tex: (sign < 0 ? '-' : '') + `\\sqrt{${n}}`, txt: (sign < 0 ? '−' : '') + `√${n}` };
}
/** e^c */
export function expE(c) {
  if (c === 0) return frac(1);
  if (c === 1) return { v: Math.E, tex: '\\mathrm{e}', txt: 'e' };
  if (c === -1) return { v: 1 / Math.E, tex: '\\frac{1}{\\mathrm{e}}', txt: '1/e' };
  return { v: Math.exp(c), tex: `\\mathrm{e}^{${c}}`, txt: `e^${c}` };
}

export const iv = (a, b, ai, bi) => ({ a, b, ai: a.v === -Infinity ? false : ai, bi: b.v === Infinity ? false : bi });
export const R = () => [iv(NINF, INF, false, false)];
export const ge = p => [iv(p, INF, true, false)];
export const gt = p => [iv(p, INF, false, false)];
export const le = p => [iv(NINF, p, false, true)];
export const lt = p => [iv(NINF, p, false, false)];
export const between = (a, b, ai = true, bi = true) => [iv(a, b, ai, bi)];
export const point = p => [{ a: p, b: p, ai: true, bi: true }];

export function normalize(set) {
  const s = set
    .filter(I => I.a.v < I.b.v - EPS || (eq(I.a.v, I.b.v) && I.ai && I.bi))
    .map(I => ({ ...I }))
    .sort((I, J) => I.a.v - J.a.v || (J.ai - I.ai));
  const out = [];
  for (const I of s) {
    const L = out[out.length - 1];
    if (L && (L.b.v > I.a.v + EPS || (eq(L.b.v, I.a.v) && (L.bi || I.ai)))) {
      if (eq(I.a.v, L.a.v)) L.ai = L.ai || I.ai;
      if (I.b.v > L.b.v + EPS) { L.b = I.b; L.bi = I.bi; }
      else if (eq(I.b.v, L.b.v)) L.bi = L.bi || I.bi;
    } else out.push({ ...I });
  }
  return out;
}

export function intersect(A, B) {
  const out = [];
  for (const I of A) for (const J of B) {
    let a, ai, b, bi;
    if (I.a.v > J.a.v + EPS) { a = I.a; ai = I.ai; } else if (J.a.v > I.a.v + EPS) { a = J.a; ai = J.ai; } else { a = I.a; ai = I.ai && J.ai; }
    if (I.b.v < J.b.v - EPS) { b = I.b; bi = I.bi; } else if (J.b.v < I.b.v - EPS) { b = J.b; bi = J.bi; } else { b = I.b; bi = I.bi && J.bi; }
    if (a.v < b.v - EPS || (eq(a.v, b.v) && ai && bi)) out.push({ a, b, ai, bi });
  }
  return normalize(out);
}
export const intersectAll = (...sets) => sets.reduce((x, y) => intersect(x, y), R());
export const union = (...sets) => normalize(sets.flat());

export function complement(A) {
  const out = [];
  let cur = NINF, curIn = false;
  for (const I of normalize(A)) {
    out.push({ a: cur, ai: curIn, b: I.a, bi: !I.ai });
    cur = I.b; curIn = !I.bi;
  }
  out.push({ a: cur, ai: curIn, b: INF, bi: false });
  return normalize(out.map(I => ({ ...I, ai: I.a.v === -Infinity ? false : I.ai })));
}
export const without = (A, ...pts) => intersect(A, complement(pts.flatMap(p => point(p))));

export const isR = s => { s = normalize(s); return s.length === 1 && s[0].a.v === -Infinity && s[0].b.v === Infinity; };

export function equal(A, B) {
  A = normalize(A); B = normalize(B);
  if (A.length !== B.length) return false;
  return A.every((I, k) => { const J = B[k]; return eq(I.a.v, J.a.v) && eq(I.b.v, J.b.v) && I.ai === J.ai && I.bi === J.bi; });
}
/** stejné krajní body, ale můžou se lišit závorky */
export function sameEndpoints(A, B) {
  A = normalize(A); B = normalize(B);
  if (A.length !== B.length) return false;
  return A.every((I, k) => eq(I.a.v, B[k].a.v) && eq(I.b.v, B[k].b.v));
}
export const subset = (A, B) => equal(intersect(A, B), A);

export function toTex(set) {
  set = normalize(set);
  if (!set.length) return '\\emptyset';
  if (isR(set)) return '\\mathbb{R}';
  return set.map(I => eq(I.a.v, I.b.v) ? `\\{${I.a.tex}\\}`
    : `${I.ai ? '\\langle' : '('}${I.a.tex}, ${I.b.tex}${I.bi ? '\\rangle' : ')'}`).join(' \\cup ');
}
/** Jako toTex, ale ℝ bez pár bodů navíc ukáže i krátce: (−∞, 1) ∪ (1, +∞) = ℝ ∖ {1} */
export function toTexBoth(set) {
  const full = toTex(set);
  const c = complement(set);
  if (!c.length || !c.every(I => eq(I.a.v, I.b.v))) return full;
  return `${full} = \\mathbb{R} \\setminus \\{${c.map(I => I.a.tex).join(', ')}\\}`;
}
export function toText(set) {
  set = normalize(set);
  if (!set.length) return '∅';
  if (isR(set)) return 'ℝ';
  return set.map(I => eq(I.a.v, I.b.v) ? `{${I.a.txt}}`
    : `${I.ai ? '⟨' : '('}${I.a.txt}, ${I.b.txt}${I.bi ? '⟩' : ')'}`).join(' ∪ ');
}
/** všechny konečné krajní body ze všech zadaných množin (unikátní, seřazené) */
export function endpoints(...sets) {
  const pts = [];
  for (const s of sets) for (const I of normalize(s)) for (const p of [I.a, I.b])
    if (isFinite(p.v) && !pts.some(q => eq(q.v, p.v))) pts.push(p);
  return pts.sort((p, q) => p.v - q.v);
}
/** zrcadlení x -> -x (typická chyba ve znaménku) */
export function mirror(set) {
  const neg = p => isFinite(p.v) ? { v: -p.v, tex: p.v === 0 ? p.tex : (p.tex.startsWith('-') ? p.tex.slice(1) : '-' + p.tex), txt: p.v === 0 ? p.txt : (p.txt.startsWith('−') ? p.txt.slice(1) : '−' + p.txt) } : (p.v > 0 ? NINF : INF);
  return normalize(normalize(set).map(I => ({ a: neg(I.b), b: neg(I.a), ai: I.bi, bi: I.ai })));
}
export function toggleBrackets(set) {
  return normalize(normalize(set).map(I => iv(I.a, I.b, isFinite(I.a.v) ? !I.ai : false, isFinite(I.b.v) ? !I.bi : false)));
}

// ---------- čtení odpovědi studenta ----------

function evalExpr(src) {
  const s = src.replace(/\s+/g, '').replace(/−/g, '-').replace(/sqrt/gi, '√').replace(/pi/gi, 'π').replace(/inf(inity)?/gi, '∞').replace(/,/g, '.');
  let i = 0;
  const peek = () => s[i];
  const fail = () => { throw new Error('výraz'); };
  function primary() {
    const c = peek();
    if (c === '(') { i++; const v = expr(); if (peek() !== ')') fail(); i++; return v; }
    if (c === 'e') { i++; return Math.E; }
    if (c === 'π') { i++; return Math.PI; }
    if (c === '∞') { i++; return Infinity; }
    const m = /^\d+(\.\d+)?|^\.\d+/.exec(s.slice(i));
    if (m) { i += m[0].length; return parseFloat(m[0]); }
    fail();
  }
  function unary() {
    const c = peek();
    if (c === '-') { i++; return -unary(); }
    if (c === '+') { i++; return unary(); }
    if (c === '√') { i++; const v = power(); if (v < 0) fail(); return Math.sqrt(v); }
    return power();
  }
  function power() {
    const b = primary();
    if (peek() === '^') { i++; return Math.pow(b, unary()); }
    return b;
  }
  function term() {
    let v = unary();
    for (;;) {
      const c = peek();
      if (c === '*' || c === '·') { i++; v *= unary(); }
      else if (c === '/') { i++; v /= unary(); }
      else if (c && /[\d(eπ√∞]/.test(c)) v *= unary();
      else return v;
    }
  }
  function expr() {
    let v = term();
    for (;;) {
      const c = peek();
      if (c === '+') { i++; v += term(); }
      else if (c === '-') { i++; v -= term(); }
      else return v;
    }
  }
  if (!s.length) fail();
  const v = expr();
  if (i !== s.length || Number.isNaN(v)) fail();
  return v;
}

function splitTop(str, seps) {
  const parts = []; let depth = 0, cur = '';
  for (const ch of str) {
    if (ch === '(' || ch === '{') depth++;
    if (ch === ')' || ch === '}') depth--;
    if (depth === 0 && seps.includes(ch)) { parts.push(cur); cur = ''; } else cur += ch;
  }
  parts.push(cur);
  return parts;
}

function endpointFrom(raw) {
  const t = raw.trim();
  const v = evalExpr(t);
  return { v, tex: t, txt: t.replace(/-/g, '−') };
}

/** rozdělí podle ∪ / ∖ mimo závorky: [{ op, text }] */
function splitOps(str) {
  const parts = []; let depth = 0, cur = '', op = '∪';
  for (const ch of str) {
    if ('(⟨{'.includes(ch)) depth++;
    if (')⟩}'.includes(ch)) depth--;
    if (depth === 0 && (ch === '∪' || ch === '∖')) { parts.push({ op, text: cur.trim() }); cur = ''; op = ch; } else cur += ch;
  }
  parts.push({ op, text: cur.trim() });
  return parts;
}

/** jedna množina: ℝ, ∅, {body}, nebo interval */
function parsePart(p) {
  if (/^[Rℝ]$/.test(p)) return { set: R() };
  if (p === '∅' || p === '{}') return { set: [] };
  const pm = /^\{(.*)\}$/.exec(p);
  if (pm) return { set: union(...splitTop(pm[1], [',', ';']).map(x => point(endpointFrom(x)))) };
  const L = p[0], Rb = p[p.length - 1];
  if (!L || !'(⟨'.includes(L) || !')⟩'.includes(Rb)) return { error: 'brackets' };
  const inner = p.slice(1, -1);
  let ends = splitTop(inner, [';']);
  if (ends.length !== 2) ends = splitTop(inner, [',']);
  if (ends.length !== 2) return { error: ends.length > 2 ? 'decimal' : 'pair' };
  const a = endpointFrom(ends[0]), b = endpointFrom(ends[1]);
  if (a.v === Infinity || b.v === -Infinity) return { error: 'order' };
  if (a.v > b.v + EPS) return { error: 'order' };
  let ai = L === '⟨', bi = Rb === '⟩', warn = null;
  if ((a.v === -Infinity && ai) || (b.v === Infinity && bi)) warn = 'infbracket';
  if (a.v === -Infinity) { a.tex = '-\\infty'; a.txt = '−∞'; ai = false; }
  if (b.v === Infinity) { b.tex = '+\\infty'; b.txt = '+∞'; bi = false; }
  return { set: [{ a, b, ai, bi }], warn };
}

/** Vrací { ok, set, warn } nebo { ok:false, error }.
 *  Umí sjednocení i rozdíl, čteno zleva: ℝ ∖ {1, 2}, (0, +∞) ∖ {1}, (−∞, 0) ∪ (0, 5) ∖ {2} */
export function parseSet(input) {
  let s = (input || '').trim();
  if (!s) return { ok: false, error: 'empty' };
  s = s.replace(/[<\[]/g, '⟨').replace(/[>\]]/g, '⟩').replace(/〈/g, '⟨').replace(/〉/g, '⟩')
    .replace(/[\\⧵﹨]/g, '∖')
    .replace(/\s+[uU]\s+/g, ' ∪ ').replace(/([)⟩}])\s*[uU]\s*(?=[(⟨{Rℝ∅])/g, '$1∪').replace(/−/g, '-').replace(/\binf(inity)?\b/gi, '∞')
    // R - {1}, R/{1} → R ∖ {1} (minus/lomítko jen mezi množinami, ne v čísle)
    .replace(/([Rℝ)⟩}∅])\s*[-/]\s*(?=[{(⟨Rℝ])/g, '$1∖');
  let warn = null, acc = null;
  try {
    for (const { op, text } of splitOps(s)) {
      if (!text) return { ok: false, error: op === '∖' ? 'minus' : 'brackets' };
      const r = parsePart(text);
      if (r.error) return { ok: false, error: r.error };
      if (r.warn) warn = r.warn;
      acc = acc == null ? r.set : op === '∪' ? union(acc, r.set) : intersect(acc, complement(r.set));
    }
  } catch (e) {
    return { ok: false, error: 'expr' };
  }
  return { ok: true, set: normalize(acc), warn };
}

export const PARSE_ERRORS = {
  empty: 'Napiš odpověď, třeba (−∞, 3⟩ ∪ (5, +∞) nebo ℝ ∖ {1}.',
  brackets: 'Každý interval začíná závorkou ( nebo ⟨ a končí ) nebo ⟩.',
  decimal: 'Desetinná čísla piš s tečkou (1.5), čárka odděluje krajní body.',
  pair: 'Interval potřebuje dva krajní body oddělené čárkou.',
  order: 'Menší číslo patří doleva, větší doprava.',
  minus: 'Za ∖ napiš, co vyhazuješ, třeba ℝ ∖ {1, 2}.',
  expr: 'Jedno z čísel nedokážu přečíst. Zkus třeba 3, −1/2, √2 nebo e.',
};
