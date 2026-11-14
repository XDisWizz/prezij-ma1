// Generátory příkladů pro cestu "Definiční obory".
// Každý generátor vrací kartu – pokaždé s jinými čísly.
import {
  R, ge, gt, le, lt, between, without, union, intersectAll, complement, mirror, toggleBrackets,
  frac, sqrtE, expE, toTex, equal, normalize, endpoints,
} from '../intervals.js';
import { ri, riNot, pick, shuffle } from '../ui.js';
import { numberLine, signTable } from '../numberline.js';

// ---------- formátování výrazů ----------
/** x - a */
export const sh = a => a === 0 ? 'x' : a > 0 ? `x - ${a}` : `x + ${-a}`;
/** ax + b */
export function lin(a, b) {
  const ax = a === 1 ? 'x' : a === -1 ? '-x' : `${a}x`;
  if (b === 0) return ax;
  if (a < 0 && b > 0) return `${b} - ${a === -1 ? 'x' : (-a) + 'x'}`;
  return `${ax} ${b < 0 ? '-' : '+'} ${Math.abs(b)}`;
}
const ax = a => a === 1 ? 'x' : a === -1 ? '-x' : `${a}x`;
/** A x^2 + p x + q, A = ±1 */
export function quad(A, p, q) {
  let s = A === 1 ? 'x^2' : '-x^2';
  if (p) s += ` ${p < 0 ? '-' : '+'} ${Math.abs(p) === 1 ? '' : Math.abs(p)}x`;
  if (q) s += ` ${q < 0 ? '-' : '+'} ${Math.abs(q)}`;
  return s;
}
const fac = r => r === 0 ? 'x' : `(${sh(r)})`;
const D = s => `$D(f) = ${toTex(s)}$`;
const flipRel = rel => ({ '\\ge': '\\le', '\\le': '\\ge', '>': '<', '<': '>' }[rel] || rel);
/** dosazení čísla do x - a */
const sub = (x, a) => a === 0 ? `${x}` : a > 0 ? `${x} - ${a}` : `${x} + ${-a}`;

function card(o) { return { type: 'interval', prompt: 'Urči definiční obor funkce', ...o }; }

// ---------- obrázek paraboly ----------
export function parabolaSvg(r1t, r2t, up = true) {
  const W = 220, H = 110, y0 = up ? 70 : 40, x1 = 70, x2 = 150;
  const k = (up ? 1 : -1) * 0.022;
  let d = '';
  for (let x = 30; x <= 190; x += 4) {
    const y = y0 - k * (x - x1) * (x - x2);
    d += (d ? 'L' : 'M') + x + ' ' + Math.max(4, Math.min(H - 4, y)).toFixed(1);
  }
  const s = up ? ['+', '−', '+'] : ['−', '+', '−'];
  return `<svg class="parabola" viewBox="0 0 ${W} ${H}" aria-hidden="true">
    <line class="nl-axis" x1="10" y1="${y0}" x2="${W - 10}" y2="${y0}"/>
    <path class="pb-curve" d="${d}"/>
    <circle class="nl-dot-in" cx="${x1}" cy="${y0}" r="4"/><circle class="nl-dot-in" cx="${x2}" cy="${y0}" r="4"/>
    <text class="nl-label" x="${x1 - 6}" y="${y0 + (up ? 18 : -9)}" text-anchor="end">${r1t}</text>
    <text class="nl-label" x="${x2 + 6}" y="${y0 + (up ? 18 : -9)}" text-anchor="start">${r2t}</text>
    <text class="pb-sign ${s[0] === '+' ? 'st-plus' : 'st-minus'}" x="36" y="${y0 + (s[0] === '+' ? -12 : 22)}">${s[0]}</text>
    <text class="pb-sign ${s[1] === '+' ? 'st-plus' : 'st-minus'}" x="110" y="${y0 + (s[1] === '+' ? -12 : 22)}" text-anchor="middle">${s[1]}</text>
    <text class="pb-sign ${s[2] === '+' ? 'st-plus' : 'st-minus'}" x="184" y="${y0 + (s[2] === '+' ? -12 : 22)}" text-anchor="end">${s[2]}</text>
  </svg>`;
}

// =====================================================================
// Generátory příkladů na výpočet (odpověď = interval)
// =====================================================================

export function linear(kind = pick(['sqrt', 'ln', 'frac'])) {
  const a = pick([1, 1, -1, 2, -2, 3, -3]);
  let b;
  if (Math.abs(a) > 1 && Math.random() < 0.35) { b = riNot(-7, 7, 0); if (b % a === 0) b += 1; }
  else b = -a * ri(-6, 6);
  const root = frac(-b, a);
  const g = lin(a, b);
  const f = kind === 'sqrt' ? `\\sqrt{${g}}` : kind === 'ln' ? `\\ln(${g})` : `\\frac{1}{${g}}`;
  const rel = kind === 'sqrt' ? '\\ge' : kind === 'ln' ? '>' : '\\ne';
  let ans;
  if (kind === 'frac') ans = without(R(), root);
  else { const c = kind === 'sqrt'; ans = a > 0 ? (c ? ge(root) : gt(root)) : (c ? le(root) : lt(root)); }
  const why = { sqrt: 'Pod sudou odmocninou nesmí být záporné číslo, takže', ln: 'Logaritmus umí jen kladná čísla, takže', frac: 'Jmenovatel nesmí být nula, takže' }[kind];
  const steps = [`${why} $${g} ${rel} 0$.`];
  if (b !== 0) steps.push(`Převedeme číslo na druhou stranu: $${ax(a)} ${rel} ${-b}$.`);
  if (a !== 1) {
    if (a < 0 && kind !== 'frac') steps.push(`Vydělíme číslem $${a}$. <b>Pozor:</b> dělíme záporným číslem, takže se znaménko nerovnosti otočí: $x ${flipRel(rel)} ${root.tex}$.`);
    else steps.push(`Vydělíme číslem $${a}$: $x ${rel} ${root.tex}$.`);
  }
  steps.push(`Zapíšeme jako interval: ${D(ans)}`);
  return card({
    key: 'linear', fn: `f(x) = ${f}`, answer: ans, steps,
    parts: [{ cond: `${g} ${rel} 0`, set: ans, how: steps.slice(1).join(' ') }],
    hint: { sqrt: 'Výraz pod odmocninou musí být ≥ 0.', ln: 'Výraz v logaritmu musí být > 0.', frac: 'Jmenovatel ≠ 0 – vyhodíme jediný bod.' }[kind],
  });
}

export function quadratic(kind = pick(['sqrt', 'ln', 'frac', 'sqrtNeg'])) {
  const r1 = ri(-5, 4), r2 = ri(r1 + 1, Math.min(r1 + 7, 6));
  const p = -(r1 + r2), q = r1 * r2;
  const A = kind === 'sqrtNeg' ? -1 : 1;
  const g = quad(A, A * p, A * q);
  const P = quad(1, p, q);
  const f = kind === 'ln' ? `\\ln(${g})` : kind === 'frac' ? `\\frac{1}{${g}}` : `\\sqrt{${g}}`;
  const F1 = frac(r1), F2 = frac(r2);
  let ans;
  if (kind === 'sqrt') ans = union(le(F1), ge(F2));
  else if (kind === 'ln') ans = union(lt(F1), gt(F2));
  else if (kind === 'sqrtNeg') ans = between(F1, F2);
  else ans = without(R(), F1, F2);
  const rel = kind === 'ln' ? '>' : kind === 'frac' ? '\\ne' : '\\ge';
  const steps = [`Podmínka: $${g} ${rel} 0$.`];
  if (A === -1) steps.push(`Vynásobíme $-1$ (znaménko se otočí), ať máme $x^2$ s plusem: $${P} \\le 0$.`);
  steps.push(`Najdeme kořeny. Hledáme dvě čísla, jejichž součin je $${q}$ a součet $${-p}$: to jsou $${r1}$ a $${r2}$. Tedy $${P} = ${fac(r1)}${fac(r2)}$.`);
  if (kind === 'frac') {
    steps.push(`Jmenovatel je nulový jen v kořenech, takže vyhodíme $x = ${r1}$ a $x = ${r2}$.`);
  } else {
    steps.push(`Parabola $y = ${P}$ je otevřená nahoru. Nad osou je <b>vně</b> kořenů, pod osou <b>mezi</b> nimi.${parabolaSvg(F1.txt, F2.txt)}`);
    const where = A === -1 ? 'mezi kořeny, včetně nich (≤)' : kind === 'ln' ? 'vně kořenů, bez nich (>)' : 'vně kořenů, včetně nich (≥)';
    steps.push(`Chceme ${where}.`);
  }
  steps.push(D(ans));
  return card({
    key: 'quadratic', fn: `f(x) = ${f}`, answer: ans, steps,
    parts: [{ cond: `${g} ${rel} 0`, set: ans, how: steps.slice(1, -1).join(' ') }],
    hint: kind === 'frac' ? 'Kdy je jmenovatel nula? Najdi kořeny.' : 'Najdi kořeny kvadratického výrazu a představ si parabolu.',
  });
}

export function rational(kind = pick(['sqrt', 'ln'])) {
  const a = ri(-5, 5), b = riNot(-5, 5, a);
  const fr = `\\frac{${sh(a)}}{${sh(b)}}`;
  const f = kind === 'sqrt' ? `\\sqrt{${fr}}` : `\\ln${fr}`;
  const m = Math.min(a, b), M = Math.max(a, b);
  const cl = v => kind === 'sqrt' && v === a;
  const ans = union(cl(m) ? le(frac(m)) : lt(frac(m)), cl(M) ? ge(frac(M)) : gt(frac(M)));
  const sg = r => [m, (m + M) / 2, M].map((_, i) => { const x = i === 0 ? m - 1 : i === 1 ? (m + M) / 2 : M + 1; return x - r > 0 ? '+' : '-'; });
  const sa = sg(a), sb = sg(b);
  const table = signTable([frac(m), frac(M)], [
    { label: sh(a), signs: sa }, { label: sh(b), signs: sb },
    { label: '\\text{zlomek}', signs: sa.map((s, i) => s === sb[i] ? '+' : '-'), result: true },
  ]);
  const steps = [
    kind === 'sqrt' ? `Pod odmocninou musí být $${fr} \\ge 0$ a navíc jmenovatel $\\ne 0$.` : `V logaritmu musí být $${fr} > 0$.`,
    `Nulové body: čitatel je nula pro $x = ${a}$, jmenovatel pro $x = ${b}$. Rozdělí osu na tři části.`,
    `V každé části zjistíme znaménko (stačí dosadit libovolné číslo z té části):${table}`,
    `Zlomek je kladný vně. ${kind === 'sqrt' ? `Bod $${a}$ (nula v čitateli) bereme, bod $${b}$ (nula ve jmenovateli) nikdy.` : 'Krajní body nebereme, chceme ostře > 0.'}`,
    D(ans),
  ];
  return card({ key: 'rational', fn: `f(x) = ${f}`, answer: ans, steps, parts: [{ cond: `${fr} ${kind === 'sqrt' ? '\\ge' : '>'} 0`, set: ans, how: steps.slice(1, -1).join(' ') }], hint: 'Tabulka znamének: nulové body čitatele i jmenovatele rozdělí osu na části.' });
}

export function ratShift() {
  const c = pick([1, 2, 3]), k = pick([-2, -1, 1, 2]);
  const d = k * (c + 1), root = c * k;
  const f = `\\ln\\left(${c} + \\frac{x}{${sh(d)}}\\right)`;
  const num = lin(c + 1, -c * d);
  const m = Math.min(root, d), M = Math.max(root, d);
  const ans = union(lt(frac(m)), gt(frac(M)));
  const sg = r => [m - 1, (m + M) / 2, M + 1].map(x => x - r > 0 ? '+' : '-');
  const sa = sg(root), sb = sg(d);
  const steps = [
    `Logaritmus: $${c} + \\frac{x}{${sh(d)}} > 0$ (a jmenovatel $\\ne 0$).`,
    `Sečteme na společný jmenovatel: $${c} + \\frac{x}{${sh(d)}} = \\frac{${c}(${sh(d)}) + x}{${sh(d)}} = \\frac{${num}}{${sh(d)}}$.`,
    `Čitatel je nula pro $x = ${root}$, jmenovatel pro $x = ${d}$.`,
    `Tabulka znamének:${signTable([frac(m), frac(M)], [{ label: num, signs: sa }, { label: sh(d), signs: sb }, { label: '\\text{zlomek}', signs: sa.map((s, i) => s === sb[i] ? '+' : '-'), result: true }])}`,
    `Kladné je to vně, krajní body nebereme. ${D(ans)}`,
  ];
  return card({ key: 'ratShift', fn: `f(x) = ${f}`, answer: ans, steps, parts: [{ cond: `${c} + \\frac{x}{${sh(d)}} > 0`, set: ans, how: steps.slice(1).join(' ') }], hint: 'Nejdřív sečti na jeden zlomek, pak tabulka znamének.' });
}

export function absDist(kind = pick(['logLess', 'sqrtLess', 'sqrtMore'])) {
  const c = ri(-5, 5), r = ri(1, 4);
  const flip = c > 0 && Math.random() < 0.5;
  const inner = flip ? `|${lin(-1, c)}|` : `|${sh(c)}|`;
  const base = pick([2, 3, 10]);
  let f, ans, rel;
  if (kind === 'logLess') { f = `\\log_{${base}}(${r} - ${inner})`; ans = between(frac(c - r), frac(c + r), false, false); rel = '<'; }
  else if (kind === 'sqrtLess') { f = `\\sqrt{${r} - ${inner}}`; ans = between(frac(c - r), frac(c + r)); rel = '\\le'; }
  else { f = `\\sqrt{${inner} - ${r}}`; ans = union(le(frac(c - r)), ge(frac(c + r))); rel = '\\ge'; }
  const steps = [
    kind === 'logLess' ? `Logaritmus: $${r} - ${inner} > 0$, tedy $${inner} < ${r}$.`
      : kind === 'sqrtLess' ? `Odmocnina: $${r} - ${inner} \\ge 0$, tedy $${inner} \\le ${r}$.`
        : `Odmocnina: $${inner} - ${r} \\ge 0$, tedy $${inner} \\ge ${r}$.`,
  ];
  if (flip) steps.push(`$${inner} = |${sh(c)}|$ (v absolutní hodnotě můžeme prohodit pořadí).`);
  steps.push(`$|${sh(c)}|$ je <b>vzdálenost</b> čísla $x$ od čísla $${c}$ na ose.`);
  steps.push(rel === '\\ge'
    ? `Vzdálenost od $${c}$ má být aspoň $${r}$, takže $x$ je nejvýš $${c - r}$, nebo aspoň $${c + r}$.`
    : `Vzdálenost od $${c}$ má být ${rel === '<' ? 'menší než' : 'nejvýš'} $${r}$, takže $x$ leží mezi $${c - r}$ a $${c + r}$.`);
  steps.push(D(ans));
  const pc = kind === 'logLess' ? `${r} - ${inner} > 0` : kind === 'sqrtLess' ? `${r} - ${inner} \\ge 0` : `${inner} - ${r} \\ge 0`;
  return card({ key: 'absDist', fn: `f(x) = ${f}`, answer: ans, steps, parts: [{ cond: pc, set: ans, how: steps.join(' ') }], hint: '|x − c| = vzdálenost x od čísla c.' });
}

export function absCompare() {
  const a = ri(-4, 4), b = riNot(-4, 4, a);
  const mid = frac(a + b, 2);
  const f = `\\sqrt{|${sh(a)}| - |${sh(b)}|}`;
  const ans = b < a ? le(mid) : ge(mid);
  const steps = [
    `Odmocnina: $|${sh(a)}| - |${sh(b)}| \\ge 0$, tedy $|${sh(a)}| \\ge |${sh(b)}|$.`,
    `Slovy: číslo $x$ má být od $${a}$ <b>aspoň tak daleko</b> jako od $${b}$.`,
    `Přesně v půlce mezi $${a}$ a $${b}$, tedy v bodě $${mid.tex}$, jsou obě vzdálenosti stejné. Na straně čísla $${b}$ je $x$ blíž k $${b}$, takže podmínka platí.`,
    D(ans),
  ];
  return card({ key: 'absCompare', fn: `f(x) = ${f}`, answer: ans, steps, parts: [{ cond: `|${sh(a)}| - |${sh(b)}| \\ge 0`, set: ans, how: steps.slice(1, -1).join(' ') }], hint: 'Porovnáváš dvě vzdálenosti. Kde jsou stejné?' });
}

export function arcLin() {
  const a = pick([1, 1, 2, -1, 3, -2]), b = ri(-4, 4);
  const name = pick(['\\arcsin', '\\arccos']);
  const lo = frac(-1 - b, a), hi = frac(1 - b, a);
  const [L, H] = lo.v < hi.v ? [lo, hi] : [hi, lo];
  const ans = between(L, H);
  const coef = pick(['', '', '2', '3']);
  const g = lin(a, b);
  const steps = [
    `$${name}$ umí zpracovat jen čísla od $-1$ do $1$: $-1 \\le ${g} \\le 1$.`,
  ];
  if (b !== 0) steps.push(`Odečteme $${b}$ všude: $${-1 - b} \\le ${ax(a)} \\le ${1 - b}$.`);
  if (a !== 1) steps.push(a < 0 ? `Vydělíme $${a}$. Záporné číslo, takže se otočí znaménka: $${H.tex} \\ge x \\ge ${L.tex}$.` : `Vydělíme $${a}$: $${L.tex} \\le x \\le ${H.tex}$.`);
  steps.push(D(ans));
  return card({ key: 'arcLin', fn: `f(x) = ${coef}${name}(${g})`, answer: ans, steps, parts: [{ cond: `-1 \\le ${g} \\le 1`, set: ans, how: steps.slice(1, -1).join(' ') }], hint: 'Vnitřek musí být mezi −1 a 1 (včetně).' });
}

export function arcRecip() {
  const c = ri(-4, 4);
  const name = pick(['\\arcsin', '\\arccos']);
  const ans = union(le(frac(-c - 1)), ge(frac(-c + 1)));
  const xc = sh(-c);
  const steps = [
    `Potřebujeme $-1 \\le \\frac{1}{${xc}} \\le 1$ a jmenovatel $\\ne 0$.`,
    `Zlomek $\\frac{1}{t}$ je mezi $-1$ a $1$ přesně tehdy, když $|t| \\ge 1$ (čím větší jmenovatel, tím menší zlomek).`,
    `Takže $|${xc}| \\ge 1$. To je vzdálenost od $${-c}$ aspoň $1$: $x \\le ${-c - 1}$ nebo $x \\ge ${-c + 1}$.`,
    D(ans),
  ];
  return card({ key: 'arcRecip', fn: `f(x) = ${pick(['', '2'])}${name}\\frac{1}{${xc}}`, answer: ans, steps, parts: [{ cond: `-1 \\le \\frac{1}{${xc}} \\le 1`, set: ans, how: steps.slice(1, -1).join(' ') }], hint: 'Kdy je 1/t mezi −1 a 1? Zkus dosadit t = 2, t = 0.5.' });
}

export function arccosQuad() {
  const r = ri(-3, 3);
  const p = -(2 * r + 1), q = r * (r + 1) - 1;
  const g = quad(1, p, q);
  const name = pick(['\\arccos', '\\arcsin']);
  const A1 = union(le(frac(r)), ge(frac(r + 1)));
  const A2 = between(frac(r - 1), frac(r + 2));
  const ans = intersectAll(A1, A2);
  const pts = endpoints(A1, A2);
  const steps = [
    `Potřebujeme $-1 \\le ${g} \\le 1$. To jsou dvě nerovnice a musí platit obě.`,
    `① $${g} \\ge -1$, tedy $${quad(1, p, q + 1)} \\ge 0$, tedy $${fac(r)}${fac(r + 1)} \\ge 0$: platí vně, $x \\le ${r}$ nebo $x \\ge ${r + 1}$.${numberLine(A1, { extra: pts, label: '①' })}`,
    `② $${g} \\le 1$, tedy $${quad(1, p, q - 1)} \\le 0$, tedy $${fac(r - 1)}${fac(r + 2)} \\le 0$: platí mezi, $${r - 1} \\le x \\le ${r + 2}$.${numberLine(A2, { extra: pts, label: '②' })}`,
    `Obě zároveň (průnik): ${D(ans)}`,
  ];
  return card({
    key: 'arccosQuad', fn: `f(x) = ${name}(${g})`, answer: ans, steps,
    parts: [{ cond: `${g} \\ge -1`, set: A1, how: steps[1] }, { cond: `${g} \\le 1`, set: A2, how: steps[2] }],
    fakes: [`${g} > 0`, `${g} \\ge 0`], hint: 'Rozděl na dvě nerovnice: ≥ −1 a ≤ 1.' });
}

export function logInside(kind = pick(['lnMinusLn', 'arcLn', 'lnArc', 'sqrtLn', 'recipLn', 'recipLogQuad', 'expRoot'])) {
  let f, ans, steps, hint, parts;
  if (kind === 'lnMinusLn') {
    const c = pick([0, 1, 1, 2, -1]);
    f = c === 0 ? `\\ln(-\\ln x)` : `\\ln(${c} - \\ln x)`;
    ans = between(frac(0), expE(c), false, false);
    parts = [{ cond: 'x > 0', set: gt(frac(0)), how: 'Rovnou: $x > 0$.' },
      { cond: `${c === 0 ? '-\\ln x' : c + ' - \\ln x'} > 0`, set: lt(expE(c)), how: `$\\ln x < ${c}$, tedy $x < ${expE(c).tex}$.` }];
    steps = [
      `Vnitřní logaritmus: $x > 0$.`,
      `Vnější logaritmus: $${c === 0 ? '-\\ln x' : c + ' - \\ln x'} > 0$, tedy $\\ln x < ${c}$.`,
      `$\\ln x < ${c}$ platí pro $x < ${expE(c).tex}$ (logaritmus roste, „odlogaritmujeme“ pomocí $\\mathrm{e}$).`,
      `Obě podmínky dohromady: ${D(ans)}`,
    ];
    hint = 'ln x < c ⇔ 0 < x < eᶜ';
  } else if (kind === 'arcLn') {
    const c = pick([0, 0, 1]);
    const name = pick(['\\arcsin', '\\arccos']);
    const inner = c === 0 ? '\\ln x' : `\\ln x - ${c}`;
    f = `${name}(${inner})`;
    ans = between(expE(c - 1), expE(c + 1));
    parts = [{ cond: 'x > 0', set: gt(frac(0)), how: 'Rovnou: $x > 0$.' },
      { cond: `-1 \\le ${inner} \\le 1`, set: ans, how: `$${c - 1} \\le \\ln x \\le ${c + 1}$, tedy $${expE(c - 1).tex} \\le x \\le ${expE(c + 1).tex}$.` }];
    steps = [
      `Logaritmus: $x > 0$.`,
      `$${name}$: $-1 \\le ${inner} \\le 1$${c ? `, tedy $${c - 1} \\le \\ln x \\le ${c + 1}$` : ''}.`,
      `„Odlogaritmujeme“: $${expE(c - 1).tex} \\le x \\le ${expE(c + 1).tex}$ (tohle už je kladné, takže $x > 0$ platí samo).`,
      D(ans),
    ];
    hint = 'Nejdřív ln x mezi dvěma čísly, pak e na obě strany.';
  } else if (kind === 'lnArc') {
    const cos = Math.random() < 0.4;
    f = cos ? `\\ln(\\arccos x)` : `\\ln(\\arcsin x)`;
    ans = cos ? between(frac(-1), frac(1), true, false) : between(frac(0), frac(1), false, true);
    parts = [{ cond: '-1 \\le x \\le 1', set: between(frac(-1), frac(1)), how: 'Rovnou: $\\langle -1, 1\\rangle$.' },
      cos ? { cond: '\\arccos x > 0', set: lt(frac(1)), how: 'Arkuskosinus je nula jen v $x = 1$, takže $x < 1$.' }
        : { cond: '\\arcsin x > 0', set: gt(frac(0)), how: 'Arkussinus má stejné znaménko jako $x$, takže $x > 0$.' }];
    steps = cos ? [
      `$\\arccos$: $-1 \\le x \\le 1$.`,
      `Logaritmus: $\\arccos x > 0$. Arkuskosinus je nula jen v bodě $x = 1$, jinde kladný.`,
      `Takže vyhodíme $x = 1$: ${D(ans)}`,
    ] : [
      `$\\arcsin$: $-1 \\le x \\le 1$.`,
      `Logaritmus: $\\arcsin x > 0$. Arkussinus je kladný přesně pro $x > 0$ (má stejné znaménko jako $x$).`,
      `Dohromady $0 < x \\le 1$: ${D(ans)}`,
    ];
    hint = 'Vnitřek: −1 ≤ x ≤ 1. Pak: kdy je arcsin/arccos kladný?';
  } else if (kind === 'sqrtLn') {
    const a = ri(-3, 3);
    f = `\\sqrt{\\ln(${sh(a)})}`;
    ans = ge(frac(a + 1));
    parts = [{ cond: `${sh(a)} > 0`, set: gt(frac(a)), how: `$x > ${a}$.` },
      { cond: `\\ln(${sh(a)}) \\ge 0`, set: ge(frac(a + 1)), how: `$\\ln t \\ge 0$ pro $t \\ge 1$: $${sh(a)} \\ge 1$, tedy $x \\ge ${a + 1}$.` }];
    steps = [
      `Logaritmus: $${sh(a)} > 0$.`,
      `Odmocnina: $\\ln(${sh(a)}) \\ge 0$. Logaritmus je $\\ge 0$, když je jeho vnitřek $\\ge 1$: $${sh(a)} \\ge 1$, tedy $x \\ge ${a + 1}$.`,
      `To už zahrnuje i první podmínku. ${D(ans)}`,
    ];
    hint = 'ln t ≥ 0 ⇔ t ≥ 1';
  } else if (kind === 'recipLn') {
    const a = ri(-3, 3);
    f = `\\frac{1}{\\ln(${sh(a)})}`;
    ans = without(gt(frac(a)), frac(a + 1));
    parts = [{ cond: `${sh(a)} > 0`, set: gt(frac(a)), how: `$x > ${a}$.` },
      { cond: `\\ln(${sh(a)}) \\ne 0`, set: without(R(), frac(a + 1)), how: `$\\ln t = 0$ jen pro $t = 1$: $${sh(a)} \\ne 1$, tedy $x \\ne ${a + 1}$.` }];
    steps = [
      `Logaritmus: $${sh(a)} > 0$, tedy $x > ${a}$.`,
      `Jmenovatel: $\\ln(${sh(a)}) \\ne 0$. Logaritmus je nula, když je vnitřek $1$: $${sh(a)} \\ne 1$, tedy $x \\ne ${a + 1}$.`,
      D(ans),
    ];
    hint = 'ln t = 0 právě pro t = 1.';
  } else if (kind === 'recipLogQuad') {
    const c = pick([1, 2, 3]), base = pick([2, 3, 5]);
    const s = sqrtE(c * c + 1);
    f = `\\frac{1}{\\log_{${base}}(x^2 - ${c * c})}`;
    ans = without(union(lt(frac(-c)), gt(frac(c))), sqrtE(c * c + 1, -1), s);
    parts = [{ cond: `x^2 - ${c * c} > 0`, set: union(lt(frac(-c)), gt(frac(c))), how: `Parabola s kořeny $\\pm ${c}$, kladná vně.` },
      { cond: `\\log_{${base}}(x^2 - ${c * c}) \\ne 0`, set: without(R(), sqrtE(c * c + 1, -1), s), how: `$x^2 - ${c * c} \\ne 1$, tedy $x \\ne \\pm ${s.tex}$.` }];
    steps = [
      `Logaritmus: $x^2 - ${c * c} > 0$, tedy $x^2 > ${c * c}$: $x < ${-c}$ nebo $x > ${c}$.`,
      `Jmenovatel: $\\log_{${base}}(x^2 - ${c * c}) \\ne 0$, tedy $x^2 - ${c * c} \\ne 1$, tedy $x^2 \\ne ${c * c + 1}$, tedy $x \\ne \\pm ${s.tex}$.`,
      `Z první podmínky vyhodíme ty dva body: ${D(ans)}`,
    ];
    hint = 'Dvě podmínky: vnitřek logaritmu > 0 a logaritmus ≠ 0.';
  } else {
    const k = pick([2, 3, -2, -3]), base = pick([2, 3, '\\mathrm{e}']);
    f = `${base}^{\\frac{1}{\\sqrt{${k}x}}}`;
    ans = k > 0 ? gt(frac(0)) : lt(frac(0));
    parts = [{ cond: `${k}x > 0`, set: ans, how: k < 0 ? 'Dělíme záporným, otočíme: $x < 0$.' : '$x > 0$.' }];
    steps = [
      `Mocnina $${base}^{\\text{cokoliv}}$ je v pohodě, hlídáme jen exponent.`,
      `V exponentu je odmocnina ve jmenovateli: $${k}x > 0$ (≥ 0 kvůli odmocnině a ≠ 0 kvůli zlomku).`,
      `${k < 0 ? `Dělíme záporným, otočíme znaménko: $x < 0$.` : `Tedy $x > 0$.`} ${D(ans)}`,
    ];
    hint = 'Exponenciála nevadí. Co je v exponentu?';
  }
  return card({ key: 'logInside', fn: `f(x) = ${f}`, answer: ans, steps, hint, parts });
}

// ---------- kombinace (průnik podmínek) ----------
export const PIECES = [
  () => { const a = ri(-5, 5); return { tex: `\\sqrt{${sh(a)}}`, cond: `${sh(a)} \\ge 0`, set: ge(frac(a)), why: 'sudá odmocnina' }; },
  () => { const a = ri(-5, 5); return { tex: `\\ln(${sh(a)})`, cond: `${sh(a)} > 0`, set: gt(frac(a)), why: 'logaritmus' }; },
  () => { const b = ri(1, 6); return { tex: `\\ln(${lin(-1, b)})`, cond: `${lin(-1, b)} > 0`, set: lt(frac(b)), why: 'logaritmus' }; },
  () => { const a = ri(-5, 5); return { tex: `\\frac{1}{${sh(a)}}`, cond: `${sh(a)} \\ne 0`, set: without(R(), frac(a)), why: 'zlomek' }; },
  () => { const a = ri(1, 4); return { tex: `\\frac{1}{x^2 - ${a * a}}`, cond: `x^2 - ${a * a} \\ne 0`, set: without(R(), frac(-a), frac(a)), why: 'zlomek' }; },
  () => { const a = ri(-5, 5); return { tex: `\\sqrt[3]{${sh(a)}}`, cond: null, fake: `${sh(a)} \\ge 0`, set: R(), why: 'lichá odmocnina, žádná podmínka' }; },
  () => { const a = ri(1, 5), k = pick([1, 2, 3]); return { tex: `\\mathrm{e}^{${lin(k, a)}}`, cond: null, fake: `${lin(k, a)} > 0`, set: R(), why: 'exponenciála, žádná podmínka' }; },
  () => { const a = ri(1, 4); return { tex: `\\sqrt{${a * a} - x^2}`, cond: `${a * a} - x^2 \\ge 0`, set: between(frac(-a), frac(a)), why: 'sudá odmocnina' }; },
  () => { const a = ri(-4, 4); return { tex: `\\arcsin(${sh(a)})`, cond: `-1 \\le ${sh(a)} \\le 1`, set: between(frac(a - 1), frac(a + 1)), why: 'arkussinus' }; },
  () => { const a = ri(-5, 5); return { tex: `\\frac{1}{\\sqrt[3]{${sh(a)}}}`, cond: `${sh(a)} \\ne 0`, set: without(R(), frac(a)), why: 'lichá odmocnina nevadí, ale je ve jmenovateli' }; },
  () => { const a = ri(-5, 5); return { tex: `\\frac{1}{\\sqrt{${sh(a)}}}`, cond: `${sh(a)} > 0`, set: gt(frac(a)), why: 'sudá odmocnina ve jmenovateli, takže ostře větší' }; },
  () => { const k = ri(2, 4); return { tex: `\\sin(${k}x)`, cond: null, fake: `${k}x \\ne 0`, set: R(), why: 'sinus, žádná podmínka' }; },
];

function comboPieces() {
  for (let t = 0; t < 200; t++) {
    const n = pick([2, 2, 3]);
    const idx = shuffle([...PIECES.keys()]).slice(0, n);
    const ps = idx.map(i => PIECES[i]());
    if (!ps.some(p => p.cond)) continue;
    const ans = intersectAll(...ps.map(p => p.set));
    if (!ans.length || ans.length > 4) continue;
    if (equal(ans, R())) continue;
    return { ps, ans };
  }
}

export function combo() {
  const { ps, ans } = comboPieces();
  const pts = endpoints(ans, ...ps.map(p => p.set));
  const steps = [`Každá část má svou podmínku a musí platit všechny najednou.`];
  for (const p of ps) {
    steps.push(p.cond
      ? `$${p.tex}$ (${p.why}): $${p.cond}$${numberLine(p.set, { extra: pts })}`
      : `$${p.tex}$: ${p.why} ✓`);
  }
  steps.push(`Průnik (co platí všude zároveň): ${D(ans)}${numberLine(ans, { extra: pts })}`);
  return card({ key: 'combo', fn: `f(x) = ${ps.map(p => p.tex).join(' + ')}`, answer: ans, steps, hint: 'Každý kousek zvlášť, pak průnik.', pieces: ps,
    parts: ps.filter(p => p.cond).map(p => ({ cond: p.cond, set: p.set, how: `$${p.tex}$: ${p.why}.` })),
    fakes: ps.filter(p => !p.cond).map(p => ({ cond: p.fake, why: `$${p.tex}$: ${p.why}.` })),
  });
}

export function multiCond() {
  const { ps } = comboPieces();
  const opts = [];
  for (const p of ps) {
    if (p.cond) opts.push({ label: `$${p.cond}$`, correct: true, why: `Ano, kvůli: $${p.tex}$ (${p.why}).` });
    else opts.push({ label: `$${p.fake}$`, correct: false, why: `$${p.tex}$: ${p.why}.` });
  }
  // dvě části můžou dát stejnou podmínku (ln(x+2) a 1/√(x+2)): v nabídce ji necháme jen jednou
  const uniq = opts.filter((o, i) => opts.findIndex(p => p.label === o.label) === i).map(o => ({ ...o, correct: opts.some(p => p.label === o.label && p.correct) }));
  // když zbyde jediná podmínka, přidáme k ní „skoro správnou“ (≥ místo >), ať je z čeho vybírat
  if (uniq.length < 2) { const s = swapRel(uniq[0].label.slice(1, -1)); if (s) uniq.push({ label: `$${s.cond}$`, correct: false, why: s.why }); }
  if (uniq.length < 4) uniq.push({ label: 'žádná podmínka není potřeba', correct: false, why: 'Aspoň jedna část podmínku má.' });
  return {
    type: 'multi', key: 'multiCond', prompt: `Zaškrtni <b>všechny</b> podmínky, které musíš hlídat:`,
    context: `f(x) = ${ps.map(p => p.tex).join(' + ')}`, options: shuffle(uniq),
  };
}

// =====================================================================
// Pevné příklady ze Série 1 a z videí
// =====================================================================
const S2 = sqrtE(2), mS2 = sqrtE(2, -1);
export const FIXED = {
  du1: () => card({
    key: 'du1', badge: 'Série 1', fn: 'f(x) = \\frac{1}{\\log_5(x^2-1)}',
    answer: without(union(lt(frac(-1)), gt(frac(1))), mS2, S2),
    steps: ['Logaritmus: $x^2 - 1 > 0$: $x < -1$ nebo $x > 1$.', 'Jmenovatel: $\\log_5(x^2-1) \\ne 0$, tedy $x^2 - 1 \\ne 1$, tedy $x \\ne \\pm\\sqrt{2}$.',
      'Dohromady: $D(f) = (-\\infty, -\\sqrt{2}) \\cup (-\\sqrt{2}, -1) \\cup (1, \\sqrt{2}) \\cup (\\sqrt{2}, +\\infty)$'],
    hint: 'Logaritmus > 0 uvnitř a zároveň ≠ 0 (je ve jmenovateli).',
  }),
  du2: () => card({
    key: 'du2', badge: 'Série 1', fn: 'f(x) = \\sqrt{|x-2| - |x+2|}', answer: le(frac(0)),
    steps: ['$|x-2| \\ge |x+2|$: vzdálenost od $2$ je aspoň taková jako od $-2$.', 'V půlce (v bodě $0$) jsou stejné. Na straně čísla $-2$ je $x$ blíž k $-2$, takže podmínka platí.', '$D(f) = (-\\infty, 0\\rangle$'],
    hint: 'Porovnej dvě vzdálenosti.',
  }),
  du3: () => card({
    key: 'du3', badge: 'Série 1', fn: 'f(x) = 2\\arcsin\\frac{1}{x+2}', answer: union(le(frac(-3)), ge(frac(-1))),
    steps: ['$-1 \\le \\frac{1}{x+2} \\le 1$ a $x \\ne -2$.', 'To platí, když $|x+2| \\ge 1$: $x \\le -3$ nebo $x \\ge -1$.', '$D(f) = (-\\infty, -3\\rangle \\cup \\langle -1, +\\infty)$'],
    hint: 'Kdy je 1/t mezi −1 a 1?',
  }),
  du4: () => card({
    key: 'du4', badge: 'Série 1', fn: 'f(x) = \\frac{1}{\\sqrt[3]{x^2-4}} + \\mathrm{e}^{3x+1} + \\frac{\\sqrt{x+3}}{x^2+x-6}',
    answer: without(ge(frac(-3)), frac(-3), frac(-2), frac(2)),
    steps: ['$\\frac{1}{\\sqrt[3]{x^2-4}}$: lichá odmocnina nevadí, ale jmenovatel $\\ne 0$, tedy $x \\ne \\pm 2$.', '$\\mathrm{e}^{3x+1}$: žádná podmínka.',
      '$\\sqrt{x+3}$: $x \\ge -3$.', '$x^2 + x - 6 = (x+3)(x-2) \\ne 0$, tedy $x \\ne -3$ a $x \\ne 2$.', '$D(f) = (-3, -2) \\cup (-2, 2) \\cup (2, +\\infty)$'],
    hint: 'Projdi každý ze tří sčítanců zvlášť.',
  }),
  du6: () => card({
    key: 'du6', badge: 'Série 1', fn: 'f(x) = 2^{\\frac{1}{\\sqrt{3x}}}', answer: gt(frac(0)),
    steps: ['$2^{\\text{cokoliv}}$ nevadí, hlídáme exponent.', 'Odmocnina ve jmenovateli: $3x > 0$.', '$D(f) = (0, +\\infty)$'], hint: 'Co je v exponentu?',
  }),
  du7: () => card({
    key: 'du7', badge: 'Série 1', fn: 'f(x) = \\log_2(1 - |3-x|)', answer: between(frac(2), frac(4), false, false),
    steps: ['$1 - |3 - x| > 0$, tedy $|x - 3| < 1$.', 'Vzdálenost od $3$ je menší než $1$.', '$D(f) = (2, 4)$'], hint: '|3 − x| = |x − 3| = vzdálenost od 3.',
  }),
  du8: () => card({
    key: 'du8', badge: 'Série 1', fn: 'f(x) = \\ln(1 - \\ln x)', answer: between(frac(0), expE(1), false, false),
    steps: ['$x > 0$ kvůli vnitřnímu logaritmu.', '$1 - \\ln x > 0$, tedy $\\ln x < 1$, tedy $x < \\mathrm{e}$.', '$D(f) = (0, \\mathrm{e})$'], hint: 'Dva logaritmy, dvě podmínky.',
  }),
  v1: () => card({
    key: 'v1', badge: 'Z videa', fn: 'f(x) = \\frac{\\sqrt{x^2-x-6}}{1-\\sqrt{x+4}}',
    answer: union(between(frac(-4), frac(-3), true, false), between(frac(-3), frac(-2), false, true), ge(frac(3))),
    steps: ['$x^2 - x - 6 = (x+2)(x-3) \\ge 0$: $x \\le -2$ nebo $x \\ge 3$.', '$x + 4 \\ge 0$: $x \\ge -4$.', 'Jmenovatel: $1 - \\sqrt{x+4} \\ne 0$, tedy $\\sqrt{x+4} \\ne 1$, tedy $x \\ne -3$.',
      '$D(f) = \\langle -4, -3) \\cup (-3, -2\\rangle \\cup \\langle 3, +\\infty)$'],
    hint: 'Tři podmínky: dvě odmocniny a jmenovatel.',
  }),
  v2: () => card({
    key: 'v2', badge: 'Z videa', fn: 'f(x) = \\ln\\left(3 + \\frac{x}{x-1}\\right)', answer: union(lt(frac(3, 4)), gt(frac(1))),
    steps: ['$3 + \\frac{x}{x-1} = \\frac{4x - 3}{x - 1} > 0$.', 'Nulové body: $\\frac{3}{4}$ a $1$. Zlomek je kladný vně.', '$D(f) = (-\\infty, \\frac{3}{4}) \\cup (1, +\\infty)$'],
    hint: 'Společný jmenovatel, pak tabulka znamének.',
  }),
  v3: () => card({
    key: 'v3', badge: 'Z videa', fn: 'f(x) = \\arccos(x^2 + x - 1)', answer: union(between(frac(-2), frac(-1)), between(frac(0), frac(1))),
    steps: ['$x^2 + x - 1 \\ge -1$: $x(x+1) \\ge 0$, tedy $x \\le -1$ nebo $x \\ge 0$.', '$x^2 + x - 1 \\le 1$: $(x+2)(x-1) \\le 0$, tedy $-2 \\le x \\le 1$.', '$D(f) = \\langle -2, -1\\rangle \\cup \\langle 0, 1\\rangle$'],
    hint: 'Dvě nerovnice, pak průnik.',
  }),
  v4a: () => card({
    key: 'v4a', badge: 'Z videa', fn: 'f(x) = \\ln(\\arcsin x)', answer: between(frac(0), frac(1), false, true),
    steps: ['$-1 \\le x \\le 1$ kvůli arcsin.', '$\\arcsin x > 0$ pro $x > 0$.', '$D(f) = (0, 1\\rangle$'], hint: 'Kdy je arcsin kladný?',
  }),
  v4b: () => card({
    key: 'v4b', badge: 'Z videa', fn: 'f(x) = \\arcsin(\\ln x)', answer: between(expE(-1), expE(1)),
    steps: ['$x > 0$ kvůli ln.', '$-1 \\le \\ln x \\le 1$, tedy $\\frac{1}{\\mathrm{e}} \\le x \\le \\mathrm{e}$.', '$D(f) = \\langle \\frac{1}{\\mathrm{e}}, \\mathrm{e}\\rangle$'], hint: 'ln x mezi −1 a 1.',
  }),
};

// rozpad pevných příkladů na podmínky (pro řešení po krocích)
const FP = {
  du1: [['x^2 - 1 > 0', union(lt(frac(-1)), gt(frac(1)))], ['\\log_5(x^2-1) \\ne 0', without(R(), mS2, S2)]],
  du2: [['|x-2| - |x+2| \\ge 0', le(frac(0))]],
  du3: [['-1 \\le \\frac{1}{x+2} \\le 1', union(le(frac(-3)), ge(frac(-1)))]],
  du4: [['x^2 - 4 \\ne 0', without(R(), frac(-2), frac(2))], ['x + 3 \\ge 0', ge(frac(-3))], ['x^2 + x - 6 \\ne 0', without(R(), frac(-3), frac(2))]],
  du6: [['3x > 0', gt(frac(0))]],
  du7: [['1 - |3-x| > 0', between(frac(2), frac(4), false, false)]],
  du8: [['x > 0', gt(frac(0))], ['1 - \\ln x > 0', lt(expE(1))]],
  v1: [['x^2 - x - 6 \\ge 0', union(le(frac(-2)), ge(frac(3)))], ['x + 4 \\ge 0', ge(frac(-4))], ['1 - \\sqrt{x+4} \\ne 0', without(R(), frac(-3))]],
  v2: [['3 + \\frac{x}{x-1} > 0', union(lt(frac(3, 4)), gt(frac(1)))]],
  v3: [['x^2 + x - 1 \\ge -1', union(le(frac(-1)), ge(frac(0)))], ['x^2 + x - 1 \\le 1', between(frac(-2), frac(1))]],
  v4a: [['-1 \\le x \\le 1', between(frac(-1), frac(1))], ['\\arcsin x > 0', gt(frac(0))]],
  v4b: [['x > 0', gt(frac(0))], ['-1 \\le \\ln x \\le 1', between(expE(-1), expE(1))]],
};
const FAKES = {
  du4: [{ cond: '3x + 1 > 0', why: '$\\mathrm{e}^{3x+1}$ zvládne cokoliv.' }, { cond: 'x^2 - 4 \\ge 0', why: 'Lichá odmocnina snese i záporná čísla, hlídá se jen jmenovatel.' }],
  du6: [{ cond: '\\frac{1}{\\sqrt{3x}} > 0', why: 'Exponent může být jakékoliv číslo.' }],
};
for (const [k, ps] of Object.entries(FP)) {
  const f0 = FIXED[k];
  FIXED[k] = () => ({ ...f0(), parts: ps.map(([cond, set]) => ({ cond, set })), fakes: FAKES[k] });
}

// =====================================================================
// Řešení po krocích: podmínky → každá zvlášť → průnik
// level 'full' = všechny kroky, 'semi' = podmínky + výsledek
// =====================================================================
const REL_SWAP = [[' \\ge ', ' > ', 'Pozor na rovnost: odmocnina snese nulu (≥), logaritmus ne (>).'],
  [' > ', ' \\ge ', 'Pozor na rovnost: logaritmus nulu nesnese, musí být ostře > 0.'],
  [' \\ne ', ' > ', 'Ve jmenovateli stačí ≠ 0, nemusí to být kladné.']];
function swapRel(cond) {
  if (/^-1 \\le .* \\le 1$/.test(cond)) return { cond: cond.replace(/ \\le /g, ' < '), why: 'arcsin a arccos zvládnou i přesně −1 a 1, takže ≤.' };
  for (const [a, b, why] of REL_SWAP) if (cond.includes(a)) return { cond: cond.replace(a, b), why };
  return null;
}

export function toGuided(c, level = 'full') {
  const parts = c.parts;
  const fakes = [...(c.fakes || []).map(f => (typeof f === 'string' ? { cond: f, why: '' } : f))];
  for (const p of parts) { const s = swapRel(p.cond); if (s && !parts.some(q => q.cond === s.cond)) fakes.push(s); }
  const conds = [...new Set(parts.map(p => p.cond))];
  const pickedFakes = shuffle(fakes).filter((f, i, a) => a.findIndex(g => g.cond === f.cond) === i && !conds.includes(f.cond)).slice(0, Math.max(1, Math.min(2, 5 - conds.length)));
  const gsteps = [{
    kind: 'multi', title: 'Které podmínky musíš hlídat?', sub: 'Zaškrtni všechny.',
    options: shuffle([
      ...conds.map(cd => ({ label: `$${cd}$`, correct: true, why: 'Ano, tahle podmínka tam je.' })),
      ...pickedFakes.map(f => ({ label: `$${f.cond}$`, correct: false, why: f.why || 'Tahle podmínka tu není.' })),
    ]),
  }];
  if (level === 'full') {
    const uparts = parts.filter((p, i) => parts.findIndex(q => q.cond === p.cond) === i);
    uparts.forEach(p => gsteps.push({ kind: 'interval', title: `Vyřeš $${p.cond}$`, label: 'x ∈', answer: p.set, why: p.how || '' }));
    if (uparts.length > 1) gsteps.push({ kind: 'interval', title: 'Průnik: co platí ve všech podmínkách zároveň?', label: 'D(f) =', answer: c.answer, lines: uparts.map(p => p.set), why: 'Na osách výš je vidět, co je obarvené všude.' });
    else gsteps[gsteps.length - 1].final = true;
  } else {
    gsteps.push({ kind: 'interval', title: 'Teď to dopočítej a zapiš výsledek', label: 'D(f) =', answer: c.answer, why: '' });
  }
  return {
    type: 'guided', key: c.key + ':' + level, badge: c.badge, fn: c.fn, prompt: level === 'full' ? 'Urči definiční obor krok po kroku' : 'Urči definiční obor',
    gsteps, answer: c.answer, steps: c.steps, hint: c.hint,
  };
}
/** továrny pro lekce */
export const guided = f => () => toGuided(f(), 'full');
export const semi = f => () => toGuided(f(), 'semi');

// =====================================================================
// Koncepční otázky (výběr z možností)
// =====================================================================

/** z intervalové karty udělá otázku s výběrem z možností */
export function asChoice(c) {
  const ans = normalize(c.answer);
  const cands = [
    { set: toggleBrackets(ans), why: 'Krajní body sedí, ale závorky ne. U ≥ a ≤ bod patří ⟨⟩, u >, < a ≠ nepatří ().' },
    { set: complement(ans), why: 'Tohle je přesně opačná část osy. Zkontroluj znaménko nerovnosti.' },
    { set: mirror(ans), why: 'Pozor na znaménka krajních bodů.' },
    ...(c.pieces ? c.pieces.filter(p => p.cond).map(p => ({ set: intersectAll(...c.pieces.filter(q => q !== p).map(q => q.set)), why: `Chybí podmínka pro $${p.tex}$.` })) : []),
  ];
  const opts = [{ label: `$${toTex(ans)}$`, correct: true }];
  for (const k of shuffle(cands)) {
    if (opts.length >= 4) break;
    if (equal(k.set, ans) || opts.some(o => o.label === `$${toTex(k.set)}$`)) continue;
    opts.push({ label: `$${toTex(k.set)}$`, correct: false, why: k.why });
  }
  return { type: 'choice', key: c.key + ':choice', prompt: 'Který definiční obor je správně?', context: c.fn, options: shuffle(opts), steps: c.steps, answer: c.answer };
}

/** jen zlomky: pro úplně první lekci, kde odmocnina a logaritmus ještě nebyly */
export const canPlugFrac = () => canPlug('frac');
export const whichBreaksFrac = () => whichBreaks('frac');
export function canPlug(t = pick(['frac', 'sqrt', 'ln'])) {
  const a = ri(-5, 5);
  let x, ok, f, calc;
  if (t === 'frac') {
    x = Math.random() < 0.5 ? a : riNot(-6, 6, a); ok = x !== a; f = `\\frac{1}{${sh(a)}}`;
    calc = `$f(${x}) = \\frac{1}{${sub(x, a)}}${a === 0 ? '' : ` = \\frac{1}{${x - a}}`}${x - a === 1 ? ' = 1' : ''}$` + (ok ? '. To jde.' : '. Dělení nulou nejde.');
  } else if (t === 'sqrt') {
    x = ri(a - 4, a + 4); ok = x >= a; f = `\\sqrt{${sh(a)}}`;
    calc = `$f(${x}) = \\sqrt{${sub(x, a)}} = \\sqrt{${x - a}}$` + (ok ? '. To jde.' : '. Odmocnina ze záporného čísla nejde.');
  } else {
    x = ri(a - 3, a + 3); ok = x > a; f = `\\ln(${sh(a)})`;
    calc = `$f(${x}) = \\ln(${sub(x, a)}) = \\ln(${x - a})$` + (ok ? '. To jde.' : '. Logaritmus umí jen kladná čísla.');
  }
  return {
    type: 'choice', key: 'canPlug', prompt: `Smím do funkce dosadit $x = ${x}$?`, context: `f(x) = ${f}`,
    options: [{ label: 'Ano, to jde', correct: ok, why: calc }, { label: 'Ne, rozbije se to', correct: !ok, why: calc }], explain: calc,
  };
}

export function whichBreaks(t = pick(['frac', 'sqrt', 'ln'])) {
  const a = ri(-4, 4);
  let f, bad, good, why;
  if (t === 'frac') { f = `\\frac{5}{${sh(a)}}`; bad = a; good = shuffle([a - 2, a - 1, a + 1, a + 2, a + 3]).slice(0, 3); why = `Pro $x = ${a}$ by byl jmenovatel nula.`; }
  else if (t === 'sqrt') { f = `\\sqrt{${sh(a)}}`; bad = a - ri(1, 3); good = shuffle([a, a + 1, a + 2, a + 4]).slice(0, 3); why = `Pro $x = ${bad}$ by pod odmocninou bylo $${bad - a}$, tedy záporné číslo.`; }
  else { f = `\\ln(${sh(a)})`; bad = a; good = shuffle([a + 1, a + 2, a + 3, a + 5]).slice(0, 3); why = `Pro $x = ${a}$ by byl $\\ln 0$, a ten neexistuje.`; }
  return {
    type: 'choice', key: 'whichBreaks', prompt: 'Které číslo do funkce dosadit <b>nesmíš</b>?', context: `f(x) = ${f}`,
    options: shuffle([{ label: `$${bad}$`, correct: true, why }, ...good.map(g => ({ label: `$${g}$`, correct: false, why: `$${g}$ je v pohodě. ${why}` }))]), explain: why,
  };
}

const COND_OPTS = { A: g => `$${g} \\ge 0$`, B: g => `$${g} > 0$`, C: g => `$${g} \\ne 0$`, D: g => `$-1 \\le ${g} \\le 1$`, E: () => 'žádná podmínka' };
export const RULES = [
  { f: g => `\\sqrt{${g}}`, k: 'A', why: 'Sudá odmocnina: pod ní nesmí být záporné číslo, nula je ale v pohodě.', has: true },
  { f: g => `\\sqrt[4]{${g}}`, k: 'A', why: 'Čtvrtá odmocnina je taky sudá, takže pod ní musí být ≥ 0.', has: true },
  { f: g => `\\sqrt[3]{${g}}`, k: 'E', why: 'Lichá odmocnina zvládne i záporná čísla: ∛(−8) = −2.', has: false },
  { f: g => `\\ln(${g})`, k: 'B', why: 'Logaritmus umí jen kladná čísla. Nula už ne!', has: true },
  { f: g => `\\log_2(${g})`, k: 'B', why: 'Každý logaritmus potřebuje kladné číslo.', has: true },
  { f: g => `\\frac{1}{${g}}`, k: 'C', why: 'Nulou dělit nejde.', has: true },
  { f: g => `\\mathrm{e}^{${g}}`, k: 'E', why: 'Exponenciála zvládne cokoliv.', has: false },
  { f: g => `2^{${g}}`, k: 'E', why: 'Mocnina s konstantním základem zvládne cokoliv.', has: false },
  { f: g => `\\sin(${g})`, k: 'E', why: 'Sinus zvládne cokoliv.', has: false },
  { f: g => `\\cos(${g})`, k: 'E', why: 'Kosinus zvládne cokoliv.', has: false },
  { f: g => `\\arcsin(${g})`, k: 'D', why: 'Arkussinus umí jen čísla od −1 do 1.', has: true },
  { f: g => `\\arccos(${g})`, k: 'D', why: 'Arkuskosinus umí jen čísla od −1 do 1.', has: true },
  { f: g => `\\mathrm{arctg}(${g})`, k: 'E', why: 'Arkustangens zvládne cokoliv.', has: false },
  { f: g => `(${g})^5`, k: 'E', why: 'Polynom (mocnina) zvládne cokoliv.', has: false },
];

export function conditionFor() {
  const rule = pick(RULES);
  const g = sh(riNot(-6, 6, 0));
  const others = shuffle(Object.keys(COND_OPTS).filter(k => k !== rule.k)).slice(0, 3);
  return {
    type: 'choice', key: 'conditionFor', prompt: 'Jakou podmínku tahle funkce dává?', context: `f(x) = ${rule.f(g)}`,
    options: shuffle([rule.k, ...others]).map(k => ({ label: COND_OPTS[k](g), correct: k === rule.k, why: rule.why })), explain: rule.why,
  };
}

export function sortCond() {
  const items = shuffle(RULES).slice(0, 6);
  if (!items.some(r => r.has)) items[0] = RULES[0];
  if (items.every(r => r.has)) items[1] = RULES[2];
  return {
    type: 'sort', key: 'sortCond', prompt: 'Roztřiď: kde musíš hlídat podmínku?',
    buckets: ['hlídám podmínku', 'bez podmínky'],
    items: items.map(r => ({ label: `$${r.f('x')}$`, bucket: r.has ? 0 : 1, why: r.why })),
  };
}

function simpleSet() {
  const a = ri(-5, 3), b = ri(a + 1, 6);
  const t = pick(['between', 'ge', 'lt', 'out', 'hole']);
  const A = frac(a), B = frac(b), c1 = Math.random() < 0.5, c2 = Math.random() < 0.5;
  if (t === 'between') return between(A, B, c1, c2);
  if (t === 'ge') return c1 ? ge(A) : gt(A);
  if (t === 'lt') return c1 ? le(B) : lt(B);
  if (t === 'out') return union(c1 ? le(A) : lt(A), c2 ? ge(B) : gt(B));
  return without(R(), A);
}
function setDistractors(s) {
  const c = [{ set: toggleBrackets(s), why: 'Pozor na závorky: plné kolečko ⟨⟩ = bod patří, prázdné () = nepatří.' },
    { set: complement(s), why: 'Tohle je přesně opačná část osy.' },
    { set: mirror(s), why: 'Pozor na znaménka čísel.' }];
  return c.filter(k => !equal(k.set, s) && k.set.length);
}

export function writeLine() {
  const s = simpleSet();
  return card({
    key: 'writeLine', prompt: `Zapiš tuhle část osy jako interval:${numberLine(s)}`, answer: s,
    steps: ['Plné kolečko = bod patří, takže ⟨ nebo ⟩. Prázdné kolečko = nepatří, takže ( nebo ). Šipka = pokračuje do nekonečna, a tam je vždycky kulatá závorka.', `Správně: $${toTex(s)}$`],
    hint: 'Čti zleva doprava. U nekonečna vždy kulatá závorka.',
  });
}

export function readLine() {
  const s = simpleSet();
  const opts = [{ label: `$${toTex(s)}$`, correct: true, why: 'Plné kolečko = bod patří ⟨⟩, prázdné kolečko = nepatří (), šipka = až do nekonečna.' }];
  for (const d of setDistractors(s)) if (!opts.some(o => o.label === `$${toTex(d.set)}$`)) opts.push({ label: `$${toTex(d.set)}$`, correct: false, why: d.why });
  return { type: 'choice', key: 'readLine', prompt: `Jak zapíšeš tuhle část osy?${numberLine(s)}`, options: shuffle(opts).slice(0, 4), explain: opts[0].why };
}

export function lineFromTex() {
  const s = simpleSet();
  const opts = [{ label: numberLine(s), correct: true, key: toTex(s), why: '⟨ ⟩ = plné kolečko (bod patří), ( ) = prázdné kolečko (nepatří).' }];
  for (const d of setDistractors(s)) if (!opts.some(o => o.key === toTex(d.set))) opts.push({ label: numberLine(d.set), key: toTex(d.set), correct: false, why: d.why });
  return { type: 'choice', key: 'lineFromTex', prompt: `Který obrázek odpovídá $${toTex(s)}$?`, options: shuffle(opts).slice(0, 4), wide: true, explain: opts[0].why };
}

export function belongs() {
  const a = ri(-5, 2), b = ri(a + 2, 7);
  const ai = Math.random() < 0.5, bi = Math.random() < 0.5;
  const s = between(frac(a), frac(b), ai, bi);
  const k = pick([a, b, ri(a + 1, b - 1), a - ri(1, 3), b + ri(1, 2)]);
  const yes = (k > a && k < b) || (k === a && ai) || (k === b && bi);
  const why = k === a || k === b
    ? `$${k}$ je krajní bod. Závorka ${(k === a ? ai : bi) ? '⟨ nebo ⟩ říká, že tam patří' : '( nebo ) říká, že tam nepatří'}.`
    : yes ? `$${k}$ leží mezi $${a}$ a $${b}$.` : `$${k}$ leží mimo interval.`;
  return {
    type: 'choice', key: 'belongs', prompt: `Patří číslo $${k}$ do intervalu $${toTex(s)}$?`,
    options: [{ label: 'Ano', correct: yes, why }, { label: 'Ne', correct: !yes, why }], explain: why + numberLine(s),
  };
}

export function rootsQuad() {
  const r1 = ri(-5, 4), r2 = ri(r1 + 1, 6);
  const p = -(r1 + r2), q = r1 * r2;
  const why = `Součin $${r1} \\cdot ${r2} = ${q}$, součet $${r1} + ${r2 < 0 ? `(${r2})` : r2} = ${-p}$. Proto $${quad(1, p, q)} = ${fac(r1)}${fac(r2)}$.`;
  const pair = (a, b) => `$x_1 = ${Math.min(a, b)},\\ x_2 = ${Math.max(a, b)}$`;
  const opts = [{ label: pair(r1, r2), correct: true, why }];
  // (další dvojice jsou záloha pro případ, že je jeden kořen 0 a zrcadlové varianty splynou)
  for (const [a, b] of [[-r1, -r2], [r1, -r2], [-r1, r2], [r1 + 1, r2 + 1], [r1 - 1, r2]]) {
    if (opts.length >= 4) break;
    const L = pair(a, b);
    if (!opts.some(o => o.label === L)) opts.push({ label: L, correct: false, why: 'Pozor na znaménka. Dosaď si kořen zpátky a ověř, že vyjde 0. ' + why });
  }
  return { type: 'choice', key: 'rootsQuad', prompt: `Jaké jsou kořeny výrazu $${quad(1, p, q)}$?`, options: shuffle(opts), explain: why };
}

export function parabolaSign() {
  const r1 = ri(-5, 4), r2 = ri(r1 + 1, 6);
  const p = -(r1 + r2), q = r1 * r2;
  const rel = pick(['\\ge', '>', '\\le', '<']);
  const F1 = frac(r1), F2 = frac(r2);
  const sets = {
    oc: union(le(F1), ge(F2)), oo: union(lt(F1), gt(F2)), ic: between(F1, F2), io: between(F1, F2, false, false),
  };
  const right = { '\\ge': 'oc', '>': 'oo', '\\le': 'ic', '<': 'io' }[rel];
  const why = `Parabola je otevřená nahoru: kladná vně kořenů, záporná mezi nimi. ${rel === '\\ge' || rel === '\\le' ? 'Rovnost je povolená, takže kořeny bereme.' : 'Ostrá nerovnost, takže kořeny nebereme.'}${parabolaSvg(F1.txt, F2.txt)}`;
  return {
    type: 'choice', key: 'parabolaSign', prompt: `Kořeny jsou $${r1}$ a $${r2}$. Kde platí $${quad(1, p, q)} ${rel} 0$?`,
    options: shuffle(Object.entries(sets).map(([k, s]) => ({ label: `$${toTex(s)}$`, correct: k === right, why }))), explain: why,
  };
}

export function flipSign() {
  const a = pick([1, 2, 3]), b = ri(1, 9) * a * pick([1, -1]);
  const r = frac(b, a);
  const rel = pick(['\\ge', '>']);
  const q = `${b} - ${a === 1 ? '' : a}x ${rel} 0`;
  const fl = flipRel(rel);
  const why = `$-${a === 1 ? '' : a}x ${rel} ${-b}$. Dělíme záporným číslem $-${a}$, takže se znaménko otočí: $x ${fl} ${r.tex}$.`;
  const mr = frac(-b, a);
  const opts = [
    { label: `$x ${fl} ${r.tex}$`, correct: true, why },
    { label: `$x ${rel} ${r.tex}$`, correct: false, why: 'Zapomenuté otočení znaménka! ' + why },
    { label: `$x ${rel} ${mr.tex}$`, correct: false, why },
    { label: `$x ${fl} ${mr.tex}$`, correct: false, why },
  ];
  return { type: 'choice', key: 'flipSign', prompt: `Vyřeš nerovnici $${q}$`, options: shuffle(opts), explain: why };
}

export function absMeaning() {
  const c = ri(-4, 4), r = ri(1, 3);
  const rel = pick(['<', '\\le', '>', '\\ge']);
  const A = frac(c - r), B = frac(c + r);
  const sets = { '<': between(A, B, false, false), '\\le': between(A, B), '>': union(lt(A), gt(B)), '\\ge': union(le(A), ge(B)) };
  const why = `$|${sh(c)}|$ je vzdálenost od čísla $${c}$. ${rel === '<' || rel === '\\le' ? 'Malá vzdálenost znamená interval kolem čísla' : 'Velká vzdálenost znamená oba kraje osy'}: od $${c}$ o $${r}$ doleva a doprava.`;
  const opts = Object.entries(sets).map(([k, s]) => ({ label: `$${toTex(s)}$`, correct: k === rel, why }));
  const m = mirror(sets[rel]);
  if (c !== 0) opts.push({ label: `$${toTex(m)}$`, correct: false, why: 'Pozor: střed je $' + c + '$, ne $' + (-c) + '$. ' + why });
  const uniq = opts.filter((o, i) => opts.findIndex(p => p.label === o.label) === i);
  const correct = uniq.find(o => o.correct);
  return { type: 'choice', key: 'absMeaning', prompt: `Kde platí $|${sh(c)}| ${rel} ${r}$?`, options: shuffle([correct, ...shuffle(uniq.filter(o => !o.correct)).slice(0, 3)]), explain: why };
}

export function commonDen() {
  const c = ri(1, 4), d = riNot(-4, 4, 0);
  const right = `\\frac{${lin(c + 1, -c * d)}}{${sh(d)}}`;
  const why = `$${c} = \\frac{${c}(${sh(d)})}{${sh(d)}}$, takže $${c} + \\frac{x}{${sh(d)}} = \\frac{${c}(${sh(d)}) + x}{${sh(d)}} = ${right}$.`;
  const wrongs = [`\\frac{${lin(1, c)}}{${sh(d)}}`, `\\frac{${lin(c + 1, -d)}}{${sh(d)}}`, `\\frac{${lin(c + 1, c * d)}}{${sh(d)}}`];
  return {
    type: 'choice', key: 'commonDen', prompt: `Uprav na jeden zlomek: $${c} + \\frac{x}{${sh(d)}}$`,
    options: shuffle([{ label: `$${right}$`, correct: true, why }, ...[...new Set(wrongs)].filter(w => w !== right).map(w => ({ label: `$${w}$`, correct: false, why }))]), explain: why,
  };
}

export function lnExp() {
  const c = pick([1, 2, -1, 3]);
  const rel = pick(['<', '>']);
  const E = expE(c);
  const right = rel === '<' ? between(frac(0), E, false, false) : gt(E);
  const why = `Logaritmus roste, takže $\\ln x ${rel} ${c}$ ⇔ $x ${rel} ${E.tex}$. A vždycky musí být $x > 0$.`;
  const cands = [right, rel === '<' ? lt(E) : between(frac(0), E, false, false), rel === '<' ? between(frac(0), frac(c > 0 ? c : 1), false, false) : gt(frac(c)), rel === '<' ? gt(E) : lt(E)];
  const opts = cands.map((s, i) => ({ label: `$${toTex(s)}$`, correct: i === 0, why }));
  return { type: 'choice', key: 'lnExp', prompt: `Kde platí $\\ln x ${rel} ${c}$?`, options: shuffle(opts.filter((o, i) => opts.findIndex(p => p.label === o.label) === i)), explain: why };
}

export function intersectQ() {
  const A = simpleSet(), B = simpleSet();
  const I = intersectAll(A, B);
  if (!I.length || equal(I, A) || equal(I, B)) return intersectQ();
  const pts = endpoints(A, B);
  const why = `Průnik = jen to, co je obarvené na <b>obou</b> osách najednou.${numberLine(A, { extra: pts, label: 'A' })}${numberLine(B, { extra: pts, label: 'B' })}${numberLine(I, { extra: pts, label: 'A ∩ B' })}`;
  const opts = [{ label: `$${toTex(I)}$`, correct: true, why }];
  for (const s of [union(A, B), A, B, toggleBrackets(I)]) {
    const L = `$${toTex(s)}$`;
    if (!opts.some(o => o.label === L) && opts.length < 4) opts.push({ label: L, correct: false, why });
  }
  return {
    type: 'choice', key: 'intersectQ', prompt: `Co platí <b>zároveň</b> pro $A = ${toTex(A)}$ a $B = ${toTex(B)}$?`,
    options: shuffle(opts), explain: why,
  };
}

// registr všech generátorů (pro opakování chyb)
export const GEN = {
  linear, quadratic, rational, ratShift, absDist, absCompare, arcLin, arcRecip, arccosQuad, logInside, combo, multiCond,
  canPlug, whichBreaks, conditionFor, sortCond, writeLine, readLine, lineFromTex, belongs, rootsQuad, parabolaSign, flipSign,
  absMeaning, commonDen, lnExp, intersectQ, ...FIXED,
};
