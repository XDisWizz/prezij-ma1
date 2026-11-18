// Generátory pro cestu „Komplexní čísla: algebraický tvar“ (Základy matematiky).
import { ri, riNot, pick, shuffle } from '../../ui.js';
import { form, options } from '../form.js';
import * as X from '../expr.js';
import { gauss } from '../plot.js';

const R = String.raw;
const { cxTex, cxTxt, fracTex } = X;
const I = '\\mathrm{i}';
const val = v => (Array.isArray(v) ? v[0] / v[1] : v);
/** políčko na komplexní číslo, re/im celé nebo [p, q] */
export const cfield = (re, im, label = '$z =$') => ({ kind: 'complex', label, answer: [val(re), val(im)], tex: cxTex(re, im), text: cxTxt(re, im) });
/** a + bi v závorce, když je potřeba */
const par = (a, b) => (b === 0 || a === 0 ? cxTex(a, b) : `\\left(${cxTex(a, b)}\\right)`);
const parAlways = (a, b) => `\\left(${cxTex(a, b)}\\right)`;
const sg = v => (v < 0 ? `- ${Math.abs(v)}` : `+ ${v}`);
const nz = () => riNot(-5, 5, 0);

// =====================================================================
// Co je i
// =====================================================================
export function reIm() {
  const a = riNot(-7, 7, 0), b = riNot(-7, 7, 0);
  const kind = pick(['std', 'std', 'rev', 'pure']);
  const zTex = kind === 'rev' ? `${b === 1 ? '' : b === -1 ? '-' : b}${I} ${a < 0 ? '-' : '+'} ${Math.abs(a)}` : kind === 'pure' ? cxTex(0, b) : cxTex(a, b);
  const re = kind === 'pure' ? 0 : a;
  const lab = (x, y) => `$\\operatorname{Re} z = ${x},\\ \\operatorname{Im} z = ${y}$`;
  const ok = lab(re, b);
  const why = `Reálná část je číslo bez $${I}$, imaginární část je číslo, které <b>stojí u</b> $${I}$ (bez samotného $${I}$).`;
  return {
    type: 'choice', key: 'reIm', prompt: 'Jaká je reálná a imaginární část čísla $z$?', context: `z = ${zTex}`,
    options: options(ok, [
      [lab(re, `${b === 1 ? '' : b === -1 ? '-' : b}${I}`),'Imaginární část se píše bez $\\mathrm{i}$: je to jen číslo, které u něj stojí.'],
      [lab(b, re), 'Prohozené: reálná část je ta bez $\\mathrm{i}$.'],
      [lab(re, -b), 'Znaménko patří k číslu: imaginární část je i se znaménkem.'],
      [lab(-re || 1, b), 'Reálná část je i se svým znaménkem.'],
    ], why),
    explain: why,
  };
}

export function iPow() {
  const n = ri(2, 27);
  const r = n % 4;
  const vals = ['1', I, '-1', `-${I}`];
  const why = R`Mocniny $\mathrm{i}$ se opakují po čtyřech: $\mathrm{i}^1 = \mathrm{i}$, $\mathrm{i}^2 = -1$, $\mathrm{i}^3 = -\mathrm{i}$, $\mathrm{i}^4 = 1$. ` + `$${n} : 4$ = ${Math.floor(n / 4)}, zbytek ${r}, takže $${I}^{${n}} = ${I}^{${r}} = ${vals[r]}$.`;
  return {
    type: 'choice', key: 'iPow', prompt: 'Kolik je', context: `${I}^{${n}}`,
    options: vals.map((v, k) => ({ label: `$${v}$`, correct: k === r, why })), explain: why,
  };
}

// =====================================================================
// Gaussova rovina
// =====================================================================
const gpt = () => { let a, b; do { a = ri(-4, 4); b = ri(-4, 4); } while (a === 0 && b === 0 || Math.random() < 0.6 && (a === 0 || b === 0)); return [a, b]; };
export function gaussRead(fix) {
  const [a, b] = fix || gpt();
  return form({
    key: 'gaussRead', prompt: 'V Gaussově rovině je znázorněné komplexní číslo $z$. Napiš ho v algebraickém tvaru.', show: gauss([{ re: a, im: b, label: 'z' }]),
    fields: [cfield(a, b)],
    hint: 'Vodorovně (Re) je reálná část, svisle (Im) imaginární.',
    steps: [`Vodorovná osa je $\\operatorname{Re} z$: bod je na $${a}$.`, `Svislá osa je $\\operatorname{Im} z$: bod je na $${b}$.`, `$z = ${cxTex(a, b)}$`],
  });
}
export function gaussPick() {
  const [a, b] = gpt();
  const cands = [[a, b], [b, a], [a, -b], [-a, b], [-a, -b]];
  const seen = new Set();
  const opts = [];
  for (const [x, y] of cands) { const k = x + ',' + y; if (seen.has(k)) continue; seen.add(k); opts.push({ label: gauss([{ re: x, im: y }], { W: 170, H: 170 }), correct: x === a && y === b }); if (opts.length === 4) break; }
  return form({
    key: 'gaussPick', prompt: `Kde v Gaussově rovině leží $z = ${cxTex(a, b)}$?`,
    fields: [{ kind: 'pick', label: '', options: shuffle(opts), answer: null, tex: '', text: null }],
    steps: [`Reálná část $${a}$: tolik doprava${a < 0 ? ' (záporná = doleva)' : ''} po ose Re.`, `Imaginární část $${b}$: tolik nahoru${b < 0 ? ' (záporná = dolů)' : ''} po ose Im.`],
  });
}

// =====================================================================
// Sčítání a násobení
// =====================================================================
export function addSub() {
  const a = nz(), b = nz(), c = nz(), d = nz(), minus = Math.random() < 0.45;
  const re = minus ? a - c : a + c, im = minus ? b - d : b + d;
  return form({
    key: 'addSub', prompt: 'Spočítej a napiš v algebraickém tvaru', fn: `z = ${parAlways(a, b)} ${minus ? '-' : '+'} ${parAlways(c, d)}`,
    fields: [cfield(re, im)], hint: 'Reálné části zvlášť, imaginární zvlášť.',
    steps: [minus ? 'Mínus před závorkou otočí obě znaménka v ní.' : 'Závorky můžeš rovnou vynechat.', `Reálné části: $${a} ${minus ? '-' : '+'} ${c < 0 ? `(${c})` : c} = ${re}$`, `Imaginární části: $${b} ${minus ? '-' : '+'} ${d < 0 ? `(${d})` : d} = ${im}$`, `$z = ${cxTex(re, im)}$`],
  });
}

function mulData(a, b, c, d) {
  const re = a * c - b * d, im = a * d + b * c;
  return { re, im, ac: a * c, ad: a * d, bc: b * c, bd: b * d };
}
export function mulCx(fix) {
  const [a, b, c, d] = fix || [nz(), nz(), nz(), nz()];
  const m = mulData(a, b, c, d);
  return form({
    key: 'mulCx', prompt: 'Spočítej a napiš v algebraickém tvaru', fn: `z = ${parAlways(a, b)}${parAlways(c, d)}`,
    fields: [cfield(m.re, m.im)], hint: 'Roznásob jako závorky s x, pak i² = −1.',
    steps: [
      `Roznásob každý s každým: $${m.ac} ${sg(m.ad)}${I} ${sg(m.bc)}${I} ${sg(m.bd)}${I}^2$`,
      `$${I}^2 = -1$, takže $${m.bd}${I}^2 = ${-m.bd}$.`,
      `Reálné: $${m.ac} ${sg(-m.bd)} = ${m.re}$, imaginární: $${m.ad} ${sg(m.bc)} = ${m.im}$.`,
      `$z = ${cxTex(m.re, m.im)}$`,
    ],
    data: { a, b, c, d, ...m },
  });
}
export function mulGuided() {
  const c0 = mulCx();
  const { a, b, c, d, ac, ad, bc, bd, re, im } = c0.data;
  return {
    type: 'guided', key: 'mulCx:guided', prompt: c0.prompt, fn: c0.fn, steps: c0.steps,
    gsteps: [
      { kind: 'form', title: 'Roznásob každý s každým', info: `$${par(a, b)}\\cdot${par(c, d)}$: čtyři součiny.`, fields: [
        { kind: 'num', label: `$${a}\\cdot ${c < 0 ? `(${c})` : c} =$`, answer: ac, tex: String(ac), text: String(ac) },
        { kind: 'complex', label: `$${a}\\cdot ${cxTex(0, d)} =$`, answer: [0, ad], tex: cxTex(0, ad), text: cxTxt(0, ad) },
        { kind: 'complex', label: `$${cxTex(0, b)}\\cdot ${c < 0 ? `(${c})` : c} =$`, answer: [0, bc], tex: cxTex(0, bc), text: cxTxt(0, bc) },
        { kind: 'num', label: `$${cxTex(0, b)}\\cdot ${cxTex(0, d)} =$`, answer: -bd, tex: String(-bd), text: String(-bd), why: `$${b}${I}\\cdot${d}${I} = ${bd}${I}^2 = ${-bd}$, protože $${I}^2 = -1$.` },
      ] },
      { kind: 'form', title: 'Sečti: reálné zvlášť, imaginární zvlášť', fields: [cfield(re, im)] },
    ],
  };
}

export function powCx(fix) {
  let a, b, n;
  if (fix) [a, b, n] = fix;
  else { n = pick([2, 2, 3, 3]); a = n === 2 ? riNot(-3, 3, 0) : pick([1, 1, -1, 2, -2]); b = n === 2 ? riNot(-3, 3, 0) : pick([1, 1, -1, 2, -2]); }
  const s = [a * a - b * b, 2 * a * b];
  const f = n === 2 ? s : [s[0] * a - s[1] * b, s[0] * b + s[1] * a];
  const steps = [
    `Druhá mocnina podle $(A + B)^2 = A^2 + 2AB + B^2$: $${parAlways(a, b)}^2 = ${a * a} ${sg(2 * a * b)}${I} ${sg(b * b)}${I}^2$.`,
    `$${I}^2 = -1$: $${parAlways(a, b)}^2 = ${cxTex(...s)}$`,
  ];
  if (n === 3) steps.push(`Třetí mocnina = druhá krát první: $${parAlways(...s)}\\cdot${parAlways(a, b)}$, roznásob a $${I}^2 = -1$.`, `$z = ${cxTex(...f)}$`);
  return form({
    key: 'powCx', prompt: 'Urči algebraický tvar komplexního čísla', fn: `z = ${parAlways(a, b)}^{${n}}`,
    fields: [cfield(...f)], hint: n === 3 ? 'z³ = z² · z. Nejdřív druhou mocninu.' : '(a + bi)² = a² + 2abi + b²i²',
    steps, data: { a, b, n, s, f },
  });
}
export function powGuided(fix) {
  const c0 = powCx(fix);
  const { a, b, n, s, f } = c0.data;
  const g = [{ kind: 'form', title: `Nejdřív $${parAlways(a, b)}^2$`, info: '$(A + B)^2 = A^2 + 2AB + B^2$ a pak $\\mathrm{i}^2 = -1$.', fields: [cfield(...s, `$${parAlways(a, b)}^2 =$`)] }];
  if (n === 3) g.push({ kind: 'form', title: `Teď krát $${parAlways(a, b)}$`, info: `$${parAlways(...s)}\\cdot${parAlways(a, b)}$`, fields: [cfield(...f)] });
  return { type: 'guided', key: 'powCx:guided', prompt: c0.prompt, fn: c0.fn, steps: c0.steps, gsteps: g };
}

// =====================================================================
// Dělení
// =====================================================================
export function conj() {
  const a = nz(), b = nz();
  return form({
    key: 'conj', prompt: `Pro $z = ${cxTex(a, b)}$ urči komplexně sdružené číslo a součin $z\\cdot\\bar z$.`,
    fields: [cfield(a, -b, '$\\bar z =$'), { kind: 'num', label: '$z\\cdot\\bar z =$', answer: a * a + b * b, tex: String(a * a + b * b), text: String(a * a + b * b) }],
    hint: 'Sdružené = otoč znaménko u i. Součin = a² + b².',
    steps: [`$\\bar z$: stejné číslo, jen u $${I}$ opačné znaménko: $${cxTex(a, -b)}$.`, `$z\\cdot\\bar z = a^2 + b^2 = ${a * a} + ${b * b} = ${a * a + b * b}$ (vždycky reálné číslo, $${I}$ zmizí).`],
  });
}

export function divCx(fix) {
  let a, b, c, d;
  if (fix) [a, b, c, d] = fix;
  else if (Math.random() < 0.45) { a = pick([1, 1, 2, 5]); b = 0; c = riNot(-4, 4, 0); d = riNot(-4, 4, 0); }
  else { a = nz(); b = nz(); c = riNot(-4, 4, 0); d = riNot(-4, 4, 0); }
  const q = c * c + d * d;
  const nr = a * c + b * d, ni = b * c - a * d;
  const re = [nr, q], im = [ni, q];
  const top = b === 0 ? String(a) : cxTex(a, b);
  return form({
    key: 'divCx', prompt: 'Urči algebraický tvar komplexního čísla', fn: `z = \\frac{${top}}{${cxTex(c, d)}}`,
    fields: [cfield(re, im)], hint: 'Rozšiř zlomek číslem komplexně sdruženým ke jmenovateli.',
    steps: [
      `Rozšiř číslem sdruženým ke jmenovateli: $\\frac{${top}}{${cxTex(c, d)}}\\cdot\\frac{${cxTex(c, -d)}}{${cxTex(c, -d)}}$`,
      `Jmenovatel: $${parAlways(c, d)}${parAlways(c, -d)} = ${c * c} + ${d * d} = ${q}$ (to je celý trik: $${I}$ dole zmizí).`,
      `Čitatel: $${b === 0 ? (a === 1 ? '' : a) : parAlways(a, b)}${parAlways(c, -d)} = ${cxTex(nr, ni)}$`,
      `Vyděl každou část zvlášť: $z = \\frac{${cxTex(nr, ni)}}{${q}} = ${cxTex(re, im)}$`,
    ],
    data: { a, b, c, d, q, nr, ni, re, im, top },
  });
}
export function divGuided(fix) {
  const c0 = divCx(fix);
  const { c, d, q, nr, ni, re, im, top } = c0.data;
  return {
    type: 'guided', key: 'divCx:guided', prompt: c0.prompt, fn: c0.fn, steps: c0.steps,
    gsteps: [
      { kind: 'choice', title: 'Čím zlomek rozšíříš?', options: options(`$${cxTex(c, -d)}$`, [`$${cxTex(c, d)}$`, `$${I}$`, `$${cxTex(-c, d)}$`], 'Číslem komplexně sdruženým ke jmenovateli: stejné, jen opačné znaménko u $\\mathrm{i}$.') },
      { kind: 'form', title: 'Jmenovatel', info: `$${parAlways(c, d)}${parAlways(c, -d)} = c^2 + d^2$`, fields: [{ kind: 'num', label: '$=$', answer: q, tex: String(q), text: String(q) }] },
      { kind: 'form', title: 'Čitatel', info: `$${top === '1' ? '' : `\\left(${top}\\right)`}${parAlways(c, -d)}$`, fields: [cfield(nr, ni, '$=$')] },
      { kind: 'form', title: 'Vyděl a napiš výsledek', info: `$\\frac{${cxTex(nr, ni)}}{${q}}$: reálnou i imaginární část zvlášť.`, fields: [cfield(re, im)] },
    ],
  };
}

// =====================================================================
// Mix a příklady z testu
// =====================================================================
export const FIXED = {
  A1a: () => ({ ...powCx([1, 1, 3]), key: 'A1a', prompt: 'Urči algebraický tvar komplexního čísla $z$.' }),
  A1b: () => ({ ...divCx([1, 0, 3, 1]), key: 'A1b', prompt: 'Urči algebraický tvar komplexního čísla $z$.' }),
  B1a: () => ({ ...gaussRead([3, 3]), key: 'B1a', prompt: 'V Gaussově rovině je znázorněné komplexní číslo $z$. Urči jeho algebraický tvar.' }),
};
export const anyOp = () => pick([addSub, mulCx, powCx, divCx, conj])();
export const GEN = { reIm, iPow, gaussRead, gaussPick, addSub, mulCx, powCx, divCx, conj };
