// Políčko, které při psaní rovnou sází matiku: 7/3 jako zlomek pod sebou, √2 s čárou, e^2 nahoře.
// Skutečný text dál drží obyčejný <input> (psaní z klávesnice, vkládání, výběr),
// jen je neviditelný a místo něj se kreslí tahle sazba s vlastním kurzorem.

const ATOM = /[0-9.eπ∞√]/;
const esc = c => (c === '<' ? '&lt;' : c === '&' ? '&amp;' : c);

/** text → strom: znaky, čísla, zlomky, odmocniny, mocniny (každý uzel ví, odkud kam v textu sahá) */
function parse(s) {
  const n = s.length;
  const empty = i => ({ t: 'empty', start: i, end: i });
  function atomOpt(i, neg = false) {
    if (i < n && neg && s[i] === '−') {
      const rest = atomOpt(i + 1);
      return { t: 'grp', items: [{ t: 'ch', i }, rest], start: i, end: rest.end };
    }
    return i < n && ATOM.test(s[i]) ? atom(i) : empty(i);
  }
  function atom(i) {
    let node;
    if (s[i] === '√') { const body = atomOpt(i + 1); node = { t: 'sqrt', at: i, body, start: i, end: body.end }; }
    else if (/[0-9.]/.test(s[i])) { let j = i; while (j < n && /[0-9.]/.test(s[j])) j++; node = { t: 'run', start: i, end: j }; }
    else node = { t: 'run', start: i, end: i + 1 };
    if (s[node.end] === '^') { const exp = atomOpt(node.end + 1, true); node = { t: 'pow', base: node, exp, start: node.start, end: exp.end }; }
    return node;
  }
  const out = [];
  let i = 0;
  while (i < n) {
    if (ATOM.test(s[i])) {
      let node = atom(i);
      if (s[node.end] === '/') { const den = atomOpt(node.end + 1, true); node = { t: 'frac', num: node, den, start: node.start, end: den.end }; }
      out.push(node); i = node.end;
    } else { out.push({ t: 'ch', i }); i++; }
  }
  return out;
}

function toHtml(s, nodes, caret, selS, selE, showCaret) {
  let placed = !showCaret;
  const CARET = '<span class="mf-caret"></span>';
  const before = i => (!placed && caret === i ? ((placed = true), CARET) : '');
  const ch = i => before(i) + `<span data-i="${i}"${i >= selS && i < selE ? ' class="mf-sel"' : ''}>${esc(s[i])}</span>`;
  const box = node => { let h = node.t === 'empty' ? '' : render(node); if (!placed && caret === node.end) { placed = true; h += CARET; } return h; };
  function render(node) {
    switch (node.t) {
      case 'ch': return ch(node.i);
      case 'run': { let h = ''; for (let k = node.start; k < node.end; k++) h += ch(k); return h; }
      case 'grp': return node.items.map(render).join('');
      case 'empty': return `<span class="mf-ph" data-i="${node.start}">${before(node.start)}</span>`;
      case 'sqrt': return ch(node.at) + `<span class="mf-sqrt">${node.body.t === 'empty' ? render(node.body) : box(node.body)}</span>`;
      case 'pow': return box(node.base) + `<span class="mf-sup">${node.exp.t === 'empty' ? render(node.exp) : box(node.exp)}</span>`;
      case 'frac': {
        const pre = before(node.start);
        const num = box(node.num);
        const den = node.den.t === 'empty' ? render(node.den) : box(node.den);
        return pre + `<span class="mf-frac"><span class="mf-num">${num}</span><span class="mf-den">${den}</span></span>`;
      }
    }
    return '';
  }
  let h = nodes.map(render).join('');
  if (!placed) h += CARET;
  return h;
}

/** obalí input sazbou; vrací { el, render } */
export function mathField(input, { coarse = () => false } = {}) {
  input.classList.add('mf-input');
  const view = h('div', 'mf-view');
  const line = h('span', 'mf-line');
  view.append(line);
  const el = h('div', 'mf');
  el.append(input, view);

  function render() {
    const s = input.value;
    const focused = document.activeElement === input;
    el.classList.toggle('focus', focused);
    el.classList.toggle('disabled', input.disabled);
    const active = !input.disabled && (focused || coarse());
    const selS = input.selectionStart ?? s.length, selE = input.selectionEnd ?? s.length;
    if (!s) { line.innerHTML = (active ? '<span class="mf-caret"></span>' : '') + `<span class="mf-placeholder">${esc(input.placeholder || '')}</span>`; return; }
    line.innerHTML = toHtml(s, parse(s), selS, selS, selE, active && selS === selE);
    const c = line.querySelector('.mf-caret');
    if (c && view.scrollWidth > view.clientWidth) c.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  // klik/ťuk do sazby posune kurzor na to místo
  view.addEventListener('pointerdown', e => {
    if (input.disabled) return;
    e.preventDefault();
    const t = e.target.closest('[data-i]');
    let p = input.value.length;
    if (t) {
      const i = +t.dataset.i;
      if (t.classList.contains('mf-ph')) p = i;
      else { const r = t.getBoundingClientRect(); p = e.clientX > r.left + r.width / 2 ? i + 1 : i; }
    }
    input.setSelectionRange(p, p);
    if (!coarse()) input.focus();
    render();
  });
  const later = () => requestAnimationFrame(render);
  for (const ev of ['input', 'focus', 'blur', 'select', 'keyup']) input.addEventListener(ev, render);
  input.addEventListener('keydown', later);
  return { el, render };
}

function h(tag, cls) { const e = document.createElement(tag); e.className = cls; return e; }

