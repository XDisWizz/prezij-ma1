// Tapeta na pozadí hlavních stránek: symboly předmětu v náhodném pořadí, pomalu plují šikmo.
// Mřížka se opakuje (dlaždice), proto se kontrolují i sousedé přes okraj: dva stejné symboly nikdy vedle sebe
// (ani šikmo). Pohyb je přesně o jednu dlaždici za periodu, takže smyčka nemá šev.
// V lekcích, drilech a testu se nezobrazuje (data-wall na <html> řídí main.js).

const SYMS = {
  ma1: ['∫', '∂', 'lim', 'Σ', '∞', 'f′', 'dx', 'ln'],
  zm: ['i', 'π', '√', '∠', 'ℂ', 'θ', '±', '∈'],
};
const COLS = 6, ROWS = 6, CELL = 74, TILE = COLS * CELL;
const NB = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

/** rozmístění symbolů bez stejných sousedů (min-conflicts na toru) */
export function layout(n, rnd = Math.random) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const g = Array.from({ length: ROWS * COLS }, () => Math.floor(rnd() * n));
    const at = (x, y) => g[((y + ROWS) % ROWS) * COLS + ((x + COLS) % COLS)];
    const conflicts = (x, y, v) => NB.reduce((c, [dx, dy]) => c + (at(x + dx, y + dy) === v ? 1 : 0), 0);
    for (let step = 0; step < 4000; step++) {
      const bad = [];
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (conflicts(x, y, at(x, y))) bad.push([x, y]);
      if (!bad.length) return g;
      const [x, y] = bad[Math.floor(rnd() * bad.length)];
      let best = [], min = Infinity;
      for (let v = 0; v < n; v++) { const c = conflicts(x, y, v); if (c < min) { min = c; best = [v]; } else if (c === min) best.push(v); }
      g[y * COLS + x] = best[Math.floor(rnd() * best.length)];
    }
  }
  // pojistka (prakticky nenastane): pravidelný vzor 2 × 2 ze čtyř symbolů, ten sousedy nikdy neopakuje
  return Array.from({ length: ROWS * COLS }, (_, i) => ((i % COLS) % 2) + 2 * ((Math.floor(i / COLS)) % 2));
}

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
function svg(course) {
  const syms = SYMS[course] || SYMS.ma1;
  const g = layout(syms.length);
  let t = '';
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const s = syms[g[y * COLS + x]];
    // řádky lehce posunuté (cihly) a drobné náhodné natočení: působí to jako ručně rozházené, ne jako tabulka
    const cx = x * CELL + CELL / 2 + (y % 2 ? CELL / 4 : -CELL / 4) + (Math.random() - 0.5) * 12;
    const cy = y * CELL + CELL / 2 + (Math.random() - 0.5) * 12;
    const size = (s.length > 1 ? 19 : 27) + Math.round((Math.random() - 0.5) * 6);
    const rot = Math.round((Math.random() - 0.5) * 28);
    t += `<text x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" font-size="${size}" text-anchor="middle" dominant-baseline="central" transform="rotate(${rot} ${cx.toFixed(1)} ${cy.toFixed(1)})"${s === 'i' ? ' font-style="italic"' : ''}>${esc(s)}</text>`;
  }
  // dlaždice se opakuje přes <pattern>; plocha je o dlaždici větší, aby se při posunu nic neodkrylo
  return `<svg width="100%" height="100%" aria-hidden="true" style="left:${-TILE}px;top:${-TILE}px;width:calc(100% + ${2 * TILE}px);height:calc(100% + ${2 * TILE}px);--wall-dx:${TILE}px;--wall-dy:${TILE}px">
    <defs><pattern id="wall-p" width="${TILE}" height="${TILE}" patternUnits="userSpaceOnUse"><g id="wall-g">${t}</g>${
      [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]].map(([dx, dy]) => `<use href="#wall-g" x="${dx * TILE}" y="${dy * TILE}"/>`).join('')
    }</pattern></defs>
    <rect width="100%" height="100%" fill="url(#wall-p)"/></svg>`;
}

let el = null, cur = null;
/** vytvoří / přebarví tapetu pro předmět (při změně předmětu nové náhodné rozložení) */
export function setWallpaper(course) {
  if (!el) { el = document.createElement('div'); el.className = 'wall'; document.body.prepend(el); }
  if (cur === course) return;
  const first = cur == null;
  cur = course;
  if (first) { el.innerHTML = svg(course); return; }
  el.classList.add('fade');
  setTimeout(() => { el.innerHTML = svg(course); el.classList.remove('fade'); }, 250);
}
