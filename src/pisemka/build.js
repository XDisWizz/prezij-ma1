// Cvičná písemka z MA1: „řešiče“ jednotlivých typů příkladů.
// Z parametrů zadání spočítají přesný výsledek (racionální čísla, intervaly, kořeny derivace),
// postup krok za krokem a kartu, která odpověď zkontroluje. Používají je minulé písemky (exams.js)
// i generátor nových (gen.js), takže obojí počítá stejný, auditovaný kód (tools/audit-pisemka.mjs).
import * as S from '../sym.js';
import { frac, iv, INF, NINF, union, intersect, R, point, normalize, toTex, toText } from '../intervals.js';

// =====================================================================
// racionální čísla { p, q }
// =====================================================================
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
export const Q = (p, q = 1) => { if (q < 0) { p = -p; q = -q; } const g = gcd(p, q); return { p: p / g, q: q / g }; };
export const qadd = (a, b) => Q(a.p * b.q + b.p * a.q, a.q * b.q);
export const qsub = (a, b) => Q(a.p * b.q - b.p * a.q, a.q * b.q);
export const qmul = (a, b) => Q(a.p * b.p, a.q * b.q);
export const qdiv = (a, b) => Q(a.p * b.q, a.q * b.p);
export const qneg = a => Q(-a.p, a.q);
export const qv = a => a.p / a.q;
export const qz = a => a.p === 0;
export const qi = n => Q(n, 1);
const qq = x => (typeof x === 'number' ? qi(x) : x);
/** TeX zlomku: 3, -\frac{1}{2} */
export function qtex(a) {
  a = qq(a);
  if (a.q === 1) return String(a.p);
  return `${a.p < 0 ? '-' : ''}\\frac{${Math.abs(a.p)}}{${a.q}}`;
}
/** text pro políčko / parser: 3, -1/2 */
export const qtxt = a => { a = qq(a); return a.q === 1 ? String(a.p) : `${a.p}/${a.q}`; };
/** koncový bod intervalu */
export const qend = a => frac(a.p, a.q);
/** koeficient před výrazem: 1 → '', -1 → '-', 2 → '2', 1/2 → '\frac{1}{2}' */
export function coefTex(a, first = true) {
  a = qq(a);
  const s = a.p < 0 ? '-' : first ? '' : '+';
  const b = Q(Math.abs(a.p), a.q);
  const body = b.p === 1 && b.q === 1 ? '' : qtex(b);
  return first ? `${s}${body}` : `${s === '-' ? ' - ' : ' + '}${body}`;
}

// =====================================================================
// polynomy s racionálními koeficienty (pole od nejnižší mocniny)
// =====================================================================
export const P = (...cs) => cs.map(qq);   // P(c0, c1, c2, …)
export const peval = (p, x) => p.reduce((s, c, k) => s + qv(c) * x ** k, 0);
export const pevalQ = (p, x) => p.reduce((s, c, k) => qadd(s, qmul(c, qpow(x, k))), qi(0));
export function qpow(a, k) { let r = qi(1); for (let i = 0; i < k; i++) r = qmul(r, a); return r; }
export const pderiv = p => p.slice(1).map((c, k) => qmul(c, qi(k + 1)));
const trim = p => { const r = p.slice(); while (r.length > 1 && qz(r[r.length - 1])) r.pop(); return r; };
export function pmul(a, b) {
  const r = Array.from({ length: a.length + b.length - 1 }, () => qi(0));
  a.forEach((x, i) => b.forEach((y, j) => { r[i + j] = qadd(r[i + j], qmul(x, y)); }));
  return trim(r);
}
/** (x − r) */
export const lin = r => [qneg(qq(r)), qi(1)];
/** TeX polynomu: 4x^3 + 9x^2 - 12x + 7 (od nejvyšší mocniny) */
export function ptex(p, v = 'x') {
  p = trim(p);
  let s = '';
  for (let k = p.length - 1; k >= 0; k--) {
    const c = p[k];
    if (qz(c) && !(k === 0 && !s)) continue;
    const mon = k === 0 ? '' : k === 1 ? v : `${v}^{${k}}`;
    if (!s) s = k === 0 ? qtex(c) : `${coefTex(c, true)}${mon}`;
    else if (k === 0) s += `${c.p < 0 ? ' - ' : ' + '}${qtex(Q(Math.abs(c.p), c.q))}`;
    else s += `${coefTex(c, false)}${mon}`;
  }
  return s;
}
/** dělení polynomu (x − r), vrací podíl (předpoklad: r je kořen) */
function deflate(p, r) {
  const n = p.length - 1, out = new Array(n);
  let acc = qi(0);
  for (let k = n; k >= 1; k--) { acc = qadd(qmul(acc, r), p[k]); out[k - 1] = acc; }
  return out;
}
/** racionální kořeny s násobností; vrací { roots: [{ r, m }], rest } (rest = zbytek bez racionálních kořenů) */
export function rationalRoots(p) {
  p = trim(p);
  const roots = [];
  const add = r => { const e = roots.find(x => qv(x.r) === qv(r)); if (e) e.m++; else roots.push({ r, m: 1 }); };
  for (let guard = 0; guard < 12 && p.length > 1; guard++) {
    if (qz(p[0])) { add(qi(0)); p = p.slice(1); continue; }
    // celočíselné koeficienty
    const L = p.reduce((l, c) => (l * c.q) / gcd(l, c.q), 1);
    const ints = p.map(c => (c.p * L) / c.q);
    const a0 = Math.abs(ints[0]), an = Math.abs(ints[ints.length - 1]);
    const div = n => { const d = []; for (let i = 1; i <= n; i++) if (n % i === 0) d.push(i); return d; };
    let found = null;
    outer: for (const u of div(a0)) for (const w of div(an)) for (const s of [1, -1]) {
      const r = Q(s * u, w);
      if (qz(pevalQ(p, r))) { found = r; break outer; }
    }
    if (!found) break;
    add(found);
    p = deflate(p, found);
  }
  roots.sort((a, b) => qv(a.r) - qv(b.r));
  return { roots, rest: p };
}
/** faktorizace pro postup: 6(2x - 1)(x + 2) */
export function factorTex(p) {
  const { roots, rest } = rationalRoots(p);
  let c = rest.length === 1 ? rest[0] : null;
  const fs = [];
  for (const { r, m } of roots) {
    // (q x − p) místo (x − p/q), konstanta se upraví
    const f = qz(r) ? 'x' : r.q === 1 ? `(x ${r.p < 0 ? '+' : '-'} ${Math.abs(r.p)})` : `(${r.q}x ${r.p < 0 ? '+' : '-'} ${Math.abs(r.p)})`;
    if (c) c = qdiv(c, qi(r.q ** m));
    fs.push(m === 1 ? f : `${f}^{${m}}`);
  }
  const restTex = rest.length > 1 ? `\\left(${ptex(rest)}\\right)` : '';
  const cTex = c ? (c.p === 1 && c.q === 1 ? '' : c.p === -1 && c.q === 1 ? '-' : qtex(c)) : '';
  return `${cTex}${fs.join('')}${restTex}` || '1';
}

// =====================================================================
// znaménka polynomu → množina, kde platí podmínka
// =====================================================================
/** rel: '>' | '>=' | '<' | '!=' ; vrací { set, pts (kořeny), signs (na intervalech) } */
export function signSet(p, rel) {
  const { roots, rest } = rationalRoots(p);
  // zbytek bez racionálních kořenů musí mít stálé znaménko (u zadání z písemek vždy)
  if (rest.length > 1) {
    if (rest.length !== 3) throw new Error('signSet: zbytek stupně ' + (rest.length - 1));
    const [c, b, a] = rest.map(qv);
    if (b * b - 4 * a * c >= 0) throw new Error('signSet: iracionální kořeny');
  }
  const rs = roots.map(x => x.r);
  const tests = rs.length ? [qv(rs[0]) - 1, ...rs.slice(1).map((r, i) => (qv(rs[i]) + qv(r)) / 2), qv(rs[rs.length - 1]) + 1] : [0];
  const signs = tests.map(t => Math.sign(peval(p, t)));
  const ok = s => (rel === '>' ? s > 0 : rel === '>=' ? s > 0 : rel === '<' ? s < 0 : rel === '<=' ? s < 0 : s !== 0);
  const ends = [NINF, ...rs.map(qend), INF];
  const parts = [];
  signs.forEach((s, k) => { if (ok(s)) parts.push([iv(ends[k], ends[k + 1], false, false)]); });
  if (rel === '>=' || rel === '<=') rs.forEach(r => parts.push(point(qend(r))));
  return { set: union(...parts), pts: rs, signs };
}

// =====================================================================
// 1. definiční obor
// =====================================================================
/**
 * conds: [{ k: 'ln' | 'sqrt' | 'sqrtDen' | 'den' | 'arc', p (polynom) nebo a, b (vnitřek a·x + b u arc), arg (TeX) }]
 */
export function domain({ text, tex, conds, fstr }) {
  const steps = ['Podmínky: logaritmus jen z kladného čísla, odmocnina jen z nezáporného, jmenovatel nesmí být nula, arkussinus i arkuskosinus jen pro čísla od $-1$ do $1$.'];
  let D = R();
  for (const c of conds) {
    let set, line;
    if (c.k === 'arc') {
      const a = qq(c.a), b = qq(c.b);
      const lo = qdiv(qsub(qi(-1), b), a), hi = qdiv(qsub(qi(1), b), a);
      const [L, H] = qv(lo) <= qv(hi) ? [lo, hi] : [hi, lo];
      set = [iv(qend(L), qend(H), true, true)];
      line = `$-1 \\le ${c.arg} \\le 1 \\;\\Rightarrow\\; x \\in ${toTex(set)}$`;
    } else {
      const rel = c.k === 'ln' || c.k === 'sqrtDen' ? '>' : c.k === 'sqrt' ? '>=' : '!=';
      const r = signSet(c.p, rel);
      set = r.set;
      const relTex = rel === '>' ? '> 0' : rel === '>=' ? '\\ge 0' : '\\ne 0';
      const what = c.k === 'ln' ? 'logaritmus' : c.k === 'sqrt' ? 'odmocnina' : c.k === 'sqrtDen' ? 'odmocnina ve jmenovateli' : 'jmenovatel';
      const fac = factorTex(c.p);
      const facPart = fac !== ptex(c.p) && r.pts.length && trim(c.p).length > 2 ? ` \\;\\Leftrightarrow\\; ${fac} ${relTex}` : '';
      line = `${what}: $${c.arg || ptex(c.p)} ${relTex}${facPart} \\;\\Rightarrow\\; x \\in ${set.length ? toTex(set) : '\\emptyset'}$`;
      if (rel === '!=' && r.pts.length) line = `${what}: $${c.arg || ptex(c.p)} \\ne 0 \\;\\Rightarrow\\; x \\ne ${r.pts.map(qtex).join(',\\ ')}$`;
    }
    steps.push(line);
    D = intersect(D, set);
  }
  steps.push(`Všechny podmínky naráz (průnik): $D(f) = ${toTex(D)}$`);
  return {
    text, tex, answerTex: `D(f) = ${toTex(D)}`,
    card: () => ({ type: 'interval', key: 'p1', prompt: text, fn: tex, label: 'D(f) =', answer: D, steps, hint: 'Vypiš všechny podmínky (ln, odmocnina, jmenovatel, arkus) a udělej průnik.' }),
    set: D, steps, fstr,
  };
}

// =====================================================================
// 2. monotonie a lokální extrémy polynomu
// =====================================================================
const setField = (label, set, w = 1) => ({ kind: 'set', label, answer: set, loose: true, tex: set.length ? toTex(set) : '\\emptyset', text: set.length ? toText(set) : '∅', w });
const ptsField = (label, pts, w = 1) => ({ kind: 'nums', label, answer: pts.map(qv), tex: pts.length ? pts.map(qtex).join(';\\ ') : '\\text{žádné}', text: pts.length ? pts.map(qtxt).join('; ') : 'žádné', w });
export function extremes({ text, tex, f, mono = true }) {
  const d = pderiv(f);
  const { roots, rest } = rationalRoots(d);
  if (rest.length > 1) {
    const [c, b, a] = rest.map(qv);
    if (rest.length !== 3 || b * b - 4 * a * c >= 0) throw new Error('extremes: derivace nemá racionální kořeny');
  }
  const crit = roots.map(r => r.r);
  const tests = crit.length ? [qv(crit[0]) - 1, ...crit.slice(1).map((r, i) => (qv(crit[i]) + qv(r)) / 2), qv(crit[crit.length - 1]) + 1] : [0];
  const signs = tests.map(t => Math.sign(peval(d, t)));
  const ends = [NINF, ...crit.map(qend), INF];
  // monotonie: přes stacionární bod bez změny znaménka (x³ v nule) je funkce ryze monotónní dál → spojit
  const inc = [], dec = [], incSplit = [], decSplit = [];
  let start = 0;
  signs.forEach((s, k) => {
    (s > 0 ? incSplit : decSplit).push(iv(ends[k], ends[k + 1], false, false));
    if (k === signs.length - 1 || signs[k + 1] !== s) { (s > 0 ? inc : dec).push(iv(ends[start], ends[k + 1], false, false)); start = k + 1; }
  });
  const max = [], min = [];
  crit.forEach((c, k) => { if (signs[k] > 0 && signs[k + 1] < 0) max.push(c); else if (signs[k] < 0 && signs[k + 1] > 0) min.push(c); });
  // sousední intervaly se stejným znaménkem nespojovat do jednoho zápisu: monotonie se udává na každém zvlášť
  const incSet = normalize(inc), decSet = normalize(dec);
  const fval = c => qtex(pevalQ(f, c));
  const row = signs.map(s => (s > 0 ? '+' : '−'));
  const head = ['(-\\infty', ...crit.map(qtex)];
  let table = '<div class="st-wrap"><table class="sign-table"><tr><th>$x$</th>';
  head.forEach((hd, k) => { table += `<th>$${k === 0 ? '(-\\infty,\\ ' + (crit[0] ? qtex(crit[0]) : '+\\infty') + ')' : '(' + qtex(crit[k - 1]) + ',\\ ' + (crit[k] ? qtex(crit[k]) : '+\\infty') + ')'}$</th>`; });
  table += `</tr><tr><th>$f'$</th>${row.map(s => `<td class="${s === '+' ? 'st-plus' : 'st-minus'}">${s}</td>`).join('')}</tr>`;
  table += `<tr class="st-result"><th>$f$</th>${signs.map(s => `<td>${s > 0 ? '↗' : '↘'}</td>`).join('')}</tr></table></div>`;
  const steps = [
    `Derivace: $f'(x) = ${ptex(d)} = ${factorTex(d)}$`,
    `Stacionární body ($f'(x) = 0$): $x = ${crit.map(qtex).join(',\\ ')}$`,
    `Znaménko $f'$ mezi nimi (dosaď libovolné číslo z intervalu): ${table}`,
    mono ? `Rostoucí na $${incSet.length ? toTex(incSet).replace(/\\cup/g, ',\\ ') : '\\emptyset'}$, klesající na $${decSet.length ? toTex(decSet).replace(/\\cup/g, ',\\ ') : '\\emptyset'}$ (na každém intervalu zvlášť, sjednocení se u monotonie nepíše).` : null,
    max.length ? `Lokální maximum: ${max.map(c => `$x = ${qtex(c)}$, $f(${qtex(c)}) = ${fval(c)}$`).join('; ')} ($+$ se mění na $-$).` : 'Lokální maximum: žádné.',
    min.length ? `Lokální minimum: ${min.map(c => `$x = ${qtex(c)}$, $f(${qtex(c)}) = ${fval(c)}$`).join('; ')} ($-$ se mění na $+$).` : 'Lokální minimum: žádné.',
    crit.some(c => !max.includes(c) && !min.includes(c)) ? `V bodě $x = ${crit.filter(c => !max.includes(c) && !min.includes(c)).map(qtex).join(',\\ ')}$ se znaménko derivace nemění, takže tam extrém <b>není</b> (častá past).` : null,
  ].filter(Boolean);
  const fields = mono
    ? [{ ...setField('rostoucí na', incSet, 2.5), alts: [normalize(incSplit)] }, { ...setField('klesající na', decSet, 2.5), alts: [normalize(decSplit)] },
      ptsField('lok. maximum v $x =$', max, 2.5), ptsField('lok. minimum v $x =$', min, 2.5)]
    : [ptsField('lok. maximum v $x =$', max, 5), ptsField('lok. minimum v $x =$', min, 5)];
  const ans = [
    mono ? `\\nearrow\\ ${incSet.length ? toTex(incSet).replace(/\\cup/g, ',') : '\\emptyset'};\\ \\searrow\\ ${decSet.length ? toTex(decSet).replace(/\\cup/g, ',') : '\\emptyset'}` : null,
    `\\text{max: } ${max.length ? max.map(c => `x = ${qtex(c)}`).join(', ') : '\\text{žádné}'};\\ \\text{min: } ${min.length ? min.map(c => `x = ${qtex(c)}`).join(', ') : '\\text{žádné}'}`,
  ].filter(Boolean);
  return {
    text, tex, answerTex: ans.join(';\\quad '), steps, crit, max, min, inc: incSet, dec: decSet, f,
    card: () => ({ type: 'zform', key: 'p2', prompt: text, fn: tex, fields, steps, hint: "f'(x) = 0, pak znaménka derivace mezi nulovými body." }),
  };
}

// =====================================================================
// 3. limita
// =====================================================================
/** ans: Q | { inf: 1 | -1 } ; steps: hotové kroky z šablony */
export function limit({ text = 'Vypočtěte limitu', tex, ans, steps, fstr, x0 }) {
  const answer = ans.inf ? { inf: ans.inf } : { num: S.parse(qtxt(ans)) };
  const aTex = ans.inf ? (ans.inf > 0 ? '+\\infty' : '-\\infty') : qtex(ans);
  return {
    text, tex, answerTex: aTex, steps, fstr, x0, ans,
    card: () => ({ type: 'limit', key: 'p3', prompt: text, fn: tex, label: '$=$', answer, steps, hint: 'Typ 0/0: standardní limity, nebo l’Hospital.' }),
  };
}

// =====================================================================
// 4. Taylorův polynom 2. řádu
// =====================================================================
/** hezký zápis čísla: zlomek, nebo zlomek · e^k, zlomek · π */
export function niceVal(v) {
  const tryQ = x => { for (let q = 1; q <= 720; q++) { const p = Math.round(x * q); if (Math.abs(p - x * q) < 1e-9 * Math.max(1, Math.abs(x * q))) return Q(p, q); } return null; };
  let r = tryQ(v);
  if (r) return { q: r, tex: qtex(r), txt: qtxt(r), ast: S.parse(qtxt(r)), v };
  for (const k of [1, 2, 3]) {
    r = tryQ(v / Math.E ** k);
    if (r) {
      const e = k === 1 ? '\\mathrm{e}' : `\\mathrm{e}^{${k}}`, et = k === 1 ? 'e' : `e^${k}`;
      return { q: r, e: k, tex: r.q === 1 ? `${coefTex(r)}${e}` : `${qtex(r)}${e}`, txt: `${qtxt(r)}*${et}`, ast: S.parse(`(${qtxt(r)})*${et}`), v };
    }
  }
  throw new Error('niceVal: ' + v);
}
/** coefficient × (x − x0)^k pro zápis polynomu */
function termTex(val, k, x0Tex, first) {
  const plain = x0Tex === 'x';   // střed 0: x, x^2 bez závorek
  const base = k === 0 ? '' : k === 1 ? (plain ? 'x' : `\\left(${x0Tex}\\right)`) : plain ? 'x^{2}' : `\\left(${x0Tex}\\right)^{2}`;
  if (val.e) {
    const neg = val.q.p < 0, abs = { ...val, q: Q(Math.abs(val.q.p), val.q.q) };
    const t = niceVal(Math.abs(val.v)).tex;
    return `${first ? (neg ? '-' : '') : neg ? ' - ' : ' + '}${t}${base}`;
  }
  if (k === 0) return first ? qtex(val.q) : `${val.q.p < 0 ? ' - ' : ' + '}${qtex(Q(Math.abs(val.q.p), val.q.q))}`;
  return `${coefTex(val.q, first)}${base}`;
}
/**
 * f: sym řetězec, x0: sym řetězec (třeba '1/4', 'pi/2'), shift: TeX „x − x0“ (x - 1, x + 1, x - \frac{\pi}{2}),
 * d1Tex, d2Tex: TeX derivací (psané ručně, hezčí než automatické)
 */
export function taylor({ text = 'Určete Taylorův polynom 2. řádu funkce $f$ se středem v bodě $x_0$, je-li', tex, f, x0, shift, d1Tex, d2Tex, x0Tex }) {
  const F = S.parse(f), D1 = S.d(F), D2 = S.d(D1);
  const X0 = S.parse(x0), xv = S.ev(X0, 0);
  const v = [S.ev(F, xv), S.ev(D1, xv), S.ev(D2, xv)].map(niceVal);
  const half = niceVal(v[2].v / 2);
  const parts = [{ val: v[0], k: 0 }, { val: v[1], k: 1 }, { val: half, k: 2 }].filter(t => Math.abs(t.val.v) > 1e-12);
  const T2tex = parts.length ? parts.map((t, i) => termTex(t.val, t.k, shift, i === 0)).join('') : '0';
  const sx = S.sub(S.X, X0);
  const T2 = S.add(v[0].ast, S.mul(v[1].ast, sx), S.mul(half.ast, S.pow(sx, S.N(2))));
  const T2txt = `${v[0].txt} + (${v[1].txt})*(x - (${x0})) + (${half.txt})*(x - (${x0}))^2`;
  const steps = [
    'Vzorec: $T_2(x) = f(x_0) + f\'(x_0)(x - x_0) + \\frac{f\'\'(x_0)}{2}(x - x_0)^2$.',
    `$f'(x) = ${d1Tex}$, $\\;f''(x) = ${d2Tex}$`,
    `V bodě $x_0 = ${x0Tex}$: $f(x_0) = ${v[0].tex}$, $f'(x_0) = ${v[1].tex}$, $f''(x_0) = ${v[2].tex}$, takže $\\frac{f''(x_0)}{2} = ${half.tex}$.`,
    `$T_2(x) = ${T2tex}$`,
  ];
  const num = (label, val) => ({ kind: 'symnum', label, answer: val.v, tex: val.tex, text: val.txt, w: 2 });
  const fields = [num("$f(x_0) =$", v[0]), num("$f'(x_0) =$", v[1]), num("$f''(x_0) =$", v[2]),
    { kind: 'sym', label: '$T_2(x) =$', answer: T2, tex: T2tex, text: T2txt, w: 4 }];
  return {
    text, tex, answerTex: `T_2(x) = ${T2tex}`, steps, values: v, T2, fstr: f, x0v: xv,
    card: () => ({ type: 'zform', key: 'p4', prompt: text, fn: tex, fields, steps, hint: 'Dvakrát zderivuj, dosaď x₀ a dosaď do vzorce.' }),
  };
}

// =====================================================================
// 5. neurčitý integrál (substituce)
// =====================================================================
/** f, F: sym řetězce (integrand a jedna primitivní funkce), FTex: hezký TeX výsledku */
export function indefinite({ text = 'Vypočtěte', tex, f, F, FTex, steps }) {
  const fA = S.parse(f), FA = S.parse(F);
  const fields = [{ kind: 'anti', label: '$=$', f: fA, answer: FA, tex: `${FTex} + C`, text: F, w: 1 }];
  return {
    text, tex, answerTex: `${FTex} + C`, steps, f: fA, F: FA,
    card: () => ({ type: 'zform', key: 'p5', prompt: text, fn: tex, fields, steps, hint: 'Hledej funkci, jejíž derivace stojí vedle (až na číslo): substituce.' }),
  };
}

// =====================================================================
// 6. určitý integrál (rozdělit na mocniny)
// =====================================================================
/** b^r pro racionální r (výsledek musí být racionální) */
function powQ(b, r) {
  r = qq(r);
  const root = Math.round(b ** (1 / r.q));
  if (root ** r.q !== b) throw new Error(`powQ: ${b}^(1/${r.q}) není celé`);
  return r.p >= 0 ? qi(root ** r.p) : Q(1, root ** -r.p);
}
const monoTex = e => {
  e = qq(e);
  if (e.q === 1) return e.p === 1 ? 'x' : e.p === 0 ? '' : `x^{${e.p}}`;
  if (e.p === 1 && e.q === 2) return '\\sqrt{x}';
  return `x^{${qtex(e)}}`;
};
/** c · x^e jako člen součtu */
function powTermTex(c, e, first) {
  c = qq(c); e = qq(e);
  if (qv(e) === 0) return first ? qtex(c) : `${c.p < 0 ? ' - ' : ' + '}${qtex(Q(Math.abs(c.p), c.q))}`;
  if (qv(e) < 0) {
    const m = monoTex(qneg(e));
    const num = Q(Math.abs(c.p), c.q);
    const t = `\\frac{${num.p}}{${num.q === 1 ? '' : num.q}${m}}`;
    return `${first ? (c.p < 0 ? '-' : '') : c.p < 0 ? ' - ' : ' + '}${t}`;
  }
  return `${coefTex(c, first)}${monoTex(e)}`;
}
/** terms: [[c, e]] integrand = Σ c·x^e ; a, b: celé meze */
export function definite({ text = 'Vypočtěte', tex, terms, a, b, splitTex }) {
  let rat = qi(0), lnc = qi(0);
  const anti = [];
  for (const [c0, e0] of terms) {
    const c = qq(c0), e = qq(e0);
    if (qv(e) === -1) { lnc = qadd(lnc, c); anti.push({ ln: c }); continue; }
    const e1 = qadd(e, qi(1)), k = qdiv(c, e1);
    rat = qadd(rat, qmul(k, qsub(powQ(b, e1), powQ(a, e1))));
    anti.push({ c: k, e: e1 });
  }
  if (a !== 1 && !qz(lnc)) throw new Error('definite: ln jen pro dolní mez 1');
  const antiTex = anti.map((t, i) => (t.ln ? `${coefTex(t.ln, i === 0)}\\ln|x|` : powTermTex(t.c, t.e, i === 0))).join('');
  const resTex = [qz(rat) ? null : qtex(rat), qz(lnc) ? null : `${coefTex(lnc, qz(rat))}\\ln ${b}`].filter(Boolean).join('') || '0';
  const resTxt = [qz(rat) ? null : `(${qtxt(rat)})`, qz(lnc) ? null : `(${qtxt(lnc)})*ln(${b})`].filter(Boolean).join(' + ') || '0';
  const value = qv(rat) + qv(lnc) * Math.log(b);
  const integrand = terms.map(([c, e], i) => powTermTex(c, e, i === 0)).join('');
  const steps = [
    `Rozděl zlomek na součet mocnin${splitTex ? `: $${splitTex}$` : ''}: $${integrand}$`,
    `Primitivní funkce člen po členu ($\\int x^n\\,\\mathrm{d}x = \\frac{x^{n+1}}{n+1}$, $\\int \\frac{1}{x}\\,\\mathrm{d}x = \\ln|x|$): $F(x) = ${antiTex}$`,
    `Newton–Leibniz: $F(${b}) - F(${a}) = ${resTex}$${qz(lnc) ? '' : ` \\approx ${value.toFixed(4).replace('.', '{,}')}`}`,
  ];
  return {
    text, tex, answerTex: resTex, steps, value, a, b,
    fstr: terms.map(([c, e]) => `(${qtxt(qq(c))})*x^(${qtxt(qq(e))})`).join('+'),
    card: () => ({ type: 'zform', key: 'p6', prompt: text, fn: tex, fields: [{ kind: 'symnum', label: '$=$', answer: value, tex: resTex, text: resTxt, w: 1 }], steps, hint: 'Rozděl zlomek na mocniny x, zintegruj a dosaď meze: F(b) − F(a).' }),
  };
}

// =====================================================================
// praktická část (jiný formát): limita posloupnosti, asymptota, per partes
// =====================================================================
export function asymptote({ text, tex, k, q, steps }) {
  k = qq(k); q = qq(q);
  const ans = S.parse(`${qtxt(k)}*x + (${qtxt(q)})`);
  const aTex = `y = ${ptex([q, k])}`;
  return {
    text, tex, answerTex: aTex, steps,
    card: () => ({ type: 'zform', key: 'p8', prompt: text, fn: tex, fields: [{ kind: 'sym', label: '$y =$', answer: ans, tex: aTex.slice(4), text: `${qtxt(k)}*x + (${qtxt(q)})`, w: 1 }], steps, hint: 'k = lim f(x)/x, q = lim (f(x) − kx).' }),
  };
}
/** obecný příklad s číselným výsledkem (sym řetězec) */
export function numeric({ text, tex, value, valTex, valTxt, steps, key = 'p9' }) {
  return {
    text, tex, answerTex: valTex, steps,
    card: () => ({ type: 'zform', key, prompt: text, fn: tex, fields: [{ kind: 'symnum', label: '$=$', answer: value, tex: valTex, text: valTxt, w: 1 }], steps }),
  };
}
