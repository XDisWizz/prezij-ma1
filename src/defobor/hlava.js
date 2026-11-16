// Balíček „Z hlavy“ pro cestu Definiční obory: rozhodnutí, která jdou udělat bez papíru.
import * as G from './gen.js';
import { unitValue } from './gonio.js';
import { ge, gt, le, lt, between, union, intersectAll, toTex, equal, frac, endpoints, toggleBrackets } from '../intervals.js';
import { numberLine } from '../numberline.js';
import { ri, riNot, pick, shuffle } from '../ui.js';
import { M, sw, tf, yn, two, ch, opts, fixed, fromChoice } from '../zhlavy.js';

const FLIP = { '\\ge': '\\le', '\\le': '\\ge', '>': '<', '<': '>' };

// ---------- intervaly ----------
function bracket() {
  if (Math.random() < 0.25) {
    const a = ri(-5, 5), left = Math.random() < 0.5, ok = Math.random() < 0.5;
    const good = left ? `(-\\infty, ${a}\\rangle` : `\\langle ${a}, +\\infty)`;
    const bad = left ? `\\langle -\\infty, ${a}\\rangle` : `\\langle ${a}, +\\infty\\rangle`;
    return tf('bracket', M(ok ? good : bad), ok,
      ok ? 'U nekonečna je kulatá závorka, u čísla může být špičatá.' : 'U nekonečna je vždycky kulatá závorka. Nekonečno není číslo, takže do intervalu nikdy „nepatří“.',
      'Je ten zápis v pořádku?');
  }
  const a = ri(-6, 6), rel = pick(['\\ge', '>', '\\le', '<']);
  const closed = rel === '\\ge' || rel === '\\le', up = rel === '\\ge' || rel === '>';
  const mk = c => (up ? `${c ? '\\langle' : '('}${a}, +\\infty)` : `(-\\infty, ${a}${c ? '\\rangle' : ')'}`);
  return two('bracket', 'Který interval to je?', M(`x ${rel} ${a}`), `$${mk(closed)}$`, `$${mk(!closed)}$`,
    closed ? `Rovnost je povolená, takže $${a}$ do intervalu patří: špičatá závorka.` : `Ostrá nerovnost, takže $${a}$ do intervalu nepatří: kulatá závorka.`);
}

// ---------- podmínky ----------
function hasCond() {
  const r = pick(G.RULES), g = G.sh(riNot(-6, 6, 0));
  return sw('hasCond', 'Musíš tu hlídat podmínku?', M(r.f(g)), 'Bez podmínky', 'Hlídám', r.has ? 'right' : 'left', r.why);
}

const STRICT = [
  [g => `\\sqrt{${g}}`, false, 'Odmocnina nulu snese: $\\sqrt{0} = 0$. Proto $\\ge$.'],
  [g => `\\sqrt[4]{${g}}`, false, 'Čtvrtá odmocnina je sudá a nulu snese. Proto $\\ge$.'],
  [g => `\\ln(${g})`, true, 'Logaritmus nulu nesnese, potřebuje kladné číslo. Proto ostře $>$.'],
  [g => `\\log_3(${g})`, true, 'Každý logaritmus potřebuje kladné číslo. Proto ostře $>$.'],
  [g => `\\frac{1}{\\sqrt{${g}}}`, true, 'Odmocnina by nulu snesla, ale stojí ve jmenovateli a nulou dělit nejde. Proto ostře $>$.'],
  [g => `\\frac{x}{\\sqrt[4]{${g}}}`, true, 'Sudá odmocnina ve jmenovateli: nesmí být záporná ani nulová. Proto ostře $>$.'],
];
function strict() {
  const [f, st, why] = pick(STRICT), g = G.sh(riNot(-6, 6, 0));
  return two('strict', 'Která podmínka platí?', M(f(g)), `$${g} ${st ? '>' : '\\ge'} 0$`, `$${g} ${st ? '\\ge' : '>'} 0$`, why);
}

function countConds() {
  for (;;) {
    const ps = shuffle([...G.PIECES.keys()]).slice(0, pick([2, 3, 3])).map(i => G.PIECES[i]());
    const conds = ps.filter(p => p.cond).map(p => p.cond);
    if (new Set(conds).size !== conds.length) continue;   // dvě části se stejnou podmínkou by šly počítat dvojím způsobem
    const why = '<ul class="why-list">' + ps.map(p => `<li>${p.cond ? '✓' : '✗'} $${p.tex}$: ${p.why}</li>`).join('') + '</ul>';
    return ch('countConds', 'Kolik podmínek musíš hlídat?', M(ps.map(p => p.tex).join(' + ')), fixed(['0', '1', '2', '3'], String(conds.length)), why);
  }
}

// ---------- lineární a kvadratické ----------
function flip() {
  const a = pick([-1, -2, -3, -4, -5, 2, 3, 4, 5]), q = riNot(-6, 6, 0), b = a * q;
  const rel = pick(['\\ge', '>', '\\le', '<']);
  const right = a < 0 ? FLIP[rel] : rel, ok = Math.random() < 0.5;
  const shown = ok ? right : FLIP[right];
  return tf('flip', M(`${a === -1 ? '-' : a}x ${rel} ${b} \\;\\Rightarrow\\; x ${shown} ${q}`), ok,
    a < 0 ? `Dělíš záporným číslem $${a}$, takže se znaménko nerovnosti otočí: $x ${right} ${q}$.`
      : `Dělíš kladným číslem $${a}$, znaménko nerovnosti zůstává: $x ${right} ${q}$.`);
}

function parab() {
  if (Math.random() < 0.35) return G.parabolaSign();
  const r1 = ri(-5, 3), r2 = ri(r1 + 1, 6), A = pick([1, 1, -1]);
  const rel = pick(['\\ge', '>', '\\le', '<']), pos = rel === '\\ge' || rel === '>';
  const g = G.quad(A, -A * (r1 + r2) || 0, A * r1 * r2 || 0);
  const mid = (A === 1) !== pos;   // otevřená nahoru: kladná vně kořenů, záporná mezi nimi
  const shape = A === 1 ? 'U $x^2$ je plus, parabola je otevřená nahoru: mezi kořeny je pod osou, vně nad osou.'
    : 'U $x^2$ je mínus, parabola je otevřená dolů: mezi kořeny je nad osou, vně pod osou.';
  return sw('parab', `Kořeny jsou $${r1}$ a $${r2}$. Kde to platí?`, M(`${g} ${rel} 0`), 'Vně kořenů', 'Mezi kořeny', mid ? 'right' : 'left',
    `${shape} Hledáš ${pos ? 'kladné' : 'záporné'} hodnoty, tedy ${mid ? 'mezi kořeny' : 'vně kořenů'}.`);
}

// ---------- zlomky ----------
function fracSign() {
  const a = ri(-5, 5), b = riNot(-5, 5, a), x = riNot(-7, 7, a, b);
  const sa = x - a > 0, sb = x - b > 0, pos = sa === sb, s = v => (v ? '+' : '-');
  return sw('fracSign', `Jaké znaménko má zlomek v bodě $x = ${x}$?`, M(`\\frac{${G.sh(a)}}{${G.sh(b)}}`), 'Záporné', 'Kladné', pos ? 'right' : 'left',
    `Čitatel vyjde $${x - a}$, jmenovatel $${x - b}$. Znaménka $\\frac{${s(sa)}}{${s(sb)}}$ dají ${pos ? 'plus' : 'mínus'}.`);
}

function fracEnd() {
  const a = ri(-5, 5), b = riNot(-5, 5, a), kind = pick(['sqrt', 'sqrt', 'ln']), num = Math.random() < 0.5;
  const fr = `\\frac{${G.sh(a)}}{${G.sh(b)}}`;
  const why = !num ? `Pro $x = ${b}$ je nula ve jmenovateli. Ta do definičního oboru nepatří nikdy.`
    : kind === 'sqrt' ? `Pro $x = ${a}$ je zlomek roven nule a $\\sqrt{0}$ je v pořádku. Nulu čitatele pod odmocninou bereš.`
      : `Pro $x = ${a}$ je zlomek roven nule a $\\ln 0$ neexistuje. U logaritmu krajní body nebereš.`;
  return yn('fracEnd', `Patří $x = ${num ? a : b}$ do definičního oboru?`, M(`f(x) = ${kind === 'sqrt' ? `\\sqrt{${fr}}` : `\\ln${fr}`}`), kind === 'sqrt' && num, why);
}

// ---------- absolutní hodnota ----------
function absShape() {
  const c = ri(-4, 4), r = ri(1, 4), rel = pick(['<', '\\le', '>', '\\ge']), inside = rel === '<' || rel === '\\le';
  return sw('absShape', 'Jak vypadá řešení?', M(`|${G.sh(c)}| ${rel} ${r}`), 'Dva kraje osy', 'Jeden interval', inside ? 'right' : 'left',
    `$|${G.sh(c)}|$ je vzdálenost od čísla $${c}$. ` + (inside ? `Malá vzdálenost: jeden interval kolem $${c}$, od $${c - r}$ do $${c + r}$.`
      : `Velká vzdálenost: všechno, co je od $${c}$ dál než $${r}$, tedy pod $${c - r}$ a nad $${c + r}$.`));
}

function absMid() {
  const a = ri(-5, 5);
  let b; do b = ri(-5, 5); while (b === a || (a + b) % 2);
  const mid = (a + b) / 2, rel = pick(['\\ge', '\\le']);
  const side = rel === '\\ge' ? b : a;   // „od a dál než od b“ → x leží na straně b
  const right = side > mid ? `$x \\ge ${mid}$` : `$x \\le ${mid}$`, wrong = side > mid ? `$x \\le ${mid}$` : `$x \\ge ${mid}$`;
  return two('absMid', 'Kde to platí?', M(`|${G.sh(a)}| ${rel} |${G.sh(b)}|`), right, wrong,
    `Porovnáváš vzdálenost od $${a}$ a od $${b}$. Stejné jsou přesně v půlce, v bodě $${mid}$. ${rel === '\\ge' ? `Od $${a}$ má být $x$ dál` : `K $${a}$ má být $x$ blíž`}, takže leží na straně čísla $${side}$.`);
}

// ---------- arcsin, arccos, logaritmus ----------
function arcDom() {
  const a = riNot(-5, 5, 0), name = pick(['\\arcsin', '\\arccos']);
  const iv = (l, r, c = true) => `$${c ? '\\langle' : '('}${l}, ${r}${c ? '\\rangle' : ')'}$`;
  return ch('arcDom', 'Jaký je definiční obor?', M(`f(x) = ${name}(${G.sh(a)})`),
    opts(iv(a - 1, a + 1), [
      [iv(a - 1, a + 1, false), 'Krajní body patří: arcsin i arccos zvládnou přesně $-1$ i $1$.'],
      [iv(-1, 1), 'Mezi $-1$ a $1$ musí být celý vnitřek, ne samotné $x$.'],
      [iv(-a - 1, -a + 1), 'Pozor na znaménko při převádění čísla na druhou stranu.'],
    ]),
    `Vnitřek musí být mezi $-1$ a $1$: $-1 \\le ${G.sh(a)} \\le 1$, tedy $${a - 1} \\le x \\le ${a + 1}$.`);
}

function lnZero() {
  const a = ri(-4, 4), g = G.sh(a);
  return Math.random() < 0.4
    ? two('lnZero', 'Kdy je logaritmus roven nule?', M(`\\ln(${g}) = 0`), `$x = ${a + 1}$`, `$x = ${a}$`, `$\\ln t = 0$ právě pro $t = 1$. Tedy $${g} = 1$, $x = ${a + 1}$.`)
    : two('lnZero', 'Kdy to platí?', M(`\\ln(${g}) \\ge 0`), `$x \\ge ${a + 1}$`, `$x > ${a}$`, `$\\ln t \\ge 0$ právě pro $t \\ge 1$. Tedy $${g} \\ge 1$, $x \\ge ${a + 1}$. Pro $x > ${a}$ je logaritmus jen definovaný.`);
}

// ---------- průnik podmínek ----------
function simpleSet() {
  const a = ri(-5, 2), b = ri(a + 1, 6), c1 = Math.random() < 0.5, c2 = Math.random() < 0.5, A = frac(a), B = frac(b);
  return pick([() => between(A, B, c1, c2), () => (c1 ? ge(A) : gt(A)), () => (c1 ? le(B) : lt(B)), () => union(c1 ? le(A) : lt(A), c2 ? ge(B) : gt(B))])();
}
function interPic() {
  for (;;) {
    const A = simpleSet(), B = simpleSet(), I = intersectAll(A, B);
    if (!I.length || I.length > 2 || equal(I, A) || equal(I, B) || I.some(x => x.a.v === x.b.v)) continue;
    const pts = endpoints(A, B), L = s => `$${toTex(s)}$`;
    return ch('interPic', 'Co platí na obou osách zároveň?', numberLine(A, { extra: pts, label: 'A' }) + numberLine(B, { extra: pts, label: 'B' }),
      opts(L(I), [[L(union(A, B)), 'To je sjednocení: všechno, co je aspoň na jedné ose. Průnik je jen to, co je na obou.'], [L(toggleBrackets(I)), 'Krajní body sedí, závorky ne. Bod patří do průniku, jen když je plný na obou osách.'], L(A), L(B)]),
      'Průnik je jen to, co je obarvené na obou osách najednou.' + numberLine(I, { extra: pts, label: 'A ∩ B' }));
  }
}

// ---------- goniometrie (bez obrázku, jen to, co má sedět v hlavě) ----------
const TRIG_VAL = ['$0$', '$\\frac{1}{2}$', '$\\frac{\\sqrt{2}}{2}$', '$\\frac{\\sqrt{3}}{2}$', '$1$'];
const ANGLES = [['0', 0, 4], ['\\frac{\\pi}{6}', 1, 3], ['\\frac{\\pi}{4}', 2, 2], ['\\frac{\\pi}{3}', 3, 1], ['\\frac{\\pi}{2}', 4, 0]];   // [úhel, index sin, index cos]
function trigValue() {
  const [ang, s, c] = pick(ANGLES), sin = Math.random() < 0.5;
  return ch('trigValue', 'Kolik to je?', M(`${sin ? '\\sin' : '\\cos'}\\,${ang}`), fixed(TRIG_VAL, TRIG_VAL[sin ? s : c]),
    'Pro úhly $0, \\frac{\\pi}{6}, \\frac{\\pi}{4}, \\frac{\\pi}{3}, \\frac{\\pi}{2}$ jde sinus postupně $0, \\frac{1}{2}, \\frac{\\sqrt{2}}{2}, \\frac{\\sqrt{3}}{2}, 1$. Kosinus má stejná čísla v opačném pořadí.');
}
const CIRCLE_OPT = ['nahoře, nad vodorovnou přímkou', 'dole, pod vodorovnou přímkou', 'vpravo od svislé přímky', 'vlevo od svislé přímky'];
function circlePart() {
  const sin = Math.random() < 0.5, gt = Math.random() < 0.5, c = pick(['\\frac{1}{2}', '-\\frac{1}{2}', '\\frac{\\sqrt{2}}{2}', '\\frac{\\sqrt{3}}{2}', '0', '-\\frac{\\sqrt{3}}{2}']);
  const strict = Math.random() < 0.5, rel = gt ? (strict ? '>' : '\\ge') : (strict ? '<' : '\\le');
  return ch('circlePart', 'Kde na jednotkové kružnici leží řešení?', M(`${sin ? '\\sin' : '\\cos'} x ${rel} ${c}`), fixed(CIRCLE_OPT, CIRCLE_OPT[(sin ? 0 : 2) + (gt ? 0 : 1)]),
    sin ? `Sinus je <b>výška</b> bodu na kružnici. Nakresli vodorovnou přímku $y = ${c}$: větší sinus mají body nad ní, menší pod ní.`
      : `Kosinus je <b>vodorovná</b> souřadnice bodu na kružnici. Nakresli svislou přímku $x = ${c}$: větší kosinus mají body vpravo od ní, menší vlevo.`);
}
const TG_DOM = [['\\operatorname{tg} x', 'c'], ['\\operatorname{cotg} x', 's'], ['\\frac{1}{\\sin x}', 's'], ['\\frac{1}{\\cos x}', 'c'], ['\\frac{\\sin x}{\\cos x}', 'c'], ['\\frac{\\cos x}{\\sin x}', 's']];
function tgDom() {
  const [f, k] = pick(TG_DOM);
  return sw('tgDom', 'Která čísla do funkce dosadit nesmíš?', M(`f(x) = ${f}`), '$x = k\\pi$', '$x = \\frac{\\pi}{2} + k\\pi$', k === 'c' ? 'right' : 'left',
    k === 'c' ? `Ve jmenovateli je kosinus${f.includes('tg') ? ' ($\\operatorname{tg} x = \\frac{\\sin x}{\\cos x}$)' : ''}. Kosinus je nula nahoře a dole na kružnici: $x = \\frac{\\pi}{2} + k\\pi$.`
      : `Ve jmenovateli je sinus${f.includes('cotg') ? ' ($\\operatorname{cotg} x = \\frac{\\cos x}{\\sin x}$)' : ''}. Sinus je nula vpravo a vlevo na kružnici: $x = k\\pi$.`);
}
const PERIOD = [
  ['\\sin x > \\frac{1}{2}', '\\left(\\frac{\\pi}{6}, \\frac{5\\pi}{6}\\right)', 2], ['\\cos x \\ge 0', '\\left\\langle -\\frac{\\pi}{2}, \\frac{\\pi}{2}\\right\\rangle', 2],
  ['\\sin x < 0', '(\\pi, 2\\pi)', 2], ['\\cos x < \\frac{1}{2}', '\\left(\\frac{\\pi}{3}, \\frac{5\\pi}{3}\\right)', 2],
  ['\\operatorname{tg} x > 1', '\\left(\\frac{\\pi}{4}, \\frac{\\pi}{2}\\right)', 1], ['\\operatorname{tg} x < 0', '\\left(-\\frac{\\pi}{2}, 0\\right)', 1],
  ['\\operatorname{cotg} x > 0', '\\left(0, \\frac{\\pi}{2}\\right)', 1], ['\\operatorname{tg} x \\ge 0', '\\left\\langle 0, \\frac{\\pi}{2}\\right)', 1],
];
function period() {
  const [ineq, iv, k] = pick(PERIOD);
  return sw('period', 'Jedno kolo řešení máš. Co přičteš, aby to byla všechna?', M(ineq) + M(`x \\in ${iv} + \\;\\boxed{?}`), '$k\\pi$', '$2k\\pi$', k === 2 ? 'right' : 'left',
    'Sinus a kosinus se opakují po celém kole, tedy po $2\\pi$. Tangens a kotangens se opakují už po půlce kola, po $\\pi$.');
}

/** lineární podmínka s celým krajním bodem (zlomky z hlavy zbytečně zdržují) */
function linChoice() {
  let c;
  do c = G.linear(pick(['sqrt', 'ln'])); while (c.answer.some(i => [i.a.v, i.b.v].some(v => Number.isFinite(v) && !Number.isInteger(v))));
  const k = G.asChoice(c);
  return { ...k, explain: c.steps[0] + ' ' + c.steps[c.steps.length - 1] };
}

const half = (a, b, p = 0.5) => () => (Math.random() < p ? a() : b());

export const DECK = [
  { id: 'plug', title: 'Smím dosadit? (zlomek)', after: 'u1l1', weak: 'canPlug', make: () => fromChoice(G.canPlugFrac()) },
  { id: 'plug2', title: 'Smím dosadit? (odmocnina, logaritmus)', after: 'u1l2', weak: 'canPlug', make: () => fromChoice(G.canPlug(pick(['sqrt', 'ln']))) },
  { id: 'belongs', title: 'Patří číslo do intervalu?', after: 'u2l1', weak: 'belongs', make: () => fromChoice(G.belongs()) },
  { id: 'bracket', title: 'Kulatá, nebo špičatá závorka', after: 'u2l1', weak: 'writeLine', make: bracket },
  { id: 'readline', title: 'Čtení osy', after: 'u2l1', weak: 'writeLine', make: G.readLine },
  { id: 'hascond', title: 'Hlídat podmínku, nebo ne?', after: 'u3l1', weak: 'conditionFor', make: hasCond },
  { id: 'cond', title: 'Jakou podmínku funkce dává', after: 'u3l1', weak: 'conditionFor', make: G.conditionFor },
  { id: 'strict', title: 'Ostrá, nebo neostrá nerovnost', after: 'u3l1', weak: 'conditionFor', make: strict },
  { id: 'count', title: 'Kolik podmínek hlídat', after: 'u3l2', weak: 'multiCond', make: countConds },
  { id: 'flip', title: 'Otočí se nerovnost?', after: 'u4l1', weak: 'flipSign', make: flip },
  { id: 'lin', title: 'Lineární podmínka od pohledu', after: 'u4l1', weak: 'linear', make: linChoice },
  { id: 'parab', title: 'Parabola: vně, nebo mezi kořeny', after: 'u5l1', weak: 'quadratic', make: parab },
  { id: 'roots', title: 'Kořeny od pohledu', after: 'u5l1', weak: 'quadratic', make: G.rootsQuad },
  { id: 'fracsign', title: 'Znaménko zlomku', after: 'u6l1', weak: 'rational', make: fracSign },
  { id: 'fracend', title: 'Krajní body u zlomku', after: 'u6l1', weak: 'rational', make: fracEnd },
  { id: 'comden', title: 'Společný jmenovatel', after: 'u6l2', weak: 'ratShift', make: G.commonDen },
  { id: 'abs', title: 'Absolutní hodnota jako vzdálenost', after: 'u7l1', weak: 'absDist', make: half(absShape, G.absMeaning) },
  { id: 'absmid', title: 'Porovnání dvou vzdáleností', after: 'u7l2', weak: 'absCompare', make: absMid },
  { id: 'arc', title: 'arcsin a arccos: jen od −1 do 1', after: 'u8l1', weak: 'arcLin', make: arcDom },
  { id: 'lnexp', title: 'Logaritmus: nula a odlogaritmování', after: 'u9l1', weak: 'logInside', make: half(lnZero, G.lnExp) },
  { id: 'unit', title: 'Hodnoty sinu a kosinu', after: 'ugl1', weak: 'unitValue', make: half(trigValue, unitValue, 0.7) },
  { id: 'circle', title: 'Nerovnice na kružnici: která část', after: 'ugl2', weak: 'trigIneq', make: circlePart },
  { id: 'tg', title: 'Tangens, kotangens a jmenovatel', after: 'ugl3', weak: 'tgCond', make: tgDom },
  { id: 'period', title: 'Perioda: kπ, nebo 2kπ', after: 'ugl3', weak: 'trigIneq', make: period },
  { id: 'inter', title: 'Průnik podmínek', after: 'u10l1', weak: 'combo', make: interPic },
];
