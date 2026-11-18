// Základy matematiky: obsah všech cest (lekce, vysvětlení, taháky).
// Každá cesta míří na jeden typ příkladu z testu (6 příkladů, 30 bodů).
import { pick, shuffle } from '../ui.js';
import * as K from './komplex/gen.js';
import * as G from './gonio/gen.js';
import * as Q from './rovnice/gen.js';
import * as F from './grafy/gen.js';
import * as V from './geometrie/gen.js';
import { circle, gauss, graph } from './plot.js';
import { radTex, NICE } from './trig.js';
import { options } from './form.js';

const R = String.raw;
const info = (title, body) => () => ({ type: 'info', title, body });
const mix = (n, ...fs) => Array.from({ length: n }, () => () => pick(fs)());
const times = (n, f) => Array(n).fill(f);
const drillInfo = info('Dril: jeden za druhým', '<p>Bez vysvětlování mezi příklady. Cíl: aby postup šel sám, bez přemýšlení nad tím, co dělat dál.</p><p class="muted">Na další přejdeš Enterem nebo tlačítkem Pokračovat.</p>');
const bossInfo = (what) => info('Přesně jako v testu', `<p>${what}</p><p class="muted">Zadání jsou z testů z minulých let. Na papíře k tomu patří i postup, tady stačí výsledek.</p>`);
const I = '\\mathrm{i}';

// =====================================================================
// 1. Komplexní čísla: algebraický tvar
// =====================================================================
const K_CHEAT = [
  { title: 'Základ', html: R`<div class="callout">$\mathrm{i}^2 = -1$</div><p>$z = a + b\mathrm{i}$: $a = \operatorname{Re} z$ (reálná část), $b = \operatorname{Im} z$ (imaginární část, <b>bez</b> $\mathrm{i}$).</p>
    <p>Mocniny se opakují po 4: $\mathrm{i}, -1, -\mathrm{i}, 1, \mathrm{i}, \dots$ Exponent vyděl 4 a podívej se na zbytek.</p>` },
  { title: 'Počítání', html: R`<p><b>Plus, mínus:</b> reálné zvlášť, imaginární zvlášť.</p>
    <p><b>Krát:</b> roznásob jako závorky, $\mathrm{i}^2$ nahraď $-1$.</p>
    <p><b>Na druhou:</b> $(a + b\mathrm{i})^2 = a^2 - b^2 + 2ab\,\mathrm{i}$. Speciálně $(1 + \mathrm{i})^2 = 2\mathrm{i}$.</p>
    <p><b>Na třetí:</b> $z^3 = z^2\cdot z$.</p>` },
  { title: 'Dělení', html: R`<p>$\bar z$ = komplexně sdružené: $\overline{a + b\mathrm{i}} = a - b\mathrm{i}$. Platí $z\cdot\bar z = a^2 + b^2$.</p>
    <div class="callout">$\frac{u}{c + d\mathrm{i}} = \frac{u\,(c - d\mathrm{i})}{c^2 + d^2}$</div><p>Rozšiř sdruženým, dole vyjde reálné číslo, pak vyděl reálnou i imaginární část zvlášť.</p>` },
  { title: 'Gaussova rovina', html: R`<p>Vodorovná osa = $\operatorname{Re} z$, svislá = $\operatorname{Im} z$. Číslo $a + b\mathrm{i}$ je bod $[a;\ b]$.</p>` + gauss([{ re: 3, im: 2, label: '3 + 2i' }, { re: -2, im: -1, label: '−2 − i' }], { W: 220, H: 220 }) },
  { title: 'Jak psát odpověď', html: '<p>Piš <b>a + bi</b>, třeba <b>-2 + 2i</b> nebo <b>3/10 - 1/10 i</b>. Odmocnina: <b>4√3</b>. Projde jakýkoli správný zápis, kontroluje se hodnota.</p>' },
];
const KOMPLEX = {
  id: 'zm-komplex', title: 'Komplexní čísla', tagline: 'Algebraický tvar a + bi', cheat: K_CHEAT,
  units: [
    {
      id: 'zk1', title: 'Co je i', desc: 'Číslo, jehož druhá mocnina je −1.',
      lessons: [
        { id: 'zk1l1', title: 'i² = −1', cards: [
          info('Číslo, které „nemá existovat“', R`<p>Rovnice $x^2 = -1$ v reálných číslech nemá řešení: každé číslo na druhou je kladné nebo nula.</p>
            <p>Matematici si tedy přidali nové číslo $\mathrm{i}$ s jedinou vlastností:</p><div class="callout">$\mathrm{i}^2 = -1$</div>
            <p>Komplexní číslo je pak $z = a + b\mathrm{i}$. Číslo $a$ je <b>reálná část</b> ($\operatorname{Re} z$), číslo $b$ <b>imaginární část</b> ($\operatorname{Im} z$). Pozor: imaginární část je jen to číslo, <b>bez</b> $\mathrm{i}$.</p>
            <p class="muted">$z = 4 - 3\mathrm{i}$: $\operatorname{Re} z = 4$, $\operatorname{Im} z = -3$.</p>`),
          K.reIm, K.reIm, K.reIm, K.reIm,
          info('Mocniny i jdou dokola', R`<table class="rules"><tr><th>$\mathrm{i}^1$</th><th>$\mathrm{i}^2$</th><th>$\mathrm{i}^3$</th><th>$\mathrm{i}^4$</th></tr><tr><td>$\mathrm{i}$</td><td>$-1$</td><td>$-\mathrm{i}$</td><td>$1$</td></tr></table>
            <p>Pak se to opakuje: $\mathrm{i}^5 = \mathrm{i}$, $\mathrm{i}^6 = -1$… Takže u $\mathrm{i}^{n}$ stačí <b>zbytek po dělení 4</b>.</p><p class="muted">$\mathrm{i}^{23}$: $23 = 5\cdot 4 + 3$, takže $\mathrm{i}^{23} = \mathrm{i}^3 = -\mathrm{i}$.</p>`),
          K.iPow, K.iPow, K.iPow, K.iPow,
        ] },
        { id: 'zk1l2', title: 'Gaussova rovina', cards: [
          info('Komplexní číslo = bod', R`<p>Komplexní čísla se kreslí do roviny: vodorovně reálná část, svisle imaginární. Číslo $a + b\mathrm{i}$ je bod $[a;\ b]$, úplně jako souřadnice v grafu.</p>` + gauss([{ re: 3, im: 2, label: '3 + 2i' }, { re: -2, im: 3, label: '−2 + 3i' }, { re: 1, im: -3, label: '1 − 3i' }], { W: 240, H: 240 })),
          K.gaussPick, K.gaussPick, K.gaussRead, K.gaussRead, K.gaussRead, K.gaussRead,
        ] },
        { id: 'zk1l3', title: 'Dril: i a rovina', drill: true, cards: [drillInfo, ...mix(10, K.reIm, K.iPow, K.gaussRead, K.gaussPick)] },
      ],
    },
    {
      id: 'zk2', title: 'Sčítání a násobení', desc: 'Jako závorky s x, jen i² = −1.',
      lessons: [
        { id: 'zk2l1', title: 'Plus a mínus', cards: [
          info('Každá část zvlášť', R`<p>$(2 + 3\mathrm{i}) + (4 - \mathrm{i}) = (2 + 4) + (3 - 1)\mathrm{i} = 6 + 2\mathrm{i}$</p><p>Jako když sčítáš $2 + 3x$ a $4 - x$. U mínus před závorkou se otočí obě znaménka.</p>`),
          ...times(5, K.addSub),
        ] },
        { id: 'zk2l2', title: 'Násobení', cards: [
          info('Roznásob a nahraď i²', R`<p>$(2 + 3\mathrm{i})(1 - 2\mathrm{i})$: každý s každým:</p><p>$2 - 4\mathrm{i} + 3\mathrm{i} - 6\mathrm{i}^2$</p><p>$\mathrm{i}^2 = -1$, takže $-6\mathrm{i}^2 = +6$:</p><p>$= 2 + 6 - 4\mathrm{i} + 3\mathrm{i} = 8 - \mathrm{i}$</p><div class="callout">Pozor na znaménko: $\mathrm{i}\cdot\mathrm{i}$ dává <b>mínus</b> jedna. Tady se chybuje nejčastěji.</div>`),
          K.mulGuided, K.mulGuided, ...times(4, K.mulCx),
        ] },
        { id: 'zk2l3', title: 'Mocniny', cards: [
          info('Na druhou a na třetí', R`<p>Vzorec $(A + B)^2 = A^2 + 2AB + B^2$ funguje i tady, jen $B^2$ obsahuje $\mathrm{i}^2 = -1$:</p><div class="callout">$(a + b\mathrm{i})^2 = a^2 - b^2 + 2ab\,\mathrm{i}$</div>
            <p>Třetí mocnina: $z^3 = z^2\cdot z$. Nejdřív druhá mocnina, pak ještě jednou vynásobit.</p><p class="muted">Z testu: $(1 + \mathrm{i})^3$. $(1 + \mathrm{i})^2 = 1 - 1 + 2\mathrm{i} = 2\mathrm{i}$, pak $2\mathrm{i}(1 + \mathrm{i}) = 2\mathrm{i} + 2\mathrm{i}^2 = -2 + 2\mathrm{i}$.</p>`),
          K.powGuided, K.powGuided, ...times(4, K.powCx),
        ] },
        { id: 'zk2l4', title: 'Dril: počítání', drill: true, cards: [drillInfo, ...mix(10, K.addSub, K.mulCx, K.powCx)] },
      ],
    },
    {
      id: 'zk3', title: 'Dělení', desc: 'Rozšiř zlomek sdruženým číslem.',
      lessons: [
        { id: 'zk3l1', title: 'Komplexně sdružené', cards: [
          info('Zrcadlo podle osy Re', R`<p>Komplexně sdružené číslo $\bar z$ má opačné znaménko u $\mathrm{i}$: $\overline{3 + 4\mathrm{i}} = 3 - 4\mathrm{i}$.</p>
            <div class="callout">$z\cdot\bar z = (a + b\mathrm{i})(a - b\mathrm{i}) = a^2 + b^2$</div><p>Vyjde vždycky obyčejné kladné číslo, $\mathrm{i}$ zmizí. Přesně tohle se hodí při dělení.</p>`),
          ...times(4, K.conj),
        ] },
        { id: 'zk3l2', title: 'Zlomek s i dole', cards: [
          info('Trik: rozšířit sdruženým', R`<p>$\frac{1}{3 + \mathrm{i}}$: v jmenovateli nesmí zůstat $\mathrm{i}$. Rozšiř zlomek číslem $3 - \mathrm{i}$ (sdružené ke jmenovateli):</p>
            <p>$\frac{1}{3 + \mathrm{i}}\cdot\frac{3 - \mathrm{i}}{3 - \mathrm{i}} = \frac{3 - \mathrm{i}}{9 + 1} = \frac{3 - \mathrm{i}}{10} = \frac{3}{10} - \frac{1}{10}\mathrm{i}$</p>
            <div class="callout">Jmenovatel je vždycky $c^2 + d^2$. Čitatel roznásob jako u násobení.</div>`),
          K.divGuided, K.divGuided, ...times(4, K.divCx),
        ] },
        { id: 'zk3l3', title: 'Dril: všechno', drill: true, cards: [drillInfo, ...mix(10, K.divCx, K.mulCx, K.powCx, K.conj)] },
      ],
    },
    {
      id: 'zk4', title: 'Jako v testu', desc: 'Příklad 1 z minulých let.',
      lessons: [
        { id: 'zk4l1', title: 'Příklad 1 z testu', boss: true, cards: [bossInfo('Varianta A: $(1 + \\mathrm{i})^3$ a $\\frac{1}{3 + \\mathrm{i}}$. Varianta B: číslo z obrázku.'), K.FIXED.A1a, K.FIXED.A1b, K.FIXED.B1a, K.powCx, K.divCx] },
        { id: 'zk4l2', title: 'Velký dril', drill: true, cards: [drillInfo, ...mix(12, K.addSub, K.mulCx, K.powCx, K.divCx, K.gaussRead, K.iPow)] },
      ],
    },
  ],
  fluency: { id: 'fluency', title: 'Zkouška plynulosti', desc: '8 smíšených příkladů. Měří se čas, ale jen pro tebe.', pool: [K.addSub, K.mulCx, K.powCx, K.powCx, K.divCx, K.divCx, K.gaussRead, K.iPow], count: 8 },
};

// =====================================================================
// 2. Goniometrický tvar
// =====================================================================
const TRIG_TABLE = R`<table class="rules"><tr><th>$\varphi$</th><th>$0^\circ$</th><th>$30^\circ$</th><th>$45^\circ$</th><th>$60^\circ$</th><th>$90^\circ$</th></tr>
  <tr><td>$\sin$</td><td>$0$</td><td>$\frac{1}{2}$</td><td>$\frac{\sqrt{2}}{2}$</td><td>$\frac{\sqrt{3}}{2}$</td><td>$1$</td></tr>
  <tr><td>$\cos$</td><td>$1$</td><td>$\frac{\sqrt{3}}{2}$</td><td>$\frac{\sqrt{2}}{2}$</td><td>$\frac{1}{2}$</td><td>$0$</td></tr></table>`;
const G_CHEAT = [
  { title: 'Tabulka', html: TRIG_TABLE + R`<p class="muted">Sinus: $\frac{\sqrt{0}}{2}, \frac{\sqrt{1}}{2}, \frac{\sqrt{2}}{2}, \frac{\sqrt{3}}{2}, \frac{\sqrt{4}}{2}$. Kosinus pozpátku.</p>` },
  { title: 'Kvadranty a znaménka', html: R`<p>Úhel v II., III. nebo IV. kvadrantu: hodnota je stejná jako u základního úhlu ($30^\circ$, $45^\circ$, $60^\circ$), znaménko podle polohy: $\cos$ = vodorovně (vpravo +), $\sin$ = svisle (nahoře +).</p>` + circle({ quadrants: true, W: 200, H: 200 }) },
  { title: 'Převody', html: R`<p>$z = r(\cos\varphi + \mathrm{i}\sin\varphi)$, $r = |z|$.</p><p><b>Goniometrický → algebraický:</b> dosaď $\cos$ a $\sin$ z tabulky, roznásob $r$.</p>
    <p><b>Algebraický → goniometrický:</b> $|z| = \sqrt{a^2 + b^2}$, úhel ze základního úhlu ($\operatorname{tg}\alpha = \frac{|b|}{|a|}$) a kvadrantu.</p>` },
  { title: 'Násobení, dělení, mocnina', html: R`<div class="callout">krát: $r_1 r_2$, úhly $+$<br>děleno: $\frac{r_1}{r_2}$, úhly $-$<br>na $n$: $r^n$, úhel $\cdot n$</div><p>Úhel nad $360^\circ$ zmenši o $360^\circ$ (to je stejný úhel).</p>` },
  { title: 'Odmocniny', html: R`<p>$n$-tá odmocnina z $r(\cos\varphi + \mathrm{i}\sin\varphi)$ má <b>$n$ výsledků</b>:</p><div class="callout">velikost $\sqrt[n]{r}$, úhly $\frac{\varphi}{n} + k\cdot\frac{360^\circ}{n}$, $k = 0, \dots, n - 1$</div>` },
];
const degRad = () => {
  const d = pick(NICE.filter(x => x));
  const right = `$${radTex(d)}$`;
  return { type: 'choice', key: 'degRad', prompt: `Kolik je $${d}^\\circ$ v radiánech?`, options: options(right, shuffle([radTex(d / 2), radTex(2 * d), radTex(180 - d), radTex(d + 90)]).filter(x => x !== radTex(d)).map(x => [`$${x}$`, ''])), explain: `$180^\\circ = \\pi$, takže $${d}^\\circ = \\frac{${d}}{180}\\pi = ${radTex(d)}$.` };
};
const GONIO = {
  id: 'zm-gonio', title: 'Goniometrický tvar', tagline: 'Úhly, Moivre a odmocniny', cheat: G_CHEAT,
  units: [
    {
      id: 'zg1', title: 'Tabulka úhlů', desc: 'sin a cos, bez kterých to nejde.',
      lessons: [
        { id: 'zg1l1', title: 'První kvadrant', cards: [
          info('Pět hodnot, jeden trik', TRIG_TABLE + R`<p>Nemusíš se to biflovat: sinus úhlů $0^\circ, 30^\circ, 45^\circ, 60^\circ, 90^\circ$ je</p><div class="callout">$\frac{\sqrt{0}}{2},\ \frac{\sqrt{1}}{2},\ \frac{\sqrt{2}}{2},\ \frac{\sqrt{3}}{2},\ \frac{\sqrt{4}}{2}$</div><p>a kosinus je stejná řada pozpátku.</p>`),
          ...times(8, G.trigVal1),
        ] },
        { id: 'zg1l2', title: 'Celá kružnice', cards: [
          info('Jednotková kružnice', R`<p>Úhel měříme od kladné vodorovné osy proti směru hodinek. Bod na kružnici má souřadnice $[\cos\varphi;\ \sin\varphi]$.</p>` + circle({ quadrants: true, angles: [{ deg: 150, label: '150°' }], W: 220, H: 220 }) + R`<p>Úhel $150^\circ$ je v II. kvadrantu, $30^\circ$ před $180^\circ$. Hodnoty jsou jako u $30^\circ$, jen $\cos$ je vlevo, tedy záporný: $\cos 150^\circ = -\frac{\sqrt{3}}{2}$, $\sin 150^\circ = \frac{1}{2}$.</p>`),
          G.quadQ, G.quadQ, ...times(6, G.trigValAll),
        ] },
        { id: 'zg1l3', title: 'Dril: tabulka', drill: true, cards: [drillInfo, ...mix(12, G.trigVal1, G.trigValAll, G.trigValAll, degRad)] },
      ],
    },
    {
      id: 'zg2', title: 'Na algebraický tvar', desc: 'Dosaď z tabulky a roznásob.',
      lessons: [
        { id: 'zg2l1', title: 'Dosaď a roznásob', cards: [
          info('Délka a úhel', R`<p>Goniometrický tvar popisuje číslo jako <b>šipku</b>: $r$ je její délka (vzdálenost od nuly), $\varphi$ úhel od kladné osy Re.</p><div class="callout">$z = r(\cos\varphi + \mathrm{i}\sin\varphi)$</div>
            <p>Převod na $a + b\mathrm{i}$: dosaď hodnoty z tabulky a roznásob.</p><p class="muted">$8(\cos 60^\circ + \mathrm{i}\sin 60^\circ) = 8\left(\frac{1}{2} + \frac{\sqrt{3}}{2}\mathrm{i}\right) = 4 + 4\sqrt{3}\,\mathrm{i}$</p>`),
          G.polarToAlgGuided, G.polarToAlgGuided, ...times(4, G.polarToAlg),
        ] },
      ],
    },
    {
      id: 'zg3', title: 'Na goniometrický tvar', desc: '|z| a úhel podle kvadrantu.',
      lessons: [
        { id: 'zg3l1', title: 'Délka a úhel', cards: [
          info('Z a + bi na šipku', R`<ol class="steps-list recipe"><li>Délka: $|z| = \sqrt{a^2 + b^2}$ (Pythagoras).</li><li>Kvadrant podle znamének $a$ a $b$.</li><li>Základní úhel: když $|a| = |b|$, je to $45^\circ$; když je u jednoho $\sqrt{3}$, je to $30^\circ$ nebo $60^\circ$.</li><li>Otoč do kvadrantu: II. $180^\circ - \alpha$, III. $180^\circ + \alpha$, IV. $360^\circ - \alpha$.</li></ol>
            <p class="muted">$z = -2 + 2\mathrm{i}$: $|z| = \sqrt{8} = 2\sqrt{2}$, II. kvadrant, $\alpha = 45^\circ$, $\varphi = 135^\circ$.</p>`),
          () => G.algToPolarGuided(), () => G.algToPolarGuided(), ...times(4, G.algToPolar),
        ] },
        { id: 'zg3l2', title: 'Z obrázku', cards: [
          info('Číslo v rovině', R`<p>V testu může být číslo jen nakreslené. Přečti $a$ a $b$ z obrázku a pokračuj stejně.</p>` + gauss([{ re: 3, im: 3, label: 'z' }], { arrows: true, W: 220, H: 220 }) + R`<p class="muted">$z = 3 + 3\mathrm{i}$, $|z| = \sqrt{18} = 3\sqrt{2}$, úhel $45^\circ$.</p>`),
          () => G.algToPolarGuided(true), ...times(4, G.gaussPolar),
        ] },
        { id: 'zg3l3', title: 'Dril: převody', drill: true, cards: [drillInfo, ...mix(10, G.polarToAlg, G.algToPolar, G.gaussPolar)] },
      ],
    },
    {
      id: 'zg4', title: 'Násobení a dělení', desc: 'Délky násob, úhly sčítej.',
      lessons: [
        { id: 'zg4l1', title: 'Krát a děleno', cards: [
          info('Proč se to dělá v goniometrickém tvaru', R`<div class="callout">$z_1 z_2$: délky <b>vynásob</b>, úhly <b>sečti</b><br>$\frac{z_1}{z_2}$: délky <b>vyděl</b>, úhly <b>odečti</b></div>
            <p>$8(\cos 60^\circ + \mathrm{i}\sin 60^\circ)\cdot 2(\cos 12^\circ + \mathrm{i}\sin 12^\circ) = 16(\cos 72^\circ + \mathrm{i}\sin 72^\circ)$</p><p class="muted">Úhel přes $360^\circ$ zmenši o $360^\circ$. Záporný úhel můžeš nechat, nebo přičíst $360^\circ$.</p>`),
          ...times(4, G.mulPolar), ...times(4, G.divPolar),
        ] },
      ],
    },
    {
      id: 'zg5', title: 'Mocnina', desc: 'Moivreova věta: r na n, úhel krát n.',
      lessons: [
        { id: 'zg5l1', title: 'Moivre', cards: [
          info('Mocnina = opakované násobení', R`<p>Když násobení znamená „délky krát, úhly plus“, pak $z^5$ je délka na pátou a úhel pětkrát:</p><div class="callout">$\left[r(\cos\varphi + \mathrm{i}\sin\varphi)\right]^n = r^n(\cos n\varphi + \mathrm{i}\sin n\varphi)$</div>
            <p class="muted">$\left[2(\cos 12^\circ + \mathrm{i}\sin 12^\circ)\right]^5 = 32(\cos 60^\circ + \mathrm{i}\sin 60^\circ)$</p>`),
          ...times(6, G.powPolar),
        ] },
      ],
    },
    {
      id: 'zg6', title: 'Odmocniny', desc: 'n kořenů rovnoměrně po kružnici.',
      lessons: [
        { id: 'zg6l1', title: 'Všechny kořeny', cards: [
          info('Mocnina pozpátku', R`<p>Třetí odmocnina z $z_1$ je každé $w$, pro které $w^3 = z_1$. Takových čísel jsou <b>tři</b>, rozmístěná pravidelně po kružnici (po $120^\circ$).</p>
            <ol class="steps-list recipe"><li>Velikost: $\sqrt[n]{r}$ (pro všechny stejná).</li><li>První úhel: $\frac{\varphi}{n}$.</li><li>Další: přičítej $\frac{360^\circ}{n}$.</li></ol>` + circle({ angles: [{ deg: 20, label: '20°' }, { deg: 140, label: '140°' }, { deg: 260, label: '260°' }], W: 220, H: 220 }) + R`<p class="muted">$\sqrt[3]{8(\cos 60^\circ + \mathrm{i}\sin 60^\circ)}$: velikost $2$, úhly $20^\circ$, $140^\circ$, $260^\circ$.</p>`),
          G.rootsGuided, G.rootsGuided, ...times(3, G.rootsPolar),
        ] },
        { id: 'zg6l2', title: 'Dril: operace', drill: true, cards: [drillInfo, ...mix(8, G.mulPolar, G.divPolar, G.powPolar, G.rootsPolar)] },
      ],
    },
    {
      id: 'zg7', title: 'Jako v testu', desc: 'Příklad 2 (a 1b) z minulých let.',
      lessons: [
        { id: 'zg7l1', title: 'Příklad 2 z testu', boss: true, cards: [bossInfo('Varianta A: $z_1 = 8(\\cos 60^\\circ + \\mathrm{i}\\sin 60^\\circ)$, $z_2 = 2(\\cos 12^\\circ + \\mathrm{i}\\sin 12^\\circ)$. Varianta B: $z_1 = 9(\\cos 80^\\circ + \\mathrm{i}\\sin 80^\\circ)$, $z_2 = 3(\\cos 20^\\circ + \\mathrm{i}\\sin 20^\\circ)$.'),
          G.FIXED.A2a, G.FIXED.A2b, G.FIXED.A2c, G.FIXED.A2d, G.FIXED.B1b, G.FIXED.B2a, G.FIXED.B2b, G.FIXED.B2c, G.FIXED.B2d] },
        { id: 'zg7l2', title: 'Velký dril', drill: true, cards: [drillInfo, ...mix(12, G.polarToAlg, G.algToPolar, G.mulPolar, G.divPolar, G.powPolar, G.rootsPolar)] },
      ],
    },
  ],
  fluency: { id: 'fluency', title: 'Zkouška plynulosti', desc: '8 smíšených příkladů. Měří se čas, ale jen pro tebe.', pool: [G.polarToAlg, G.algToPolar, G.gaussPolar, G.mulPolar, G.divPolar, G.powPolar, G.rootsPolar, G.rootsPolar], count: 8 },
};

// =====================================================================
// 3. Rovnice a nerovnice
// =====================================================================
const RAD_TABLE = R`<table class="rules"><tr><th>stupně</th><td>$30^\circ$</td><td>$45^\circ$</td><td>$60^\circ$</td><td>$90^\circ$</td><td>$180^\circ$</td><td>$360^\circ$</td></tr><tr><th>radiány</th><td>$\frac{\pi}{6}$</td><td>$\frac{\pi}{4}$</td><td>$\frac{\pi}{3}$</td><td>$\frac{\pi}{2}$</td><td>$\pi$</td><td>$2\pi$</td></tr></table>`;
const R_CHEAT = [
  { title: 'Kvadratická rovnice', html: R`<div class="callout">$D = b^2 - 4ac$, $\quad x_{1,2} = \frac{-b \pm \sqrt{D}}{2a}$</div><p>$D > 0$: dva kořeny, $D = 0$: jeden, $D < 0$: žádný reálný.</p>` },
  { title: 'Kvadratická nerovnice', html: R`<ol class="steps-list recipe"><li>Kořeny rovnice $= 0$.</li><li>Parabola: $a > 0$ ∪, $a < 0$ ∩.</li><li>$< 0$ = pod osou, $> 0$ = nad osou. U ∪ je pod osou <b>mezi</b> kořeny.</li><li>$\le, \ge$: kořeny patří, ⟨ ⟩.</li></ol>` },
  { title: 'Exponenciální', html: R`<p>Obě strany jako mocnina stejného základu, pak porovnej exponenty.</p><p>$a^{-n} = \frac{1}{a^n}$, $a^0 = 1$.</p><div class="callout">Základ menší než 1 (třeba $\frac{1}{2}$) <b>otočí</b> znaménko nerovnosti.</div>` },
  { title: 'Logaritmy', html: R`<p>$\log_a y = n \iff a^n = y$.</p><div class="callout">Podmínka: v logaritmu jen <b>kladné</b> číslo.</div><p>$\log_a x < c \Rightarrow x < a^c$ (pro $a > 1$), pro $a < 1$ se znaménko otočí. Výsledek spoj s podmínkou.</p>` },
  { title: 'Goniometrické', html: RAD_TABLE + R`<p>$\sin x = v$: vodorovná přímka $y = v$, dva body na kružnici ($\alpha$ a $\pi - \alpha$).</p><p>$\cos x = v$: svislá přímka $x = v$, body $\alpha$ a $-\alpha$ ($2\pi - \alpha$).</p><p>Ke každému $+ 2k\pi$, $k \in \mathbb{Z}$. U nerovnice zapiš oblouk proti směru hodinek, začátek menší než konec.</p>` },
  { title: 'Jak psát odpověď', html: '<p>Kořeny odděl středníkem: <b>1/2; -3</b>. Žádné řešení: <b>žádné</b>. Interval: <b>⟨-3, 1/2⟩</b>, nekonečno přes klávesu. Úhly: <b>π/6; 5π/6</b>.</p>' },
];
const RAD_INFO = info('Radiány', R`<p>V rovnicích se úhly píšou v radiánech: $180^\circ = \pi$.</p>` + RAD_TABLE + R`<p class="muted">Ostatní dopočítáš: $150^\circ = 5\cdot 30^\circ = \frac{5\pi}{6}$, $315^\circ = 7\cdot 45^\circ = \frac{7\pi}{4}$.</p>`);
const ROVNICE = {
  id: 'zm-rovnice', title: 'Rovnice a nerovnice', tagline: 'Kvadratické, exp, log, goniometrické', cheat: R_CHEAT,
  units: [
    {
      id: 'zr1', title: 'Kvadratická rovnice', desc: 'Diskriminant a vzorec.',
      lessons: [
        { id: 'zr1l1', title: 'Diskriminant', cards: [
          info('Vzorec, který řeší všechno', R`<p>Rovnice $ax^2 + bx + c = 0$ se řeší vždycky stejně:</p><div class="callout">$D = b^2 - 4ac$<br>$x_{1,2} = \frac{-b \pm \sqrt{D}}{2a}$</div>
            <p>$2x^2 + 5x - 3 = 0$: $a = 2$, $b = 5$, $c = -3$. $D = 25 + 24 = 49$, $\sqrt{D} = 7$. $x_1 = \frac{-5 - 7}{4} = -3$, $x_2 = \frac{-5 + 7}{4} = \frac{1}{2}$.</p>
            <p class="muted">Pozor na znaménka: $c = -3$, takže $-4ac = -4\cdot 2\cdot(-3) = +24$.</p>`),
          ...times(3, Q.discCount), Q.quadEqGuided, Q.quadEqGuided, Q.quadEqGuided,
        ] },
        { id: 'zr1l2', title: 'Kořeny', cards: [info('Teď bez pomoci', '<p>Kořeny piš oddělené středníkem: <b>1/2; -3</b>. Když řešení není, napiš <b>žádné</b> (je na to klávesa).</p>'), ...times(6, Q.quadEq)] },
        { id: 'zr1l3', title: 'Dril: kvadratické', drill: true, cards: [drillInfo, ...times(10, Q.quadEq)] },
      ],
    },
    {
      id: 'zr2', title: 'Kvadratická nerovnice', desc: 'Kořeny a náčrt paraboly.',
      lessons: [
        { id: 'zr2l1', title: 'Pod osou, nad osou', cards: [
          info('Nakresli si parabolu', R`<p>$2x^2 + 5x - 3 \le 0$. Kořeny už známe: $-3$ a $\frac{1}{2}$. Parabola má $a = 2 > 0$, je otevřená nahoru:</p>` + graph(x => 2 * x * x + 5 * x - 3, { xmin: -5, xmax: 3, ymin: -7, ymax: 5, W: 240, H: 170, small: true, pts: [{ x: -3, y: 0 }, { x: 0.5, y: 0 }] }) + R`<p>„$\le 0$“ = kde je graf pod osou (nebo na ní). To je <b>mezi</b> kořeny. A protože je tam i „=“, kořeny patří do výsledku:</p><div class="callout">$x \in \left\langle -3, \frac{1}{2}\right\rangle$</div>`),
          Q.quadIneqGuided, Q.quadIneqGuided, Q.quadIneqGuided, ...times(4, Q.quadIneq),
        ] },
        { id: 'zr2l2', title: 'Dril: nerovnice', drill: true, cards: [drillInfo, ...times(8, Q.quadIneq)] },
      ],
    },
    {
      id: 'zr3', title: 'Exponenciální', desc: 'Stejný základ, porovnej exponenty.',
      lessons: [
        { id: 'zr3l1', title: 'Mocniny pozpátku', cards: [
          info('Všechno jako mocnina', R`<p>$2^x = 8$: $8 = 2^3$, takže $x = 3$.</p><div class="callout">$a^{-n} = \frac{1}{a^n}$, $\quad a^0 = 1$</div><p>$\frac{1}{2} = 2^{-1}$, $\frac{1}{9} = 3^{-2}$, $1 = 5^0$.</p>`),
          ...times(6, Q.expEq),
        ] },
        { id: 'zr3l2', title: 'Nerovnice', cards: [
          info('Kdy se otočí znaménko', R`<p>$2^x > \frac{1}{2}$: $\frac{1}{2} = 2^{-1}$. Funkce $2^x$ roste, takže větší exponent = větší hodnota: $x > -1$.</p>
            <div class="callout">Základ $> 1$: znaménko zůstává. Základ mezi 0 a 1: znaménko se <b>otočí</b>.</div><p class="muted">$\left(\frac{1}{2}\right)^x > 4 = \left(\frac{1}{2}\right)^{-2}$ → $x < -2$.</p>`),
          Q.expIneqGuided, Q.expIneqGuided, ...times(4, Q.expIneq),
        ] },
      ],
    },
    {
      id: 'zr4', title: 'Logaritmy', desc: 'Logaritmus = hledaný exponent.',
      lessons: [
        { id: 'zr4l1', title: 'Co je logaritmus', cards: [
          info('Otázka v převleku', R`<p>$\log_2 8$ se ptá: <b>na kolikátou</b> musím umocnit 2, aby vyšlo 8? Na třetí, takže $\log_2 8 = 3$.</p><div class="callout">$\log_a y = n \iff a^n = y$</div><p class="muted">$\log_3 \frac{1}{9} = -2$, protože $3^{-2} = \frac{1}{9}$. $\log_5 1 = 0$.</p>`),
          ...times(6, Q.logVal),
        ] },
        { id: 'zr4l2', title: 'Nerovnice', cards: [
          info('Podmínka a odlogaritmování', R`<p>„Všechna $x$, jejichž logaritmus o základu 3 je menší než 2“ = $\log_3 x < 2$.</p>
            <ol class="steps-list recipe"><li><b>Podmínka:</b> logaritmovat jde jen kladné číslo, $x > 0$.</li><li><b>Odlogaritmuj:</b> $x < 3^2 = 9$ (základ $> 1$, znaménko zůstává).</li><li><b>Spoj:</b> $x \in (0, 9)$.</li></ol>
            <div class="callout">Nejčastější chyba v testu: zapomenout na podmínku a napsat $(-\infty, 9)$.</div>`),
          Q.logIneqGuided, Q.logIneqGuided, ...times(3, Q.logIneq), Q.logWords, Q.logWords,
        ] },
        { id: 'zr4l3', title: 'Dril: exp a log', drill: true, cards: [drillInfo, ...mix(10, Q.expIneq, Q.logIneq, Q.logWords, Q.expEq, Q.logVal)] },
      ],
    },
    {
      id: 'zr5', title: 'Goniometrické rovnice', desc: 'Kružnice místo vzorců.',
      lessons: [
        { id: 'zr5l1', title: 'Body na kružnici', cards: [
          RAD_INFO, degRad, degRad,
          info('sin x = 1/2', R`<p>$\sin x$ je výška bodu na kružnici. Kde je výška $\frac{1}{2}$? Nakresli vodorovnou přímku $y = \frac{1}{2}$: protne kružnici ve dvou bodech.</p>` + circle({ angles: [{ deg: 30, label: 'π/6' }, { deg: 150, label: '5π/6' }], line: { y: 0.5 }, W: 220, H: 220 }) + R`<p>$x = \frac{\pi}{6}$ (z tabulky) a $x = \pi - \frac{\pi}{6} = \frac{5\pi}{6}$.</p><p class="muted">U $\cos x = v$ je to svislá přímka a body $\alpha$ a $2\pi - \alpha$.</p>`),
          ...times(5, Q.trigEqBasic),
        ] },
        { id: 'zr5l2', title: 'Všechna řešení', cards: [
          info('Kružnice se točí dokola', R`<p>Po celé otočce ($2\pi$) jsi zase na stejném místě. Proto ke každému řešení patří $+ 2k\pi$:</p><div class="callout">$\sin x = \frac{1}{2}$: $\ x = \frac{\pi}{6} + 2k\pi,\ x = \frac{5\pi}{6} + 2k\pi,\ k \in \mathbb{Z}$</div>`),
          ...times(5, Q.trigEqGeneral),
        ] },
      ],
    },
    {
      id: 'zr6', title: 'Goniometrické nerovnice', desc: 'Oblouk na kružnici.',
      lessons: [
        { id: 'zr6l1', title: 'Oblouk', cards: [
          info('cos x > 1/2', R`<p>$\cos x$ je vodorovná souřadnice. Nakresli svislou přímku $x = \frac{1}{2}$. Větší kosinus = <b>vpravo</b> od ní:</p>` + circle({ arc: { from: -60, to: 60 }, line: { x: 0.5 }, angles: [{ deg: 60, label: 'π/3' }, { deg: -60, label: '−π/3' }], W: 220, H: 220 }) + R`<p>Oblouk jde (proti směru hodinek) od $-\frac{\pi}{3}$ do $\frac{\pi}{3}$. Začátek musí být menší než konec, proto $-\frac{\pi}{3}$, ne $\frac{5\pi}{3}$.</p><div class="callout">$x \in \left(-\frac{\pi}{3} + 2k\pi,\ \frac{\pi}{3} + 2k\pi\right),\ k \in \mathbb{Z}$</div>`),
          Q.trigIneqGuided, Q.trigIneqGuided, Q.trigIneqGuided, ...times(4, Q.trigIneq),
        ] },
        { id: 'zr6l2', title: 'Dril: goniometrické', drill: true, cards: [drillInfo, ...mix(8, Q.trigEqGeneral, Q.trigIneq, Q.trigEqBasic)] },
      ],
    },
    {
      id: 'zr7', title: 'Jako v testu', desc: 'Příklad 3 z minulých let.',
      lessons: [
        { id: 'zr7l1', title: 'Příklad 3 z testu', boss: true, cards: [bossInfo('Varianta A i B: $2x^2 + 5x \\mp 3$, pak jedna goniometrická a jedna exponenciální nebo logaritmická úloha.'), Q.FIXED.A3a, Q.FIXED.A3b, Q.FIXED.A3c, Q.FIXED.A3d, Q.FIXED.B3a, Q.FIXED.B3b, Q.FIXED.B3c, Q.FIXED.B3d] },
        { id: 'zr7l2', title: 'Velký dril', drill: true, cards: [drillInfo, ...mix(12, Q.quadEq, Q.quadIneq, Q.expIneq, Q.logIneq, Q.logWords, Q.trigEqGeneral, Q.trigIneq)] },
      ],
    },
  ],
  fluency: { id: 'fluency', title: 'Zkouška plynulosti', desc: '8 smíšených příkladů. Měří se čas, ale jen pro tebe.', pool: [Q.quadEq, Q.quadIneq, Q.expIneq, Q.logIneq, Q.logWords, Q.trigEqGeneral, Q.trigIneq, Q.trigEqBasic], count: 8 },
};

// =====================================================================
// 4. Grafy funkcí
// =====================================================================
const F_CHEAT = [
  { title: 'Průsečíky s osami', html: R`<p><b>S osou $y$:</b> dosaď $x = 0$. Bod $[0;\ f(0)]$.</p><p><b>S osou $x$:</b> řeš $f(x) = 0$. Body $[x_i;\ 0]$.</p>` },
  { title: 'Parabola', html: R`<p>$f(x) = ax^2 + bx + c$: $a > 0$ ∪, $a < 0$ ∩.</p><div class="callout">vrchol: $x_V = \frac{-b}{2a}$, $y_V = f(x_V)$</div><p>Vrchol je přesně uprostřed mezi kořeny.</p>` },
  { title: 'Posuny', html: R`<p>$|x - u| + v$: graf $|x|$ posunutý o $u$ <b>doprava</b> a o $v$ <b>nahoru</b>. Uvnitř to jde „naopak“: $x - 1$ = doprava, $x + 1$ = doleva.</p>` + graph(x => Math.abs(x - 1) - 1, { xmin: -3, xmax: 4, ymin: -2, ymax: 3, W: 220, H: 150, small: true, pts: [{ x: 1, y: -1 }] }) },
];
const GRAFY = {
  id: 'zm-grafy', title: 'Grafy funkcí', tagline: 'Průsečíky, vrchol, posuny', cheat: F_CHEAT,
  units: [
    {
      id: 'zf1', title: 'Průsečíky s osami', desc: 'Na ose y je x = 0, na ose x je y = 0.',
      lessons: [
        { id: 'zf1l1', title: 'Kde graf protne osy', cards: [
          info('Dvě jednoduchá pravidla', R`<p><b>Osa $y$:</b> všechny body na ní mají $x = 0$. Dosaď nulu: $f(0)$.</p><p><b>Osa $x$:</b> všechny body na ní mají $y = 0$. Řeš rovnici $f(x) = 0$.</p>` + graph(x => x * x - 2 * x - 8, { xmin: -4, xmax: 6, ymin: -10, ymax: 4, W: 240, H: 190, small: true, pts: [{ x: -2, y: 0, label: '[−2; 0]', dy: -8, anchor: 'end' }, { x: 4, y: 0, label: '[4; 0]' }, { x: 0, y: -8, label: '[0; −8]' }] }) + R`<p class="muted">$x^2 - 2x - 8$: $f(0) = -8$, a $x^2 - 2x - 8 = 0$ dává $x = -2$, $x = 4$.</p>`),
          ...times(4, F.yInt), ...times(4, F.xInts),
        ] },
      ],
    },
    {
      id: 'zf2', title: 'Parabola', desc: 'Vrchol, kořeny, tvar.',
      lessons: [
        { id: 'zf2l1', title: 'Vrchol', cards: [
          info('Kde se parabola otáčí', R`<div class="callout">$x_V = \frac{-b}{2a}$, $\ y_V = f(x_V)$</div><p>$x^2 - 2x - 8$: $x_V = \frac{2}{2} = 1$, $y_V = 1 - 2 - 8 = -9$, vrchol $[1;\ -9]$.</p><p class="muted">Kontrola: vrchol je uprostřed mezi kořeny $-2$ a $4$.</p>`),
          ...times(5, F.vertexQ), F.graphPick, F.graphPick,
        ] },
      ],
    },
    {
      id: 'zf3', title: 'Absolutní hodnota', desc: 'Posunuté písmeno V.',
      lessons: [
        { id: 'zf3l1', title: 'Posuny', cards: [
          info('Graf |x| a jeho posuny', R`<p>$|x|$ je písmeno V se špičkou v $[0;\ 0]$.</p><div class="callout">$|x - u| + v$: špička v $[u;\ v]$</div><p>Uvnitř to jde „obráceně“: $|x - 1|$ je posun <b>doprava</b>, $|x + 1|$ doleva. Číslo venku posouvá normálně nahoru/dolů.</p>` + graph(x => Math.abs(x - 1) - 1, { xmin: -3, xmax: 4, ymin: -2, ymax: 3, W: 240, H: 170, small: true, pts: [{ x: 1, y: -1, label: '[1; −1]', dy: 18 }, { x: 0, y: 0 }, { x: 2, y: 0 }] }) + R`<p class="muted">$|x - 1| - 1$: špička $[1;\ -1]$, protne osu $x$ v $0$ a $2$.</p>`),
          ...times(4, F.shiftQ), ...times(4, F.absVertex), F.graphPick, F.graphPick,
        ] },
        { id: 'zf3l2', title: 'Dril: grafy', drill: true, cards: [drillInfo, ...mix(10, F.yInt, F.xInts, F.vertexQ, F.absVertex, F.shiftQ, F.graphPick)] },
      ],
    },
    {
      id: 'zf4', title: 'Jako v testu', desc: 'Příklad 4 z minulých let.',
      lessons: [
        { id: 'zf4l1', title: 'Příklad 4 z testu', boss: true, cards: [bossInfo('Varianta A: $|x - 1| - 1$. Varianta B: $x^2 - 2x - 8$ i s vrcholem. V testu graf načrtneš, tady vybereš ten správný.'), F.FIXED.A4, F.FIXED.B4, F.examGraph, F.examGraph, F.examGraph] },
      ],
    },
  ],
  fluency: { id: 'fluency', title: 'Zkouška plynulosti', desc: '6 příkladů na grafy. Měří se čas, ale jen pro tebe.', pool: [F.examGraph, F.examGraph, F.vertexQ, F.absVertex, F.xInts, F.graphPick], count: 6 },
};

// =====================================================================
// 5. Přímky a roviny
// =====================================================================
const V_CHEAT = [
  { title: 'Vektor a přímka', html: R`<p>$\overrightarrow{AB} = B - A$ (konec mínus začátek).</p><div class="callout">přímka: $X = A + k\,\vec u$, $\ \vec u = B - A$, $k \in \mathbb{R}$</div>` },
  { title: 'Rovina', html: R`<div class="callout">$\rho:\ ax + by + cz + d = 0$, $\ \vec n = (a, b, c)$</div><p>$d$: dosaď bod roviny a dopočítej.</p>` },
  { title: 'Poloha dvou rovin', html: R`<ol class="steps-list recipe"><li>Normálové vektory jsou násobky? Ne → <b>různoběžné</b>.</li><li>Ano a i $d$ je stejný násobek → <b>totožné</b>.</li><li>Ano, ale $d$ ne → <b>rovnoběžné různé</b>.</li></ol>` },
  { title: 'Jak psát odpověď', html: '<p>Vektor i bod: <b>(1, 0, 2)</b>. Rovina: <b>x + 2y + 3z - 4 = 0</b> (projde i násobek celé rovnice).</p>' },
];
const GEOMETRIE = {
  id: 'zm-geometrie', title: 'Přímky a roviny', tagline: 'Vektory v prostoru', cheat: V_CHEAT,
  units: [
    {
      id: 'zv1', title: 'Vektory a přímky', desc: 'Konec mínus začátek.',
      lessons: [
        { id: 'zv1l1', title: 'Vektor z bodů', cards: [
          info('Šipka z A do B', R`<p>Bod je místo, vektor je posun. Posun z $A = [1, 0, 1]$ do $B = [1, 1, 2]$:</p><div class="callout">$\overrightarrow{AB} = B - A = (1 - 1,\ 1 - 0,\ 2 - 1) = (0, 1, 1)$</div><p class="muted">Pořadí je důležité: <b>konec mínus začátek</b>. Opačně by šipka mířila z B do A.</p>`),
          ...times(5, V.vecAB),
        ] },
        { id: 'zv1l2', title: 'Rovnice přímky', cards: [
          info('Bod + násobky směru', R`<p>Přímka = začni v bodě $A$ a jdi libovolně daleko ve směru $\vec u$ (dopředu i dozadu):</p><div class="callout">$X = A + k\,\vec u,\ k \in \mathbb{R}$</div><p>Přes $A = [1, 0, 1]$ a $B = [1, 1, 2]$: $\vec u = B - A = (0, 1, 1)$, takže $X = [1, 0, 1] + k(0, 1, 1)$.</p><p class="muted">Správně je i bod $B$ místo $A$ nebo jakýkoli násobek $\vec u$.</p>`),
          ...times(5, V.lineEq), ...times(3, V.onLineQ),
        ] },
      ],
    },
    {
      id: 'zv2', title: 'Roviny', desc: 'Normálový vektor a d.',
      lessons: [
        { id: 'zv2l1', title: 'Normálový vektor', cards: [
          info('Šipka kolmo k rovině', R`<p>Rovina $ax + by + cz + d = 0$ má normálový vektor (kolmý k rovině) $\vec n = (a, b, c)$, prostě čísla před $x, y, z$.</p><p class="muted">$2x - z + 5 = 0$: $\vec n = (2, 0, -1)$. Chybějící $y$ = nula.</p>`),
          ...times(4, V.normalRead),
        ] },
        { id: 'zv2l2', title: 'Rovnice roviny', cards: [
          info('Normála + bod', R`<p>Bod $A = [1, 0, 1]$, $\vec n = (1, 2, 3)$:</p><ol class="steps-list recipe"><li>Normála dá koeficienty: $x + 2y + 3z + d = 0$.</li><li>Dosaď $A$: $1 + 0 + 3 + d = 0$, tedy $d = -4$.</li><li>$\rho:\ x + 2y + 3z - 4 = 0$</li></ol>`),
          V.planeEqGuided, V.planeEqGuided, ...times(4, V.planeEq),
        ] },
      ],
    },
    {
      id: 'zv3', title: 'Poloha rovin', desc: 'Rovnoběžné, totožné, různoběžné.',
      lessons: [
        { id: 'zv3l1', title: 'Porovnej normály', cards: [
          info('Stačí normálové vektory', R`<p>$\rho:\ 5x + 3y - 2z + 2 = 0$ a $\varphi:\ 10x + 6y - 4z + 3 = 0$.</p><p>$\vec n_\varphi = (10, 6, -4) = 2\cdot(5, 3, -2)$: normály jsou rovnoběžné, roviny taky. Totožné by byly, kdyby i $d$ bylo dvojnásobné: $2\cdot 2 = 4 \ne 3$. Takže <b>rovnoběžné různé</b>.</p>
            <p class="muted">Kdyby normály nebyly násobky (třeba $(10, 6, 5)$), roviny jsou <b>různoběžné</b>.</p>`),
          V.planePosGuided, V.planePosGuided, V.planePosGuided, ...times(4, V.planePos),
        ] },
        { id: 'zv3l2', title: 'Dril: prostor', drill: true, cards: [drillInfo, ...mix(10, V.vecAB, V.lineEq, V.planeEq, V.planePos, V.normalRead)] },
      ],
    },
    {
      id: 'zv4', title: 'Jako v testu', desc: 'Příklady 5 a 6 z minulých let.',
      lessons: [
        { id: 'zv4l1', title: 'Příklady 5 a 6 z testu', boss: true, cards: [bossInfo('Přímka přes dva body, rovina z bodu a normály, poloha dvou rovin.'), V.FIXED.A5, V.FIXED.B5, V.FIXED.A6, V.FIXED.B6, V.lineEq, V.planeEq, V.planePos] },
      ],
    },
  ],
  fluency: { id: 'fluency', title: 'Zkouška plynulosti', desc: '6 příkladů. Měří se čas, ale jen pro tebe.', pool: [V.lineEq, V.planeEq, V.planePos, V.planePos, V.vecAB, V.normalRead], count: 6 },
};

export const ZM = [
  { id: 'zm-komplex', short: 'Komplexní čísla', title: KOMPLEX.title, tagline: KOMPLEX.tagline, exam: 'Př. 1', content: KOMPLEX, gen: K.GEN },
  { id: 'zm-gonio', short: 'Goniometrický tvar', title: GONIO.title, tagline: GONIO.tagline, exam: 'Př. 1b, 2', content: GONIO, gen: { ...G.GEN, degRad } },
  { id: 'zm-rovnice', short: 'Rovnice', title: ROVNICE.title, tagline: ROVNICE.tagline, exam: 'Př. 3', content: ROVNICE, gen: Q.GEN },
  { id: 'zm-grafy', short: 'Grafy', title: GRAFY.title, tagline: GRAFY.tagline, exam: 'Př. 4', content: GRAFY, gen: F.GEN },
  { id: 'zm-geometrie', short: 'Přímky a roviny', title: GEOMETRIE.title, tagline: GEOMETRIE.tagline, exam: 'Př. 5, 6', content: GEOMETRIE, gen: V.GEN },
];
export { degRad };
