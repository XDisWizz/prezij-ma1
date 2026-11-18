// Základy matematiky: obrázky jako SVG (graf funkce, Gaussova rovina, jednotková kružnice).
// Barvy přes třídy .zp-* ve style.css, takže fungují ve světlém i tmavém režimu.

const f2 = v => +v.toFixed(2);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** mřížka + osy + popisky; vrací { g, X, Y } (převod souřadnic na pixely) */
function frame({ xmin, xmax, ymin, ymax, W, H, step = 1, labels = true, xName = 'x', yName = 'y', labelEvery = 1 }) {
  const pad = 14;
  const X = x => pad + (x - xmin) * (W - 2 * pad) / (xmax - xmin);
  const Y = y => H - pad - (y - ymin) * (H - 2 * pad) / (ymax - ymin);
  let g = '';
  for (let x = Math.ceil(xmin / step) * step; x <= xmax + 1e-9; x += step) g += `<line class="zp-grid" x1="${f2(X(x))}" y1="${f2(Y(ymin))}" x2="${f2(X(x))}" y2="${f2(Y(ymax))}"/>`;
  for (let y = Math.ceil(ymin / step) * step; y <= ymax + 1e-9; y += step) g += `<line class="zp-grid" x1="${f2(X(xmin))}" y1="${f2(Y(y))}" x2="${f2(X(xmax))}" y2="${f2(Y(y))}"/>`;
  const x0 = Math.min(Math.max(0, xmin), xmax), y0 = Math.min(Math.max(0, ymin), ymax);
  g += `<line class="zp-axis" x1="${f2(X(xmin))}" y1="${f2(Y(y0))}" x2="${f2(X(xmax) + 6)}" y2="${f2(Y(y0))}"/><path class="zp-head" d="M${f2(X(xmax) + 8)} ${f2(Y(y0))} l-8 -4 v8 z"/>`;
  g += `<line class="zp-axis" x1="${f2(X(x0))}" y1="${f2(Y(ymin))}" x2="${f2(X(x0))}" y2="${f2(Y(ymax) - 6)}"/><path class="zp-head" d="M${f2(X(x0))} ${f2(Y(ymax) - 8)} l-4 8 h8 z"/>`;
  g += `<text class="zp-name" x="${f2(X(xmax) - 2)}" y="${f2(Y(y0) - 8)}" text-anchor="end">${esc(xName)}</text>`;
  g += `<text class="zp-name" x="${f2(X(x0) + 8)}" y="${f2(Y(ymax) + 4)}">${esc(yName)}</text>`;
  if (labels) {
    for (let x = Math.ceil(xmin / step) * step; x <= xmax - step / 2; x += step) {
      if (Math.abs(x) < 1e-9 || Math.round(x / step) % labelEvery) continue;
      g += `<text class="zp-tick" x="${f2(X(x))}" y="${f2(Y(y0) + 15)}" text-anchor="middle">${x < 0 ? '−' + -x : x}</text>`;
    }
    for (let y = Math.ceil(ymin / step) * step; y <= ymax - step / 2; y += step) {
      if (Math.abs(y) < 1e-9 || Math.round(y / step) % labelEvery) continue;
      g += `<text class="zp-tick" x="${f2(X(x0) - 5)}" y="${f2(Y(y) + 4)}" text-anchor="end">${y < 0 ? '−' + -y : y}</text>`;
    }
    g += `<text class="zp-tick" x="${f2(X(x0) - 5)}" y="${f2(Y(y0) + 15)}" text-anchor="end">0</text>`;
  }
  return { g, X, Y };
}
const svg = (W, H, g, label, cls = '') => `<svg class="zp ${cls}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${g}</svg>`;

/** graf funkce f (JS funkce x → y); pts = [{ x, y, label }] vyznačené body */
export function graph(f, { xmin = -5, xmax = 5, ymin = -5, ymax = 5, W = 300, H = 240, pts = [], step = 1, labelEvery = 1, small = false, labels = true } = {}) {
  const span = Math.max(xmax - xmin, ymax - ymin);
  const { g: g0, X, Y } = frame({ xmin, xmax, ymin, ymax, W, H, step, labels, labelEvery: small && span / step > 9 ? 2 * labelEvery : labelEvery });
  let g = g0, d = '', pen = false;
  const n = 360;
  for (let k = 0; k <= n; k++) {
    const x = xmin + (xmax - xmin) * k / n, y = f(x);
    if (!Number.isFinite(y) || y < ymin - 3 || y > ymax + 3) { pen = false; continue; }
    const yy = Math.max(ymin - 1, Math.min(ymax + 1, y));
    d += `${pen ? 'L' : 'M'}${f2(X(x))} ${f2(Y(yy))}`;
    pen = true;
  }
  g += `<path class="zp-curve" d="${d}"/>`;
  for (const p of pts) {
    g += `<circle class="zp-pt" cx="${f2(X(p.x))}" cy="${f2(Y(p.y))}" r="${small ? 3.5 : 4.5}"/>`;
    if (p.label) g += `<text class="zp-lbl" x="${f2(X(p.x) + (p.dx ?? 7))}" y="${f2(Y(p.y) + (p.dy ?? -8))}" text-anchor="${p.anchor || 'start'}">${esc(p.label)}</text>`;
  }
  return svg(W, H, g, 'graf funkce', small ? 'zp-small' : '');
}

/** Gaussova rovina s vyznačenými body [{ re, im, label }] */
export function gauss(points, { min = -4, max = 4, W = 260, H = 260, arrows = false } = {}) {
  const { g: g0, X, Y } = frame({ xmin: min, xmax: max, ymin: min, ymax: max, W, H, xName: 'Re z', yName: 'Im z' });
  let g = g0;
  for (const p of points) {
    if (arrows) g += `<line class="zp-vec" x1="${f2(X(0))}" y1="${f2(Y(0))}" x2="${f2(X(p.re))}" y2="${f2(Y(p.im))}"/>`;
    g += `<circle class="zp-pt" cx="${f2(X(p.re))}" cy="${f2(Y(p.im))}" r="5"/>`;
    if (p.label) g += `<text class="zp-lbl" x="${f2(X(p.re) + 7)}" y="${f2(Y(p.im) - 8)}">${esc(p.label)}</text>`;
  }
  return svg(W, H, g, 'Gaussova rovina');
}

/**
 * Jednotková kružnice. angles = [{ deg, label }] vyznačené body,
 * arc = { from, to } (stupně, proti směru hodinek) zvýrazněný oblouk, line = { y } nebo { x } vodorovná / svislá přímka
 */
export function circle({ angles = [], arc = null, line = null, W = 260, H = 260, quadrants = false } = {}) {
  const cx = W / 2, cy = H / 2, R = W * 0.36;
  const P = deg => [cx + R * Math.cos(deg * Math.PI / 180), cy - R * Math.sin(deg * Math.PI / 180)];
  let g = `<line class="zp-axis" x1="10" y1="${cy}" x2="${W - 10}" y2="${cy}"/><line class="zp-axis" x1="${cx}" y1="${H - 10}" x2="${cx}" y2="10"/>`;
  g += `<text class="zp-name" x="${W - 12}" y="${cy - 8}" text-anchor="end">cos</text><text class="zp-name" x="${cx + 8}" y="18">sin</text>`;
  g += `<circle class="zp-circle" cx="${cx}" cy="${cy}" r="${R}"/>`;
  g += `<text class="zp-tick" x="${cx + R + 4}" y="${cy + 15}">1</text><text class="zp-tick" x="${cx - R - 4}" y="${cy + 15}" text-anchor="end">−1</text>`;
  g += `<text class="zp-tick" x="${cx - 5}" y="${cy - R - 4}" text-anchor="end">1</text><text class="zp-tick" x="${cx - 5}" y="${cy + R + 14}" text-anchor="end">−1</text>`;
  if (quadrants) [['I', 45], ['II', 135], ['III', 225], ['IV', 315]].forEach(([t, d]) => { const [x, y] = [cx + R * 0.55 * Math.cos(d * Math.PI / 180), cy - R * 0.55 * Math.sin(d * Math.PI / 180)]; g += `<text class="zp-quad" x="${f2(x)}" y="${f2(y + 6)}" text-anchor="middle">${t}</text>`; });
  if (arc) {
    let { from, to } = arc;
    while (to <= from) to += 360;
    const [x1, y1] = P(from), [x2, y2] = P(to);
    g += `<path class="zp-arc" d="M${f2(x1)} ${f2(y1)} A${R} ${R} 0 ${to - from > 180 ? 1 : 0} 0 ${f2(x2)} ${f2(y2)}"/>`;
  }
  if (line && line.y != null) { const y = cy - R * line.y; g += `<line class="zp-help" x1="12" y1="${f2(y)}" x2="${W - 12}" y2="${f2(y)}"/><text class="zp-tick" x="14" y="${f2(y - 5)}">${esc(line.label || '')}</text>`; }
  if (line && line.x != null) { const x = cx + R * line.x; g += `<line class="zp-help" x1="${f2(x)}" y1="12" x2="${f2(x)}" y2="${H - 12}"/><text class="zp-tick" x="${f2(x + 5)}" y="${H - 14}">${esc(line.label || '')}</text>`; }
  for (const a of angles) {
    const [x, y] = P(a.deg);
    g += `<line class="zp-vec" x1="${cx}" y1="${cy}" x2="${f2(x)}" y2="${f2(y)}"/><circle class="zp-pt" cx="${f2(x)}" cy="${f2(y)}" r="5"/>`;
    if (a.label) {
      const [lx, ly] = [cx + (R + 24) * Math.cos(a.deg * Math.PI / 180), cy - (R + 18) * Math.sin(a.deg * Math.PI / 180)];
      g += `<text class="zp-lbl" x="${f2(lx)}" y="${f2(ly + 5)}" text-anchor="middle">${esc(a.label)}</text>`;
    }
  }
  return svg(W, H, g, 'jednotková kružnice');
}
