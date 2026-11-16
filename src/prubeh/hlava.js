// Balíček „Z hlavy“ pro cestu Průběh funkce + Taylor: čtení znamének, extrémy, ohyb, asymptoty, koeficienty.
import * as G from './gen.js';
import { sh } from '../defobor/gen.js';
import { frac } from '../intervals.js';
import { signTable } from '../numberline.js';
import { ri, riNot, pick } from '../ui.js';
import { M, sw, ch, opts, fixed } from '../zhlavy.js';

const fac = r => (r === 0 ? 'x' : `(${sh(r)})`);
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
const fr = (p, q) => { if (q < 0) { p = -p; q = -q; } const g = gcd(p, q); p /= g; q /= g; return q === 1 ? String(p) : `${p < 0 ? '-' : ''}\\frac{${Math.abs(p)}}{${q}}`; };
const n = v => `$${v}$`;
const pm = v => `${v < 0 ? '-' : '+'} ${Math.abs(v)}`;
const row = (a, b, signs, label = "f'") => signTable([frac(a), frac(b)], [{ label, signs }]);

// ---------- monotonie ----------
function signRow() {
  const a = ri(-4, 2), b = ri(a + 1, 5), s = pick([['+', '-', '+'], ['-', '+', '-']]), grow = Math.random() < 0.5;
  const out = `$(-\\infty, ${a}) \\cup (${b}, +\\infty)$`, mid = `$(${a}, ${b})$`;
  const right = (s[1] === '+') === grow ? mid : out;
  return ch('signRow', grow ? 'Kde funkce roste?' : 'Kde funkce klesá?', row(a, b, s),
    opts(right, [right === mid ? out : mid, `$(-\\infty, ${a})$`, `$(${b}, +\\infty)$`]),
    "Kde je $f' > 0$, funkce roste. Kde je $f' < 0$, klesá.");
}
function derivSign() {
  const a = ri(-4, 3), b = ri(a + 1, 5), x = riNot(a - 2, b + 2, a, b), pos = (x - a) * (x - b) > 0;
  return sw('derivSign', `Co dělá funkce v bodě $x = ${x}$?`, M(`f'(x) = ${fac(a)}${fac(b)}`), 'Klesá', 'Roste', pos ? 'right' : 'left',
    `Dosaď do derivace: $(${x - a}) \\cdot (${x - b})$ je ${pos ? 'kladné, funkce roste' : 'záporné, funkce klesá'}.`);
}
function splitPts() {
  const a = riNot(-5, 5, 0), b = riNot(-5, 5, 0, a, -a), [lo, hi] = a < b ? [a, b] : [b, a];
  return ch('splitPts', 'Které body rozdělí osu na intervaly?', M(`f'(x) = \\frac{${sh(a)}}{(${sh(b)})^2}`),
    opts(n(`${lo},\\ ${hi}`), [
      [n(a), `Chybí $${b}$: tam funkce není definovaná, takže osu dělí taky.`],
      [n(b), `Chybí $${a}$, nulový bod derivace.`],
      [n(`${-hi},\\ ${-lo}`), 'Pozor na znaménka: čitatel je nula pro $x = ' + a + '$, jmenovatel pro $x = ' + b + '$.'],
    ]),
    `Osu dělí nulové body derivace ($x = ${a}$) a body, kde funkce není definovaná ($x = ${b}$).`);
}

// ---------- extrémy ----------
const EXT_OPT = ['lokální maximum', 'lokální minimum', 'žádný extrém'];
const EXT_WHY = [
  'Zleva funkce roste, zprava klesá: vrchol kopce, lokální maximum.',
  'Zleva funkce klesá, zprava roste: dno údolí, lokální minimum.',
  'Znaménko derivace se v tom bodě nemění, takže tam extrém není (jako u $x^3$ v nule).',
];
function extPick() {
  const a = ri(-4, 2), b = ri(a + 1, 5), s = pick([['+', '-', '+'], ['-', '+', '-'], ['+', '-', '-'], ['-', '-', '+'], ['+', '+', '-'], ['-', '+', '+']]);
  const at = pick([0, 1]), l = s[at], r = s[at + 1], k = l === r ? 2 : l === '+' ? 0 : 1;
  return ch('extPick', `Co má funkce v bodě $x = ${at ? b : a}$?`, row(a, b, s), fixed(EXT_OPT, EXT_OPT[k]), EXT_WHY[k]);
}

// ---------- konvexita a inflexe ----------
function bend() {
  const c = pick([2, 3, 6, -2, -3]), a = riNot(-4, 4, 0), x = riNot(a - 3, a + 3, a), v = c * (x - a);
  return sw('bend', `Jak se graf ohýbá v bodě $x = ${x}$?`, M(`f''(x) = ${c}(${sh(a)})`), 'Konkávní ∩', 'Konvexní ∪', v > 0 ? 'right' : 'left',
    `$f''(${x}) = ${v}$. ${v > 0 ? 'Kladná druhá derivace: graf je ∪, konvexní.' : 'Záporná druhá derivace: graf je ∩, konkávní.'}`);
}
function inflPt() {
  const c = pick([2, 3, 6]), a = riNot(-4, 4, 0);
  return ch('inflPt', 'Kde má funkce inflexní bod?', M(`f''(x) = ${c}x ${pm(-c * a)}`),
    opts(n(`x = ${a}`), [[n(`x = ${-a}`), 'Pozor na znaménko při řešení rovnice.'], [n(`x = ${-c * a}`), `Rovnici $${c}x ${pm(-c * a)} = 0$ je ještě třeba vydělit $${c}$.`], [n('x = 0'), "Inflexe je tam, kde je $f''$ nula a mění znaménko."]]),
    `$f''(x) = 0$ pro $x = ${a}$ a znaménko se tam mění, takže se tam graf přehýbá.`);
}
function convex() { const r = Math.random(); return r < 0.45 ? bend() : r < 0.8 ? inflPt() : G.conceptFor('convex')(); }

// ---------- asymptoty ----------
function vAsym() {
  const a = riNot(-5, 5, 0), b = riNot(-5, 5, 0, a, -a);
  if (Math.random() < 0.3) {
    return ch('vAsym', 'Kde je svislá asymptota?', M(`f(x) = \\ln(${sh(b)})`),
      opts(n(`x = ${b}`), [[n(`x = ${b + 1}`), 'Tam je logaritmus roven nule. K $-\\infty$ padá tam, kde je vnitřek nula.'], [n(`y = ${b}`), 'Svislá asymptota je přímka $x = \\text{číslo}$.'], [n(`x = ${-b}`), 'Pozor na znaménko: vnitřek je nula pro $x = ' + b + '$.']]),
      `Logaritmus padá k $-\\infty$, když se vnitřek blíží nule: $x = ${b}$.`);
  }
  return ch('vAsym', 'Kde je svislá asymptota?', M(`f(x) = \\frac{${sh(a)}}{${sh(b)}}`),
    opts(n(`x = ${b}`), [[n(`x = ${a}`), 'Tam je nula čitatele, funkce je tam rovna nule. Asymptota je v nule jmenovatele.'], [n(`y = ${b}`), 'Svislá asymptota je přímka $x = \\text{číslo}$.'], [n(`x = ${-b}`), 'Pozor na znaménko: jmenovatel je nula pro $x = ' + b + '$.']]),
    `Jmenovatel je nula pro $x = ${b}$ (a čitatel tam nula není), funkce tam utíká do nekonečna.`);
}
function hAsym() {
  const p = pick([1, 1, 2, 2]), q = pick([1, 2]), a = riNot(-4, 5, 0), b = ri(1, 4), c = riNot(-6, 6, 0), d = riNot(-6, 6, 0);
  const term = (k, e) => `${k === 1 ? '' : k === -1 ? '-' : k}x${e === 1 ? '' : `^{${e}}`}`;
  const f = `\\frac{${term(a, p)} ${pm(c)}}{${term(b, q)} ${pm(d)}}`, ratio = n(`y = ${fr(a, b)}`), none = 'žádná (graf má šikmou asymptotu)';
  let right, wrongs, why;
  if (p === q) { right = ratio; wrongs = [[n('y = 0'), 'Nula by vyšla, kdyby byl vyšší stupeň dole.'], [n(`y = ${fr(b, a)}`), 'Podíl koeficientů je horní lomeno dolním.'], [none, 'Stupně jsou stejné, limita v nekonečnu je konečné číslo.']]; why = `Stejný stupeň nahoře i dole: limita v nekonečnu je podíl koeficientů, $y = ${fr(a, b)}$.`; }
  else if (p < q) { right = n('y = 0'); wrongs = [[ratio, 'Podíl koeficientů platí jen při stejném stupni.'], [none, 'Vyšší stupeň je dole, limita v nekonečnu je $0$.'], n('y = 1')]; why = 'Dole je vyšší stupeň, v nekonečnu jde funkce k nule: $y = 0$.'; }
  else { right = none; wrongs = [[ratio, 'Podíl koeficientů platí jen při stejném stupni.'], [n('y = 0'), 'Nula by vyšla, kdyby byl vyšší stupeň dole.']]; why = 'Nahoře je stupeň o jedna vyšší, funkce v nekonečnu roste jako přímka: šikmá asymptota, vodorovná žádná.'; }
  return ch('hAsym', 'Jaká je vodorovná asymptota?', M(`f(x) = ${f}`), opts(right, wrongs), why);
}
function oblique() {
  return Math.random() < 0.5
    ? ch('oblique', 'Šikmá asymptota $y = kx + q$. Jak spočítáš $k$?', null,
      opts('$\\lim \\frac{f(x)}{x}$', [['$\\lim\\,(f(x) - kx)$', 'To je vzorec pro $q$.'], ['$\\lim f(x)$', 'U šikmé asymptoty je tahle limita nekonečná. Sklon dostaneš, když $f(x)$ vydělíš $x$.'], ['$\\lim x \\cdot f(x)$', 'Sklon dostaneš dělením, ne násobením.']]),
      '$k = \\lim \\frac{f(x)}{x}$: o kolik funkce roste na jednotku $x$.')
    : ch('oblique', 'Šikmá asymptota $y = kx + q$. Jak spočítáš $q$?', null,
      opts('$\\lim\\,(f(x) - kx)$', [['$\\lim \\frac{f(x)}{x}$', 'To je vzorec pro $k$.'], ['$\\lim\\,(f(x) - k)$', 'Odečítá se celá přímka $kx$, ne jen číslo $k$.'], ['$\\lim \\frac{f(x)}{kx}$', 'Tahle limita vyjde vždycky $1$. Pro $q$ se $kx$ odečítá.']]),
      '$q = \\lim\\,(f(x) - kx)$: co zbyde, když od funkce odečteš přímku $kx$.');
}

// ---------- globální extrémy ----------
function globPick() {
  if (Math.random() < 0.25) return G.conceptFor('global')();
  for (;;) {
    const c = ri(-2, 3), a = c + ri(-4, 1), b = a + ri(2, 5), max = Math.random() < 0.5;
    if (a === c || b === c || Math.abs(a - c) === Math.abs(b - c)) continue;
    const inside = a < c && c < b, far = Math.abs(a - c) > Math.abs(b - c) ? a : b, near = far === a ? b : a;
    const right = max ? far : inside ? c : near;
    const why = max ? `Parabola otevřená nahoru má největší hodnotu v krajním bodě, který je od vrcholu $x = ${c}$ dál: v $x = ${far}$.`
      : inside ? `Vrchol $x = ${c}$ leží v intervalu a je to dno paraboly.`
        : `Vrchol $x = ${c}$ leží mimo interval, takže se nepočítá. Na intervalu funkce jen ${a > c ? 'roste' : 'klesá'}, nejmenší hodnota je v krajním bodě $x = ${near}$.`;
    const pts = [...new Set([a, b, c])].sort((x, y) => x - y).map(v => n(`x = ${v}`));
    return ch('globPick', `Kde má funkce na $\\langle ${a}, ${b}\\rangle$ ${max ? 'největší' : 'nejmenší'} hodnotu?`, M(`f(x) = ${c === 0 ? 'x^2' : `(${sh(c)})^2`}`), fixed(pts, n(`x = ${right}`)), why);
  }
}

// ---------- Taylor ----------
const TAY = [
  ['\\mathrm{e}^x', 3, '\\frac{1}{6}', ['\\frac{1}{3}', '1', '\\frac{1}{2}'], 'Všechny derivace $\\mathrm{e}^x$ jsou v nule $1$. Koeficient je $\\frac{1}{3!} = \\frac{1}{6}$.'],
  ['\\mathrm{e}^x', 2, '\\frac{1}{2}', ['1', '2', '\\frac{1}{6}'], 'Všechny derivace $\\mathrm{e}^x$ jsou v nule $1$. Koeficient je $\\frac{1}{2!} = \\frac{1}{2}$.'],
  ['\\sin x', 3, '-\\frac{1}{6}', ['\\frac{1}{6}', '-\\frac{1}{3}', '-1'], "$f'''(x) = -\\cos x$, v nule $-1$. Koeficient je $\\frac{-1}{3!} = -\\frac{1}{6}$."],
  ['\\sin x', 1, '1', ['0', '-1', '\\frac{1}{2}'], "$f'(0) = \\cos 0 = 1$ a dělí se $1! = 1$."],
  ['\\sin x', 2, '0', ['-\\frac{1}{2}', '\\frac{1}{2}', '-1'], "$f''(0) = -\\sin 0 = 0$. Sinus má v rozvoji jen liché mocniny."],
  ['\\cos x', 2, '-\\frac{1}{2}', ['\\frac{1}{2}', '-1', '0'], "$f''(x) = -\\cos x$, v nule $-1$. Koeficient je $\\frac{-1}{2!} = -\\frac{1}{2}$."],
  ['\\cos x', 1, '0', ['1', '-1', '-\\frac{1}{2}'], "$f'(0) = -\\sin 0 = 0$. Kosinus má v rozvoji jen sudé mocniny."],
  ['\\ln(1 + x)', 2, '-\\frac{1}{2}', ['\\frac{1}{2}', '-1', '1'], "$f''(x) = -\\frac{1}{(1+x)^2}$, v nule $-1$. Koeficient je $\\frac{-1}{2!} = -\\frac{1}{2}$."],
  ['\\ln(1 + x)', 1, '1', ['0', '-1', '\\frac{1}{2}'], "$f'(x) = \\frac{1}{1+x}$, v nule $1$."],
  ['\\mathrm{e}^{2x}', 2, '2', ['4', '1', '\\frac{1}{2}'], "$f''(x) = 4\\,\\mathrm{e}^{2x}$, v nule $4$. Koeficient je $\\frac{4}{2!} = 2$."],
  ['\\mathrm{e}^{2x}', 1, '2', ['1', '4', '\\frac{1}{2}'], "$f'(x) = 2\\,\\mathrm{e}^{2x}$, v nule $2$."],
];
const der = k => (k <= 3 ? `f${"'".repeat(k)}` : `f^{(${k})}`);
function taylor() {
  if (Math.random() < 0.3) {
    const k = pick([2, 3, 4]);
    return ch('taylor', `Jaký je koeficient u $(x - x_0)^{${k}}$ v Taylorově polynomu?`, null,
      opts(`$\\frac{${der(k)}(x_0)}{${k}!}$`, [[`$\\frac{${der(k)}(x_0)}{${k}}$`, `Dělí se faktoriálem, $${k}!$, ne samotným číslem.`], [`$${der(k)}(x_0)$`, `Derivaci je ještě třeba vydělit $${k}!$.`], [`$\\frac{${der(k - 1)}(x_0)}{${k}!}$`, `K mocnině $${k}$ patří $${k}$. derivace.`]]),
      `U $(x - x_0)^{${k}}$ stojí $${k}$. derivace v bodě $x_0$ dělená $${k}!$.`);
  }
  const [f, k, right, wrongs, why] = pick(TAY);
  return ch('taylor', `Taylorův polynom v bodě $x_0 = 0$: jaké číslo stojí u $x^{${k}}$?`.replace('x^{1}', 'x'), M(`f(x) = ${f}`), opts(n(right), wrongs.map(n)), why);
}
function polyShift() {
  const x0 = pick([1, 2, -1]), k = pick([1, 2]);
  if (Math.random() < 0.5) {
    const b = riNot(-4, 4, 0), f1 = 2 * x0 + b, f0 = x0 * x0 + b * x0;
    const [right, wrongs, why] = k === 1
      ? [f1, [[f0, 'To je hodnota $f(x_0)$, tedy člen bez $(x - x_0)$.'], [b, "Derivaci je třeba vyčíslit v bodě $x_0$, ne v nule."], [2, "To je $f''$. U první mocniny stojí $f'(x_0)$."]], `U $(x ${pm(-x0)})$ stojí $f'(x_0)$. $f'(x) = 2x ${pm(b)}$, v bodě $${x0}$ vyjde $${f1}$.`]
      : [1, [[2, "Druhou derivaci ještě vyděl $2!$: $\\frac{2}{2} = 1$."], [f1, "To je $f'(x_0)$, koeficient u první mocniny."], [0]], "U $(x " + pm(-x0) + ")^2$ stojí $\\frac{f''(x_0)}{2!} = \\frac{2}{2} = 1$."];
    return ch('polyShift', `Taylorův polynom v bodě $x_0 = ${x0}$: jaké číslo stojí u $(x ${pm(-x0)})${k === 2 ? '^2' : ''}$?`, M(`f(x) = x^2 ${pm(b)}x`.replace(/ 1x/, ' x')), opts(n(right), wrongs.map(([v, w]) => [n(v), w])), why);
  }
  const f1 = 3 * x0 * x0, f2 = 3 * x0, f0 = x0 ** 3;
  const [right, wrongs, why] = k === 1
    ? [f1, [[f0, 'To je hodnota $f(x_0)$, tedy člen bez $(x - x_0)$.'], [6 * x0, "To je $f''(x_0)$. U první mocniny stojí $f'(x_0)$."], [3]], `U $(x ${pm(-x0)})$ stojí $f'(x_0)$. $f'(x) = 3x^2$, v bodě $${x0}$ vyjde $${f1}$.`]
    : [f2, [[6 * x0, "Druhou derivaci ještě vyděl $2!$."], [f1, "To je $f'(x_0)$, koeficient u první mocniny."], [f0]], `U $(x ${pm(-x0)})^2$ stojí $\\frac{f''(x_0)}{2!}$. $f''(x) = 6x$, v bodě $${x0}$ je $${6 * x0}$, po vydělení $${f2}$.`];
  return ch('polyShift', `Taylorův polynom v bodě $x_0 = ${x0}$: jaké číslo stojí u $(x ${pm(-x0)})${k === 2 ? '^2' : ''}$?`, M('f(x) = x^3'), opts(n(right), wrongs.map(([v, w]) => [n(v), w])), why);
}

const half = (a, b, p = 0.5) => () => (Math.random() < p ? a() : b());

export const DECK = [
  { id: 'mono', title: 'Znaménko derivace: kde roste a klesá', after: 'p1l1', weak: 'mono', make: half(signRow, derivSign) },
  { id: 'split', title: 'Které body dělí osu', after: 'p1l2', weak: 'mono', make: splitPts },
  { id: 'ext', title: 'Maximum, minimum, nebo nic', after: 'p2l1', weak: 'extrema', make: half(extPick, G.conceptFor('extrema'), 0.7) },
  { id: 'convex', title: 'Druhá derivace: ohyb a inflexe', after: 'p3l1', weak: 'inflection', make: convex },
  { id: 'vasym', title: 'Svislá asymptota od pohledu', after: 'p4l1', weak: 'vertAsym', make: vAsym },
  { id: 'hasym', title: 'Vodorovná asymptota od pohledu', after: 'p4l2', weak: 'horizAsym', make: hAsym },
  { id: 'oblique', title: 'Šikmá asymptota: vzorce pro k a q', after: 'p4l2', weak: 'obliqueAsym', make: oblique },
  { id: 'glob', title: 'Globální extrém na intervalu', after: 'p5l1', weak: 'globalExt', make: globPick },
  { id: 'taylor', title: 'Taylor: koeficienty', after: 'p6l1', weak: 'taylor', make: taylor },
  { id: 'polyshift', title: 'Rozvoj polynomu v jiném bodě', after: 'p6l2', weak: 'polyShift', make: polyShift },
];
