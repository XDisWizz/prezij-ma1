// Příklad 7 písemky: tvrzení pravda / nepravda. Všechna tvrzení z písemek z minulých let,
// každé se správnou odpovědí a vysvětlením (u nepravdivých s protipříkladem).
// Bodování jako na písemce: +2 za správnou, −2 za špatnou, bez odpovědi 0, celkem nejméně 0 a nejvýš 10.
import { pick, shuffle, ri } from '../ui.js';

const R = String.raw;
// témata kvůli pestrosti (do jedné pětice nejvýš jedno tvrzení od tématu)
// spoj = spojitost, deriv = derivace a spojitost, ext = extrémy, mono = monotonie, konv = konvexita,
// asym = asymptoty, int = integrály, post = posloupnosti, vlast = vlastnosti funkcí (sudá, lichá, prostá, periodická, omezená)
const T = (id, topic, truth, tex, why) => ({ id, topic, truth, tex, why });

export const BANK = [
  // ---------------------------------------------------------------- konvexita, druhá derivace
  T('konv1', 'konv', true, R`Je-li $f''(x) = x - 1$ pro každé $x \in (2,5)$, pak funkce $f$ je na intervalu $(2,5)$ ryze konvexní.`,
    R`Pro $x \in (2,5)$ je $x - 1 > 0$, tedy $f'' > 0$ na celém intervalu, a to znamená ryze konvexní.`),
  // ---------------------------------------------------------------- integrály
  T('int-arcsin', 'int', false, R`Na intervalu $(-1,1)$ platí $\int \frac{2}{\sqrt{1-x^2}}\,\mathrm{d}x = \arcsin x + \arccos x$.`,
    R`$(\arcsin x + \arccos x)' = \frac{1}{\sqrt{1-x^2}} - \frac{1}{\sqrt{1-x^2}} = 0$, ne $\frac{2}{\sqrt{1-x^2}}$. Součet $\arcsin x + \arccos x$ je konstanta $\frac{\pi}{2}$. Správně je $2\arcsin x$ (nebo třeba $\arcsin x - \arccos x$).`),
  T('int-arccotg', 'int', true, R`Na $\mathbb{R}$ platí $\int \frac{1}{1+x^2}\,\mathrm{d}x = 1 - \operatorname{arccotg} x$.`,
    R`$(1 - \operatorname{arccotg} x)' = 0 - \left(-\frac{1}{1+x^2}\right) = \frac{1}{1+x^2}$. Primitivní funkce není jen jedna, $1 - \operatorname{arccotg} x$ je jedna z nich (liší se od $\operatorname{arctg} x$ o konstantu).`),
  T('int-sin2x-cos', 'int', true, R`Na $\mathbb{R}$ platí $\int \sin 2x\,\mathrm{d}x = -\cos^2 x$.`,
    R`$(-\cos^2 x)' = -2\cos x\cdot(-\sin x) = 2\sin x\cos x = \sin 2x$. Liší se od $-\frac{1}{2}\cos 2x$ jen o konstantu.`),
  T('int-sin2x-sin', 'int', true, R`Na $\mathbb{R}$ platí $\int \sin 2x\,\mathrm{d}x = \sin^2 x$.`,
    R`$(\sin^2 x)' = 2\sin x\cos x = \sin 2x$. I $\sin^2 x$ je primitivní funkce (od $-\cos^2 x$ se liší o konstantu $1$).`),
  T('int-1-2x', 'int', false, R`Na intervalu $(0,+\infty)$ platí $\int \frac{1}{2x}\,\mathrm{d}x = \ln(2x)$.`,
    R`$(\ln 2x)' = \frac{2}{2x} = \frac{1}{x}$, ne $\frac{1}{2x}$. Správně je $\frac{1}{2}\ln x$ (konstanta $\frac{1}{2}$ zůstane před logaritmem).`),
  T('int-ln3x', 'int', true, R`Na intervalu $(0,+\infty)$ platí $\int \frac{1}{x}\,\mathrm{d}x = \ln(3x)$.`,
    R`$(\ln 3x)' = \frac{3}{3x} = \frac{1}{x}$. Jinak: $\ln 3x = \ln x + \ln 3$, liší se od $\ln x$ jen o konstantu.`),
  T('int-arctg-arccotg', 'int', true, R`Na intervalu $(0,+\infty)$ platí $\int \frac{1}{x}\,\mathrm{d}x = \ln x + \operatorname{arctg} x + \operatorname{arccotg} x$.`,
    R`$\operatorname{arctg} x + \operatorname{arccotg} x = \frac{\pi}{2}$ je konstanta, takže výraz je $\ln x + \frac{\pi}{2}$ a jeho derivace je $\frac{1}{x}$.`),
  T('int-3-x', 'int', true, R`Na intervalu $(0,+\infty)$ platí $\int \frac{3}{x}\,\mathrm{d}x = \ln\left(x^3\right)$.`,
    R`$\ln(x^3) = 3\ln x$ a $(3\ln x)' = \frac{3}{x}$.`),
  T('int-2025', 'int', true, R`Na intervalu $(0,+\infty)$ platí $\int \frac{1}{x}\,\mathrm{d}x = \ln\left(\frac{x}{2025}\right)$.`,
    R`$\ln\frac{x}{2025} = \ln x - \ln 2025$, to je $\ln x$ plus konstanta. Derivace je $\frac{1}{x}$.`),
  T('int-2026', 'int', true, R`Na intervalu $(0,+\infty)$ platí $\int \frac{1}{x}\,\mathrm{d}x = \ln\left(\frac{x}{2026}\right)$.`,
    R`$\ln\frac{x}{2026} = \ln x - \ln 2026$, to je $\ln x$ plus konstanta. Derivace je $\frac{1}{x}$.`),
  T('int-2026x', 'int', false, R`Na intervalu $(0,+\infty)$ platí $\int \frac{1}{2026x}\,\mathrm{d}x = \ln(2026x)$.`,
    R`$(\ln 2026x)' = \frac{1}{x}$, ne $\frac{1}{2026x}$. Správně je $\frac{1}{2026}\ln x$.`),
  // ---------------------------------------------------------------- vlastnosti funkcí
  T('licha-prosta', 'vlast', false, R`Je-li funkce $f$ lichá, pak $f$ je prostá.`,
    R`Protipříklad: $\sin x$ je lichá, ale není prostá ($\sin 0 = \sin \pi = 0$).`),
  T('licha-prosta2', 'vlast', false, R`Každá lichá funkce je prostá.`,
    R`Protipříklad: $\sin x$ je lichá, ale $\sin 0 = \sin \pi$. Nebo $x^3 - x$: lichá, a přitom $f(-1) = f(0) = f(1) = 0$.`),
  T('rost-prosta', 'vlast', true, R`Je-li funkce $f$ rostoucí, pak $f$ je prostá.`,
    R`Rostoucí znamená $x_1 < x_2 \Rightarrow f(x_1) < f(x_2)$, takže různá $x$ dávají různé hodnoty. To je přesně prostota.`),
  T('ne-suda-licha', 'vlast', false, R`Jestliže funkce $f$ není sudá, pak je $f$ lichá.`,
    R`Protipříklad: $f(x) = x + 1$ není sudá ani lichá ($f(-1) = 0$, $f(1) = 2$).`),
  T('period-omez', 'vlast', false, R`Každá periodická funkce je omezená.`,
    R`Protipříklad: $\operatorname{tg} x$ je periodická (perioda $\pi$), ale není omezená.`),
  T('period-suda-licha', 'vlast', false, R`Každá periodická funkce je sudá nebo lichá.`,
    R`Protipříklad: $\sin x + \cos x$ je periodická, ale $f(-x) = -\sin x + \cos x$ není ani $f(x)$, ani $-f(x)$. Nebo $\sin(x + 1)$.`),
  T('omez-asym', 'asym', true, R`Existuje omezená funkce, která má asymptotu.`,
    R`Například $\operatorname{arctg} x$: je omezená (mezi $-\frac{\pi}{2}$ a $\frac{\pi}{2}$) a má vodorovné asymptoty $y = \pm\frac{\pi}{2}$.`),
  // ---------------------------------------------------------------- spojitost a omezenost
  T('spoj-uzavr-omez', 'spoj', true, R`Je-li funkce $f$ spojitá na intervalu $I = \langle 0,1\rangle$, pak $f$ musí být na $I$ omezená.`,
    R`Weierstrassova věta: funkce spojitá na <b>uzavřeném</b> omezeném intervalu je na něm omezená (a dokonce nabývá maxima i minima).`),
  T('spoj-uzavr-omez2', 'spoj', true, R`Každá funkce spojitá na intervalu $\langle 0,1\rangle$ je na $\langle 0,1\rangle$ omezená.`,
    R`Weierstrassova věta: spojitá funkce na uzavřeném intervalu je omezená.`),
  T('spoj-otevr-omez', 'spoj', false, R`Je-li funkce $f$ spojitá na intervalu $(0,1)$, pak je $f$ na $(0,1)$ omezená.`,
    R`Protipříklad: $f(x) = \frac{1}{x}$ je spojitá na $(0,1)$, ale u nuly roste nade všechny meze. Weierstrassova věta platí jen pro uzavřený interval.`),
  T('spoj-poloprimka-omez', 'spoj', false, R`Každá funkce spojitá na intervalu $(0,+\infty)$ je na tomto intervalu omezená.`,
    R`Protipříklad: $f(x) = x$ (nebo $\frac{1}{x}$) je spojitá na $(0,+\infty)$ a omezená není.`),
  T('spoj-R-omez', 'spoj', false, R`Každá funkce $f$ spojitá na $\mathbb{R}$ je na $\mathbb{R}$ omezená.`,
    R`Protipříklad: $f(x) = x$ je spojitá na $\mathbb{R}$ a omezená není.`),
  T('omez-spoj', 'spoj', false, R`Je-li funkce $f$ omezená na uzavřeném intervalu $I$, pak je $f$ na $I$ spojitá.`,
    R`Obrácená Weierstrassova věta neplatí. Protipříklad: $\operatorname{sgn} x$ na $\langle -1, 1\rangle$ je omezená, ale v nule není spojitá.`),
  // ---------------------------------------------------------------- derivace a spojitost
  T('spoj-deriv', 'deriv', false, R`Je-li $f$ spojitá v bodě $x_0$, pak existuje derivace $f'(x_0)$.`,
    R`Protipříklad: $|x|$ je spojitá v nule, ale derivace tam neexistuje (zleva $-1$, zprava $1$).`),
  T('spoj-deriv2', 'deriv', false, R`Každá funkce, která je v bodě $x_0 \in \mathbb{R}$ spojitá, má v bodě $x_0$ (první) derivaci.`,
    R`Protipříklad: $|x|$ v bodě $0$ je spojitá, ale derivaci nemá (hrot).`),
  T('deriv-Rstar', 'deriv', false, R`Je-li $f'(x_0) \in \mathbb{R}^*$, pak je funkce $f$ v bodě $x_0$ spojitá.`,
    R`$\mathbb{R}^*$ obsahuje i $\pm\infty$. Spojitost plyne jen z <b>vlastní</b> (konečné) derivace. Protipříklad: $\operatorname{sgn} x$ má v nule derivaci $+\infty$ ($\frac{\operatorname{sgn} h}{h} = \frac{1}{|h|} \to +\infty$), a spojitá tam není.`),
  T('deriv-Rstar2', 'deriv', false, R`Každá funkce $f$ splňující $f'(1) \in \mathbb{R}^*$ je v bodě $1$ spojitá.`,
    R`$\mathbb{R}^*$ zahrnuje i nekonečno. Protipříklad: $\operatorname{sgn}(x - 1)$ má v bodě $1$ derivaci $+\infty$, ale je tam nespojitá. Spojitost zaručí jen konečná derivace.`),
  T('nek-deriv-spoj', 'deriv', true, R`Funkce mající nekonečnou derivaci v bodě $x_0$ může být v bodě $x_0$ spojitá.`,
    R`Například $\sqrt[3]{x}$ je v nule spojitá a má tam derivaci $+\infty$ (svislá tečna). „Může být“ stačí ukázat jedním příkladem.`),
  T('nek-deriv-spoj5', 'deriv', true, R`Existuje funkce $f$, která je spojitá v bodě $5$ a splňuje $f'(5) = +\infty$.`,
    R`Například $f(x) = \sqrt[3]{x - 5}$: v bodě $5$ je spojitá a derivace $\frac{1}{3\sqrt[3]{(x-5)^2}} \to +\infty$.`),
  // ---------------------------------------------------------------- extrémy
  T('max-deriv0', 'ext', false, R`Má-li funkce $f$ lokální maximum v bodě $3$, pak $f'(3) = 0$.`,
    R`Fermatova věta platí jen tam, kde derivace <b>existuje</b>. Protipříklad: $f(x) = -|x - 3|$ má v bodě $3$ maximum, ale derivaci tam nemá.`),
  T('deriv0-ext', 'ext', false, R`Je-li $f'(5) = 0$, má funkce $f$ v bodě $5$ lokální extrém.`,
    R`Protipříklad: $f(x) = (x - 5)^3$ má $f'(5) = 0$, ale je rostoucí, extrém tam není (inflexní bod).`),
  T('deriv0-ext3', 'ext', false, R`Každá funkce $f$ splňující $f'(3) = 0$ má v bodě $3$ lokální extrém.`,
    R`Protipříklad: $(x - 3)^3$. Nulová derivace je jen podmínka nutná, ne postačující.`),
  T('f2-min', 'ext', false, R`Je-li $f''(x_0) > 0$, pak funkce $f$ má v bodě $x_0$ ostré lokální minimum.`,
    R`Chybí podmínka $f'(x_0) = 0$. Protipříklad: $f(x) = x^2$ v bodě $x_0 = 1$: $f''(1) = 2 > 0$, ale $f'(1) = 2 \ne 0$, žádný extrém.`),
  T('f2-min3', 'ext', false, R`Každá funkce $f$ splňující $f''(3) > 0$ má v bodě $3$ ostré lokální minimum.`,
    R`Chybí $f'(3) = 0$. Protipříklad: $f(x) = x^2$ má $f''(3) = 2 > 0$, ale $f'(3) = 6$ a v bodě $3$ extrém nemá.`),
  T('f2-nemax', 'ext', true, R`Je-li $f''(x_0) > 0$, pak funkce $f$ <b>nemá</b> v bodě $x_0$ lokální maximum.`,
    R`Když existuje $f''(x_0)$, existuje i $f'(x_0)$. Je-li $f'(x_0) \ne 0$, extrém tam není vůbec. Je-li $f'(x_0) = 0$, pak $f'' > 0$ dává ostré <b>minimum</b>. Maximum tedy v žádném případě.`),
  T('max-f2-5', 'ext', false, R`Existuje funkce $f$ mající v bodě $1$ lokální maximum, která současně splňuje $f''(1) = 5$.`,
    R`Z existence $f''(1)$ plyne, že $f'(1)$ existuje, a z maxima (Fermat) $f'(1) = 0$. Pak $f''(1) = 5 > 0$ znamená ostré lokální minimum, a to s maximem nejde dohromady.`),
  T('f1-0-f2-neg5', 'ext', true, R`Je-li $f'(1) = 0$ a $f''(1) = -5$, má funkce $f$ v bodě $1$ lokální extrém.`,
    R`Postačující podmínka: $f'(1) = 0$ a $f''(1) < 0$, takže je tam ostré lokální maximum.`),
  T('f1-0-f2-neg1', 'ext', true, R`Platí-li $f'(2) = 0$ a $f''(2) = -1$, pak funkce $f$ musí mít v bodě $2$ lokální extrém.`,
    R`$f'(2) = 0$ a $f''(2) < 0$: ostré lokální maximum.`),
  T('f1-0-f2-neg1b', 'ext', true, R`Každá funkce $f$ splňující $f'(2) = 0$ a $f''(2) = -1$ má v bodě $2$ lokální extrém.`,
    R`Postačující podmínka: $f'(2) = 0$, $f''(2) < 0$, tedy ostré lokální maximum.`),
  T('f1-0-f2-5', 'ext', true, R`Platí-li $f'(1) = 0$ a $f''(1) = 5$, pak má funkce $f$ v bodě $1$ lokální extrém.`,
    R`$f'(1) = 0$ a $f''(1) > 0$: ostré lokální minimum.`),
  // ---------------------------------------------------------------- monotonie a derivace
  T('nekles-deriv', 'mono', true, R`Je-li $f$ neklesající na intervalu $(0,1)$ a existuje-li $f'$ na $(0,1)$, pak $f'(x) \ge 0$ pro každé $x \in (0,1)$.`,
    R`U neklesající funkce jsou všechny podíly $\frac{f(x+h) - f(x)}{h} \ge 0$, a limita nezáporných čísel je nezáporná.`),
  T('rost-deriv-kladna', 'mono', false, R`Je-li $f$ rostoucí na intervalu $(-1,1)$ a existuje-li $f'$ na $(-1,1)$, pak $f'(x) > 0$ pro každé $x \in (-1,1)$.`,
    R`Protipříklad: $f(x) = x^3$ je rostoucí, ale $f'(0) = 0$. Z rostoucí funkce plyne jen $f' \ge 0$.`),
  T('deriv-nezap-nekles', 'mono', true, R`Každá funkce mající na intervalu $(0,1)$ nezápornou a konečnou první derivaci je na $(0,1)$ neklesající.`,
    R`Věta o monotonii: $f' \ge 0$ na intervalu $\Rightarrow$ $f$ je tam neklesající.`),
  T('deriv-nezap-nekles2', 'mono', true, R`Každá funkce mající ve všech bodech intervalu $(0,1)$ nezápornou a konečnou první derivaci je na $(0,1)$ neklesající.`,
    R`Věta o monotonii: $f' \ge 0$ všude na intervalu $\Rightarrow$ neklesající.`),
  T('deriv-klad-rost', 'mono', true, R`Každá funkce mající na intervalu $(0,5)$ kladnou a konečnou první derivaci je na $(0,5)$ rostoucí.`,
    R`Věta o monotonii: $f' > 0$ na intervalu $\Rightarrow$ $f$ je tam rostoucí.`),
  T('deriv-klad-rost2', 'mono', true, R`Každá funkce mající ve všech bodech intervalu $(0,5)$ kladnou a konečnou první derivaci je na $(0,5)$ rostoucí.`,
    R`Věta o monotonii (z Lagrangeovy věty): $f' > 0$ na intervalu $\Rightarrow$ rostoucí.`),
  // ---------------------------------------------------------------- posloupnosti
  T('post-rost-limita', 'post', true, R`Každá rostoucí posloupnost má limitu.`,
    R`Monotonní posloupnost má vždycky limitu: shora omezená vlastní, neomezená $+\infty$. „Mít limitu“ zahrnuje i nevlastní limitu.`),
  T('post-rost-konv', 'post', false, R`Každá rostoucí posloupnost je konvergentní.`,
    R`Protipříklad: $a_n = n$ je rostoucí, ale má limitu $+\infty$, takže není konvergentní (konvergentní = vlastní limita).`),
  T('post-kles-zap', 'post', false, R`Každá klesající posloupnost má zápornou limitu.`,
    R`Protipříklad: $a_n = \frac{1}{n}$ je klesající a má limitu $0$, která není záporná.`),
  T('post-rost-klad', 'post', false, R`Každá rostoucí posloupnost má kladnou limitu.`,
    R`Protipříklad: $a_n = -\frac{1}{n}$ je rostoucí a má limitu $0$, ta není kladná.`),
  // ---------------------------------------------------------------- asymptoty
  T('asym-lim5', 'asym', true, R`Platí-li $\lim\limits_{x\to+\infty} f(x) = 5$, pak $f$ má asymptotu v $+\infty$.`,
    R`Vlastní limita v $+\infty$ znamená vodorovnou asymptotu $y = 5$ (asymptota se směrnicí $k = 0$, $q = 5$).`),
  T('asym-jednostr', 'asym', false, R`Jestliže $\lim\limits_{x\to0+} f(x) \ne \lim\limits_{x\to0-} f(x)$, pak přímka $x = 0$ je svislou asymptotou funkce $f$.`,
    R`Svislá asymptota potřebuje aspoň jednu <b>nevlastní</b> jednostrannou limitu ($\pm\infty$). Protipříklad: $\operatorname{sgn} x$ má limity $1$ a $-1$, různé, ale konečné.`),
  T('asym-nespoj', 'asym', false, R`Jestliže funkce $f$ není v bodě $x_0$ spojitá, pak přímka $x = x_0$ je svislou asymptotou funkce $f$.`,
    R`Protipříklad: $\operatorname{sgn} x$ není v nule spojitá, ale obě jednostranné limity jsou konečné ($\pm 1$), takže svislá asymptota tam není.`),
  T('asym-nespoj2', 'asym', false, R`Každá funkce $f$, která není v bodě $x_0 \in \mathbb{R}$ spojitá, má asymptotu o rovnici $x = x_0$.`,
    R`Protipříklad: $\operatorname{sgn} x$ v nule: skok, ale žádná nekonečná limita, takže svislá asymptota není.`),
  T('asym-k2', 'asym', false, R`Platí-li $\lim\limits_{x\to+\infty} \frac{f(x)}{x} = 2$, pak přímka $y = 2x$ je asymptotou funkce $f$ v $+\infty$.`,
    R`Je potřeba ještě $q = \lim (f(x) - 2x) = 0$. Protipříklad: $f(x) = 2x + 1$ má $k = 2$, ale asymptota je $y = 2x + 1$. Nebo $f(x) = 2x + \ln x$ nemá asymptotu vůbec.`),
  T('asym-k2b', 'asym', false, R`Každá funkce $f$ splňující $\lim\limits_{x\to+\infty}\frac{f(x)}{x} = 2$ má asymptotu o rovnici $y = 2x$.`,
    R`Chybí podmínka $\lim (f(x) - 2x) = 0$. Protipříklad: $f(x) = 2x + 3$, asymptota je $y = 2x + 3$.`),
  T('asym-DR', 'asym', false, R`Jestliže definiční obor funkce $f$ je roven celému $\mathbb{R}$, pak funkce $f$ nemá svislé asymptoty.`,
    R`Protipříklad: $f(x) = \frac{1}{x}$ pro $x \ne 0$ a $f(0) = 0$. Je definovaná na celém $\mathbb{R}$, a $x = 0$ je svislá asymptota.`),
  T('asym-DR2', 'asym', true, R`Existuje funkce definovaná na $\mathbb{R}$ mající svislou asymptotu.`,
    R`Například $f(x) = \frac{1}{x}$ pro $x \ne 0$, $f(0) = 0$: definovaná všude a v nule má svislou asymptotu.`),
];

// ---------------------------------------------------------------- tvrzení s náhodnými čísly (trénink, nové písemky)
const GEN = [
  () => { const k = pick([2, 3, 5, 7, 2025, 2026]); return Math.random() < 0.5
    ? T('g-int-lnkx', 'int', true, `Na intervalu $(0,+\\infty)$ platí $\\int \\frac{1}{x}\\,\\mathrm{d}x = \\ln(${k}x)$.`, `$(\\ln ${k}x)' = \\frac{${k}}{${k}x} = \\frac{1}{x}$, je to $\\ln x + \\ln ${k}$.`)
    : T('g-int-lnkx2', 'int', false, `Na intervalu $(0,+\\infty)$ platí $\\int \\frac{1}{${k}x}\\,\\mathrm{d}x = \\ln(${k}x)$.`, `$(\\ln ${k}x)' = \\frac{1}{x}$, ne $\\frac{1}{${k}x}$. Správně je $\\frac{1}{${k}}\\ln x$.`); },
  () => { const k = ri(2, 6); return Math.random() < 0.5
    ? T('g-int-kx', 'int', true, `Na intervalu $(0,+\\infty)$ platí $\\int \\frac{${k}}{x}\\,\\mathrm{d}x = \\ln\\left(x^{${k}}\\right)$.`, `$\\ln x^{${k}} = ${k}\\ln x$ a jeho derivace je $\\frac{${k}}{x}$.`)
    : T('g-int-kx2', 'int', false, `Na intervalu $(0,+\\infty)$ platí $\\int \\frac{${k}}{x}\\,\\mathrm{d}x = \\ln(${k}x)$.`, `$(\\ln ${k}x)' = \\frac{1}{x}$, ne $\\frac{${k}}{x}$. Správně je $${k}\\ln x = \\ln x^{${k}}$.`); },
  () => { const a = ri(1, 6), b = ri(1, 9) * pick([1, -1]); const ok = Math.random() < 0.5, claim = ok ? (b < 0 ? 'maximum' : 'minimum') : (b < 0 ? 'minimum' : 'maximum');
    return T('g-f2', 'ext', ok, `Platí-li $f'(${a}) = 0$ a $f''(${a}) = ${b}$, pak má funkce $f$ v bodě $${a}$ ostré lokální ${claim}.`,
      `$f'(${a}) = 0$ a $f''(${a}) ${b < 0 ? '< 0' : '> 0'}$ dává ostré lokální <b>${b < 0 ? 'maximum' : 'minimum'}</b>.`); },
  () => { const a = ri(-3, 3), b = a + ri(2, 4); let c; do { c = ri(-4, 4); } while (!c); const inside = c <= a; // x − c > 0 na (a, b) právě když c ≤ a
    const fx = `x ${c < 0 ? '+' : '-'} ${Math.abs(c)}`;
    return T('g-konv', 'konv', inside, `Je-li $f''(x) = ${fx}$ pro každé $x \\in (${a},${b})$, pak funkce $f$ je na intervalu $(${a},${b})$ ryze konvexní.`,
      inside ? `Pro $x \\in (${a},${b})$ je $x > ${a} \\ge ${c}$, tedy $f''(x) = ${fx} > 0$: ryze konvexní.`
        : `Pro $x$ kousek za $${a}$ je $f''(x) = ${fx} < 0$${c < b ? ` (znaménko se mění až v bodě $${c}$)` : ''}, takže $f''$ není na celém intervalu kladná a $f$ tam ryze konvexní není.`); },
];

/** pětice tvrzení do písemky: různá témata, aspoň jedno pravdivé a jedno nepravdivé */
export function pickFive(withGen = true) {
  for (let tries = 0; tries < 200; tries++) {
    const pool = shuffle([...BANK, ...(withGen ? GEN.map(g => g()) : [])]);
    const out = [], topics = new Set();
    for (const s of pool) { if (out.length === 5) break; if (topics.has(s.topic)) continue; topics.add(s.topic); out.push(s); }
    const t = out.filter(s => s.truth).length;
    if (out.length === 5 && t >= 1 && t <= 4) return out;
  }
  return shuffle(BANK).slice(0, 5);
}
/** jedno tvrzení (trénink) */
export const anyStatement = () => (Math.random() < 0.25 ? pick(GEN)() : pick(BANK));
export const byId = id => BANK.find(s => s.id === id);

/** bodování jako na písemce */
export const tfScore = (right, wrong) => Math.max(0, Math.min(10, 2 * right - 2 * wrong));
