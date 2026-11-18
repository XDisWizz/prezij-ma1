// Simulace testu ze Základů matematiky: stejná stavba jako papírový test (6 příkladů, 30 bodů).
// Varianty A a B jsou přesně zadání z minulých let, „nová“ varianta má stejné typy s jinými čísly.
import { pick, ri } from '../ui.js';
import * as K from './komplex/gen.js';
import * as G from './gonio/gen.js';
import * as Q from './rovnice/gen.js';
import * as F from './grafy/gen.js';
import * as V from './geometrie/gen.js';

export const TOTAL = 30;
const P = '$z_1$, $z_2$';
/** úloha testu: id (1a), body, téma (cesta), karta a generátor podobné úlohy pro procvičení */
const q = (id, pts, path, make, redo = make) => ({ id, pts, path, make, redo });

const A = [
  q('1a', 2, 'zm-komplex', K.FIXED.A1a, K.powCx), q('1b', 2, 'zm-komplex', K.FIXED.A1b, K.divCx),
  q('2a', 2, 'zm-gonio', G.FIXED.A2a, G.polarToAlg), q('2b', 2, 'zm-gonio', G.FIXED.A2b, G.mulPolar), q('2c', 2, 'zm-gonio', G.FIXED.A2c, G.powPolar), q('2d', 4, 'zm-gonio', G.FIXED.A2d, G.rootsPolar),
  q('3a', 2, 'zm-rovnice', Q.FIXED.A3a, Q.quadEq), q('3b', 2, 'zm-rovnice', Q.FIXED.A3b, Q.quadIneq), q('3c', 2, 'zm-rovnice', Q.FIXED.A3c, Q.trigIneq), q('3d', 2, 'zm-rovnice', Q.FIXED.A3d, Q.logWords),
  q('4', 4, 'zm-grafy', F.FIXED.A4, F.examGraph), q('5', 2, 'zm-geometrie', V.FIXED.A5, V.lineEq), q('6', 2, 'zm-geometrie', V.FIXED.A6, V.planePos),
];
const B = [
  q('1a', 2, 'zm-komplex', K.FIXED.B1a, K.gaussRead), q('1b', 2, 'zm-gonio', G.FIXED.B1b, G.gaussPolar),
  q('2a', 2, 'zm-gonio', G.FIXED.B2a, G.mulPolar), q('2b', 2, 'zm-gonio', G.FIXED.B2b, G.divPolar), q('2c', 2, 'zm-gonio', G.FIXED.B2c, G.powPolar), q('2d', 4, 'zm-gonio', G.FIXED.B2d, G.rootsPolar),
  q('3a', 2, 'zm-rovnice', Q.FIXED.B3a, Q.quadEq), q('3b', 2, 'zm-rovnice', Q.FIXED.B3b, Q.quadIneq), q('3c', 2, 'zm-rovnice', Q.FIXED.B3c, Q.expIneq), q('3d', 2, 'zm-rovnice', Q.FIXED.B3d, Q.trigEqGeneral),
  q('4', 4, 'zm-grafy', F.FIXED.B4, F.examGraph), q('5', 2, 'zm-geometrie', V.FIXED.B5, V.planeEq), q('6', 2, 'zm-geometrie', V.FIXED.B6, V.planePos),
];

/** nová varianta: stejné typy, náhodná čísla (příklad 2 má společná z1, z2 jako na papíře) */
function fresh() {
  const n = pick([2, 3]);
  const s = n === 3 ? 2 : pick([2, 4]);
  const r1 = s ** n;
  const d1 = pick(n === 3 ? [30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330] : [60, 120, 240, 300, 30, 150]);
  const r2 = 2, d2 = 2 * ri(2, 17);
  const z = `$z_1 = ${r1}(\\cos ${d1}^\\circ + \\mathrm{i}\\sin ${d1}^\\circ)$, $z_2 = ${r2}(\\cos ${d2}^\\circ + \\mathrm{i}\\sin ${d2}^\\circ)$`;
  const typeA = Math.random() < 0.5;
  const quad = Q.quadData('two');
  const quadP = quad.a < 0 ? { ...quad, a: -quad.a, b: -quad.b, c: -quad.c } : quad;
  const one1 = pick([() => K.powCx([pick([1, -1]), pick([1, -1]), 3]), () => K.powCx(), K.mulCx, () => K.gaussRead()]);
  const one2 = pick([() => K.divCx([1, 0, riNotZ(), riNotZ()]), K.divCx, G.gaussPolar]);
  return [
    q('1a', 2, 'zm-komplex', one1, K.powCx), q('1b', 2, one2 === G.gaussPolar ? 'zm-gonio' : 'zm-komplex', one2, one2 === G.gaussPolar ? G.gaussPolar : K.divCx),
    typeA ? q('2a', 2, 'zm-gonio', () => ({ ...G.polarToAlg([r1, d1]), prompt: `Jsou dána ${z}. Urči algebraický tvar $z_1$.`, fn: null }), G.polarToAlg)
      : q('2a', 2, 'zm-gonio', () => G.mulPolar([r1, d1, r2, d2]), G.mulPolar),
    typeA ? q('2b', 2, 'zm-gonio', () => G.mulPolar([r1, d1, r2, d2]), G.mulPolar) : q('2b', 2, 'zm-gonio', () => G.divPolar([r1, d1, r2, d2]), G.divPolar),
    q('2c', 2, 'zm-gonio', () => G.powPolar([r2, d2, 5]), G.powPolar),
    q('2d', 4, 'zm-gonio', () => G.rootsPolar([s, n, d1]), G.rootsPolar),
    q('3a', 2, 'zm-rovnice', () => Q.quadEq(quadP), Q.quadEq), q('3b', 2, 'zm-rovnice', () => Q.quadIneq(quadP), Q.quadIneq),
    pick([q('3c', 2, 'zm-rovnice', Q.trigIneq), q('3c', 2, 'zm-rovnice', Q.expIneq)]),
    pick([q('3d', 2, 'zm-rovnice', Q.logWords), q('3d', 2, 'zm-rovnice', Q.trigEqGeneral)]),
    q('4', 4, 'zm-grafy', () => F.examGraph(), F.examGraph),
    pick([q('5', 2, 'zm-geometrie', () => V.lineEq(), V.lineEq), q('5', 2, 'zm-geometrie', () => V.planeEq(), V.planeEq)]),
    q('6', 2, 'zm-geometrie', () => V.planePos(), V.planePos),
  ];
}
const riNotZ = () => { let x; do { x = ri(-4, 4); } while (!x); return x; };

export const VARIANTS = {
  A: { title: 'Varianta A', sub: 'Zadání z minulého roku, přesně jak bylo', build: () => A },
  B: { title: 'Varianta B', sub: 'Druhá skupina z minulého roku', build: () => B },
  N: { title: 'Nová varianta', sub: 'Stejné typy příkladů, pokaždé jiná čísla', build: fresh },
};

/** krátký popis úlohy do výsledků */
export const TOPIC = {
  '1a': 'Komplexní číslo', '1b': 'Komplexní číslo', '2a': 'Goniometrický tvar', '2b': 'Goniometrický tvar', '2c': 'Mocnina (Moivre)', '2d': 'Odmocniny',
  '3a': 'Kvadratická rovnice', '3b': 'Kvadratická nerovnice', '3c': 'Nerovnice', '3d': 'Rovnice / nerovnice', '4': 'Graf funkce', '5': 'Přímka / rovina', '6': 'Poloha rovin',
};
export { P };
