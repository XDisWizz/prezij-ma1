// Základy matematiky: „hezké“ úhly a jejich sinus a kosinus (přesně, s odmocninami), stupně ↔ radiány.
import { fracTex, fracTxt } from './expr.js';

/** hodnota p/q·√n */
const V = (p, q = 1, n = 1) => ({ p, q, n, v: p / q * Math.sqrt(n) });
const VALS = [V(0), V(1, 2), V(1, 2, 2), V(1, 2, 3), V(1), V(-1, 2), V(-1, 2, 2), V(-1, 2, 3), V(-1)];
const match = x => VALS.find(c => Math.abs(c.v - x) < 1e-9);

export const NICE = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];
export const FIRST = [0, 30, 45, 60, 90];
export const rad = d => d * Math.PI / 180;
export const cosV = d => match(Math.cos(rad(d)));
export const sinV = d => match(Math.sin(rad(d)));

/** p/q·√n → TeX */
export function valTex({ p, q, n }) {
  if (p === 0) return '0';
  if (n === 1) return fracTex(p, q);
  const s = p < 0 ? '-' : '', a = Math.abs(p);
  const g = gcdI(a, q), A = a / g, Q = q / g;
  const top = `${A === 1 ? '' : A}\\sqrt{${n}}`;
  return Q === 1 ? s + top : `${s}\\frac{${top}}{${Q}}`;
}
export function valTxt({ p, q, n }) {
  if (p === 0) return '0';
  if (n === 1) return fracTxt(p, q);
  const s = p < 0 ? '-' : '', a = Math.abs(p);
  const g = gcdI(a, q), A = a / g, Q = q / g;
  const top = `${A === 1 ? '' : A}√${n}`;
  return Q === 1 ? s + top : `${s}${top}/${Q}`;
}
const gcdI = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
/** k · (p/q·√n) */
export const scale = (k, { p, q, n }) => { const P = k * p, g = gcdI(P, q); return { p: P / g, q: q / g, n, v: k * p / q * Math.sqrt(n) }; };

/** stupně → radiány jako TeX: 60 → \frac{\pi}{3}, −30 → -\frac{\pi}{6} */
export function radTex(d) {
  if (d === 0) return '0';
  const g = gcdI(d, 180);
  let a = d / g, b = 180 / g;
  const s = a < 0 ? '-' : '';
  a = Math.abs(a);
  const top = a === 1 ? '\\pi' : `${a}\\pi`;
  return b === 1 ? s + top : `${s}\\frac{${top}}{${b}}`;
}
export function radTxt(d) {
  if (d === 0) return '0';
  const g = gcdI(d, 180);
  let a = d / g, b = 180 / g;
  const s = a < 0 ? '-' : '';
  a = Math.abs(a);
  const top = a === 1 ? 'π' : `${a}π`;
  return b === 1 ? s + top : `${s}${top}/${b}`;
}
export const norm360 = d => ((d % 360) + 360) % 360;
/** goniometrický tvar r(cos φ + i sin φ), φ ve stupních */
export const gonioTex = (rT, d) => `${rT === '1' ? '' : rT}\\left(\\cos ${d}^{\\circ} + \\mathrm{i}\\sin ${d}^{\\circ}\\right)`;
/** kvadrant úhlu (0 = na ose) */
export const quadrant = d => { d = norm360(d); return d % 90 === 0 ? 0 : Math.floor(d / 90) + 1; };
export const QNAME = ['na ose', 'I.', 'II.', 'III.', 'IV.'];
