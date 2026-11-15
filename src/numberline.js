import { normalize, endpoints, eq, isR } from './intervals.js';

/**
 * Číselná osa jako SVG. Body nejsou v měřítku, jen ve správném pořadí
 * (stejně jako na tabuli) – je to přehlednější.
 * opts.extra = další body, které se mají popsat (např. nulové body)
 * opts.label = popisek vlevo (např. "√(x+3)")
 */
export function numberLine(set, opts = {}) {
  set = normalize(set);
  const pts = endpoints(set, ...(opts.extra || []).map(p => [{ a: p, b: p, ai: true, bi: true }]));
  const W = 340, pad = 18, y = 26;
  const H = pts.some(p => isFrac(p.txt)) ? 78 : 64;
  const n = pts.length;
  const xs = pts.map((_, i) => pad + 20 + (i + 1) * (W - 2 * pad - 40) / (n + 1));
  const xOf = p => p.v === -Infinity ? pad : p.v === Infinity ? W - pad : xs[pts.findIndex(q => eq(q.v, p.v))];
  let g = '';
  g += `<line class="nl-axis" x1="${pad - 6}" y1="${y}" x2="${W - pad + 8}" y2="${y}"/>`;
  g += `<path class="nl-axis-head" d="M${W - pad + 8} ${y} l-7 -4 v8 z"/>`;
  for (const I of set) {
    if (eq(I.a.v, I.b.v)) continue;
    const x1 = xOf(I.a), x2 = xOf(I.b);
    g += `<line class="nl-seg" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/>`;
    if (I.a.v === -Infinity) g += `<path class="nl-seg-head" d="M${x1 - 4} ${y} l8 -5 v10 z"/>`;
    if (I.b.v === Infinity) g += `<path class="nl-seg-head" d="M${x2 + 4} ${y} l-8 -5 v10 z"/>`;
  }
  pts.forEach((p, i) => {
    const x = xs[i];
    let state = 'none';
    for (const I of set) {
      if (eq(I.a.v, p.v)) state = I.ai ? 'in' : (state === 'in' ? 'in' : 'out');
      if (eq(I.b.v, p.v)) state = I.bi ? 'in' : (state === 'in' ? 'in' : 'out');
    }
    if (state === 'in') g += `<circle class="nl-dot-in" cx="${x}" cy="${y}" r="6"/>`;
    else if (state === 'out') g += `<circle class="nl-dot-out" cx="${x}" cy="${y}" r="6"/>`;
    else g += `<line class="nl-tick" x1="${x}" y1="${y - 5}" x2="${x}" y2="${y + 5}"/>`;
    g += labelSvg(p.txt, x, y + 26);
  });
  if (!set.length) g += `<text class="nl-note" x="${W / 2}" y="${y - 10}" text-anchor="middle">prázdná množina</text>`;
  else if (isR(set)) g += `<text class="nl-note" x="${W / 2}" y="${y - 10}" text-anchor="middle">všechna reálná čísla</text>`;
  const label = opts.label ? `<div class="nl-caption">${opts.label}</div>` : '';
  return `<div class="nl">${label}<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="číselná osa">${g}</svg></div>`;
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// popisek bodu: zlomek pod sebou (−7/3), mocnina nahoře (e^2)
const FRAC = /^(−?)([^/]+)\/([^/]+)$/;
const isFrac = t => FRAC.test(String(t));
const sup = t => esc(t).replace(/\^\(?(−?[^)]+)\)?$/, '<tspan class="nl-sup" dy="-6">$1</tspan>');
function labelSvg(txt, x, yb) {
  const m = FRAC.exec(String(txt));
  if (!m) return `<text class="nl-label" x="${x}" y="${yb}" text-anchor="middle">${sup(txt)}</text>`;
  const [, sign, num, den] = m;
  const w = Math.max(num.length, den.length) * 7.5 + 6;
  const yBar = yb - 3;
  let g = `<text class="nl-label nl-frac" x="${x}" y="${yBar - 4}" text-anchor="middle">${sup(num)}</text>`
    + `<line class="nl-bar" x1="${x - w / 2}" y1="${yBar}" x2="${x + w / 2}" y2="${yBar}"/>`
    + `<text class="nl-label nl-frac" x="${x}" y="${yBar + 14}" text-anchor="middle">${sup(den)}</text>`;
  if (sign) g += `<text class="nl-label" x="${x - w / 2 - 2}" y="${yBar + 5}" text-anchor="end">−</text>`;
  return g;
}

/** Tabulka znamének: points = [{txt|tex}], rows = [{label(tex), signs:['+','-',...]}] */
export function signTable(points, rows) {
  const cols = points.length + 1;
  let head = '<tr><th></th>';
  for (let i = 0; i < cols; i++) {
    const L = i === 0 ? '-\\infty' : points[i - 1].tex;
    const R = i === cols - 1 ? '+\\infty' : points[i].tex;
    head += `<th>$(${L}, ${R})$</th>`;
  }
  head += '</tr>';
  const body = rows.map(r => `<tr class="${r.result ? 'st-result' : ''}"><th>$${r.label}$</th>${r.signs.map(s => `<td class="${s === '+' ? 'st-plus' : 'st-minus'}">${s === '+' ? '+' : '−'}</td>`).join('')}</tr>`).join('');
  return `<div class="st-wrap"><table class="sign-table">${head}${body}</table></div>`;
}
