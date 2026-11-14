// Goniometrie: jednotková kružnice, nerovnice se sin/cos/tg a periodické definiční obory.
import { pick, shuffle } from '../ui.js';

// úhel = racionální násobek π: [p, q] znamená pπ/q
const g = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
const A = (p, q = 1) => { if (q < 0) { p = -p; q = -q; } const d = g(p, q); return [p / d, q / d]; };
const add = (x, y) => A(x[0] * y[1] + y[0] * x[1], x[1] * y[1]);
const neg = x => A(-x[0], x[1]);
const val = x => Math.PI * x[0] / x[1];

export function piTex([p, q]) {
  if (p === 0) return '0';
  const s = p < 0 ? '-' : '', ap = Math.abs(p);
  const num = ap === 1 ? '\\pi' : `${ap}\\pi`;
  return q === 1 ? s + num : `${s}\\frac{${num}}{${q}}`;
}
export function piTxt([p, q]) {
  if (p === 0) return '0';
  const s = p < 0 ? '−' : '', ap = Math.abs(p);
  return s + (ap === 1 ? 'π' : `${ap}π`) + (q === 1 ? '' : `/${q}`);
}
const withK = (a, per) => {
  const k = per === 2 ? '2k\\pi' : 'k\\pi';
  return a[0] === 0 ? k : `${piTex(a)} + ${k}`;
};

/** periodická množina → TeX */
export function perTex(s) {
  if (s.kind === 'R') return '\\mathbb{R}';
  if (s.kind === 'minus') return `\\mathbb{R} \\setminus \\left\\{ ${withK(s.a, s.per)} : k \\in \\mathbb{Z} \\right\\}`;
  return `\\bigcup_{k \\in \\mathbb{Z}} \\left${s.ai ? '\\langle' : '('} ${withK(s.a, s.per)}, ${withK(s.b, s.per)} \\right${s.bi ? '\\rangle' : ')'}`;
}
const key = s => perTex(s);

// tabulka: hodnota → úhel v ⟨−π/2, π/2⟩ (arcsin) a v ⟨0, π⟩ (arccos)
const VALS = [
  { tex: '0', txt: '0', v: 0, as: [0, 1], ac: [1, 2] },
  { tex: '\\frac{1}{2}', txt: '1/2', v: 0.5, as: [1, 6], ac: [1, 3] },
  { tex: '\\frac{\\sqrt{2}}{2}', txt: '√2/2', v: Math.SQRT1_2, as: [1, 4], ac: [1, 4] },
  { tex: '\\frac{\\sqrt{3}}{2}', txt: '√3/2', v: Math.sqrt(3) / 2, as: [1, 3], ac: [1, 6] },
  { tex: '-\\frac{1}{2}', txt: '−1/2', v: -0.5, as: [-1, 6], ac: [2, 3] },
  { tex: '-\\frac{\\sqrt{2}}{2}', txt: '−√2/2', v: -Math.SQRT1_2, as: [-1, 4], ac: [3, 4] },
  { tex: '-\\frac{\\sqrt{3}}{2}', txt: '−√3/2', v: -Math.sqrt(3) / 2, as: [-1, 3], ac: [5, 6] },
];

/** množina, kde platí fn(x) rel c (fn = sin | cos), jako oblouk s periodou 2π */
function arcSet(fn, rel, c) {
  const strict = rel === '>' || rel === '<';
  const up = rel === '>' || rel === '\\ge';
  if (fn === 'sin') {
    const a = c.as;                         // arcsin c
    const b = add([1, 1], neg(a));          // π − α
    return up ? { kind: 'arc', a, b, ai: !strict, bi: !strict, per: 2 }
      : { kind: 'arc', a: b, b: add(a, [2, 1]), ai: !strict, bi: !strict, per: 2 };
  }
  const b = c.ac;                           // arccos c
  return up ? { kind: 'arc', a: neg(b), b, ai: !strict, bi: !strict, per: 2 }
    : { kind: 'arc', a: b, b: add([2, 1], neg(b)), ai: !strict, bi: !strict, per: 2 };
}

// ---------- obrázek jednotkové kružnice ----------
export function circleSvg({ arc, line, fn, points = [] } = {}) {
  const cx = 110, cy = 100, r = 70;
  const P = t => [cx + r * Math.cos(t), cy - r * Math.sin(t)];
  let s = `<svg class="ucircle" viewBox="0 0 220 200" aria-hidden="true">
    <line class="nl-axis" x1="20" y1="${cy}" x2="200" y2="${cy}"/><line class="nl-axis" x1="${cx}" y1="190" x2="${cx}" y2="10"/>
    <circle class="uc-circle" cx="${cx}" cy="${cy}" r="${r}"/>
    <text class="nl-note" x="204" y="${cy - 4}" text-anchor="end">cos</text><text class="nl-note" x="${cx + 5}" y="18">sin</text>`;
  if (line != null) {
    if (fn === 'sin') { const y = cy - r * line; s += `<line class="uc-line" x1="25" y1="${y}" x2="195" y2="${y}"/>`; }
    else { const x = cx + r * line; s += `<line class="uc-line" x1="${x}" y1="15" x2="${x}" y2="185"/>`; }
  }
  if (arc) {
    const t1 = val(arc.a), t2 = val(arc.b);
    const [x1, y1] = P(t1), [x2, y2] = P(t2);
    const large = t2 - t1 > Math.PI ? 1 : 0;
    s += `<path class="uc-arc" d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 ${large} 0 ${x2.toFixed(1)} ${y2.toFixed(1)}"/>`;
    for (const [t, inc, lab] of [[t1, arc.ai, arc.a], [t2, arc.bi, arc.b]]) {
      const [x, y] = P(t), [lx, ly] = [cx + (r + 22) * Math.cos(t), cy - (r + 16) * Math.sin(t)];
      s += `<circle class="${inc ? 'nl-dot-in' : 'nl-dot-out'}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5"/>`;
      s += `<text class="nl-label" x="${lx.toFixed(1)}" y="${(ly + 5).toFixed(1)}" text-anchor="middle">${piTxt(lab)}</text>`;
    }
  }
  for (const t of points) {
    const [x, y] = P(val(t)), [lx, ly] = [cx + (r + 22) * Math.cos(val(t)), cy - (r + 16) * Math.sin(val(t))];
    s += `<circle class="nl-dot-in" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5"/><text class="nl-label" x="${lx.toFixed(1)}" y="${(ly + 5).toFixed(1)}" text-anchor="middle">${piTxt(t)}</text>`;
  }
  return s + '</svg>';
}

// ---------- distraktory pro periodické množiny ----------
function arcDistractors(s, why) {
  const out = [];
  if (s.kind === 'arc') {
    out.push({ set: { ...s, ai: !s.ai, bi: !s.bi }, why: 'Pozor na závorky: u ≥ a ≤ krajní body patří, u > a < ne.' });
    out.push({ set: { ...s, per: s.per === 2 ? 1 : 2 }, why: s.per === 2 ? 'sin a cos se opakují po $2\\pi$, ne po $\\pi$.' : 'tg a cotg se opakují už po $\\pi$.' });
    out.push({ set: { ...s, a: s.b, b: add(s.a, [s.per === 2 ? 2 : 1, 1]), ai: !s.bi, bi: !s.ai }, why: 'Tohle je přesně opačná část kružnice.' });
  }
  return out;
}
function setOptions(right, extra = [], why = '') {
  const opts = [{ label: `$${perTex(right)}$`, correct: true, why }];
  for (const d of shuffle([...extra, ...arcDistractors(right, why)])) {
    if (opts.length >= 4) break;
    if (!opts.some(o => o.label === `$${perTex(d.set)}$`)) opts.push({ label: `$${perTex(d.set)}$`, correct: false, why: d.why + ' ' + why });
  }
  return shuffle(opts);
}

// =====================================================================
// Generátory
// =====================================================================

/** Pro které úhly v ⟨0, 2π) je sin x = c? */
export function unitValue() {
  const fn = pick(['sin', 'cos']);
  const c = pick(VALS.filter(v => v.v !== 0));
  let sols;
  if (fn === 'sin') { const a = c.as[0] < 0 ? add(c.as, [2, 1]) : c.as; const b = add([1, 1], neg(c.as)); sols = [a, b].sort((x, y) => val(x) - val(y)); }
  else { const a = c.ac, b = add([2, 1], neg(c.ac)); sols = [a, b]; }
  const lab = xs => `$x = ${piTex(xs[0])}$ a $x = ${piTex(xs[1])}$`;
  const why = `${fn === 'sin' ? 'sin je výška bodu na kružnici' : 'cos je vodorovná souřadnice bodu'}: přímka ${fn === 'sin' ? 'y' : 'x'} = ${c.txt} protne kružnici ve dvou bodech.${circleSvg({ line: c.v, fn, points: sols })}`;
  // chybné: hodnoty pro druhou funkci, nebo jen zrcadlo
  const other = fn === 'sin' ? [c.ac, add([2, 1], neg(c.ac))] : [c.as[0] < 0 ? add(c.as, [2, 1]) : c.as, add([1, 1], neg(c.as))].sort((x, y) => val(x) - val(y));
  const mirrorS = sols.map(s => add([2, 1], neg(s))).sort((x, y) => val(x) - val(y));
  const shifted = sols.map(s => add(s, [1, 1])).map(s => (val(s) >= 2 * Math.PI ? add(s, [-2, 1]) : s)).sort((x, y) => val(x) - val(y));
  const cands = [{ l: lab(sols), ok: true }, { l: lab(other), ok: false }, { l: lab(mirrorS), ok: false }, { l: lab(shifted), ok: false }];
  const opts = cands.filter((o, i) => cands.findIndex(p => p.l === o.l) === i).map(o => ({ label: o.l, correct: o.ok, why }));
  return { type: 'choice', key: 'unitValue', prompt: `Pro která $x \\in \\langle 0, 2\\pi)$ platí $\\${fn} x = ${c.tex}$?`, options: shuffle(opts), explain: why };
}

/** Kde platí sin x ≥ c ? (periodická odpověď) */
export function trigIneq() {
  const fn = pick(['sin', 'cos']);
  const c = pick(VALS);
  const rel = pick(['\\ge', '>', '\\le', '<']);
  const s = arcSet(fn, rel, c);
  const why = `Nakresli si přímku ${fn === 'sin' ? 'y' : 'x'} = ${c.txt} a vyber část kružnice, kde je ${fn} ${rel.replace('\\ge', '≥').replace('\\le', '≤')} ${c.txt}. Pak přidej periodu $2k\\pi$.${circleSvg({ arc: s, line: c.v, fn })}`;
  return { type: 'choice', key: 'trigIneq', prompt: `Kde platí $\\${fn} x ${rel} ${c.tex}$?`, options: setOptions(s, [], why), explain: why };
}

/** Jakou podmínku dávají tg a cotg? */
export function tgCond() {
  const t = pick(['tg', 'cotg', 'sec', 'csc']);
  const data = {
    tg: { f: '\\mathrm{tg}\\, x', right: { kind: 'minus', a: [1, 2], per: 1 }, why: '$\\mathrm{tg}\\, x = \\frac{\\sin x}{\\cos x}$, takže $\\cos x \\ne 0$, tedy $x \\ne \\frac{\\pi}{2} + k\\pi$.' },
    cotg: { f: '\\mathrm{cotg}\\, x', right: { kind: 'minus', a: [0, 1], per: 1 }, why: '$\\mathrm{cotg}\\, x = \\frac{\\cos x}{\\sin x}$, takže $\\sin x \\ne 0$, tedy $x \\ne k\\pi$.' },
    sec: { f: '\\frac{1}{\\cos x}', right: { kind: 'minus', a: [1, 2], per: 1 }, why: 'Jmenovatel: $\\cos x \\ne 0$, tedy $x \\ne \\frac{\\pi}{2} + k\\pi$.' },
    csc: { f: '\\frac{1}{\\sin x}', right: { kind: 'minus', a: [0, 1], per: 1 }, why: 'Jmenovatel: $\\sin x \\ne 0$, tedy $x \\ne k\\pi$.' },
  }[t];
  const all = [{ kind: 'minus', a: [1, 2], per: 1 }, { kind: 'minus', a: [0, 1], per: 1 }, { kind: 'minus', a: [1, 2], per: 2 }, { kind: 'R' }];
  const opts = all.map(s => ({ label: `$${perTex(s)}$`, correct: key(s) === key(data.right), why: data.why }));
  return { type: 'choice', key: 'tgCond', prompt: 'Jaký je definiční obor?', context: `f(x) = ${data.f}`, options: shuffle(opts), explain: data.why };
}

/** definiční obor s goniometrickou funkcí, krok po kroku (výběr z možností) */
function trigProblem() {
  const k = pick(['lnSin', 'sqrtSin', 'sqrtCos', 'lnCos', 'sqrtLin', 'lnLin', 'lnTg', 'oddRoot']);
  if (k === 'lnTg') {
    const s = { kind: 'arc', a: [0, 1], b: [1, 2], ai: false, bi: false, per: 1 };
    return { f: '\\ln(\\mathrm{tg}\\, x)', cond: '\\mathrm{tg}\\, x > 0', condWrong: ['\\mathrm{tg}\\, x \\ge 0', '\\sin x > 0'], set: s,
      why: '$\\mathrm{tg}\\, x > 0$ v 1. a 3. kvadrantu, tedy mezi $k\\pi$ a $\\frac{\\pi}{2} + k\\pi$ (tg má periodu $\\pi$).' };
  }
  if (k === 'oddRoot') {
    const fn = pick(['sin', 'cos']);
    return {
      f: `\\sqrt[3]{1 - 2\\${fn} x}`, cond: null, condWrong: [`1 - 2\\${fn} x \\ge 0`, `\\${fn} x \\le \\frac{1}{2}`], set: { kind: 'R' },
      why: 'Lichá (třetí) odmocnina zvládne i záporná čísla. Žádná podmínka.',
      extra: [{ set: arcSet(fn, '\\le', VALS[1]), why: 'Tohle by platilo pro sudou odmocninu.' }, { set: arcSet(fn, '\\ge', VALS[1]), why: 'Žádná podmínka tu není.' }, { set: { kind: 'minus', a: [1, 2], per: 1 }, why: 'Žádná podmínka tu není.' }],
    };
  }
  let fn, rel, c, f, cond;
  if (k === 'lnSin' || k === 'sqrtSin' || k === 'sqrtCos' || k === 'lnCos') {
    fn = k.endsWith('Sin') ? 'sin' : 'cos'; c = VALS[0]; rel = k.startsWith('ln') ? '>' : '\\ge';
    f = k.startsWith('ln') ? `\\ln(\\${fn} x)` : `\\sqrt{\\${fn} x}`; cond = `\\${fn} x ${rel} 0`;
  } else {
    fn = pick(['sin', 'cos']);
    c = pick([VALS[1], VALS[4], VALS[2], VALS[3]]);
    const sq = c.tex.includes('sqrt');
    const num = sq ? `\\sqrt{${c.txt.includes('2') && c.txt.includes('√2') ? 2 : 3}}` : '1';
    const neg = c.v < 0;
    const sign = Math.random() < 0.5 ? 1 : -1;                   // 2sin x − c  nebo  c − 2sin x
    const inner = sign > 0 ? `2\\${fn} x ${neg ? '+' : '-'} ${num}` : `${neg ? '-' : ''}${num} - 2\\${fn} x`;
    rel = k === 'lnLin' ? (sign > 0 ? '>' : '<') : (sign > 0 ? '\\ge' : '\\le');
    f = k === 'lnLin' ? `\\ln(${inner})` : `\\sqrt{${inner}}`;
    cond = `\\${fn} x ${rel} ${c.tex}`;
  }
  const s = arcSet(fn, rel, c);
  const flip = { '\\ge': '\\le', '\\le': '\\ge', '>': '<', '<': '>' };
  const loose = { '\\ge': '>', '>': '\\ge', '\\le': '<', '<': '\\le' };
  return {
    f, cond, set: s, fn, line: c.v,
    condWrong: [cond.replace(` ${rel} `, ` ${flip[rel]} `), cond.replace(` ${rel} `, ` ${loose[rel]} `)],
    why: `Na kružnici: ${fn === 'sin' ? 'výška' : 'vodorovná souřadnice'} ${rel.replace('\\ge', '≥').replace('\\le', '≤')} ${c.txt}.${circleSvg({ arc: s, line: c.v, fn })}`,
  };
}

export function trigDomain(level = 'guided') {
  const p = trigProblem();
  const final = { kind: 'choice', title: 'Zapiš definiční obor', options: setOptions(p.set, p.extra || [], p.why), why: p.why };
  if (level !== 'guided') {
    return { type: 'choice', key: 'trigDomain', prompt: 'Urči definiční obor', context: `f(x) = ${p.f}`, options: final.options, explain: p.why };
  }
  const condOpts = [
    { label: p.cond ? `$${p.cond}$` : 'žádná podmínka', correct: true, why: p.cond ? 'Přesně tak.' : p.why },
    ...p.condWrong.map(w => ({ label: `$${w}$`, correct: false, why: p.cond ? `Správně je $${p.cond}$.` : p.why })),
  ];
  if (p.cond) condOpts.push({ label: 'žádná podmínka', correct: false, why: `Podmínka tu je: $${p.cond}$.` });
  return {
    type: 'guided', key: 'trigDomain:guided', fn: `f(x) = ${p.f}`, prompt: 'Urči definiční obor krok po kroku',
    gsteps: [{ kind: 'choice', title: 'Jaká podmínka tu je?', options: shuffle(condOpts) }, { ...final, final: true }],
    steps: [p.cond ? `Podmínka: $${p.cond}$.` : 'Žádná podmínka.', p.why, `$D(f) = ${perTex(p.set)}$`],
  };
}
export const trigDomainPlain = () => trigDomain('plain');

// ---------- pevné příklady ----------
export const GONIO_FIXED = {
  du5: () => ({
    type: 'guided', key: 'du5', badge: 'Série 1', fn: 'f(x) = \\sqrt[5]{\\ln(\\mathrm{tg}\\, x)}', prompt: 'Urči definiční obor krok po kroku',
    gsteps: [
      { kind: 'choice', title: 'Jaká podmínka tu je?', options: shuffle([
        { label: '$\\mathrm{tg}\\, x > 0$', correct: true, why: 'Pátá odmocnina je lichá, ta nevadí. Hlídáme logaritmus.' },
        { label: '$\\ln(\\mathrm{tg}\\, x) \\ge 0$', correct: false, why: 'Pátá odmocnina je lichá, snese i záporná čísla. Hlídáme jen logaritmus: $\\mathrm{tg}\\, x > 0$.' },
        { label: '$\\mathrm{tg}\\, x \\ge 1$', correct: false, why: 'To by platilo pro sudou odmocninu. Pátá je lichá.' },
        { label: 'žádná podmínka', correct: false, why: 'Logaritmus potřebuje kladné číslo: $\\mathrm{tg}\\, x > 0$.' }]) },
      { kind: 'choice', final: true, title: 'Zapiš definiční obor', why: '$\\mathrm{tg}\\, x > 0$ v prvním a třetím kvadrantu, perioda $\\pi$.',
        options: setOptions({ kind: 'arc', a: [0, 1], b: [1, 2], ai: false, bi: false, per: 1 }, [], '$\\mathrm{tg}\\, x > 0$ mezi $k\\pi$ a $\\frac{\\pi}{2} + k\\pi$.') },
    ],
    steps: ['Pátá odmocnina je lichá, nevadí.', 'Logaritmus: $\\mathrm{tg}\\, x > 0$.', '$D(f) = \\bigcup_{k \\in \\mathbb{Z}} \\left(k\\pi, \\frac{\\pi}{2} + k\\pi\\right)$'],
  }),
  v5: () => {
    const even = Math.random() < 0.5;
    const s = even ? { kind: 'arc', a: [5, 6], b: [13, 6], ai: true, bi: true, per: 2 } : { kind: 'R' };
    const why = even ? `Čtvrtá odmocnina je sudá: $1 - 2\\sin x \\ge 0$, tedy $\\sin x \\le \\frac{1}{2}$.${circleSvg({ arc: s, line: 0.5, fn: 'sin' })}` : 'Třetí odmocnina je lichá, zvládne cokoliv. Žádná podmínka.';
    const opts = even ? setOptions(s, [{ set: { kind: 'R' }, why: 'Čtvrtá odmocnina je sudá, takže podmínka tu je.' }], why)
      : shuffle([{ label: '$\\mathbb{R}$', correct: true, why }, ...[{ kind: 'arc', a: [5, 6], b: [13, 6], ai: true, bi: true, per: 2 }, { kind: 'arc', a: [-7, 6], b: [1, 6], ai: true, bi: true, per: 1 }].map(x => ({ label: `$${perTex(x)}$`, correct: false, why }))]);
    return { type: 'choice', key: 'v5', badge: 'Z videa', prompt: 'Urči definiční obor', context: `f(x) = \\sqrt[${even ? 4 : 3}]{1 - 2\\sin x}`, options: opts, explain: why };
  },
};

export const GONIO_GEN = { unitValue, trigIneq, tgCond, trigDomain: () => trigDomain('guided'), trigDomainPlain, ...GONIO_FIXED };
