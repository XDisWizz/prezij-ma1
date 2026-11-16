// Obsah cesty "Průběh funkce + Taylor".
import * as G from './gen.js';
import { pick } from '../ui.js';
import { TABLE_HTML, RULES_HTML } from '../derivace/content.js';

const VIDEO = id => `https://opencast.vsb.cz/play/${id}`;
const info = (title, body) => () => ({ type: 'info', title, body });
const video = (title, id, body) => () => ({ type: 'video', title, url: VIDEO(id), body });
const mix = (n, ...fs) => Array.from({ length: n }, () => () => pick(fs)());
const drillInfo = info('Dril: jeden za druhým', `<p>Příklady jdou rovnou za sebou, bez vysvětlování mezi nimi. Na další přejdeš, až budeš chtít (Enter nebo Pokračovat).</p>
  <p class="muted">Body piš oddělené středníkem: <b>-1; 3</b>. Když žádné nejsou, klikni na „žádné“.</p>`);

const CURVE = `<svg class="parabola" viewBox="0 0 240 120" aria-hidden="true">
  <line class="nl-axis" x1="10" y1="100" x2="230" y2="100"/>
  <path class="pb-curve" d="M15 95 C 50 10, 80 10, 110 55 S 170 110, 225 20"/>
  <circle class="nl-dot-in" cx="67" cy="30" r="5"/><text class="nl-label" x="67" y="20" text-anchor="middle">max</text>
  <circle class="nl-dot-in" cx="160" cy="88" r="5"/><text class="nl-label" x="160" y="114" text-anchor="middle">min</text>
  <text class="pb-sign st-plus" x="30" y="50">↗</text><text class="pb-sign st-minus" x="112" y="40">↘</text><text class="pb-sign st-plus" x="200" y="60">↗</text>
</svg>`;

// Tahák: dá se otevřít kdykoli během lekce
const CHEAT = [
  { title: 'Co říká která derivace', html: `<table class="rules">
      <tr><th>když</th><th>pak</th></tr>
      <tr><td>$f'(x) > 0$</td><td>funkce <b>roste</b> ↗</td></tr>
      <tr><td>$f'(x) < 0$</td><td>funkce <b>klesá</b> ↘</td></tr>
      <tr><td>$f'$ se mění z $+$ na $-$</td><td>lokální <b>maximum</b></td></tr>
      <tr><td>$f'$ se mění z $-$ na $+$</td><td>lokální <b>minimum</b></td></tr>
      <tr><td>$f' = 0$, ale znaménko se nemění</td><td>žádný extrém</td></tr>
      <tr><td>$f''(x) > 0$</td><td><b>konvexní</b> ∪</td></tr>
      <tr><td>$f''(x) < 0$</td><td><b>konkávní</b> ∩</td></tr>
      <tr><td>$f''$ mění znaménko</td><td><b>inflexní</b> bod</td></tr>
    </table>` },
  { title: 'Recept: monotonie a extrémy', html: `<ol class="steps-list recipe"><li>Spočítej $f'(x)$.</li><li>Vyřeš $f'(x) = 0$: vytkni, co jde, a rozlož na součin. Součin je nula, když je nula některý činitel. $\\mathrm{e}^{\\dots}$ není nula nikdy.</li>
      <li>Nulové body (a body, kde funkce není definovaná) rozdělí osu na úseky.</li><li>Z každého úseku dosaď jedno číslo do $f'$ a zapiš znaménko.</li><li>$+$ roste, $-$ klesá. Kde se znaménko mění, je extrém.</li></ol>
      <p class="muted">Pro konvexitu a inflexi je to stejné, jen s $f''$.</p>` },
  { title: 'Asymptoty', html: `<p><b>Svislá</b> $x = a$: tam, kde $\\lim_{x \\to a} f(x) = \\pm\\infty$. U zlomku nulové body jmenovatele, které se <b>nezkrátí</b> s čitatelem.</p>
      <div class="callout">Šikmá $y = kx + q$: $\\;k = \\lim \\frac{f(x)}{x}$, $\\;q = \\lim\\,(f(x) - kx)$</div>
      <p>Vyjde-li $k = 0$, je asymptota vodorovná: $y = q$. U podílu polynomů stačí porovnat nejvyšší mocniny.</p>` },
  { title: 'Globální extrémy na ⟨a, b⟩', html: `<p>Kandidáti: stacionární body <b>uvnitř</b> intervalu a oba <b>krajní body</b>. Spočítej v nich hodnoty $f$ a porovnej. Nejmenší je minimum, největší maximum.</p>` },
  { title: 'Taylorův polynom', html: `<div class="callout">$T_n(x) = f(x_0) + f'(x_0)(x - x_0) + \\frac{f''(x_0)}{2!}(x - x_0)^2 + \\frac{f'''(x_0)}{3!}(x - x_0)^3 + \\dots$</div>
      <p>$2! = 2$, $3! = 6$, $4! = 24$. Užitečné hodnoty: $\\sin 0 = 0$, $\\cos 0 = 1$, $\\sin \\pi = 0$, $\\cos \\pi = -1$, $\\sin\\frac{\\pi}{2} = 1$, $\\cos\\frac{\\pi}{2} = 0$, $\\mathrm{e}^0 = 1$, $\\ln 1 = 0$.</p>` },
  { title: 'Derivace (tabulka a pravidla)', html: TABLE_HTML + RULES_HTML },
  { title: 'Jak psát odpověď', html: `<p>Body odděl středníkem: <b>-1; 3</b>. Když žádné nejsou, napiš <b>žádné</b>. Intervaly: <b>(-inf, 1) U (3, inf)</b>, u monotonie a konvexity nezáleží na závorkách v krajních bodech.</p>` },
];

export const PATH = {
  id: 'prubeh',
  cheat: CHEAT,
  title: 'Průběh funkce + Taylor',
  tagline: 'Z rovnice obrázek',
  units: [
    {
      id: 'p1', title: 'Monotonie', desc: 'Kde funkce roste a kde klesá.',
      lessons: [
        {
          id: 'p1l1', title: 'Roste, nebo klesá?', cards: [
            info('Derivace je sklon', `<p>Derivace říká, jestli graf jde nahoru, nebo dolů:</p>${CURVE}
              <ul class="big-list"><li>$f'(x) > 0$: funkce <b>roste</b> ↗</li><li>$f'(x) < 0$: funkce <b>klesá</b> ↘</li></ul>`),
            info('Recept', `<ol class="steps-list recipe"><li>Spočítej $f'(x)$.</li><li>Najdi, kde je $f'(x) = 0$ (a kde funkce není definovaná).</li><li>Tyhle body rozdělí osu na úseky. V každém zjisti znaménko $f'$ (dosaď jedno číslo).</li><li>$+$ roste, $-$ klesá.</li></ol>
              <p class="muted">V krajních bodech se píše ⟨ i ( , obojí se počítá. Kontrola hlídá jen správné body.</p>`),
            G.conceptFor('mono'), G.GEN.mono, G.GEN.mono, G.GEN.mono,
            video('Video: (3x + 2) eˣ', '91f62a74-da36-448a-b0d1-cc1d29e36d37', 'Celý recept na jednom příkladu.'),
            G.GEN.mono, G.FIXED.m1,
          ],
        },
        {
          id: 'p1l2', title: 'Pozor na definiční obor', cards: [
            info('Body, kde funkce není', '<p>Když funkce v nějakém bodě není definovaná (třeba $\\frac{1}{x}$ v nule, nebo $\\ln x$ pro $x \\le 0$), osa se tam rozdělí taky. A úseky mimo definiční obor vůbec nepočítáš.</p>'),
            video('Video: x² − 2x − 4 ln x', 'b29faf90-1664-40f7-8e67-286602effad1', 'Logaritmus: počítá se jen pro x > 0.'),
            video('Video: x/9 + 1/x', '6cb948ff-7584-4736-b88c-55a683f1c5cf', 'Funkce s dírou v nule.'),
            G.GEN.mono, G.GEN.mono, G.FIXED.m2, G.GEN.mono,
          ],
        },
        { id: 'p1l3', title: 'Dril: monotonie', drill: true, cards: [drillInfo, ...mix(8, G.GEN.mono)] },
      ],
    },
    {
      id: 'p2', title: 'Lokální extrémy', desc: 'Vrcholy a údolí.',
      lessons: [
        {
          id: 'p2l1', title: 'Kopce a údolí', cards: [
            info('Extrém = změna znaménka', `<ul class="big-list"><li>$f'$ z $+$ na $-$: <b>maximum</b> (vrchol kopce)</li><li>$f'$ z $-$ na $+$: <b>minimum</b> (dno údolí)</li></ul>
              <div class="callout">$f'(x_0) = 0$ ještě neznamená extrém! Musí se změnit znaménko. Třeba $x^3$ má v nule $f' = 0$, a extrém tam nemá.</div>`),
            G.conceptFor('extrema'), G.conceptFor('extrema'), G.GEN.extrema, G.GEN.extrema,
            video('Video: x⁴ − 4x³ + 7', 'bbdf915b-2241-4c01-960e-34df57c7e607', 'Jeden ze stacionárních bodů extrém není.'),
            G.GEN.extrema, G.FIXED.e3,
          ],
        },
        {
          id: 'p2l2', title: 'Složitější funkce', cards: [
            video('Video: ln x / √x', '1a779b9a-29a5-4c83-9671-5f088e0fe788', 'Logaritmus a odmocnina.'),
            G.FIXED.e1, G.GEN.extrema,
            video('Video: √((x − 1)²)', '100208a8-ed46-4d2f-bd5e-20d39ddd62d9', 'Extrém i tam, kde derivace neexistuje.'),
            G.FIXED.e2, G.GEN.extrema,
          ],
        },
        { id: 'p2l3', title: 'Dril: extrémy', drill: true, cards: [drillInfo, ...mix(8, G.GEN.extrema)] },
      ],
    },
    {
      id: 'p3', title: 'Konvexita a inflexe', desc: 'Jak se graf ohýbá.',
      lessons: [
        {
          id: 'p3l1', title: 'Druhá derivace', cards: [
            info('∪ nebo ∩', `<ul class="big-list"><li>$f''(x) > 0$: <b>konvexní</b> ∪ (drží vodu)</li><li>$f''(x) < 0$: <b>konkávní</b> ∩</li><li><b>Inflexe</b>: bod, kde se ∪ mění na ∩ nebo naopak. Tedy kde $f''$ <b>mění znaménko</b>.</li></ul>
              <p class="muted">Postup je stejný jako u monotonie, jen s $f''$ místo $f'$.</p>`),
            G.conceptFor('convex'), G.GEN.inflection, G.GEN.inflection,
            video('Video: x⁵ − 10x⁴ + 30x³ + 7x + 1', '2f1d2869-7be7-475d-89e2-4734295aca34', 'Jen inflexní body.'),
            G.GEN.inflection, G.FIXED.i1,
            video('Video: 4 ln(1 − x) − 9 ln x', '72452252-1e98-4a25-afef-7a2119986085', 'Konvexita na omezeném definičním oboru.'),
          ],
        },
        { id: 'p3l2', title: 'Dril: inflexe', drill: true, cards: [drillInfo, ...mix(8, G.GEN.inflection)] },
      ],
    },
    {
      id: 'p4', title: 'Asymptoty', desc: 'Přímky, ke kterým se graf blíží.',
      lessons: [
        {
          id: 'p4l1', title: 'Svislé asymptoty', cards: [
            info('Kde graf utíká do nekonečna', `<p>Svislá asymptota $x = a$ je tam, kde $\\lim_{x \\to a} f(x) = \\pm\\infty$. U zlomků typicky v nulových bodech jmenovatele.</p>
              <div class="callout">Pozor: když se činitel zkrátí s čitatelem, asymptota tam <b>není</b> (je tam jen „díra“).</div>`),
            G.GEN.vertAsym, G.GEN.vertAsym, G.GEN.vertAsym, G.FIXED.a1,
            video('Video: x / sin x', 'c9a2e837-7feb-4988-86f4-dfc14e203794', 'Kde asymptoty jsou a kde ne.'),
          ],
        },
        {
          id: 'p4l2', title: 'Šikmé a vodorovné', cards: [
            info('y = kx + q', `<div class="callout">$k = \\lim_{x \\to \\pm\\infty} \\frac{f(x)}{x}$, $\\quad q = \\lim_{x \\to \\pm\\infty} (f(x) - kx)$</div>
              <p>Když vyjde $k = 0$, je asymptota vodorovná: $y = q$.</p>`),
            G.GEN.obliqueAsym, G.GEN.obliqueAsym, G.GEN.horizAsym, G.FIXED.a2,
            video('Video: (2x³ + 3x² − 5)/(x² − 1)', 'f83f3bf0-a1b9-49b9-9834-efadd4b3cf8d', 'Svislé i šikmá v jednom.'),
            G.GEN.obliqueAsym, G.GEN.horizAsym,
            video('Video: √(x² + 4x + 5)', '4c5dc0c2-26a6-44c2-9dc8-2fe844ff0584', 'V +∞ a −∞ dvě různé asymptoty.'),
            video('Video: x · arctg x', '8640afb2-7199-428d-9b4d-b644a3914f87', 'Šikmá asymptota s arctg.'),
          ],
        },
        { id: 'p4l3', title: 'Dril: asymptoty', drill: true, cards: [drillInfo, ...mix(8, G.GEN.vertAsym, G.GEN.obliqueAsym, G.GEN.horizAsym)] },
      ],
    },
    {
      id: 'p5', title: 'Globální extrémy', desc: 'Nejmenší a největší hodnota na intervalu.',
      lessons: [
        {
          id: 'p5l1', title: 'Kandidáti', cards: [
            info('Kdo vyhraje celý interval', `<p>Na uzavřeném intervalu $\\langle a, b \\rangle$ je nejmenší a největší hodnota vždycky v jednom z <b>kandidátů</b>:</p>
              <ul class="big-list"><li>stacionární body <b>uvnitř</b> intervalu,</li><li>oba <b>krajní body</b> $a$, $b$.</li></ul><p>Spočítáš hodnoty a porovnáš. Nic víc.</p>`),
            G.conceptFor('global'), G.GEN.globalExt, G.GEN.globalExt,
            video('Video: 2x³ + 3x² − 12x + 5 na ⟨−1, 2⟩', '84d18155-a162-4563-9ff0-f5a157eefc9d', 'Přesně tenhle postup.'),
            G.GEN.globalExt, G.FIXED.g1, G.FIXED.g2,
            video('Video: x + √(1 − x²)', 'f3011e58-c8f8-43a7-ad0e-f3eacd1dddd5', 'Extrémy na celém definičním oboru.'),
            video('Video: válec s nejmenším povrchem', '16e4e15d-bccd-43a7-a492-3f4594b788c1', 'Slovní úloha: kde se tohle hodí v praxi.'),
          ],
        },
        { id: 'p5l2', title: 'Dril: globální extrémy', drill: true, cards: [drillInfo, ...mix(6, G.GEN.globalExt)] },
      ],
    },
    {
      id: 'p6', title: 'Taylorův polynom', desc: 'Funkci nahradíme polynomem.',
      lessons: [
        {
          id: 'p6l1', title: 'Derivace v jednom bodě', cards: [
            info('Polynom, který funkci napodobí', `<p>Kolem bodu $x_0$ se dá funkce nahradit polynomem, který má v $x_0$ stejnou hodnotu, stejnou derivaci, stejnou druhou derivaci…</p>
              <div class="callout">$T_n(x) = f(x_0) + f'(x_0)(x - x_0) + \\frac{f''(x_0)}{2!}(x - x_0)^2 + \\dots + \\frac{f^{(n)}(x_0)}{n!}(x - x_0)^n$</div>
              <p>Recept: spočítej derivace, dosaď $x_0$, dosaď do vzorce. Pozor na faktoriál: $2! = 2$, $3! = 6$.</p>`),
            G.GEN.taylor, G.GEN.taylor,
            video('Video: Taylor pro x² + 8√x', 'ab5341a4-43b0-4a11-8150-28a0bdd23194', 'Třetí řád, střed v 1.'),
            G.GEN.taylor, G.FIXED.t1, G.FIXED.t2, G.FIXED.t3,
          ],
        },
        {
          id: 'p6l2', title: 'Rozvoj polynomu', cards: [
            video('Video: rozvoj podle mocnin (x − 1)', '3ee2ae1e-6914-4453-b793-826035064683', 'Polynom přepsaný kolem jiného bodu.'),
            G.GEN.polyShift, G.GEN.polyShift, G.GEN.taylor,
          ],
        },
        { id: 'p6l3', title: 'Dril: Taylor', drill: true, cards: [drillInfo, ...mix(6, G.GEN.taylor)] },
      ],
    },
    {
      id: 'p7', title: 'Všechno dohromady', desc: 'Celý průběh a Série 4.',
      lessons: [
        {
          id: 'p7l1', title: 'Celý průběh', cards: [
            info('Jeden recept na všechno', `<ol class="steps-list recipe"><li>$f'$ a stacionární body</li><li>znaménka $f'$: monotonie a extrémy</li><li>$f''$: konvexita a inflexe</li><li>asymptoty</li></ol><p>Teď to všechno na jedné funkci.</p>`),
            G.GEN.fullRun, G.GEN.fullRun, G.GEN.fullRun,
          ],
        },
        {
          id: 'p7l2', title: 'Příklady ze Série 4', boss: true, cards: [
            info('Série 4', '<p>Příklady ze Série 4. Všechno už máš v ruce.</p><p class="muted">Nápověda je pořád k dispozici.</p>'),
            G.FIXED.m1, G.FIXED.m2, G.FIXED.e1, G.FIXED.e2, G.FIXED.e3, G.FIXED.i1, G.FIXED.a1, G.FIXED.a2, G.FIXED.g1, G.FIXED.g2, G.FIXED.t1, G.FIXED.t2, G.FIXED.t3,
          ],
        },
        { id: 'p7l3', title: 'Velký dril', drill: true, cards: [drillInfo, ...mix(10, G.GEN.mono, G.GEN.extrema, G.GEN.inflection, G.GEN.vertAsym, G.GEN.obliqueAsym, G.GEN.globalExt, G.GEN.taylor)] },
      ],
    },
  ],
  fluency: {
    id: 'fluency', title: 'Zkouška plynulosti',
    desc: '6 smíšených úloh na průběh funkce. Měří se čas, ale jen pro tebe.',
    pool: [G.GEN.mono, G.GEN.extrema, G.GEN.inflection, G.GEN.obliqueAsym, G.GEN.globalExt, G.GEN.taylor, G.GEN.vertAsym],
    count: 6,
  },
};
