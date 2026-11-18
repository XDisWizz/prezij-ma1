// Generátory pro cestu „Goniometrický tvar“ (Základy matematiky): tabulka úhlů, převody, násobení, Moivre, odmocniny.
import { ri, pick, shuffle } from '../../ui.js';
import { form, options } from '../form.js';
import * as X from '../expr.js';
import { gauss, circle } from '../plot.js';
import { NICE, FIRST, cosV, sinV, valTex, valTxt, scale, gonioTex, norm360, quadrant, QNAME } from '../trig.js';

const R = String.raw;
const I = '\\mathrm{i}';
const deg = d => `${d}^{\\circ}`;
const num = (v, label) => ({ kind: 'num', label, answer: v, tex: String(v), text: String(v) });
const angle = (d, label = '$\\varphi =$') => ({ kind: 'angle', label, answer: d, tex: deg(d), text: String(d), unit: '$^{\\circ}$' });
const surd = (k, n) => X.surdTex(k, n);

// =====================================================================
// Tabulka úhlů
// =====================================================================
const TRICK = R`Trik na první kvadrant: $\sin$ úhlů $0^\circ, 30^\circ, 45^\circ, 60^\circ, 90^\circ$ je $\frac{\sqrt{0}}{2}, \frac{\sqrt{1}}{2}, \frac{\sqrt{2}}{2}, \frac{\sqrt{3}}{2}, \frac{\sqrt{4}}{2}$. Kosinus je totéž pozpátku.`;
const FIRST_OPTS = ['0', '\\frac{1}{2}', '\\frac{\\sqrt{2}}{2}', '\\frac{\\sqrt{3}}{2}', '1'];
export function trigVal1() {
  const d = pick(FIRST), f = pick(['sin', 'cos']);
  const v = valTex(f === 'sin' ? sinV(d) : cosV(d));
  return {
    type: 'choice', key: 'trigVal1', prompt: 'Kolik je', context: `\\${f} ${deg(d)}`,
    options: FIRST_OPTS.map(o => ({ label: `$${o}$`, correct: o === v })), explain: TRICK + ` Tady: $\\${f} ${deg(d)} = ${v}$.`,
  };
}
export function trigValAll() {
  const d = pick(NICE.filter(x => x > 90 || Math.random() < 0.2)), f = pick(['sin', 'cos']);
  const V = f === 'sin' ? sinV(d) : cosV(d), W = f === 'sin' ? cosV(d) : sinV(d);
  const v = valTex(V);
  const q = quadrant(d);
  const ref = q === 0 ? null : [0, d, 180 - d, d - 180, 360 - d][q];
  const why = q === 0
    ? `Úhel $${deg(d)}$ leží na ose: podívej se na jednotkovou kružnici, $\\cos$ je vodorovná souřadnice, $\\sin$ svislá.`
    : `$${deg(d)}$ je v ${QNAME[q]} kvadrantu, „základní“ úhel je $${deg(ref)}$. Hodnota je stejná jako u $${deg(ref)}$, jen znaménko podle kvadrantu: ${f === 'sin' ? 'sin je kladný nahoře (I. a II.)' : 'cos je kladný vpravo (I. a IV.)'}.`;
  return {
    type: 'choice', key: 'trigValAll', prompt: 'Kolik je', context: `\\${f} ${deg(d)}`,
    options: options(`$${v}$`, [[`$${valTex(scale(-1, V))}$`, 'Hodnota sedí, znaménko ne.'], [`$${valTex(W)}$`, 'Tohle je hodnota té druhé funkce.'], [`$${valTex(scale(-1, W))}$`, ''], ['$1$', ''], ['$0$', '']].filter(o => o[0] !== `$${v}$`)),
    explain: why + ` $\\${f} ${deg(d)} = ${v}$.`,
    show: circle({ angles: [{ deg: d, label: deg(d).replace('^{\\circ}', '°') }] }),
  };
}
export function quadQ() {
  const d = pick([ri(1, 89), ri(91, 179), ri(181, 269), ri(271, 359)]);
  const q = quadrant(d);
  const why = 'I. kvadrant $0^\\circ$–$90^\\circ$, II. $90^\\circ$–$180^\\circ$, III. $180^\\circ$–$270^\\circ$, IV. $270^\\circ$–$360^\\circ$.';
  return { type: 'choice', key: 'quadQ', prompt: `Ve kterém kvadrantu leží úhel $${deg(d)}$?`, options: [1, 2, 3, 4].map(k => ({ label: QNAME[k] + ' kvadrant', correct: k === q })), explain: why };
}

// =====================================================================
// Goniometrický → algebraický
// =====================================================================
const ALG_ANGLES = [30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330, 90, 180, 270, 0];
export function polarToAlg(fix) {
  const [r, d] = fix || [pick([2, 4, 6, 8, 10]), pick(ALG_ANGLES.slice(0, 12).concat(pick([ALG_ANGLES.slice(12)])))];
  const c = cosV(d), s = sinV(d), rc = scale(r, c), rs = scale(r, s);
  const reT = valTex(rc), imAbs = valTex(scale(Math.sign(rs.p) || 1, rs));
  const imT = rs.p === 0 ? '' : `${imAbs === '1' ? '' : imAbs}${I}`;
  const tex = rs.p === 0 ? reT : rc.p === 0 ? `${rs.p < 0 ? '-' : ''}${imT}` : `${reT} ${rs.p < 0 ? '-' : '+'} ${imT}`;
  const txtI = valTxt(scale(Math.sign(rs.p) || 1, rs));
  const text = `${valTxt(rc)} ${rs.p < 0 ? '-' : '+'} ${txtI === '1' ? '' : txtI.includes('/') ? `(${txtI})` : txtI}i`;
  return form({
    key: 'polarToAlg', prompt: 'Urči algebraický tvar komplexního čísla', fn: `z = ${gonioTex(String(r), d)}`,
    fields: [{ kind: 'complex', label: '$z =$', answer: [rc.v, rs.v], tex, text }],
    hint: 'Dosaď hodnoty cos a sin z tabulky a roznásob r.',
    steps: [`Z tabulky: $\\cos ${deg(d)} = ${valTex(c)}$, $\\sin ${deg(d)} = ${valTex(s)}$.`, `$z = ${r}\\left(${valTex(c)} + ${s.p < 0 ? `\\left(${valTex(s)}\\right)` : valTex(s)}\\,${I}\\right)$`, `Roznásob: $z = ${tex}$`],
    data: { r, d, c, s, tex },
  });
}
export function polarToAlgGuided() {
  const c0 = polarToAlg();
  const { d, c, s } = c0.data;
  return {
    type: 'guided', key: 'polarToAlg:guided', prompt: c0.prompt, fn: c0.fn, steps: c0.steps,
    gsteps: [
      { kind: 'form', title: 'Hodnoty z tabulky', fields: [{ kind: 'num', label: `$\\cos ${deg(d)} =$`, answer: c.v, tex: valTex(c), text: valTxt(c) }, { kind: 'num', label: `$\\sin ${deg(d)} =$`, answer: s.v, tex: valTex(s), text: valTxt(s) }], why: TRICK },
      { kind: 'form', title: 'Roznásob číslem před závorkou', fields: c0.fields },
    ],
  };
}

// =====================================================================
// Algebraický → goniometrický
// =====================================================================
/** z s hezkým úhlem: { reT, imT, re, im, rT, r, d } */
function niceZ(intOnly = false) {
  const fam = intOnly ? pick(['45', '45', 'axis']) : pick(['45', '30', '60', 'axis', '45', '30']);
  const k = ri(1, 4);
  let d;
  if (fam === 'axis') d = pick([90, 180, 270, 0]);
  else if (fam === '45') d = pick([45, 135, 225, 315]);
  else if (fam === '30') d = pick([30, 150, 210, 330]);
  else d = pick([60, 120, 240, 300]);
  const sx = Math.sign(Math.round(Math.cos(d * Math.PI / 180) * 1e6)), sy = Math.sign(Math.round(Math.sin(d * Math.PI / 180) * 1e6));
  let reT, imT, re, im, rT, r, txt;
  const kk = k === 1 ? '' : String(k);
  if (fam === 'axis') { re = sx * k; im = sy * k; reT = String(re); imT = String(im); r = k; rT = String(k); }
  else if (fam === '45') { re = sx * k; im = sy * k; r = k * Math.SQRT2; rT = surd(k, 2); }
  else if (fam === '30') { re = sx * k * Math.sqrt(3); im = sy * k; r = 2 * k; rT = String(2 * k); }
  else { re = sx * k; im = sy * k * Math.sqrt(3); r = 2 * k; rT = String(2 * k); }
  const tR = fam === '30' ? `${sx < 0 ? '-' : ''}${kk}\\sqrt{3}` : String(sx * k);
  const tI = fam === '60' ? `${kk}\\sqrt{3}\\,${I}` : `${kk}${I}`;
  const xR = fam === '30' ? `${sx < 0 ? '-' : ''}${kk}√3` : String(sx * k);
  const xI = fam === '60' ? `${kk}√3i` : `${kk}i`;
  if (fam === 'axis') {
    const tex = sy === 0 ? String(re) : `${sy < 0 ? '-' : ''}${kk}${I}`;
    txt = sy === 0 ? String(re) : `${sy < 0 ? '-' : ''}${kk}i`;
    return { tex, txt, re, im, r, rT, d, fam, k };
  }
  return { tex: `${tR} ${sy < 0 ? '-' : '+'} ${tI}`, txt: `${xR} ${sy < 0 ? '-' : '+'} ${xI}`, re, im, r, rT, d, fam, k };
}
const rText = z => (z.fam === '45' ? `${z.k === 1 ? '' : z.k}√2` : String(z.r));
function polarSteps(z) {
  const q = quadrant(z.d);
  const a2 = +(z.re * z.re).toFixed(6), b2 = +(z.im * z.im).toFixed(6);
  const ref = [0, z.d, 180 - z.d, z.d - 180, 360 - z.d][q];
  return [
    `Absolutní hodnota: $|z| = \\sqrt{a^2 + b^2} = \\sqrt{${a2} + ${b2}} = ${z.rT}$.`,
    q === 0 ? `Číslo leží přímo na ose, úhel je $${deg(z.d)}$.`
      : `Číslo je v ${QNAME[q]} kvadrantu (Re ${z.re > 0 ? 'kladná' : 'záporná'}, Im ${z.im > 0 ? 'kladná' : 'záporná'}). Základní úhel z $\\operatorname{tg}\\alpha = \\frac{|b|}{|a|}$ je $${deg(ref)}$${q === 1 ? '' : `, v ${QNAME[q]} kvadrantu je to $${q === 2 ? '180^\\circ - ' : q === 3 ? '180^\\circ + ' : '360^\\circ - '}${deg(ref)} = ${deg(z.d)}$`}.`,
    `Kontrola: $\\cos\\varphi = \\frac{a}{|z|}$ a $\\sin\\varphi = \\frac{b}{|z|}$ musí sedět i se znaménky.`,
    `$z = ${gonioTex(z.rT, z.d)}$`,
  ];
}
export function algToPolar(fixZ, gaussPic = false) {
  const z = fixZ || niceZ(gaussPic);
  return form({
    key: gaussPic ? 'gaussPolar' : 'algToPolar', prompt: gaussPic ? 'V Gaussově rovině je znázorněné číslo $z$. Urči jeho goniometrický tvar.' : 'Urči goniometrický tvar čísla',
    fn: gaussPic ? null : `z = ${z.tex}`, show: gaussPic ? gauss([{ re: z.re, im: z.im, label: 'z' }], { arrows: true }) : null,
    fields: [{ kind: 'num', label: '$|z| =$', answer: z.r, tex: z.rT, text: rText(z) }, angle(z.d)],
    hint: '|z| = √(a² + b²), úhel podle kvadrantu.',
    steps: polarSteps(z), data: z,
  });
}
export const gaussPolar = () => algToPolar(null, true);
export function algToPolarGuided(gaussPic = false) {
  const c0 = algToPolar(null, gaussPic);
  const z = c0.data;
  const q = quadrant(z.d);
  return {
    type: 'guided', key: 'algToPolar:guided', prompt: c0.prompt, fn: c0.fn, show: c0.show, steps: c0.steps,
    gsteps: [
      { kind: 'form', title: 'Absolutní hodnota', info: '$|z| = \\sqrt{a^2 + b^2}$', fields: [c0.fields[0]] },
      { kind: 'choice', title: 'Kde číslo leží?', options: [0, 1, 2, 3, 4].map(k => ({ label: k ? QNAME[k] + ' kvadrant' : 'na ose', correct: k === q, why: 'Podle znamének: Re > 0 vpravo, Im > 0 nahoře.' })) },
      { kind: 'form', title: 'Úhel', info: q === 0 ? 'Na ose: $0^\\circ$, $90^\\circ$, $180^\\circ$ nebo $270^\\circ$.' : 'Základní úhel z tabulky ($30^\\circ$, $45^\\circ$, $60^\\circ$), pak ho otoč do správného kvadrantu.', fields: [c0.fields[1]] },
    ],
  };
}

// =====================================================================
// Násobení, dělení, mocnina, odmocniny
// =====================================================================
const angleRnd = () => 5 * ri(1, 34);
export function mulPolar(fix) {
  const [r1, d1, r2, d2] = fix || [ri(2, 9), angleRnd(), ri(2, 6), angleRnd()];
  const r = r1 * r2, d = norm360(d1 + d2);
  return form({
    key: 'mulPolar', prompt: 'Vynásob $z_1 z_2$. Výsledek v goniometrickém tvaru.', show: `$$z_1 = ${gonioTex(String(r1), d1)}$$$$z_2 = ${gonioTex(String(r2), d2)}$$`,
    fields: [num(r, '$r =$'), angle(d)], hint: 'Absolutní hodnoty se násobí, úhly se sčítají.',
    steps: [`Absolutní hodnoty vynásob: $${r1}\\cdot${r2} = ${r}$.`, `Úhly sečti: $${d1}^\\circ + ${d2}^\\circ = ${d1 + d2}^\\circ$${d1 + d2 >= 360 ? `, odečti $360^\\circ$: $${deg(d)}$` : ''}.`, `$z_1 z_2 = ${gonioTex(String(r), d)}$`],
  });
}
export function divPolar(fix) {
  let r1, d1, r2, d2;
  if (fix) [r1, d1, r2, d2] = fix;
  else { r2 = ri(2, 5); r1 = r2 * ri(1, 6); d1 = angleRnd(); d2 = angleRnd(); }
  const r = r1 / r2, raw = d1 - d2, d = norm360(raw);
  return form({
    key: 'divPolar', prompt: 'Urči podíl $\\frac{z_1}{z_2}$. Výsledek v goniometrickém tvaru.', show: `$$z_1 = ${gonioTex(String(r1), d1)}$$$$z_2 = ${gonioTex(String(r2), d2)}$$`,
    fields: [num(r, '$r =$'), angle(d)], hint: 'Absolutní hodnoty se dělí, úhly se odečítají.',
    steps: [`Absolutní hodnoty vyděl: $\\frac{${r1}}{${r2}} = ${r}$.`, `Úhly odečti: $${d1}^\\circ - ${d2}^\\circ = ${raw}^\\circ$${raw < 0 ? `, přičti $360^\\circ$: $${deg(d)}$ (oboje je správně, jde o stejný úhel)` : ''}.`, `$\\frac{z_1}{z_2} = ${gonioTex(String(r), d)}$`],
  });
}
export function powPolar(fix) {
  let r1, d1, n;
  if (fix) [r1, d1, n] = fix;
  else { n = ri(2, 6); r1 = n <= 3 ? ri(2, 4) : pick([2, 2, 3]); d1 = angleRnd(); }
  const r = r1 ** n, raw = n * d1, d = norm360(raw);
  const turns = Math.floor(raw / 360);
  return form({
    key: 'powPolar', prompt: `Urči $(z_2)^{${n}}$. Výsledek v goniometrickém tvaru.`, show: `$$z_2 = ${gonioTex(String(r1), d1)}$$`,
    fields: [num(r, '$r =$'), angle(d)], hint: 'Moivreova věta: r na n-tou, úhel krát n.',
    steps: [R`Moivreova věta: $\left[r(\cos\varphi + \mathrm{i}\sin\varphi)\right]^n = r^n(\cos n\varphi + \mathrm{i}\sin n\varphi)$.`, `$r^{${n}} = ${r1}^{${n}} = ${r}$`, `Úhel: $${n}\\cdot${d1}^\\circ = ${raw}^\\circ$${turns ? `, odečti $${turns}\\cdot 360^\\circ$: $${deg(d)}$` : ''}.`, `$(z_2)^{${n}} = ${gonioTex(String(r), d)}$`],
  });
}
export function rootsPolar(fix) {
  let s, n, d1;
  if (fix) [s, n, d1] = fix;
  else { n = pick([2, 3, 3, 4]); s = n === 4 ? pick([1, 2]) : pick([1, 2, 3]); d1 = n * 5 * ri(1, Math.floor(70 / n)); }
  const r1 = s ** n, step = 360 / n;
  const angs = Array.from({ length: n }, (_, k) => d1 / n + k * step);
  const nm = n === 2 ? 'druhé' : n === 3 ? 'třetí' : 'čtvrté';
  return form({
    key: 'rootsPolar', prompt: `Urči všechny ${nm} odmocniny čísla $z_1$. Výsledek v goniometrickém tvaru.`, show: `$$z_1 = ${gonioTex(String(r1), d1)}$$`,
    fields: [{ ...num(s, '$|w| =$'), w: 1 }, { kind: 'angles', label: '$\\varphi_k =$', answer: angs, tex: angs.map(deg).join(';\\ '), text: angs.join('; '), w: 3, unit: '$^{\\circ}$' }],
    hint: `Odmocnin je ${n}, všechny mají stejnou velikost a úhly jsou od sebe ${step}°.`,
    steps: [
      `Velikost: $\\sqrt[${n}]{${r1}} = ${s}$ (stejná pro všechny).`,
      `První úhel: $\\frac{${d1}^\\circ}{${n}} = ${deg(d1 / n)}$.`,
      `Další dostaneš přičítáním $\\frac{360^\\circ}{${n}} = ${deg(step)}$: ${angs.map(a => `$${deg(a)}$`).join(', ')}.`,
      ...angs.map((a, k) => `$w_${k} = ${gonioTex(String(s), a)}$`),
    ],
    data: { s, n, d1, r1, step, angs },
  });
}
export function rootsGuided(fix) {
  const c0 = rootsPolar(fix);
  const { s, n, d1, r1, step, angs } = c0.data;
  return {
    type: 'guided', key: 'rootsPolar:guided', prompt: c0.prompt, show: c0.show, steps: c0.steps,
    gsteps: [
      { kind: 'form', title: 'Velikost všech odmocnin', info: `$\\sqrt[${n}]{${r1}}$`, fields: [num(s, '$|w| =$')] },
      { kind: 'form', title: 'První úhel', info: `Úhel vyděl odmocnitelem: $\\frac{${d1}^\\circ}{${n}}$`, fields: [angle(d1 / n, '$\\varphi_0 =$')] },
      { kind: 'form', title: 'O kolik se úhly liší?', info: `Kořeny jsou rovnoměrně po kružnici: $\\frac{360^\\circ}{${n}}$`, fields: [{ ...num(step, '$=$'), unit: '$^{\\circ}$' }] },
      { kind: 'form', title: 'Všechny úhly', info: 'Přičítej krok, dokud jich nemáš tolik, kolik je odmocnitel.', fields: [c0.fields[1]] },
    ],
  };
}

// =====================================================================
// Příklady z testu
// =====================================================================
const P = R`Jsou dána komplexní čísla`;
export const FIXED = {
  A2a: () => ({ ...polarToAlg([8, 60]), key: 'A2a', prompt: `${P} $z_1 = 8(\\cos 60^\\circ + ${I}\\sin 60^\\circ)$, $z_2 = 2(\\cos 12^\\circ + ${I}\\sin 12^\\circ)$. Urči algebraický tvar $z_1$.`, fn: null }),
  A2b: () => ({ ...mulPolar([8, 60, 2, 12]), key: 'A2b' }),
  A2c: () => ({ ...powPolar([2, 12, 5]), key: 'A2c' }),
  A2d: () => ({ ...rootsPolar([2, 3, 60]), key: 'A2d' }),
  B1b: () => ({ ...algToPolar({ tex: `3 + 3${I}`, txt: '3 + 3i', re: 3, im: 3, r: 3 * Math.SQRT2, rT: '3\\sqrt{2}', d: 45, fam: '45', k: 3 }, true), key: 'B1b' }),
  B2a: () => ({ ...mulPolar([9, 80, 3, 20]), key: 'B2a' }),
  B2b: () => ({ ...divPolar([9, 80, 3, 20]), key: 'B2b' }),
  B2c: () => ({ ...powPolar([3, 20, 5]), key: 'B2c' }),
  B2d: () => ({ ...rootsPolar([3, 2, 80]), key: 'B2d' }),
};
export const GEN = { trigVal1, trigValAll, quadQ, polarToAlg, algToPolar, gaussPolar, mulPolar, divPolar, powPolar, rootsPolar };
export { shuffle };
