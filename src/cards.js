// Vykreslení jednotlivých typů karet v lekci.
import { h, m, shuffle, ICONS } from './ui.js';
import { parseSet, PARSE_ERRORS, equal, sameEndpoints, complement, subset, normalize, toTex, endpoints } from './intervals.js';
import { numberLine } from './numberline.js';
import * as S from './sym.js';

const coarse = () => window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

function header(card) {
  const wrap = h('div', { class: 'card-head' });
  if (card.badge) wrap.append(h('span', { class: 'badge' }, card.badge));
  wrap.append(h('div', { class: 'prompt', html: m(card.prompt || '') }));
  const ctx = card.context || card.fn;
  if (ctx) wrap.append(h('div', { class: 'fn-box', html: m(`$$${ctx}$$`) }));
  return wrap;
}

// ---------------------------------------------------------------- info / video
function infoCard(card) {
  const el = h('div', { class: 'card info-card' },
    h('h2', { class: 'info-title' }, card.title),
    h('div', { class: 'info-body', html: m(card.body) }));
  return { el, passive: true };
}

function videoCard(card) {
  const el = h('div', { class: 'card info-card' },
    h('div', { class: 'video-tag' }, 'Video'),
    h('h2', { class: 'info-title' }, card.title),
    h('div', { class: 'info-body', html: m(card.body || '') }),
    h('a', { class: 'btn btn-video', href: card.url, target: '_blank', rel: 'noopener', html: ICONS.play + '<span>Pustit video</span>' }),
    h('p', { class: 'muted small' }, 'Otevře se v nové záložce na opencast.vsb.cz. Až ho dokoukáš, vrať se sem.'));
  return { el, passive: true };
}

// ---------------------------------------------------------------- výběr jedné možnosti
function choiceCard(card) {
  let sel = null;
  const opts = card.options;
  const list = h('div', { class: 'options' + (card.wide || opts.some(o => o.label.includes('<svg')) ? ' options-wide' : '') });
  const btns = opts.map((o, i) => {
    const b = h('button', { class: 'option', type: 'button', onclick: () => select(i) },
      h('span', { class: 'opt-key' }, String(i + 1)), h('span', { class: 'opt-label', html: m(o.label) }));
    list.append(b);
    return b;
  });
  function select(i) { sel = i; btns.forEach((b, k) => b.classList.toggle('selected', k === i)); }
  const el = h('div', { class: 'card' }, header(card), list);
  return {
    el,
    key(k) { const i = Number(k) - 1; if (i >= 0 && i < opts.length) { select(i); return true; } },
    check() {
      if (sel == null) return { invalid: 'Vyber jednu možnost.' };
      const o = opts[sel];
      btns.forEach((b, k) => { b.disabled = true; if (opts[k].correct) b.classList.add('right'); });
      if (!o.correct) btns[sel].classList.add('wrong');
      return { ok: o.correct, msg: o.correct ? (card.explain || '') : (o.why || card.explain || ''), steps: !o.correct ? card.steps : null };
    },
    reveal() {
      btns.forEach((b, k) => { b.disabled = true; if (opts[k].correct) b.classList.add('right'); });
      return { msg: card.explain || opts.find(o => o.correct).why || '', steps: card.steps };
    },
  };
}

// ---------------------------------------------------------------- více možností
function multiCard(card) {
  const on = new Set();
  const list = h('div', { class: 'options' });
  const btns = card.options.map((o, i) => {
    const b = h('button', { class: 'option option-check', type: 'button', onclick: () => toggle(i) },
      h('span', { class: 'checkbox', html: ICONS.check }), h('span', { class: 'opt-label', html: m(o.label) }));
    list.append(b);
    return b;
  });
  function toggle(i) { on.has(i) ? on.delete(i) : on.add(i); btns[i].classList.toggle('selected', on.has(i)); }
  const finish = () => card.options.forEach((o, k) => { btns[k].disabled = true; if (o.correct) btns[k].classList.add('right'); else if (on.has(k)) btns[k].classList.add('wrong'); });
  const whyList = () => '<ul class="why-list">' + card.options.map(o => `<li>${o.correct ? '✓' : '✗'} ${o.label}: ${o.why}</li>`).join('') + '</ul>';
  return {
    el: h('div', { class: 'card' }, header(card), list),
    key(k) { const i = Number(k) - 1; if (i >= 0 && i < card.options.length) { toggle(i); return true; } },
    check() {
      if (!on.size) return { invalid: 'Zaškrtni aspoň jednu možnost.' };
      const ok = card.options.every((o, k) => o.correct === on.has(k));
      finish();
      return { ok, msg: ok ? 'Žádná podmínka ti neutekla.' : whyList() };
    },
    reveal() { finish(); return { msg: whyList() }; },
  };
}

// ---------------------------------------------------------------- třídění
function sortCard(card) {
  const pos = card.items.map(() => null);
  const rows = card.items.map((it, i) => {
    const bs = card.buckets.map((b, k) => h('button', { class: 'seg', type: 'button', onclick: () => set(i, k) }, b));
    const row = h('div', { class: 'sort-row' }, h('div', { class: 'sort-label', html: m(it.label) }), h('div', { class: 'seg-group' }, bs));
    row._bs = bs;
    return row;
  });
  function set(i, k) { pos[i] = k; rows[i]._bs.forEach((b, j) => b.classList.toggle('selected', j === k)); }
  const finish = () => rows.forEach((r, i) => { r._bs.forEach(b => (b.disabled = true)); r._bs[card.items[i].bucket].classList.add('right'); if (pos[i] != null && pos[i] !== card.items[i].bucket) r._bs[pos[i]].classList.add('wrong'); });
  return {
    el: h('div', { class: 'card' }, header(card), h('div', { class: 'sort-list' }, rows)),
    check() {
      if (pos.some(p => p == null)) return { invalid: 'Zařaď všechny řádky.' };
      const bad = card.items.filter((it, i) => pos[i] !== it.bucket);
      finish();
      return { ok: !bad.length, msg: bad.length ? '<ul class="why-list">' + bad.map(it => `<li>${it.label}: ${it.why}</li>`).join('') + '</ul>' : 'Všechno sedí.' };
    },
    reveal() { finish(); return { msg: '<ul class="why-list">' + card.items.map(it => `<li>${it.label}: ${it.why}</li>`).join('') + '</ul>' }; },
  };
}

// ---------------------------------------------------------------- interval (psaná odpověď)
const KEYS = [
  ['(', '⟨', ')', '⟩', ',', '∪'],
  ['7', '8', '9', '−', '∞', '√'],
  ['4', '5', '6', '/', 'e', '⌫'],
  ['1', '2', '3', '0', '.', 'ℝ'],
];

export function diagnose(user, ans, warn) {
  if (warn === 'infbracket') return 'U nekonečna patří vždycky kulatá závorka: nekonečna se nejde dotknout.';
  if (sameEndpoints(user, ans)) {
    const U = normalize(user), A = normalize(ans);
    const notes = [];
    A.forEach((I, k) => {
      const J = U[k];
      if (I.ai !== J.ai && isFinite(I.a.v)) notes.push(`$${I.a.tex}$ ${I.ai ? 'do výsledku <b>patří</b>, takže ⟨' : 'do výsledku <b>nepatří</b>, takže ('}`);
      if (I.bi !== J.bi && isFinite(I.b.v)) notes.push(`$${I.b.tex}$ ${I.bi ? 'do výsledku <b>patří</b>, takže ⟩' : 'do výsledku <b>nepatří</b>, takže )'}`);
    });
    return `Krajní body máš dobře, jen pozor na závorky: ${notes.join(', ')}.`;
  }
  if (sameEndpoints(user, complement(ans))) return 'Máš přesně opačnou část osy. Zkontroluj, jestli chceš „vně“, nebo „mezi“ (nebo jestli se neotočilo znaménko).';
  if (subset(ans, user)) return 'Tvůj výsledek obsahuje i čísla, která tam nepatří. Nechybí ti nějaká podmínka?';
  if (subset(user, ans)) return 'Tvůj výsledek je moc malý: chybí v něm i čísla, která jsou v pořádku.';
  return 'Tohle ještě nesedí. Mrkni na postup níž, krok po kroku.';
}

/** políčko na interval + živý náhled na ose + klávesnice */
function makeIntervalInput(label) {
  const input = h('input', {
    class: 'iv-input', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false',
    placeholder: 'např. (−∞, 3⟩ ∪ (5, +∞)', 'aria-label': 'Tvoje odpověď',
  });
  if (coarse()) input.setAttribute('inputmode', 'none');
  const preview = h('div', { class: 'iv-preview' });
  const insert = txt => {
    const s = input.selectionStart ?? input.value.length, e = input.selectionEnd ?? input.value.length;
    input.value = input.value.slice(0, s) + txt + input.value.slice(e);
    const p = s + txt.length;
    input.setSelectionRange(p, p);
    update();
    if (!coarse()) input.focus();
  };
  const back = () => {
    const s = input.selectionStart ?? input.value.length, e = input.selectionEnd ?? s;
    if (s !== e) input.value = input.value.slice(0, s) + input.value.slice(e);
    else if (s > 0) { input.value = input.value.slice(0, s - 1) + input.value.slice(s); input.setSelectionRange(s - 1, s - 1); }
    update();
  };
  const pad = h('div', { class: 'keypad' }, KEYS.flat().map(k => h('button', {
    class: 'key' + (/[0-9.]/.test(k) ? ' key-num' : ''), type: 'button', tabindex: '-1',
    onmousedown: e => e.preventDefault(),
    onclick: () => k === '⌫' ? back() : insert(k === ',' ? ', ' : k === '∪' ? ' ∪ ' : k === '−' ? '−' : k),
  }, k)));
  function update() {
    const r = parseSet(input.value);
    if (!input.value.trim()) preview.innerHTML = '<span class="muted small">Tady uvidíš svou odpověď na ose.</span>';
    else if (r.ok) preview.innerHTML = numberLine(r.set);
    else preview.innerHTML = '<span class="muted small">…píšeš</span>';
  }
  // hezké symboly už při psaní: inf → ∞, < → ⟨, U → ∪, - → −
  const pretty = t => t.replace(/inf(inity)?/gi, '∞').replace(/sqrt/gi, '√').replace(/[<[]/g, '⟨').replace(/[>\]]/g, '⟩')
    .replace(/-/g, '−').replace(/(^|[\s)⟩])[uU](?=[\s(⟨]|$)/g, '$1∪');
  input.addEventListener('input', () => {
    const s = input.selectionStart ?? input.value.length;
    const nb = pretty(input.value.slice(0, s)), na = pretty(input.value.slice(s));
    if (nb + na !== input.value) { input.value = nb + na; input.setSelectionRange(nb.length, nb.length); }
    update();
  });
  update();
  const box = h('div', { class: 'iv-box' }, h('div', { class: 'iv-row' }, h('span', { class: 'iv-label' }, label), input), preview, pad);
  return {
    box,
    focus: () => { if (!coarse()) input.focus(); },
    parse: () => parseSet(input.value),
    done: () => { input.disabled = true; pad.remove(); preview.remove(); },
  };
}

/** porovná odpověď se správnou: { invalid } | { ok, msg } */
/** loose = u konečných krajních bodů nezáleží na závorce (monotonie, konvexita) */
function judgeInterval(ctl, answer, loose = false) {
  const r = ctl.parse();
  if (!r.ok) return { invalid: PARSE_ERRORS[r.error] };
  const ok = !r.warn && (loose ? sameEndpoints(r.set, answer) : equal(r.set, answer));
  ctl.done();
  return {
    ok,
    msg: ok ? `$${toTex(r.set)}$` : (loose && !r.warn ? 'Tohle ještě nesedí. Krajní body mají být nulové body derivace (a body, kde funkce není definovaná).' : diagnose(r.set, answer, r.warn)) + `<div class="cmp"><div><span class="muted small">Ty:</span>${numberLine(r.set)}</div><div><span class="muted small">Správně: $${toTex(answer)}$</span>${numberLine(answer)}</div></div>`,
  };
}

function intervalCard(card) {
  const ctl = makeIntervalInput(card.label || (card.fn ? 'D(f) =' : ''));
  const el = h('div', { class: 'card' }, header(card), ctl.box);
  return {
    el, focus: ctl.focus, typing: true,
    check() {
      const r = judgeInterval(ctl, card.answer, card.loose);
      if (r.invalid) return r;
      return { ...r, steps: r.ok ? null : card.steps, stepsOptional: r.ok ? card.steps : null };
    },
    reveal() { ctl.done(); return { msg: `Správně: $${toTex(card.answer)}$${numberLine(card.answer)}`, steps: card.steps }; },
  };
}

// ---------------------------------------------------------------- výraz (derivace, čísla)
const FKEYS = [['sin', 'sin('], ['cos', 'cos('], ['tg', 'tg('], ['cotg', 'cotg('], ['ln', 'ln('], ['eˣ', 'e^('], ['√', '√('], ['∛', '∛('],
  ['arcsin', 'arcsin('], ['arccos', 'arccos('], ['arctg', 'arctg('], ['arccotg', 'arccotg('], ['|x|', '|']];
// „AC“ maže celé pole (dřív „C“, což se pletlo s integrační konstantou)
const EKEYS = ['x', '^', '(', ')', '/', '⌫', '7', '8', '9', '+', '−', '·', '4', '5', '6', 'π', 'e', '²', '1', '2', '3', '0', '.', 'AC'];

/** ∞, −∞, neexistuje */
function special(v) {
  // „nekonečno“ slovy i „oo“ čteme jako ∞ (dřív se „nekonečno“ četlo jako „neexistuje“)
  const t = v.trim().toLowerCase().replace(/\s+/g, '').replace(/^(plus|\+)?nekone[čc]n[oa]$/, '∞').replace(/^(m[ií]nus|[−-])nekone[čc]n[oa]$/, '−∞').replace(/oo$/, '∞');
  if (/^\+?∞$/.test(t)) return { inf: 1 };
  if (/^[−-]∞$/.test(t)) return { inf: -1 };
  if (/^neex/.test(t) || t === 'dne' || /^nem[aá]$/.test(t) || /^nem[aá]limitu$/.test(t)) return { dne: true };
  return null;
}
/** správná odpověď limity: { num: ast } | { inf: ±1 } | { dne: true } → TeX */
export const limTex = a => a.dne ? '\\text{neexistuje}' : a.inf ? (a.inf > 0 ? '+\\infty' : '-\\infty') : S.tex(a.num);

export function judgeLimit(ctl, answer) {
  const r = ctl.read();
  if (!r.ok) return { invalid: r.error };
  if (r.ast && S.hasX(r.ast)) return { invalid: 'Limita už je číslo (bez x a n), ∞, nebo „neexistuje“.' };
  ctl.done();
  const yours = r.special ? (r.special.dne ? 'neexistuje' : `$${r.special.inf > 0 ? '+' : '-'}\\infty$`) : `$${S.tex(r.ast)}$`;
  const right = answer.dne ? 'neexistuje' : `$${limTex(answer)}$`;
  let ok = false;
  if (answer.dne) ok = !!r.special?.dne;
  else if (answer.inf) ok = r.special?.inf === answer.inf;
  else ok = !!r.ast && Math.abs(S.ev(r.ast, 0) - S.ev(answer.num, 0)) < 1e-7 * Math.max(1, Math.abs(S.ev(answer.num, 0)));
  if (ok) return { ok, msg: right };
  let why = 'Tohle ještě nesedí.';
  if (answer.inf && r.special?.inf) why = 'Skoro! Nekonečno je správně, jen znaménko ne.';
  else if (!answer.inf && !answer.dne && r.ast && Math.abs(S.ev(r.ast, 0) + S.ev(answer.num, 0)) < 1e-7 * Math.max(1, Math.abs(S.ev(answer.num, 0)))) why = 'Skoro! Máš jen opačné znaménko.';
  return { ok: false, msg: `${why}<div class="cmp-expr"><span class="muted small">Ty:</span> ${m(yours)}<br><span class="muted small">Správně:</span> ${m(right)}</div>` };
}

function limitCard(card) {
  const ctl = makeExprInput(card.label || '$=$', { numeric: true, limit: true });
  return {
    el: h('div', { class: 'card' }, header(card), ctl.box), focus: ctl.focus, typing: true,
    check() {
      const r = judgeLimit(ctl, card.answer);
      if (r.invalid) return r;
      return { ...r, steps: r.ok ? null : card.steps, stepsOptional: r.ok ? card.steps : null };
    },
    reveal() { ctl.done(); return { msg: `Správně: $${limTex(card.answer)}$`, steps: card.steps }; },
  };
}

/** seznam bodů: "1; 3" nebo "žádné" */
const NONE_RE = /^(ž|z)[aá]dn|^nen|^nic|^∅$/i;
function readPoints(v) {
  const t = v.trim();
  if (NONE_RE.test(t)) return { ok: true, pts: [] };
  // oddělovač je středník (nebo čárka s mezerou); samotná čárka je desetinná: 1,5 = 1.5
  const parts = t.split(/;|,\s+/).map(s => s.trim()).filter(Boolean);
  if (!parts.length) return { ok: false, error: 'Napiš body oddělené středníkem, nebo „žádné“.' };
  try { return { ok: true, pts: parts.map(p => S.parse(p)) }; } catch (e) { return { ok: false, error: `Jeden z bodů nedokážu přečíst: ${e.message}.` }; }
}
export const ptsTex = pts => (pts.length ? pts.map(p => S.tex(p)).join(';\\ ') : '\\text{žádné}');
export function judgePoints(ctl, answer) {
  const r = ctl.read();
  if (!r.ok) return { invalid: r.error };
  if (r.pts.some(p => S.hasX(p))) return { invalid: 'Body jsou čísla (bez x). Odděl je středníkem.' };
  ctl.done();
  const val = p => S.ev(p, 0);
  const near = (a, b) => Math.abs(a - b) < 1e-7 * Math.max(1, Math.abs(b));
  const u = r.pts.map(val), a = answer.map(val);
  const ok = u.length === a.length && a.every(v => u.some(w => near(w, v))) && u.every(w => a.some(v => near(w, v)));
  const right = `$${ptsTex(answer)}$`;
  if (ok) return { ok, msg: right };
  let why = 'Tohle ještě nesedí.';
  if (a.every(v => u.some(w => near(w, v)))) why = 'Máš tam bod navíc. Zkontroluj, jestli se v něm opravdu mění znaménko.';
  else if (u.every(w => a.some(v => near(w, v)))) why = 'Některý bod ti chybí.';
  return { ok: false, msg: `${why}<div class="cmp-expr"><span class="muted small">Ty:</span> ${m(`$${ptsTex(r.pts)}$`)}<br><span class="muted small">Správně:</span> ${m(right)}</div>` };
}
function pointsCard(card) {
  const ctl = makeExprInput(card.label || '$x =$', { numeric: true, points: true });
  return {
    el: h('div', { class: 'card' }, header(card), ctl.box), focus: ctl.focus, typing: true,
    check() { const r = judgePoints(ctl, card.answer); if (r.invalid) return r; return { ...r, steps: r.ok ? null : card.steps, stepsOptional: r.ok ? card.steps : null }; },
    reveal() { ctl.done(); return { msg: `Správně: $${ptsTex(card.answer)}$`, steps: card.steps }; },
  };
}

/** integrační konstanta: „… + C“ na konci nebo „C + …“ na začátku se ignoruje */
const stripC = v => v.replace(/\+\s*[cC]\s*$/, '').replace(/^\s*[cC]\s*\+/, '').trim();
/** „y = …“, „f'(x) = …“, „x = …“ na začátku: levá strana už je vytištěná před políčkem */
const stripLhs = v => v.replace(/^\s*(y|x|a|k|q|t'?|u'?|v'?|f'{0,3}\s*(\(\s*[^()=]{0,6}\))?)\s*=\s*/i, '');
export function makeExprInput(label, { numeric = false, limit = false, points = false, integral = false } = {}) {
  const input = h('input', { class: 'iv-input ex-input', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: points ? 'např. 1; 3  nebo  žádné' : numeric ? 'např. 3/5' : 'např. 2x·cos(x^2)', 'aria-label': 'Tvoje odpověď' });
  if (coarse()) input.setAttribute('inputmode', 'none');
  const preview = h('div', { class: 'ex-preview' });
  const insert = txt => {
    const s = input.selectionStart ?? input.value.length, e = input.selectionEnd ?? input.value.length;
    input.value = input.value.slice(0, s) + txt + input.value.slice(e);
    const p = s + txt.length;
    input.setSelectionRange(p, p);
    update();
    if (!coarse()) input.focus();
  };
  const back = () => {
    const s = input.selectionStart ?? input.value.length, e = input.selectionEnd ?? s;
    if (s !== e) input.value = input.value.slice(0, s) + input.value.slice(e);
    else if (s > 0) { input.value = input.value.slice(0, s - 1) + input.value.slice(s); input.setSelectionRange(s - 1, s - 1); }
    update();
  };
  const clean = v => stripLhs(integral ? stripC(v) : v);
  const key = (k, ins, cls = '') => h('button', { class: 'key ' + cls, type: 'button', tabindex: '-1', 'aria-label': k === 'AC' ? 'Smazat vše' : k === '⌫' ? 'Smazat znak' : null, onmousedown: e => e.preventDefault(), onclick: () => (k === '⌫' ? back() : k === 'AC' ? (input.value = '', update()) : insert(ins ?? k)) }, k);
  const setVal = v => { input.value = v; update(); if (!coarse()) input.focus(); };
  const pad = h('div', { class: 'ex-pad' },
    limit ? h('div', { class: 'fkeys' }, ['+∞', '−∞', 'neexistuje'].map(k => h('button', { class: 'key fkey', type: 'button', tabindex: '-1', onmousedown: e => e.preventDefault(), onclick: () => setVal(k) }, k)),
      key('ln', 'ln(', 'fkey')) : null,
    points ? h('div', { class: 'fkeys' }, key('; další bod', '; ', 'fkey'), h('button', { class: 'key fkey', type: 'button', tabindex: '-1', onmousedown: e => e.preventDefault(), onclick: () => setVal('žádné') }, 'žádné')) : null,
    numeric ? null : h('div', { class: 'fkeys' }, FKEYS.map(([k, ins]) => key(k, ins, 'fkey')), integral ? key('+ C', ' + C', 'fkey') : null),
    h('div', { class: 'keypad' }, (numeric ? EKEYS.map(k => (k === 'x' ? '√' : k)) : EKEYS).map(k => key(k, k === '²' ? '^2' : k === '−' ? '−' : k === '√' && numeric ? '√(' : null, /[0-9.]/.test(k) ? 'key-num' : ''))));
  const pretty = t => t.replace(/\*/g, '·').replace(/-/g, '−').replace(/sqrt/gi, '√').replace(/inf(inity)?/gi, '∞');
  function update() {
    const s = input.selectionStart ?? input.value.length;
    const nb = pretty(input.value.slice(0, s)), na = pretty(input.value.slice(s));
    if (nb + na !== input.value) { input.value = nb + na; input.setSelectionRange(nb.length, nb.length); }
    if (!input.value.trim()) { preview.innerHTML = '<span class="muted small">Tady uvidíš, jak tvůj zápis čtu.</span>'; return; }
    const sp = limit && special(input.value);
    if (sp) { preview.innerHTML = '<span class="muted small">Čtu to jako:</span> ' + (sp.dne ? '<b>limita neexistuje</b>' : m(`$${sp.inf > 0 ? '+' : '-'}\\infty$`)); return; }
    if (points) { const r = readPoints(stripLhs(input.value)); preview.innerHTML = r.ok ? '<span class="muted small">Body:</span> ' + m(`$${ptsTex(r.pts)}$`) : `<span class="muted small">…${r.error}</span>`; return; }
    try { preview.innerHTML = '<span class="muted small">Čtu to jako:</span> ' + m(`$${S.tex(S.parse(clean(input.value)))}${integral ? ' + C' : ''}$`); }
    catch (e) { preview.innerHTML = `<span class="muted small">…${e.message}</span>`; }
  }
  input.addEventListener('input', update);
  update();
  const box = h('div', { class: 'iv-box' }, h('div', { class: 'iv-row' }, h('span', { class: 'iv-label', html: m(label || '') }), input), preview, pad);
  return {
    box, kind: 'expr',
    focus: () => { if (!coarse()) input.focus(); },
    read() {
      const sp = limit && special(input.value);
      if (sp) return { ok: true, special: sp };
      if (points) return readPoints(stripLhs(input.value));
      try { return { ok: true, ast: S.parse(clean(input.value)) }; } catch (e) { return { ok: false, error: input.value.trim() ? `Tenhle zápis nedokážu přečíst: ${e.message}.` : 'Napiš odpověď.' }; } },
    done() { input.disabled = true; pad.remove(); preview.remove(); },
  };
}

/** integrál: odpověď F je správně, když F' = f. Konstanta C je jedno. */
export function judgeIntegral(ctl, f, { answer, wrongs = [], pts } = {}) {
  const r = ctl.read();
  if (!r.ok) return { invalid: r.error };
  ctl.done();
  const right = `$${S.tex(answer)} + C$`;
  if (S.equivAnti(r.ast, f, pts)) return { ok: true, msg: right };
  let why = null;
  for (const w of wrongs) if (S.equivAnti(r.ast, S.d(w.ast), pts)) { why = w.msg; break; }
  if (!why && S.equiv(r.ast, S.d(f), pts)) why = 'Tohle je <b>derivace</b>. Integrál je opačně: hledáš funkci, jejíž derivace je zadaná funkce.';
  if (!why) {
    // liší se jen násobkem?
    const dS = S.d(r.ast), ks = [];
    for (const x of [0.37, 0.81, 1.27, 1.93, 2.6]) { const a = S.ev(dS, x), b = S.ev(f, x); if (Number.isFinite(a) && Number.isFinite(b) && Math.abs(b) > 1e-9) ks.push(a / b); }
    if (ks.length >= 3 && ks.every(k => Math.abs(k - ks[0]) < 1e-6 * Math.max(1, Math.abs(ks[0]))) && Math.abs(ks[0] - 1) > 1e-6)
      why = `Skoro! Když tvůj výsledek zderivuješ, vyjde ${m(`$${S.fmtNum(ks[0])}$`)}× zadaná funkce. Chybí (nebo přebývá) nějaké číslo. Zkontroluj, čím se dělí.`;
  }
  return { ok: false, msg: `${why || 'Tohle ještě nesedí. Zkus svůj výsledek zderivovat: má vyjít zadaná funkce.'}<div class="cmp-expr"><span class="muted small">Ty:</span> ${m(`$${S.tex(r.ast)}$`)}<br><span class="muted small">Správně například:</span> ${m(right)}</div>` };
}

function integralCard(card) {
  const ctl = makeExprInput(card.label || '$=$', { integral: true });
  return {
    el: h('div', { class: 'card' }, header(card), ctl.box), focus: ctl.focus, typing: true,
    check() { const r = judgeIntegral(ctl, card.f, card); if (r.invalid) return r; return { ...r, steps: r.ok ? null : card.steps, stepsOptional: r.ok ? card.steps : null }; },
    reveal() { ctl.done(); return { msg: `Správně: $${S.tex(card.answer)} + C$`, steps: card.steps }; },
  };
}

/** { invalid } | { ok, msg } */
export function judgeExpr(ctl, answer, { wrongs = [], pts, original } = {}) {
  const r = ctl.read();
  if (!r.ok) return { invalid: r.error };
  ctl.done();
  const ans = `$${S.tex(answer)}$`;
  if (S.equiv(r.ast, answer, pts)) return { ok: true, msg: ans };
  let why = null;
  for (const w of wrongs) if (S.equiv(r.ast, w.ast, pts)) { why = w.msg; break; }
  if (!why && original && S.equiv(r.ast, original, pts)) why = 'Tohle je původní funkce. Ještě ji zderivuj.';
  if (!why && S.equiv(r.ast, S.neg(answer), pts)) why = 'Skoro! Máš jen opačné znaménko.';
  return { ok: false, msg: (why || 'Tohle ještě nesedí.') + `<div class="cmp-expr"><span class="muted small">Ty:</span> ${m(`$${S.tex(r.ast)}$`)}<br><span class="muted small">Správně:</span> ${ans}</div>` };
}

function exprCard(card) {
  const ctl = makeExprInput(card.label || "f'(x) =", { numeric: card.numeric });
  return {
    el: h('div', { class: 'card' }, header(card), ctl.box), focus: ctl.focus, typing: true,
    check() {
      const r = judgeExpr(ctl, card.answer, card);
      if (r.invalid) return r;
      return { ...r, steps: r.ok ? null : card.steps, stepsOptional: r.ok ? card.steps : null };
    },
    reveal() { ctl.done(); return { msg: `Správně: $${S.tex(card.answer)}$`, steps: card.steps }; },
  };
}

// ---------------------------------------------------------------- řešení po krocích
function makeOptions(options, multi) {
  const on = new Set();
  // dva sloupce jen pro krátké možnosti; zaškrtávací (se vzorci) vždy pod sebou, ať se vzorec neláme
  const list = h('div', { class: 'options' + (multi || options.some(o => o.label.length > 26) ? '' : ' options-compact') });
  const btns = options.map((o, i) => {
    const b = h('button', { class: 'option' + (multi ? ' option-check' : ''), type: 'button', onclick: () => toggle(i) },
      multi ? h('span', { class: 'checkbox', html: ICONS.check }) : h('span', { class: 'opt-key' }, String(i + 1)),
      h('span', { class: 'opt-label', html: m(o.label) }));
    list.append(b);
    return b;
  });
  function toggle(i) {
    if (multi) { on.has(i) ? on.delete(i) : on.add(i); }
    else { on.clear(); on.add(i); }
    btns.forEach((b, k) => b.classList.toggle('selected', on.has(k)));
  }
  return {
    el: list,
    key(k) { const i = Number(k) - 1; if (i >= 0 && i < options.length) { toggle(i); return true; } },
    check(reveal) {
      if (!reveal && !on.size) return { invalid: multi ? 'Zaškrtni aspoň jednu možnost.' : 'Vyber jednu možnost.' };
      const ok = !reveal && options.every((o, k) => o.correct === on.has(k));
      options.forEach((o, k) => { btns[k].disabled = true; if (o.correct) btns[k].classList.add('right'); else if (on.has(k)) btns[k].classList.add('wrong'); });
      const wrong = options.filter((o, k) => o.correct !== on.has(k));
      const note = ok ? '✓ ' + options.filter(o => o.correct).map(o => o.label).join(', ') : multi
        ? '<ul class="why-list">' + wrong.map(o => `<li>${o.correct ? 'Chybí' : 'Navíc'} ${o.label}: ${o.why}</li>`).join('') + '</ul>'
        : `Správně: ${options.find(o => o.correct).label}. ` + (options.find((o, k) => on.has(k) && !o.correct)?.why || options.find(o => o.correct).why || '');
      return { ok, note };
    },
  };
}

function guidedCard(card) {
  const steps = card.gsteps;
  let si = 0, allOk = true, ctl = null;
  const list = h('div', { class: 'gsteps' });
  const blocks = [];
  function open(i) {
    const st = steps[i];
    const body = h('div', { class: 'gstep-body' });
    const blk = h('div', { class: 'gstep active' },
      h('div', { class: 'gstep-head', html: `<span class="gnum">${i + 1}</span><span>${m(st.title)}</span>` }), body);
    if (st.sub) body.append(h('div', { class: 'muted small gsub' }, st.sub));
    if (st.lines) {
      const pts = endpoints(...st.lines);
      body.append(h('div', { class: 'glines', html: st.lines.map((s, k) => numberLine(s, { extra: pts, label: `${k + 1}. podmínka` })).join('') }));
    }
    if (st.info) body.append(h('div', { class: 'gsub', html: m(st.info) }));
    if (st.kind === 'interval') { ctl = makeIntervalInput(st.label || ''); ctl.kind = 'interval'; body.append(ctl.box); setTimeout(ctl.focus, 40); }
    else if (st.kind === 'expr') { ctl = makeExprInput(st.label || '', { numeric: st.numeric }); body.append(ctl.box); setTimeout(ctl.focus, 40); }
    else if (st.kind === 'integral') { ctl = makeExprInput(st.label || '$=$', { integral: true }); ctl.kind = 'integral'; body.append(ctl.box); setTimeout(ctl.focus, 40); }
    else if (st.kind === 'points') { ctl = makeExprInput(st.label || '$x =$', { numeric: true, points: true }); ctl.kind = 'points'; body.append(ctl.box); setTimeout(ctl.focus, 40); }
    else if (st.kind === 'limit') { ctl = makeExprInput(st.label || '', { numeric: true, limit: true }); ctl.kind = 'limit'; body.append(ctl.box); setTimeout(ctl.focus, 40); }
    else { ctl = makeOptions(st.options, st.kind === 'multi'); ctl.kind = st.kind; body.append(ctl.el); }
    list.append(blk);
    blocks[i] = blk;
    if (i > 0) setTimeout(() => blk.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
  }
  function judge(reveal) {
    const st = steps[si];
    if (ctl.kind === 'interval') {
      if (reveal) { ctl.done(); return { ok: false, note: `Správně: $${toTex(st.answer)}$${numberLine(st.answer)}${st.why ? `<div>${st.why}</div>` : ''}` }; }
      const r = judgeInterval(ctl, st.answer, st.loose);
      if (r.invalid) return r;
      return { ok: r.ok, note: r.ok ? `✓ $${toTex(st.answer)}$` : r.msg + (st.why ? `<div class="gwhy">${st.why}</div>` : '') };
    }
    if (ctl.kind === 'integral') {
      if (reveal) { ctl.done(); return { ok: false, note: `Správně: $${S.tex(st.answer)} + C$${st.why ? `<div class="gwhy">${st.why}</div>` : ''}` }; }
      const r = judgeIntegral(ctl, st.f, st);
      if (r.invalid) return r;
      return { ok: r.ok, note: r.ok ? `✓ ${r.msg}` : r.msg + (st.why ? `<div class="gwhy">${st.why}</div>` : '') };
    }
    if (ctl.kind === 'points') {
      if (reveal) { ctl.done(); return { ok: false, note: `Správně: $${ptsTex(st.answer)}$${st.why ? `<div class="gwhy">${st.why}</div>` : ''}` }; }
      const r = judgePoints(ctl, st.answer);
      if (r.invalid) return r;
      return { ok: r.ok, note: r.ok ? `✓ ${r.msg}` : r.msg + (st.why ? `<div class="gwhy">${st.why}</div>` : '') };
    }
    if (ctl.kind === 'limit') {
      if (reveal) { ctl.done(); return { ok: false, note: `Správně: $${limTex(st.answer)}$${st.why ? `<div class="gwhy">${st.why}</div>` : ''}` }; }
      const r = judgeLimit(ctl, st.answer);
      if (r.invalid) return r;
      return { ok: r.ok, note: r.ok ? `✓ ${r.msg}` : r.msg + (st.why ? `<div class="gwhy">${st.why}</div>` : '') };
    }
    if (ctl.kind === 'expr') {
      if (reveal) { ctl.done(); return { ok: false, note: `Správně: $${S.tex(st.answer)}$${st.why ? `<div class="gwhy">${st.why}</div>` : ''}` }; }
      const r = judgeExpr(ctl, st.answer, st);
      if (r.invalid) return r;
      return { ok: r.ok, note: r.ok ? `✓ $${S.tex(st.answer)}$` : r.msg + (st.why ? `<div class="gwhy">${st.why}</div>` : '') };
    }
    return ctl.check(reveal);
  }
  function step(reveal) {
    const r = judge(reveal);
    if (r.invalid) return r;
    const blk = blocks[si];
    blk.classList.remove('active');
    blk.classList.add(r.ok ? 'ok' : 'soft');
    if (r.note) blk.append(h('div', { class: 'gstep-note', html: m(r.note) }));
    allOk = allOk && r.ok;
    si++;
    if (si < steps.length) { open(si); return { stepDone: true, ok: r.ok }; }
    return {
      ok: allOk,
      msg: allOk ? 'Celý postup sedí. Přesně takhle se to dělá.' : 'Mrkni výš na kroky označené oranžově, u každého je vysvětlení.',
      stepsOptional: card.steps,
    };
  }
  open(0);
  return {
    el: h('div', { class: 'card' }, header(card), list),
    get typing() { return ctl && ['interval', 'expr', 'limit', 'points', 'integral'].includes(ctl.kind); },
    focus: () => ctl && ctl.focus && ctl.focus(),
    key: k => ctl && ctl.key && ctl.key(k),
    check: () => step(false),
    reveal: () => step(true),
  };
}

export function renderCard(card) {
  switch (card.type) {
    case 'info': return infoCard(card);
    case 'video': return videoCard(card);
    case 'choice': return choiceCard(card);
    case 'multi': return multiCard(card);
    case 'sort': return sortCard(card);
    case 'interval': return intervalCard(card);
    case 'guided': return guidedCard(card);
    case 'expr': return exprCard(card);
    case 'limit': return limitCard(card);
    case 'points': return pointsCard(card);
    case 'integral': return integralCard(card);
    default: throw new Error('Neznámý typ karty ' + card.type);
  }
}
