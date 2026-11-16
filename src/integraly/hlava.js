// Balíček „Z hlavy“ pro cestu Neurčité integrály: tabulka, volba metody, co je t, co je u. Bez psaní.
import * as G from './gen.js';
import * as S from '../sym.js';
import { ri, pick } from '../ui.js';
import { M, sw, tf, yn, two, ch, opts } from '../zhlavy.js';

const P = S.parse, T = S.tex, simp = S.simplify;
const D = e => simp(S.d(e));
const dx = '\\,\\mathrm{d}x';
const INT = body => `\\int ${body}${dx}`;
const wrap = f => (f.t === 'add' ? `\\left(${T(f)}\\right)` : T(f));
/** možnosti z výrazů (primitivní funkce): správná + špatné [zápis, proč]; výrazy se ukládají i pro audit */
function optsAnti(right, wrongs) {
  const lab = s => `$${T(simp(P(s)))} + C$`;
  const asts = new Map([[lab(right), P(right)], ...wrongs.map(([s]) => [lab(s), P(s)])]);
  return opts(lab(right), wrongs.map(([s, why]) => [lab(s), why])).map(o => ({ ...o, ast: asts.get(o.label) }));
}

// ---------- tabulka: pasti ----------
const TABTF = [
  ['\\sin x', '-\\cos x', '\\cos x', "Kontrola derivováním: $(-\\cos x)' = \\sin x$. U integrálu sinu je mínus."],
  ['\\cos x', '\\sin x', '-\\sin x', "$(\\sin x)' = \\cos x$. Mínus by tu bylo při derivování."],
  ['\\frac{1}{x}', '\\ln|x|', '-\\frac{1}{x^2}', 'Hledáš funkci, jejíž derivace je $\\frac{1}{x}$, a to je $\\ln|x|$. Výraz $-\\frac{1}{x^2}$ je derivace.'],
  ['\\mathrm{e}^x', '\\mathrm{e}^x', '\\frac{\\mathrm{e}^{x+1}}{x+1}', '$\\mathrm{e}^x$ je sama sobě derivací i integrálem. Vzorec s exponentem o jedna větším platí jen pro $x^n$.'],
  ['\\frac{1}{1+x^2}', '\\operatorname{arctg} x', '\\ln(1+x^2)', "$(\\operatorname{arctg} x)' = \\frac{1}{1+x^2}$. Na logaritmus by nahoře musela stát derivace jmenovatele, $2x$."],
  ['\\frac{1}{\\cos^2 x}', '\\operatorname{tg} x', '\\operatorname{cotg} x', "$(\\operatorname{tg} x)' = \\frac{1}{\\cos^2 x}$. Kotangens patří k $\\frac{1}{\\sin^2 x}$ (a s mínusem)."],
  ['\\frac{1}{\\sqrt{1-x^2}}', '\\arcsin x', '\\operatorname{arctg} x', "$(\\arcsin x)' = \\frac{1}{\\sqrt{1-x^2}}$. Arkustangens patří ke zlomku bez odmocniny."],
  ['2^x', '\\frac{2^x}{\\ln 2}', '2^x \\ln 2', 'Při derivování se $\\ln 2$ násobí, při integrování se jím dělí.'],
  ['1', 'x', '0', "$(x)' = 1$. Nula je derivace jedničky, ne její integrál."],
  ['\\frac{1}{x^2}', '-\\frac{1}{x}', '\\ln(x^2)', '$\\frac{1}{x^2} = x^{-2}$, vzorec pro mocninu dá $\\frac{x^{-1}}{-1} = -\\frac{1}{x}$. Logaritmus vychází jen z $\\frac{1}{x}$.'],
  ['\\frac{1}{\\sin^2 x}', '-\\operatorname{cotg} x', '\\operatorname{cotg} x', "$(\\operatorname{cotg} x)' = -\\frac{1}{\\sin^2 x}$, proto je v integrálu mínus."],
];
function tabTF() {
  const [f, good, bad, why] = pick(TABTF), ok = Math.random() < 0.5;
  return tf('tabTF', M(`${INT(f)} = ${ok ? good : bad} + C`), ok, why);
}

// ---------- mocniny ----------
function powPick() {
  const r = Math.random();
  if (r < 0.6) {
    const n = ri(2, 6), f = P(`x^${n}`);
    return { ...ch('powPick', 'Zintegruj z hlavy', M(INT(T(f))), optsAnti(`x^${n + 1}/${n + 1}`, [
      [n === 2 ? '2x' : `${n}x^${n - 1}`, 'To je derivace. Při integrování je exponent o jedna <b>větší</b>.'],
      [`x^${n + 1}`, 'Ještě vyděl novým exponentem.'],
      [`x^${n + 1}/${n}`, `Dělí se <b>novým</b> exponentem, tedy $${n + 1}$.`],
    ]), `Exponent o jedna větší a tím novým exponentem vyděl: $\\frac{x^{${n + 1}}}{${n + 1}}$.`), chk: { kind: 'anti', f } };
  }
  if (r < 0.8) {
    const f = P('1/x^2');
    return { ...ch('powPick', 'Zintegruj z hlavy', M(INT(T(f))), optsAnti('-1/x', [
      ['1/x', 'Chybí mínus: dělíš novým exponentem, a ten je $-1$.'],
      ['-2/x^3', 'To je derivace. Při integrování je exponent o jedna větší: z $-2$ je $-1$.'],
      ['ln(x^2)', 'Logaritmus vychází jen z $\\frac{1}{x}$.'],
    ]), '$\\frac{1}{x^2} = x^{-2}$. Exponent o jedna větší je $-1$ a tím se dělí: $\\frac{x^{-1}}{-1} = -\\frac{1}{x}$.'), chk: { kind: 'anti', f } };
  }
  const f = P('√x');
  return { ...ch('powPick', 'Zintegruj z hlavy', M(INT(T(f))), optsAnti('2/3 x^(3/2)', [
    ['3/2 x^(3/2)', 'Dělit $\\frac{3}{2}$ znamená násobit $\\frac{2}{3}$.'],
    ['1/(2√x)', 'To je derivace odmocniny.'],
    ['2/3 x^(1/2)', 'Exponent se musí o jedna zvětšit: z $\\frac{1}{2}$ je $\\frac{3}{2}$.'],
  ]), '$\\sqrt{x} = x^{\\frac{1}{2}}$. Exponent o jedna větší je $\\frac{3}{2}$ a tím se dělí: $\\frac{2}{3}x^{\\frac{3}{2}}$.'), chk: { kind: 'anti', f } };
}

// ---------- co integrál dovolí ----------
const RULES = [
  [`\\int (x^2 + \\cos x)${dx} = \\int x^2${dx} + \\int \\cos x${dx}`, true, 'Součet se integruje člen po členu.'],
  [`\\int 5\\cos x${dx} = 5\\int \\cos x${dx}`, true, 'Číslo smí před integrál.'],
  [`\\int x\\cos x${dx} = \\int x${dx} \\cdot \\int \\cos x${dx}`, false, 'Součin se takhle po kouscích integrovat nedá. Na součin jsou zvláštní metody (substituce a per partes).'],
  [`\\int \\frac{x^2 + 1}{x}${dx} = \\frac{\\int (x^2 + 1)${dx}}{\\int x${dx}}`, false, 'Čitatel a jmenovatel zvlášť integrovat nejde. Zlomek nejdřív rozděl: $x + \\frac{1}{x}$.'],
  [`\\int x\\,\\mathrm{e}^x${dx} = x\\int \\mathrm{e}^x${dx}`, false, 'Před integrál smí jen číslo, ne výraz s $x$.'],
  [`\\int \\frac{x^2 + 1}{x}${dx} = \\int \\left(x + \\frac{1}{x}\\right)${dx}`, true, 'Zlomek se rozdělil člen po členu. To je povolená úprava a pak už stačí tabulka.'],
  [`\\int (\\mathrm{e}^x - 3x^2)${dx} = \\int \\mathrm{e}^x${dx} - 3\\int x^2${dx}`, true, 'Rozdíl člen po členu a číslo před integrál: obojí je v pořádku.'],
  [`\\int \\sin^2 x${dx} = \\left(\\int \\sin x${dx}\\right)^2`, false, 'Mocnina je součin, a součin se takhle po kouscích integrovat nedá.'],
];
function rules() {
  const [t, ok, why] = pick(RULES);
  return yn('rules', 'Je ta úprava povolená?', M(t), ok, why);
}

// ---------- lineární vnitřek ----------
function linSub() {
  const a = ri(2, 5), b = ri(1, 6);
  const DIV = 'Číslem u $x$ se <b>dělí</b>. Násobí se jím při derivování.', MISS = 'Chybí dělení číslem u $x$.';
  const [fs, right, wrongs] = pick([
    [`cos(${a}x)`, `sin(${a}x)/${a}`, [[`${a} sin(${a}x)`, DIV], [`sin(${a}x)`, MISS], [`-sin(${a}x)/${a}`, 'Integrál kosinu je plus sinus.']]],
    [`sin(${a}x)`, `-cos(${a}x)/${a}`, [[`-${a} cos(${a}x)`, DIV], [`-cos(${a}x)`, MISS], [`cos(${a}x)/${a}`, 'Integrál sinu je mínus kosinus.']]],
    [`e^(${a}x)`, `e^(${a}x)/${a}`, [[`${a} e^(${a}x)`, DIV], [`e^(${a}x)`, MISS]]],
    [`1/(${a}x+${b})`, `ln|${a}x+${b}|/${a}`, [[`${a} ln|${a}x+${b}|`, DIV], [`ln|${a}x+${b}|`, MISS], [`-1/(${a}x+${b})^2`, 'To vypadá jako derivace. Integrál $\\frac{1}{\\text{něco}}$ je logaritmus.']]],
    [`(${a}x+${b})^3`, `(${a}x+${b})^4/${4 * a}`, [[`(${a}x+${b})^4/4`, MISS], [`${a}(${a}x+${b})^4/4`, DIV], [`3(${a}x+${b})^2`, 'To je (skoro) derivace. Exponent má být o jedna větší.']]],
  ]);
  const f = P(fs);
  return { ...ch('linSub', 'Zintegruj z hlavy', M(INT(wrap(f))), optsAnti(right, wrongs), `Integruj vnější funkci jako z tabulky a vyděl číslem u $x$, tedy $${a}$.`), chk: { kind: 'anti', f } };
}

// ---------- kontrola derivováním ----------
// [funkce pod integrálem, tvrzený výsledek, sedí?, derivace výsledku rozepsaná, co je špatně]
const CHK = [
  ['ln x', 'x ln x - x', true, '\\ln x + x \\cdot \\frac{1}{x} - 1 = \\ln x'],
  ['x e^x', 'x e^x', false, '\\mathrm{e}^x + x\\,\\mathrm{e}^x', 'Přebývá $\\mathrm{e}^x$.'],
  ['x e^x', 'x e^x - e^x', true, '\\mathrm{e}^x + x\\,\\mathrm{e}^x - \\mathrm{e}^x = x\\,\\mathrm{e}^x'],
  ['cos(2x)', 'sin(2x)', false, '2\\cos 2x', 'Vyšla dvojka navíc: ve výsledku chybí dělení dvěma.'],
  ['cos(2x)', 'sin(2x)/2', true, '\\frac{2\\cos 2x}{2} = \\cos 2x'],
  ['2x e^(x^2)', 'e^(x^2)', true, '\\mathrm{e}^{x^2} \\cdot 2x'],
  ['2x/(x^2+1)', 'ln(x^2+1)', true, '\\frac{1}{x^2+1} \\cdot 2x'],
  ['1/(x^2+1)', 'ln(x^2+1)', false, '\\frac{2x}{x^2+1}', 'Přebývá $2x$. Správný výsledek je $\\operatorname{arctg} x$.'],
  ['sin^2 x', 'sin^3 x/3', false, '\\sin^2 x \\cdot \\cos x', 'Přebývá $\\cos x$ z derivace vnitřku.'],
  ['x cos x', 'x sin x + cos x', true, '\\sin x + x\\cos x - \\sin x = x\\cos x'],
  ['x cos x', 'x sin x', false, '\\sin x + x\\cos x', 'Přebývá $\\sin x$.'],
  ['(3x+1)^2', '(3x+1)^3/3', false, '(3x+1)^2 \\cdot 3', 'Vyšla trojka navíc: mělo se dělit devíti.'],
  ['(3x+1)^2', '(3x+1)^3/9', true, '\\frac{3(3x+1)^2 \\cdot 3}{9} = (3x+1)^2'],
  ['x sin x', 'sin x - x cos x', true, '\\cos x - \\cos x + x\\sin x = x\\sin x'],
  ['ln x', '1/x', false, '-\\frac{1}{x^2}', '$\\frac{1}{x}$ je derivace logaritmu, ne jeho integrál.'],
  ['e^(3x)', 'e^(3x)/3', true, '\\frac{3\\,\\mathrm{e}^{3x}}{3} = \\mathrm{e}^{3x}'],
];
function check() {
  const [fs, Fs, ok, dTex, bad] = pick(CHK), f = P(fs), F = P(Fs);
  return { ...tf('check', M(`${INT(wrap(f))} = ${T(F)} + C`), ok, `Zderivuj výsledek: $\\left(${T(F)}\\right)' = ${dTex}$. ${ok ? 'To je přesně funkce pod integrálem.' : 'To není funkce pod integrálem. ' + bad}`, 'Sedí to? Zkontroluj derivováním.'), chk: { kind: 'anti', f, shown: F, ok } };
}

// ---------- substituce ----------
const SUB = [
  ['2x\\cos(x^2)', 'x^2', '2x', ['2x', '\\cos x', 'x']],
  ['x\\,\\mathrm{e}^{x^2}', 'x^2', '2x', ['x', '\\mathrm{e}^x', '2x']],
  ['\\frac{\\ln x}{x}', '\\ln x', '\\frac{1}{x}', ['\\frac{1}{x}', 'x', 'x^2']],
  ['\\cos x \\sin^3 x', '\\sin x', '\\cos x', ['\\cos x', 'x^3', 'x']],
  ['\\frac{x}{x^2 + 1}', 'x^2 + 1', '2x', ['x', '\\frac{1}{x}', 'x + 1']],
  ['\\frac{\\mathrm{e}^x}{\\mathrm{e}^x + 1}', '\\mathrm{e}^x + 1', '\\mathrm{e}^x', ['x', 'x + 1', '\\mathrm{e}^{x+1}']],
  ['\\frac{\\sin x}{\\cos^2 x}', '\\cos x', '-\\sin x', ['\\sin x', 'x', 'x^2']],
  ['\\frac{\\operatorname{arctg} x}{1 + x^2}', '\\operatorname{arctg} x', '\\frac{1}{1+x^2}', ['1 + x^2', 'x', 'x^2']],
  ['3x^2 (x^3 + 1)^4', 'x^3 + 1', '3x^2', ['3x^2', 'x^2', 'x^4']],
  ['\\frac{\\cos x}{\\sin x}', '\\sin x', '\\cos x', ['\\cos x', 'x', '\\cos^2 x']],
];
const DT = [
  ['\\sin x', '\\cos x', ['-\\cos x', '\\sin x', '']], ['x^2', '2x', ['x', '2', '\\frac{x^3}{3}']], ['\\ln x', '\\frac{1}{x}', ['\\ln x', 'x', '']],
  ['\\cos x', '-\\sin x', ['\\sin x', '\\cos x', '']], ['\\mathrm{e}^x', '\\mathrm{e}^x', ['x\\,\\mathrm{e}^{x-1}', '', 'x']], ['x^3 + 1', '3x^2', ['(3x^2 + 1)', 'x^2', '']],
  ['\\operatorname{arctg} x', '\\frac{1}{1+x^2}', ['\\frac{1}{\\sqrt{1-x^2}}', '', '\\operatorname{arctg} x']],
];
function subst() {
  if (Math.random() < 0.35) {
    const [t, dt, wrongs] = pick(DT), lab = s => `$${s}${dx}$`.replace('$\\,', '$');
    return ch('subst', 'Čemu se rovná $\\mathrm{d}t$?', M(`t = ${t}`), opts(lab(dt), wrongs.map(w => (w === '' ? [lab(w), 'Samotné $\\mathrm{d}x$ nestačí, před něj patří derivace $t$.'] : lab(w)))),
      `$\\mathrm{d}t$ je derivace $t$ krát $\\mathrm{d}x$: $\\mathrm{d}t = ${dt}${dx}$.`);
  }
  const [f, t, dt, wrongs] = pick(SUB), lab = s => `$t = ${s}$`;
  return ch('subst', 'Co zvolíš za $t$?', M(INT(f)), opts(lab(t), wrongs.map(lab)),
    `Za $t$ ber funkci, jejíž derivace stojí vedle: $t = ${t}$, $\\mathrm{d}t = ${dt}${dx}$.`);
}

// ---------- per partes ----------
const POLY = 'Polynom derivuj: zjednoduší se, a druhý činitel se integruje snadno.';
const PARTS = [
  ['x \\cdot \\mathrm{e}^x', 'x', '\\mathrm{e}^x', 0, POLY], ['x \\cdot \\cos x', 'x', '\\cos x', 0, POLY], ['x^2 \\cdot \\sin x', 'x^2', '\\sin x', 0, POLY], ['(2x + 1) \\cdot \\mathrm{e}^x', '2x + 1', '\\mathrm{e}^x', 0, POLY],
  ['x \\cdot \\ln x', 'x', '\\ln x', 1, 'Logaritmus z tabulky nezintegruješ, ale derivuje se krásně na $\\frac{1}{x}$. Proto $u = \\ln x$.'],
  ['x^3 \\cdot \\ln x', 'x^3', '\\ln x', 1, 'Logaritmus z tabulky nezintegruješ, ale derivuje se krásně na $\\frac{1}{x}$. Proto $u = \\ln x$.'],
  ['x \\cdot \\operatorname{arctg} x', 'x', '\\operatorname{arctg} x', 1, 'Arkustangens derivuj: vyjde $\\frac{1}{1+x^2}$, se kterým se dá pracovat.'],
];
const PP = [
  ["u\\,v - \\int u'\\,v", true, "Přesně tak: $\\int u\\,v' = u\\,v - \\int u'\\,v$."],
  ["u\\,v - \\int u'\\,v", true, "Přesně tak: $\\int u\\,v' = u\\,v - \\int u'\\,v$."],
  ["u\\,v + \\int u'\\,v", false, 'Mezi členy je mínus.'],
  ["u'\\,v - \\int u\\,v", false, "První člen je $u\\,v$ bez derivace. Derivace $u'$ je až v novém integrálu."],
  ["u\\,v - \\int u\\,v'", false, "To je znovu původní integrál. V novém integrálu se role prohodí: $u'$ a $v$."],
];
function parts() {
  if (Math.random() < 0.3) {
    const [t, ok, why] = pick(PP);
    return tf('parts', M(`\\int u\\,v'${dx} = ${t}${dx}`), ok, why);
  }
  const [f, A, B, k, why] = pick(PARTS);
  return sw('parts', 'Per partes: co bude $u$ (to, co derivuješ)?', M(INT(f)), `$u = ${A}$`, `$u = ${B}$`, k ? 'right' : 'left', why);
}

const SP = [
  ['x\\,\\mathrm{e}^{x^2}', 0, 'Uvnitř je $x^2$ a vedle stojí (až na číslo) jeho derivace: substituce $t = x^2$.'],
  ['x\\,\\mathrm{e}^{x}', 1, 'Žádná vnitřní funkce, jen součin polynomu a $\\mathrm{e}^x$: per partes.'],
  ['x \\cos x', 1, 'Žádná vnitřní funkce, jen součin polynomu a kosinu: per partes.'],
  ['x \\cos(x^2)', 0, 'Uvnitř je $x^2$ a vedle stojí (až na číslo) jeho derivace: substituce $t = x^2$.'],
  ['\\frac{\\ln x}{x}', 0, 'Vedle $\\ln x$ stojí jeho derivace $\\frac{1}{x}$: substituce $t = \\ln x$.'],
  ['x \\ln x', 1, 'Součin polynomu a logaritmu, derivace logaritmu tu nikde není: per partes.'],
  ['x^2\\,\\mathrm{e}^{x^3}', 0, 'Uvnitř je $x^3$ a vedle stojí (až na číslo) jeho derivace: substituce $t = x^3$.'],
  ['x^2\\,\\mathrm{e}^{x}', 1, 'Žádná vnitřní funkce, jen součin polynomu a $\\mathrm{e}^x$: per partes (dvakrát).'],
  ['\\sin^2 x \\cos x', 0, 'Vedle sinu stojí jeho derivace: substituce $t = \\sin x$.'],
  ['x \\sin x', 1, 'Žádná vnitřní funkce, jen součin polynomu a sinu: per partes.'],
  ['\\operatorname{arctg} x', 1, 'Samotný arkustangens ber jako $1 \\cdot \\operatorname{arctg} x$: per partes.'],
  ['\\frac{\\operatorname{arctg} x}{1 + x^2}', 0, 'Vedle arkustangens stojí jeho derivace $\\frac{1}{1+x^2}$: substituce $t = \\operatorname{arctg} x$.'],
  ['\\ln x', 1, 'Samotný logaritmus ber jako $1 \\cdot \\ln x$: per partes.'],
  ['\\frac{1}{x \\ln x}', 0, 'Vedle $\\ln x$ stojí jeho derivace $\\frac{1}{x}$: substituce $t = \\ln x$.'],
];
function subOrParts() {
  const [f, k, why] = pick(SP);
  return sw('subOrParts', 'Jakou metodu použiješ?', M(INT(f)), 'Substituce', 'Per partes', k ? 'right' : 'left', why);
}

// ---------- parciální zlomky ----------
function partial() {
  const a = ri(1, 4), b = ri(1, 4);
  if (Math.random() < 0.3) {
    return ch('partial', 'Zintegruj z hlavy', M(INT(`\\frac{${a + 1}}{x - ${b}}`)),
      opts(`$${a + 1}\\ln|x - ${b}| + C$`, [[`$\\ln|x - ${b}| + C$`, 'Číslo z čitatele zůstává před logaritmem.'], [`$-\\frac{${a + 1}}{(x - ${b})^2} + C$`, 'To je derivace. Integrál $\\frac{1}{x - a}$ je logaritmus.'], [`$${a + 1}\\ln|x| - ${b} + C$`, 'Do logaritmu patří celý jmenovatel.']]),
      `Každý parciální zlomek $\\frac{A}{x - a}$ dá $A\\ln|x - a|$.`);
  }
  const kind = pick(['two', 'two', 'double', 'quad']);
  const den = { two: `(x - ${a})(x + ${b})`, double: `(x + ${b})(x - ${a})^2`, quad: `(x - ${a})(x^2 + 1)` }[kind];
  const two = `\\frac{A}{x - ${a}} + \\frac{B}{x + ${b}}`;
  const [right, wrongs, why] = {
    two: [two, [[`\\frac{A}{(x - ${a})(x + ${b})}`, 'To je pořád jeden zlomek. Rozklad má pro každý kořen vlastní zlomek.'], [`\\frac{A}{x - ${a}} \\cdot \\frac{B}{x + ${b}}`, 'Parciální zlomky se sčítají, nenásobí.'], [`\\frac{Ax + B}{x - ${a}} + \\frac{C}{x + ${b}}`, 'Nad lineárním členem stačí číslo. $Ax + B$ patří nad kvadratický člen.']],
      'Dva různé kořeny: každý dostane vlastní zlomek s číslem nahoře.'],
    double: [`\\frac{A}{x + ${b}} + \\frac{B}{x - ${a}} + \\frac{C}{(x - ${a})^2}`, [[`\\frac{A}{x + ${b}} + \\frac{B}{(x - ${a})^2}`, 'U dvojnásobného kořene musí být zlomek s první i s druhou mocninou.'], [`\\frac{A}{x + ${b}} + \\frac{B}{x - ${a}} + \\frac{C}{x - ${a}}`, 'Dva stejné zlomky se sloučí v jeden. Druhý musí mít jmenovatel na druhou.'], [`\\frac{A}{x + ${b}} + \\frac{Bx + C}{x - ${a}}`, '$Bx + C$ patří nad kvadratický člen bez kořenů, ne nad lineární.']],
      'Dvojnásobný kořen dostane dva zlomky: s první a s druhou mocninou.'],
    quad: [`\\frac{A}{x - ${a}} + \\frac{Bx + C}{x^2 + 1}`, [[`\\frac{A}{x - ${a}} + \\frac{B}{x^2 + 1}`, 'Nad kvadratickým členem bez kořenů nestačí číslo, patří tam $Bx + C$.'], [`\\frac{A}{x - ${a}} + \\frac{B}{x + 1} + \\frac{C}{x - 1}`, '$x^2 + 1$ nemá reálné kořeny, nejde rozložit na $(x + 1)(x - 1)$.'], [`\\frac{Ax + B}{x - ${a}} + \\frac{C}{x^2 + 1}`, '$Ax + B$ patří nad kvadratický člen, nad lineárním stačí číslo.']],
      'Člen $x^2 + 1$ nemá reálné kořeny: nad ním stojí $Bx + C$.'],
  }[kind];
  return ch('partial', 'Jak vypadá rozklad na parciální zlomky?', M(`\\frac{1}{${den}}`), opts(`$${right}$`, wrongs.map(([w, y]) => [`$${w}$`, y])), why);
}

// ---------- sin a cos na mocninu, odmocnina do t ----------
const TRIG = [
  ['\\sin^3 x \\cos^2 x', 'c'], ['\\sin^2 x \\cos^3 x', 's'], ['\\sin x \\cos^2 x', 'c'], ['\\sin^4 x \\cos x', 's'], ['\\cos^5 x', 's'], ['\\sin^3 x', 'c'], ['\\sin^2 x \\cos^5 x', 's'], ['\\sin^5 x \\cos^4 x', 'c'],
];
function trig() {
  if (Math.random() < 0.25) {
    const s = Math.random() < 0.5;
    return two('trig', 'Sudá mocnina. Čím ji nahradíš?', M(INT(s ? '\\sin^2 x' : '\\cos^2 x')), `$\\frac{1 ${s ? '-' : '+'} \\cos 2x}{2}$`, `$\\frac{1 ${s ? '+' : '-'} \\cos 2x}{2}$`,
      `Vzorce pro poloviční úhel: $\\sin^2 x = \\frac{1 - \\cos 2x}{2}$, $\\cos^2 x = \\frac{1 + \\cos 2x}{2}$. Sinus má mínus.`);
  }
  const [f, k] = pick(TRIG);
  return sw('trig', 'Jakou substituci zvolíš?', M(INT(f)), '$t = \\sin x$', '$t = \\cos x$', k === 'c' ? 'right' : 'left',
    k === 'c' ? 'Lichou mocninu má sinus. Jeden $\\sin x$ odděl (půjde do $\\mathrm{d}t$), zbytek převeď na kosiny: $t = \\cos x$.'
      : 'Lichou mocninu má kosinus. Jeden $\\cos x$ odděl (půjde do $\\mathrm{d}t$), zbytek převeď na siny: $t = \\sin x$.');
}
function rootSub() {
  const a = ri(1, 6);
  return Math.random() < 0.5
    ? ch('rootSub', 'Čím nahradíš $\\mathrm{d}x$?', M(`t = \\sqrt{x + ${a}}`),
      opts('$2t\\,\\mathrm{d}t$', [['$\\mathrm{d}t$', `Z $x = t^2 - ${a}$ je $\\mathrm{d}x = 2t\\,\\mathrm{d}t$. Bez $2t$ by výsledek neseděl.`], ['$t\\,\\mathrm{d}t$', 'Derivace $t^2$ je $2t$, dvojka nesmí chybět.'], ['$\\frac{\\mathrm{d}t}{2t}$', 'Naopak: $\\mathrm{d}x = 2t\\,\\mathrm{d}t$.']]),
      `Umocni: $x = t^2 - ${a}$. Derivováním podle $t$: $\\mathrm{d}x = 2t\\,\\mathrm{d}t$.`)
    : ch('rootSub', 'Čemu se rovná $x$?', M(`t = \\sqrt{x + ${a}}`),
      opts(`$t^2 - ${a}$`, [[`$t^2 + ${a}$`, `Z $t^2 = x + ${a}$ se $${a}$ převádí s opačným znaménkem.`], [`$\\sqrt{t} - ${a}$`, 'Odmocnina se ruší umocněním na druhou.'], [`$t - ${a}$`, 'Nejdřív umocni obě strany na druhou.']]),
      `Umocni obě strany: $t^2 = x + ${a}$, tedy $x = t^2 - ${a}$.`);
}

const half = (a, b, p = 0.5) => () => (Math.random() < p ? a() : b());

export const DECK = [
  { id: 'tab', title: 'Tabulka integrálů', after: 'n1l1', weak: 'tableTyped', make: half(G.tableQ, tabTF) },
  { id: 'pow', title: 'Mocnina: o jedna víc a vydělit', after: 'n2l1', weak: 'powerSum', make: powPick },
  { id: 'rules', title: 'Co integrál dovolí a co ne', after: 'n2l2', weak: 'rewrite', make: rules },
  { id: 'linsub', title: 'Lineární vnitřek z hlavy', after: 'n3l1', weak: 'linSub', make: linSub },
  { id: 'check', title: 'Kontrola derivováním', after: 'n3l1', weak: 'linSub', make: check },
  { id: 'subst', title: 'Substituce: co je t a dt', after: 'n4l1', weak: 'subst', make: subst },
  { id: 'parts', title: 'Per partes: co je u', after: 'n5l1', weak: 'byParts', make: parts },
  { id: 'subparts', title: 'Substituce, nebo per partes', after: 'n5l2', weak: 'byParts', make: subOrParts },
  { id: 'partial', title: 'Parciální zlomky: tvar rozkladu', after: 'n6l1', weak: 'partial', make: partial },
  { id: 'trig', title: 'Sinus a kosinus na mocninu', after: 'n7l1', weak: 'trig', make: trig },
  { id: 'rootsub', title: 'Odmocnina do t', after: 'n7l2', weak: 'rootSub', make: rootSub },
  { id: 'method', title: 'Jaká metoda', after: 'n8l1', weak: 'subst', make: G.methodQ },
];
