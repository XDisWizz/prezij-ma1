// Obsah cesty "Derivace".
import * as G from './gen.js';
import { pick } from '../ui.js';

const VIDEO = id => `https://opencast.vsb.cz/play/${id}`;
const info = (title, body) => () => ({ type: 'info', title, body });
const video = (title, id, body) => () => ({ type: 'video', title, url: VIDEO(id), body });
const { guided, semi } = G;
const mix = (n, ...fs) => Array.from({ length: n }, () => () => pick(fs)());
const drillInfo = info('Dril: jeden za druhým', `<p>Příklady jdou rovnou za sebou, bez vysvětlování mezi nimi. Na další přejdeš, až budeš chtít (Enter nebo Pokračovat).</p>
  <p class="muted">Nespěchej, rychlost přijde sama. Na konci uvidíš, kolik ti trvá jeden příklad.</p>`);

const TANGENT_SVG = `<svg class="parabola" viewBox="0 0 220 130" aria-hidden="true">
  <line class="nl-axis" x1="10" y1="115" x2="210" y2="115"/><line class="nl-axis" x1="40" y1="125" x2="40" y2="5"/>
  <path class="pb-curve" d="M40 112 Q 110 105 190 15"/>
  <line class="uc-line" x1="70" y1="125" x2="200" y2="30"/>
  <circle class="nl-dot-in" cx="135" cy="78" r="5"/>
  <text class="nl-label" x="140" y="96">x₀</text>
</svg>`;

export const TABLE_HTML = `<table class="rules dtable">
  <tr><th>$f(x)$</th><th>$f'(x)$</th><th>$f(x)$</th><th>$f'(x)$</th></tr>
  <tr><td>$c$ (číslo)</td><td>$0$</td><td>$\\sin x$</td><td>$\\cos x$</td></tr>
  <tr><td>$x^n$</td><td>$n x^{n-1}$</td><td>$\\cos x$</td><td>$-\\sin x$</td></tr>
  <tr><td>$\\mathrm{e}^x$</td><td>$\\mathrm{e}^x$</td><td>$\\operatorname{tg} x$</td><td>$\\frac{1}{\\cos^2 x}$</td></tr>
  <tr><td>$a^x$</td><td>$a^x \\ln a$</td><td>$\\operatorname{cotg} x$</td><td>$-\\frac{1}{\\sin^2 x}$</td></tr>
  <tr><td>$\\ln x$</td><td>$\\frac{1}{x}$</td><td>$\\arcsin x$</td><td>$\\frac{1}{\\sqrt{1-x^2}}$</td></tr>
  <tr><td>$\\sqrt{x}$</td><td>$\\frac{1}{2\\sqrt{x}}$</td><td>$\\arccos x$</td><td>$-\\frac{1}{\\sqrt{1-x^2}}$</td></tr>
  <tr><td>$\\frac{1}{x}$</td><td>$-\\frac{1}{x^2}$</td><td>$\\operatorname{arctg} x$</td><td>$\\frac{1}{1+x^2}$</td></tr>
</table>`;

export const RULES_HTML = `<table class="rules">
  <tr><th>co</th><th>pravidlo</th></tr>
  <tr><td>číslo krát funkce</td><td>$(c \\cdot f)' = c \\cdot f'$</td></tr>
  <tr><td>součet</td><td>$(f + g)' = f' + g'$</td></tr>
  <tr><td>součin</td><td>$(u \\cdot v)' = u'v + uv'$</td></tr>
  <tr><td>podíl</td><td>$\\left(\\frac{u}{v}\\right)' = \\frac{u'v - uv'}{v^2}$</td></tr>
  <tr><td>složená (řetízek)</td><td>$f(g(x))' = f'(g(x)) \\cdot g'(x)$</td></tr>
  <tr><td>$f^g$ ($x$ dole i nahoře)</td><td>$f^g = \\mathrm{e}^{g \\ln f}$, pak řetízek</td></tr>
</table>`;
// Tahák: dá se otevřít kdykoli během lekce
const CHEAT = [
  { title: 'Tabulka derivací', html: TABLE_HTML + `<p>Navíc: $(\\operatorname{arccotg} x)' = -\\frac{1}{1+x^2}$, $(\\sqrt[3]{x})' = \\frac{1}{3\\sqrt[3]{x^2}}$.</p>` },
  { title: 'Pravidla', html: RULES_HTML + `<p class="muted">Čím začít: podívej se, která operace se počítá <b>poslední</b>. Plus/mínus → součet, krát → součin, zlomek → podíl, funkce ve funkci → řetízek.</p>` },
  { title: 'Mocniny a odmocniny', html: `<div class="callout">$(x^n)' = n\\,x^{n-1}$ pro každé $n$</div>
      <table class="rules"><tr><th>zápis</th><th>jako mocnina</th></tr>
      <tr><td>$\\sqrt{x}$</td><td>$x^{\\frac{1}{2}}$</td></tr><tr><td>$\\sqrt[3]{x}$</td><td>$x^{\\frac{1}{3}}$</td></tr><tr><td>$\\sqrt[3]{x^2}$</td><td>$x^{\\frac{2}{3}}$</td></tr>
      <tr><td>$\\frac{1}{x^3}$</td><td>$x^{-3}$</td></tr><tr><td>$\\frac{1}{\\sqrt{x}}$</td><td>$x^{-\\frac{1}{2}}$</td></tr></table>` },
  { title: 'Tečna', html: `<div class="callout">$y = f(x_0) + f'(x_0)\\,(x - x_0)$</div><p>Postup: hodnota $f(x_0)$, derivace $f'(x)$, sklon $f'(x_0)$, dosadit. Rovnoběžná tečna s přímkou $y = kx + q$: hledej, kde $f'(x) = k$.</p>` },
  { title: 'Jak psát odpověď', html: `<p><b>x^2</b> je $x^2$, <b>sin 2x</b> je $\\sin(2x)$, <b>e^(x^2)</b> je $\\mathrm{e}^{x^2}$, <b>1/(2√x)</b> je $\\frac{1}{2\\sqrt{x}}$, násobení se dá vynechat. Pod políčkem vždy vidíš, jak se zápis přečetl. Výsledek nemusíš upravovat.</p>` },
];

export const PATH = {
  id: 'derivace',
  cheat: CHEAT,
  title: 'Derivace',
  tagline: 'Od tabulky po složené funkce',
  units: [
    {
      id: 'd1', title: 'Co je derivace', desc: 'Sklon a tabulka. Úplný začátek.',
      lessons: [
        {
          id: 'd1l1', title: 'Jak strmě to stoupá', cards: [
            info('Derivace = sklon', `<p>Představ si graf funkce jako kopec. <b>Derivace</b> $f'(x)$ říká, jak strmě kopec v bodě $x$ stoupá:</p>${TANGENT_SVG}
              <ul class="big-list"><li>$f'(x) > 0$: stoupá,</li><li>$f'(x) < 0$: klesá,</li><li>$f'(x) = 0$: je to rovina (vrchol nebo dno).</li></ul>`),
            info('Počítání podle tabulky', `<p>Dobrá zpráva: derivace se nepočítá z obrázku. Má <b>tabulku</b> a <b>pár pravidel</b>, a s těmi zderivuješ cokoliv. Je to čistá mechanika.</p>${TABLE_HTML}
              <p class="muted">Tabulku se nemusíš učit nazpaměť předem. Zažiješ ji v příkladech. Teď začneme jen levým sloupcem a sinem s kosinem.</p>`),
            G.tableChoiceBasic, G.tableChoiceBasic, G.tableChoiceBasic, G.tableReverseBasic, G.tableChoiceBasic,
          ],
        },
      ],
    },
    {
      id: 'd2', title: 'Tabulka derivací', desc: 'Základ všeho. Musí jet sama.',
      lessons: [
        { id: 'd2l1', title: 'Tabulka poznávačka', cards: [info('Tabulka', TABLE_HTML), G.tableChoice, G.tableChoice, G.tableReverse, G.tableChoice, G.tableReverse, G.tableChoice, G.tableChoice, G.tableReverse] },
        {
          id: 'd2l2', title: 'Teď to napiš', cards: [
            info('Psaní vzorců', `<p>Pod políčkem je klávesnice s funkcemi. Můžeš psát i na klávesnici počítače:</p>
              <ul class="big-list"><li><b>sin(x)</b>, <b>cos(x)</b>, <b>ln(x)</b>, <b>e^x</b>, <b>sqrt(x)</b> nebo √</li><li><b>x^2</b> je $x^2$, <b>1/(2sqrt(x))</b> je $\\frac{1}{2\\sqrt{x}}$</li><li>Násobení můžeš vynechat: <b>2x cos(x)</b></li></ul>
              <p class="muted">Pod políčkem vždycky uvidíš, jak tvůj zápis čtu. Když to sedí s tím, co myslíš, je to dobře.</p>`),
            G.tableTyped, G.tableTyped, G.tableTyped, G.tableTyped, G.tableTyped, G.tableTyped,
          ],
        },
        { id: 'd2l3', title: 'Dril: tabulka', drill: true, cards: [drillInfo, ...mix(14, G.tableTyped, G.tableTyped, G.tableChoice)] },
      ],
    },
    {
      id: 'd3', title: 'Mocniny a odmocniny', desc: 'Exponent dopředu, o jedna míň.',
      lessons: [
        {
          id: 'd3l1', title: 'Mocninné pravidlo', cards: [
            info('Jedno pravidlo na všechno', `<div class="callout">$(x^n)' = n\\, x^{n-1}$</div>
              <p>Funguje i pro odmocniny a zlomky, jen je musíš nejdřív <b>přepsat na mocninu</b>:</p>
              <ul class="big-list"><li>$\\sqrt{x} = x^{\\frac{1}{2}}$, $\\sqrt[3]{x} = x^{\\frac{1}{3}}$, $\\sqrt[3]{x^2} = x^{\\frac{2}{3}}$</li><li>$\\frac{1}{x^3} = x^{-3}$, $\\frac{1}{\\sqrt{x}} = x^{-\\frac{1}{2}}$</li></ul>
              <p>Například $\\left(\\frac{1}{x^3}\\right)' = (x^{-3})' = -3x^{-4} = -\\frac{3}{x^4}$.</p>`),
            G.powerRule, G.powerRule, G.powerRule, G.powerRule, G.powerRule, G.powerRule,
          ],
        },
        { id: 'd3l2', title: 'Dril: mocniny', drill: true, cards: [drillInfo, ...mix(12, G.powerRule)] },
      ],
    },
    {
      id: 'd4', title: 'Součet a konstanta', desc: 'Každý člen zvlášť.',
      lessons: [
        {
          id: 'd4l1', title: 'Člen po členu', cards: [
            info('Dvě jednoduchá pravidla', `<ul class="big-list"><li><b>Součet:</b> derivuješ každý člen zvlášť: $(f + g)' = f' + g'$.</li><li><b>Číslo před funkcí</b> zůstane: $(3\\sin x)' = 3\\cos x$.</li><li><b>Samotné číslo</b> zmizí: $(7)' = 0$.</li></ul>
              <p>$(4x^3 - 2\\ln x + 7)' = 12x^2 - \\frac{2}{x}$</p>`),
            guided(G.linearCombo), guided(G.linearCombo), G.linearCombo, G.linearCombo, G.linearCombo,
          ],
        },
        { id: 'd4l2', title: 'Dril: součty', drill: true, cards: [drillInfo, ...mix(10, G.linearCombo)] },
      ],
    },
    {
      id: 'd5', title: 'Součin', desc: "(uv)' = u'v + uv'",
      lessons: [
        {
          id: 'd5l1', title: 'Derivace součinu', cards: [
            info('Součin', `<div class="callout">$(u \\cdot v)' = u' \\cdot v + u \\cdot v'$</div>
              <p>Slovy: <b>zderivuj první, druhou nech</b>, plus <b>první nech, zderivuj druhou</b>.</p>
              <p>$(x^2 \\sin x)' = 2x \\sin x + x^2 \\cos x$</p>
              <p class="muted">Častá past: derivace součinu <b>není</b> součin derivací.</p>`),
            guided(G.product), guided(G.product), semi(G.product), semi(G.product), G.product, G.product,
          ],
        },
        { id: 'd5l2', title: 'Dril: součin', drill: true, cards: [drillInfo, ...mix(10, G.product)] },
      ],
    },
    {
      id: 'd6', title: 'Podíl', desc: "(u/v)' = (u'v − uv') / v²",
      lessons: [
        {
          id: 'd6l1', title: 'Derivace podílu', cards: [
            info('Podíl', `<div class="callout">$\\left(\\frac{u}{v}\\right)' = \\frac{u' v - u v'}{v^2}$</div>
              <p>Stejně jako součin, jen <b>mínus</b> a celé to <b>děleno $v^2$</b>.</p>
              <p>$\\left(\\frac{x}{x+1}\\right)' = \\frac{1 \\cdot (x+1) - x \\cdot 1}{(x+1)^2} = \\frac{1}{(x+1)^2}$</p>
              <p class="muted">Výsledek nemusíš nijak upravovat. Kontrola pozná správnou odpověď v jakémkoli tvaru.</p>`),
            guided(G.quotient), guided(G.quotient), semi(G.quotient), G.quotient, G.quotient,
            video('Video: x² cos x / (x³ + 1)', '8e0b70d1-b6a2-43c1-ad9d-e581325178ba', 'Podíl, kde je v čitateli ještě součin.'),
            G.FIXED.dv2,
          ],
        },
        { id: 'd6l2', title: 'Dril: podíl', drill: true, cards: [drillInfo, ...mix(10, G.quotient, G.quotient, G.product)] },
      ],
    },
    {
      id: 'd7', title: 'Složená funkce', desc: 'Řetízek: vnější × vnitřní.',
      lessons: [
        {
          id: 'd7l1', title: 'Cibule', cards: [
            info('Funkce ve funkci', `<p>$\\sin(x^2)$ je <b>funkce ve funkci</b>, jako cibule: venku $\\sin\\square$, uvnitř $\\square = x^2$.</p>
              <p><b>Vnější</b> funkce je ta, která se na kalkulačce mačká <b>poslední</b>: nejdřív spočítáš $x^2$, pak $\\sin$.</p>`),
            G.cibuleQ, G.cibuleQ, G.cibuleQ, G.cibuleQ,
          ],
        },
        {
          id: 'd7l2', title: 'Řetízkové pravidlo', cards: [
            info('Vnější × vnitřní', `<div class="callout">$f(g(x))' = f'(g(x)) \\cdot g'(x)$</div>
              <ol class="steps-list recipe"><li>Zderivuj <b>vnější</b> funkci a vnitřek do ní jen opiš.</li><li>Vynásob <b>derivací vnitřku</b>.</li></ol>
              <p>$(\\sin(x^2))' = \\cos(x^2) \\cdot 2x$</p><p>$\\left(\\mathrm{e}^{3x}\\right)' = \\mathrm{e}^{3x} \\cdot 3$</p><p>$\\left((x^2+1)^5\\right)' = 5(x^2+1)^4 \\cdot 2x$</p>`),
            guided(G.chain), guided(G.chain), guided(G.chain), semi(G.chain), semi(G.chain), G.chain, G.chain,
            video('Video: ln(ln x)', 'e0042eae-9dd3-4f94-8366-1e7d09a280ff', 'Krátké video přesně na tohle pravidlo.'),
            G.FIXED.dv1,
          ],
        },
        {
          id: 'd7l3', title: 'Víc vrstev', cards: [
            info('Loupej dál', `<p>Když je vrstev víc, loupeš je jednu po druhé a <b>všechno vynásobíš</b>:</p>
              <p>$\\left(\\sin^2(3x)\\right)' = 2\\sin(3x) \\cdot \\cos(3x) \\cdot 3$</p><p class="muted">vrstvy: $\\square^2$, pak $\\sin\\square$, pak $3x$</p>`),
            guided(G.chain2), guided(G.chain2), semi(G.chain2), G.chain2, G.chain2, G.FIXED.d3,
          ],
        },
        { id: 'd7l4', title: 'Dril: řetízek', drill: true, cards: [drillInfo, ...mix(12, G.chain, G.chain, G.chain2)] },
      ],
    },
    {
      id: 'd8', title: 'Které pravidlo?', desc: 'Poznat, čím začít. Pak už to jede samo.',
      lessons: [
        {
          id: 'd8l1', title: 'Čím začít', cards: [
            info('Podívej se, co je navrchu', `<p>Každá funkce má „poslední operaci“, a ta určí první pravidlo:</p>
              <ul class="big-list"><li>navrchu <b>plus/mínus</b>: součet</li><li><b>krát</b>: součin</li><li><b>zlomek</b>: podíl</li><li><b>funkce uvnitř funkce</b>: řetízek</li><li>$x$ v základu <b>i</b> v exponentu: přes $\\mathrm{e}$</li></ul>
              <p class="muted">Míchání typů je pro mozek těžší, ale přesně proto se tak učí nejlíp.</p>`),
            G.ruleWhich, G.ruleWhich, G.ruleWhich, G.ruleWhich, G.ruleWhich, G.ruleWhich, G.ruleWhich, G.ruleWhich,
          ],
        },
        {
          id: 'd8l2', title: 'Smíšené příklady', cards: [
            video('Video: x² sin(x³ + x²)', '26acbf0d-c705-494f-b680-e6d952d831ec', 'Součin, kde je druhý činitel složená funkce. Kombinace pravidel.'),
            G.FIXED.dv3, ...mix(8, G.product, G.quotient, G.chain, G.linearCombo, G.chain2),
          ],
        },
        { id: 'd8l3', title: 'Dril: mix', drill: true, cards: [drillInfo, ...mix(12, G.ruleWhich, G.product, G.quotient, G.chain, G.chain2, G.linearCombo)] },
      ],
    },
    {
      id: 'd9', title: 'f(x) na g(x)', desc: 'Když je x v základu i v exponentu.',
      lessons: [
        {
          id: 'd9l1', title: 'Přes e', cards: [
            info('Trik s e', `<p>U $x^x$ nebo $(\\sin x)^{x^2}$ nepomůže ani $x^n$, ani $a^x$. Přepiš to:</p>
              <div class="callout">$f^g = \\mathrm{e}^{g \\ln f}$</div>
              <p>A teď je to obyčejný řetízek: $\\left(\\mathrm{e}^{\\square}\\right)' = \\mathrm{e}^{\\square} \\cdot \\square'$.</p>
              <p>$(x^x)' = \\left(\\mathrm{e}^{x \\ln x}\\right)' = x^x (\\ln x + 1)$</p>`),
            video('Video: (1 + x²)^x', 'a749e48e-1426-4b76-9c3a-6de4834cc6ee', 'Celý postup přes e na jednom příkladu.'),
            guided(G.fpowg), guided(G.fpowg), semi(G.fpowg), G.fpowg, G.FIXED.dv4, G.FIXED.d8,
          ],
        },
        { id: 'd9l2', title: 'Dril: f na g', drill: true, cards: [drillInfo, ...mix(8, G.fpowg), G.FIXED.d2] },
      ],
    },
    {
      id: 'd10', title: 'Tečna', desc: 'Kde se derivace hodí: rovnice tečny.',
      lessons: [
        {
          id: 'd10l1', title: 'Rovnice tečny', cards: [
            info('Přímka, která se grafu jen dotkne', `<p>Tečna v bodě $x_0$ má sklon $f'(x_0)$ a prochází bodem $[x_0, f(x_0)]$:</p>
              <div class="callout">$y = f(x_0) + f'(x_0)\\,(x - x_0)$</div>${TANGENT_SVG}
              <p>Postup je vždycky stejný: <b>hodnota</b>, <b>derivace</b>, <b>sklon</b>, <b>dosadit</b>.</p>`),
            G.GEN.tangent, G.GEN.tangent, G.FIXED.t1, G.GEN.tangent,
            video('Video: tečna k 1/√(x² − 3)', '363c2df6-072a-4760-9a11-34bf0cc85afa', 'Přesně tenhle postup na příkladu.'),
            G.FIXED.tv, G.FIXED.t2,
          ],
        },
        {
          id: 'd10l2', title: 'Rovnoběžné tečny', cards: [
            video('Video: tečny rovnoběžné s přímkou', '3a8143cf-eb30-4179-b9a1-2262726822dc', 'Tady neznáš bod dotyku, ale znáš sklon.'),
            G.FIXED.tpar, G.GEN.tangent, G.GEN.tangent,
          ],
        },
        { id: 'd10l3', title: 'Dril: tečny', drill: true, cards: [drillInfo, ...mix(6, G.GEN.tangent)] },
      ],
    },
    {
      id: 'd11', title: 'Série 2', desc: 'Opravdové příklady ze cvičení.',
      lessons: [
        {
          id: 'd11l1', title: 'Příklady ze Série 2', boss: true, cards: [
            info('Série 2', '<p>Tohle jsou příklady ze Série 2. Všechno, co na ně potřebuješ, už máš v ruce.</p><p class="muted">Nápověda je pořád k dispozici.</p>'),
            G.FIXED.d1, G.FIXED.d2, G.FIXED.d3, G.FIXED.d4, G.FIXED.d5, G.FIXED.d6, G.FIXED.d7, G.FIXED.d8, G.FIXED.d9, G.FIXED.t1, G.FIXED.t2,
          ],
        },
        { id: 'd11l2', title: 'Velký dril', drill: true, cards: [drillInfo, ...mix(14, G.powerRule, G.linearCombo, G.product, G.quotient, G.chain, G.chain, G.chain2, G.fpowg, G.tableTyped)] },
      ],
    },
  ],
  fluency: {
    id: 'fluency', title: 'Zkouška plynulosti',
    desc: '8 smíšených derivací. Měří se čas, ale jen pro tebe: žádný odpočet, žádný tlak.',
    pool: [G.linearCombo, G.product, G.quotient, G.chain, G.chain, G.chain2, G.fpowg, G.powerRule, G.GEN.tangent],
    count: 8,
  },
};
