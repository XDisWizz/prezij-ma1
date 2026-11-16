// Haptika: jemné vibrace k ťukání, odpovědím a animacím.
//
// Android (Chrome): Vibration API se vzory v milisekundách. Síla se řídit nedá, „slabší“ dojem dělá
// kratší puls (2–5 ms = cvaknutí, 10–20 ms = ťuk, 30+ ms = buch) a rytmus mezi pulsy.
// iPhone (Safari 18+): Vibration API tam není. Jde ale vyvolat systémové „cvaknutí“ přepnutím skrytého
// přepínače (<input type="checkbox" switch>); vzor se pak přehraje jako řada cvaknutí.
// Jinde (počítač) se nic neděje.
//
// Vypíná se v Nastavení (store: haptics === false). Nastavení se nesynchronizuje, je pro každé zařízení zvlášť.
import { store } from './store.js';

// vzor = [puls, pauza, puls, pauza, …] v ms
const FX = {
  tap: [4],                       // obyčejné tlačítko
  select: [7],                    // zvolená možnost
  key: [5],                       // klávesa na klávesnici v kartě
  keyRepeat: [3],                 // podržená ⌫ / šipka
  toggleOn: [6, 45, 12],          // přepínač zapnut
  toggleOff: [8],                 // přepínač vypnut
  tick: [2],                      // „textura“ při tažení karty
  detent: [14],                   // karta přetažená přes hranu, kde se pustí = odpověď
  undetent: [4],                  // karta vrácená zpátky před hranu
  enter: [3],                     // nová karta dojela na místo
  pop: [6],                       // otevřené okno, tahák, nápověda
  nope: [5, 45, 5, 45, 5],        // „ještě nic nevybráno“
  success: [9, 65, 22],           // správně: ta-DUM
  step: [7, 55, 12],              // správně splněný krok postupu
  stepSoft: [14],                 // krok postupu nevyšel
  error: [16, 90, 26],            // špatně: dva měkké ťuky (bez trestání)
  soft: [12],                     // Nevím
  streak3: [6, 40, 9, 35, 14, 30, 24],                       // série 3 v řadě
  streak5: [5, 35, 7, 30, 9, 26, 12, 22, 16, 18, 30],        // série 5
  streak10: [4, 30, 5, 26, 6, 22, 8, 18, 10, 16, 13, 14, 18, 12, 24, 60, 45],   // série 10+
  complete: [4, 90, 5, 70, 6, 55, 8, 42, 10, 32, 14, 26, 40],  // konec lekce: zrychlující třpyt a buch
  streakUp: [8, 55, 8, 55, 30],                               // plamínek série dní
  bronze: [18, 90, 30],
  silver: [8, 60, 12, 60, 36],
  trophyIn: [3, 110, 4, 90, 6, 75, 9, 60, 12, 170, 45],      // pohárek přiletí: buch přesně ve vrcholu animace trophyIn (60 % z .9 s)
  heartbeat: [14, 120, 24],                                   // tep zlaté záře
  fanfare: [6, 40, 8, 40, 10, 40, 14, 260, 50],               // ZLATO
  land: [10, 40, 40],                                         // zlatý pohárek dosedl
};

const hasVibrate = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
const isIOS = typeof navigator !== 'undefined' && (/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
/** umí tohle zařízení haptiku? 'full' (vzory), 'ticks' (jen cvaknutí, iPhone), nebo null */
export const support = hasVibrate ? 'full' : isIOS ? 'ticks' : null;

export const enabled = () => !!support && store.get().haptics !== false;

// ---------------------------------------------------------------- iPhone: cvaknutí skrytým přepínačem
let iosSwitch = null;
function iosTick() {
  try {
    if (!iosSwitch) {
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.setAttribute('switch', '');
      input.tabIndex = -1;
      iosSwitch = document.createElement('label');
      iosSwitch.setAttribute('aria-hidden', 'true');
      iosSwitch.style.cssText = 'position:fixed;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;left:-9px;top:-9px';
      iosSwitch.append(input);
      document.body.append(iosSwitch);
    }
    iosSwitch.click();
  } catch { /* nevadí */ }
}
let iosTimers = [];
/** vzor → časy cvaknutí: každý puls je jedno cvaknutí, hodně blízká se slijí (iPhone je víc za sebou nestihne) */
function iosPlay(p) {
  iosTimers.forEach(clearTimeout);
  iosTimers = [];
  let t = 0, last = -999, n = 0;
  for (let i = 0; i < p.length; i += 2) {
    if (t - last >= 55 && n < 6) {
      const at = t;
      if (at === 0) iosTick(); else iosTimers.push(setTimeout(iosTick, at));
      last = t; n++;
    }
    t += p[i] + (p[i + 1] || 0);
  }
}

// ---------------------------------------------------------------- přehrávání
// drobnosti (textura, dojetí karty…) nepřeruší výraznější efekt, který ještě hraje
const WEAK = new Set(['tick', 'enter', 'undetent', 'keyRepeat']);
let pending = null, lastTick = 0, scheduled = [], busyUntil = 0;
function play(p, weak = false) {
  if (!enabled() || document.visibilityState === 'hidden') return;
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;   // před prvním ťuknutím prohlížeč vibrace stejně nepustí
  const now = performance.now();
  if (weak && now < busyUntil) return;
  if (!weak) busyUntil = now + p.reduce((a, b) => a + b, 0);
  if (support === 'full') { try { navigator.vibrate(p); } catch { /* nevadí */ } }
  else iosPlay(p);
}

/**
 * Přehraje efekt (název z FX, nebo vlastní vzor). Přebije, co právě hraje.
 * opts.delay = za kolik ms (sladění s animací); opts.light = drobnost, která se nesmí hromadit (textura tažení)
 */
export function haptic(fx, { delay = 0, light = false } = {}) {
  const p = Array.isArray(fx) ? fx : FX[fx];
  if (!p || !enabled()) return;
  const weak = WEAK.has(fx);
  if (!delay) { clearTimeout(pending); pending = null; }   // konkrétní efekt teď má přednost před obecným ťuknutím (zpožděný ne)
  if (light) {
    const now = performance.now();
    if (now - lastTick < (support === 'ticks' ? 70 : 28)) return;
    lastTick = now;
  }
  if (delay > 0) {
    const t = setTimeout(() => { scheduled = scheduled.filter(x => x !== t); play(p, weak); }, delay);
    scheduled.push(t);
    return;
  }
  play(p, weak);
}

/** zruší naplánované efekty (třeba při odchodu z obrazovky) a utiší, co hraje */
export function hapticStop() {
  scheduled.forEach(clearTimeout); scheduled = [];
  iosTimers.forEach(clearTimeout); iosTimers = [];
  clearTimeout(pending); pending = null;
  busyUntil = 0;
  if (support === 'full' && enabled()) try { navigator.vibrate(0); } catch { /* nevadí */ }
}

/** zruší jen naplánované (zpožděné) efekty, to, co právě hraje, nechá doběhnout */
export function hapticCancelScheduled() { scheduled.forEach(clearTimeout); scheduled = []; }

/** delší choreografie: [[čas ms, efekt], …] od teď */
export function hapticSeq(steps) {
  for (const [at, fx] of steps) haptic(fx, { delay: at });
}

/** série v řadě → efekt (jen na milnících, ať to neotravuje) */
export const streakFx = row => (row >= 10 && row % 5 === 0 ? 'streak10' : row === 5 ? 'streak5' : row === 3 ? 'streak3' : null);

/** třpyt: náhodná drobná cvaknutí po dobu ms (konfety, jiskry); na iPhonu jen pár */
export function sparkle(ms, density = 1) {
  if (!enabled()) return;
  if (support === 'ticks') { hapticSeq([[0, 'tick'], [180, 'tick'], [420, 'tick']]); return; }
  const p = [];
  let t = 0;
  while (t < ms) {
    const on = 2 + Math.round(Math.random() * 3);
    const off = Math.round((40 + Math.random() * 110) / density);
    p.push(on, off);
    t += on + off;
  }
  haptic(p);
}

/** rozjezd: cvaknutí čím dál hustší po dobu ms (let, přísun), na konci efekt end (buch) */
export function ramp(ms, end = 'land') {
  const tail = FX[end] || [];
  if (support === 'ticks') { hapticSeq([[0, 'tick'], [Math.round(ms * .45), 'tick'], [Math.round(ms * .75), 'tick'], [ms, end]]); return; }
  const p = [];
  let t = 0;
  while (true) {
    const k = t / ms, on = 2 + Math.round(k * 4), off = Math.round(130 - 108 * k);
    if (t + on + off > ms) break;
    p.push(on, off);
    t += on + off;
  }
  if (p.length) p[p.length - 1] += ms - t;   // dosednutí přesně v čase ms
  else p.push(0, ms);
  haptic([...p, ...tail]);
}

// ---------------------------------------------------------------- obecné ťuknutí na všechno klikací
// Poslouchá se v zachytávací fázi, ale ťuk se přehraje až po obsluze kliknutí: když obsluha zavolá
// konkrétní efekt (správně, špatně…), ťuknutí se zruší a hraje jen ten.
const TAPPABLE = 'button, summary, a.btn, label.setting, .option, .seg';
function onClick(e) {
  if (!enabled()) return;
  const el = e.target.closest?.(TAPPABLE);
  if (!el || el.disabled || el.closest('[data-hx="own"]')) return;
  if (el.matches('label.setting')) return;   // přepínače v Nastavení hrají vlastní efekt
  const fx = el.matches('.option, .seg, .sw-btn') ? 'select' : el.matches('.key') ? 'key' : 'tap';
  clearTimeout(pending);
  pending = setTimeout(() => { pending = null; play(FX[fx]); }, 0);
}
if (typeof document !== 'undefined') {
  document.addEventListener('click', onClick, true);
  // přepínače (checkboxy) v Nastavení
  document.addEventListener('change', e => {
    const t = e.target;
    if (t?.matches?.('input[type="checkbox"]:not([switch])') && !t.dataset.hx) haptic(t.checked ? 'toggleOn' : 'toggleOff');
  }, true);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') hapticStop(); });
}
