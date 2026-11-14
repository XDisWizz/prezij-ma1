// Generátory příkladů pro cestu "Limity posloupností a funkcí".
// Odpověď limity: { num: AST } | { inf: ±1 } | { dne: true }
import * as S from '../sym.js';
import { ri, riNot, pick, shuffle } from '../ui.js';

const { N, X, E, PI, add, mul, div, pow, neg, sub, fn, root, ln } = S;
const P = S.parse;
const simp = S.simplify;
const D = e => simp(S.d(e));
const T = e => S.tex(e);
const Tn = e => T(e).replace(/x/g, 'n');
const LIMn = body => `\\lim_{n \\to \\infty} ${body}`;
const LIMx = (c, body) => `\\lim_{x \\to ${c}} ${body}`;
const NUM = v => ({ num: simp(typeof v === 'number' ? N(v) : v) });
const FR = (p, q) => { if (q < 0) { p = -p; q = -q; } const g = gcd(p, q); return NUM(div(N(p / g), N(q / g))); };
const INF = s => ({ inf: s > 0 ? 1 : -1 });
const DNE = { dne: true };
const ansTex = a => (a.dne ? '\\text{neexistuje}' : a.inf ? (a.inf > 0 ? '+\\infty' : '-\\infty') : T(a.num));
const card = o => ({ type: 'limit', prompt: 'Spočítej limitu', label: '$=$', ...o });
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
// ---- sazba bez „+ -3“, „1n“, „n^1“, „5/1“ ----
/** znaménko a absolutní hodnota: „+ 3“, „- 3“ */
const pm = v => `${v < 0 ? '-' : '+'} ${Math.abs(v)}`;
/** koeficient před proměnnou: 1 → '', -1 → '-', jinak číslo */
const co = v => (v === 1 ? '' : v === -1 ? '-' : String(v));
/** c·n jako další sčítanec: „+ 3n“, „- n“ */
const pmN = (v, t = 'n') => `${v < 0 ? '-' : '+'} ${Math.abs(v) === 1 ? '' : Math.abs(v)}${t}`;
/** mocnina: n^1 → n */
const pw = (b, k) => (k === 1 ? b : `${b}^{${k}}`);
/** zlomek p/q, se jmenovatelem 1 jen číslo */
const fr = (p, q) => (q === 1 ? String(p) : q === -1 ? String(-p) : `\\frac{${p}}{${q}}`);

// =====================================================================
// Základy
// =====================================================================
const BASIC = [
  ['\\frac{1}{n}', NUM(0), 'Čím větší $n$, tím menší zlomek. Blíží se nule.'],
  ['n^2', INF(1), 'Roste nade všechny meze.'],
  ['5 + \\frac{1}{n}', NUM(5), '$\\frac{1}{n} \\to 0$, zbyde $5$.'],
  ['(-1)^n', DNE, 'Skáče pořád mezi $-1$ a $1$, nikam se neblíží.'],
  ['-n^3', INF(-1), 'Záporné a pořád větší: $-\\infty$.'],
  ['\\frac{3}{n^2}', NUM(0), 'Číslo lomeno něčím obrovským → 0.'],
  ['2 - \\frac{1}{\\sqrt{n}}', NUM(2), '$\\frac{1}{\\sqrt{n}} \\to 0$, zbyde $2$.'],
  ['\\sqrt{n}', INF(1), 'Roste pomalu, ale nade všechny meze.'],
  ['\\left(\\frac{1}{2}\\right)^n', NUM(0), 'Půlka z půlky z půlky… → 0.'],
  ['2^n', INF(1), 'Zdvojnásobuje se: $+\\infty$.'],
  ['\\frac{(-1)^n}{n}', NUM(0), 'Skáče, ale čím dál blíž k nule.'],
  ['7 - n', INF(-1), 'Pořád menší a menší: $-\\infty$.'],
];
export function basicSeq() {
  const [t, a, why] = pick(BASIC);
  return card({ key: 'basicSeq', fn: LIMn(t), answer: a, steps: [why, `Limita: $${ansTex(a)}$`], hint: 'Dosaď si obrovské n, třeba milion. Kam se to blíží?' });
}

const ARITH = [
  ['\\infty + 5', 'p', '$+\\infty$ plus číslo je pořád $+\\infty$.'], ['\\frac{5}{\\infty}', '0', 'Číslo lomeno obrovským → 0.'],
  ['\\infty \\cdot \\infty', 'p', 'Obrovské krát obrovské je obrovské.'], ['(-3) \\cdot \\infty', 'm', 'Záporné číslo krát $\\infty$ je $-\\infty$.'],
  ['\\infty - \\infty', '?', 'Kdo vyhraje? Nevíme. Je to <b>neurčitý výraz</b>, musí se upravit.'], ['0 \\cdot \\infty', '?', 'Nula tlačí dolů, nekonečno nahoru. <b>Neurčitý výraz</b>.'],
  ['\\frac{\\infty}{\\infty}', '?', 'Záleží, kdo roste rychleji. <b>Neurčitý výraz</b>.'], ['\\frac{0}{0}', '?', '<b>Neurčitý výraz</b>, musí se upravit (třeba L\'Hospital).'],
  ['\\frac{1}{0^+}', 'p', 'Jedna lomeno kladným skoro nic → $+\\infty$.'], ['\\infty^2', 'p', '$+\\infty$.'], ['\\frac{-2}{0^+}', 'm', 'Záporné číslo lomeno kladným skoro nic → $-\\infty$.'],
  ['1^\\infty', '?', 'Pozor, past! Tohle <b>není</b> 1, je to neurčitý výraz (vede na $\\mathrm{e}$).'], ['\\infty + \\infty', 'p', 'Obrovské plus obrovské je obrovské.'],
];
const AOPT = { p: '$+\\infty$', m: '$-\\infty$', 0: '$0$', '?': 'neurčitý výraz' };
export function infArith() {
  const [t, k, why] = pick(ARITH);
  return { type: 'choice', key: 'infArith', prompt: `Kolik je $${t}$?`, options: shuffle(Object.entries(AOPT).map(([kk, l]) => ({ label: l, correct: kk === k, why }))), explain: why };
}

// =====================================================================
// Polynom / polynom
// =====================================================================
function polyAst(deg, lead, extra) {
  const terms = [{ c: lead, e: deg }];
  while (terms.length < extra + 1) { const e = ri(0, deg - 1); if (!terms.some(t => t.e === e)) terms.push({ c: riNot(-9, 9, 0), e }); if (deg === 1 && terms.length >= 2) break; }
  return shuffle(terms).map(t => simp(t.e === 0 ? N(t.c) : mul(N(t.c), pow(X, N(t.e)))));
}
export function ratPoly() {
  const p = ri(1, 4), q = ri(1, 4);
  const a = riNot(-6, 9, 0), b = riNot(-5, 7, 0);
  const num = polyAst(p, a, ri(1, Math.min(3, p))), den = polyAst(q, b, ri(1, Math.min(3, q)));
  const ans = p < q ? NUM(0) : p === q ? FR(a, b) : INF(a / b);
  const nT = Tn(num.length > 1 ? add(...num) : num[0]), dT = Tn(den.length > 1 ? add(...den) : den[0]);
  const steps = [`Nejvyšší mocnina v čitateli je $${pw('n', p)}$ (u ní $${a}$), ve jmenovateli $${pw('n', q)}$ (u ní $${b}$).`,
    p === q ? `Stejné stupně: limita je poměr čísel u nejvyšších mocnin: $${a}$ lomeno $${b}$.` : p < q ? 'Jmenovatel roste rychleji, takže limita je $0$.' : `Čitatel roste rychleji, takže limita je nekonečná. Čísla u nejvyšších mocnin ($${a}$ a $${b}$) mají ${a / b > 0 ? 'stejné znaménko, takže $+\\infty$' : 'opačná znaménka, takže $-\\infty$'}.`,
    `Limita: $${ansTex(ans)}$`];
  return card({ key: 'ratPoly', fn: LIMn(`\\frac{${nT}}{${dT}}`), answer: ans, steps, hint: 'Najdi nejvyšší mocninu nahoře a dole.', p, q, a, b,
    evalN: n => S.ev(add(...num), n) / S.ev(add(...den), n) });
}

// =====================================================================
// Odmocniny
// =====================================================================
export function rootRatio() {
  if (Math.random() < 0.5) {
    const a = pick([1, 4, 9, 16, 2, 3, 5]), b = riNot(-4, 4, 0), c = ri(1, 9), d = ri(1, 5), e = riNot(-9, 9, 0);
    const ans = NUM(div(add(root(2, N(a)), N(b)), N(d)));
    return card({
      key: 'rootRatio', fn: LIMn(`\\frac{\\sqrt{${a === 1 ? '' : a}n^2 + ${c}} ${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}n}{${d === 1 ? '' : d}n ${e < 0 ? '-' : '+'} ${Math.abs(e)}}`),
      answer: ans, hint: 'Vyděl všechno n. Pod odmocninou je to dělení n².', rr: { top: simp(add(root(2, N(a)), N(b))), bot: N(d), pw: 1 },
      steps: [`Nejvyšší mocnina je $n$ (i $\\sqrt{n^2} = n$). Vyděl čitatel i jmenovatel $n$.`, `$\\frac{\\sqrt{${a} + \\frac{${c}}{n^2}} ${b < 0 ? '-' : '+'} ${Math.abs(b)}}{${d} ${e < 0 ? '-' : '+'} \\frac{${Math.abs(e)}}{n}} \\to \\frac{\\sqrt{${a}} ${b < 0 ? '-' : '+'} ${Math.abs(b)}}{${d}}$`, `Limita: $${ansTex(ans)}$`],
    });
  }
  const a = pick([2, 3, 5, 7, 4, 9]), c = ri(1, 9), b = ri(1, 5), d = ri(10, 90), e = ri(2, 9);
  const ans = NUM(div(root(2, N(a)), N(e)));
  return card({
    key: 'rootRatio', fn: LIMn(`\\frac{\\sqrt{${a}n^3 + ${c}} - ${b === 1 ? '' : b}n}{${d} + ${e}n\\sqrt{n}}`), answer: ans, hint: 'Nejvyšší mocnina je n√n = n^{3/2}.', rr: { top: simp(root(2, N(a))), bot: N(e), pw: 1.5 },
    steps: ['Nejvyšší mocnina: $\\sqrt{n^3} = n\\sqrt{n} = n^{3/2}$. Člen $n$ je slabší.', `Vyděl vše $n\\sqrt{n}$: $\\frac{\\sqrt{${a} + \\frac{${c}}{n^3}} - \\frac{${b}}{\\sqrt{n}}}{\\frac{${d}}{n\\sqrt{n}} + ${e}} \\to \\frac{\\sqrt{${a}}}{${e}}$`, `Limita: $${ansTex(ans)}$`],
  });
}

// =====================================================================
// Rozdíl odmocnin (∞ − ∞): sdružený výraz
// =====================================================================
const sq = (a, b, c) => { let s = `${a === 1 ? '' : a}n^2`; if (b) s += ` ${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}n`; if (c) s += ` ${c < 0 ? '-' : '+'} ${Math.abs(c)}`; return `\\sqrt{${s}}`; };
export function conj() {
  const k = pick(['A', 'B', 'C', 'D']);
  let fnT, ans, steps, cj = null;
  if (k === 'A') {
    const b = riNot(-8, 8, 0), c = ri(-5, 9);
    fnT = `${sq(1, b, c)} - n`; ans = FR(b, 2); cj = { top: N(b), bot: N(2) };
    const tail = c ? ` ${pm(c)}` : '';
    steps = [`Typ $\\infty - \\infty$. Rozšiř sdruženým výrazem $${sq(1, b, c)} + n$.`, `Nahoře vyjde $(n^2 ${pmN(b)}${tail}) - n^2 = ${co(b)}n${tail}$.`, `Dole je to zhruba $n + n = 2n$, takže limita je $\\frac{${b}}{2}$.`];
  } else if (k === 'B') {
    const a = pick([1, 4, 9]), b = riNot(-8, 8, 0), d = riNot(-8, 8, b);
    fnT = `${sq(a, b, 0)} - ${sq(a, d, 0)}`; ans = NUM(div(N(b - d), N(2 * Math.sqrt(a)))); cj = { top: N(b - d), bot: N(2 * Math.sqrt(a)) };
    const an2 = `${co(a)}n^2`, ra = Math.sqrt(a);
    steps = ['Typ $\\infty - \\infty$. Rozšiř sdruženým výrazem (součtem obou odmocnin).', `Nahoře: $(${an2} ${pmN(b)}) - (${d ? `${an2} ${pmN(d)}` : an2}) = ${co(b - d)}n$.`, `Dole: $\\sqrt{${an2}} + \\sqrt{${an2}} = ${co(ra)}n + ${co(ra)}n = ${2 * ra}n$, takže limita je $\\frac{${b - d}}{${2 * ra}}$.`];
  } else if (k === 'C') {
    const a = pick([1, 2, 3, 4, 5, 9]), p = ri(1, 9), q = -ri(1, 9);
    fnT = `n\\left(${sq(a, 0, p)} - ${sq(a, 0, q)}\\right)`; ans = NUM(div(N(p - q), mul(N(2), root(2, N(a))))); cj = { top: N(p - q), bot: simp(mul(N(2), root(2, N(a)))) };
    steps = ['Typ $\\infty \\cdot 0$ (závorka je $\\infty - \\infty$). Rozšiř závorku sdruženým výrazem.', `Nahoře: $n\\,((${co(a)}n^2 + ${p}) - (${co(a)}n^2 ${pm(q)})) = ${p - q}n$.`, `Dole: $\\sqrt{${a}}n + \\sqrt{${a}}n = 2\\sqrt{${a}}\\,n$, takže limita je $\\frac{${p - q}}{2\\sqrt{${a}}}$.`];
  } else {
    const a = ri(1, 9), b = riNot(1, 9, a), c = ri(1, 9), d = ri(1, 9);
    fnT = `${sq(a, 0, c)} - ${sq(b, 1, d)}`; ans = INF(Math.sqrt(a) - Math.sqrt(b));
    steps = [`Nejvyšší členy: $\\sqrt{${a}}\\,n$ a $\\sqrt{${b}}\\,n$. Jsou různé, takže nic se neodečte.`, `$n(\\sqrt{${a}} - \\sqrt{${b}})$, a závorka je ${a > b ? 'kladná' : 'záporná'}.`];
  }
  steps.push(`Limita: $${ansTex(ans)}$`);
  return card({ key: 'conj', fn: LIMn(k === 'C' ? fnT : `\\left(${fnT}\\right)`), answer: ans, steps, hint: 'Rozdíl odmocnin → vynásob a vyděl jejich součtem.', conjKind: k, cj });
}

// =====================================================================
// Exponenciály
// =====================================================================
export function expoRatio() {
  for (;;) {
    const pool = [{ b: 2 }, { b: 3 }, { b: 4 }, { b: 5 }, { b: 9, b0: 3 }, { b: 4, b0: 2 }];
    const mk = () => { const t = pick(pool); const s = ri(0, 2); const c = pick([1, 1, 1, 2, 3, -1, -1, 5]); return { ...t, s, c, val: c * Math.pow(t.b0 || t.b, s) }; };
    const numT = [mk(), mk()], denT = [mk(), mk(), ...(Math.random() < 0.4 ? [mk()] : [])];
    const all = [...numT, ...denT];
    if (new Set(numT.map(t => t.b)).size < numT.length || new Set(denT.map(t => t.b)).size < denT.length) continue;
    const M = Math.max(...all.map(t => t.b));
    const cn = numT.filter(t => t.b === M).reduce((s, t) => s + t.val, 0), cd = denT.filter(t => t.b === M).reduce((s, t) => s + t.val, 0);
    const Mden = Math.max(...denT.map(t => t.b)), lead = denT.filter(t => t.b === Mden).reduce((s, t) => s + t.val, 0);
    if (!lead) continue;
    const ans = cn && cd ? FR(cn, cd) : cn ? INF(cn * lead) : NUM(0);
    const tt = (t, i) => {
      const sign = t.c < 0 ? '-' : i ? '+' : '';
      const c = Math.abs(t.c) === 1 ? '' : `${Math.abs(t.c)} \\cdot `;
      const ex = t.b0 ? `2n${t.s ? '+' + 2 * t.s : ''}` : `n${t.s ? '+' + t.s : ''}`;
      return `${sign} ${c}${t.b0 || t.b}^{${ex}}`;
    };
    // pro 2n+2s: (b0)^(2n+2s) = b^n · b0^(2s) → uprav hodnotu
    for (const t of all) if (t.b0) t.val = t.c * Math.pow(t.b0, 2 * t.s);
    const cn2 = numT.filter(t => t.b === M).reduce((s, t) => s + t.val, 0), cd2 = denT.filter(t => t.b === M).reduce((s, t) => s + t.val, 0);
    const lead2 = denT.filter(t => t.b === Mden).reduce((s, t) => s + t.val, 0);
    if (!lead2) continue;
    const ans2 = cn2 && cd2 ? FR(cn2, cd2) : cn2 ? INF(cn2 * lead2) : NUM(0);
    const hidden = all.some(t => t.b0 && t.b === M);
    return card({
      key: 'expoRatio', fn: LIMn(`\\frac{${numT.map(tt).join(' ')}}{${denT.map(tt).join(' ')}}`), answer: ans2,
      evalN: n => { const v = t => t.c * (t.b0 ? Math.pow(t.b0, 2 * n + 2 * t.s) : Math.pow(t.b, n + t.s)); return numT.reduce((s, t) => s + v(t), 0) / denT.reduce((s, t) => s + v(t), 0); },
      hint: 'Najdi největší základ. Pozor, 3^{2n} = 9^n.', expo: { M, cn: cn2, cd: cd2, bases: [...new Set(all.map(t => t.b))] },
      steps: [`Největší základ je $${M}^n$${hidden ? ` (pozor: $${M === 9 ? '3^{2n} = 9^n' : '2^{2n} = 4^n'}$)` : ''}. Vyděl čitatel i jmenovatel $${M}^n$, ostatní členy jdou k nule.`,
        `Zbude ${cn2 ? `nahoře $${cn2}$` : 'nahoře $0$'} a ${cd2 ? `dole $${cd2}$` : 'dole $0$'}.`, `Limita: $${ansTex(ans2)}$`],
    });
  }
}

// =====================================================================
// Speciální: rychlost růstu, sevření, číslo e, n-tá odmocnina
// =====================================================================
const HIER = ['\\ln n', '\\sqrt{n}', 'n', 'n^2', 'n^5', '2^n', '3^n', 'n!', 'n^n'];
export function growth() {
  const i = ri(0, HIER.length - 2), j = ri(i + 1, HIER.length - 1);
  const up = Math.random() < 0.5;
  const [A, B] = up ? [HIER[j], HIER[i]] : [HIER[i], HIER[j]];
  const why = `Pořadí rychlosti: $${HIER.join(' \\ll ')}$. ${up ? `Nahoře je rychlejší $${A}$` : `Dole je rychlejší $${B}$`}.`;
  const opts = [['$+\\infty$', up], ['$0$', !up], ['$1$', false], ['neexistuje', false]];
  return { type: 'choice', key: 'growth', prompt: `Kolik je $${LIMn(`\\frac{${A}}{${B}}`)}$?`, options: shuffle(opts.map(([l, c]) => ({ label: l, correct: c, why }))), explain: why };
}

const BOUNDED = () => {
  const g = pick(['n', 'n^2', 'n!', `${ri(2, 7)}n + ${ri(1, 9)}`, `n^3 - ${ri(2, 5)}^n`, '\\sqrt{n}', `${ri(2, 9)}^n`]);
  return pick([`\\sin(${g})`, `\\cos(${g})`, `\\sin^2(${g})`, '(-1)^n']);
};
const GROW = () => pick(['n', 'n^2', 'n^3', '\\sqrt{n}', '\\ln n', `${ri(2, 5)}n + ${ri(1, 9)}`, '2^n']);
export function squeeze() {
  const k = pick(['A', 'A', 'B', 'C', 'D']);
  let t, a, why;
  if (k === 'A') {
    const s = BOUNDED(), c = pick(['', '', `${ri(2, 5)}`, `${ri(2, 5)} + `]);
    t = `\\frac{${c}${s}}{${GROW()}}`; a = NUM(0);
    why = `Čitatel je <b>omezený</b> (${s.startsWith('(-1)') ? '$(-1)^n$ je jen $\\pm 1$' : 'sinus i kosinus jsou mezi $-1$ a $1$'}), jmenovatel roste do nekonečna. Omezené lomeno nekonečnem → $0$.`;
  } else if (k === 'B') {
    const p = ri(1, 6), q = riNot(1, 6, p), r = ri(1, 9), s = BOUNDED().replace('(-1)^n', '\\sin n');
    t = `\\frac{${co(p)}n + ${co(r)}${s}}{${co(q)}n}`; a = FR(p, q);
    why = `Rozděl: $${fr(p, q)} + \\frac{${co(r)}${s}}{${co(q)}n}$. Druhý zlomek je omezené lomeno nekonečnem → $0$. Zbude $${ansTex(a)}$.`;
  } else if (k === 'C') {
    const p = ri(1, 5), q = ri(1, 5), r = ri(1, 9);
    t = `(-1)^n \\frac{${co(p)}n}{${co(q)}n + ${r}}`; a = DNE;
    why = `Zlomek jde k $${ansTex(FR(p, q))} \\ne 0$, a $(-1)^n$ ho pořád přepíná mezi $+$ a $-$. Skáče mezi dvěma hodnotami, limita neexistuje.`;
  } else {
    const kk = ri(1, 3);
    t = `(-1)^n n${kk === 1 ? '' : '^' + kk}`; a = DNE;
    why = 'Střídá znaménko a roste: skáče mezi obrovskými kladnými a zápornými čísly. Neexistuje.';
  }
  return card({ key: 'squeeze', fn: LIMn(t), answer: a, steps: [why, `Limita: $${ansTex(a)}$`], hint: 'Omezené × něco, co jde k nule → 0. Když (−1)^n přepíná mezi dvěma různými hodnotami → neexistuje.' });
}

/** e^v vysázené: e^0 = 1, e^1 = e */
const eT = v => (v === 0 ? '1' : v === 1 ? '\\mathrm{e}' : `\\mathrm{e}^{${S.fmtNum(v)}}`);
export function eLimit() {
  const k = pick(['A', 'B', 'C']);
  let t, val, steps;
  if (k === 'A') {
    const a = riNot(-4, 5, 0), b = pick([1, 1, 2, 3]);
    t = `\\left(1 ${a < 0 ? '-' : '+'} \\frac{${Math.abs(a)}}{n}\\right)^{${b === 1 ? '' : b}n}`; val = a * b;
    const base = `\\left(1 ${pm(a)}/n\\right)`.replace(/(\d+)\/n/, '\\frac{$1}{n}');
    steps = ['Typ $1^\\infty$. Vzorec: $\\left(1 + \\frac{a}{n}\\right)^n \\to \\mathrm{e}^a$, tady $a = ' + a + '$.', b === 1 ? `Takže $${base}^n \\to ${eT(a)}$.` : `Tady $\\left(${base}^n\\right)^{${b}} \\to \\left(${eT(a)}\\right)^{${b}} = ${eT(a * b)}$.`];
  } else if (k === 'B') {
    const a = ri(-4, 5), b = riNot(-4, 5, a);
    const np = v => (v ? `n ${pm(v)}` : 'n');
    t = `\\left(\\frac{${np(a)}}{${np(b)}}\\right)^{n}`; val = a - b;
    steps = ['Typ $1^\\infty$.', `$\\frac{${np(a)}}{${np(b)}} = 1 ${a - b < 0 ? '-' : '+'} \\frac{${Math.abs(a - b)}}{${np(b)}}$, a to jde jako $\\left(1 ${a - b < 0 ? '-' : '+'} \\frac{${Math.abs(a - b)}}{n}\\right)^n \\to ${eT(a - b)}$.`];
  } else {
    const c = ri(2, 5), a = riNot(-3, 4, 0);
    t = `\\left(\\frac{${c}n ${pm(a)}}{${c}n}\\right)^n`;
    val = a / c;
    steps = ['Typ $1^\\infty$.', `$\\frac{${c}n ${pm(a)}}{${c}n} = 1 ${a < 0 ? '-' : '+'} \\frac{${Math.abs(a)}}{${c}n}$, tedy $a = ${S.fmtNum(a / c)}$ a limita je $${eT(a / c)}$.`];
  }
  const ans = NUM(val === 0 ? N(1) : val === 1 ? E : pow(E, N(val)));
  steps.push(`Limita: $${ansTex(ans)}$`);
  return card({ key: 'eLimit', fn: LIMn(t), answer: ans, steps, hint: '(1 + a/n)^n → e^a. Do políčka můžeš psát e^2 nebo e^(1/3).', eA: simp(N(val)), eKind: k });
}

export function nthRoot() {
  if (Math.random() < 0.5) {
    const a = ri(1, 5), k = ri(2, 4), b = ri(1, 9);
    return card({ key: 'nthRoot', fn: LIMn(`\\sqrt[n]{${a === 1 ? '' : a}n^{${k}} + ${b}}`), answer: NUM(1), steps: ['$\\sqrt[n]{n} \\to 1$ a $\\sqrt[n]{\\text{číslo}} \\to 1$.', 'Takže $\\sqrt[n]{\\text{polynom}} \\to 1$.'], hint: 'n-tá odmocnina z polynomu → 1.' });
  }
  const a = ri(2, 5), b = riNot(2, 7, a);
  return card({ key: 'nthRoot', fn: LIMn(`\\sqrt[n]{${a}^n + ${b}^n}`), answer: NUM(Math.max(a, b)), steps: [`Vytkni největší: $\\sqrt[n]{${Math.max(a, b)}^n(1 + \\dots)} = ${Math.max(a, b)}\\sqrt[n]{1 + \\dots} \\to ${Math.max(a, b)}$.`], hint: 'Vyhraje největší základ.' });
}

// =====================================================================
// Limity funkcí
// =====================================================================
export function plugIn() {
  for (;;) {
    const c = ri(-3, 3);
    const k = pick([5, 7, 16]);
    const [f, exact] = pick([() => [P(`x^2 ${pick(['+', '-'])} ${ri(1, 5)}x + ${ri(1, 9)}`)], () => [P(`(x^2 + ${ri(1, 5)})/(x + ${ri(4, 7)})`)], () => [P(`${ri(2, 5)}x^3 - x + ${ri(1, 4)}`)],
      // odmocnina: výsledek necháme přesně (√6), ne jako desetinné číslo
      () => [P(`√(x^2 + ${k})`), root(2, N(c * c + k))]])();
    const v = S.ev(f, c);
    if (!Number.isFinite(v)) continue;
    const ans = NUM(exact || N(v));
    return card({ key: 'plugIn', fn: LIMx(c, f.t === 'add' ? `\\left(${T(f)}\\right)` : T(f)), answer: ans, steps: [`Funkce je v bodě $${c}$ v pohodě, stačí <b>dosadit</b> $x = ${c}$.`, `Limita: $${ansTex(ans)}$`], hint: 'Nejdřív vždycky zkus dosadit.' });
  }
}

/** L'Hospital: polynom / polynom, typ 0/0 */
export function lhopPoly() {
  const r = ri(-3, 3), s = riNot(-4, 4, r), t = riNot(-4, 4, r, s);   // s ≠ t, jinak by čitatel = jmenovatel
  const nume = P(`x^2 ${-(r + s) < 0 ? '-' : '+'} ${Math.abs(r + s)}x ${r * s < 0 ? '-' : '+'} ${Math.abs(r * s)}`);
  const deno = P(`x^2 ${-(r + t) < 0 ? '-' : '+'} ${Math.abs(r + t)}x ${r * t < 0 ? '-' : '+'} ${Math.abs(r * t)}`);
  const ans = FR(r - s, r - t);
  const N1 = simp(nume), D1 = simp(deno), dN = D(nume), dD = D(deno);
  const lf = v => (v === 0 ? 'x' : `(x ${v < 0 ? '+' : '-'} ${Math.abs(v)})`);
  return lhopCard('lhopPoly', r, N1, D1, ans, [
    `Dosaď $x = ${r}$: nahoře i dole vyjde $0$. Typ $\\frac{0}{0}$, takže L'Hospital.`,
    `Zderivuj čitatel a jmenovatel <b>každý zvlášť</b> (není to derivace podílu): $(${T(N1)})' = ${T(dN)}$, $\\;(${T(D1)})' = ${T(dD)}$.`,
    `Do $\\frac{${T(dN)}}{${T(dD)}}$ dosaď $x = ${r}$: $\\frac{${numT(S.ev(dN, r))}}{${numT(S.ev(dD, r))}} = ${ansTex(ans)}$.`,
    `Jde to i bez derivací: rozlož a zkrať, $\\frac{${lf(r)}${lf(s)}}{${lf(r)}${lf(t)}} = \\frac{${lf(s).replace(/^\(|\)$/g, '')}}{${lf(t).replace(/^\(|\)$/g, '')}}$, a dosaď.`,
  ]);
}
/** hodnota po dosazení jako číslo/zlomek (−0 → 0) */
const numT = v => S.fmtNum(Math.abs(v) < 1e-9 ? 0 : Math.round(v * 1e9) / 1e9);
const STD = [
  (a, b) => [`sin(${a}x)`, `${b}x`, FR(a, b)], (a, b) => [`tg(${a}x)`, `${b}x`, FR(a, b)], (a, b) => [`e^(${a}x) - 1`, `${b}x`, FR(a, b)],
  (a, b) => [`ln(1 + ${a}x)`, `${b}x`, FR(a, b)], (a, b) => [`sin(${a}x)`, `sin(${b}x)`, FR(a, b)], (a, b) => [`e^(${a}x) - e^(${b}x)`, 'x', NUM(a - b)],
  (a, b) => [`arctg(${a}x)`, `${b}x`, FR(a, b)], (a) => [`1 - cos(${a}x)`, 'x^2', FR(a * a, 2), true],
];
export function lhopStd() {
  const a = ri(2, 5), b = riNot(1, 5, a);
  const [nT, dT, ans, twice] = pick(STD)(a, b);
  const nume = simp(P(nT)), deno = simp(P(dT));
  const dN = D(nume), dD = D(deno);
  const steps = [
    'Dosaď $x = 0$: nahoře i dole vyjde $0$. Typ $\\frac{0}{0}$, takže L\'Hospital.',
    `Zderivuj čitatel a jmenovatel <b>každý zvlášť</b>: $(${T(nume)})' = ${T(dN)}$, $\\;(${T(deno)})' = ${T(dD)}$.`,
  ];
  if (twice) {
    const d2N = D(dN), d2D = D(dD);
    steps.push(`$\\frac{${T(dN)}}{${T(dD)}}$ je v nule pořád $\\frac{0}{0}$, takže <b>ještě jednou</b>: $(${T(dN)})' = ${T(d2N)}$, $\\;(${T(dD)})' = ${T(d2D)}$.`);
    steps.push(`Dosaď $x = 0$: nahoře $${numT(S.ev(d2N, 0))}$, dole $${numT(S.ev(d2D, 0))}$. Limita je $${ansTex(ans)}$.`);
  } else {
    steps.push(`Dosaď $x = 0$: nahoře $${numT(S.ev(dN, 0))}$, dole $${numT(S.ev(dD, 0))}$. Limita je $${ansTex(ans)}$.`);
  }
  steps.push('<span class="muted">Hodnoty v nule: $\\sin 0 = 0$, $\\cos 0 = 1$, $\\mathrm{e}^0 = 1$, $\\operatorname{tg} 0 = 0$.</span>');
  return lhopCard('lhopStd', 0, nume, deno, ans, steps, twice);
}
function lhopCard(key, c, nume, deno, ans, steps, twice) {
  return card({
    key, fn: LIMx(c, `\\frac{${T(nume)}}{${T(deno)}}`), answer: ans, steps,
    hint: "0/0 → zderivuj čitatel i jmenovatel zvlášť (L'Hospital).", lh: { nume, deno, twice, c, type: '0/0' },
  });
}

/** x → +∞ */
// [čitatel, jmenovatel, odpověď, vysvětlení, jde jedním L'Hospitalem?]
const INFR = [
  () => { const a = ri(1, 5), k = ri(1, 3); return [`ln(${a}x)`, `x^${k}`, NUM(0), 'Logaritmus roste pomaleji než jakákoli mocnina.', true]; },
  () => { const k = ri(1, 4), a = ri(1, 3); return [`x^${k}`, `e^(${a}x)`, NUM(0), 'Exponenciála roste rychleji než jakákoli mocnina.', k === 1,
    [`Typ $\\frac{\\infty}{\\infty}$. L'Hospital jde použít ${k}× za sebou: každým krokem se mocnina nahoře sníží o jedna, exponenciála dole zůstane (jen před ni přibude číslo).`, 'Nakonec je nahoře jen číslo a dole pořád exponenciála, která roste do nekonečna. Číslo lomeno nekonečnem je $0$.']]; },
  () => { const a = ri(1, 3), k = ri(1, 4); return [`e^(${a}x)`, `x^${k}`, INF(1), 'Exponenciála nahoře převálcuje mocninu.', k === 1,
    [`Typ $\\frac{\\infty}{\\infty}$. L'Hospital jde použít ${k}× za sebou: mocnina dole se každým krokem sníží o jedna, exponenciála nahoře zůstane.`, 'Nakonec je dole jen číslo a nahoře exponenciála, která roste do nekonečna: $+\\infty$.']]; },
  () => { const k = ri(1, 3); return [`x^${k}`, 'ln x', INF(1), 'Mocnina nahoře převálcuje logaritmus.', true]; },
  () => [`ln(x)^2`, 'x', NUM(0), 'I druhá mocnina logaritmu prohraje s $x$.', false,
    ["Typ $\\frac{\\infty}{\\infty}$. L'Hospital: $(\\ln^2 x)' = 2\\ln x \\cdot \\frac{1}{x}$ (řetízek), $(x)' = 1$. Vyjde $\\frac{2\\ln x}{x}$, pořád $\\frac{\\infty}{\\infty}$.", "Ještě jednou: $(2\\ln x)' = \\frac{2}{x}$, $(x)' = 1$. Vyjde $\\frac{2}{x} \\to 0$."]],
  () => [`√x`, 'ln x', INF(1), '$\\sqrt{x}$ je pořád mocnina, takže vyhraje nad logaritmem.', true],
  () => { const a = ri(1, 4), mm = a + 1; return [`ln(x^${mm} + 1)`, 'ln x', NUM(mm), `Pro velké $x$ je $\\ln(x^{${mm}} + 1) \\approx ${mm}\\ln x$.`, false,
    [`Typ $\\frac{\\infty}{\\infty}$. L'Hospital: $\\left(\\ln(x^{${mm}} + 1)\\right)' = \\frac{${mm}${pw('x', mm - 1)}}{x^{${mm}} + 1}$, $\\;(\\ln x)' = \\frac{1}{x}$.`, `Dělit $\\frac{1}{x}$ je násobit $x$: $\\frac{${mm}x^{${mm}}}{x^{${mm}} + 1}$. Stejné stupně, takže poměr čísel u nejvyšších mocnin: $${mm}$.`]]; },
  () => { const a = ri(2, 6), b = ri(1, 5), c = ri(1, 5), k = ri(2, 3); return [`${a}x^${k} + ${b}`, `${c}x^${k} + x`, FR(a, c), 'Stejný stupeň nahoře i dole: rozhodují čísla u nejvyšších mocnin.', false,
    [`Vyděl čitatel i jmenovatel nejvyšší mocninou $x^{${k}}$: $\\frac{${a} + \\frac{${b}}{x^{${k}}}}{${c} + \\frac{1}{${pw('x', k - 1)}}}$.`, `Zlomky s $x$ ve jmenovateli jdou k nule. Zbude $\\frac{${a}}{${c}}$.`]]; },
];
export function infRatio() {
  const [nT, dT, ans, why, oneLH, more] = pick(INFR)();
  const nume = simp(P(nT)), deno = simp(P(dT));
  return card({
    key: 'infRatio', fn: LIMx('+\\infty', `\\frac{${T(nume)}}{${T(deno)}}`), answer: ans,
    steps: [why, ...(oneLH ? [`Typ $\\frac{\\infty}{\\infty}$. L'Hospital, čitatel a jmenovatel zvlášť: $(${T(nume)})' = ${T(D(nume))}$, $\\;(${T(deno)})' = ${T(D(deno))}$.`, `Podíl derivací $${T(simp(div(D(nume), D(deno))))}$ jde pro $x \\to +\\infty$ k $${ansTex(ans)}$.`] : more || ['Typ $\\frac{\\infty}{\\infty}$.']), `Limita: $${ansTex(ans)}$`],
    hint: 'Kdo roste rychleji? ln ≪ mocniny ≪ exponenciály.',
    lh: oneLH ? { nume, deno, c: '+\\infty', type: '∞/∞' } : null, fAst: div(nume, deno), at: Infinity,
  });
}

/** 0 · ∞ */
export function zeroInf() {
  const k = ri(1, 4);
  const xk = pw('x', k);
  const pick1 = pick(['ln', 'exp']);
  if (pick1 === 'ln') {
    return card({
      key: 'zeroInf', fn: LIMx('0^+', `${xk} \\ln x`), answer: NUM(0), hint: 'Přepiš na zlomek ln x / x^(−k) a L\'Hospital.',
      steps: [`Typ $0 \\cdot (-\\infty)$. Přepiš: $\\frac{\\ln x}{x^{-${k}}}$, typ $\\frac{-\\infty}{\\infty}$.`, `L'Hospital: $\\frac{1/x}{-${co(k)}x^{-${k + 1}}} = -${k === 1 ? xk : `\\frac{${xk}}{${k}}`} \\to 0$.`, 'Limita: $0$'],
      rewrite: { right: `\\frac{\\ln x}{x^{-${k}}}`, wrong: [[`\\frac{${xk}}{\\frac{1}{\\ln x}}`, 'Tohle je taky správná úprava, ale derivace $\\frac{1}{\\ln x}$ je zbytečně složitá. Logaritmus nech nahoře.'], [`${xk} + \\ln x`, 'Součin nejde přepsat na součet.']] },
      lhAfter: { nume: ln(X), deno: pow(X, N(-k)) }, fAst: mul(pow(X, N(k)), ln(X)), at: 0,
    });
  }
  return card({
    key: 'zeroInf', fn: LIMx('+\\infty', `${xk} \\mathrm{e}^{-x}`), answer: NUM(0), hint: 'e^(−x) = 1/e^x.',
    steps: [`$${xk} \\to \\infty$ a $\\mathrm{e}^{-x} \\to 0$: typ $\\infty \\cdot 0$. Přepiš pomocí $\\mathrm{e}^{-x} = \\frac{1}{\\mathrm{e}^x}$ na zlomek $\\frac{${xk}}{\\mathrm{e}^x}$, typ $\\frac{\\infty}{\\infty}$.`,
      k === 1 ? "L'Hospital: $(x)' = 1$, $(\\mathrm{e}^x)' = \\mathrm{e}^x$. Vyjde $\\frac{1}{\\mathrm{e}^x} \\to 0$." : `L'Hospital ${k}× za sebou: mocnina nahoře se každým krokem sníží o jedna, $\\mathrm{e}^x$ dole zůstane. Nakonec vyjde $\\frac{${[1, 1, 2, 6, 24][k]}}{\\mathrm{e}^x} \\to 0$.`,
      'Limita: $0$ (exponenciála roste rychleji než každá mocnina).'],
    rewrite: { right: `\\frac{${xk}}{\\mathrm{e}^x}`, wrong: [[`\\frac{\\mathrm{e}^{-x}}{x^{-${k}}}`, 'Tohle je taky správná úprava, ale se zápornými mocninami se počítá hůř. Stačí $\\mathrm{e}^{-x} = \\frac{1}{\\mathrm{e}^x}$.'], [`${xk} - \\mathrm{e}^{x}`, 'Součin nejde přepsat na rozdíl.']] },
    fAst: mul(pow(X, N(k)), pow(E, neg(X))), at: Infinity,
  });
}

// b/t − b/g(t) s t = ax: [první, druhý, limita jako násobek b]
const IMI = [
  ['x', 'e^x - 1', 1 / 2], ['ln(1 + x)', 'x', 1 / 2], ['x', 'sin x', 0], ['x', 'tg x', 0], ['x', 'ln(1 + x)', -1 / 2], ['sin x', 'x', 0], ['x', 'arctg x', 0],
];
export function infMinusInf() {
  const [g1, g2, m] = pick(IMI);
  const a = pick([1, 1, 2, 3]), b = pick([1, 1, 2, 3, -2]);
  const t = a === 1 ? 'x' : `(${a}x)`;
  const f1 = P(g1.replace(/x/g, t)), f2 = P(g2.replace(/x/g, t));
  const fA = sub(div(N(b), f1), div(N(b), f2));
  const ans = NUM(simp(N(b * m)));
  // záporné b: místo „−2/A − (−2)/B“ napíšeme „2/B − 2/A“ (je to totéž)
  const ab = Math.abs(b), [h1, h2] = b < 0 ? [f2, f1] : [f1, f2];
  const fr = f => `\\frac{${ab}}{${T(simp(f))}}`;
  // společný jmenovatel: |b|·(h2 − h1)/(h1·h2), pak L'Hospital (tady vždycky dvakrát)
  const Nn = simp(sub(h2, h1)), Mm = simp(mul(h1, h2));
  const d1N = D(Nn), d1M = D(Mm), d2N = D(d1N), d2M = D(d1M);
  const n2 = S.ev(d2N, 0), m2 = S.ev(d2M, 0);
  const okSteps = [S.ev(d1N, 0), S.ev(d1M, 0)].every(v => Math.abs(v) < 1e-9) && Math.abs(m2) > 1e-9 && Math.abs(ab * n2 / m2 - b * m) < 1e-6;
  const pre = ab === 1 ? '' : `${ab} \\cdot `;
  const steps = okSteps ? [
    `Oba zlomky jdou v nule do nekonečna: typ $\\infty - \\infty$. Převeď na společný jmenovatel: $${pre}\\frac{${T(Nn)}}{${T(Mm)}}$. Teď je to $\\frac{0}{0}$.`,
    `L'Hospital, čitatel a jmenovatel zvlášť: $(${T(Nn)})' = ${T(d1N)}$, $\\;(${T(Mm)})' = ${T(d1M)}$. Po dosazení $x = 0$ je to pořád $\\frac{0}{0}$.`,
    `Ještě jednou: nahoře $${T(d2N)}$, dole $${T(d2M)}$.`,
    `Dosaď $x = 0$: nahoře $${numT(n2)}$, dole $${numT(m2)}$${ab === 1 ? '' : `, a nezapomeň na číslo $${ab}$ před zlomkem`}. Limita je $${ansTex(ans)}$.`,
  ] : ['Typ $\\infty - \\infty$. Převeď na společný jmenovatel: vyjde $\\frac{0}{0}$.', `$= ${pre}\\frac{${T(Nn)}}{${T(Mm)}}$`, "L'Hospital, a když je to pořád $\\frac{0}{0}$, tak ještě jednou.", `Limita: $${ansTex(ans)}$`];
  return card({
    key: 'infMinusInf', fn: LIMx(0, `\\left(${fr(h1)} - ${fr(h2)}\\right)`), answer: ans, hint: 'Společný jmenovatel → 0/0 → L\'Hospital (klidně dvakrát).',
    steps, fAst: fA, at: 0,
  });
}

/** typ neurčitého výrazu */
const TYPES = ['$\\frac{0}{0}$', '$\\frac{\\infty}{\\infty}$', '$0 \\cdot \\infty$', '$\\infty - \\infty$', 'není neurčitý, stačí dosadit'];
export function formType() {
  const k = pick([0, 0, 1, 2, 3, 4]);
  const c = k === 0 ? (Math.random() < 0.5 ? lhopPoly() : lhopStd()) : k === 1 ? infRatio() : k === 2 ? zeroInf() : k === 3 ? infMinusInf() : plugIn();
  if (k === 1 && c.answer.num && c.fn.includes('x^2 + 1')) return formType();
  const why = ['Dosazení dá nahoře i dole nulu.', 'Nahoře i dole roste do nekonečna.', 'Jeden činitel jde k nule, druhý do nekonečna.', 'Dva členy jdou do nekonečna a odečítají se.', 'Po dosazení vyjde normální číslo.'][k];
  return { type: 'choice', key: 'formType', prompt: 'Jaký je to typ?', context: c.fn, options: TYPES.map((l, i) => ({ label: l, correct: i === k, why })), explain: why };
}

/** spojitost: najdi parametr */
export function continuity() {
  const c = pick([1, 2, -1, 3, -2]), b = riNot(-5, 5, 0), d = riNot(-5, 5, 0);
  const a = (c * c + d - b) / c;
  const ans = NUM(simp(div(N(c * c + d - b), N(c))));
  const pm = v => `${v < 0 ? '-' : '+'} ${Math.abs(v)}`;
  return card({
    key: 'continuity', prompt: `Pro jaké $a$ je funkce spojitá v bodě $${c}$?`, label: '$a =$',
    fn: `f(x) = \\begin{cases} a x ${pm(b)} & x < ${c} \\\\ x^2 ${pm(d)} & x \\ge ${c} \\end{cases}`,
    answer: ans, hint: 'Obě části se musí v bodě potkat: limita zleva = limita zprava.',
    steps: [`Zleva (dosaď $x = ${c}$ do horní části): $${c} a ${pm(b)}$. Zprava (do dolní): $${c * c} ${pm(d)} = ${c * c + d}$.`, `Musí se rovnat: $${c}a ${pm(b)} = ${c * c + d}$, tedy $a = ${ansTex(ans)}$.`],
  });
}

// =====================================================================
// Řešení po krocích
// =====================================================================
const RULE3 = '<b>Pravidlo:</b> čitatel menší stupeň → $0$, stejný → poměr čísel u nejvyšších mocnin, větší → $\\pm\\infty$.';
export function toGuided(c, level = 'full') {
  const fin = { kind: 'limit', title: 'Výsledek', label: '$=$', answer: c.answer, final: true };
  const g = [];
  if (c.key === 'ratPoly') {
    const powOpts = right => shuffle([1, 2, 3, 4].map(k => ({ label: `$${pw('n', k)}$`, correct: k === right, why: `Nejvyšší exponent je $${right}$.` })));
    if (level === 'full') {
      g.push({ kind: 'choice', title: 'Nejvyšší mocnina v <b>čitateli</b>?', options: powOpts(c.p) });
      g.push({ kind: 'choice', title: 'Nejvyšší mocnina ve <b>jmenovateli</b>?', options: powOpts(c.q) });
    }
    fin.info = RULE3;
  } else if (c.lh) {
    const ti = c.lh.type === '0/0' ? 0 : 1;
    g.push({ kind: 'choice', title: ti === 0 ? 'Dosaď. Jaký je to typ?' : 'Jaký je to typ?', options: TYPES.map((l, i) => ({ label: l, correct: i === ti, why: ti === 0 ? 'Nahoře i dole vyjde nula.' : 'Nahoře i dole roste do nekonečna.' })) });
    if (level === 'full') {
      g.push({ kind: 'expr', title: 'Derivace čitatele', label: "$(\\text{čitatel})' =$", answer: D(c.lh.nume), original: c.lh.nume });
      g.push({ kind: 'expr', title: 'Derivace jmenovatele', label: "$(\\text{jmen.})' =$", answer: D(c.lh.deno), original: c.lh.deno });
      fin.info = c.lh.twice ? 'Pořád $\\frac{0}{0}$? Zderivuj ještě jednou a dosaď.' : ti === 0 ? `Dosaď $x = ${c.lh.c}$ do podílu derivací.` : 'Podívej se, kam jde podíl derivací pro $x \\to \\infty$.';
    }
  } else if (c.key === 'conj') {
    g.push({ kind: 'choice', title: 'Co uděláš?', options: shuffle([
      { label: 'rozšířím součtem odmocnin', correct: c.conjKind !== 'D', why: c.conjKind === 'D' ? 'Tady se nejvyšší členy liší, stačí je porovnat.' : 'Rozdíl odmocnin → $(A - B)\\frac{A + B}{A + B} = \\frac{A^2 - B^2}{A + B}$.' },
      { label: 'porovnám čísla u $n$', correct: c.conjKind === 'D', why: c.conjKind === 'D' ? '$\\sqrt{a}n$ a $\\sqrt{b}n$ jsou různé, takže vyhraje větší.' : 'Čísla u $n$ jsou stejná a odečtou se. Je potřeba rozšířit.' },
      { label: 'dosadím $n = \\infty$', correct: false, why: 'Vyjde $\\infty - \\infty$, a to je neurčitý výraz.' },
    ]) });
    if (level === 'full' && c.cj) {
      g.push({ kind: 'expr', numeric: true, title: 'Po rozšíření: kolikrát $n$ zbude v <b>čitateli</b>?', info: 'Kvadratické členy se odečtou ($A^2 - B^2$), zbude jen něco krát $n$ (plus číslo).', label: '$\\dots \\cdot n$, číslo:', answer: c.cj.top, why: c.steps[1] });
      g.push({ kind: 'expr', numeric: true, title: 'Ve <b>jmenovateli</b> je součet odmocnin. Kolikrát $n$ to zhruba je?', info: '$\\sqrt{a n^2 + \\dots} \\approx \\sqrt{a}\\,n$', label: '$\\dots \\cdot n$, číslo:', answer: c.cj.bot, why: c.steps[2] });
      fin.info = '$n$ se zkrátí, zbude podíl těch dvou čísel.';
    }
  } else if (c.key === 'rootRatio' && c.rr) {
    if (level === 'full') {
      g.push({ kind: 'choice', title: 'Jaká je nejvyšší mocnina?', options: shuffle([['n', 1], ['n\\sqrt{n} = n^{3/2}', 1.5], ['n^2', 2], ['n^3', 3]].map(([l, p]) => ({ label: `$${l}$`, correct: p === c.rr.pw, why: '$\\sqrt{n^2} = n$, $\\sqrt{n^3} = n\\sqrt{n}$.' }))) });
      g.push({ kind: 'expr', numeric: true, title: 'Po vydělení nejvyšší mocninou: co zbude <b>nahoře</b>?', info: 'Členy s menší mocninou jdou k nule.', label: '', answer: c.rr.top, why: c.steps[1] });
      g.push({ kind: 'expr', numeric: true, title: 'A co zbude <b>dole</b>?', label: '', answer: c.rr.bot, why: c.steps[1] });
      fin.info = 'Výsledek je podíl.';
    }
  } else if (c.key === 'expoRatio' && c.expo) {
    const e = c.expo;
    g.push({ kind: 'choice', title: 'Který základ je největší?', info: 'Pozor na převleky: $3^{2n} = 9^n$, $2^{2n} = 4^n$.', options: shuffle([...new Set([e.M, ...e.bases, 2, 3, 4, 5, 9])].slice(0, 4).map(b => ({ label: `$${b}^n$`, correct: b === e.M, why: `Největší je $${e.M}^n$.` }))) });
    if (level === 'full') {
      const why = 'Rozepiš posun v exponentu: $5^{n+1} = 5 \\cdot 5^n$, $3^{2n+2} = 3^2 \\cdot 3^{2n} = 9 \\cdot 9^n$. Číslo před tím se násobí.';
      g.push({ kind: 'expr', numeric: true, title: `Kolikrát $${e.M}^n$ je v <b>čitateli</b>?`, info: `Příklad: $3^{n+2} = 9 \\cdot 3^n$. Když tam $${e.M}^n$ není, napiš $0$.`, label: '', answer: N(e.cn), why });
      g.push({ kind: 'expr', numeric: true, title: `Kolikrát $${e.M}^n$ je ve <b>jmenovateli</b>?`, info: `Když tam $${e.M}^n$ není, napiš $0$.`, label: '', answer: N(e.cd), why });
      fin.info = 'Podíl těch dvou čísel. Když je nahoře 0, limita je 0. Když je dole 0, je to $\\pm\\infty$.';
    }
  } else if (c.key === 'eLimit') {
    g.push({ kind: 'choice', title: 'Jaký je to typ?', options: shuffle([{ label: '$1^\\infty$', correct: true, why: 'Základ jde k 1, exponent do nekonečna.' }, { label: '$\\frac{\\infty}{\\infty}$', correct: false, why: 'Je to mocnina: základ → 1, exponent → ∞.' }, { label: 'není neurčitý, je to $1$', correct: false, why: 'Past! $1^\\infty$ je neurčitý výraz, výsledkem je mocnina e.' }]) });
    if (level === 'full') g.push({ kind: 'expr', numeric: true, title: 'Výsledek bude $\\mathrm{e}^a$. Kolik je $a$?', info: c.eKind === 'A' ? '$\\left(1 + \\frac{a}{n}\\right)^{bn} \\to \\mathrm{e}^{ab}$' : 'Přepiš základ na $1 + \\frac{\\text{něco}}{n}$.', label: '$a =$', answer: c.eA, why: c.steps[1] });
  } else if (c.rewrite) {
    g.push({ kind: 'choice', title: 'Který přepis na zlomek je <b>nejšikovnější</b>?', options: shuffle([
      { label: `$${c.rewrite.right}$`, correct: true, why: 'Tenhle zlomek je typu ∞/∞ a derivace jsou jednoduché.' },
      ...c.rewrite.wrong.map(([w, why]) => ({ label: `$${w}$`, correct: false, why: `${why} Nejšikovnější je $${c.rewrite.right}$.` }))]) });
    if (level === 'full' && c.lhAfter) {
      g.push({ kind: 'expr', title: "L'Hospital: derivace čitatele", label: '', answer: D(c.lhAfter.nume) });
      g.push({ kind: 'expr', title: 'Derivace jmenovatele', label: '', answer: D(c.lhAfter.deno) });
      fin.info = 'Zjednoduš podíl derivací a dosaď $x \\to 0^+$.';
    }
  } else if (c.key === 'infRatio') {
    const who = c.answer.inf ? 0 : (c.answer.num && Math.abs(S.ev(c.answer.num, 0)) < 1e-12) ? 1 : 2;
    g.push({ kind: 'choice', title: 'Kdo roste rychleji?', info: '$\\ln x \\ll x^k \\ll \\mathrm{e}^x$', options: ['čitatel', 'jmenovatel', 'stejně rychle'].map((l, i) => ({ label: l, correct: i === who, why: c.steps[0] })) });
    fin.info = 'Rychlejší čitatel → $\\infty$, rychlejší jmenovatel → $0$, stejně rychle → číslo.';
  } else if (c.key === 'infMinusInf') {
    g.push({ kind: 'choice', title: 'Co uděláš jako první?', options: shuffle([
      { label: 'převedu na společný jmenovatel', correct: true, why: 'Z $\\infty - \\infty$ vznikne $\\frac{0}{0}$ a na to už je L\'Hospital.' },
      { label: "rovnou L'Hospital", correct: false, why: "L'Hospital funguje jen na zlomek $\\frac{0}{0}$ nebo $\\frac{\\infty}{\\infty}$." },
      { label: 'dosadím $x = 0$', correct: false, why: 'Vyjde $\\infty - \\infty$, neurčitý výraz.' }]) });
  }
  return { type: 'guided', key: c.key + ':' + level, badge: c.badge, fn: c.fn, prompt: c.prompt || 'Spočítej limitu', gsteps: [...g, fin], answer: c.answer, steps: c.steps, hint: c.hint };
}
export const guided = f => () => toGuided(f(), 'full');
export const semi = f => () => toGuided(f(), 'semi');

// =====================================================================
// Pevné příklady: Série 3 a videa
// =====================================================================
// Plné postupy k pevným příkladům (ukážou se po „Nevím“ nebo po chybě). R = text bez zdvojování zpětných lomítek.
const R = String.raw;
const FULL = {
  s1: [
    R`Členy jsou zpřeházené, seřaď si je podle mocnin: nahoře $n^3 + 9n^2 - 3n + 6$, dole $2n^3 + 4n^2 + 9n$ (protože $4n + 5n = 9n$).`,
    R`Nejvyšší mocnina nahoře i dole je $n^3$. Vyděl čitatel i jmenovatel $n^3$: $\frac{1 + \frac{9}{n} - \frac{3}{n^2} + \frac{6}{n^3}}{2 + \frac{4}{n} + \frac{9}{n^2}}$.`,
    R`Všechny zlomky s $n$ ve jmenovateli jdou k nule. Zbude $\frac{1}{2}$.`,
  ],
  s2: [
    R`$\sqrt{n^3} = n\sqrt{n} = n^{3/2}$, to je tady nejvyšší mocnina (samotné $n$ je slabší).`,
    R`Vyděl čitatel i jmenovatel $n\sqrt{n}$. Odmocnina: $\frac{\sqrt{7n^3 + 1}}{n\sqrt{n}} = \sqrt{\frac{7n^3 + 1}{n^3}} = \sqrt{7 + \frac{1}{n^3}}$. Dál $\frac{n}{n\sqrt{n}} = \frac{1}{\sqrt{n}}$.`,
    R`Vyjde $\frac{\sqrt{7 + \frac{1}{n^3}} - \frac{1}{\sqrt{n}}}{\frac{81}{n\sqrt{n}} + 7}$. Malé zlomky jdou k nule.`,
    R`Zbude $\frac{\sqrt{7}}{7}$.`,
  ],
  s3: [
    R`Typ $\infty - \infty$. Nejdřív se podívej na nejvyšší členy: $\sqrt{4n^2} = 2n$ a $\sqrt{5n^2} = \sqrt{5}\,n$.`,
    R`Čísla u $n$ jsou různá ($2$ a $\sqrt{5} \approx 2{,}24$), takže se nic neodečte a sdružený výraz není potřeba.`,
    R`Vytkni $n$: $n\left(\sqrt{4 + \frac{1}{n^2}} - \sqrt{5 + \frac{1}{n} + \frac{7}{n^2}}\right)$. Závorka jde k $2 - \sqrt{5}$, což je záporné číslo.`,
    R`$n \to \infty$ krát záporné číslo: limita je $-\infty$.`,
  ],
  s4: [
    R`Závorka je typ $\infty - \infty$ a čísla u $n^2$ jsou stejná, takže rozšiř sdruženým výrazem (součtem obou odmocnin).`,
    R`$(A - B)(A + B) = A^2 - B^2$: nahoře vyjde $(5n^2 + 5) - (5n^2 - 5) = 10$.`,
    R`Máme $n \cdot \frac{10}{\sqrt{5n^2 + 5} + \sqrt{5n^2 - 5}}$.`,
    R`Vyděl čitatel i jmenovatel $n$ (pod odmocninou je to dělení $n^2$): $\frac{10}{\sqrt{5 + \frac{5}{n^2}} + \sqrt{5 - \frac{5}{n^2}}} \to \frac{10}{\sqrt{5} + \sqrt{5}} = \frac{10}{2\sqrt{5}}$.`,
    R`$\frac{10}{2\sqrt{5}} = \frac{5}{\sqrt{5}} = \sqrt{5}$.`,
  ],
  s5: [
    R`Rozepiš posuny v exponentech: $3^{2n+4} = 3^4 \cdot 3^{2n} = 81 \cdot 9^n$, $\;4^{n+1} = 4 \cdot 4^n$, $\;2^{n+1} = 2 \cdot 2^n$, $\;3^{2n} = 9^n$.`,
    R`Máme $\frac{81 \cdot 9^n - 4 \cdot 4^n}{2 \cdot 2^n - 9^n + 4^n}$. Největší základ je $9$.`,
    R`Vyděl čitatel i jmenovatel $9^n$: $\frac{81 - 4\left(\frac{4}{9}\right)^n}{2\left(\frac{2}{9}\right)^n - 1 + \left(\frac{4}{9}\right)^n}$.`,
    R`$\left(\frac{4}{9}\right)^n$ i $\left(\frac{2}{9}\right)^n$ jdou k nule (základ menší než 1). Zbude $\frac{81}{-1} = -81$.`,
  ],
  f1: [
    R`Zjednoduš mocniny: $\frac{\sqrt[3]{x}}{x} = \frac{x^{1/3}}{x^1} = x^{-2/3}$, takže $f(x) = \frac{\ln x}{x^{2/3}}$.`,
    R`Pro $x \to +\infty$ je to typ $\frac{\infty}{\infty}$. L'Hospital: $(\ln x)' = \frac{1}{x}$, $\left(x^{2/3}\right)' = \frac{2}{3}x^{-1/3}$.`,
    R`$\frac{\frac{1}{x}}{\frac{2}{3}x^{-1/3}} = \frac{3}{2} \cdot x^{-1 + \frac{1}{3}} = \frac{3}{2x^{2/3}} \to 0$.`,
    'Limita je $0$. (Logaritmus prohraje s každou kladnou mocninou.)',
  ],
  f2: [
    R`$x^3 \to 0$ a $\ln x \to -\infty$: typ $0 \cdot \infty$. Přepiš na zlomek, logaritmus nech nahoře: $\frac{\ln x}{x^{-3}}$.`,
    R`Teď je to $\frac{-\infty}{\infty}$. L'Hospital: $(\ln x)' = \frac{1}{x}$, $\left(x^{-3}\right)' = -3x^{-4}$.`,
    R`$\frac{\frac{1}{x}}{-3x^{-4}} = -\frac{x^4}{3x} = -\frac{x^3}{3}$.`,
    R`Pro $x \to 0^+$ jde $-\frac{x^3}{3}$ k nule. Limita je $0$.`,
  ],
  f3: [
    R`Oba zlomky jdou do nekonečna: typ $\infty - \infty$. Převeď na společný jmenovatel: $\frac{\mathrm{e}^x - 1 - \sin x}{\sin x\,(\mathrm{e}^x - 1)}$, typ $\frac{0}{0}$.`,
    R`L'Hospital: čitatel $\left(\mathrm{e}^x - 1 - \sin x\right)' = \mathrm{e}^x - \cos x$, jmenovatel (součin) $\cos x\,(\mathrm{e}^x - 1) + \sin x \cdot \mathrm{e}^x$.`,
    R`Dosaď $x = 0$: nahoře $1 - 1 = 0$, dole $1 \cdot 0 + 0 = 0$. Pořád $\frac{0}{0}$, takže ještě jednou.`,
    R`Druhé derivace: nahoře $\mathrm{e}^x + \sin x$, dole $-\sin x\,(\mathrm{e}^x - 1) + \cos x \cdot \mathrm{e}^x + \cos x \cdot \mathrm{e}^x + \sin x \cdot \mathrm{e}^x$.`,
    R`Dosaď $x = 0$: nahoře $1 + 0 = 1$, dole $0 + 1 + 1 + 0 = 2$. Limita je $\frac{1}{2}$.`,
  ],
  f4: [
    R`Dosaď $x = 0$: nahoře $\ln(\cos 0) = \ln 1 = 0$, dole $0$. Typ $\frac{0}{0}$.`,
    R`L'Hospital: $\left(\ln(\cos 3x)\right)' = \frac{1}{\cos 3x} \cdot (-\sin 3x) \cdot 3 = -3\operatorname{tg} 3x$, $\;(x^3 - x^2)' = 3x^2 - 2x$.`,
    R`$\frac{-3\operatorname{tg} 3x}{3x^2 - 2x}$ je v nule zase $\frac{0}{0}$, takže ještě jednou.`,
    R`$\left(-3\operatorname{tg} 3x\right)' = -3 \cdot \frac{3}{\cos^2 3x} = -\frac{9}{\cos^2 3x}$, $\;(3x^2 - 2x)' = 6x - 2$.`,
    R`Dosaď $x = 0$: $\frac{-9}{-2} = \frac{9}{2}$.`,
  ],
  f5: [
    R`$\ln(x^4) = 4\ln|x| \to -\infty$ a $\operatorname{tg} x \to 0$: typ $\infty \cdot 0$.`,
    R`Přepiš na zlomek pomocí $\operatorname{tg} x = \frac{1}{\operatorname{cotg} x}$: $\frac{4\ln|x|}{\operatorname{cotg} x}$, typ $\frac{\infty}{\infty}$.`,
    R`L'Hospital: $(4\ln|x|)' = \frac{4}{x}$, $\;(\operatorname{cotg} x)' = -\frac{1}{\sin^2 x}$.`,
    R`$\frac{\frac{4}{x}}{-\frac{1}{\sin^2 x}} = -\frac{4\sin^2 x}{x} = -4\sin x \cdot \frac{\sin x}{x}$.`,
    R`$\sin x \to 0$ a $\frac{\sin x}{x} \to 1$, takže limita je $0$.`,
  ],
  f6: [
    R`$\pi - x \to 0$ a $\operatorname{tg}\frac{x}{2} \to \infty$ (protože $\operatorname{tg}\frac{\pi}{2}$ neexistuje): typ $0 \cdot \infty$.`,
    R`Přepiš pomocí $\operatorname{tg} = \frac{1}{\operatorname{cotg}}$: $\frac{\pi - x}{\operatorname{cotg}\frac{x}{2}}$, typ $\frac{0}{0}$.`,
    R`L'Hospital: $(\pi - x)' = -1$, $\;\left(\operatorname{cotg}\frac{x}{2}\right)' = -\frac{1}{\sin^2\frac{x}{2}} \cdot \frac{1}{2}$.`,
    R`$\frac{-1}{-\frac{1}{2\sin^2\frac{x}{2}}} = 2\sin^2\frac{x}{2}$.`,
    R`Dosaď $x = \pi$: $2\sin^2\frac{\pi}{2} = 2 \cdot 1 = 2$.`,
  ],
  f7: [
    R`Dosaď $x = 1$: nahoře $1 + 1 - 2 = 0$, dole $\cos\frac{\pi}{2} + \sin\pi = 0 + 0$. Typ $\frac{0}{0}$.`,
    R`L'Hospital: nahoře $(x^3 + x - 2)' = 3x^2 + 1$, dole $\left(\cos\frac{\pi x}{2} + \sin \pi x\right)' = -\frac{\pi}{2}\sin\frac{\pi x}{2} + \pi\cos \pi x$.`,
    R`Dosaď $x = 1$: nahoře $4$, dole $-\frac{\pi}{2} \cdot 1 + \pi \cdot (-1) = -\frac{3\pi}{2}$.`,
    R`$\frac{4}{-\frac{3\pi}{2}} = -\frac{8}{3\pi}$.`,
  ],
  vs2: [
    R`Dosaď $x = \frac{3\pi}{2}$: $\cos\frac{3\pi}{2} = 0$, takže nahoře $0$, dole $0$. Typ $\frac{0}{0}$.`,
    R`L'Hospital: nahoře součin, $(\sin x \cos x)' = \cos x \cdot \cos x + \sin x \cdot (-\sin x) = \cos^2 x - \sin^2 x = \cos 2x$. Dole $\left(x - \frac{3\pi}{2}\right)' = 1$.`,
    R`Dosaď: $\cos\left(2 \cdot \frac{3\pi}{2}\right) = \cos 3\pi = -1$.`,
  ],
  vs3: [
    R`Dosaď $x = \pi$: $\sin \pi = 0$, takže $\frac{0}{0}$.`,
    R`L'Hospital: nahoře $(\sin^2 x)' = 2\sin x \cos x$, dole $\left((x - \pi)^2\right)' = 2(x - \pi)$. Po zkrácení dvojky $\frac{\sin x \cos x}{x - \pi}$, pořád $\frac{0}{0}$.`,
    R`Ještě jednou: nahoře $\cos^2 x - \sin^2 x$, dole $1$.`,
    R`Dosaď $x = \pi$: $(-1)^2 - 0 = 1$.`,
  ],
  vs4: [
    R`Sinus je vždycky mezi $-1$ a $1$, takže $-\frac{1}{x} \le \frac{\sin x}{x} \le \frac{1}{x}$.`,
    R`Obě krajní funkce jdou pro $x \to +\infty$ k nule, takže prostřední je sevřená: limita je $0$.`,
    R`Pozor: L'Hospital tu použít nejde, čitatel nejde do nekonečna (není to $\frac{\infty}{\infty}$).`,
  ],
  vs5: [
    R`Dosazení dá $\frac{0}{0}$. Tady stačí úprava: $x^2 - 1 = (x - 1)(x + 1)$ a $x - 1 = \sqrt{x - 1} \cdot \sqrt{x - 1}$.`,
    R`$\frac{(x - 1)(x + 1)}{\sqrt{x - 1}} = (x + 1)\sqrt{x - 1}$.`,
    R`Pro $x \to 1^+$: $(1 + 1) \cdot \sqrt{0} = 0$.`,
  ],
  vs7: [
    R`Základ jde k $1$ a exponent do nekonečna: typ $1^\infty$.`,
    R`Je to stejný vzorec jako u posloupností, $\left(1 + \frac{a}{x}\right)^x \to \mathrm{e}^a$, tady s $a = 1$.`,
    R`Limita je $\mathrm{e}$. (Takhle je číslo $\mathrm{e}$ definované.)`,
  ],
};
const fx = (key, badge, fnT, ans, steps, hint) => () => card({ key, badge, fn: fnT, answer: ans, steps: FULL[key] || steps, hint });
export const FIXED = {
  s1: fx('s1', 'Série 3', LIMn('\\frac{6 - 3n + 9n^2 + n^3}{4n + 4n^2 + 5n + 2n^3}'), FR(1, 2), ['Nejvyšší mocnina nahoře i dole je $n^3$: u ní $1$ a $2$.', 'Limita: $\\frac{1}{2}$'], 'Pozor, členy jsou zpřeházené.'),
  s2: fx('s2', 'Série 3', LIMn('\\frac{\\sqrt{7n^3 + 1} - n}{81 + 7n\\sqrt{n}}'), NUM(div(root(2, N(7)), N(7))), ['Nejvyšší mocnina je $n\\sqrt{n} = n^{3/2}$.', 'Nahoře $\\sqrt{7}$, dole $7$: $\\frac{\\sqrt{7}}{7}$.'], 'Nejvyšší mocnina: n√n.'),
  s3: fx('s3', 'Série 3', LIMn('\\left(\\sqrt{4n^2 + 1} - \\sqrt{5n^2 + 7 + n}\\right)'), INF(-1), ['$\\sqrt{4n^2} = 2n$, $\\sqrt{5n^2} = \\sqrt{5}n$.', '$2 - \\sqrt{5} < 0$, takže $-\\infty$.'], 'Porovnej čísla u n.'),
  s4: fx('s4', 'Série 3', LIMn('n\\left(\\sqrt{5n^2 + 5} - \\sqrt{5n^2 - 5}\\right)'), NUM(root(2, N(5))), ['Rozšiř: $n \\cdot \\frac{10}{\\sqrt{5n^2+5} + \\sqrt{5n^2-5}}$.', 'Dole $\\approx 2\\sqrt{5}\\,n$: $\\frac{10}{2\\sqrt{5}} = \\sqrt{5}$.'], 'Sdružený výraz.'),
  s5: fx('s5', 'Série 3', LIMn('\\frac{3^{2n+4} - 4^{n+1}}{2^{n+1} - 3^{2n} + 4^n}'), NUM(-81), ['$3^{2n} = 9^n$ je největší. $3^{2n+4} = 81 \\cdot 9^n$.', 'Nahoře $81$, dole $-1$: $-81$.'], 'Největší základ: 9.'),
  f1: fx('f1', 'Série 3', LIMx('+\\infty', '\\frac{\\sqrt[3]{x} \\ln x}{x}'), NUM(0), ['$= \\frac{\\ln x}{x^{2/3}}$, logaritmus prohraje s mocninou.', 'Limita: $0$'], 'Zjednoduš mocniny.'),
  f2: fx('f2', 'Série 3', LIMx('0^+', 'x^3 \\ln x'), NUM(0), ['$\\frac{\\ln x}{x^{-3}}$, L\'Hospital: $\\frac{1/x}{-3x^{-4}} = -\\frac{x^3}{3} \\to 0$.'], 'Přepiš na zlomek.'),
  f3: fx('f3', 'Série 3', LIMx(0, '\\left(\\frac{1}{\\sin x} - \\frac{1}{\\mathrm{e}^x - 1}\\right)'), FR(1, 2), ['Společný jmenovatel: $\\frac{\\mathrm{e}^x - 1 - \\sin x}{\\sin x(\\mathrm{e}^x - 1)}$, typ $\\frac{0}{0}$.', "Dvakrát L'Hospital: $\\frac{1}{2}$."], 'Společný jmenovatel.'),
  f4: fx('f4', 'Série 3', LIMx(0, '\\frac{\\ln(\\cos 3x)}{x^3 - x^2}'), FR(9, 2), ["$\\frac{0}{0}$, L'Hospital: $\\frac{-3\\operatorname{tg} 3x}{3x^2 - 2x}$, pořád $\\frac{0}{0}$.", "Ještě jednou: $\\frac{-9/\\cos^2 3x}{6x - 2} \\to \\frac{-9}{-2} = \\frac{9}{2}$."], 'Dvakrát L\'Hospital.'),
  f5: fx('f5', 'Série 3', LIMx(0, '\\ln(x^4) \\cdot \\operatorname{tg} x'), NUM(0), ['$\\ln(x^4) = 4\\ln|x|$. Typ $\\infty \\cdot 0$.', '$\\frac{4\\ln|x|}{\\operatorname{cotg} x}$, L\'Hospital: $\\frac{4/x}{-1/\\sin^2 x} = -\\frac{4\\sin^2 x}{x} \\to 0$.'], 'Přepiš na zlomek.'),
  f6: fx('f6', 'Série 3', LIMx('\\pi', '(\\pi - x)\\operatorname{tg}\\frac{x}{2}'), NUM(2), ['Typ $0 \\cdot \\infty$: $\\frac{\\pi - x}{\\operatorname{cotg}\\frac{x}{2}}$.', "L'Hospital: $\\frac{-1}{-\\frac{1}{2\\sin^2(x/2)}} = 2\\sin^2\\frac{x}{2} \\to 2$."], 'tg = 1/cotg.'),
  f7: fx('f7', 'Série 3', LIMx(1, '\\frac{x^3 + x - 2}{\\cos\\frac{\\pi x}{2} + \\sin \\pi x}'), NUM(div(N(-8), mul(N(3), PI))), ["$\\frac{0}{0}$. L'Hospital: $\\frac{3x^2 + 1}{-\\frac{\\pi}{2}\\sin\\frac{\\pi x}{2} + \\pi\\cos\\pi x}$.", 'V $x = 1$: $\\frac{4}{-\\frac{\\pi}{2} - \\pi} = -\\frac{8}{3\\pi}$.'], 'L\'Hospital a dosaď.'),
  vs2: fx('vs2', 'Z videa', LIMx('\\frac{3\\pi}{2}', '\\frac{\\sin x \\cos x}{x - \\frac{3\\pi}{2}}'), NUM(-1), ["$\\frac{0}{0}$. L'Hospital (dole je derivace $1$): $\\cos^2 x - \\sin^2 x = \\cos 2x$.", '$\\cos 3\\pi = -1$.'], 'L\'Hospital.'),
  vs3: fx('vs3', 'Z videa', LIMx('\\pi', '\\frac{\\sin^2 x}{(x - \\pi)^2}'), NUM(1), ["Dvakrát L'Hospital, nebo $\\left(\\frac{\\sin x}{x - \\pi}\\right)^2$ a $\\frac{\\sin x}{x - \\pi} \\to -1$.", '$(-1)^2 = 1$'], 'Na druhou.'),
  vs4: fx('vs4', 'Z videa', LIMx('+\\infty', '\\frac{\\sin x}{x}'), NUM(0), ['Sinus je omezený, $x$ roste: $0$.'], 'Omezené lomeno rostoucím.'),
  vs5: fx('vs5', 'Z videa', LIMx('1^+', '\\frac{x^2 - 1}{\\sqrt{x - 1}}'), NUM(0), ['$\\frac{(x-1)(x+1)}{\\sqrt{x-1}} = (x+1)\\sqrt{x-1} \\to 2 \\cdot 0 = 0$.'], 'Rozlož čitatel.'),
  vs7: fx('vs7', 'Z videa', LIMx('+\\infty', '\\left(1 + \\frac{1}{x}\\right)^x'), NUM(E), ['To je definice čísla $\\mathrm{e}$.'], 'Číslo e.'),
};

export const GEN = {
  basicSeq, infArith, ratPoly, rootRatio, conj, expoRatio, growth, squeeze, eLimit, nthRoot, plugIn, lhopPoly, lhopStd, infRatio, zeroInf, infMinusInf, formType, continuity, ...FIXED,
};
