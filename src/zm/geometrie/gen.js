// Generátory pro cestu „Přímky a roviny v prostoru“ (Základy matematiky).
import { ri, riNot, pick, shuffle } from '../../ui.js';
import { form, options } from '../form.js';
import { near } from '../expr.js';

const P3 = () => [ri(-3, 4), ri(-3, 4), ri(-3, 4)];
const ptT = p => `[${p.join(',\\ ')}]`;
const vT = v => `(${v.join(',\\ ')})`;
const vTxt = v => `(${v.join(', ')})`;
const sub = (b, a) => b.map((x, i) => x - a[i]);
const dot = (u, v) => u.reduce((s, x, i) => s + x * v[i], 0);
const isZero = v => v.every(x => x === 0);
const parallel = (u, v) => { const k = v.findIndex(x => Math.abs(x) > 1e-12); if (k < 0 || isZero(u)) return false; const l = u[k] / v[k]; return u.every((x, i) => near(x, l * v[i], 1e-7)); };
const term = (c, n, first) => (c === 0 ? '' : `${first ? (c < 0 ? '-' : '') : c < 0 ? ' - ' : ' + '}${Math.abs(c) === 1 ? '' : Math.abs(c)}${n}`);
/** a x + b y + c z + d = 0 → TeX */
export function planeTex([a, b, c, d]) {
  let s = '';
  for (const [k, n] of [[a, 'x'], [b, 'y'], [c, 'z']]) s += term(k, n, !s);
  if (d) s += ` ${d < 0 ? '-' : '+'} ${Math.abs(d)}`;
  return `${s} = 0`;
}
const planeTxt = p => planeTex(p).replace(/\s+/g, ' ');
const vecField = (v, label, extra = {}) => ({ kind: 'vec', label, answer: v, tex: vT(v), text: vTxt(v), ...extra });

// ------------------------------------------------------------ vektor z bodů
export function vecAB() {
  let A, B; do { A = P3(); B = P3(); } while (isZero(sub(B, A)));
  const u = sub(B, A);
  return form({
    key: 'vecAB', prompt: `Urči vektor $\\overrightarrow{AB}$ pro $A = ${ptT(A)}$, $B = ${ptT(B)}$.`,
    fields: [vecField(u, '$\\overrightarrow{AB} =$')], hint: 'Konec mínus začátek: B − A.',
    steps: [`Vektor z $A$ do $B$ = <b>konec mínus začátek</b>: $B - A$.`, `$(${B.map((b, i) => `${b} - ${A[i] < 0 ? `(${A[i]})` : A[i]}`).join(',\\ ')}) = ${vT(u)}$`],
  });
}

// ------------------------------------------------------------ přímka
export function lineEq(fix) {
  let A, B;
  if (fix) [A, B] = fix; else do { A = P3(); B = P3(); } while (isZero(sub(B, A)));
  const u = sub(B, A);
  const onLine = p => parallel(sub(p, A), u) || isZero(sub(p, A));
  return form({
    key: 'lineEq', prompt: `Urči vektorovou rovnici přímky $p$, na které leží body $A = ${ptT(A)}$ a $B = ${ptT(B)}$.`,
    fields: [
      { kind: 'vec', label: '$X =$', answer: A, tex: ptT(A), text: vTxt(A), accept: onLine, why: 'Bod musí ležet na přímce. Nejjednodušší je vzít přímo $A$ (nebo $B$).' },
      { kind: 'vec', label: '$+\\ k\\cdot$', answer: u, tex: vT(u), text: vTxt(u), parallel: true, why: 'Směrový vektor je $B - A$ (nebo jeho násobek).' },
    ],
    hint: 'X = bod + k · směrový vektor. Směr = B − A.',
    steps: [`Bod na přímce: třeba $A = ${ptT(A)}$.`, `Směrový vektor: $\\vec u = B - A = ${vT(u)}$.`, `$X = ${ptT(A)} + k\\,${vT(u)},\\ k \\in \\mathbb{R}$`, 'Projde i jiný bod přímky (třeba $B$) nebo násobek vektoru, třeba $-\\vec u$.'],
  });
}
export function onLineQ() {
  const A = P3(); let u; do { u = [ri(-2, 2), ri(-2, 2), ri(-2, 2)]; } while (isZero(u));
  const k = riNot(-3, 3, 0), yes = Math.random() < 0.5;
  const Q = A.map((a, i) => a + k * u[i]);
  if (!yes) { const j = ri(0, 2); Q[j] += pick([-1, 1]); }
  const on = parallel(sub(Q, A), u);
  const why = on ? `Pro $k = ${k}$: $${ptT(A)} + ${k < 0 ? `(${k})` : k}\\cdot${vT(u)} = ${ptT(Q)}$. Leží.` : `Žádné $k$ nesedí do všech tří souřadnic najednou (zkus to z jedné souřadnice a dosaď do ostatních).`;
  return {
    type: 'choice', key: 'onLineQ', prompt: `Leží bod $Q = ${ptT(Q)}$ na přímce?`, context: `X = ${ptT(A)} + k\\,${vT(u)}`,
    options: [{ label: 'Ano', correct: on, why }, { label: 'Ne', correct: !on, why }], explain: why,
  };
}

// ------------------------------------------------------------ rovina
const rndN = () => { let n; do { n = [ri(-3, 4), ri(-3, 4), ri(-3, 4)]; } while (isZero(n) || n.filter(x => x).length < 2); return n; };
export function normalRead() {
  const n = rndN(), d = ri(-6, 6);
  return form({
    key: 'normalRead', prompt: 'Urči normálový vektor roviny', fn: `\\rho:\\ ${planeTex([...n, d])}`,
    fields: [vecField(n, '$\\vec n =$', { parallel: true })], hint: 'Čísla před x, y, z.',
    steps: [`Normálový vektor jsou koeficienty u $x$, $y$, $z$ (i se znaménkem, a když tam proměnná chybí, je to $0$): $\\vec n = ${vT(n)}$.`],
  });
}
export function planeEq(fix) {
  let A, n;
  if (fix) [A, n] = fix; else { A = P3(); n = rndN(); }
  const d = -dot(n, A);
  const p = [...n, d];
  return form({
    key: 'planeEq', prompt: `Urči obecnou rovnici roviny $\\rho$, na které leží bod $A = ${ptT(A)}$ a jejím normálovým vektorem je $\\vec n_\\rho = ${vT(n)}$.`,
    fields: [{ kind: 'plane', label: '$\\rho:$', answer: p, tex: planeTex(p), text: planeTxt(p) }],
    hint: 'ax + by + cz + d = 0, kde (a, b, c) = n. d dopočítej dosazením A.',
    steps: [`Koeficienty u $x, y, z$ jsou normálový vektor: $${planeTex([...n, 0]).replace(' = 0', '')} + d = 0$.`, `Dosaď bod $A$: $${n.map((c, i) => `${i ? (c < 0 ? ' - ' : ' + ') : c < 0 ? '-' : ''}${Math.abs(c)}\\cdot ${A[i] < 0 ? `(${A[i]})` : A[i]}`).join('')} + d = 0$, tedy $${-d} + d = 0$ a $d = ${d}$.`, `$\\rho:\\ ${planeTex(p)}$`],
    data: { A, n, d, p },
  });
}
export function planeEqGuided() {
  const c0 = planeEq();
  const { A, n, d } = c0.data;
  return {
    type: 'guided', key: 'planeEq:guided', prompt: c0.prompt, steps: c0.steps,
    gsteps: [
      { kind: 'form', title: 'Dopočítej $d$', info: `$${planeTex([...n, 0]).replace(' = 0', '')} + d = 0$. Dosaď $A = ${ptT(A)}$.`, fields: [{ kind: 'num', label: '$d =$', answer: d, tex: String(d), text: String(d) }] },
      { kind: 'form', title: 'Celá rovnice', fields: c0.fields },
    ],
  };
}

// ------------------------------------------------------------ vzájemná poloha rovin
const POS = ['rovnoběžné různé', 'totožné', 'různoběžné'];
export function planePos(fix) {
  let r, f, kind;
  if (fix) [r, f] = fix;
  else {
    kind = pick(['par', 'par', 'same', 'cross', 'cross', 'perp']);
    const n = rndN(), d = ri(-6, 6);
    r = [...n, d];
    const l = pick([2, -1, 3, -2]);
    if (kind === 'par') f = [...n.map(x => l * x), l * d + riNot(-4, 4, 0)];
    else if (kind === 'same') f = r.map(x => l * x);
    else {
      let m;
      do { m = rndN(); } while (parallel(m, n) || (kind === 'perp' ? dot(m, n) !== 0 : false));
      f = [...m, ri(-6, 6)];
    }
  }
  const nr = r.slice(0, 3), nf = f.slice(0, 3);
  const par = parallel(nf, nr);
  const same = par && parallel(f, r);
  const ans = same ? 1 : par ? 0 : 2;
  const perp = !par && dot(nr, nf) === 0;
  const k = par ? nf[nr.findIndex(x => x)] / nr[nr.findIndex(x => x)] : null;
  const why = [
    `Normálové vektory: $\\vec n_\\rho = ${vT(nr)}$, $\\vec n_\\varphi = ${vT(nf)}$.`,
    par ? `$\\vec n_\\varphi = ${k}\\cdot\\vec n_\\rho$: vektory jsou rovnoběžné, takže i roviny jsou rovnoběžné.` : 'Vektory nejsou násobkem jeden druhého: roviny jsou <b>různoběžné</b> (protínají se v přímce).',
    par ? (same ? `I $d$ odpovídá stejnému násobku ($${r[3]}\\cdot ${k} = ${f[3]}$): je to <b>ta samá rovina</b>, roviny jsou totožné.` : `Ale $d$ nesedí ($${r[3]}\\cdot ${k} = ${r[3] * k} \\ne ${f[3]}$): roviny jsou <b>rovnoběžné různé</b>.`) : (perp ? `Navíc $\\vec n_\\rho\\cdot\\vec n_\\varphi = 0$, takže jsou dokonce kolmé.` : `Kolmé nejsou: $\\vec n_\\rho\\cdot\\vec n_\\varphi = ${dot(nr, nf)} \\ne 0$.`),
  ];
  return {
    type: 'choice', key: 'planePos', prompt: 'Urči vzájemnou polohu rovin', context: `\\rho:\\ ${planeTex(r)}\\qquad \\varphi:\\ ${planeTex(f)}`,
    options: POS.map((p, i) => ({ label: `Roviny jsou ${p}.`, correct: i === ans, why: why.slice(1).join(' ') })), explain: why.join(' '), steps: why,
    data: { r, f, nr, nf, par, same, k },
  };
}
export function planePosGuided() {
  const c0 = planePos();
  const { nr, nf, par, same } = c0.data;
  const g = [
    { kind: 'form', title: 'Normálové vektory', fields: [vecField(nr, '$\\vec n_\\rho =$'), vecField(nf, '$\\vec n_\\varphi =$')] },
    { kind: 'choice', title: 'Je jeden násobkem druhého?', options: [{ label: 'Ano', correct: par, why: '' }, { label: 'Ne', correct: !par, why: '' }] },
  ];
  if (par) g.push({ kind: 'choice', title: 'Odpovídá i $d$ stejnému násobku?', options: [{ label: 'Ano', correct: same, why: '' }, { label: 'Ne', correct: !same, why: '' }] });
  g.push({ kind: 'choice', title: 'Roviny jsou…', options: c0.options });
  return { type: 'guided', key: 'planePos:guided', prompt: c0.prompt, fn: c0.context, steps: c0.steps, gsteps: g };
}

export const FIXED = {
  A5: () => ({ ...lineEq([[1, 0, 1], [1, 1, 2]]), key: 'A5' }),
  B5: () => ({ ...planeEq([[1, 0, 1], [1, 2, 3]]), key: 'B5' }),
  A6: () => ({ ...planePos([[5, 3, -2, 2], [10, 6, -4, 3]]), key: 'A6' }),
  B6: () => ({ ...planePos([[5, 3, -2, 2], [10, 6, 5, 4]]), key: 'B6' }),
};
export const GEN = { vecAB, lineEq, onLineQ, normalRead, planeEq, planePos };
export { shuffle, options };
