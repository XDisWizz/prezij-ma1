// Generátory pro cestu „Grafy funkcí“ (Základy matematiky): průsečíky s osami, vrchol paraboly, posuny |x|, výběr grafu.
import { ri, riNot, pick, shuffle } from '../../ui.js';
import { form, options } from '../form.js';
import { fracTex, fracTxt } from '../expr.js';
import { graph } from '../plot.js';
import { polyTex } from '../rovnice/gen.js';

const num = (v, label, tex = String(v), text = String(v)) => ({ kind: 'num', label, answer: v, tex, text });
const nums = (vals, label = '$x =$') => ({ kind: 'nums', label, answer: vals, tex: vals.length ? vals.join(';\\ ') : '\\text{žádné}', text: vals.length ? vals.join('; ') : 'žádné' });
const pt = (x, y) => `[${x};\\ ${y}]`;

// ------------------------------------------------------------ funkce
/** parabola a(x − p)(x − q) s celočíselným vrcholem */
export function quadF(fix) {
  let a, p, q;
  if (fix) [a, p, q] = fix;
  else { a = pick([1, 1, 1, -1]); do { p = ri(-5, 4); q = ri(-4, 6); } while (p >= q || (p + q) % 2 !== 0 || Math.abs(a * (q - p) ** 2 / 4) > 16); }
  const b = -a * (p + q), c = a * p * q;
  const xv = (p + q) / 2, yv = a * (xv - p) * (xv - q);
  return { kind: 'quad', a, b, c, roots: [p, q], xv, yv, y0: c, f: x => a * x * x + b * x + c, tex: polyTex(a, b, c) };
}
/** s·|x − u| + v */
export function absF(fix) {
  let s, u, v;
  if (fix) [s, u, v] = fix;
  else { s = pick([1, 1, 1, -1]); u = riNot(-3, 3, 0); v = ri(-3, 3); }
  const inner = u === 0 ? 'x' : `x ${u < 0 ? '+' : '-'} ${Math.abs(u)}`;
  const tex = `${s < 0 ? '-' : ''}\\left|${inner}\\right|${v ? ` ${v < 0 ? '-' : '+'} ${Math.abs(v)}` : ''}`;
  // s|x − u| + v = 0 → |x − u| = −v/s
  const k = -v / s;
  const roots = k < 0 ? [] : k === 0 ? [u] : [u - k, u + k];
  return { kind: 'abs', s, u, v, roots, xv: u, yv: v, y0: s * Math.abs(u) + v, f: x => s * Math.abs(x - u) + v, tex, inner };
}
function view(F) {
  const xs = [...F.roots, F.xv, 0];
  const xmin = Math.min(-2, Math.floor(Math.min(...xs)) - 2), xmax = Math.max(2, Math.ceil(Math.max(...xs)) + 2);
  const ys = [F.yv, F.y0, 0];
  let ymin = Math.min(-2, Math.floor(Math.min(...ys)) - 1), ymax = Math.max(2, Math.ceil(Math.max(...ys)) + 1);
  if (F.kind === 'abs' || F.a > 0) ymax = Math.max(ymax, ymin + 6); else ymin = Math.min(ymin, ymax - 6);
  const span = Math.max(xmax - xmin, ymax - ymin);
  return { xmin, xmax, ymin, ymax, step: span > 14 ? 2 : 1 };
}
const pic = (F, o = {}) => graph(F.f, { ...view(F), ...o });

// ------------------------------------------------------------ průsečíky
function interSteps(F) {
  const st = [`Průsečík s osou $y$: dosaď $x = 0$: $f(0) = ${F.y0}$, bod $${pt(0, F.y0)}$.`];
  if (F.kind === 'quad') {
    st.push(`Průsečíky s osou $x$: řeš $${F.tex} = 0$. ${F.a === 1 ? `Rozklad: $(x ${F.roots[0] < 0 ? '+' : '-'} ${Math.abs(F.roots[0])})(x ${F.roots[1] < 0 ? '+' : '-'} ${Math.abs(F.roots[1])}) = 0$` : 'Diskriminant a vzorec'}, kořeny $${F.roots.join('$ a $')}$.`);
  } else {
    const k = -F.v / F.s;
    st.push(`Průsečíky s osou $x$: řeš $${F.tex} = 0$, tedy $\\left|${F.inner}\\right| = ${k}$. ${k < 0 ? 'Absolutní hodnota nemůže být záporná: s osou $x$ se graf neprotne.' : k === 0 ? `Jediné řešení $x = ${F.u}$.` : `Uvnitř je buď $${k}$, nebo $-${k}$: $x = ${F.u - k}$ nebo $x = ${F.u + k}$.`}`);
  }
  if (F.roots.length) st.push(`Body na ose $x$: ${F.roots.map(r => `$${pt(r, 0)}$`).join(', ')}.`);
  return st;
}
export function yInt() {
  const F = Math.random() < 0.5 ? quadF() : absF();
  return form({
    key: 'yInt', prompt: 'Průsečík grafu s osou $y$ je bod $[0;\\ ?]$. Doplň.', fn: `f(x) = ${F.tex}`,
    fields: [num(F.y0, '$y =$')], hint: 'Na ose y je x = 0. Dosaď nulu.',
    steps: [interSteps(F)[0]],
  });
}
export function xInts() {
  const F = Math.random() < 0.5 ? quadF() : absF();
  return form({
    key: 'xInts', prompt: 'Najdi $x$-ové souřadnice průsečíků grafu s osou $x$.', fn: `f(x) = ${F.tex}`,
    fields: [nums(F.roots)], hint: 'Na ose x je y = 0: řeš f(x) = 0.',
    steps: interSteps(F).slice(1),
  });
}

// ------------------------------------------------------------ vrchol paraboly
export function vertexQ() {
  const F = quadF();
  return form({
    key: 'vertexQ', prompt: 'Urči vrchol paraboly', fn: `f(x) = ${F.tex}`,
    fields: [num(F.xv, '$x_V =$'), num(F.yv, '$y_V =$')], hint: 'x_V = −b / 2a, pak dosaď.',
    steps: [`$x_V = \\frac{-b}{2a} = \\frac{${-F.b}}{${2 * F.a}} = ${F.xv}$ (taky přesně uprostřed mezi kořeny $${F.roots[0]}$ a $${F.roots[1]}$).`, `$y_V = f(${F.xv}) = ${F.yv}$`, `$V = ${pt(F.xv, F.yv)}$`],
  });
}

// ------------------------------------------------------------ posuny |x|
export function absVertex() {
  const F = absF();
  return form({
    key: 'absVertex', prompt: 'Kde je „špička“ (vrchol) grafu?', fn: `f(x) = ${F.tex}`,
    fields: [num(F.u, '$x_V =$'), num(F.v, '$y_V =$')], hint: 'Uvnitř |x − u| posouvá doprava o u, číslo venku posouvá nahoru/dolů.',
    steps: [`Špička $|x|$ je v $[0;\\ 0]$. Uvnitř $\\left|${F.inner}\\right|$: ${F.u > 0 ? `posun o $${F.u}$ <b>doprava</b> (mínus uvnitř = doprava)` : `posun o $${-F.u}$ <b>doleva</b> (plus uvnitř = doleva)`}.`, F.v ? `Venku $${F.v > 0 ? '+' : '-'} ${Math.abs(F.v)}$: posun o $${Math.abs(F.v)}$ ${F.v > 0 ? 'nahoru' : 'dolů'}.` : 'Venku nic: svisle se neposouvá.', `Vrchol $${pt(F.u, F.v)}$${F.s < 0 ? ', mínus před absolutní hodnotou graf otočí dolů (∧)' : ''}.`],
  });
}
export function shiftQ() {
  const u = riNot(-4, 4, 0), v = riNot(-4, 4, 0);
  const inner = `x ${u < 0 ? '+' : '-'} ${Math.abs(u)}`;
  const h = d => (d > 0 ? 'doprava' : 'doleva'), w = d => (d > 0 ? 'nahoru' : 'dolů');
  const lab = (a, b) => `o $${Math.abs(a)}$ ${h(a)} a o $${Math.abs(b)}$ ${w(b)}`;
  const why = 'Číslo uvnitř posouvá vodorovně <b>opačně</b>, než vypadá ($x - 2$ = doprava). Číslo venku posouvá svisle normálně.';
  return {
    type: 'choice', key: 'shiftQ', prompt: 'Graf vznikne z grafu $|x|$ posunutím', context: `f(x) = \\left|${inner}\\right| ${v < 0 ? '-' : '+'} ${Math.abs(v)}`,
    options: options(lab(u, v), [[lab(-u, v), why], [lab(u, -v), why], [lab(-u, -v), why]]), explain: why,
  };
}

// ------------------------------------------------------------ výběr grafu
function variants(F) {
  if (F.kind === 'quad') {
    const c = [quadF([-F.a, F.roots[0], F.roots[1]]), quadF([F.a, -F.roots[1], -F.roots[0]])];
    const sh = quadF([F.a, F.roots[0] + 2, F.roots[1] + 2]);
    c.push(sh);
    return c;
  }
  return [absF([F.s, -F.u, F.v]), absF([F.s, F.u, -F.v || 2]), absF([-F.s, F.u, F.v])];
}
function graphPickField(F) {
  const all = [F, ...variants(F)];
  const vw = view(F);
  const seen = new Set();
  const opts = [];
  for (const G of all) {
    const sig = [-3, -1, 0, 1, 2, 4].map(x => G.f(x)).join();
    if (seen.has(sig)) continue;
    seen.add(sig);
    opts.push({ label: graph(G.f, { ...vw, W: 170, H: 140, small: true }), correct: G === F });
  }
  return { kind: 'pick', label: '', options: shuffle(opts), answer: null, tex: '', text: null };
}
export function graphPick() {
  const F = Math.random() < 0.5 ? quadF() : absF();
  return form({
    key: 'graphPick', prompt: 'Který obrázek je graf funkce?', fn: `f(x) = ${F.tex}`,
    fields: [graphPickField(F)], hint: 'Najdi vrchol a průsečík s osou y, pak porovnej.',
    steps: [F.kind === 'quad' ? `Vrchol $${pt(F.xv, F.yv)}$, otevřená ${F.a > 0 ? 'nahoru' : 'dolů'}.` : `Špička $${pt(F.u, F.v)}$, ${F.s > 0 ? 'nahoru (∨)' : 'dolů (∧)'}.`, `Průsečík s osou $y$: $${pt(0, F.y0)}$. ${pic(F, { W: 220, H: 170, small: true })}`],
  });
}

// ------------------------------------------------------------ celý příklad jako v testu
export function examGraph(fixF) {
  const F = fixF || (Math.random() < 0.5 ? quadF() : absF());
  const fields = [nums(F.roots, 's osou $x$: $x =$'), num(F.y0, 's osou $y$: $y =$')];
  if (F.kind === 'quad') fields.push(num(F.xv, 'vrchol: $x_V =$'), num(F.yv, '$y_V =$'));
  fields.push({ ...graphPickField(F), label: 'Který je to graf?' });
  const pts = [...F.roots.map(r => ({ x: r, y: 0, label: `[${r}; 0]`, dy: 16 })), { x: 0, y: F.y0, label: `[0; ${F.y0}]`, dx: 6, dy: F.y0 > 0 ? -8 : 16 }];
  if (F.kind === 'quad') pts.push({ x: F.xv, y: F.yv, label: `V[${F.xv}; ${F.yv}]`, dx: 8, dy: F.a > 0 ? 18 : -8 });
  return form({
    key: 'examGraph', prompt: F.kind === 'quad' ? 'Načrtni graf funkce. Urči průsečíky s osami a vrchol paraboly.' : 'Načrtni graf funkce. Urči průsečíky s osami (pokud existují).',
    fn: `f(x) = ${F.tex}`, fields,
    hint: 'y-průsečík: dosaď 0. x-průsečíky: řeš f(x) = 0.',
    steps: [...interSteps(F), F.kind === 'quad' ? `Vrchol: $x_V = \\frac{-b}{2a} = ${F.xv}$, $y_V = f(${F.xv}) = ${F.yv}$, $V = ${pt(F.xv, F.yv)}$.` : `Graf je „V“ ${F.s > 0 ? '' : 'otočené dolů '}se špičkou v $${pt(F.u, F.v)}$.`, `Náčrt (do testu stačí od ruky, hlavně vyznačit spočítané body): ${pic(F, { pts, W: 280, H: 230 })}`],
  });
}
export const FIXED = {
  A4: () => ({ ...examGraph(absF([1, 1, -1])), key: 'A4' }),
  B4: () => ({ ...examGraph(quadF([1, -2, 4])), key: 'B4' }),
};
export const GEN = { yInt, xInts, vertexQ, absVertex, shiftQ, graphPick, examGraph };
export { fracTex, fracTxt };
