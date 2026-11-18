// Tapeta na pozadí hlavních stránek: symboly předmětu v náhodném pořadí, pomalu plují šikmo.
// Mřížka se opakuje (dlaždice), proto se kontrolují i sousedé přes okraj: dva stejné symboly nikdy vedle sebe
// (ani šikmo). Celé pole pluje společně a každý symbol k tomu jemně zrychluje a zpomaluje ve vlastním rytmu,
// takže se zdá, že má každý trochu jiné tempo, ale rozestupy zůstávají (nic se nepředjíždí ani neslévá).
// Kreslí se na canvas (jeden obrázek za snímek, levné i v telefonu). V lekcích a testu neběží (data-wall řídí main.js).

const SYMS = {
  ma1: ['∫', '∂', 'lim', 'Σ', '∞', 'f′', 'dx', 'ln'],
  zm: ['i', 'π', '√', '∠', 'ℂ', 'θ', '±', '∈'],
};
const COLS = 6, ROWS = 6, CELL = 74, TILE = COLS * CELL;
const SPEED = TILE / 80;   // společný posun: px za sekundu (o jednu dlaždici za 80 s)
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

/** symboly jedné dlaždice: pozice, velikost, natočení a vlastní rytmus (amplituda a perioda houpání po úhlopříčce) */
function makeSymbols(course) {
  const syms = SYMS[course] || SYMS.ma1;
  const g = layout(syms.length);
  const r = (a, b) => a + Math.random() * (b - a);
  const out = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const s = syms[g[y * COLS + x]];
    const period = r(9, 21);
    // rychlost houpání nesmí přebít společný posun, jinak by symbol couval: A·2π/P < 0,6·SPEED
    const amp = Math.min(r(6, 14), 0.6 * SPEED * period / (2 * Math.PI));
    out.push({
      s, italic: s === 'i',
      x: x * CELL + CELL / 2 + (y % 2 ? CELL / 4 : -CELL / 4) + r(-6, 6),   // řádky posunuté jako cihly
      y: y * CELL + CELL / 2 + r(-6, 6),
      size: (s.length > 1 ? 19 : 27) + Math.round(r(-3, 3)),
      rot: r(-14, 14) * Math.PI / 180,
      amp, w: 2 * Math.PI / period, ph: r(0, 2 * Math.PI),
    });
  }
  return out;
}

const root = document.documentElement;
const wallOn = () => root.dataset.wall === 'on';
const calm = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
let el = null, cv = null, ctx = null, symbols = [], course = null, ink = '', W = 0, H = 0, dpr = 1, raf = 0, t0 = 0;

function readInk() { ink = getComputedStyle(root).getPropertyValue('--wall-ink').trim() || 'rgba(0,0,0,.05)'; }
function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  W = window.innerWidth; H = window.innerHeight;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  draw(performance.now());
}
function draw(now) {
  if (!ctx) return;
  const t = calm() ? 0 : (now - t0) / 1000;
  const D = (t * SPEED) % TILE;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let font = '';
  for (const p of symbols) {
    const wob = calm() ? 0 : p.amp * Math.sin(p.w * t + p.ph);
    const bx = p.x + D + wob, by = p.y + D + wob;
    const f = `${p.italic ? 'italic ' : ''}${p.size}px 'Cambria Math', 'STIX Two Math', 'Times New Roman', serif`;
    // kopie dlaždice přes celou obrazovku
    for (let oy = -TILE; oy < H + TILE; oy += TILE) {
      const yy = by + oy - TILE;
      if (yy < -40 || yy > H + 40) continue;
      for (let ox = -TILE; ox < W + TILE; ox += TILE) {
        const xx = bx + ox - TILE;
        if (xx < -40 || xx > W + 40) continue;
        if (f !== font) { ctx.font = f; font = f; }
        ctx.setTransform(dpr * Math.cos(p.rot), dpr * Math.sin(p.rot), -dpr * Math.sin(p.rot), dpr * Math.cos(p.rot), dpr * xx, dpr * yy);
        ctx.fillText(p.s, 0, 0);
      }
    }
  }
}
function loop(now) {
  raf = 0;
  if (!wallOn() || document.hidden) return;
  draw(now);
  if (!calm()) raf = requestAnimationFrame(loop);
}
function kick() { if (!raf && wallOn() && !document.hidden) raf = requestAnimationFrame(loop); }

function init() {
  el = document.createElement('div');
  el.className = 'wall';
  cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  el.append(cv);
  document.body.prepend(el);
  ctx = cv.getContext('2d');
  t0 = performance.now() - Math.random() * 80000;   // ať se nezačíná pokaždé ze stejného místa
  readInk();
  resize();
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', kick);
  // změna motivu nebo předmětu → nová barva; zapnutí tapety → rozběhnout
  new MutationObserver(() => { readInk(); draw(performance.now()); kick(); }).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-course', 'data-wall'] });
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => { readInk(); draw(performance.now()); });
}

/** nastaví symboly předmětu (při změně předmětu nové náhodné rozložení) */
export function setWallpaper(c) {
  if (!el) init();
  if (course === c) { kick(); return; }
  const first = course == null;
  course = c;
  if (first) { symbols = makeSymbols(c); readInk(); draw(performance.now()); kick(); return; }
  el.classList.add('fade');
  setTimeout(() => { symbols = makeSymbols(c); readInk(); draw(performance.now()); el.classList.remove('fade'); kick(); }, 250);
}
