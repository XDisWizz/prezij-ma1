// Obsah cesty "Limity posloupností a funkcí".
import * as G from './gen.js';
import { pick } from '../ui.js';
import { TABLE_HTML, RULES_HTML } from '../derivace/content.js';

const VIDEO = id => `https://opencast.vsb.cz/play/${id}`;
const info = (title, body) => () => ({ type: 'info', title, body });
const video = (title, id, body) => () => ({ type: 'video', title, url: VIDEO(id), body });
const { guided, semi } = G;
const mix = (n, ...fs) => Array.from({ length: n }, () => () => pick(fs)());
const drillInfo = info('Dril: jeden za druhým', `<p>Příklady jdou rovnou za sebou, bez vysvětlování mezi nimi. Na další přejdeš, až budeš chtít (Enter nebo Pokračovat).</p>
  <p class="muted">Výsledek můžeš psát i jako zlomek nebo s odmocninou: <b>3/4</b>, <b>√5</b>, <b>e^2</b>. Na ∞ a „neexistuje“ jsou tlačítka.</p>`);

const ARITH_TABLE = `<table class="rules">
  <tr><th>výraz</th><th>výsledek</th></tr>
  <tr><td>$\\infty + \\text{číslo}$, $\\infty + \\infty$, $\\infty \\cdot \\infty$</td><td>$\\infty$</td></tr>
  <tr><td>$\\frac{\\text{číslo}}{\\infty}$</td><td>$0$</td></tr>
  <tr><td>$\\frac{\\text{kladné číslo}}{0^+}$</td><td>$+\\infty$</td></tr>
  <tr><td>$\\infty - \\infty$, $\\frac{\\infty}{\\infty}$, $\\frac{0}{0}$, $0 \\cdot \\infty$, $1^\\infty$</td><td><b>neurčitý výraz</b>: musíš upravit</td></tr>
</table>`;

// Tahák: dá se otevřít kdykoli během lekce
const CHEAT = [
  { title: 'Počítání s nekonečnem', html: ARITH_TABLE + '<p class="muted">Neurčitý výraz neznamená „nejde to“. Znamená „nejdřív uprav“.</p>' },
  { title: 'Posloupnosti: který trik', html: `<table class="rules">
      <tr><th>vidím</th><th>udělám</th></tr>
      <tr><td>polynom lomeno polynom</td><td>nejvyšší mocniny: nižší nahoře → $0$, stejné → poměr čísel, vyšší nahoře → $\\pm\\infty$</td></tr>
      <tr><td>odmocniny v podílu</td><td>$\\sqrt{n^2} = n$, $\\sqrt{n^3} = n\\sqrt{n}$, pak totéž</td></tr>
      <tr><td>rozdíl odmocnin se stejným číslem u $n^2$</td><td>rozšiř součtem: $(A - B)\\frac{A + B}{A + B} = \\frac{A^2 - B^2}{A + B}$</td></tr>
      <tr><td>$2^n$, $3^n$, $5^n$</td><td>vyděl největším základem; $3^{2n} = 9^n$, $3^{n+2} = 9 \\cdot 3^n$</td></tr>
      <tr><td>$\\left(1 + \\frac{a}{n}\\right)^n$</td><td>$\\to \\mathrm{e}^a$</td></tr>
      <tr><td>$\\sqrt[n]{\\text{polynom}}$</td><td>$\\to 1$</td></tr>
      <tr><td>$\\frac{\\sin(\\dots)}{n}$, $\\frac{(-1)^n}{n}$</td><td>omezené lomeno nekonečnem $\\to 0$</td></tr>
    </table>
    <p>Kdo roste rychleji: $$\\ln n \\ll \\sqrt{n} \\ll n \\ll n^2 \\ll 2^n \\ll 3^n \\ll n! \\ll n^n$$</p>` },
  { title: 'Limita funkce', html: `<ol class="steps-list recipe"><li><b>Dosaď.</b> Vyjde číslo? Hotovo.</li><li>$\\frac{0}{0}$ nebo $\\frac{\\infty}{\\infty}$: <b>L'Hospital</b>, $\\lim \\frac{f}{g} = \\lim \\frac{f'}{g'}$ (čitatel a jmenovatel zvlášť, klidně víckrát).</li>
      <li>$0 \\cdot \\infty$: přepiš na zlomek, $f \\cdot g = \\frac{f}{1/g}$. Logaritmus nech nahoře.</li><li>$\\infty - \\infty$: společný jmenovatel, vyjde $\\frac{0}{0}$.</li><li>$1^\\infty$: $\\left(1 + \\frac{1}{x}\\right)^x \\to \\mathrm{e}$.</li></ol>
      <p>Pro $x \\to +\\infty$: $\\ln x \\ll x^k \\ll \\mathrm{e}^x$.</p>
      <p><b>Spojitost v bodě $c$:</b> limita zleva = limita zprava = $f(c)$.</p>` },
  { title: "Derivace pro L'Hospitala", html: TABLE_HTML + RULES_HTML },
  { title: 'Jak psát odpověď', html: `<p>Číslo piš jako zlomek nebo s odmocninou: <b>3/4</b>, <b>√5</b>, <b>e^2</b>, <b>-8/(3π)</b>. Na $+\\infty$, $-\\infty$ a „neexistuje“ jsou tlačítka (jde napsat i slovy „nekonečno“).</p>` },
];

export const PATH = {
  id: 'limity',
  cheat: CHEAT,
  title: 'Limity posloupností a funkcí',
  tagline: 'Kam to celé míří',
  units: [
    {
      id: 'l1', title: 'Co je limita', desc: 'Kam se to blíží, když n roste.',
      lessons: [
        {
          id: 'l1l1', title: 'Kam to míří', cards: [
            info('Posloupnost a její cíl', `<p>Posloupnost je řada čísel: $a_1, a_2, a_3, \\dots$ Třeba $a_n = \\frac{1}{n}$: $1, \\frac{1}{2}, \\frac{1}{3}, \\frac{1}{4}, \\dots$</p>
              <p><b>Limita</b> je číslo, ke kterému se posloupnost blíží, když $n$ roste do nekonečna. Tady $0$.</p>
              <p>Může to dopadnout třemi způsoby: <b>číslo</b>, <b>$\\pm\\infty$</b> (roste nade všechny meze), nebo <b>neexistuje</b> (skáče sem a tam).</p>`),
            G.basicSeq, G.basicSeq, G.basicSeq, G.basicSeq, G.basicSeq,
          ],
        },
        {
          id: 'l1l2', title: 'Počítání s nekonečnem', cards: [
            info('Nekonečno není číslo, ale…', ARITH_TABLE + '<p class="muted">Neurčité výrazy jsou celé kouzlo limit: celá další cesta je o tom, jak je rozlousknout.</p>'),
            G.infArith, G.infArith, G.infArith, G.infArith, G.infArith, G.infArith, G.infArith,
          ],
        },
        { id: 'l1l3', title: 'Dril: základy', drill: true, cards: [drillInfo, ...mix(12, G.infArith, G.basicSeq)] },
      ],
    },
    {
      id: 'l2', title: 'Polynom lomeno polynom', desc: 'Vyhraje nejvyšší mocnina.',
      lessons: [
        {
          id: 'l2l1', title: 'Nejvyšší mocnina rozhoduje', cards: [
            info('Kdo vyhraje', `<p>Pro obrovské $n$ je $n^3$ mnohem víc než $n^2$ nebo $9$. Rozhodují jen <b>nejvyšší mocniny</b>:</p>
              <ul class="big-list"><li>čitatel nižší stupeň → $0$</li><li>stejný stupeň → <b>poměr čísel</b> u nejvyšších mocnin</li><li>čitatel vyšší stupeň → $\\pm\\infty$</li></ul>
              <p>$\\lim \\frac{3n^2 - n + 7}{5n^2 + 2} = \\frac{3}{5}$</p><p class="muted">Formálně: vydělíš čitatel i jmenovatel nejvyšší mocninou jmenovatele.</p>`),
            video('Video: poměry polynomů', '69805b5b-556a-4dea-a225-663190cf5f6d', 'Tři příklady na stejné pravidlo.'),
            guided(G.ratPoly), guided(G.ratPoly), semi(G.ratPoly), G.ratPoly, G.ratPoly, G.FIXED.s1,
          ],
        },
        {
          id: 'l2l2', title: 'S odmocninou', cards: [
            info('Odmocnina mění stupeň', `<p>$\\sqrt{n^2} = n$, $\\sqrt{n^3} = n\\sqrt{n} = n^{3/2}$. Jinak stejné pravidlo: najdi nejvyšší mocninu.</p>`),
            video('Video: (2n − 5)/(3n + 15)', '9163b003-1d59-4d7f-a8dc-b9df9620ebee', 'Krátká rozcvička na dělení nejvyšší mocninou.'),
            guided(G.rootRatio), guided(G.rootRatio), semi(G.rootRatio), G.rootRatio, G.FIXED.s2,
          ],
        },
        { id: 'l2l3', title: 'Dril: polynomy', drill: true, cards: [drillInfo, ...mix(12, G.ratPoly, G.ratPoly, G.rootRatio)] },
      ],
    },
    {
      id: 'l3', title: 'Rozdíl odmocnin', desc: '∞ − ∞ a sdružený výraz.',
      lessons: [
        {
          id: 'l3l1', title: 'Sdružený výraz', cards: [
            info('Trik se vzorcem $A^2 - B^2$', `<p>$\\sqrt{n^2 + 4n} - n$ je typ $\\infty - \\infty$. Vynásob a vyděl <b>součtem</b>:</p>
              <p>$\\left(\\sqrt{n^2 + 4n} - n\\right) \\cdot \\frac{\\sqrt{n^2 + 4n} + n}{\\sqrt{n^2 + 4n} + n} = \\frac{n^2 + 4n - n^2}{\\sqrt{n^2 + 4n} + n} = \\frac{4n}{\\approx 2n} \\to 2$</p>
              <div class="callout">Když se čísla u $n$ pod odmocninami <b>liší</b>, nic rozšiřovat netřeba: vyhraje větší.</div>`),
            video('Video: rozdíly odmocnin', 'efd8a5cf-8259-4f78-8dd8-ec82acaa1463', 'Dva příklady se sdruženým výrazem.'),
            guided(G.conj), guided(G.conj), semi(G.conj), G.conj, G.conj, G.FIXED.s3, G.FIXED.s4,
          ],
        },
        { id: 'l3l2', title: 'Dril: odmocniny', drill: true, cards: [drillInfo, ...mix(10, G.conj)] },
      ],
    },
    {
      id: 'l4', title: 'Exponenciály', desc: 'Vyhraje největší základ.',
      lessons: [
        {
          id: 'l4l1', title: 'Největší základ', cards: [
            info('Stejný trik, jiný vítěz', `<p>U $2^n$, $3^n$, $5^n$ vyhraje <b>největší základ</b>. Vyděl jím čitatel i jmenovatel, zbytek jde k nule.</p>
              <p>Pozor na převleky: $3^{2n} = 9^n$, $2^{2n} = 4^n$, $3^{n+2} = 9 \\cdot 3^n$.</p>`),
            video('Video: exponenciály', '29c846c0-ca74-4cbd-bc7b-ff0139decad2', 'Dva příklady včetně převleků.'),
            guided(G.expoRatio), guided(G.expoRatio), semi(G.expoRatio), G.expoRatio, G.FIXED.s5,
          ],
        },
        { id: 'l4l2', title: 'Dril: exponenciály', drill: true, cards: [drillInfo, ...mix(10, G.expoRatio)] },
      ],
    },
    {
      id: 'l5', title: 'Speciální triky', desc: 'Souboj rychlostí, sevření, číslo e.',
      lessons: [
        {
          id: 'l5l1', title: 'Souboj gigantů', cards: [
            info('Kdo roste rychleji', `<p>$$\\ln n \\ll \\sqrt{n} \\ll n \\ll n^2 \\ll 2^n \\ll 3^n \\ll n! \\ll n^n$$</p><p>Když je rychlejší nahoře, limita je $\\infty$. Když dole, $0$.</p>`),
            G.growth, G.growth, G.growth, G.growth, G.growth,
          ],
        },
        {
          id: 'l5l2', title: 'Sevření', cards: [
            info('Omezené × nula = nula', `<p>$\\sin(\\text{cokoliv})$ je vždycky mezi $-1$ a $1$. Když to vydělíš něčím, co roste do nekonečna, výsledek se „sevře“ k nule.</p>`),
            video('Video: sin(…)/n', 'a3dd31da-b02e-41d9-89cb-dbb7e3f5cc06', 'Sinus s divokým argumentem, a stejně nula.'),
            G.squeeze, G.squeeze, G.squeeze, G.squeeze,
          ],
        },
        {
          id: 'l5l3', title: 'Číslo e', cards: [
            info('Typ $1^\\infty$', `<div class="callout">$\\lim \\left(1 + \\frac{a}{n}\\right)^n = \\mathrm{e}^a$</div><p>Když vidíš „skoro 1“ na $n$-tou, převeď to na tenhle tvar.</p>`),
            video('Video: ((3n + 1)/(3n))^n', '376deda0-38eb-48e3-a8cf-494a2ebe4fc4', 'Tři varianty, tři různé výsledky.'),
            guided(G.eLimit), guided(G.eLimit), semi(G.eLimit), G.eLimit,
            video('Video: n-tá odmocnina', 'bdff45df-a66b-4f63-8006-310d9ae8d120', 'n-tá odmocnina z polynomu jde k 1.'),
            G.nthRoot, G.nthRoot,
          ],
        },
        { id: 'l5l4', title: 'Dril: triky', drill: true, cards: [drillInfo, ...mix(12, G.growth, G.squeeze, G.eLimit, G.nthRoot)] },
      ],
    },
    {
      id: 'l6', title: 'Limita funkce', desc: 'Nejdřív vždycky dosaď.',
      lessons: [
        {
          id: 'l6l1', title: 'Dosaď a uvidíš', cards: [
            info('První krok je vždycky stejný', `<p>U $\\lim_{x \\to c} f(x)$ nejdřív <b>dosaď</b> $x = c$.</p><ul class="big-list"><li>Vyjde normální číslo? Hotovo.</li><li>Vyjde $\\frac{0}{0}$, $\\frac{\\infty}{\\infty}$, $0 \\cdot \\infty$…? Neurčitý výraz, jdeme upravovat.</li></ul>`),
            G.plugIn, G.plugIn, G.formType, G.formType, G.plugIn, G.formType, G.formType,
          ],
        },
        { id: 'l6l2', title: 'Dril: typy', drill: true, cards: [drillInfo, ...mix(10, G.formType, G.plugIn)] },
      ],
    },
    {
      id: 'l7', title: "L'Hospitalovo pravidlo", desc: '0/0 a ∞/∞: derivuj zvlášť.',
      lessons: [
        {
          id: 'l7l1', title: "L'Hospital", cards: [
            info('Nejsilnější zbraň', `<div class="callout">Když vyjde $\\frac{0}{0}$ nebo $\\frac{\\infty}{\\infty}$: $\\lim \\frac{f}{g} = \\lim \\frac{f'}{g'}$</div>
              <p>Pozor: <b>čitatel a jmenovatel derivuješ každý zvlášť</b>. Není to derivace podílu!</p>
              <p>$\\lim_{x \\to 0} \\frac{\\sin 3x}{2x} = \\lim_{x \\to 0} \\frac{3\\cos 3x}{2} = \\frac{3}{2}$</p>`),
            guided(G.lhopPoly), guided(G.lhopStd), guided(G.lhopStd), semi(G.lhopStd), semi(G.lhopPoly), G.lhopStd, G.lhopPoly,
            video('Video: sin x cos x / (x − 3π/2)', '59bcb989-93a9-4201-b3ae-5a22e359295e', "L'Hospital v bodě, který není nula."),
            G.FIXED.vs2,
          ],
        },
        {
          id: 'l7l2', title: 'Dvakrát a víckrát', cards: [
            info('Když to nestačí', '<p>Vyjde po prvním L\'Hospitalovi zase $\\frac{0}{0}$? Klidně ho použij <b>ještě jednou</b>.</p>'),
            video('Video: sin²x / (x − π)²', '855e3d15-3f87-48cc-9a4b-4bc3ce45ad04', 'Dvakrát za sebou.'),
            G.FIXED.vs3, G.lhopStd, G.FIXED.f4, G.FIXED.f7,
          ],
        },
        { id: 'l7l3', title: "Dril: L'Hospital", drill: true, cards: [drillInfo, ...mix(12, G.lhopStd, G.lhopStd, G.lhopPoly)] },
      ],
    },
    {
      id: 'l8', title: 'x jde do nekonečna', desc: 'Kdo roste rychleji.',
      lessons: [
        {
          id: 'l8l1', title: 'Souboj funkcí', cards: [
            info('Stejný souboj jako u posloupností', '<p>$\\ln x \\ll x^k \\ll \\mathrm{e}^x$. Logaritmus prohraje s každou mocninou, mocnina s exponenciálou.</p>'),
            video('Video: racionální funkce v nekonečnu', '82628e7a-2df9-4561-9d83-91c8cd26da87', 'Stejné pravidlo jako u posloupností.'),
            guided(G.infRatio), guided(G.infRatio), semi(G.infRatio), G.infRatio, G.FIXED.f1,
            video('Video: sin x / x', 'bdf7e484-1e92-4dcd-9c40-f804474a9709', 'V bodě 1 a v nekonečnu, dva různé příběhy.'),
            G.FIXED.vs4,
            video('Video: (1 + 1/x)^x', '15dd1381-f300-4d2d-99ff-adb1965d938c', 'Číslo e znovu, tentokrát u funkce.'),
            G.FIXED.vs7,
          ],
        },
        { id: 'l8l2', title: 'Dril: nekonečno', drill: true, cards: [drillInfo, ...mix(10, G.infRatio)] },
      ],
    },
    {
      id: 'l9', title: '0·∞ a ∞−∞', desc: 'Nejdřív převést na zlomek.',
      lessons: [
        {
          id: 'l9l1', title: 'Převeď na zlomek', cards: [
            info('Součin → zlomek', `<p>$0 \\cdot \\infty$ převedeš na zlomek: $f \\cdot g = \\frac{f}{1/g}$. Pak L'Hospital.</p>
              <p>$x^2 \\ln x = \\frac{\\ln x}{x^{-2}}$, logaritmus nech nahoře (jeho derivace je hezká).</p>`),
            video('Video: x² ln x', 'd8ecd231-cb9e-4616-9acd-98f17a3ae66e', 'Přesně tenhle trik.'),
            guided(G.zeroInf), guided(G.zeroInf), semi(G.zeroInf), G.zeroInf, G.FIXED.f2, G.FIXED.f5, G.FIXED.f6,
          ],
        },
        {
          id: 'l9l2', title: 'Rozdíl → zlomek', cards: [
            info('∞ − ∞', '<p>Dva zlomky odečti na <b>společný jmenovatel</b>. Vyjde $\\frac{0}{0}$ a dál už to znáš.</p>'),
            guided(G.infMinusInf), semi(G.infMinusInf), G.infMinusInf, G.FIXED.f3,
            video('Video: (x² − 1)/√(x − 1)', '8bd19811-7eff-4bac-8d9b-5b4f05a44635', 'Někdy stačí obyčejná úprava.'),
            G.FIXED.vs5,
          ],
        },
        { id: 'l9l3', title: 'Dril: převody', drill: true, cards: [drillInfo, ...mix(8, G.zeroInf, G.infMinusInf, G.formType)] },
      ],
    },
    {
      id: 'l10', title: 'Spojitost', desc: 'Když se graf nepřetrhne.',
      lessons: [
        {
          id: 'l10l1', title: 'Spojitost v bodě', cards: [
            info('Spojitá = jde nakreslit jedním tahem', `<p>Funkce je v bodě $c$ spojitá, když <b>limita zleva = limita zprava = hodnota</b> $f(c)$.</p>
              <p>U funkcí složených z kousků to znamená: kousky se v bodě $c$ musí <b>potkat</b>.</p>`),
            G.continuity, G.continuity, G.continuity,
            video('Video: x² sin(1/x)', 'd48987ae-649d-43b2-ad4d-a3d8e649daeb', 'Spojitost přes sevření.'),
            G.continuity,
          ],
        },
      ],
    },
    {
      id: 'l11', title: 'Série 3', desc: 'Opravdové příklady ze cvičení.',
      lessons: [
        {
          id: 'l11l1', title: 'Příklady ze Série 3', boss: true, cards: [
            info('Série 3', '<p>Pět posloupností a sedm funkcí ze Série 3. Všechno už máš v ruce.</p><p class="muted">Nápověda je pořád k dispozici.</p>'),
            G.FIXED.s1, G.FIXED.s2, G.FIXED.s3, G.FIXED.s4, G.FIXED.s5, G.FIXED.f1, G.FIXED.f2, G.FIXED.f3, G.FIXED.f4, G.FIXED.f5, G.FIXED.f6, G.FIXED.f7,
          ],
        },
        { id: 'l11l2', title: 'Velký dril', drill: true, cards: [drillInfo, ...mix(14, G.ratPoly, G.rootRatio, G.conj, G.expoRatio, G.eLimit, G.lhopStd, G.lhopPoly, G.infRatio, G.zeroInf, G.infMinusInf)] },
      ],
    },
  ],
  fluency: {
    id: 'fluency', title: 'Zkouška plynulosti',
    desc: '8 smíšených limit. Měří se čas, ale jen pro tebe: žádný odpočet, žádný tlak.',
    pool: [G.ratPoly, G.conj, G.expoRatio, G.eLimit, G.lhopStd, G.lhopPoly, G.infRatio, G.zeroInf, G.infMinusInf, G.rootRatio],
    count: 8,
  },
};
