// Karta příkladu 7: pět tvrzení, u každého Pravda / Nepravda / bez odpovědi.
// Bodování jako na písemce: +2 za správnou, −2 za špatnou, bez odpovědi 0, celkem 0 až 10.
import { h, m } from '../ui.js';
import { haptic } from '../haptics.js';
import { tfScore } from './tf.js';

export function tfCard(card) {
  const sel = card.items.map(() => null);   // true / false / null
  const rows = card.items.map((s, i) => {
    const mk = (v, label) => h('button', { class: 'seg tf-seg', type: 'button', 'aria-pressed': 'false', onclick: () => set(i, sel[i] === v ? null : v) }, label);
    const bP = mk(true, 'Pravda'), bN = mk(false, 'Nepravda');
    const row = h('div', { class: 'tf-row' },
      h('div', { class: 'tf-text', html: `<b>(${'abcde'[i]})</b> ` + m(s.tex) }),
      h('div', { class: 'seg-group tf-btns' }, bP, bN));
    row._b = [bP, bN];
    return row;
  });
  function set(i, v) {
    sel[i] = v;
    rows[i]._b[0].classList.toggle('selected', v === true);
    rows[i]._b[1].classList.toggle('selected', v === false);
    rows[i]._b.forEach((b, k) => b.setAttribute('aria-pressed', String((k === 0 && v === true) || (k === 1 && v === false))));
    haptic('select');
  }
  const note = h('p', { class: 'muted small tf-note' }, '+2 body za správnou odpověď, −2 za špatnou, bez odpovědi 0. Celkem nejméně 0 a nejvýš 10 bodů. Nejistou odpověď je lepší vynechat.');
  const el = h('div', { class: 'card' },
    h('div', { class: 'card-head' }, h('div', { class: 'prompt', html: m(card.prompt) })),
    h('div', { class: 'tf-list' }, rows), note);
  function finish(reveal) {
    let right = 0, wrong = 0;
    card.items.forEach((s, i) => {
      const [bP, bN] = rows[i]._b;
      bP.disabled = bN.disabled = true;
      (s.truth ? bP : bN).classList.add('right');
      if (!reveal && sel[i] != null && sel[i] !== s.truth) (sel[i] ? bP : bN).classList.add('wrong');
      if (!reveal && sel[i] != null) { if (sel[i] === s.truth) right++; else wrong++; }
      const state = reveal || sel[i] == null ? 'skip' : sel[i] === s.truth ? 'ok' : 'bad';
      rows[i].classList.add('tf-' + state);
      rows[i].append(h('div', { class: 'tf-why', html: `${state === 'ok' ? '✓ ' : state === 'bad' ? '✗ ' : ''}<b>${s.truth ? 'Pravda' : 'Nepravda'}.</b> ` + m(s.why) }));
    });
    const pts = tfScore(right, wrong);
    return { right, wrong, pts };
  }
  return {
    el, typing: false,
    key(k) { return false; },
    check() {
      const r = finish(false);
      const skipped = card.items.length - r.right - r.wrong;
      return { ok: r.pts === 10, score: r.pts / 10, msg: `Správně ${r.right}, špatně ${r.wrong}, bez odpovědi ${skipped}: <b>${r.pts} z 10 bodů</b>. Vysvětlení je u každého tvrzení.` };
    },
    reveal() { finish(true); return { msg: 'Správné odpovědi i vysvětlení jsou u každého tvrzení.' }; },
  };
}
