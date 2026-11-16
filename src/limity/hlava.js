// Balíček „Z hlavy“ pro cestu Limity: kam to míří, kdo vyhraje a jaký je to typ. Bez psaní.
import * as G from './gen.js';
import { ri, riNot, pick, shuffle } from '../ui.js';
import { M, sw, tf, yn, ch, opts, fixed } from '../zhlavy.js';

const LIMn = body => `\\lim_{n \\to \\infty} ${body}`;
const LIMx = (to, body) => `\\lim_{x \\to ${to}} ${body}`;
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
/** zlomek p/q zkrácený, se znaménkem vpředu */
const fr = (p, q) => { if (q < 0) { p = -p; q = -q; } const g = gcd(p, q); p /= g; q /= g; return q === 1 ? String(p) : `${p < 0 ? '-' : ''}\\frac{${Math.abs(p)}}{${q}}`; };
/** c·t^k bez „1n“ a „n^1“ */
const mono = (c, k, t = 'n') => (k === 0 ? String(c) : `${c === 1 ? '' : c === -1 ? '-' : c}${t}${k === 1 ? '' : `^{${k}}`}`);
/** další sčítanec se znaménkem: „+ 3n“, „- 5“ */
const plus = (c, k, t = 'n') => `${c < 0 ? '-' : '+'} ${mono(Math.abs(c), k, t)}`;
const INF = '$+\\infty$', NINF = '$-\\infty$', DNE = 'neexistuje';
const STD = ['$0$', '$1$', INF, DNE];

// ---------- základy ----------
const BASIC = [
  ['\\frac{1}{n}', '$0$', 'Čím větší $n$, tím menší zlomek. Blíží se nule.'],
  ['n^2', INF, 'Roste nade všechny meze.'],
  ['(-1)^n', DNE, 'Skáče pořád mezi $-1$ a $1$, nikam se neblíží.'],
  ['\\frac{3}{n^2}', '$0$', 'Číslo lomeno něčím obrovským jde k nule.'],
  ['\\sqrt{n}', INF, 'Roste pomalu, ale nade všechny meze.'],
  ['\\left(\\frac{1}{2}\\right)^n', '$0$', 'Půlka z půlky z půlky… jde k nule.'],
  ['2^n', INF, 'Pořád se zdvojnásobuje.'],
  ['\\frac{(-1)^n}{n}', '$0$', 'Skáče kolem nuly, ale čím dál blíž k ní.'],
  ['1 + \\frac{1}{n}', '$1$', '$\\frac{1}{n}$ jde k nule, zbyde $1$.'],
  ['1 - \\frac{1}{\\sqrt{n}}', '$1$', '$\\frac{1}{\\sqrt{n}}$ jde k nule, zbyde $1$.'],
  ['(-1)^n \\cdot n', DNE, 'Střídá znaménko a roste: skáče mezi obrovskými kladnými a zápornými čísly.'],
  ['\\frac{n}{n}', '$1$', 'Je to pořád přesně $1$.'],
  ['\\frac{1}{\\sqrt{n}}', '$0$', 'Jmenovatel roste, zlomek jde k nule.'],
  ['n^3', INF, 'Roste nade všechny meze.'],
];
function basic() {
  const [t, a, why] = pick(BASIC);
  return ch('basic', 'Kam to míří?', M(LIMn(t)), fixed(STD, a), why);
}

const INDET = [
  ['\\infty - \\infty', true, 'Záleží na tom, kdo roste rychleji. Výsledek může být cokoliv.'],
  ['\\infty + \\infty', false, 'Obrovské plus obrovské je $+\\infty$.'],
  ['0 \\cdot \\infty', true, 'Nula tlačí dolů, nekonečno nahoru. Výsledek může být cokoliv.'],
  ['\\frac{5}{\\infty}', false, 'Číslo lomeno obrovským je $0$.'],
  ['\\frac{\\infty}{\\infty}', true, 'Záleží na tom, kdo roste rychleji.'],
  ['\\frac{0}{0}', true, 'Tohle se musí upravit, výsledek může být cokoliv.'],
  ['\\infty \\cdot \\infty', false, 'Obrovské krát obrovské je $+\\infty$.'],
  ['1^\\infty', true, 'Past: není to $1$. Tenhle typ vede na číslo $\\mathrm{e}$.'],
  ['\\frac{0}{\\infty}', false, 'Nula lomeno obrovským je $0$.'],
  ['(-2) \\cdot \\infty', false, 'Záporné číslo krát nekonečno je $-\\infty$.'],
  ['\\infty + 5', false, 'Nekonečno plus číslo je pořád $+\\infty$.'],
  ['\\frac{1}{0^+}', false, 'Jedna lomeno kladným skoro nic je $+\\infty$.'],
  ['2^{\\infty}', false, 'Základ větší než 1 na obrovský exponent je $+\\infty$.'],
];
function indet() {
  const [t, ok, why] = pick(INDET);
  return yn('indet', 'Je to neurčitý výraz?', M(t), ok, (ok ? 'Ano, neurčitý výraz. ' : 'Ne, výsledek je jasný. ') + why);
}

// ---------- polynomy a odmocniny ----------
function ratPoly() {
  const p = ri(1, 3), q = ri(1, 3), a = riNot(-5, 6, 0), b = ri(1, 5);
  const top = `${mono(a, p)} ${plus(riNot(-9, 9, 0), ri(0, p - 1))}`, bot = `${mono(b, q)} ${plus(riNot(-9, 9, 0), ri(0, q - 1))}`;
  const ratio = `$${fr(a, b)}$`, inv = `$${fr(b, a)}$`;
  let right, wrongs, why;
  if (p === q) {
    right = ratio;
    wrongs = [[inv, 'Podíl koeficientů je horní lomeno dolním, ne naopak.'], ['$0$', 'Nula by vyšla, kdyby byl vyšší stupeň dole. Tady jsou stupně stejné.'], [INF, 'Nekonečno by vyšlo, kdyby byl vyšší stupeň nahoře. Tady jsou stupně stejné.'], '$1$'];
    why = `Stejný stupeň nahoře i dole: limita je podíl koeficientů u $${mono(1, p)}$, tedy $${fr(a, b)}$.`;
  } else if (p > q) {
    right = a > 0 ? INF : NINF;
    wrongs = [['$0$', 'Nula by vyšla, kdyby byl vyšší stupeň dole.'], [ratio, 'Podíl koeficientů platí jen při stejném stupni.'], [a > 0 ? NINF : INF, 'Znaménko určují koeficienty u nejvyšších mocnin.']];
    why = `Nahoře je vyšší stupeň ($${mono(1, p)}$ proti $${mono(1, q)}$), čitatel vyhrává. Znaménko podle koeficientů: $${a > 0 ? '+' : '-'}\\infty$.`;
  } else {
    right = '$0$';
    wrongs = [[INF, 'Nekonečno by vyšlo, kdyby byl vyšší stupeň nahoře.'], [ratio, 'Podíl koeficientů platí jen při stejném stupni.'], '$1$'];
    why = `Dole je vyšší stupeň ($${mono(1, q)}$ proti $${mono(1, p)}$), jmenovatel vyhrává a zlomek jde k $0$.`;
  }
  return ch('ratPoly', 'Kam to míří?', M(LIMn(`\\frac{${top}}{${bot}}`)), opts(right, wrongs), why);
}

function rootDeg() {
  const k = pick([2, 3, 4, 5]), d = pick([1, 1, 2]), c = ri(1, 9);
  const L = (cc, kk) => `$${mono(cc, kk)}$`;
  return ch('rootDeg', 'Jak se to chová pro velká $n$?', M(`\\sqrt{${mono(k * k, 2 * d)} + ${mono(c, d)}}`),
    opts(L(k, d), [[L(k * k, d), `Odmocni i číslo: $\\sqrt{${k * k}} = ${k}$.`], [L(k, 2 * d), `Odmocni i mocninu: $\\sqrt{${mono(1, 2 * d)}} = ${mono(1, d)}$.`], [L(k * k, 2 * d), 'Odmocnina se musí použít na číslo i na mocninu.']]),
    `Rozhoduje nejvyšší mocnina: $\\sqrt{${mono(k * k, 2 * d)}} = ${mono(k, d)}$. Zbytek je proti ní zanedbatelný.`);
}

function conj() {
  const np = v => (v ? `n + ${v}` : 'n');
  if (Math.random() < 0.5) {
    const a = ri(1, 9), b = riNot(0, 9, a), A = `\\sqrt{${np(a)}}`, B = `\\sqrt{${np(b)}}`;
    return ch('conj', 'Kolik to je po roznásobení?', M(`\\left(${A} - ${B}\\right)\\left(${A} + ${B}\\right)`),
      opts(`$${a - b}$`, [[`$2n + ${a + b}$`, 'Mezi druhými mocninami je mínus: $(A - B)(A + B) = A^2 - B^2$.'], [`$${a + b}$`, 'Čísla se odečítají: $(A - B)(A + B) = A^2 - B^2$.'], [[2, 3, 5, 6, 7, 8].includes(Math.abs(a - b)) ? `$\\sqrt{${Math.abs(a - b)}}$` : null, 'Odmocniny po roznásobení zmizí úplně.']]),
      `$(A - B)(A + B) = A^2 - B^2$, tedy $(${np(a)}) - (${np(b)}) = ${a - b}$. Odmocniny i $n$ zmizí.`);
  }
  const a = ri(1, 9), root = `\\sqrt{n^2 + ${mono(a, 1)}}`;
  return ch('conj', 'Čím to vynásobíš a zároveň vydělíš?', M(LIMn(`\\left(${root} - n\\right)`)),
    opts(`$${root} + n$`, [[`$${root} - n$`, 'Stejným výrazem odmocnina nezmizí. Uprostřed musí být opačné znaménko.'], ['$n$', 'Samotné $n$ odmocninu neodstraní. Potřebuješ sdružený výraz.'], ['$\\frac{1}{n}$', 'Tím se odmocnina neodstraní. Potřebuješ sdružený výraz.']]),
    `Typ $\\infty - \\infty$ s odmocninou: vynásob a vyděl sdruženým výrazem $${root} + n$ (stejný výraz, jen s plusem). Nahoře pak vyjde $A^2 - B^2$ bez odmocniny.`);
}

// ---------- exponenciály ----------
const QN = [
  ['\\left(\\frac{2}{3}\\right)^n', '$0$', 'Základ je mezi $-1$ a $1$: mocniny se zmenšují k nule.'],
  ['\\left(\\frac{3}{2}\\right)^n', INF, 'Základ je větší než $1$: roste do nekonečna.'],
  ['\\left(-\\frac{1}{2}\\right)^n', '$0$', 'Střídá znaménko, ale zmenšuje se k nule.'],
  ['(-2)^n', DNE, 'Střídá znaménko a roste, nikam se neblíží.'],
  ['1^n', '$1$', 'Jednička na cokoliv je pořád $1$.'],
  ['0{,}9^n', '$0$', 'Základ je menší než $1$, i když jen o kousek: jde k nule.'],
  ['1{,}1^n', INF, 'Základ je větší než $1$, i když jen o kousek: roste do nekonečna.'],
  ['\\frac{1}{3^n}', '$0$', 'Jmenovatel roste do nekonečna, zlomek jde k nule.'],
  ['\\frac{5^n}{4^n}', INF, 'Je to $\\left(\\frac{5}{4}\\right)^n$ a základ je větší než $1$.'],
  ['\\frac{2^n}{3^n}', '$0$', 'Je to $\\left(\\frac{2}{3}\\right)^n$ a základ je menší než $1$.'],
];
function qn() {
  const [t, a, why] = pick(QN);
  return ch('qn', 'Kam to míří?', M(LIMn(t)), fixed(STD, a), why);
}
function expoRatio() {
  const [a, b, c] = shuffle([2, 3, 4, 5, 6, 7]).slice(0, 3).sort((x, y) => y - x), k = ri(2, 5), kind = pick(['same', 'down', 'up']);
  const [top, bot, right, why] = {
    same: [`${k} \\cdot ${a}^n + ${b}^n`, `${a}^n + ${c}^n`, `$${k}$`, `Nahoře i dole vede $${a}^n$, takže zbyde podíl koeficientů: $${k}$.`],
    down: [`${b}^n + ${c}^n`, `${a}^n + ${c}^n`, '$0$', `Největší základ je dole ($${a}^n$), jmenovatel vyhrává a zlomek jde k $0$.`],
    up: [`${a}^n + ${c}^n`, `${b}^n + ${c}^n`, INF, `Největší základ je nahoře ($${a}^n$), čitatel vyhrává.`],
  }[kind];
  const all = ['$0$', '$1$', INF, kind === 'same' ? `$${k}$` : `$${kind === 'down' ? fr(b, a) : fr(a, b)}$`];
  return ch('expoRatio', 'Kam to míří?', M(LIMn(`\\frac{${top}}{${bot}}`)), fixed(all, right), 'Rozhoduje největší základ. ' + why);
}

// ---------- souboj, sevření, e ----------
const HIER = ['\\ln n', '\\sqrt{n}', 'n', 'n^2', 'n^5', '2^n', '3^n', 'n!', 'n^n'];
function growth() {
  const i = ri(0, HIER.length - 2), j = ri(i + 1, HIER.length - 1), up = Math.random() < 0.5;
  const [A, B] = up ? [HIER[j], HIER[i]] : [HIER[i], HIER[j]];
  return sw('growth', 'Kam to míří?', M(LIMn(`\\frac{${A}}{${B}}`)), '$0$', INF, up ? 'right' : 'left',
    `Pořadí podle rychlosti: $${HIER.join(' \\ll ')}$. ${up ? `Nahoře je rychlejší $${A}$, zlomek roste.` : `Dole je rychlejší $${B}$, zlomek jde k nule.`}`);
}
const XH = ['\\ln x', '\\sqrt{x}', 'x', 'x^3', '\\mathrm{e}^x'];
function growthX() {
  const i = ri(0, XH.length - 2), j = ri(i + 1, XH.length - 1), up = Math.random() < 0.5;
  const [A, B] = up ? [XH[j], XH[i]] : [XH[i], XH[j]];
  return sw('growthX', 'Kam to míří?', M(LIMx('\\infty', `\\frac{${A}}{${B}}`)), '$0$', INF, up ? 'right' : 'left',
    `Pro $x \\to \\infty$: logaritmus $\\ll$ mocnina $\\ll$ exponenciála. ${up ? `Nahoře je rychlejší $${A}$.` : `Dole je rychlejší $${B}$.`}`);
}

const SQ = [
  ['\\frac{\\sin n}{n}', '$0$', 'Sinus je omezený (mezi $-1$ a $1$), jmenovatel roste. Omezené lomeno nekonečnem jde k $0$.'],
  ['\\frac{\\cos(n^2)}{\\sqrt{n}}', '$0$', 'Kosinus je omezený, jmenovatel roste. Omezené lomeno nekonečnem jde k $0$.'],
  ['\\sin n', DNE, 'Sinus pořád kmitá mezi $-1$ a $1$ a k ničemu se neblíží.'],
  ['\\frac{(-1)^n}{n^2}', '$0$', '$(-1)^n$ je jen $\\pm 1$, jmenovatel roste. Jde to k $0$.'],
  ['(-1)^n \\cdot \\frac{n}{n+1}', DNE, 'Zlomek jde k $1$ a $(-1)^n$ ho přepíná mezi plusem a mínusem. Skáče mezi $-1$ a $1$.'],
  ['\\frac{n + \\sin n}{n}', '$1$', 'Rozděl: $1 + \\frac{\\sin n}{n}$. Druhý člen je omezené lomeno nekonečnem, jde k $0$.'],
  ['\\frac{3 + \\cos n}{n}', '$0$', 'Čitatel je omezený (mezi $2$ a $4$), jmenovatel roste.'],
  ['\\frac{n}{n + \\cos n}', '$1$', 'Kosinus je proti $n$ zanedbatelný, zbyde $\\frac{n}{n}$.'],
  ['\\frac{\\sin^2 n}{n}', '$0$', '$\\sin^2 n$ je mezi $0$ a $1$, jmenovatel roste.'],
  ['\\cos(n\\pi)', DNE, 'Je to $(-1)^n$: skáče mezi $-1$ a $1$.'],
];
function squeeze() {
  const [t, a, why] = pick(SQ);
  return ch('squeeze', 'Kam to míří?', M(LIMn(t)), fixed(STD, a), why);
}

const eT = v => (v === 1 ? '\\mathrm{e}' : `\\mathrm{e}^{${v}}`);
function eLim() {
  const a = riNot(-4, 5, 0), b = pick([1, 1, 2, 3]), val = a * b;
  const t = `\\left(1 ${a < 0 ? '-' : '+'} \\frac{${Math.abs(a)}}{n}\\right)^{${b === 1 ? '' : b}n}`;
  return ch('eLim', 'Kam to míří?', M(LIMn(t)), opts(`$${eT(val)}$`, [
    ['$1$', 'Past: $1^\\infty$ není $1$, je to neurčitý výraz.'],
    b === 1 ? [`$${eT(-a)}$`, 'Znaménko u zlomku se přenáší do exponentu.'] : [`$${eT(a)}$`, `Exponent je $${b}n$, takže výsledek se ještě umocní na $${b}$.`],
    [`$${val}$`, 'Vyjde $\\mathrm{e}$ umocněné na to číslo, ne číslo samo.'],
  ]), `$\\left(1 + \\frac{a}{n}\\right)^n \\to \\mathrm{e}^a$, tady $a = ${a}$${b > 1 ? ` a celé je to ještě na $${b}$` : ''}: vyjde $${eT(val)}$.`);
}

// ---------- limita funkce, L'Hospital ----------
// [kam jde x, funkce, co dá dosazení, smí se L'Hospital?]
const LH = [
  ['0', '\\frac{\\sin x}{x}', '\\frac{0}{0}', true], ['1', '\\frac{x^2 + 1}{x + 1}', '\\frac{2}{2} = 1', false],
  ['\\infty', '\\frac{\\ln x}{x}', '\\frac{\\infty}{\\infty}', true], ['0', '\\frac{\\cos x}{x + 2}', '\\frac{1}{2}', false],
  ['0', '\\frac{\\mathrm{e}^x - 1}{x}', '\\frac{0}{0}', true], ['2', '\\frac{x^2 - 4}{x - 2}', '\\frac{0}{0}', true],
  ['0', '\\frac{x}{x + 1}', '\\frac{0}{1} = 0', false], ['\\infty', '\\frac{x^2}{\\mathrm{e}^x}', '\\frac{\\infty}{\\infty}', true],
  ['0', '\\frac{x + 3}{\\cos x}', '\\frac{3}{1} = 3', false], ['1', '\\frac{\\ln x}{x - 1}', '\\frac{0}{0}', true],
  ['0', '\\frac{\\mathrm{e}^x}{x + 1}', '\\frac{1}{1} = 1', false], ['0', '\\frac{1 - \\cos x}{x^2}', '\\frac{0}{0}', true],
  ['1', '\\frac{x - 1}{x + 1}', '\\frac{0}{2} = 0', false], ['\\infty', '\\frac{\\mathrm{e}^x}{x^3}', '\\frac{\\infty}{\\infty}', true],
];
function lhopMay() {
  const [to, f, typ, ok] = pick(LH);
  return yn('lhopMay', "Smíš použít L'Hospitalovo pravidlo?", M(LIMx(to, f)), ok,
    ok ? `Dosazení dá $${typ}$. To je neurčitý výraz, L'Hospital se použít smí.`
      : `Dosazení dá $${typ}$. To není neurčitý výraz${typ.startsWith('\\frac{0}') ? ' (nula jen nahoře nevadí)' : ''}, limita je rovnou tohle číslo. L'Hospital by tu dal špatný výsledek.`);
}
const LHF = [
  ['0', '\\frac{\\sin x}{x}', '\\frac{\\cos x}{1}', '\\frac{x\\cos x - \\sin x}{x^2}'],
  ['\\infty', '\\frac{\\ln x}{x}', '\\frac{\\frac{1}{x}}{1}', '\\frac{1 - \\ln x}{x^2}'],
  ['0', '\\frac{\\mathrm{e}^x - 1}{x}', '\\frac{\\mathrm{e}^x}{1}', '\\frac{x\\,\\mathrm{e}^x - \\mathrm{e}^x + 1}{x^2}'],
  ['\\infty', '\\frac{x^2}{\\mathrm{e}^x}', '\\frac{2x}{\\mathrm{e}^x}', '\\frac{2x - x^2}{\\mathrm{e}^x}'],
  ['1', '\\frac{\\ln x}{x - 1}', '\\frac{\\frac{1}{x}}{1}', '\\frac{x - 1 - x\\ln x}{x(x - 1)^2}'],
];
function lhopForm() {
  const [to, f, good, bad] = pick(LHF), ok = Math.random() < 0.5;
  return tf('lhopForm', M(LIMx(to, f)) + M(`\\overset{\\text{L'H}}{=} ${LIMx(to, ok ? good : bad)}`), ok,
    ok ? 'Čitatel a jmenovatel se derivují každý zvlášť.' : "Tohle je derivace podílu. U L'Hospitala se derivuje čitatel zvlášť a jmenovatel zvlášť.");
}
function lhopHead() {
  const k = ri(2, 6), m = riNot(2, 6, k), n = v => `$${v}$`;
  const [to, f, right, wrongs, why] = pick([
    () => ['0', `\\frac{\\sin ${k}x}{x}`, n(k), [[n(1), `Vnitřek $${k}x$ přidá při derivování násobek $${k}$.`], n(0), n(fr(1, k))], `L'Hospital: $\\frac{${k}\\cos ${k}x}{1} \\to ${k}$.`],
    () => ['0', `\\frac{\\sin ${k}x}{\\sin ${m}x}`, n(fr(k, m)), [n(1), [n(fr(m, k)), 'Horní číslo patří nahoru.'], n(0)], `L'Hospital: $\\frac{${k}\\cos ${k}x}{${m}\\cos ${m}x} \\to ${fr(k, m)}$.`],
    () => ['0', `\\frac{\\mathrm{e}^{${k}x} - 1}{x}`, n(k), [[n(1), `Vnitřek $${k}x$ přidá při derivování násobek $${k}$.`], n(0), n(fr(1, k))], `L'Hospital: $\\frac{${k}\\,\\mathrm{e}^{${k}x}}{1} \\to ${k}$.`],
    () => ['0', `\\frac{\\ln(1 + ${k}x)}{x}`, n(k), [n(1), n(0), n(fr(1, k))], `L'Hospital: $\\frac{${k}}{1 + ${k}x} \\to ${k}$.`],
    () => [String(k), `\\frac{x^2 - ${k * k}}{x - ${k}}`, n(2 * k), [[n(k), `Derivace $x^2$ je $2x$, v bodě $${k}$ tedy $${2 * k}$.`], [n(0), '$\\frac{0}{0}$ není nula, je to neurčitý výraz.'], n(1)], `L'Hospital: $\\frac{2x}{1} \\to ${2 * k}$. (Nebo zkrať: $x + ${k}$.)`],
    () => ['0', `\\frac{\\operatorname{tg} ${k}x}{x}`, n(k), [[n(1), `Vnitřek $${k}x$ přidá při derivování násobek $${k}$.`], n(0), n(fr(1, k))], `L'Hospital: $\\frac{${k}}{\\cos^2 ${k}x} \\to ${k}$, protože $\\cos 0 = 1$.`],
  ])();
  return ch('lhopHead', 'Kolik vyjde?', M(LIMx(to, f)), opts(right, wrongs), why);
}

// ---------- 0·∞ a ∞−∞ ----------
const L9 = [
  ['0^+', 'x \\ln x', 0], ['\\infty', 'x\\,\\mathrm{e}^{-x}', 0], ['0^+', '\\sqrt{x}\\,\\ln x', 0], ['\\infty', 'x \\sin\\frac{1}{x}', 0],
  ['0', '\\left(\\frac{1}{x} - \\frac{1}{\\sin x}\\right)', 1], ['1', '\\left(\\frac{1}{\\ln x} - \\frac{1}{x - 1}\\right)', 1], ['0', '\\left(\\frac{1}{x} - \\frac{1}{\\mathrm{e}^x - 1}\\right)', 1],
  ['\\infty', '\\left(\\sqrt{x^2 + x} - x\\right)', 2], ['\\infty', '\\left(\\sqrt{x + 1} - \\sqrt{x}\\right)', 2], ['\\infty', '\\left(\\sqrt{x^2 + 3x} - x\\right)', 2],
];
const L9_OPT = ['jeden činitel přesunout do jmenovatele', 'společný jmenovatel', 'rozšířit sdruženým výrazem'];
const L9_WHY = [
  "Typ $0 \\cdot \\infty$: jeden činitel dej do jmenovatele. Vznikne zlomek, na který jde L'Hospital.",
  'Typ $\\infty - \\infty$ ze dvou zlomků: společný jmenovatel z nich udělá jeden zlomek typu $\\frac{0}{0}$.',
  'Typ $\\infty - \\infty$ s odmocninou: rozšiř sdruženým výrazem, odmocnina z čitatele zmizí.',
];
function firstStep() {
  const [to, f, k] = pick(L9);
  return ch('firstStep', 'Jaký je první krok?', M(LIMx(to, f)), fixed(L9_OPT, L9_OPT[k]), L9_WHY[k]);
}

// ---------- spojitost ----------
function cont() {
  const c = pick([2, 3, -1, -2]), a = riNot(-3, 4, 0), d = a * c - c, n = v => `$${v}$`;
  const low = d === 0 ? 'x' : `x ${d < 0 ? '-' : '+'} ${Math.abs(d)}`;
  return ch('cont', 'Pro jaké $a$ je funkce spojitá?', M(`f(x) = \\begin{cases} ax & x < ${c} \\\\ ${low} & x \\ge ${c} \\end{cases}`),
    opts(n(a), [[n(c + d), `To je hodnota, ve které se obě části mají potkat. Ještě vyřeš $${mono(c, 1, 'a')} = ${c + d}$.`], n(d), n(c), n(-a)]),
    `V bodě $${c}$ se obě části musí potkat. Zleva $${mono(c, 1, 'a')}$, zprava $${c + d}$, tedy $a = ${a}$.`);
}

const half = (a, b, p = 0.5) => () => (Math.random() < p ? a() : b());

export const DECK = [
  { id: 'basic', title: 'Kam posloupnost míří', after: 'l1l1', weak: 'basicSeq', make: basic },
  { id: 'indet', title: 'Neurčitý výraz, nebo jasný výsledek', after: 'l1l2', weak: 'infArith', make: half(indet, G.infArith, 0.6) },
  { id: 'ratpoly', title: 'Polynom lomeno polynom od pohledu', after: 'l2l1', weak: 'ratPoly', make: ratPoly },
  { id: 'rootdeg', title: 'Odmocnina: která mocnina vede', after: 'l2l2', weak: 'rootRatio', make: rootDeg },
  { id: 'conj', title: 'Sdružený výraz', after: 'l3l1', weak: 'conj', make: conj },
  { id: 'expo', title: 'Exponenciály: největší základ', after: 'l4l1', weak: 'expoRatio', make: half(qn, expoRatio) },
  { id: 'growth', title: 'Kdo roste rychleji', after: 'l5l1', weak: 'growth', make: growth },
  { id: 'squeeze', title: 'Omezená krát nulová', after: 'l5l2', weak: 'squeeze', make: squeeze },
  { id: 'e', title: 'Číslo e: typ 1 na nekonečno', after: 'l5l3', weak: 'eLimit', make: eLim },
  { id: 'form', title: 'Jaký je to typ po dosazení', after: 'l6l1', weak: 'plugIn', make: G.formType },
  { id: 'lhopmay', title: "Smím použít L'Hospitala?", after: 'l7l1', weak: 'lhopStd', make: lhopMay },
  { id: 'lhop', title: "L'Hospital z hlavy", after: 'l7l1', weak: 'lhopStd', make: half(lhopHead, lhopForm, 0.65) },
  { id: 'growthx', title: 'Souboj funkcí v nekonečnu', after: 'l8l1', weak: 'infRatio', make: growthX },
  { id: 'step', title: '0·∞ a ∞−∞: první krok', after: 'l9l2', weak: 'infMinusInf', make: firstStep },
  { id: 'cont', title: 'Spojitost: kde se části potkají', after: 'l10l1', weak: 'continuity', make: cont },
];
