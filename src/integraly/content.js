// Obsah cesty "Neurčité integrály".
import * as G from './gen.js';
import { pick } from '../ui.js';

const VIDEO = id => `https://opencast.vsb.cz/play/${id}`;
const info = (title, body) => () => ({ type: 'info', title, body });
const video = (title, id, body) => () => ({ type: 'video', title, url: VIDEO(id), body });
const { guided, semi } = G;
const mix = (n, ...fs) => Array.from({ length: n }, () => () => pick(fs)());
const drillInfo = info('Dril: jeden za druhým', `<p>Příklady jdou rovnou za sebou, bez vysvětlování mezi nimi. Na další přejdeš, až budeš chtít (Enter nebo Pokračovat).</p>
  <p class="muted">„+ C“ psát nemusíš. Absolutní hodnotu napíšeš jako <b>|x|</b>, logaritmus jako <b>ln|x|</b>.</p>`);

const TABLE_HTML = `<table class="rules dtable">
  <tr><th>$f(x)$</th><th>$\\int f\\,\\mathrm{d}x$</th><th>$f(x)$</th><th>$\\int f\\,\\mathrm{d}x$</th></tr>
  <tr><td>$x^n$</td><td>$\\frac{x^{n+1}}{n+1}$</td><td>$\\sin x$</td><td>$-\\cos x$</td></tr>
  <tr><td>$\\frac{1}{x}$</td><td>$\\ln|x|$</td><td>$\\cos x$</td><td>$\\sin x$</td></tr>
  <tr><td>$\\mathrm{e}^x$</td><td>$\\mathrm{e}^x$</td><td>$\\frac{1}{\\cos^2 x}$</td><td>$\\operatorname{tg} x$</td></tr>
  <tr><td>$a^x$</td><td>$\\frac{a^x}{\\ln a}$</td><td>$\\frac{1}{\\sin^2 x}$</td><td>$-\\operatorname{cotg} x$</td></tr>
  <tr><td>$\\frac{1}{1+x^2}$</td><td>$\\operatorname{arctg} x$</td><td>$\\frac{1}{\\sqrt{1-x^2}}$</td><td>$\\arcsin x$</td></tr>
</table>`;

// Tahák: dá se otevřít kdykoli během lekce
const CHEAT = [
  { title: 'Tabulka integrálů', html: TABLE_HTML + `<p>$\\int x^n\\,\\mathrm{d}x = \\frac{x^{n+1}}{n+1}$ platí pro každé $n \\ne -1$, i pro odmocniny a zlomky: $\\sqrt{x} = x^{\\frac{1}{2}}$, $\\frac{1}{x^2} = x^{-2}$.</p>
      <p class="muted">Kontrola každého výsledku: zderivuj ho, musí vyjít funkce pod integrálem.</p>` },
  { title: 'Kterou metodu', html: `<ol class="steps-list recipe"><li>Je to v tabulce, případně po úpravě (rozdělit zlomek, zkrátit, převést na mocniny)? → <b>tabulka</b></li>
      <li>Uvnitř je $ax + b$? → integruj jako s $x$ a <b>vyděl $a$</b>: $\\int g(ax + b)\\,\\mathrm{d}x = \\frac{1}{a}G(ax + b)$</li>
      <li>Je vedle funkce (až na číslo) její derivace? → <b>substituce</b> $t = $ ta funkce</li>
      <li>Součin dvou různých typů (polynom × sin, cos, $\\mathrm{e}^x$; cokoliv × $\\ln x$)? → <b>per partes</b></li>
      <li>Polynom lomeno polynom? → <b>parciální zlomky</b></li></ol>` },
  { title: 'Substituce', html: `<ol class="steps-list recipe"><li>Zvol $t$ (to, co má vedle sebe svou derivaci).</li><li>$\\mathrm{d}t = t'\\,\\mathrm{d}x$, vyjádři z toho kus integrálu.</li><li>Přepiš celý integrál do $t$ a zintegruj.</li><li>Vrať zpátky $x$.</li></ol>
      <p>$\\int \\frac{f'(x)}{f(x)}\\,\\mathrm{d}x = \\ln|f(x)|$. Když vadí odmocnina: $t = \\sqrt{\\dots}$, vyjádři $x$ a $\\mathrm{d}x$.</p>` },
  { title: 'Per partes', html: `<div class="callout">$\\int u\\,v'\\,\\mathrm{d}x = u\\,v - \\int u'\\,v\\,\\mathrm{d}x$</div>
      <p>Za $u$ ber to, co se derivací zjednoduší: <b>polynom</b>, $\\ln x$, $\\operatorname{arctg} x$. Za $v'$ to, co umíš zintegrovat: $\\sin x$, $\\cos x$, $\\mathrm{e}^x$, mocninu.</p>
      <p>Polynom 2. stupně: per partes dvakrát. $\\int \\ln x\\,\\mathrm{d}x$: ber $v' = 1$.</p>` },
  { title: 'Parciální zlomky', html: `<table class="rules"><tr><th>jmenovatel</th><th>rozklad</th></tr>
      <tr><td>$(x - a)(x - b)$</td><td>$\\frac{A}{x - a} + \\frac{B}{x - b}$</td></tr>
      <tr><td>$(x - a)^2$</td><td>$\\frac{A}{x - a} + \\frac{B}{(x - a)^2}$</td></tr>
      <tr><td>$x(x^2 + 1)$</td><td>$\\frac{A}{x} + \\frac{Bx + C}{x^2 + 1}$</td></tr></table>
      <p><b>Zakrývací trik</b> pro $A$ u $(x - a)$: zakryj $(x - a)$ a do zbytku dosaď $x = a$.</p>
      <p>$\\int \\frac{A}{x - a} = A\\ln|x - a|$, $\\;\\int \\frac{B}{(x - a)^2} = -\\frac{B}{x - a}$, $\\;\\int \\frac{x}{x^2 + 1} = \\frac{1}{2}\\ln(x^2 + 1)$, $\\;\\int \\frac{1}{x^2 + 1} = \\operatorname{arctg} x$.</p>` },
  { title: 'Goniometrické vzorce', html: `<p>$\\sin^2 x + \\cos^2 x = 1$</p><p>$\\sin^2 x = \\frac{1 - \\cos 2x}{2}$, $\\;\\cos^2 x = \\frac{1 + \\cos 2x}{2}$</p>
      <p>$\\operatorname{tg}^2 x = \\frac{1}{\\cos^2 x} - 1$, $\\;\\operatorname{cotg}^2 x = \\frac{1}{\\sin^2 x} - 1$</p>
      <p><b>Lichá mocnina</b> sin nebo cos: oddělej jeden, zbytek přes $\\sin^2 = 1 - \\cos^2$, substituce. <b>Sudá mocnina</b>: vzorec s $\\cos 2x$.</p>` },
  { title: 'Jak psát odpověď', html: `<p>„+ C“ psát nemusíš. <b>ln|x|</b> napíšeš se svislítky (klávesa |x|), <b>x^(3/2)</b> je $x^{\\frac{3}{2}}$, <b>sin 2x</b> je $\\sin(2x)$. Projde jakýkoli správný tvar, kontroluje se derivováním.</p>` },
];

export const PATH = {
  id: 'integraly',
  cheat: CHEAT,
  title: 'Neurčité integrály',
  tagline: 'Derivace pozpátku',
  units: [
    {
      id: 'n1', title: 'Derivace pozpátku', desc: 'Co je integrál a tabulka.',
      lessons: [
        {
          id: 'n1l1', title: 'Hledej funkci', cards: [
            info('Integrál = derivace pozpátku', `<p>$\\int f(x)\\,\\mathrm{d}x$ je otázka: <b>která funkce má derivaci $f(x)$?</b></p>
              <p>$\\int 2x\\,\\mathrm{d}x = x^2 + C$, protože $(x^2)' = 2x$. To $+ C$ je tam proto, že konstanta se derivací ztratí.</p>
              <div class="callout">Super vlastnost: výsledek si vždycky můžeš <b>zkontrolovat derivováním</b>. Přesně tak to kontroluje i tahle aplikace.</div>`),
            info('Tabulka', TABLE_HTML + '<p class="muted">Je to tabulka derivací, jen čtená zprava doleva.</p>'),
            G.tableQ, G.tableQ, G.tableQ, G.tableQ, G.tableQ,
          ],
        },
        {
          id: 'n1l2', title: 'Teď to napiš', cards: [
            info('Psaní výsledku', '<p>„+ C“ psát nemusíš (ale můžeš). Logaritmus s absolutní hodnotou: <b>ln|x|</b>, klávesa |x| je mezi funkcemi.</p><p class="muted">Kontrola tvůj výsledek zderivuje, takže projde jakýkoli správný tvar.</p>'),
            G.tableTyped, G.tableTyped, G.tableTyped, G.tableTyped, G.tableTyped, G.tableTyped,
          ],
        },
        { id: 'n1l3', title: 'Dril: tabulka', drill: true, cards: [drillInfo, ...mix(12, G.tableTyped, G.tableTyped, G.tableQ)] },
      ],
    },
    {
      id: 'n2', title: 'Mocniny a úpravy', desc: 'Přepiš na mocniny, člen po členu.',
      lessons: [
        {
          id: 'n2l1', title: 'Člen po členu', cards: [
            info('Mocninné pravidlo', `<div class="callout">$\\int x^n\\,\\mathrm{d}x = \\frac{x^{n+1}}{n+1}$, pro $n \\ne -1$</div>
              <p>Exponent o jedna <b>zvětši</b> a tím novým číslem <b>vyděl</b>. Odmocniny a zlomky nejdřív přepiš: $\\sqrt{x} = x^{1/2}$, $\\frac{1}{x^3} = x^{-3}$.</p>
              <p>$\\int \\sqrt{x}\\,\\mathrm{d}x = \\frac{x^{3/2}}{3/2} = \\frac{2}{3}x^{3/2}$</p>`),
            guided(G.powerSum), guided(G.powerSum), semi(G.powerSum), G.powerSum, G.powerSum,
            video('Video: (2x² + √x + 3⁶√x − 12)/∛x', 'c6a576a9-853e-42ac-938f-54c3332e286c', 'Rozděl zlomek a všechno převeď na mocniny.'),
          ],
        },
        {
          id: 'n2l2', title: 'Nejdřív upravit', cards: [
            info('Zlomek? Rozděl nebo zkrať', '<p>$\\frac{x^2 + 3}{x} = x + \\frac{3}{x}$, $\\frac{x^2 - 4}{x - 2} = x + 2$. Po úpravě je to zase jen tabulka.</p>'),
            guided(G.rewrite), guided(G.rewrite), G.rewrite, G.FIXED.i1, G.FIXED.i2,
            video('Video: cotg² x', '1b4a4740-fb44-4678-8b7d-125967c849d5', 'Úprava goniometrické funkce na tabulku.'),
          ],
        },
        { id: 'n2l3', title: 'Dril: mocniny', drill: true, cards: [drillInfo, ...mix(10, G.powerSum, G.rewrite)] },
      ],
    },
    {
      id: 'n3', title: 'Lineární vnitřek', desc: '∫ g(ax + b): vyděl a.',
      lessons: [
        {
          id: 'n3l1', title: 'Vyděl číslem u x', cards: [
            info('Nejrychlejší substituce', `<div class="callout">$\\int g(ax + b)\\,\\mathrm{d}x = \\frac{1}{a}G(ax + b)$</div>
              <p>Zintegruj, jako by uvnitř bylo jen $x$, a vyděl číslem u $x$. Kontrola: zderivuj, a vnitřní derivace $a$ se s $\\frac{1}{a}$ pokrátí.</p>
              <p>$\\int \\mathrm{e}^{3x + 7}\\,\\mathrm{d}x = \\frac{1}{3}\\mathrm{e}^{3x + 7}$</p>`),
            guided(G.linSub), guided(G.linSub), G.linSub, G.linSub, G.FIXED.i6,
            video('Video: sin(2x + √3)', '713ebcb2-d223-4136-9ece-e292fbf38c17', 'Přesně tenhle trik.'),
          ],
        },
        { id: 'n3l2', title: 'Dril: lineární vnitřek', drill: true, cards: [drillInfo, ...mix(10, G.linSub)] },
      ],
    },
    {
      id: 'n4', title: 'Substituce', desc: 'Vedle funkce je její derivace.',
      lessons: [
        {
          id: 'n4l1', title: 'Najdi t', cards: [
            info('Kdy substituovat', `<p>Když v integrálu vidíš nějakou funkci <b>a vedle ní její derivaci</b> (až na číslo), zvol tu funkci za $t$:</p>
              <p>$\\int x^2\\sqrt{x^3 + 1}\\,\\mathrm{d}x$: $t = x^3 + 1$, $\\mathrm{d}t = 3x^2\\,\\mathrm{d}x$, takže $= \\frac{1}{3}\\int\\sqrt{t}\\,\\mathrm{d}t = \\frac{2}{9}t^{3/2}$.</p>
              <div class="callout">Na konci nezapomeň vrátit $x$ zpátky.</div>`),
            video('Video: ln x / x', '3eb8170b-4d5b-46fd-b18a-5f1f94b09f04', 'Nejjednodušší ukázka substituce.'),
            guided(G.subst), guided(G.subst), guided(G.subst), semi(G.subst), G.subst, G.FIXED.i7, G.FIXED.i8,
            video('Video: tg x', '99e081fa-c7b5-4952-a54c-1ef114dc2eea', 'Derivace jmenovatele v čitateli.'),
          ],
        },
        { id: 'n4l2', title: 'Dril: substituce', drill: true, cards: [drillInfo, ...mix(10, G.subst)] },
      ],
    },
    {
      id: 'n5', title: 'Per partes', desc: 'Součin dvou různých funkcí.',
      lessons: [
        {
          id: 'n5l1', title: 'u a v', cards: [
            info('Integrace po částech', `<div class="callout">$\\int u\\,v'\\,\\mathrm{d}x = u\\,v - \\int u'\\,v\\,\\mathrm{d}x$</div>
              <p>Za $u$ zvol to, co se <b>derivací zjednoduší</b>: polynom, $\\ln x$, $\\operatorname{arctg} x$. Za $v'$ to, co umíš zintegrovat: $\\sin x$, $\\cos x$, $\\mathrm{e}^x$, mocninu.</p>`),
            video('Video: (2x + 1) sin x', '8275fe82-8273-480f-974b-a84cdaa64e62', 'Klasický příklad.'),
            guided(G.byPartsEasy), guided(G.byPartsEasy), semi(G.byPartsEasy), G.byPartsEasy, G.FIXED.i3,
          ],
        },
        {
          id: 'n5l2', title: 'Logaritmy a triky', cards: [
            video('Video: x · arctg x', 'd304ce21-a6bb-4421-a4a4-10e090668ab7', 'u = arctg x.'),
            video('Video: ln² x', 'f662d716-e12b-4254-808b-5b46285b30ab', 'Per partes dvakrát.'),
            G.FIXED.i5, G.byParts, G.FIXED.i4,
            video('Video: eˣ sin x', '75e47e4c-660d-4742-b89e-a67b71754dc4', 'Integrál, který se „vrátí“ sám do sebe.'),
            G.byParts,
          ],
        },
        { id: 'n5l3', title: 'Dril: per partes', drill: true, cards: [drillInfo, ...mix(8, G.byParts)] },
      ],
    },
    {
      id: 'n6', title: 'Parciální zlomky', desc: 'Racionální funkce rozlož na kousky.',
      lessons: [
        {
          id: 'n6l1', title: 'Rozklad', cards: [
            info('Zlomek → součet jednoduchých', `<p>$\\frac{x + 3}{x^2 - 1} = \\frac{A}{x - 1} + \\frac{B}{x + 1}$, a každý kousek je $\\ln|\\dots|$.</p>
              <div class="callout"><b>Zakrývací trik:</b> $A$ = zakryj $(x - 1)$ a do zbytku dosaď $x = 1$: $\\frac{1 + 3}{1 + 1} = 2$.</div>
              <p class="muted">Dvojnásobný kořen: $\\frac{A}{x - a} + \\frac{B}{(x - a)^2}$. Člen $x^2 + 1$: $\\frac{Bx + C}{x^2 + 1}$.</p>`),
            video('Video: (5x − 7)/(x² − 2x − 3)', 'e6fd7395-dfed-44d2-923a-fd9738e522a4', 'Dva různé kořeny.'),
            guided(G.partial), guided(G.partial), guided(G.partial), G.partial, G.FIXED.i9, G.FIXED.i10,
            video('Video: (5x + 1)/((x + 2)(x − 1)²)', '2a626cd7-4cfd-4dc9-865b-4ddc4b8a26fc', 'Dvojnásobný kořen.'),
            video('Video: (5x + 1)/(x² − 4x + 7)', '9d0a9bfa-0679-4b4f-a1ce-9d53aaf0695e', 'Jmenovatel bez reálných kořenů.'),
          ],
        },
        { id: 'n6l2', title: 'Dril: zlomky', drill: true, cards: [drillInfo, ...mix(8, G.partial)] },
      ],
    },
    {
      id: 'n7', title: 'Goniometrické a odmocniny', desc: 'Speciální typy.',
      lessons: [
        {
          id: 'n7l1', title: 'sin a cos na mocninu', cards: [
            info('Dva triky', `<ul class="big-list"><li><b>Lichá mocnina:</b> oddělej jeden $\\sin x$ (nebo $\\cos x$), zbytek přes $\\sin^2 = 1 - \\cos^2$, substituce.</li><li><b>Sudá mocnina:</b> $\\sin^2 x = \\frac{1 - \\cos 2x}{2}$, $\\cos^2 x = \\frac{1 + \\cos 2x}{2}$.</li></ul>`),
            video('Video: sin³x cos²x', 'e5d7afb9-b526-4c27-af4a-e97e1a24afe3', 'Lichá mocnina sinu.'),
            G.trig, G.trig, G.FIXED.i11, G.trig, G.FIXED.i12,
            video('Video: sin⁴ x', 'e9b103dd-2fcc-4eaa-a3b4-f37a60ae1e01', 'Sudá mocnina, vzorec dvakrát.'),
          ],
        },
        {
          id: 'n7l2', title: 'Schovej odmocninu do t', cards: [
            info('t = √(…)', '<p>Když integrálu kazí život odmocnina, zvol ji za $t$: $t = \\sqrt{x}$, tedy $x = t^2$ a $\\mathrm{d}x = 2t\\,\\mathrm{d}t$. Odmocnina zmizí.</p>'),
            guided(G.rootSub), guided(G.rootSub), G.FIXED.i13, G.FIXED.i14,
            video('Video: 1/(√x(∛x + 1))', 'd151cc96-5d03-49a4-bf95-5185bf089a4e', 'Dvě různé odmocniny najednou.'),
          ],
        },
        { id: 'n7l3', title: 'Dril: speciální', drill: true, cards: [drillInfo, ...mix(8, G.trig, G.rootSub)] },
      ],
    },
    {
      id: 'n8', title: 'Která metoda?', desc: 'Zamíchané příklady a Série 5.',
      lessons: [
        {
          id: 'n8l1', title: 'Poznej metodu', cards: [
            info('Rozhodovací strom', `<ol class="steps-list recipe"><li>Je to v tabulce (případně po úpravě)? → tabulka</li><li>Je vedle funkce její derivace? Lineární vnitřek? → substituce</li><li>Součin dvou různých typů funkcí? → per partes</li><li>Polynom lomeno polynom? → parciální zlomky</li></ol>`),
            G.methodQ, G.methodQ, G.methodQ, G.methodQ, G.methodQ, G.methodQ, G.methodQ, G.methodQ,
          ],
        },
        {
          id: 'n8l2', title: 'Příklady ze Série 5', boss: true, cards: [
            info('Série 5', '<p>Všech 14 integrálů ze Série 5. Teď už na každý máš metodu.</p><p class="muted">Nápověda je pořád k dispozici.</p>'),
            G.FIXED.i1, G.FIXED.i2, G.FIXED.i3, G.FIXED.i4, G.FIXED.i5, G.FIXED.i6, G.FIXED.i7, G.FIXED.i8, G.FIXED.i9, G.FIXED.i10, G.FIXED.i11, G.FIXED.i12, G.FIXED.i13, G.FIXED.i14,
          ],
        },
        { id: 'n8l3', title: 'Velký dril', drill: true, cards: [drillInfo, ...mix(14, G.methodQ, G.powerSum, G.rewrite, G.linSub, G.subst, G.byParts, G.partial, G.trig, G.rootSub)] },
      ],
    },
  ],
  fluency: {
    id: 'fluency', title: 'Zkouška plynulosti',
    desc: '8 smíšených integrálů. Měří se čas, ale jen pro tebe: žádný odpočet, žádný tlak.',
    pool: [G.powerSum, G.rewrite, G.linSub, G.subst, G.subst, G.byParts, G.partial, G.trig, G.rootSub],
    count: 8,
  },
};
