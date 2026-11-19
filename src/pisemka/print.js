// Písemka k tisku / do PDF: list A4 vysázený jako LaTeX originál
// (Computer Modern = CMU Serif pro text, KaTeX pro vzorce, 12 pt, tučná hlavička, orámované písmeno varianty,
// linka, číslovaný seznam s vystředěnými vzorci, poznámka pod čarou u příkladu 7).
import { h, m } from '../ui.js';
import { FOOT } from './exams.js';

const disp = tex => `$$${tex}.$$`;   // vzorec na samostatném řádku s tečkou na konci, jako v originále

function header(ex) {
  return h('div', { class: 'pz-head' },
    h('div', {}, ex.course),
    h('div', {}, 'Varianta: ', h('span', { class: 'pz-box' }, ex.letter)),
    h('div', {}, 'Čas: 100 minut'),
    h('div', {}, 'Hodnocení: každý příklad bude oceněn nejvýše 10 body'));
}

/** jeden list se zadáním */
export function examSheet(ex, problems) {
  if (ex.practical) return practicalSheet(problems);
  const list = h('ol', { class: 'pz-list' });
  let foot = null;
  for (const p of problems) {
    const body = h('div', { class: 'pz-body' });
    if (p.kind === 'tf') {
      body.append(h('p', { class: 'pz-text', html: m(p.text) + '<sup class="pz-fn">1</sup>' }));
      body.append(h('ol', { class: 'pz-sub' }, p.items.map((s, i) => h('li', {}, h('span', { class: 'pz-lab' }, `(${'abcde'[i]})`), h('span', { html: m(s.tex) })))));
      foot = h('div', { class: 'pz-foot' }, h('hr'), h('p', { html: `<sup>1</sup>${FOOT}` }));
    } else {
      body.append(h('p', { class: 'pz-text', html: m(p.text) }), h('div', { class: 'pz-disp', html: m(disp(p.tex)) }));
    }
    list.append(h('li', {}, h('span', { class: 'pz-num' }, `${p.n}.`), body));
  }
  return h('div', { class: 'pz-sheet' }, h('div', { class: 'pz-page' }, header(ex), h('hr', { class: 'pz-rule' }), list), foot);
}

function practicalSheet(problems) {
  const byN = {};
  for (const p of problems) (byN[p.n[0]] ||= []).push(p);
  const list = h('div', { class: 'pz-prakt' });
  for (const [n, ps] of Object.entries(byN)) {
    const line = ps.map((p, i) => {
      const t = p.text.includes('$') ? m(p.text) : `${m(p.text)} ${m(`$${p.tex}$`)}.`;
      return h('div', { class: 'pz-pline' + (i ? ' pz-pcont' : '') }, i === 0 ? h('span', { class: 'pz-pnum' }, `${n}.)`) : h('span', { class: 'pz-pnum' }), h('span', { html: t }));
    });
    list.append(...line);
  }
  return h('div', { class: 'pz-sheet pz-sheet-prakt' }, h('div', { class: 'pz-page' }, h('div', { class: 'pz-prakt-head' }, 'praktická část'), list));
}

/** list s řešením: jen výsledky, nebo i postupy */
export function solutionSheet(ex, problems, withSteps) {
  const items = problems.map(p => h('li', {},
    h('span', { class: 'pz-num' }, `${p.n}.`),
    h('div', { class: 'pz-body' },
      p.kind === 'tf'
        ? h('div', { class: 'pz-ans' }, p.items.map((s, i) => h('div', { html: `<b>(${'abcde'[i]}) ${s.truth ? 'pravda' : 'nepravda'}</b>${withSteps ? ' – ' + m(s.why) : ''}` })))
        : h('div', { class: 'pz-ans', html: m(`$${p.answerTex}$`) }),
      withSteps && p.kind !== 'tf' && p.steps ? h('ol', { class: 'pz-steps' }, p.steps.map(s => h('li', { html: m(s) }))) : null)));
  const title = ex.practical ? 'Řešení: praktická část' : `Řešení: ${ex.course}, varianta ${ex.letter}${ex.generated ? ` (zadání č. ${ex.seed})` : ''}`;
  return h('div', { class: 'pz-sheet pz-sol' + (withSteps ? ' pz-sol-steps' : '') }, h('div', { class: 'pz-page' },
    h('div', { class: 'pz-sol-head' }, title), h('hr', { class: 'pz-rule' }), h('ol', { class: 'pz-list' }, items)));
}
