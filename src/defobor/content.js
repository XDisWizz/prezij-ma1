// Obsah cesty "Definiční obory": jednotky -> lekce -> karty.
// Karty jsou továrny (funkce) – při každém spuštění lekce vzniknou nové příklady.
// Postup v každé jednotce: vysvětlení → řešení po krocích → s menší oporou → samostatně → dril.
import * as G from './gen.js';
import { GONIO_GEN as T, circleSvg } from './gonio.js';
import { numberLine } from '../numberline.js';
import { between, ge, gt, lt, union, without, R, frac } from '../intervals.js';
import { pick } from '../ui.js';

const VIDEO = id => `https://opencast.vsb.cz/play/${id}`;
const info = (title, body) => () => ({ type: 'info', title, body });
const video = (title, id, body) => () => ({ type: 'video', title, url: VIDEO(id), body });
const ch = f => () => G.asChoice(f());
const { guided, semi } = G;
/** n příkladů náhodně z daných generátorů */
const mix = (n, ...fs) => Array.from({ length: n }, () => () => pick(fs)());
const drillInfo = info('Dril: jeden za druhým', `<p>Teď už žádné vysvětlování. Příklady jdou rovnou za sebou, a když to sedí, další naskočí sám.</p>
  <p class="muted">Nespěchej. Rychlost přijde sama, jak se postup usadí v ruce. Na konci uvidíš, kolik ti trvá jeden příklad.</p>`);

const RULES_TABLE = `
<table class="rules">
  <tr><th>Když vidíš…</th><th>hlídáš</th></tr>
  <tr><td>$\\frac{\\dots}{\\square}$ zlomek</td><td>$\\square \\ne 0$</td></tr>
  <tr><td>$\\sqrt{\\square}$, $\\sqrt[4]{\\square}$ sudá odmocnina</td><td>$\\square \\ge 0$</td></tr>
  <tr><td>$\\ln \\square$, $\\log \\square$ logaritmus</td><td>$\\square > 0$</td></tr>
  <tr><td>$\\arcsin \\square$, $\\arccos \\square$</td><td>$-1 \\le \\square \\le 1$</td></tr>
  <tr><td>$\\mathrm{tg}\\, \\square$, $\\mathrm{cotg}\\, \\square$</td><td>$\\cos \\square \\ne 0$, $\\sin \\square \\ne 0$</td></tr>
</table>
<p class="muted">Bez podmínky: lichá odmocnina $\\sqrt[3]{\\square}$, $\\mathrm{e}^{\\square}$, $2^{\\square}$, $\\sin$, $\\cos$, $\\mathrm{arctg}$, polynomy.</p>`;

const RECIPE = `<ol class="steps-list recipe"><li><b>Vypiš podmínky</b>, každý kousek funkce zvlášť.</li><li><b>Vyřeš</b> každou podmínku.</li><li><b>Průnik</b>: co platí všude zároveň.</li></ol>`;

// Tahák: dá se otevřít kdykoli během lekce
const CHEAT = [
  { title: 'Co hlídat a jak na to', html: RULES_TABLE + RECIPE },
  { title: 'Intervaly a závorky', html: `<table class="rules">
      <tr><th>zápis</th><th>znamená</th></tr>
      <tr><td>$\\langle 1, 4\\rangle$</td><td>od 1 do 4 <b>včetně</b> krajů ($\\ge$, $\\le$)</td></tr>
      <tr><td>$(1, 4)$</td><td>od 1 do 4 <b>bez</b> krajů ($>$, $<$, $\\ne$)</td></tr>
      <tr><td>$(-\\infty, 3\\rangle$</td><td>všechno až po 3; u nekonečna vždy kulatá</td></tr>
      <tr><td>$A \\cup B$</td><td>„nebo“: oba kusy osy dohromady</td></tr>
      <tr><td>$\\mathbb{R} \\setminus \\{3\\}$</td><td>všechno kromě trojky, tedy $(-\\infty, 3) \\cup (3, +\\infty)$</td></tr>
    </table>` },
  { title: 'Nerovnice', html: `<div class="callout">Násobíš nebo dělíš <b>záporným</b> číslem? Znaménko nerovnosti se <b>otočí</b>.</div>
      <p><b>Kvadratická</b> ($x^2 + \\dots$): najdi kořeny, parabola je <b>vně</b> kořenů kladná a <b>mezi</b> nimi záporná.</p>
      <p>Kořeny: hledej dvě čísla se správným součinem a součtem, nebo $x_{1,2} = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$.</p>
      <p><b>Zlomek</b>: nulové body čitatele i jmenovatele rozdělí osu, v každém kousku zjisti znaménko. Nula jmenovatele do výsledku nikdy nepatří.</p>
      <p><b>Absolutní hodnota</b>: $|x - c|$ je vzdálenost od $c$. $|x - c| < r$ je $(c - r, c + r)$, $|x - c| > r$ jsou oba kraje osy.</p>` },
  { title: 'Logaritmus, e, arcsin', html: `<table class="rules">
      <tr><th>podmínka</th><th>řešení</th></tr>
      <tr><td>$\\ln x > 0$</td><td>$x > 1$</td></tr>
      <tr><td>$\\ln x = 0$</td><td>$x = 1$</td></tr>
      <tr><td>$\\ln x < c$</td><td>$0 < x < \\mathrm{e}^c$</td></tr>
      <tr><td>$-1 \\le \\frac{1}{t} \\le 1$</td><td>$|t| \\ge 1$</td></tr>
      <tr><td>$\\arcsin x > 0$</td><td>$0 < x \\le 1$</td></tr>
      <tr><td>$\\arccos x > 0$</td><td>$-1 \\le x < 1$</td></tr>
    </table><p class="muted">$\\mathrm{e} \\approx 2{,}718$. Logaritmus je rostoucí, proto se při „odlogaritmování“ znaménko neotáčí.</p>` },
  { title: 'Goniometrie', html: `<table class="rules"><tr><th>$x$</th><th>$0$</th><th>$\\frac{\\pi}{6}$</th><th>$\\frac{\\pi}{4}$</th><th>$\\frac{\\pi}{3}$</th><th>$\\frac{\\pi}{2}$</th></tr>
      <tr><td>$\\sin x$</td><td>$0$</td><td>$\\frac{1}{2}$</td><td>$\\frac{\\sqrt{2}}{2}$</td><td>$\\frac{\\sqrt{3}}{2}$</td><td>$1$</td></tr>
      <tr><td>$\\cos x$</td><td>$1$</td><td>$\\frac{\\sqrt{3}}{2}$</td><td>$\\frac{\\sqrt{2}}{2}$</td><td>$\\frac{1}{2}$</td><td>$0$</td></tr></table>
      <p>$\\sin x$ = výška bodu na jednotkové kružnici, $\\cos x$ = vodorovná souřadnice.</p>
      <p>$\\mathrm{tg}\\, x$: $x \\ne \\frac{\\pi}{2} + k\\pi$. $\\mathrm{cotg}\\, x$: $x \\ne k\\pi$.</p>
      <p>Perioda: sin a cos $2\\pi$, tg a cotg $\\pi$. Na konec řešení proto přidej $+ 2k\\pi$ (nebo $+ k\\pi$).</p>` },
];

export const PATH = {
  id: 'defobor',
  cheat: CHEAT,
  title: 'Definiční obory',
  tagline: 'Kam smíš dosadit a kam ne',
  units: [
    {
      id: 'u1', title: 'Kam smím dosadit', desc: 'Úplný začátek. Nic nemusíš umět.',
      lessons: [
        {
          id: 'u1l1', title: 'Funkce jako automat', cards: [
            info('Funkce je automat na čísla', `<p>Hodíš do něj číslo $x$, automat s ním něco udělá a vyhodí výsledek $f(x)$.</p>
              <div class="machine"><span class="m-in">$3$</span><span class="m-arrow">→</span><span class="m-box">$f(x) = x + 2$</span><span class="m-arrow">→</span><span class="m-out">$5$</span></div>
              <p>Hodíš $3$, vypadne $3 + 2 = 5$. Nic složitého.</p>`),
            info('Některá čísla automat rozbijí', `<p>Zkus do $f(x) = \\frac{1}{x}$ hodit nulu: $\\frac{1}{0}$… Nulou dělit nejde. Automat se zasekne.</p>
              <p><b>Definiční obor</b> $D(f)$ jsou prostě <b>všechna čísla, která automat zvládne</b>. Nic víc za tím není.</p>`),
            G.canPlugFrac, G.canPlugFrac, G.whichBreaksFrac, G.canPlugFrac, G.whichBreaksFrac,
          ],
        },
        {
          id: 'u1l2', title: 'Tři věci, co rozbijí automat', cards: [
            info('Tři zakázané věci', `<ol class="big-list">
              <li><b>Dělit nulou.</b> $\\frac{1}{0}$ neexistuje.</li>
              <li><b>Sudá odmocnina ze záporného čísla.</b> $\\sqrt{-4}$ neexistuje. Ale $\\sqrt{0} = 0$ je v pohodě!</li>
              <li><b>Logaritmus z nuly nebo záporného čísla.</b> $\\ln 0$ ani $\\ln(-2)$ neexistují.</li></ol>
              <p class="muted">Logaritmus možná neznáš. Nevadí, zatím stačí vědět, že chce kladné číslo.</p>`),
            G.canPlug, G.canPlug, G.whichBreaks, G.canPlug, G.whichBreaks, G.canPlug,
          ],
        },
      ],
    },
    {
      id: 'u2', title: 'Intervaly', desc: 'Jak zapsat kus číselné osy.',
      lessons: [
        {
          id: 'u2l1', title: 'Osa a závorky', cards: [
            info('Interval = kus osy', `<p>Výsledkem nebude jedno číslo, ale <b>kus osy</b>. Ten zapisujeme intervalem:</p>
              <p>$\\langle 1, 4\\rangle$: od 1 do 4, <b>včetně</b> krajů (plné kolečko):</p>${numberLine(between(frac(1), frac(4)))}
              <p>$(1, 4)$: od 1 do 4, <b>bez</b> krajů (prázdné kolečko):</p>${numberLine(between(frac(1), frac(4), false, false))}`),
            info('Až do nekonečna', `<p>$\\langle 2, +\\infty)$: všechno od 2 doprava, včetně 2.</p>${numberLine(ge(frac(2)))}
              <p>U nekonečna je <b>vždycky kulatá závorka</b>: nekonečna se nejde „dotknout“.</p>`),
            G.belongs, G.readLine, G.belongs, G.lineFromTex, G.readLine, G.belongs, G.lineFromTex, G.readLine,
          ],
        },
        {
          id: 'u2l2', title: 'Sjednocení a díry', cards: [
            info('Dva kusy osy najednou', `<p>Znak $\\cup$ (sjednocení) znamená <b>„nebo“</b>: $(-\\infty, -1) \\cup (1, +\\infty)$</p>${numberLine(union(lt(frac(-1)), gt(frac(1))))}
              <p>Když z osy vyhodíme jediný bod (třeba 3), napíšeme $(-\\infty, 3) \\cup (3, +\\infty)$ nebo krátce $\\mathbb{R} \\setminus \\{3\\}$.</p>${numberLine(without(R(), frac(3)))}`),
            info('Teď je řada na tobě', `<p>Dole budeš mít klávesnici se všemi symboly: <b>⟨ ( ) ⟩ ∪ ∞ √</b>.</p>
              <p class="muted">Na počítači můžeš psát i <b>&lt; &gt;</b> místo ⟨ ⟩, <b>U</b> místo ∪ a <b>inf</b> místo ∞. Samo se to přepíše. Pod políčkem uvidíš, jak to vypadá na ose.</p>`),
            G.readLine, G.writeLine, G.writeLine, G.readLine, G.writeLine, G.writeLine,
          ],
        },
        { id: 'u2l3', title: 'Dril: zápis intervalů', drill: true, cards: [drillInfo, ...mix(8, G.writeLine)] },
      ],
    },
    {
      id: 'u3', title: 'Co hlídat', desc: 'Tahák a jednotný postup pro každý příklad.',
      lessons: [
        {
          id: 'u3l1', title: 'Tahák podmínek', cards: [
            info('Celý tahák na jedné kartičce', RULES_TABLE + '<p>Tohle je celé tajemství definičních oborů. Zbytek je už jen řešení nerovnic.</p>'),
            G.conditionFor, G.conditionFor, G.sortCond, G.conditionFor, G.conditionFor, G.sortCond,
          ],
        },
        {
          id: 'u3l2', title: 'Recept na každý příklad', cards: [
            info('Pořád stejné tři kroky', `<p>Každý definiční obor se počítá <b>úplně stejně</b>. Tohle je celý recept:</p>${RECIPE}
              <p>$f(x) = \\sqrt{x - 1} + \\frac{1}{x - 3}$</p><p>① $x - 1 \\ge 0$ a $x - 3 \\ne 0$<br>② $x \\ge 1$ a $x \\ne 3$<br>③ $D(f) = \\langle 1, 3) \\cup (3, +\\infty)$</p>
              <p class="muted">Ve zbytku cesty si tenhle recept zopakuješ tolikrát, že ho budeš dělat bez přemýšlení.</p>`),
            video('Lichá vs. sudá odmocnina', '56aff0ee-b7a7-4d50-95b7-46fb2ab2fe41', 'Video porovnává $\\sqrt[3]{1 - 2\\sin x}$ a $\\sqrt[4]{1 - 2\\sin x}$. Je tam i goniometrie, ta přijde později. Teď sleduj hlavně ten rozdíl mezi lichou a sudou odmocninou.'),
            G.multiCond, G.multiCond, G.conditionFor, G.multiCond, G.sortCond, G.multiCond,
          ],
        },
        { id: 'u3l3', title: 'Dril: podmínky', drill: true, cards: [drillInfo, ...mix(10, G.conditionFor, G.multiCond)] },
      ],
    },
    {
      id: 'u4', title: 'Lineární podmínky', desc: 'Nerovnice typu 3 − x ≥ 0.',
      lessons: [
        {
          id: 'u4l1', title: 'Jedna podmínka, jedna nerovnice', cards: [
            info('Nerovnice skoro jako rovnice', `<p>Nerovnici řešíš úplně stejně jako rovnici. Jen jedna past:</p>
              <div class="callout">Když násobíš nebo dělíš <b>záporným</b> číslem, znaménko se <b>otočí</b>.</div>
              <p>Proč? $-2 < 3$ platí. Vynásob obě strany $-1$: $2$ a $-3$, a teď už $2 > -3$.</p>`),
            info('Ukázka', `<p>$f(x) = \\sqrt{6 - 2x}$</p><ol class="steps-list"><li>Podmínka: $6 - 2x \\ge 0$</li><li>$-2x \\ge -6$, dělíme $-2$, otočíme: $x \\le 3$</li><li>$D(f) = (-\\infty, 3\\rangle$</li></ol>`),
            G.flipSign, guided(G.linear), guided(G.linear), G.flipSign, semi(G.linear), semi(G.linear), G.linear, G.linear,
          ],
        },
        { id: 'u4l2', title: 'Dril: lineární', drill: true, cards: [drillInfo, ...mix(10, G.linear)] },
      ],
    },
    {
      id: 'u5', title: 'Kvadratické podmínky', desc: 'Když je tam x². Parabola ti napoví.',
      lessons: [
        {
          id: 'u5l1', title: 'Parabola ti napoví', cards: [
            info('Krok 1: kořeny', `<p>U $x^2 - x - 6$ hledáš dvě čísla, jejichž <b>součin</b> je $-6$ a <b>součet</b> $1$ (opačné číslo k tomu u $x$). To jsou $-2$ a $3$:</p>
              <p>$x^2 - x - 6 = (x + 2)(x - 3)$</p><p class="muted">Když to nejde z hlavy, použij vzorec $x_{1,2} = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$.</p>`),
            info('Krok 2: parabola', `<p>Graf $y = x^2 + \\dots$ je parabola otevřená nahoru. Osu protíná v kořenech:</p>${G.parabolaSvg('−2', '3')}
              <p><b>Vně</b> kořenů je nad osou (+), <b>mezi</b> nimi pod osou (−). Víc nepotřebuješ.</p>`),
            G.rootsQuad, G.parabolaSign, G.rootsQuad, guided(G.quadratic), guided(G.quadratic), G.parabolaSign, semi(G.quadratic), semi(G.quadratic), G.quadratic,
          ],
        },
        { id: 'u5l2', title: 'Dril: kvadratické', drill: true, cards: [drillInfo, ...mix(10, G.quadratic)] },
      ],
    },
    {
      id: 'u6', title: 'Zlomky v podmínce', desc: 'Tabulka znamének.',
      lessons: [
        {
          id: 'u6l1', title: 'Tabulka znamének', cards: [
            info('Kdy je zlomek kladný?', `<p>Zlomek je kladný, když mají čitatel a jmenovatel <b>stejné znaménko</b>.</p>
              <p>Najdi body, kde je čitatel nebo jmenovatel nula. Ty rozdělí osu na kousky a v každém kousku má zlomek pořád stejné znaménko. Stačí dosadit jedno číslo z každého kousku.</p>
              <div class="callout">Nula ve jmenovateli nikdy nepatří do výsledku.</div>`),
            ch(G.rational), guided(G.rational), guided(G.rational), semi(G.rational), G.rational, G.rational,
          ],
        },
        {
          id: 'u6l2', title: 'Společný jmenovatel', cards: [
            video('Video: ln(3 + x/(x−1))', '79de269e-9b17-4278-aac4-c80db1d06035', 'Tenhle typ teď budeš počítat. Podívej se, jak se to dělá, klidně i dvakrát.'),
            info('Nejdřív jeden zlomek', `<p>$2 + \\frac{x}{x-3} = \\frac{2(x-3)}{x-3} + \\frac{x}{x-3} = \\frac{3x - 6}{x - 3}$</p><p>A pak tabulka znamének jako minule.</p>`),
            G.commonDen, guided(G.ratShift), G.commonDen, semi(G.ratShift), guided(G.FIXED.v2), G.ratShift, G.ratShift,
          ],
        },
        { id: 'u6l3', title: 'Dril: zlomky', drill: true, cards: [drillInfo, ...mix(10, G.rational, G.rational, G.ratShift)] },
      ],
    },
    {
      id: 'u7', title: 'Absolutní hodnota', desc: '|x − 3| je vzdálenost od trojky.',
      lessons: [
        {
          id: 'u7l1', title: 'Vzdálenost na ose', cards: [
            info('|x − c| = vzdálenost od c', `<p>Nejjednodušší pohled na absolutní hodnotu: $|x - 3|$ je <b>vzdálenost</b> čísla $x$ od čísla $3$.</p>
              <p>$|x - 3| < 2$: vzdálenost od 3 menší než 2, tedy $(1, 5)$.</p>${numberLine(between(frac(1), frac(5), false, false))}
              <p class="muted">$|x + 2| = |x - (-2)|$ je vzdálenost od $-2$.</p>`),
            G.absMeaning, G.absMeaning, guided(G.absDist), guided(G.absDist), G.absMeaning, semi(G.absDist), G.absDist, G.absDist,
          ],
        },
        {
          id: 'u7l2', title: 'Porovnání vzdáleností', cards: [
            info('Kdo je blíž?', `<p>$|x - 2| \\ge |x + 2|$: číslo $x$ je od $2$ aspoň tak daleko jako od $-2$.</p>
              <p>V půlce, v bodě $0$, jsou obě vzdálenosti stejné. Vlevo od nuly jsi blíž k $-2$, takže podmínka platí: $x \\le 0$.</p>`),
            guided(G.absCompare), semi(G.absCompare), G.FIXED.du2, guided(G.FIXED.du7), G.absCompare, G.absCompare,
          ],
        },
        { id: 'u7l3', title: 'Dril: absolutní hodnota', drill: true, cards: [drillInfo, ...mix(10, G.absDist, G.absDist, G.absCompare)] },
      ],
    },
    {
      id: 'u8', title: 'arcsin a arccos', desc: 'Berou jen čísla od −1 do 1.',
      lessons: [
        {
          id: 'u8l1', title: 'Jen od −1 do 1', cards: [
            info('Úzké hrdlo', `<p>$\\arcsin$ a $\\arccos$ umí zpracovat jen čísla z intervalu $\\langle -1, 1\\rangle$.</p>
              <p>Takže u $\\arcsin(2x - 1)$ chceš $-1 \\le 2x - 1 \\le 1$. Je to dvojitá nerovnice, řešíš ji naráz: přičti 1 všude a vyděl 2 všude, tedy $0 \\le x \\le 1$.</p>`),
            guided(G.arcLin), guided(G.arcLin), semi(G.arcLin), G.arcLin,
            info('Trik: 1 lomeno něco', `<p>$\\frac{1}{t}$ je mezi $-1$ a $1$ přesně tehdy, když $|t| \\ge 1$. Čím větší jmenovatel, tím menší zlomek: $\\frac{1}{5}$ je malé, $\\frac{1}{0{,}5} = 2$ už je moc.</p>`),
            guided(G.arcRecip), G.FIXED.du3, G.arcRecip,
          ],
        },
        {
          id: 'u8l2', title: 'Dvě nerovnice najednou', cards: [
            video('Video: arccos(x² + x − 1)', 'ca74c7cf-df9b-4a60-a7e6-3fb8325af6c6', 'Uvnitř je kvadratický výraz, takže dvě kvadratické nerovnice a pak průnik.'),
            guided(G.FIXED.v3), guided(G.arccosQuad), semi(G.arccosQuad), G.arccosQuad, G.arccosQuad,
          ],
        },
        { id: 'u8l3', title: 'Dril: arcsin a arccos', drill: true, cards: [drillInfo, ...mix(10, G.arcLin, G.arcRecip, G.arccosQuad)] },
      ],
    },
    {
      id: 'u9', title: 'Logaritmus a e', desc: 'ln uvnitř podmínky.',
      lessons: [
        {
          id: 'u9l1', title: 'Logaritmus uvnitř', cards: [
            info('Tři věci o ln, které stačí', `<ul class="big-list"><li>$\\ln x$ existuje jen pro $x > 0$.</li><li>$\\ln 1 = 0$, takže $\\ln x = 0$ přesně pro $x = 1$.</li>
              <li>$\\ln$ roste, takže $\\ln x < c$ znamená $x < \\mathrm{e}^c$, a $\\ln x \\ge 0$ znamená $x \\ge 1$.</li></ul>
              <p class="muted">$\\mathrm{e} \\approx 2{,}718$ je jen číslo, nemusíš se ho bát.</p>`),
            G.lnExp, G.lnExp, guided(G.logInside), guided(G.logInside),
            video('Video: ln(arcsin x) a arcsin(ln x)', '37e5285a-fd34-427a-b09d-41f17b98d8d9', 'Dvě funkce, které vypadají skoro stejně, ale mají úplně jiný definiční obor.'),
            guided(G.FIXED.v4a), guided(G.FIXED.v4b), semi(G.logInside), G.logInside,
          ],
        },
        { id: 'u9l2', title: 'Dril: logaritmy', drill: true, cards: [drillInfo, ...mix(7, G.logInside), G.FIXED.du8, G.FIXED.du1, G.FIXED.du6] },
      ],
    },
    {
      id: 'ug', title: 'Goniometrie', desc: 'sin, cos, tg na jednotkové kružnici.',
      lessons: [
        {
          id: 'ugl1', title: 'Jednotková kružnice', cards: [
            info('Kružnice s poloměrem 1', `<p>Úhel $x$ měříme od kladné osy proti směru hodinek. Bod na kružnici má souřadnice $(\\cos x, \\sin x)$:</p>
              <ul class="big-list"><li>$\\sin x$ = <b>výška</b> bodu (svislá osa),</li><li>$\\cos x$ = <b>vodorovná</b> souřadnice.</li></ul>
              <p>Celá kružnice je $2\\pi$ (to je $360°$), půlka je $\\pi$, čtvrtka $\\frac{\\pi}{2}$.</p>${circleSvg({ points: [[1, 6], [5, 6]], line: 0.5, fn: 'sin' })}
              <p class="muted">Přímka ve výšce $\\frac{1}{2}$ protne kružnici ve dvou bodech: $\\sin x = \\frac{1}{2}$ pro $x = \\frac{\\pi}{6}$ a $\\frac{5\\pi}{6}$.</p>`),
            info('Hodnoty, které stačí znát', `<table class="rules"><tr><th>$x$</th><th>$\\frac{\\pi}{6}$</th><th>$\\frac{\\pi}{4}$</th><th>$\\frac{\\pi}{3}$</th></tr>
              <tr><td>$\\sin x$</td><td>$\\frac{1}{2}$</td><td>$\\frac{\\sqrt{2}}{2}$</td><td>$\\frac{\\sqrt{3}}{2}$</td></tr>
              <tr><td>$\\cos x$</td><td>$\\frac{\\sqrt{3}}{2}$</td><td>$\\frac{\\sqrt{2}}{2}$</td><td>$\\frac{1}{2}$</td></tr></table>
              <p class="muted">Zbytek se dopočítá z obrázku: kružnice je souměrná.</p>`),
            T.unitValue, T.unitValue, T.unitValue, T.unitValue, T.unitValue,
          ],
        },
        {
          id: 'ugl2', title: 'Nerovnice na kružnici', cards: [
            info('Přímka, oblouk, perioda', `<p>$\\sin x \\ge \\frac{1}{2}$:</p><ol class="steps-list"><li>Nakresli přímku ve výšce $\\frac{1}{2}$.</li><li>Vyber oblouk, který je <b>nad</b> ní: od $\\frac{\\pi}{6}$ do $\\frac{5\\pi}{6}$.</li><li>Kružnice se točí pořád dokola, takže přidej $2k\\pi$.</li></ol>
              ${circleSvg({ arc: { a: [1, 6], b: [5, 6], ai: true, bi: true }, line: 0.5, fn: 'sin' })}
              <p>$\\bigcup_{k \\in \\mathbb{Z}} \\left\\langle \\frac{\\pi}{6} + 2k\\pi, \\frac{5\\pi}{6} + 2k\\pi \\right\\rangle$</p>
              <p class="muted">Znak $\\bigcup_{k \\in \\mathbb{Z}}$ jen říká „a tohle samé posunuté o každý celý počet otoček“.</p>`),
            T.trigIneq, T.trigIneq, T.trigIneq, T.trigIneq, T.trigIneq, T.trigIneq,
          ],
        },
        {
          id: 'ugl3', title: 'tg a definiční obory', cards: [
            info('tg a cotg jsou zlomky', `<p>$\\mathrm{tg}\\, x = \\frac{\\sin x}{\\cos x}$, takže $\\cos x \\ne 0$, tedy $x \\ne \\frac{\\pi}{2} + k\\pi$.</p>
              <p>$\\mathrm{cotg}\\, x = \\frac{\\cos x}{\\sin x}$, takže $\\sin x \\ne 0$, tedy $x \\ne k\\pi$.</p>
              <p class="muted">tg a cotg se opakují už po $\\pi$, sin a cos až po $2\\pi$.</p>`),
            T.tgCond, T.tgCond,
            video('Video: ∛ a ∜ z 1 − 2 sin x', '56aff0ee-b7a7-4d50-95b7-46fb2ab2fe41', 'Teď už tomuhle videu rozumíš celému.'),
            T.v5, T.trigDomain, T.trigDomain, T.v5, T.trigDomain, T.du5,
          ],
        },
        { id: 'ugl4', title: 'Dril: goniometrie', drill: true, cards: [drillInfo, ...mix(10, T.trigDomainPlain, T.trigDomainPlain, T.trigIneq, T.tgCond)] },
      ],
    },
    {
      id: 'u10', title: 'Všechno dohromady', desc: 'Víc podmínek, průnik, příklady ze Série 1.',
      lessons: [
        {
          id: 'u10l1', title: 'Průnik podmínek', cards: [
            info('Musí platit všechno', `<p>Každý kousek funkce dá svou podmínku. Definiční obor je to, co platí <b>všude zároveň</b>, tedy průnik. Nejlíp to uvidíš, když si osy nakreslíš pod sebe:</p>
              ${numberLine(ge(frac(-2)), { extra: [frac(-2), frac(1)], label: '$x \\ge -2$' })}${numberLine(without(R(), frac(1)), { extra: [frac(-2), frac(1)], label: '$x \\ne 1$' })}
              ${numberLine(without(ge(frac(-2)), frac(1)), { extra: [frac(-2), frac(1)], label: 'obojí' })}`),
            G.intersectQ, G.intersectQ, guided(G.combo), guided(G.combo),
            video('Video: √(x² − x − 6) / (1 − √(x + 4))', '8b7ccda6-b703-4c66-9e31-b4e72f644490', 'Tři podmínky v jednom příkladu. Přesně tohle teď umíš.'),
            guided(G.FIXED.v1), semi(G.combo), semi(G.combo), G.combo,
          ],
        },
        {
          id: 'u10l2', title: 'Příklady ze Série 1', boss: true, cards: [
            info('Opravdové příklady ze cvičení', '<p>Tyhle příklady jsou ze Série 1, kterou dostanete na cvičení. Teď už máš všechno, co na ně potřebuješ.</p><p class="muted">Kdyžtak klikni na nápovědu. Na to tu je.</p>'),
            semi(G.FIXED.du1), G.FIXED.du2, G.FIXED.du3, semi(G.FIXED.du4), T.du5, G.FIXED.du6, G.FIXED.du7, G.FIXED.du8,
          ],
        },
        {
          id: 'u10l3', title: 'Velký dril', drill: true, cards: [drillInfo, ...mix(12, G.combo, G.combo, G.linear, G.quadratic, G.rational, G.ratShift, G.absDist, G.arcLin, G.arcRecip, G.arccosQuad, G.logInside)],
        },
      ],
    },
  ],
  fluency: {
    id: 'fluency', title: 'Zkouška plynulosti',
    desc: '8 smíšených příkladů. Měří se čas, ale jen pro tebe: žádný odpočet, žádný tlak.',
    pool: [G.linear, G.quadratic, G.rational, G.ratShift, G.absDist, G.absCompare, G.arcLin, G.arcRecip, G.arccosQuad, G.logInside, G.combo, G.combo, T.trigDomainPlain],
    count: 8,
  },
};
