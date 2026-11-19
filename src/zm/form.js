// Základy matematiky: karta s jedním nebo více políčky (komplexní číslo, úhel, seznam čísel, vektor, rovnice roviny, výběr obrázku).
// Jedna klávesnice pro celou kartu, píše do políčka, které je zrovna vybrané.
//
// Políčko: { kind, label, answer, tex, text, accept?, w?, options? (pick), dim? (vec), parallel? (vec), unit?, why? }
//   num      reálné číslo (zlomky, √, π)          answer: číslo
//   nums     seznam čísel „1; −3“ nebo „žádné“     answer: [čísla]
//   complex  a + bi                                answer: [re, im]
//   angle    úhel ve stupních (π → přepočte se)    answer: stupně, porovnává se po 360°
//   angles   seznam úhlů                           answer: [stupně]
//   vec      (a, b, c)                             answer: [..], parallel = stačí násobek
//   plane    ax + by + cz + d = 0                  answer: [a, b, c, d], stačí násobek
//   pick     výběr z možností (obrázky)            options: [{ label, correct }]
//   set      množina / interval „(−∞, 2) ∪ ⟨3, 5⟩“ answer: množina (intervals.js), loose = závorky jsou jedno, alts = další správné tvary
//   sym      výraz v x (sym.js)                    answer: strom, porovnává se číselně
//   symnum   číslo i s ln, e, π, √ (sym.js)         answer: číslo
//   anti     primitivní funkce (kontrola derivací)  f: integrand (strom), answer: jedna primitivní funkce
// text = správná odpověď tak, jak by ji student napsal (pro audit), tex = jak se ukáže.
import { h, m, shuffle, ICONS } from '../ui.js';
import { haptic } from '../haptics.js';
import * as X from './expr.js';
import * as S from '../sym.js';
import { parseSet, PARSE_ERRORS, equal as setEqual, sameEndpoints, toTex as setTex } from '../intervals.js';
import { numberLine } from '../numberline.js';

const coarse = () => window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
const NONE_RE = /^(ž|z)[aá]dn|^nen|^nic|^∅$|^nem[aá]/i;
const fmtDeg = v => `${+v.toFixed(4)}^{\\circ}`.replace('.', '{,}');

// ------------------------------------------------------------ čtení a hodnocení (čisté funkce, používá je i audit)
function real(src, what = 'číslo') {
  const ast = X.parse(src);
  if (X.hasI(ast)) throw new Error(`tady čekám reálné ${what}, bez i`);
  const v = X.ev(ast);
  if (!Number.isFinite(v[0]) || Math.abs(v[1]) > 1e-9) throw new Error('tohle nevychází jako reálné číslo');
  return { v: v[0], ast };
}
const splitList = t => t.split(/;|,\s+/).map(s => s.trim()).filter(Boolean);
const toDeg = (r) => (X.hasPi(r.ast) ? r.v * 180 / Math.PI : r.v);
const stripBr = t => t.trim().replace(/^[([{⟨]\s*/, '').replace(/\s*[)\]}⟩]$/, '');

/** text → { ok, value, tex } | { ok: false, error } */
export function readField(f, text) {
  const t = String(text ?? '').trim();
  if (f.kind === 'pick') return text == null ? { ok: false, error: 'Vyber jednu možnost.' } : { ok: true, value: text, tex: '' };
  if (!t) return { ok: false, error: 'Vyplň všechna políčka.' };
  try {
    switch (f.kind) {
      case 'num': { const r = real(t); return { ok: true, value: r.v, tex: X.tex(r.ast) }; }
      case 'set': {
        if (NONE_RE.test(t)) return { ok: true, value: [], tex: '\\emptyset' };
        const r = parseSet(t);
        if (!r.ok) throw new Error(PARSE_ERRORS[r.error].replace(/\.$/, ''));
        return { ok: true, value: r.set, tex: setTex(r.set) };
      }
      case 'sym': case 'anti': {
        const ast = S.parse(stripLhs(f.kind === 'anti' ? stripC(t) : t));
        return { ok: true, value: ast, tex: S.tex(ast) + (f.kind === 'anti' ? ' + C' : '') };
      }
      case 'symnum': {
        const ast = S.parse(stripLhs(t));
        if (S.hasX(ast)) throw new Error('tady čekám číslo, bez x');
        const v = S.ev(ast, 0);
        if (!Number.isFinite(v)) throw new Error('tohle nevychází jako číslo');
        return { ok: true, value: v, tex: S.tex(ast) };
      }
      case 'complex': { const a = X.parse(t); const v = X.ev(a); if (!v.every(Number.isFinite)) throw new Error('tohle nejde spočítat (dělení nulou?)'); return { ok: true, value: v, tex: X.tex(a) }; }
      case 'angle': { const r = real(t.replace(/°/g, ''), 'číslo'); return { ok: true, value: toDeg(r), tex: X.hasPi(r.ast) ? X.tex(r.ast) : fmtDeg(r.v) }; }
      case 'nums': case 'angles': {
        if (NONE_RE.test(t)) return { ok: true, value: [], tex: '\\text{žádné}' };
        const rs = splitList(f.kind === 'angles' ? t.replace(/°/g, '') : t).map(s => real(s));
        if (!rs.length) throw new Error('napiš čísla oddělená středníkem');
        const value = rs.map(r => (f.kind === 'angles' ? toDeg(r) : r.v));
        return { ok: true, value, tex: rs.map(r => (f.kind === 'angles' && !X.hasPi(r.ast) ? fmtDeg(r.v) : X.tex(r.ast))).join(';\\ ') };
      }
      case 'vec': {
        const inner = stripBr(t);
        const parts = (inner.includes(';') ? inner.split(';') : inner.split(',')).map(s => s.trim()).filter(Boolean);
        const dim = f.dim || 3;
        if (parts.length !== dim) throw new Error(`čekám ${dim} souřadnice oddělené čárkou, např. (1, 0, 2)`);
        const rs = parts.map(s => real(s));
        return { ok: true, value: rs.map(r => r.v), tex: `(${rs.map(r => X.tex(r.ast)).join(',\\ ')})` };
      }
      case 'plane': {
        const sides = t.split('=');
        if (sides.length > 2) throw new Error('jen jedno rovnítko');
        const L = X.parse(sides[0], { vars: 'xyz' }), R = sides[1] != null && sides[1].trim() ? X.parse(sides[1], { vars: 'xyz' }) : { t: 'num', v: 0 };
        if (X.hasI(L) || X.hasI(R)) throw new Error('v rovnici roviny nemá být i');
        const F = (x, y, z) => { const a = X.ev(L, { x, y, z }), b = X.ev(R, { x, y, z }); return a[0] - b[0]; };
        const d = F(0, 0, 0), a = F(1, 0, 0) - d, b = F(0, 1, 0) - d, c = F(0, 0, 1) - d;
        for (const [x, y, z] of [[2, -1, 3], [0.5, 1.7, -2.3], [-3, 4, 1.1]]) {
          if (!X.near(F(x, y, z), a * x + b * y + c * z + d, 1e-7)) throw new Error('rovnice roviny má tvar ax + by + cz + d = 0');
        }
        if ([a, b, c].every(v => Math.abs(v) < 1e-12)) throw new Error('v rovnici chybí x, y i z');
        return { ok: true, value: [a, b, c, d], tex: `${X.tex(L)} = ${R.t === 'num' && R.v === 0 ? '0' : X.tex(R)}` };
      }
    }
  } catch (e) { return { ok: false, error: `${f.label ? stripTex(f.label) + ': ' : ''}${e.message}.` }; }
  return { ok: false, error: 'Neznámé políčko.' };
}
const stripC = v => v.replace(/\+\s*[cC]\s*$/, '').replace(/^\s*[cC]\s*\+/, '').trim();
const stripLhs = v => v.replace(/^\s*(y|[fT]_?2?'{0,2}\s*(\(\s*[^()=]{0,6}\))?)\s*=\s*/i, '');
/** F je primitivní k f? Porovná F' a f relativně (snese i obří hodnoty typu (x⁴ + 2)²⁷). */
export function antiOk(F, f) {
  const dF = S.d(F);
  let n = 0;
  for (const x of [0.13, 0.37, 0.52, 0.81, 1.07, 1.29, 1.61, -0.23, -0.44, -0.71, -1.13, 1.93, 2.31, -1.67, 0.03]) {
    const a = S.ev(f, x), b = S.ev(dF, x);
    if (!Number.isFinite(a)) continue;
    if (!Number.isFinite(b)) return false;
    if (Math.abs(a - b) > 1e-7 * Math.max(1, Math.abs(a))) return false;
    if (++n >= 8) break;
  }
  return n >= 5;
}
/** poměr F'/f, když je stálý (výsledek se liší jen násobkem) */
function antiRatio(F, f) {
  const dF = S.d(F), ks = [];
  for (const x of [0.37, 0.81, 1.27, -0.6, 1.6]) { const a = S.ev(dF, x), b = S.ev(f, x); if (Number.isFinite(a) && Number.isFinite(b) && Math.abs(b) > 1e-9) ks.push(a / b); }
  return ks.length >= 3 && ks.every(k => Math.abs(k - ks[0]) < 1e-6 * Math.max(1, Math.abs(ks[0]))) ? ks[0] : null;
}
const stripTex = s => String(s).replace(/\$/g, '').replace(/\\[a-z]+/gi, '').replace(/[{}]/g, '').replace(/=\s*$/, '').trim();

const mod = (v, p) => ((v % p) + p) % p;
const sameAngle = (a, b, p = 360) => { const d = mod(a - b, p); return d < 1e-6 || p - d < 1e-6; };
function sameSet(u, a, eq) {
  return u.length === a.length && a.every(v => u.some(w => eq(w, v))) && u.every(w => a.some(v => eq(w, v)));
}
const parallel = (u, v) => {
  if (u.every(x => Math.abs(x) < 1e-12)) return false;
  const k = v.findIndex(x => Math.abs(x) > 1e-12);
  const l = u[k] / v[k];
  return Math.abs(l) > 1e-12 && u.every((x, i) => X.near(x, l * v[i], 1e-7));
};

/** je hodnota správně? */
export function judgeField(f, value) {
  if (f.accept) return !!f.accept(value);
  switch (f.kind) {
    case 'num': return X.near(value, f.answer);
    case 'complex': return X.cnear(value, f.answer);
    case 'angle': return sameAngle(value, f.answer, f.mod || 360);
    case 'nums': return sameSet(value, f.answer, (a, b) => X.near(a, b));
    case 'angles': return sameSet(value, f.answer, (a, b) => sameAngle(a, b, f.mod || 360));
    case 'vec': return f.parallel ? parallel(value, f.answer) : value.length === f.answer.length && value.every((v, i) => X.near(v, f.answer[i]));
    case 'plane': return parallel(value, f.answer);
    case 'pick': return !!f.options[value]?.correct;
    case 'set': return [f.answer, ...(f.alts || [])].some(a => (f.loose ? sameEndpoints(value, a) : setEqual(value, a)));
    case 'sym': return S.equiv(value, f.answer);
    case 'symnum': return X.near(value, f.answer, 1e-7);
    case 'anti': return antiOk(value, f.f);
  }
  return false;
}

/** proč je to špatně (jen u častých chyb) */
function diagnose(f, value) {
  if (f.wrongs) for (const w of f.wrongs) if (judgeField({ ...f, accept: null, ...w.as }, value)) return w.msg;
  if (f.kind === 'complex') {
    const [a, b] = f.answer;
    if (X.cnear(value, [a, -b]) && Math.abs(b) > 1e-9) return 'Skoro! U imaginární části máš opačné znaménko.';
    if (X.cnear(value, [-a, -b])) return 'Skoro! Máš opačné znaménko u celého čísla.';
    if (X.cnear(value, [b, a]) && Math.abs(a - b) > 1e-9) return 'Reálná a imaginární část jsou prohozené.';
  }
  if (f.kind === 'angle' && sameAngle(value, f.answer + 180)) return 'Úhel míří přesně na opačnou stranu. Zkontroluj, ve kterém kvadrantu číslo leží.';
  if ((f.kind === 'num' || f.kind === 'symnum') && X.near(value, -f.answer) && Math.abs(f.answer) > 1e-9) return 'Skoro! Máš jen opačné znaménko.';
  if (f.kind === 'set' && !f.loose && sameEndpoints(value, f.answer)) return 'Krajní body sedí, jen závorky ne: ⟨ ⟩ když bod patří, ( ) když nepatří.';
  if (f.kind === 'sym' && S.equiv(value, S.neg(f.answer))) return 'Skoro! Máš opačné znaménko.';
  if (f.kind === 'anti') {
    if (S.equiv(value, S.d(f.f))) return 'Tohle je derivace. Integrál je opačně.';
    const k = antiRatio(value, f.f);
    if (k != null && Math.abs(k - 1) > 1e-6) return `Skoro! Když to zderivuješ, vyjde $${S.fmtNum(k)}$ × zadaná funkce. Zkontroluj číslo, kterým se dělí.`;
    return 'Zkus svůj výsledek zderivovat: musí vyjít funkce pod integrálem.';
  }
  if ((f.kind === 'nums' || f.kind === 'angles') && Array.isArray(value)) {
    const eq = f.kind === 'angles' ? (a, b) => sameAngle(a, b, f.mod || 360) : (a, b) => X.near(a, b);
    if (f.answer.every(v => value.some(w => eq(w, v)))) return 'Máš tam něco navíc.';
    if (value.every(w => f.answer.some(v => eq(w, v)))) return f.answer.length - value.length === 1 ? 'Jedno řešení ti chybí.' : 'Některá řešení ti chybí.';
  }
  if (f.kind === 'vec' && !f.parallel && f.answer.every((v, i) => X.near(-value[i], v))) return 'Vektor máš obráceně: počítá se „konec mínus začátek“.';
  if (f.kind === 'plane' && parallel(value.slice(0, 3), f.answer.slice(0, 3))) return 'Normálový vektor sedí, jen $d$ ne. Dosaď bod do rovnice a dopočítej $d$.';
  return f.why || null;
}

/** ohodnotí celé pole odpovědí (texty / indexy) → { invalid } | { ok, score, results } */
export function judgeAll(fields, texts) {
  const reads = fields.map((f, i) => readField(f, texts[i]));
  const bad = reads.find(r => !r.ok);
  if (bad) return { invalid: bad.error };
  const results = fields.map((f, i) => ({ ok: judgeField(f, reads[i].value), read: reads[i] }));
  const W = fields.reduce((s, f) => s + (f.w ?? 1), 0);
  const score = fields.reduce((s, f, i) => s + (results[i].ok ? (f.w ?? 1) : 0), 0) / W;
  return { ok: results.every(r => r.ok), score, results };
}

// ------------------------------------------------------------ klávesnice
const BASE = ['7', '8', '9', '(', ')', '⌫', '4', '5', '6', '+', '−', '/', '1', '2', '3', '·', '√', '^', '0', '.', '²', '◀', '▶', 'AC'];
function fkeysFor(kinds) {
  const k = [];
  if (kinds.has('complex')) k.push(['i', 'i']);
  if (kinds.has('angle') || kinds.has('angles')) k.push(['°', '°'], ['π', 'π']);
  else if (kinds.has('nums') || kinds.has('num')) k.push(['π', 'π']);
  if (kinds.has('vec')) k.push(['( , , )', '(|, , )'], [',', ', ']);
  if (kinds.has('plane')) k.push(['x', 'x'], ['y', 'y'], ['z', 'z'], ['=', ' = ']);
  if (kinds.has('nums') || kinds.has('angles')) k.push(['; další', '; ']);
  if (kinds.has('nums')) k.push(['žádné', '=žádné']);
  if (kinds.has('set')) k.push(['(−∞,', '(−∞, '], ['+∞)', '+∞)'], ['⟨', '⟨'], ['⟩', '⟩'], ['∪', ' ∪ '], [',', ', '], ['ℝ', 'ℝ']);
  if (kinds.has('sym') || kinds.has('anti')) k.push(['x', 'x']);
  if (kinds.has('sym') || kinds.has('anti') || kinds.has('symnum')) k.push(['e', 'e'], ['π', 'π'], ['ln', 'ln(']);
  if (kinds.has('anti')) k.push(['sin', 'sin('], ['cos', 'cos('], ['tg', 'tg('], ['cotg', 'cotg(']);
  return k;
}

// ------------------------------------------------------------ políčka na obrazovce
/** fields → ovládání { box, focus, judge(reveal), done } */
export function formControl(fields, { showAnswers = true } = {}) {
  const inputs = [];
  const picks = [];
  let active = -1;
  const preview = h('div', { class: 'ex-preview zf-preview' });
  const rows = fields.map((f, i) => {
    if (f.kind === 'pick') {
      let sel = null;
      const wide = f.options.some(o => o.label.includes('<svg'));
      const list = h('div', { class: 'options' + (wide ? ' options-wide zf-pics' : ' options-compact') });
      const btns = f.options.map((o, k) => {
        const b = h('button', { class: 'option', type: 'button', onclick: () => { sel = k; btns.forEach((x, j) => x.classList.toggle('selected', j === k)); haptic('select'); } },
          h('span', { class: 'opt-key' }, String.fromCharCode(65 + k)), h('span', { class: 'opt-label', html: m(o.label) }));
        list.append(b);
        return b;
      });
      picks[i] = { get: () => sel, btns };
      return h('div', { class: 'zf-row zf-pick' }, f.label ? h('div', { class: 'zf-label', html: m(f.label) }) : null, list);
    }
    const input = h('input', { class: 'iv-input ex-input zf-input', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: f.placeholder || PH[f.kind] || '', 'aria-label': stripTex(f.label || 'odpověď') });
    if (coarse()) input.setAttribute('inputmode', 'none');
    input.addEventListener('focus', () => setActive(i));
    input.addEventListener('input', () => { const p = pretty(input.value, f.kind); if (p !== input.value) { const c = input.selectionStart; input.value = p; input.setSelectionRange(c, c); } update(); });
    inputs[i] = input;
    const row = h('div', { class: 'zf-row', onpointerdown: () => setActive(i) },
      f.label ? h('span', { class: 'zf-label', html: m(f.label) }) : null, input, f.unit ? h('span', { class: 'zf-unit', html: m(f.unit) }) : null);
    return row;
  });
  const typed = fields.map((f, i) => i).filter(i => fields[i].kind !== 'pick');
  function setActive(i) {
    if (fields[i].kind === 'pick') return;
    active = i;
    rows.forEach((r, k) => r.classList.toggle('active', k === i));
    update();
  }
  const pretty = (t, kind) => {
    t = t.replace(/\*/g, '·').replace(/-/g, '−').replace(/sqrt/gi, '√').replace(/pi/gi, 'π');
    if (kind === 'set') t = t.replace(/inf(inity)?/gi, '∞').replace(/[<[]/g, '⟨').replace(/[>\]]/g, '⟩').replace(/(^|[\s)⟩}])[uU](?=[\s(⟨{]|$)/g, '$1∪').replace(/R/g, 'ℝ');
    return t;
  };
  function update() {
    if (active < 0) { preview.innerHTML = ''; return; }
    const f = fields[active], v = inputs[active].value;
    if (!v.trim()) { preview.innerHTML = `<span class="muted small">${HELP[f.kind] || 'Tady uvidíš, jak tvůj zápis čtu.'}</span>`; return; }
    const r = readField({ ...f, label: '' }, v);
    if (r.ok && f.kind === 'set') { preview.innerHTML = numberLine(r.value); return; }
    preview.innerHTML = r.ok ? '<span class="muted small">Čtu to jako:</span> ' + m(`$${r.tex}$`) : `<span class="muted small">…${r.error.replace(/\.$/, '')}</span>`;
  }
  const cur = () => inputs[active];
  const insert = txt => {
    const input = cur(); if (!input) return;
    if (txt.startsWith('=')) { input.value = txt.slice(1); input.setSelectionRange(input.value.length, input.value.length); update(); return; }
    const s = input.selectionStart ?? input.value.length, e = input.selectionEnd ?? s;
    const cut = txt.indexOf('|'), clean = txt.replace('|', '');
    input.value = input.value.slice(0, s) + clean + input.value.slice(e);
    const p = s + (cut < 0 ? clean.length : cut);
    input.setSelectionRange(p, p);
    if (!coarse()) input.focus();
    update();
  };
  const back = () => {
    const input = cur(); if (!input) return;
    const s = input.selectionStart ?? input.value.length, e = input.selectionEnd ?? s;
    if (s !== e) { input.value = input.value.slice(0, s) + input.value.slice(e); input.setSelectionRange(s, s); }
    else if (s > 0) { input.value = input.value.slice(0, s - 1) + input.value.slice(s); input.setSelectionRange(s - 1, s - 1); }
    update();
  };
  const move = d => { const input = cur(); if (!input) return; const s = input.selectionStart ?? input.value.length; const p = Math.max(0, Math.min(input.value.length, s + d)); input.setSelectionRange(p, p); if (!coarse()) input.focus(); };
  const run = k => {
    haptic('key');
    if (k === '⌫') return back();
    if (k === 'AC') { const input = cur(); if (input) { input.value = ''; update(); } return; }
    if (k === '◀') return move(-1);
    if (k === '▶') return move(1);
    if (k === '²') return insert('^2');
    if (k === '√') return insert('√(|)');
    insert(k);
  };
  const keyBtn = (label, ins, cls) => h('button', { class: 'key ' + cls, type: 'button', tabindex: '-1', 'data-hx': 'own', 'aria-label': label === '⌫' ? 'Smazat znak' : label === 'AC' ? 'Smazat vše' : label,
    onpointerdown: e => { if (e.button > 0) return; e.preventDefault(); run(ins); }, onclick: e => { if (e.detail === 0) run(ins); } }, label);
  const kinds = new Set(fields.map(f => f.kind));
  const pad = typed.length ? h('div', { class: 'ex-pad zf-pad' },
    h('div', { class: 'fkeys' }, fkeysFor(kinds).map(([l, ins]) => keyBtn(l, ins, 'fkey'))),
    h('div', { class: 'keypad' }, BASE.map(k => keyBtn(k, k, /[0-9.]/.test(k) ? 'key-num' : /[◀▶⌫]|AC/.test(k) ? 'key-act' : '')))) : null;
  if (typed.length) setActive(typed[0]);
  // psaná políčka nahoře hned u klávesnice, výběr obrázku až pod ní
  const typedRows = rows.filter((r, i) => fields[i].kind !== 'pick'), pickRows = rows.filter((r, i) => fields[i].kind === 'pick');
  const box = h('div', { class: 'iv-box zf-box' }, typedRows.length ? h('div', { class: 'zf-rows' }, typedRows) : null, typed.length ? preview : null, pad,
    pickRows.length ? h('div', { class: 'zf-rows zf-picks' }, pickRows) : null);

  function done() {
    inputs.forEach(x => x && (x.disabled = true));
    picks.forEach(p => p && p.btns.forEach(b => (b.disabled = true)));
    pad && pad.remove();
    preview.remove();
    rows.forEach(r => r.classList.remove('active'));
  }
  function mark(results) {
    fields.forEach((f, i) => {
      const ok = results ? results[i].ok : false;
      rows[i].classList.add(ok ? 'zf-ok' : 'zf-bad');
      if (f.kind === 'pick') {
        picks[i].btns.forEach((b, k) => { if (f.options[k].correct) b.classList.add('right'); else if (picks[i].get() === k) b.classList.add('wrong'); });
      } else if (!ok && showAnswers) rows[i].append(h('span', { class: 'zf-right', html: m(`$${f.tex}$`) }));
    });
  }
  function summary(results) {
    const lines = fields.map((f, i) => {
      if (f.kind === 'pick') return results && !results[i].ok ? `<li>${stripTex(f.label) || 'Obrázek'}: správně je ${String.fromCharCode(65 + f.options.findIndex(o => o.correct))}.</li>` : '';
      if (!results) return `<li>${m(f.label || '')} ${m(`$${f.tex}$`)}</li>`;
      if (results[i].ok) return '';
      const why = diagnose(f, results[i].read.value);
      return `<li>${m(f.label || '')} <span class="muted small">Ty:</span> ${m(`$${results[i].read.tex}$`)} · <span class="muted small">Správně:</span> ${m(`$${f.tex}$`)}${why ? `<br><span class="small">${m(why)}</span>` : ''}</li>`;
    }).join('');
    return lines ? `<ul class="why-list zf-sum">${lines}</ul>` : '';
  }
  return {
    box, typing: typed.length > 0,
    focus: () => { if (!coarse() && active >= 0) inputs[active].focus(); },
    /** reveal = Nevím */
    judge(reveal) {
      if (reveal) { done(); mark(null); return { ok: false, score: 0, msg: summary(null) }; }
      const r = judgeAll(fields, fields.map((f, i) => (f.kind === 'pick' ? picks[i].get() : inputs[i].value)));
      if (r.invalid) return r;
      done(); mark(r.results);
      return { ok: r.ok, score: r.score, results: r.results, msg: r.ok ? fields.filter(f => f.kind !== 'pick').map(f => m(`$${f.tex}$`)).join(', ') : summary(r.results) };
    },
    done,
  };
}
const PH = { set: 'např. (−∞, 1) ∪ (1, 3⟩', sym: 'např. 1 − 3(x − 1) + 9(x − 1)^2', symnum: 'např. 37/6 + 3 ln(3)', anti: 'např. sin(x^5 + 3)/5', num: 'např. 3/2', nums: 'např. 1/2; −3', complex: 'např. 2 − 3i', angle: 'např. 60', angles: 'např. 20; 140; 260', vec: 'např. (1, 0, 2)', plane: 'např. x + 2y − z + 3 = 0' };
const HELP = {
  set: 'Intervaly spoj znakem ∪, nekonečno je ∞. Když nic, napiš „žádné“.',
  sym: 'Výraz s x, třeba 2 − x + x^2 nebo −3 − 2(x − π) + 3/2 (x − π)^2.',
  symnum: 'Číslo: zlomek, ln, e, π i √ jdou, třeba 4 + 3 ln(3).',
  anti: '„+ C“ psát nemusíš. Kontroluje se derivováním, projde jakýkoli správný tvar.',
  complex: 'Piš jako a + bi, třeba 3/10 − 1/10 i. Odmocnina: √3.',
  angle: 'Ve stupních (60), nebo v radiánech s π (π/3).',
  angles: 'Úhly oddělené středníkem: 20; 140; 260.',
  nums: 'Čísla oddělená středníkem, nebo „žádné“.',
  vec: 'Tři čísla oddělená čárkou: (1, 0, 2).',
  plane: 'Celá rovnice: x + 2y + 3z − 4 = 0.',
};

// ------------------------------------------------------------ karta
export function formCard(card) {
  const ctl = formControl(card.fields);
  const head = h('div', { class: 'card-head' });
  if (card.badge) head.append(h('span', { class: 'badge' }, card.badge));
  head.append(h('div', { class: 'prompt', html: m(card.prompt || '') }));
  const ctx = card.context || card.fn;
  if (ctx) head.append(h('div', { class: 'fn-box', html: m(`$$${ctx}$$`) }));
  if (card.show) head.append(h('div', { class: 'fn-box show-box', html: m(card.show) }));
  return {
    el: h('div', { class: 'card' }, head, ctl.box), focus: ctl.focus, typing: ctl.typing,
    check() {
      const r = ctl.judge(false);
      if (r.invalid) return r;
      return { ok: r.ok, score: r.score, msg: r.msg, steps: r.ok ? null : card.steps, stepsOptional: r.ok ? card.steps : null };
    },
    reveal() { const r = ctl.judge(true); return { msg: r.msg, steps: card.steps }; },
  };
}

/** krok v řešení po krocích: { kind: 'form', fields } */
export function formStep(st) {
  const ctl = formControl(st.fields);
  return {
    box: ctl.box, focus: ctl.focus,
    judge(reveal) {
      const r = ctl.judge(reveal);
      if (r.invalid) return r;
      const why = st.why ? `<div class="gwhy">${m(st.why)}</div>` : '';
      if (reveal) return { ok: false, note: `Správně: ${st.fields.filter(f => f.kind !== 'pick').map(f => m(`${f.label || ''} $${f.tex}$`)).join(', ')}${why}` };
      return { ok: r.ok, note: r.ok ? '✓ ' + r.msg : r.msg + why };
    },
  };
}

/** pomocník pro generátory: karta s políčky */
export const form = (o) => ({ type: 'zform', ...o });
/** výběr z možností: správná + špatné [label, why], zamíchané */
export function options(right, wrongs, rightWhy = '', max = 4) {
  const out = [{ label: right, correct: true, why: rightWhy }];
  for (const w of wrongs) {
    if (out.length >= max) break;
    const [label, why] = Array.isArray(w) ? w : [w, ''];
    if (label == null || out.some(o => o.label === label)) continue;
    out.push({ label, correct: false, why });
  }
  return shuffle(out);
}
export { ICONS };
