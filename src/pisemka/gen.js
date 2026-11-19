// Nové písemky ve stylu minulých let a trénink po jednotlivých příkladech.
// Nová písemka vzniká z čísla (seed), takže jde kdykoli znovu otevřít i vytisknout úplně stejná.
import { pick } from '../ui.js';
import { genDomain, genExtremes, genLimit, genTaylor, genIndefinite, genDefinite } from './types.js';
import { pickFive, anyStatement } from './tf.js';
import { tfProblem, T1n, T2n, T7a } from './exams.js';
import { BANK } from './tf.js';

/** fn() poběží s Math.random řízeným semínkem (mulberry32) */
export function seeded(seed, fn) {
  const orig = Math.random;
  let a = seed >>> 0;
  Math.random = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  try { return fn(); } finally { Math.random = orig; }
}
export const newSeed = () => 1 + Math.floor(Math.random() * 899999);

/** pětice tvrzení jako příklad 7 */
function tfFresh(text = T7a) {
  const items = pickFive();
  // tvrzení z generátorů nejsou v bance → tfProblem je vezme přímo
  return { ...tfProblem(text, []), items, answerTex: items.map((s, i) => `\\text{(${'abcde'[i]}) ${s.truth ? 'P' : 'N'}}`).join(',\\ '),
    steps: items.map((s, i) => `(${'abcde'[i]}) <b>${s.truth ? 'Pravda' : 'Nepravda'}</b>: ${s.why}`),
    card: () => ({ type: 'tf5', key: 'p7', prompt: text, items }) };
}

/** nová písemka (styl nejnovějších zadání „Matematická analýza 1“) */
export function newExam(seed) {
  return seeded(seed, () => {
    const letter = pick(['A', 'B', 'C', 'D']);
    const probs = [genDomain(T1n), genExtremes(false, T2n), genLimit(), genTaylor(), genIndefinite(), genDefinite(), tfFresh()]
      .map((p, i) => ({ ...p, n: String(i + 1), pts: 10 }));
    return { id: 'N' + seed, seed, course: 'Matematická analýza 1', letter, generated: true, problems: probs };
  });
}

/** trénink jednoho typu: generátor karty (každé zavolání = nový příklad) */
export const TRAIN = {
  1: { title: 'Definiční obor', gen: () => genDomain().card() },
  2: { title: 'Monotonie a extrémy', gen: () => genExtremes(true).card() },
  3: { title: 'Limita', gen: () => genLimit().card() },
  4: { title: 'Taylorův polynom', gen: () => genTaylor().card() },
  5: { title: 'Neurčitý integrál', gen: () => genIndefinite().card() },
  6: { title: 'Určitý integrál', gen: () => genDefinite().card() },
  7: { title: 'Pravda, nebo nepravda', gen: () => statementCard(anyStatement()) },
};
/** jedno tvrzení jako karta (trénink teorie) */
export function statementCard(s) {
  return {
    type: 'choice', key: 'p7', prompt: 'Pravda, nebo nepravda?', show: `<div class="tf-stmt">${s.tex}</div>`,
    options: [{ label: 'Pravda', correct: s.truth, why: s.why }, { label: 'Nepravda', correct: !s.truth, why: s.why }],
    explain: s.why,
  };
}
/** projde celou banku tvrzení (každé jednou, náhodné pořadí) */
export const allStatements = () => BANK.map(s => () => statementCard(s));
