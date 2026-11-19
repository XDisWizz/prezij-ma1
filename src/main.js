import { h, m, pick, shuffle, fitMath, PRAISE, SOFT, ICONS } from './ui.js';
import { renderCard } from './cards.js';
import { store } from './store.js';
import * as sync from './sync.js';
import { trophySvg, tierFromAcc, tierFromMistakes, chyb, nextGoal, TIER_NAME, TIER_LABEL } from './trophy.js';
import { PATH as DEFOBOR } from './defobor/content.js';
import { GEN as GEN0, asChoice } from './defobor/gen.js';
import { GONIO_GEN } from './defobor/gonio.js';

import { PATH as DERIVACE } from './derivace/content.js';
import { GEN as DGEN } from './derivace/gen.js';
import { PATH as LIMITY } from './limity/content.js';
import { GEN as LGEN } from './limity/gen.js';
import { PATH as PRUBEH } from './prubeh/content.js';
import { GEN as PGEN } from './prubeh/gen.js';
import { PATH as INTEGRALY } from './integraly/content.js';
import { GEN as IGEN } from './integraly/gen.js';

import { DECK as DECK1 } from './defobor/hlava.js';
import { DECK as DECK2 } from './derivace/hlava.js';
import { DECK as DECK3 } from './limity/hlava.js';
import { DECK as DECK4 } from './prubeh/hlava.js';
import { DECK as DECK5 } from './integraly/hlava.js';
import { buildRound, focusRound, memoryOf, isDue, dueInDays, TOP } from './zhlavy.js';
import { ZM } from './zm/paths.js';
import { DECKS as ZDECKS } from './zm/hlava.js';
import { VARIANTS, TOTAL, TOPIC } from './zm/test.js';
import { setWallpaper } from './wallpaper.js';
import { newExam, newSeed as examSeed, TRAIN, allStatements } from './pisemka/gen.js';
import { EXAMS, GROUPS, examById, examProblems } from './pisemka/exams.js';
import { BANK } from './pisemka/tf.js';
import { examSheet, solutionSheet } from './pisemka/print.js';
import * as hx from './haptics.js';
const { haptic, hapticSeq, hapticStop, streakFx, sparkle, ramp } = hx;

const GEN = { ...GEN0, ...GONIO_GEN };

// deck = balíček karet pro režim Z hlavy (src/<cesta>/hlava.js)
const PATHS = [
  { id: 'defobor', short: 'Definiční obory', title: 'Definiční obory', tagline: 'Kam smíš dosadit a kam ne', content: DEFOBOR, gen: GEN, deck: DECK1 },
  { id: 'derivace', short: 'Derivace', title: 'Derivace', tagline: 'Od tabulky po složené funkce', content: DERIVACE, gen: DGEN, deck: DECK2 },
  { id: 'limity', short: 'Limity', title: 'Limity posloupností a funkcí', tagline: 'Kam to celé míří', content: LIMITY, gen: LGEN, deck: DECK3 },
  { id: 'prubeh', short: 'Průběh funkce', title: 'Průběh funkce + Taylor', tagline: 'Z rovnice obrázek', content: PRUBEH, gen: PGEN, deck: DECK4 },
  { id: 'integraly', short: 'Integrály', title: 'Neurčité integrály', tagline: 'Derivace pozpátku', content: INTEGRALY, gen: IGEN, deck: DECK5 },
].map(p => ({ ...p, course: 'ma1' }));
// Základy matematiky: samostatný „kurz“ s vlastními cestami a simulací testu (src/zm/)
for (const p of ZM) PATHS.push({ ...p, course: 'zm', deck: ZDECKS[p.id] || [] });
const COURSES = { ma1: { title: 'Matematická analýza 1', short: 'MA1', mix: 'mix' }, zm: { title: 'Základy matematiky', short: 'ZM', mix: 'zmix' } };
const course = () => (store.get().course === 'zm' ? 'zm' : 'ma1');
/** scope režimu Z hlavy: 'mix' = všechny cesty MA1, 'zmix' = všechny cesty Základů, jinak jedna cesta */
const MIX = { mix: 'ma1', zmix: 'zm' };
const inScope = (p, scope) => (MIX[scope] ? p.course === MIX[scope] : p.id === scope);

const app = document.getElementById('app');
let cleanup = null;

// ------------------------------------------------------------ pomocné
function lessonsOf(path) {
  const out = [];
  path.units.forEach(u => u.lessons.forEach(l => out.push({ ...l, unit: u })));
  return out;
}
function findLesson(id) {
  for (const p of PATHS) if (p.content) {
    const ls = lessonsOf(p.content);
    const i = ls.findIndex(l => l.id === id);
    if (i >= 0) return { path: p, lesson: ls[i], index: i, all: ls };
  }
}
const unlocked = (all, i) => store.get().unlockAll || i === 0 || store.isDone(all[i - 1].id);
const fmtTime = s => { s = Math.round(s); const mm = Math.floor(s / 60), ss = s % 60; return mm ? `${mm} min ${ss} s` : `${ss} s`; };
const go = hash => { location.hash = hash; };

// ------------------------------------------------------------ pohárky
// pohárek je uložený v záznamu lekce; starší záznamy bez něj se hodnotí po staru podle přesnosti napoprvé
const lessonTier = id => { const r = store.get().done[id]; return r ? (r.tier ?? tierFromAcc(r.acc)) : 0; };
function fluencyTier(pid) {
  if (store.get().done['fluency-' + pid]) return lessonTier('fluency-' + pid);
  const fs = store.get().fluency.filter(f => f.path === pid && f.total);
  if (!fs.length) return 0;
  return tierFromAcc(Math.max(...fs.map(f => f.correct / f.total)));
}
/** všechny pohárky jedné cesty: lekce + zkouška plynulosti */
function pathTrophies(p) {
  const items = lessonsOf(p.content).map(l => ({ id: l.id, title: l.title, unit: l.unit.title, tier: lessonTier(l.id), drill: l.drill, boss: l.boss }));
  items.push({ id: 'fluency-' + p.id, title: p.content.fluency.title, unit: 'Na konci cesty', tier: fluencyTier(p.id), fluency: true });
  return items;
}
function countTiers(items) {
  const c = { gold: 0, silver: 0, bronze: 0, total: items.length };
  for (const t of items) { if (t.tier === 3) c.gold++; else if (t.tier === 2) c.silver++; else if (t.tier === 1) c.bronze++; }
  c.earned = c.gold + c.silver + c.bronze;
  return c;
}
// pohárky se počítají vždy jen za aktuální předmět (MA1 / Základy)
const trophyCounts = () => countTiers(PATHS.filter(p => p.content && p.course === course()).flatMap(pathTrophies));

// ------------------------------------------------------------ světlý / tmavý režim
const systemDark = () => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const isDark = () => (store.get().theme || (systemDark() ? 'dark' : 'light')) === 'dark';
// barvy systémových lišt = barva pozadí (--bg) světlého / tmavého motivu
// (Základy matematiky mají chladnější pozadí, viz :root[data-course="zm"] ve style.css)
const BAR_COLORS = { ma1: { light: '#f6f5f1', dark: '#1b1b19' }, zm: { light: '#eef2f8', dark: '#171a20' } };
function applyTheme() {
  const t = store.get().theme, BAR_COLOR = BAR_COLORS[course()];
  if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
  document.documentElement.dataset.course = course();
  document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
    meta.content = t ? BAR_COLOR[t] : (meta.media || '').includes('dark') ? BAR_COLOR.dark : BAR_COLOR.light;
  });
}
function toggleTheme(btn) {
  store.set({ theme: isDark() ? 'light' : 'dark' });
  applyTheme();
  if (btn) { btn.innerHTML = isDark() ? ICONS.sun : ICONS.moon; btn.setAttribute('aria-label', isDark() ? 'Přepnout na světlý režim' : 'Přepnout na tmavý režim'); }
}
applyTheme();

function themeButton() {
  const b = h('button', { class: 'icon-btn theme-btn', 'aria-label': isDark() ? 'Přepnout na světlý režim' : 'Přepnout na tmavý režim', title: 'Světlý / tmavý režim', html: isDark() ? ICONS.sun : ICONS.moon });
  b.addEventListener('click', () => toggleTheme(b));
  return b;
}

function topbar(back, title, right) {
  const st = store.get();
  return h('header', { class: 'topbar' },
    back ? h('button', { class: 'icon-btn', 'aria-label': 'Zpět', onclick: () => go(back), html: ICONS.back }) : brandButton(),
    title ? h('div', { class: 'topbar-title' }, title) : h('div', { class: 'spacer' }),
    h('div', { class: 'stats' },
      h('span', { class: 'stat stat-streak' + (store.doneToday() ? ' lit' : ''), title: 'Série dní', html: ICONS.flame + `<b>${store.streakAlive()}</b>` }),
      h('button', { class: 'stat stat-trophy', title: 'Sbírka pohárků', 'aria-label': 'Sbírka pohárků', onclick: () => go('#/sbirka'), html: trophySvg(3, 22) + `<b>${trophyCounts().gold}</b>` }),
      syncIndicator(),
      themeButton(),
      right || h('button', { class: 'icon-btn', 'aria-label': 'Nastavení', onclick: () => go('#/nastaveni'), html: ICONS.gear })));
}

// ------------------------------------------------------------ synchronizace (UI)
const SYNC_LOOK = {
  ok: ['cloudOk', 'Pokrok je synchronizovaný'],
  syncing: ['cloudUp', 'Synchronizuji…'],
  pending: ['cloudUp', 'Změny čekají na odeslání'],
  offline: ['cloudOff', 'Offline, změny se pošlou později'],
  error: ['cloudOff', 'Synchronizace teď nejde, zkusím to později'],
};
function paintSync(b, st) {
  const look = SYNC_LOOK[st.state];
  b.hidden = !look;
  if (!look) return;
  b.innerHTML = ICONS[look[0]];
  b.title = look[1];
  b.setAttribute('aria-label', look[1]);
  b.dataset.state = st.state;
}
function syncIndicator() {
  const b = h('button', { class: 'icon-btn sync-ind', type: 'button', onclick: () => go('#/nastaveni') });
  paintSync(b, sync.status());
  return b;
}
function googleButton() {
  const b = h('button', { class: 'btn btn-primary btn-google', type: 'button', html: ICONS.google + '<span>Přihlásit přes Google</span>' });
  b.addEventListener('click', async () => {
    b.disabled = true;
    try { await sync.signIn(); } catch (e) {
      b.disabled = false;
      toast(e?.offline ? 'Přihlášení potřebuje internet.' : 'Přihlášení se teď nepovedlo. Zkus to za chvíli.');
    }
  });
  return b;
}
const ago = t => {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return 'právě teď';
  if (s < 3600) return `před ${Math.round(s / 60)} min`;
  if (s < 86400) return `před ${Math.round(s / 3600)} h`;
  return new Date(t).toLocaleDateString('cs-CZ');
};
function syncStatusText(st) {
  switch (st.state) {
    case 'ok': return 'Synchronizováno ' + ago(st.lastSync) + '.';
    case 'syncing': return 'Synchronizuji…';
    case 'pending': return 'Změny se odešlou za chvíli.';
    case 'offline': return 'Offline. Změny se odešlou, až budeš online.';
    case 'error': return 'Server teď neodpovídá. Zkusím to později, pokrok v zařízení je v bezpečí.';
    default: return '';
  }
}
/** nabídnout přihlášení? jen nepřihlášeným, online a až po první dokončené lekci */
const canOfferSync = () => sync.configured && !sync.isLoggedIn() && !sync.hasStoredLogin() && navigator.onLine
  && Object.keys(store.get().done).length > 0;
// po úplně první dokončené lekci se nabídka ukáže, jakmile zmizí obrazovka s pohárkem
let offerAfterEnd = false;
/** nabídka přihlášení: po první lekci a pak při každém spuštění, dokud se uživatel nepřihlásí */
function syncOffer() {
  if (document.querySelector('.modal-back')) return;
  const back = h('div', { class: 'modal-back' });
  const close = () => back.remove();
  back.append(h('div', { class: 'modal sync-offer', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'sync-offer-title' },
    h('div', { class: 'sync-offer-icon', html: ICONS.cloudOk }),
    h('h3', { id: 'sync-offer-title' }, 'Chceš mít pokrok synchronizovaný mezi zařízeními?'),
    h('p', {}, 'Přihlas se přes Google a pokrok se uloží i online. Najdeš ho pak v mobilu i na počítači.'),
    h('p', { class: 'muted small' }, 'Bez přihlášení funguje všechno dál, pokrok jen zůstane v tomhle prohlížeči. Ukládá se jen pokrok v lekcích.'),
    h('div', { class: 'modal-actions' },
      googleButton(),
      h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => { close(); toast('Přihlásit se jde kdykoli v Nastavení.'); } }, 'Teď ne'))));
  document.body.append(back);
}
function syncBlock() {
  if (!sync.configured) return null;
  const st = sync.status();
  const blk = h('div', { class: 'setting-block sync-block' }, h('b', {}, 'Synchronizace mezi zařízeními'));
  if (!sync.isLoggedIn()) {
    blk.append(
      h('p', { class: 'muted small' }, 'Po přihlášení přes Google se pokrok uloží i online a najdeš ho v mobilu i na počítači. Ukládá se jen pokrok v lekcích, nic dalšího.'),
      sync.hasStoredLogin() && !navigator.onLine ? h('p', { class: 'muted small' }, 'Přihlášení se ověří, až budeš online.') : h('div', { class: 'row' }, googleButton()));
  } else {
    blk.append(
      h('p', { class: 'small' }, 'Přihlášeno jako ', h('b', {}, st.email || 'účet Google')),
      h('p', { class: 'muted small' }, syncStatusText(st)),
      h('div', { class: 'row' },
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => sync.syncNow() }, 'Synchronizovat teď'),
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: async () => { await sync.signOut(); toast('Odhlášeno. Pokrok v tomhle zařízení zůstal.'); } }, 'Odhlásit')),
      h('button', { class: 'btn btn-ghost danger btn-small', type: 'button', onclick: () => modal('Smazat online účet?', 'Smaže se tvůj účet a pokrok uložený na serveru. Pokrok v tomhle zařízení zůstane.', [
        { label: 'Nechat být', primary: true },
        { label: 'Smazat', fn: async () => { try { await sync.deleteAccount(); toast('Online účet je smazaný.'); } catch { toast('Smazání se teď nepovedlo. Zkus to znovu, až budeš online.'); } } },
      ]) }, 'Smazat online účet a data'));
  }
  return blk;
}
sync.onStatus(st => {
  document.querySelectorAll('.sync-ind').forEach(b => paintSync(b, st));
  const old = document.querySelector('.sync-block');
  if (old) { const fresh = syncBlock(); if (fresh) old.replaceWith(fresh); }
});
const inLesson = () => /^#\/(lekce|procvic|plynulost|zhlavy\/|test\/|pisemka\/)/.test(location.hash);
// přišel pokrok z jiného zařízení → překreslit (ale nikdy uprostřed lekce)
sync.onData(() => { if (!inLesson() && !document.querySelector('.modal-back')) route(); });

function modal(title, body, actions) {
  if (document.querySelector('.modal-back')) return;   // už jeden otevřený je (opakovaný Esc)
  const back = h('div', { class: 'modal-back' });
  const close = () => back.remove();
  haptic('pop', { delay: 30 });
  back.append(h('div', { class: 'modal', role: 'dialog' }, h('h3', {}, title), h('p', { html: body }),
    h('div', { class: 'modal-actions' }, actions.map(a => h('button', { class: 'btn ' + (a.primary ? 'btn-primary' : 'btn-ghost'), onclick: () => { close(); a.fn && a.fn(); } }, a.label)))));
  document.body.append(back);
}

/** tahák: přehled vzorců a pravidel cesty, dá se otevřít kdykoli během lekce */
/** state = { open: [indexy rozbalených sekcí], scroll } – když je zadaný, tahák se otevře tam, kde byl naposledy */
function openSheet(title, sections, state) {
  if (document.querySelector('.modal-back')) return;
  const back = h('div', { class: 'modal-back sheet-back' });
  const close = () => back.remove();
  const isOpen = i => (state?.open ? state.open.includes(i) : i === 0);
  const secs = sections.map((s, i) =>
    h('details', { class: 'sheet-sec', open: isOpen(i) || null }, h('summary', {}, s.title), h('div', { class: 'info-body', html: m(s.html) })));
  const body = h('div', { class: 'sheet-body' }, secs);
  if (state) {
    // ukládá se průběžně, takže stav drží i zavření Escapem nebo kliknutím vedle
    secs.forEach(d => d.addEventListener('toggle', () => { state.open = secs.map((x, i) => (x.open ? i : -1)).filter(i => i >= 0); }));
    body.addEventListener('scroll', () => { state.scroll = Math.round(body.scrollTop); }, { passive: true });
    requestAnimationFrame(() => { body.scrollTop = state.scroll || 0; });
  }
  back.append(h('div', { class: 'sheet', role: 'dialog', 'aria-label': title },
    h('div', { class: 'sheet-head' }, h('h3', {}, title), h('button', { class: 'icon-btn', 'aria-label': 'Zavřít tahák', onclick: close, html: ICONS.close })), body));
  back.addEventListener('click', e => { if (e.target === back) close(); });
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  haptic('pop', { delay: 40 });
  document.body.append(back);
}

function toast(msg) {
  const t = h('div', { class: 'toast', html: m(msg) });
  document.body.append(t);
  setTimeout(() => t.classList.add('out'), 2200);
  setTimeout(() => t.remove(), 2700);
}

// ------------------------------------------------------------ domů
function homeScreen() {
  const st = store.get();
  const main = h('main', { class: 'page' });
  const cur = course();
  if (cur === 'zm') main.append(courseNote());
  if (!st.seenWelcome && cur === 'ma1') {
    main.append(h('section', { class: 'welcome' },
      h('h1', {}, 'Přežij MA1'),
      h('p', {}, 'Definiční obory, limity, derivace, průběh funkce a integrály, od úplných základů až po příklady jako na testu.'),
      h('p', {}, 'Tohle není sbírka úloh, kterou se naučíš nazpaměť. Každý příklad se generuje náhodně, takže pořád dostáváš nová čísla.'),
      h('ul', { class: 'promise' },
        h('li', {}, 'Napíšeš výsledek a appka ho hned zkontroluje.'),
        h('li', {}, 'Tlačítko „Nevím“ ukáže celý postup krok za krokem.'),
        h('li', {}, 'Co pokazíš, dostaneš na konci znovu, s jinými čísly.'),
        h('li', {}, 'Funguje to i offline a pokrok máš v mobilu i na počítači.')),
      h('button', { class: 'btn btn-primary', onclick: () => { store.set({ seenWelcome: true }); route(); } }, 'Začít')));
  }
  main.append(cur === 'zm' ? testCard() : pisemkaCard());
  main.append(h('h2', { class: 'section-title' }, 'Tvoje cesty'));
  const grid = h('div', { class: 'path-grid' });
  PATHS.filter(p => p.course === cur).forEach((p, i) => {
    if (p.content) {
      const ls = lessonsOf(p.content);
      const done = ls.filter(l => store.isDone(l.id)).length;
      const pct = Math.round(100 * done / ls.length);
      grid.append(h('button', { class: 'path-card', onclick: () => go('#/cesta/' + p.id) },
        h('span', { class: 'path-num' }, String(i + 1)),
        h('span', { class: 'path-text' }, h('b', {}, p.title), h('span', { class: 'muted' }, p.tagline, p.exam ? h('span', { class: 'exam-tag' }, p.exam) : null)),
        h('span', { class: 'ring', style: `--p:${pct}` }, h('span', {}, pct + ' %'))));
    } else {
      grid.append(h('div', { class: 'path-card soon' },
        h('span', { class: 'path-num' }, String(i + 1)),
        h('span', { class: 'path-text' }, h('b', {}, p.title), h('span', { class: 'muted' }, p.tagline)),
        h('span', { class: 'soon-tag' }, 'připravujeme')));
    }
  });
  main.append(grid);
  const mixScope = COURSES[cur].mix;
  const pi = pocketInfo(mixScope);
  main.append(h('button', { class: 'coll-card pocket-card', onclick: () => openPocket(mixScope) },
    h('span', { class: 'pocket-icon', html: ICONS.swipe }),
    h('span', { class: 'path-text' }, h('b', {}, 'Z hlavy'), h('span', { class: 'muted' }, pi.skills.length ? pocketSub(pi).replace(/^./, c => c.toUpperCase()) : 'Bez papíru, jen ťukáním. Odemkne se po první lekci.')),
    pi.memory != null ? h('span', { class: 'mem-pill', title: 'Jak dobře teď látka drží v paměti' }, h('small', {}, 'Paměť'), h('b', {}, pi.memory + ' %')) : null));
  const tc = trophyCounts();
  main.append(h('button', { class: 'coll-card', onclick: () => go('#/sbirka') },
    h('span', { class: 'coll-card-icon', html: trophySvg(3, 56) }),
    h('span', { class: 'path-text' }, h('b', {}, 'Sbírka pohárků'), h('span', { class: 'muted' }, `${tc.gold} z ${tc.total} zlatých · celkem ${tc.earned} pohárků`)),
    h('span', { class: 'coll-card-mini', html: `${trophySvg(3, 20)}${tc.gold} ${trophySvg(2, 20)}${tc.silver} ${trophySvg(1, 20)}${tc.bronze}` })));
  main.append(h('div', { class: 'install-slot home-install' }, installButton()));
  if (sync.isLoggedIn()) main.append(h('p', { class: 'footnote muted small' }, 'Pokrok se synchronizuje přes tvůj účet Google.'));
  app.replaceChildren(topbar(null, null), main);
}

// ------------------------------------------------------------ předmět: logo v liště = přepínač
// Klik na logo otevře nabídku předmětů. Vybraný předmět se pamatuje, mění logo, barvu a tapetu.
const COURSE_ICON = { ma1: 'icons/icon.svg', zm: 'icons/icon-zm.svg' };
const CARET = '<svg class="brand-caret" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function brandButton() {
  const cur = course();
  const b = h('button', { class: 'brand brand-btn', type: 'button', 'aria-haspopup': 'menu', 'aria-expanded': 'false', 'aria-label': `Přežij ${COURSES[cur].short}, změnit předmět`, title: 'Změnit předmět' },
    h('span', { class: 'brand-name' }, 'Přežij'), h('img', { class: 'brand-logo', src: COURSE_ICON[cur], alt: COURSES[cur].short, width: 40, height: 40 }));
  b.insertAdjacentHTML('beforeend', CARET);
  b.addEventListener('click', e => { e.stopPropagation(); toggleCourseMenu(b); });
  return b;
}
function coursePct(id) {
  const ls = PATHS.filter(p => p.course === id).flatMap(p => lessonsOf(p.content));
  return Math.round(100 * ls.filter(l => store.isDone(l.id)).length / Math.max(1, ls.length));
}
function toggleCourseMenu(btn) {
  const open = document.querySelector('.course-menu');
  if (open) return open._close();
  const cur = course();
  const item = id => h('button', { class: 'cm-item', type: 'button', role: 'menuitemradio', 'aria-checked': String(id === cur), onclick: () => pickCourse(id) },
    h('img', { src: COURSE_ICON[id], alt: '', width: 40, height: 40 }),
    h('span', {}, h('b', {}, COURSES[id].title), h('small', {}, `${id === 'zm' ? '5 cest a simulace testu' : '5 cest'} · ${coursePct(id)} % hotovo`)),
    h('span', { class: 'cm-check', html: ICONS.check }));
  const menu = h('div', { class: 'course-menu', role: 'menu', 'aria-label': 'Předmět' }, h('small', { class: 'cm-head' }, 'PŘEDMĚT'), item('ma1'), item('zm'));
  const onDoc = e => { if (!menu.contains(e.target) && !btn.contains(e.target)) close(); };
  const onKey = e => { if (e.key === 'Escape') { close(); btn.focus(); } };
  function close() { menu.remove(); btn.setAttribute('aria-expanded', 'false'); document.removeEventListener('click', onDoc, true); document.removeEventListener('keydown', onKey, true); }
  menu._close = close;
  btn.setAttribute('aria-expanded', 'true');
  btn.closest('.topbar').append(menu);
  haptic('pop');
  setTimeout(() => { document.addEventListener('click', onDoc, true); document.addEventListener('keydown', onKey, true); }, 0);
  (menu.querySelector('[aria-checked="true"]') || menu.querySelector('.cm-item')).focus({ preventScroll: true });
}
function pickCourse(id) {
  document.querySelector('.course-menu')?._close();
  if (id === course()) return;
  store.set({ course: id });
  haptic('select');
  applyTheme();
  setWallpaper(id);
  if (location.hash && location.hash !== '#/') go('#/'); else route();
}
/** obrazovka patří jinému předmětu (třeba odkaz z výsledků testu) → přepnout motiv, logo i pohárky na něj */
function ensureCourse(id) {
  if (!id || id === course()) return;
  store.set({ course: id });
  applyTheme();
  setWallpaper(id);
}
const courseNote = () => h('p', { class: 'muted small course-note' }, 'Test: 6 příkladů, 30 bodů. Každá cesta odpovídá jednomu typu příkladu (štítek „Př.“), simulace testu ukáže, jak na tom teď jsi.');
const testRuns = v => store.get().fluency.filter(f => f.path === 'zm-test-' + v);
const bestRun = runs => runs.slice().sort((a, b) => b.correct - a.correct || a.time - b.time)[0];
function testCard() {
  const all = ['A', 'B', 'N'].flatMap(testRuns);
  const best = bestRun(all);
  return h('button', { class: 'coll-card test-card', onclick: () => go('#/test') },
    h('span', { class: 'test-card-icon', html: ICONS.trophy }),
    h('span', { class: 'path-text' }, h('b', {}, 'Simulace testu'), h('span', { class: 'muted' }, best ? `Nejlépe ${fmtPts(best.correct)} z ${TOTAL} bodů · ${all.length}× napsáno` : 'Varianty A a B z minulých let + nové varianty')),
    h('span', { class: 'go' }, 'Spustit'));
}
const fmtPts = p => String(p).replace('.', ',');

// ------------------------------------------------------------ cesta
const statCache = new Map();
/** odhad délky lekce: počet úloh a minut */
function lessonStats(l) {
  if (statCache.has(l.id)) return statCache.get(l.id);
  let ex = 0, min = 0;
  for (const f of l.cards) {
    let c; try { c = f(); } catch { continue; }
    if (c.type === 'info') min += 0.6;
    else if (c.type === 'video') min += 4;
    else { ex++; min += c.type === 'guided' ? 1.5 : c.type === 'choice' || c.type === 'multi' || c.type === 'sort' ? 0.4 : 0.9; }
  }
  const r = { ex, min: Math.max(2, Math.round(min)) };
  statCache.set(l.id, r);
  return r;
}

function pathScreen(id) {
  const p = PATHS.find(x => x.id === id);
  if (!p || !p.content) return go('#/');
  ensureCourse(p.course);
  const all = lessonsOf(p.content);
  const done = all.filter(l => store.isDone(l.id)).length;
  const main = h('main', { class: 'page path-page' });
  main.append(h('div', { class: 'path-hero' },
    h('h1', {}, p.title),
    h('div', { class: 'bar' }, h('div', { class: 'bar-fill', style: `width:${100 * done / all.length}%` })),
    h('p', { class: 'muted small' }, `${done} z ${all.length} lekcí hotovo`),
    (() => { const c = countTiers(pathTrophies(p)); return h('button', { class: 'hero-trophies', onclick: () => go('#/sbirka/' + p.id) },
      h('span', { html: trophySvg(3, 26) + `<b>${c.gold}</b>` }), h('span', { html: trophySvg(2, 26) + `<b>${c.silver}</b>` }), h('span', { html: trophySvg(1, 26) + `<b>${c.bronze}</b>` }),
      h('span', { class: 'muted small' }, `z ${c.total} pohárků`)); })(),
    (() => { const pi = pocketInfo(p.id); return h('div', { class: 'hero-actions' },
      h('button', { class: 'btn btn-ghost btn-small', onclick: () => go('#/procvic/' + p.id), html: ICONS.dumbbell + '<span>Procvičit slabá místa</span>' }),
      h('button', { class: 'btn btn-ghost btn-small', onclick: () => openPocket(p.id), html: ICONS.swipe + `<span>Z hlavy${pi.skills.length ? ' · ' + (pi.fresh || pi.due ? pocketSub(pi) : 'osvěženo') : ''}</span>` }),
      h('span', { class: 'muted small hero-mem' }, `${pi.memory != null ? `Paměť ${pi.memory} % · ` : 'Z hlavy: '}odemčeno ${pi.skills.length} z ${pi.total} karet`)); })()));

  let current = null;
  const firstOpen = all.findIndex((l, i) => !store.isDone(l.id) && unlocked(all, i));
  const units = p.content.units;
  units.forEach((u, ui) => {
    const ids = u.lessons.map(l => l.id);
    const uDone = ids.filter(x => store.isDone(x)).length;
    const hasCurrent = firstOpen >= 0 && ids.includes(all[firstOpen].id);
    const finished = uDone === ids.length;
    const tl = h('div', { class: 'tl' });
    u.lessons.forEach(l => {
      const i = all.findIndex(x => x.id === l.id);
      const isDone = store.isDone(l.id), open = unlocked(all, i), isCur = i === firstOpen;
      const st = isDone ? 'ok' : isCur ? 'now' : open ? 'open' : 'lk';
      const tier = lessonTier(l.id);
      const icon = isDone ? trophySvg(tier, 46) : isCur ? ICONS.play2 : !open ? ICONS.lock : l.boss ? ICONS.trophy : l.drill ? ICONS.bolt : ICONS.star;
      const est = lessonStats(l);
      const rec = store.get().done[l.id];
      const meta = isDone
        ? `${TIER_LABEL[tier]} · ${rec?.mist != null ? (rec.mist ? `nejlépe ${chyb(rec.mist)}` : 'bez chyby') : `${Math.round((rec?.acc ?? 1) * 100)} % napoprvé`}${l.drill && rec?.lastAvg ? ` · ${fmtTime(rec.lastAvg)}/příklad` : ''}`
        : `≈ ${est.min} min · ${est.ex} ${est.ex === 1 ? 'úloha' : est.ex < 5 ? 'úlohy' : 'úloh'}`;
      const tag = l.drill ? h('span', { class: 'tag tag-drill' }, 'DRIL') : l.boss ? h('span', { class: 'tag tag-boss' }, 'SÉRIE') : null;
      // co lekce přinese do režimu Z hlavy (jen u lekcí, které ještě nejsou hotové)
      const plus = isDone || store.get().unlockAll ? 0 : unlockedBy(p, l.id).length;
      const item = h('button', {
        class: `item item-${st}${l.boss ? ' item-boss' : ''}${isDone ? ' tier-' + tier : ''}`, type: 'button',
        onclick: () => (open ? go('#/lekce/' + l.id) : (haptic('nope'), toast('Tahle lekce se odemkne po té předchozí.'))),
      },
        h('span', { class: 'tile', html: icon }),
        h('span', { class: 'meta' }, h('b', {}, l.title), h('span', {}, meta),
          plus ? h('span', { class: 'pk-plus', title: 'Po dokončení se odemknou karty pro režim Z hlavy', html: ICONS.swipe + `<span>+${plus} ${cardWord(plus)} z hlavy</span>` }) : null),
        isCur ? h('span', { class: 'go' }, isDone ? 'Znovu' : 'Začít') : tag);
      if (isCur) current = item;
      tl.append(item);
    });
    const chap = h('details', { class: 'chap' + (finished ? ' chap-done' : ''), open: (!finished || hasCurrent) || null },
      h('summary', {},
        h('small', {}, `SEKCE ${ui + 1} Z ${units.length}`),
        h('span', { class: 'chap-title' }, h('h3', {}, u.title), finished ? h('span', { class: 'chap-check', html: ICONS.check }) : null),
        h('span', { class: 'chap-desc' }, u.desc),
        h('span', { class: 'chap-prog' }, h('i', { style: `--w:${100 * uDone / ids.length}%` }), `${uDone}/${ids.length}`)),
      tl);
    main.append(chap);
  });
  // zkouška plynulosti
  const allDone = done === all.length || store.get().unlockAll;
  const fl = p.content.fluency;
  const best = store.get().fluency.filter(f => f.path === p.id).sort((a, b) => b.correct - a.correct || a.time - b.time)[0];
  main.append(h('div', { class: 'final ' + (allDone ? '' : 'final-locked') },
    h('div', { class: 'final-icon', html: ICONS.trophy }),
    h('h2', {}, fl.title),
    h('p', { class: 'muted' }, fl.desc),
    best ? h('p', { class: 'small' }, `Tvůj nejlepší: ${best.correct}/${best.total} za ${fmtTime(best.time)}`) : null,
    h('button', { class: 'btn ' + (allDone ? 'btn-primary' : 'btn-ghost'), onclick: () => allDone ? go('#/plynulost/' + p.id) : toast('Odemkne se, až projdeš celou cestu.') }, allDone ? 'Spustit' : 'Zatím zamčeno')));
  app.replaceChildren(topbar('#/', p.title), main);
  if (current && firstOpen > 0) setTimeout(() => current.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60);
}

// ------------------------------------------------------------ lekce
// Rozpracovaná lekce se průběžně ukládá, aby ji omylem obnovená stránka nebo zavřená aplikace nevrátila na začátek.
// Ukládá se pořadí úloh (jako indexy do stálého seznamu generátorů), skóre a „semínko“ náhody každé úlohy,
// takže po obnovení nebo návratu do lekce vyjde přesně stejný příklad (se stejnými čísly).
const LESSON_KEY = 'ma1-lesson-v1';
const newSeed = () => (Math.random() * 4294967296) >>> 0;
/** fn() poběží s Math.random řízeným semínkem (mulberry32) → pokaždé stejný výsledek */
function seeded(seed, fn) {
  const orig = Math.random;
  let a = seed >>> 0;
  Math.random = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  try { return fn(); } finally { Math.random = orig; }
}
const LESSON_TTL = 12 * 3600 * 1000;
function loadLessonSave(key, pool) {
  if (!key || !pool) return null;
  try {
    const s = JSON.parse(localStorage.getItem(LESSON_KEY));
    if (!s || s.key !== key || s.n !== pool.length || Date.now() - s.at > LESSON_TTL || !Array.isArray(s.queue)) return null;
    const queue = s.queue.map(([i, tries, hinted, seed]) => ({ f: pool[i], tries, hinted: !!hinted, seed: Number.isInteger(seed) ? seed : newSeed() }));
    if (!queue.length || queue.some(q => typeof q.f !== 'function') || !(s.pos >= 0 && s.pos <= queue.length)) return null;
    return { ...s, queue };
  } catch { return null; }
}
const clearLessonSave = () => { try { localStorage.removeItem(LESSON_KEY); } catch { /* nevadí */ } };

/** haptika k odpovědi: správně / špatně / Nevím, na milnících série navíc rostoucí vlna */
function answerFx(ok, dontKnow, row) {
  if (!ok) return haptic(dontKnow ? 'soft' : 'error');
  haptic('success');
  const s = streakFx(row);
  if (s) haptic(s, { delay: 200 });
}

/** resumeKey + pool: když jsou zadané, lekce se dá po obnovení stránky dokončit */
function runLesson({ factories, title, back, mode = 'lesson', onFinish, pathId, cheat, resumeKey, pool }) {
  // slabá místa se ukládají zvlášť pro každou cestu (klíče jako t1 nebo tableTyped jsou ve více cestách)
  const weakKey = k => (k && pathId ? `${pathId}/${k}` : k);
  const resumed = loadLessonSave(resumeKey, pool);
  if (!resumed) clearLessonSave();
  const queue = resumed ? resumed.queue : factories.map(f => ({ f, tries: 0, seed: newSeed() }));
  let idx = resumed?.pos ?? 0, firstOk = resumed?.firstOk ?? 0, exercises = resumed?.exercises ?? 0;
  // chyby: špatně, „Nevím“ nebo správně jen s nápovědou; počítají se i v opakováních
  let mistakes = resumed?.mistakes ?? (resumed?.attemptLog ?? []).filter(a => !a.ok).length;
  let t0 = performance.now() - (resumed?.elapsed ?? 0) * 1000, cardT0 = 0;
  let cur = null, phase = 'answer', cardData = null, attemptLog = resumed?.attemptLog ?? [], row = resumed?.row ?? 0, bestRow = resumed?.bestRow ?? 0;
  const drill = mode === 'drill';
  // tahák si v rámci lekce pamatuje rozbalené sekce a místo, kde byl odscrollovaný (i přes obnovení stránky)
  const sheetState = resumed?.sheet && Array.isArray(resumed.sheet.open) ? resumed.sheet : { open: [0], scroll: 0 };
  function saveProgress(pos) {
    if (!resumeKey || !pool) return;
    try {
      localStorage.setItem(LESSON_KEY, JSON.stringify({
        key: resumeKey, n: pool.length, at: Date.now(), pos,
        queue: queue.map(q => [pool.indexOf(q.f), q.tries, q.hinted ? 1 : 0, q.seed]),
        firstOk, exercises, mistakes, row, bestRow, attemptLog: attemptLog.slice(-300), elapsed: (performance.now() - t0) / 1000,
        sheet: sheetState,
      }));
    } catch { /* plné úložiště / soukromé okno: lekce jede dál, jen bez zálohy */ }
  }

  const bar = h('div', { class: 'bar-fill' });
  const closeBtn = h('button', { class: 'icon-btn', 'aria-label': 'Ukončit lekci', html: ICONS.close, onclick: () => askClose() });
  const rowPill = h('span', { class: 'row-pill' });
  const repPill = h('span', { class: 'row-pill rep-pill', title: 'Příklady po chybě, které tě ještě čekají' });
  const stage = h('div', { class: 'stage' });
  const foot = h('footer', { class: 'lesson-foot' });
  // tahák je k dispozici v lekcích, drilech i procvičování; ve zkoušce plynulosti ne (tam se měří, co už umíš)
  const cheatBtn = cheat && mode !== 'fluency'
    ? h('button', { class: 'cheat-btn', type: 'button', title: 'Tahák: vzorce a pravidla', 'aria-label': 'Otevřít tahák', onclick: () => openSheet('Tahák', cheat, sheetState), html: ICONS.book + '<span>Tahák</span>' }) : null;
  const screen = h('div', { class: 'lesson' }, h('div', { class: 'lesson-top' }, closeBtn, h('div', { class: 'bar lesson-bar' }, bar), repPill, drill ? rowPill : null, cheatBtn), stage, foot);
  // kolik opakování ještě čeká (from = idx při zadání včetně aktuálního, idx + 1 po odpovědi)
  const setRep = (from = idx) => {
    const n = queue.slice(from).filter(q => q.tries > 0).length;
    repPill.hidden = !n;
    repPill.innerHTML = ICONS.repeat + `<b>${n}</b><span>k opakování</span>`;
  };
  const setRow = () => { rowPill.innerHTML = ICONS.bolt + `<b>${row}</b><span>v řadě</span>`; rowPill.classList.toggle('hot', row >= 3); };
  if (drill) setRow();
  app.replaceChildren(screen);

  function askClose() {
    // rozpracovaná lekce se při odchodu nemaže: když se vrátíš, čeká tam stejný příklad
    if (idx === 0 && phase === 'answer') return go(back);
    modal('Chceš si dát pauzu?', 'V pohodě. Když se do 12 hodin vrátíš, pokračuje se tam, kde jsi teď, i se stejným příkladem.', [
      { label: 'Pokračovat v lekci', primary: true },
      { label: 'Odejít', fn: () => go(back) },
    ]);
  }

  function show() {
    if (idx >= queue.length) return finish();
    saveProgress(idx);   // před započtením úlohy → po obnovení se tahle úloha započte jen jednou
    bar.style.width = `${100 * idx / queue.length}%`;
    setRep();
    const item = queue[idx];
    item.seed ??= newSeed();
    cardData = seeded(item.seed, () => item.f());
    (window.__ma1 ||= {}).card = cardData;
    cur = seeded(item.seed ^ 0x9E3779B9, () => renderCard(cardData));   // i pořadí možností zůstane stejné
    phase = 'answer';
    cardT0 = performance.now();
    stage.replaceChildren(cur.el);
    if (item.tries > 0) cur.el.prepend(h('div', { class: 'repeat-tag', html: ICONS.repeat + '<span>Opakování po chybě</span>' }));
    stage.scrollTop = 0;
    cur.el.classList.add('enter');
    haptic('enter', { delay: 230 });   // karta dojede na místo (slidein .28 s)
    foot.className = 'lesson-foot';
    if (cur.passive) {
      foot.replaceChildren(h('div', { class: 'foot-row' }, h('span'), h('button', { class: 'btn btn-primary', onclick: next }, 'Pokračovat')));
    } else {
      exercises += item.tries === 0 ? 1 : 0;
      const left = h('div', { class: 'foot-left' },
        h('button', { class: 'btn btn-ghost', onclick: dontKnow }, 'Nevím'),
        cardData.hint ? h('button', { class: 'btn btn-ghost', onclick: e => { showHint(); e.currentTarget.remove(); }, html: ICONS.bulb + '<span>Nápověda</span>' }) : null);
      foot.replaceChildren(h('div', { class: 'foot-row' }, left, h('button', { class: 'btn btn-primary', onclick: check }, 'Zkontrolovat')));
      cur.focus && setTimeout(cur.focus, 30);
    }
  }
  function showHint() {
    item().hinted = true;
    haptic('pop');
    cur.el.append(h('div', { class: 'hint', html: ICONS.bulb + `<span>${m(cardData.hint)}</span>` }));
  }
  const item = () => queue[idx];

  // chyba se vrací na konec (s jinými čísly), dokud ji nevyřešíš; pojistka MAX_REPEAT, ať se lekce nezacyklí
  const MAX_REPEAT = 4;
  const willRepeat = () => mode !== 'fluency' && item().tries < MAX_REPEAT;
  function requeue() {
    const it = item();
    if (willRepeat()) queue.push({ f: it.f, tries: it.tries + 1, seed: newSeed() });   // podobný příklad, jiná čísla
  }

  function check() {
    if (phase !== 'answer') return;
    const r = cur.check();
    if (r.invalid) { haptic('nope'); return toast(r.invalid); }
    if (r.stepDone) { haptic(r.ok ? 'step' : 'stepSoft'); return; }   // řešení po krocích: jen se otevřel další krok
    const dt = (performance.now() - cardT0) / 1000;
    const it = item();
    store.record(weakKey(cardData.key), r.ok, dt);
    attemptLog.push({ ok: r.ok, t: dt });
    if (r.ok && it.tries === 0 && !it.hinted) firstOk++;
    if (!r.ok || it.hinted) mistakes++;
    if (!r.ok) requeue();
    if (drill) { row = r.ok ? row + 1 : 0; bestRow = Math.max(bestRow, row); setRow(); }
    feedback(r.ok, r);
  }
  function dontKnow() {
    if (phase !== 'answer') return;
    const r = cur.reveal();
    if (r.stepDone) { haptic('stepSoft'); return; }
    if (drill) { row = 0; setRow(); }
    store.record(weakKey(cardData.key), false, (performance.now() - cardT0) / 1000);
    attemptLog.push({ ok: false, t: 0 });
    mistakes++;
    requeue();
    feedback(false, { ...r, dontKnow: true });
  }

  function feedback(ok, r) {
    phase = 'feedback';
    answerFx(ok, r.dontKnow, drill ? row : 0);
    saveProgress(idx + 1);   // odpověď už je započtená → po obnovení se pokračuje další úlohou
    setRep(idx + 1);
    const parts = [];
    const title = r.dontKnow ? 'V pohodě, tady je postup:' : ok ? pick(PRAISE) : pick(SOFT);
    if (r.msg) parts.push(h('div', { class: 'fb-msg', html: m(r.msg) }));
    const steps = r.steps || null;
    if (steps && steps.length) parts.push(stepsBox(steps, true));
    else if (r.stepsOptional && r.stepsOptional.length) parts.push(stepsBox(r.stepsOptional, false));
    if (!ok && willRepeat()) parts.push(h('p', { class: 'fb-note' }, 'Podobný příklad dostaneš znovu na konci lekce.'));
    // podrobnosti pod příkladem (dají se v klidu číst a scrollovat), dole jen krátké shrnutí + tlačítko
    if (parts.length) {
      const detail = h('div', { class: 'fb-detail ' + (ok ? 'fb-ok' : 'fb-soft') }, parts);
      stage.append(detail);
      if (!ok) setTimeout(() => detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
    }
    foot.className = 'lesson-foot fb ' + (ok ? 'fb-ok' : 'fb-soft');
    foot.replaceChildren(h('div', { class: 'foot-row' },
      h('div', { class: 'fb-title', html: (ok ? ICONS.check : ICONS.bulb) + `<span>${title}</span>` }),
      h('button', { class: 'btn btn-primary', onclick: next }, 'Pokračovat')));
  }

  function stepsBox(steps, open) {
    const list = h('ol', { class: 'steps-list' }, steps.map(s => h('li', { html: m(s) })));
    const det = h('details', { class: 'steps', open: open || null }, h('summary', {}, open ? 'Postup krok za krokem' : 'Ukázat postup'), list);
    return det;
  }

  function next() { if (phase === 'done' || (phase !== 'feedback' && !cur.passive)) return; idx++; show(); }

  function finish() {
    phase = 'done';
    document.removeEventListener('keydown', onKey);
    clearLessonSave();
    const time = (performance.now() - t0) / 1000;
    const acc = exercises ? firstOk / exercises : 1;
    const solved = attemptLog.filter(a => a.ok);
    const avg = solved.length ? solved.reduce((s, a) => s + a.t, 0) / solved.length : null;
    onFinish({ time, acc, firstOk, exercises, mistakes, attemptLog, avg, bestRow });
  }

  function onKey(e) {
    const sheet = document.querySelector('.sheet-back');
    if (sheet) { if (e.key === 'Escape') sheet.remove(); return; }   // otevřený tahák: klávesy nepatří lekci
    if (e.key === 'Enter' && !e.isComposing) {
      if (document.querySelector('.modal-back')) return;
      e.preventDefault();
      if (phase === 'feedback' || cur.passive) next(); else check();
      return;
    }
    if (phase === 'answer' && cur.key && /^[1-9]$/.test(e.key) && !(cur.typing)) cur.key(e.key);
    if (e.key === 'Escape') askClose();
  }
  document.addEventListener('keydown', onKey);
  cleanup = () => { document.removeEventListener('keydown', onKey); };
  show();
  if (resumed && resumed.pos > 0 && idx < queue.length) toast('Pokračuješ tam, kde lekce skončila.');
}

function lessonScreen(id) {
  const f = findLesson(id);
  if (!f) return go('#/');
  const { path, lesson, index, all } = f;
  ensureCourse(path.course);
  if (!unlocked(all, index)) return go('#/cesta/' + path.id);
  const back = '#/cesta/' + path.id;
  preloadGold();
  runLesson({
    factories: lesson.cards, title: lesson.title, back, mode: lesson.drill ? 'drill' : 'lesson', pathId: path.id, cheat: path.content.cheat,
    resumeKey: 'lekce/' + id, pool: lesson.cards,
    onFinish: ({ time, acc, firstOk, exercises, mistakes, avg, bestRow }) => {
      const prev = store.get().done[id];
      if (!Object.keys(store.get().done).length) offerAfterEnd = true;
      const tierBefore = lessonTier(id);
      const got = tierFromMistakes(mistakes, exercises);
      const res = store.finishLesson(id, { acc, time, avg, tier: got, mist: mistakes });
      const trophy = { before: tierBefore, now: lessonTier(id), got, n: exercises };
      let extra = null;
      if (lesson.drill && avg) {
        const was = prev?.lastAvg;
        extra = h('div', { class: 'drill-box' },
          h('div', { class: 'metric-row' },
            h('div', { class: 'metric' }, h('span', { class: 'muted small' }, 'Na příklad'), h('b', {}, fmtTime(avg))),
            h('div', { class: 'metric' }, h('span', { class: 'muted small' }, 'Nejdelší série'), h('b', {}, String(bestRow)))),
          was ? h('p', { class: 'tempo ' + (avg < was ? 'faster' : '') }, avg < was
            ? `Minule ${fmtTime(was)} na příklad, dnes ${fmtTime(avg)}. Zrychluješ!`
            : `Minule ${fmtTime(was)} na příklad. Rychlost přijde sama, hlavně ať to sedí.`)
            : h('p', { class: 'tempo muted' }, 'Až dril zopakuješ, uvidíš tady, jak zrychluješ.'));
      }
      // lekce dokončená poprvé odemkne karty Z hlavy, které z ní vycházejí (při „Odemknout všechny lekce“ už odemčené jsou)
      const gained = !prev && !store.get().unlockAll ? unlockedBy(path, id) : [];
      if (gained.length) {
        const drillBox = extra;
        extra = h('div', { class: 'pk-unlock' },
          h('div', { class: 'pk-unlock-head' }, h('span', { class: 'pocket-icon', html: ICONS.swipe }),
            h('span', {}, h('small', {}, 'Z HLAVY · ODEMČENO'), h('b', {}, '+' + newCards(gained.length)))),
          h('ul', {}, gained.map(s => h('li', {}, s.title))),
          h('p', { class: 'muted small' }, `Tuhle látku si teď můžeš opakovat i bez papíru. ${gained.length === 1 ? 'Karta se sama zařadí' : 'Karty se samy zařadí'} do dalšího kola.`),
          h('button', { class: 'btn btn-ghost btn-small', type: 'button', onclick: () => go(`#/zhlavy/${path.id}/${id}`), html: ICONS.swipe + '<span>Vyzkoušet hned</span>' }));
        if (drillBox) extra = h('div', {}, drillBox, extra);
      }
      endScreen({ title: lesson.drill ? 'Dril hotový!' : 'Lekce hotová!', sub: lesson.title, acc, time, exercises, mistakes, res, back, again: '#/lekce/' + id, nextId: all[index + 1]?.id, extra, trophy });
    },
  });
}

function endScreen({ title, sub, acc, time, exercises, mistakes = 0, res, back, again, nextId, extra, trophy, backLabel = 'Zpět na cestu', againLabel = 'Zopakovat', againFirst = false, note }) {
  const pct = Math.round(acc * 100);
  const msg = note ? note : !exercises ? 'Teorie je v hlavě. Příště už počítáme.'
    : !mistakes ? 'Bez jediné chyby. Tohle už máš v ruce.'
    : pct >= 90 ? 'Šlape ti to! Tohle už máš v ruce.'
      : pct >= 60 ? 'Dobrá práce. Chyby jsou přesně to, z čeho se mozek učí nejvíc.'
        : 'Tohle bylo těžší, a stejně je to hotové. Zkus lekci zítra znovu a uvidíš ten rozdíl.';
  let tBox = null, gold = null;
  if (trophy) {
    const { before, now, got, n = exercises } = trophy;
    const head = now > before ? (before ? `Vylepšeno na ${TIER_NAME[now]}!` : `Nový pohárek: ${TIER_NAME[now]}!`)
      : got < now ? `Tvůj pohárek zůstává: ${TIER_NAME[now]}` : `Pohárek: ${TIER_NAME[now]}`;
    // proč vyšel právě tenhle pohárek
    const why = !exercises ? null : `Tento pokus: ${mistakes ? chyb(mistakes) : 'bez chyby'} = ${TIER_NAME[got]}.`;
    const texts = [h('b', {}, head), why ? h('span', { class: 'small' }, why) : null, h('span', { class: 'muted small' }, nextGoal(now, n))];
    if (got === 3) {   // zlato v tomhle pokusu → vždycky velký vstup s tancem
      gold = goldHero();
      tBox = h('div', { class: 'end-trophy gold' }, gold.hero, texts);
      gold.intro = true;
    } else {
      tBox = h('div', { class: 'end-trophy' + (now > before ? ' new' : '') },
        h('div', { class: 'end-trophy-icon', html: trophySvg(now, 128) }), texts);
    }
  }
  const main = h('main', { class: 'page end' },
    tBox || h('div', { class: 'end-burst', html: ICONS.star }),
    h('h1', {}, title), h('p', { class: 'muted' }, sub),
    h('div', { class: 'metric-row' },
      exercises ? h('div', { class: 'metric' }, h('span', { class: 'muted small' }, 'Chyby'), h('b', {}, String(mistakes))) : null,
      h('div', { class: 'metric' }, h('span', { class: 'muted small' }, 'Čas'), h('b', {}, fmtTime(time)))),
    res && res.streakUp ? h('p', { class: 'streak-msg', html: ICONS.flame + `<span>Série: ${res.streak} ${res.streak === 1 ? 'den' : res.streak < 5 ? 'dny' : 'dní'}</span>` }) : null,
    extra || null,
    h('p', { class: 'end-msg' }, msg),
    h('div', { class: 'end-actions' },
      nextId ? h('button', { class: 'btn btn-primary', onclick: () => go('#/lekce/' + nextId) }, 'Další lekce') : null,
      ...(() => {
        const first = again && againFirst;
        const backBtn = h('button', { class: nextId || first ? 'btn btn-ghost' : 'btn btn-primary', onclick: () => go(back) }, backLabel);
        const againBtn = again ? h('button', { class: first ? 'btn btn-primary' : 'btn btn-ghost', onclick: () => { if (location.hash === again) route(); else go(again); } }, againLabel) : null;
        return first ? [againBtn, backBtn] : [backBtn, againBtn];
      })()));
  app.replaceChildren(main);
  window.scrollTo(0, 0);
  if (gold?.intro) goldIntro(main, tBox, gold);
  else {
    // haptika sladěná s animacemi konce: pohárek přiletí (trophyIn), jinak hvězda (pop)
    if (trophy && trophy.now > trophy.before) haptic('trophyIn');
    else if (trophy) haptic(trophy.now >= 2 ? 'silver' : 'bronze', { delay: 120 });
    else haptic('complete');
    if (res && res.streakUp) haptic('streakUp', { delay: 1100 });
  }
}

// ------------------------------------------------------------ zlatý pohárek: tanec
// Při každém zlatu: přes celou obrazovku scéna „ZLATO“ s tančící postavou (animovaný WebP s průhledností).
// Scéna zůstává, dokud se neklepne (po 2 s se objeví nápověda). Pak postava plynule přeletí na své místo
// vedle pohárku a tmavá scéna se stáhne do zlaté záře za ní.
const GOLD_SRC = 'media/zlato.webp';
const GOLD_FLY = 1080;    // ms: přelet postavy na místo vedle pohárku
const GOLD_HINT = 2000;   // ms: kdy se objeví „Klikni pro přeskočení“
let goldBlob = null, goldReq = null, goldUrl = null;
/** stáhne animaci (jednou); vrací slib s blobem, nebo null, když to nejde (offline a ještě nestaženo) */
function loadGold() {
  if (goldBlob) return Promise.resolve(goldBlob);
  return goldReq ||= fetch(GOLD_SRC).then(r => (r.ok ? r.blob() : null)).then(b => (goldBlob = b), () => null).finally(() => { goldReq = null; });
}
// zvuky zlata: „tanec“ hraje jednou od začátku ve chvíli, kdy se objeví postava,
// „záblesk“ ve chvíli, kdy postava dosedne vedle pohárku a kolem ní blikne zlatý kruh
const GOLD_SNDS = { tanec: 'media/zlato.mp3', zablesk: 'media/zablesk.mp3' };
const goldAudios = {};
function goldSound(key) {
  if (goldAudios[key]) return goldAudios[key];
  try { const a = new Audio(GOLD_SNDS[key]); a.preload = 'auto'; goldAudios[key] = a; } catch { return null; }
  return goldAudios[key];
}
// iOS/Safari pustí zvuk jen z přehrávače, který jednou hrál při dotyku → při prvním klepnutí ho potichu „odemkneme“
const goldUnlocked = {};
function unlockGoldSounds() {
  for (const key of Object.keys(GOLD_SNDS)) {
    if (goldUnlocked[key]) continue;
    const a = goldSound(key);
    if (!a) continue;
    goldUnlocked[key] = true;
    a.muted = true;
    const p = a.play();
    const reset = () => { if (a.muted) { a.pause(); a.currentTime = 0; a.muted = false; } };
    if (p && p.then) p.then(reset, () => { a.muted = false; goldUnlocked[key] = false; }); else reset();
  }
}
for (const ev of ['pointerdown', 'keydown']) document.addEventListener(ev, unlockGoldSounds, { capture: true, passive: true });
/** přehraje zvuk jednou od začátku; odejde-li se z obrazovky (el už není na stránce), zvuk utichne */
function playGoldSound(key, el) {
  const a = goldSound(key);
  if (!a) return;
  a.muted = false;
  a.currentTime = 0;
  a.ontimeupdate = () => { if (!el.isConnected) a.pause(); };
  a.onended = () => { a.ontimeupdate = null; };
  const p = a.play();
  if (p && p.catch) p.catch(() => {});
}
const preloadGold = () => { loadGold(); for (const key of Object.keys(GOLD_SNDS)) goldSound(key); };
/** pokaždé nová adresa → animace jede od prvního snímku (stejná adresa by navázala na už běžící kolo) */
function goldSrc() {
  if (goldUrl) URL.revokeObjectURL(goldUrl);
  return (goldUrl = URL.createObjectURL(goldBlob));
}
function goldHero() {
  const fig = h('img', { class: 'gold-fig', alt: '', draggable: 'false' });
  const glow = h('div', { class: 'gold-glow' });
  const ring = h('div', { class: 'gold-ring' });
  const cup = h('div', { class: 'gold-cup', html: trophySvg(3, 128) });
  const slot = h('div', { class: 'gold-slot' }, ring, fig);
  const shelf = h('div', { class: 'gold-shelf' });
  return { fig, glow, ring, cup, slot, shelf, hero: h('div', { class: 'gold-hero' }, glow, cup, slot, shelf) };
}

const EASE_OUT = 'cubic-bezier(.22, 1, .36, 1)';
const EASE_IO = 'cubic-bezier(.65, 0, .35, 1)';
const EASE_POP = 'cubic-bezier(.34, 1.56, .64, 1)';

function goldIntro(main, tBox, g) {
  const { fig, glow, ring, cup, slot, shelf } = g;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;   // omezené animace: scéna se jen jemně rozsvěcuje, nic nelétá
  // všechno ostatní na stránce se po klepnutí postupně objeví
  const rev = [...tBox.children].filter(el => el !== g.hero).concat([...main.children].filter(el => el !== tBox));
  [glow, cup, shelf, ...rev].forEach(el => { el.style.opacity = '0'; });

  const SYMS = '∫∂∞π√Σ′Δ';
  const rnd = (a, b) => a + Math.random() * (b - a);
  const conf = h('div', { class: 'gold-conf' }, Array.from({ length: 22 }, (_, i) => h('span', {
    style: `--x:${(i * 37 + rnd(0, 20)) % 100}%;--s:${rnd(16, 34)}px;--d:${rnd(3.2, 5.8)}s;--w:${-rnd(0, 5)}s;--r:${Math.round(rnd(-360, 360))}deg;--c:${['#ffe066', '#f5b800', '#fffbe0', '#ef9f27'][i % 4]}`,
  }, SYMS[i % SYMS.length])));
  // zlaté jiskry stoupají zespodu (rozmazané tečky různé velikosti)
  const bokeh = h('div', { class: 'gold-bokeh' }, Array.from({ length: 18 }, () => h('i', {
    style: `--x:${rnd(0, 100)}%;--z:${rnd(4, 14)}px;--d:${rnd(5, 10)}s;--w:${-rnd(0, 10)}s;--o:${rnd(.35, .9)};--sx:${rnd(-40, 40)}px`,
  })));
  const pulse = h('div', { class: 'gold-pulse' });
  const bg = h('div', { class: 'gold-bg' }, h('div', { class: 'gold-rays' }), h('div', { class: 'gold-rays gold-rays2' }), pulse);
  const title = h('div', { class: 'gold-title' }, 'ZLATO');
  const sub = h('div', { class: 'gold-sub' }, 'Bez jediné chyby');
  const spot = h('div', { class: 'gold-spot' });
  const stage = h('div', { class: 'gold-stage' }, spot, fig);
  const tap = h('div', { class: 'gold-tap' }, 'Klikni pro přeskočení');
  const ov = h('div', { class: 'gold-over', role: 'dialog', 'aria-label': 'Zlatý pohárek, bez jediné chyby. Klikni pro přeskočení.' }, bg, bokeh, conf, title, sub, stage, tap);
  document.documentElement.classList.add('gold-lock');

  let landed = false, figReady = false;
  const onKey = e => { if (['Enter', ' ', 'Escape'].includes(e.key)) { e.preventDefault(); land(); } };
  const cleanupIntro = () => { document.removeEventListener('keydown', onKey); document.documentElement.classList.remove('gold-lock'); };
  ov.addEventListener('click', () => land());
  document.addEventListener('keydown', onKey);
  fig.style.opacity = '0';

  // haptika: fanfára s nápisem, třpyt konfet, pak tep v rytmu pulzující záře (vrchol v půlce 2,6 s)
  hapticSeq([[150, 'fanfare']]);
  setTimeout(() => { if (!landed && ov.isConnected) sparkle(520, 1.2); }, 700);
  let beats = 0;
  const beat = () => { if (landed || !ov.isConnected || beats++ >= 8) return; haptic('heartbeat'); beatT = setTimeout(beat, 2600); };
  let beatT = setTimeout(beat, 1300);

  // vstup: scéna se rozsvítí, nápis naskočí; postava vyjede, jakmile je animace načtená
  bg.animate([{ opacity: 0, transform: 'scale(1.15)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: EASE_OUT });
  title.animate([{ opacity: 0, transform: 'translateY(-14px) scale(.6)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay: 150, easing: EASE_POP, fill: 'backwards' });
  sub.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: 450, easing: EASE_OUT, fill: 'backwards' });
  for (const el of [conf, bokeh]) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 900, delay: 200, fill: 'backwards' });
  // nápověda po 2 s, pak jemně dýchá
  tap.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: GOLD_HINT, easing: EASE_OUT, fill: 'backwards' })
    .finished.then(() => { if (!landed) tap.animate([{ opacity: 1 }, { opacity: .45 }, { opacity: 1 }], { duration: 2200, iterations: Infinity, easing: 'ease-in-out' }); }, () => {});
  // záře za postavou pulzuje (běží i při omezených animacích, je to jen jas, žádný pohyb)
  pulse.animate([{ opacity: .55, transform: 'scale(.88)' }, { opacity: 1, transform: calm ? 'scale(.88)' : 'scale(1.08)' }, { opacity: .55, transform: 'scale(.88)' }], { duration: 2600, iterations: Infinity, easing: 'ease-in-out' });

  loadGold().then(b => {
    if (!b) { slot.remove(); return; }   // animace není k dispozici (offline a ještě nestažená): zůstane jen pohárek uprostřed
    fig.src = goldSrc();
    return fig.decode().catch(() => {}).then(() => {
      figReady = true;
      fig.style.opacity = '';
      if (fig.isConnected) playGoldSound('tanec', fig);
      if (!landed) {
        fig.animate([{ opacity: 0, transform: 'translateY(90px) scale(.92)' }, { opacity: 1, transform: 'none' }], { duration: 900, easing: EASE_OUT });
        spot.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 900, easing: 'ease-out' });
      } else {
        fig.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, easing: 'ease-out' });
      }
    });
  });

  function land() {
    if (landed) return;
    landed = true;
    clearTimeout(beatT);
    cleanupIntro();
    if (!ov.isConnected) return;   // mezitím se odešlo jinam
    hapticStop();
    ramp(GOLD_FLY, 'land');        // přelet: zrychlující cvakání, buch při dosednutí
    const first = fig.getBoundingClientRect();
    if (slot.isConnected) slot.append(fig);                // ten samý obrázek → animace běží dál bez přerušení
    if (figReady) {
      const last = fig.getBoundingClientRect();
      const dx = (first.left + first.width / 2) - (last.left + last.width / 2);
      const dy = (first.top + first.height / 2) - (last.top + last.height / 2);
      const k = first.height / last.height;
      fig.classList.add('flying');
      fig.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${k})` }, { transform: 'none' }], { duration: GOLD_FLY, easing: EASE_IO })
        .finished.then(() => fig.classList.remove('flying'), () => {});
    }

    // scéna se stáhne do místa, kam postava letí, a rozplyne se ve zlaté záři
    const r = (slot.isConnected ? slot : cup).getBoundingClientRect();
    const cx = r.left + r.width / 2 - innerWidth / 2, cy = r.top + r.height / 2 - innerHeight / 2;
    bg.animate([
      { transform: 'none', opacity: 1 },
      { transform: `translate(${cx * .7}px, ${cy * .7}px) scale(.35)`, opacity: .85, offset: .6 },
      { transform: `translate(${cx}px, ${cy}px) scale(.12)`, opacity: 0 },
    ], { duration: GOLD_FLY, easing: EASE_IO, fill: 'forwards' });
    const away = [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-28px) scale(.92)' }];
    title.animate(away, { duration: 450, easing: EASE_IO, fill: 'forwards' });
    sub.animate(away, { duration: 400, easing: EASE_IO, fill: 'forwards' });
    for (const el of [conf, bokeh, spot, tap]) {
      el.getAnimations().forEach(a => a.cancel());
      el.animate([{ opacity: getComputedStyle(el).opacity }, { opacity: 0 }], { duration: 450, easing: 'ease-out', fill: 'forwards' });
    }
    setTimeout(() => ov.remove(), GOLD_FLY + 50);

    // stránka: záře, lišta, pohárek a nakonec texty a tlačítka
    const show = (el, frames, opt) => { el.style.opacity = ''; el.animate(frames, { fill: 'backwards', ...opt }); };
    show(glow, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: 350, easing: EASE_OUT });
    show(shelf, [{ opacity: 0, transform: 'scaleX(0)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay: 550, easing: EASE_OUT });
    show(cup, [{ opacity: 0, transform: 'translateY(18px) scale(.4) rotate(-14deg)' }, { opacity: 1, transform: 'none' }], { duration: 750, delay: 700, easing: EASE_POP });
    if (figReady) setTimeout(() => { if (slot.isConnected) playGoldSound('zablesk', slot); }, GOLD_FLY - 140);   // zvuk záblesku se startem kruhu
    if (figReady) ring.animate([{ opacity: 0, transform: 'scale(.5)' }, { opacity: .75, transform: 'scale(.75)', offset: .15 }, { opacity: 0, transform: 'scale(1.6)' }], { duration: 850, delay: GOLD_FLY - 140, easing: 'ease-out' });
    rev.forEach((el, i) => show(el, [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: 850 + i * 70, easing: EASE_OUT }));
  }

  app.append(ov);
}

// ------------------------------------------------------------ procvičování a plynulost
function practiceScreen(pathId) {
  const p = PATHS.find(x => x.id === pathId);
  if (!p?.content) return go('#/');
  const weak = store.weakKeys().filter(k => k.startsWith(p.id + '/')).map(k => k.slice(p.id.length + 1)).filter(k => p.gen[k]);
  const pool = p.content.fluency.pool;
  const fs = [];
  for (let i = 0; i < 8; i++) {
    const k = weak[i % Math.max(1, weak.length)];
    fs.push(k ? p.gen[k] : pick(pool));
  }
  const back = '#/cesta/' + p.id;
  runLesson({
    factories: shuffle(fs), title: 'Procvičování', back, pathId: p.id, cheat: p.content.cheat,
    resumeKey: 'procvic/' + p.id, pool: [...new Set([...Object.values(p.gen), ...pool])],
    onFinish: ({ time, acc, firstOk, exercises, mistakes }) => {
      const res = store.finishLesson('practice-' + p.id, { acc, time });
      endScreen({ title: 'Procvičeno!', sub: weak.length ? 'Zaměřeno na tvoje slabší místa' : 'Mix ze všeho', acc, time, exercises, mistakes, res, back, again: '#/procvic/' + p.id });
    },
  });
}

function fluencyScreen(pathId) {
  const p = PATHS.find(x => x.id === pathId);
  if (!p?.content) return go('#/');
  const fl = p.content.fluency;
  preloadGold();
  const fs = shuffle(fl.pool).slice(0, fl.count);
  const back = '#/cesta/' + p.id;
  runLesson({
    factories: fs, title: fl.title, back, mode: 'fluency', pathId: p.id,
    resumeKey: 'plynulost/' + p.id, pool: fl.pool,
    onFinish: ({ time, acc, firstOk, exercises, mistakes }) => {
      const hist = store.get().fluency.filter(f => f.path === p.id);
      const tierBefore = fluencyTier(p.id);
      const entry = { path: p.id, d: Date.now(), time: Math.round(time), correct: firstOk, total: exercises };
      store.addFluency(entry);
      const got = tierFromMistakes(mistakes, exercises);
      const res = store.finishLesson('fluency-' + p.id, { acc, time, tier: got, mist: mistakes });
      const trophy = { before: tierBefore, now: fluencyTier(p.id), got, n: exercises };
      const all = [...hist, entry].slice(-6);
      const maxT = Math.max(...all.map(a => a.time));
      const master = firstOk >= exercises - 1 && time <= 600;
      const extra = h('div', { class: 'fluency-box' },
        master ? h('div', { class: 'master', html: ICONS.trophy + '<span>Počítáš jak bičem mrská!</span>' }) : null,
        h('p', { class: 'small muted' }, 'Tvoje pokusy (čas, kolik správně):'),
        h('div', { class: 'hist' }, all.map((a, i) => h('div', { class: 'hist-row' + (i === all.length - 1 ? ' now' : '') },
          h('span', { class: 'hist-bar', style: `width:${Math.max(8, 100 * a.time / maxT)}%` }),
          h('span', { class: 'small' }, `${fmtTime(a.time)} · ${a.correct}/${a.total}`)))),
        hist.length ? h('p', { class: 'small' }, time < Math.min(...hist.map(a => a.time)) ? 'Nový rekord v čase!' : 'Rychlost přijde sama, s každým opakováním.') : null);
      endScreen({ title: 'Zkouška plynulosti hotová', sub: `${firstOk} z ${exercises} správně napoprvé`, acc, time, exercises, mistakes, res, back, again: '#/plynulost/' + p.id, extra, trophy });
    },
  });
}

// ------------------------------------------------------------ režim Z hlavy
// Krátké kolo jen na ťukání a švih (bez papíru). Karty jsou v src/<cesta>/hlava.js, plánování v src/zhlavy.js.
// Každá odpověď se hned započítá do termínu opakování, takže kolo jde kdykoli opustit beze ztráty.
const skillOpen = s => store.get().unlockAll || store.isDone(s.after);
/** odemčené dovednosti jedné cesty, nebo všech cest (scope 'mix') */
function pocketSkills(scope) {
  return PATHS.filter(p => inScope(p, scope))
    .flatMap(p => p.deck.map(s => ({ ...s, key: `${p.id}/${s.id}`, pid: p.id }))).filter(skillOpen);
}
/** fresh = odemčené karty, které ještě nikdy nepřišly na řadu; due = už viděné, kterým vypršel termín; total = všechny karty v balíčku */
function pocketInfo(scope) {
  const skills = pocketSkills(scope), mem = store.get().mem || {};
  const total = PATHS.filter(p => inScope(p, scope)).reduce((n, p) => n + p.deck.length, 0);
  // paměť se ukazuje, až když je co měřit (nula u někoho, kdo režim ještě nezkusil, by jen odrazovala)
  return {
    skills, total, fresh: skills.filter(s => !mem[s.key]).length, due: skills.filter(s => mem[s.key] && isDue(mem[s.key])).length,
    memory: skills.some(s => mem[s.key]) ? memoryOf(skills, mem) : null,
  };
}
// „Karta“ = jeden druh rozhodnutí (v kódu skill / dovednost); čísla v ní jsou pokaždé jiná.
const cardWord = n => (n === 1 ? 'karta' : n >= 2 && n <= 4 ? 'karty' : 'karet');
const newCards = n => (n === 1 ? '1 nová karta' : n >= 2 && n <= 4 ? `${n} nové karty` : `${n} nových karet`);
const unseenCards = n => (n === 1 ? '1 neobjevená karta' : n >= 2 && n <= 4 ? `${n} neobjevené karty` : `${n} neobjevených karet`);
function pocketSub(pi) {
  if (!pi.skills.length) return 'odemkne se po první lekci';
  if (pi.fresh && pi.due) return `${unseenCards(pi.fresh)}, ${pi.due} k osvěžení`;
  if (pi.fresh) return unseenCards(pi.fresh);
  return pi.due ? `${pi.due} ${cardWord(pi.due)} k osvěžení` : 'dnes je osvěženo vše';
}
/** karty, které odemkne dokončení dané lekce */
const unlockedBy = (path, lessonId) => path.deck.filter(s => s.after === lessonId);
function openPocket(scope) {
  if (!pocketSkills(scope).length) { haptic('nope'); return toast('Režim Z hlavy se odemkne po první dokončené lekci.'); }
  go('#/zhlavy/' + scope);
}

/** lessonId = kolo jen z karet, které odemkla tahle lekce (tlačítko „Vyzkoušet hned“ na konci lekce) */
function pocketScreen(scope, lessonId) {
  const path = PATHS.find(p => p.id === scope);
  if (!MIX[scope] && !path) return go('#/');
  const back = MIX[scope] ? '#/' : '#/cesta/' + scope;
  const skills = pocketSkills(scope);
  if (!skills.length) return go(back);
  const manual = !!store.get().pocketManual;
  const before = { ...(store.get().mem || {}) };
  const memBefore = memoryOf(skills, before);
  const focus = lessonId ? skills.filter(s => s.after === lessonId) : [];
  const queue = (focus.length ? focusRound(focus) : buildRound(skills, before)).map(s => ({ s, tries: 0 }));
  const planned = queue.length;
  let idx = 0, row = 0, bestRow = 0, firstOk = 0, mistakes = 0, phase = 'answer', cur = null, card = null, cardT0 = 0, timer = null;
  const t0 = performance.now();
  const touched = new Map();   // dovednosti, na které v kole došlo (pro shrnutí)
  const shown = new Set();

  const bar = h('div', { class: 'bar-fill' });
  const rowPill = h('span', { class: 'row-pill' });
  const stage = h('div', { class: 'stage' });
  const foot = h('footer', { class: 'lesson-foot' });
  const screen = h('div', { class: 'lesson pocket' },
    h('div', { class: 'lesson-top' }, h('button', { class: 'icon-btn', 'aria-label': 'Ukončit kolo', html: ICONS.close, onclick: () => askClose() }), h('div', { class: 'bar lesson-bar' }, bar), rowPill,
      h('button', { class: 'cheat-btn', type: 'button', title: 'Tahák: vzorce a pravidla', 'aria-label': 'Otevřít tahák', onclick: () => openCheat(), html: ICONS.book + '<span>Tahák</span>' })),
    stage, foot);
  // tahák je k ruce i tady (kdo si není jistý, ať se radši podívá, než aby hádal); odpověď s tahákem ale stupeň neposune
  let peeked = false;
  const sheets = {};
  function openCheat() {
    const p = PATHS.find(x => x.id === queue[Math.min(idx, queue.length - 1)].s.pid);
    if (phase === 'answer') peeked = true;
    openSheet('Tahák · ' + p.short, p.content.cheat, (sheets[p.id] ||= { open: [0], scroll: 0 }));
  }
  const setRow = () => { rowPill.innerHTML = ICONS.bolt + `<b>${row}</b><span>v řadě</span>`; rowPill.classList.toggle('hot', row >= 3); };
  setRow();
  app.replaceChildren(screen);

  function askClose() {
    if (idx === 0 && phase === 'answer') return go(back);
    modal('Skončit kolo?', 'Odpovědi z tohohle kola už jsou započítané, o nic nepřijdeš.', [
      { label: 'Pokračovat', primary: true },
      { label: 'Skončit', fn: () => go(back) },
    ]);
  }

  function show() {
    clearTimeout(timer);
    if (idx >= queue.length) return finish();
    const it = queue[idx];
    bar.style.width = `${100 * idx / queue.length}%`;
    card = it.s.make();
    (window.__ma1 ||= {}).card = card;
    cur = renderCard(card, { instant: check });
    phase = 'answer';
    peeked = false;
    cardT0 = performance.now();
    const fresh = !before[it.s.key] && !shown.has(it.s.key);
    shown.add(it.s.key);
    cur.el.prepend(h('div', { class: 'pk-chip' }, h('span', {}, MIX[scope] ? `${PATHS.find(p => p.id === it.s.pid).short} · ${it.s.title}` : it.s.title),
      it.tries ? h('b', { class: 'rep' }, 'znovu po chybě') : fresh ? h('b', {}, 'nová karta') : null));
    stage.replaceChildren(cur.el);
    fitMath(cur.el);
    window.scrollTo(0, 0);
    cur.el.classList.add('enter');
    haptic('enter', { delay: 230 });
    foot.className = 'lesson-foot pk-foot';
    foot.replaceChildren(h('div', { class: 'foot-row' },
      h('button', { class: 'btn btn-ghost btn-small', onclick: dontKnow }, 'Nevím'),
      h('span', { class: 'muted small' }, `${idx + 1} / ${queue.length}`)));
  }

  function check() {
    if (phase !== 'answer') return;
    const r = cur.check();
    if (r.invalid) return;
    settle(r.ok, r);
  }
  function dontKnow() {
    if (phase !== 'answer') return;
    settle(false, { ...cur.reveal(), dontKnow: true });
  }

  function settle(ok, r) {
    phase = 'feedback';
    const it = queue[idx], dt = (performance.now() - cardT0) / 1000;
    // dovednost, která je nová nebo ještě nesedí, dostane vysvětlení i po správné odpovědi (poprvé v kole): správně se dá i uhodnout
    const teach = it.tries === 0 && !touched.has(it.s.key) && (before[it.s.key]?.b ?? 0) < 2;
    const helped = ok && peeked;
    if (!helped) store.pocketAnswer(it.s.key, ok);
    touched.set(it.s.key, it.s);
    // chyba z hlavy se přičte ke slabým místům příkladu „na papír“, takže na ni zamíří i Procvičování
    if (!ok && it.s.weak) store.record(`${it.s.pid}/${it.s.weak}`, false, dt);
    if (ok && it.tries === 0) firstOk++;
    if (!ok) {
      mistakes++;
      if (it.tries < 2) queue.splice(Math.min(queue.length, idx + 3), 0, { s: it.s, tries: it.tries + 1 });   // vrátí se za chvíli, s jinými čísly
    }
    row = ok ? row + 1 : 0;
    bestRow = Math.max(bestRow, row);
    setRow();
    answerFx(ok, r.dontKnow, row);
    const title = r.dontKnow ? 'V pohodě, takhle to je:' : ok ? pick(PRAISE) : pick(SOFT);
    const head = h('div', { class: 'fb-title', html: (ok ? ICONS.check : ICONS.bulb) + `<span>${title}</span>` });
    foot.className = 'lesson-foot pk-foot fb ' + (ok ? 'fb-ok' : 'fb-soft');
    if (ok && !manual && !teach && !helped) {
      // správně u dovednosti, která už sedí: krátké potvrzení a další karta sama (jde vypnout v Nastavení)
      foot.replaceChildren(h('div', { class: 'foot-row' }, head));
      timer = setTimeout(next, 750);
      return;
    }
    if (r.msg || helped) {
      // u špatně zvolené možnosti: nejdřív proč ne tahle, pak jak je to správně
      const more = !ok && card.explain && card.explain !== r.msg ? h('div', { class: 'fb-msg fb-more', html: m(card.explain) }) : null;
      const note = helped ? h('p', { class: 'fb-note' }, 'S tahákem se stupeň neposouvá. Příště to zkus bez něj.') : null;
      const detail = h('div', { class: 'fb-detail ' + (ok ? 'fb-ok' : 'fb-soft') }, r.msg ? h('div', { class: 'fb-msg', html: m(r.msg) }) : null, more, note);
      stage.append(detail);
      setTimeout(() => detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
    }
    foot.replaceChildren(h('div', { class: 'foot-row' }, head, h('button', { class: 'btn btn-primary', onclick: next }, 'Pokračovat')));
  }

  function next() {
    if (phase !== 'feedback') return;
    clearTimeout(timer);
    idx++;
    show();
  }

  function finish() {
    phase = 'done';
    document.removeEventListener('keydown', onKey);
    const time = (performance.now() - t0) / 1000;
    const acc = planned ? firstOk / planned : 1;
    const res = store.finishLesson('zhlavy-' + scope, { acc, time });
    const mem = store.get().mem, memAfter = memoryOf(pocketSkills(scope), mem);
    const rows = [...touched.values()].map(s => {
      const now = mem[s.key], was = before[s.key]?.b ?? 0, d = dueInDays(now);
      return h('div', { class: 'pk-row' + (now.b > was ? ' up' : now.b < was ? ' down' : '') },
        h('span', { class: 'pk-name' }, s.title),
        h('span', { class: 'pk-dots', title: `Stupeň ${now.b} z ${TOP}` }, Array.from({ length: TOP }, (_, i) => h('i', { class: i < now.b ? 'on' : null }))),
        h('span', { class: 'pk-when muted small' }, d <= 0 ? 'dnes' : d === 1 ? 'zítra' : `za ${d} ${d < 5 ? 'dny' : 'dní'}`));
    });
    const extra = h('div', { class: 'pk-end' },
      h('div', { class: 'pk-mem' },
        h('span', { class: 'muted small' }, MIX[scope] ? 'Paměť (všechny cesty)' : 'Paměť cesty'),
        h('b', {}, memAfter === memBefore ? `${memAfter} %` : `${memBefore} % → ${memAfter} %`),
        h('div', { class: 'bar thin' }, h('div', { class: 'bar-fill', style: `width:${memAfter}%` }))),
      h('div', { class: 'pk-list' }, h('div', { class: 'pk-row pk-head muted small' }, h('span', { class: 'pk-name' }, 'Karta'), h('span', {}, 'Stupeň'), h('span', { class: 'pk-when' }, 'Znovu')), rows),
      h('p', { class: 'muted small' }, 'Co umíš, vrací se po čím dál delší době: za 1, 3, 7, 16 a 35 dní. Chyba kartu posune zpátky a vrátí ji už zítra.'),
      (() => { const pi = pocketInfo(scope); return pi.skills.length < pi.total ? h('p', { class: 'muted small' }, `Odemčeno máš ${pi.skills.length} z ${pi.total} karet. Další přibudou s každou novou lekcí.`) : null; })());
    endScreen({
      title: 'Kolo hotové', sub: MIX[scope] ? `Z hlavy · ${COURSES[MIX[scope]].short} · všechny cesty` : 'Z hlavy · ' + path.title, acc, time, exercises: planned, mistakes, res, back,
      backLabel: MIX[scope] ? 'Domů' : 'Zpět na cestu', again: '#/zhlavy/' + scope, againLabel: 'Další kolo', againFirst: true, extra,
      note: mistakes ? 'Na čem to drhlo, se vrátí zítra. A najdeš to i v Procvičování slabých míst.' : bestRow >= 6 ? `Bez chyby, ${bestRow} v řadě. Tohle už v hlavě drží.` : 'Bez chyby. Tohle už v hlavě drží.',
    });
  }

  function onKey(e) {
    const sheet = document.querySelector('.sheet-back');
    if (sheet) { if (e.key === 'Escape') sheet.remove(); return; }   // otevřený tahák: klávesy nepatří kolu
    if (document.querySelector('.modal-back')) return;
    if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); if (phase === 'feedback') next(); return; }
    if (e.key === 'Escape') return askClose();
    if (phase === 'answer' && cur.key && /^([1-9]|ArrowLeft|ArrowRight)$/.test(e.key)) cur.key(e.key);
  }
  document.addEventListener('keydown', onKey);
  cleanup = () => { document.removeEventListener('keydown', onKey); clearTimeout(timer); };
  show();
  if (!store.get().seenPocket) {
    modal('Režim Z hlavy', 'Žádné psaní, jen rozhodnutí. Kartu se dvěma možnostmi <b>švihni</b> doleva nebo doprava (nebo ťukni na tlačítko), u ostatních ťukni na odpověď.<br><br>U nových věcí a po chybě uvidíš krátké vysvětlení. Když nevíš, dej <b>Nevím</b> nebo se podívej do taháku, hádat nemá cenu. Co umíš, vrátí se až za delší dobu.',
      [{ label: 'Rozumím', primary: true, fn: () => store.set({ seenPocket: true }) }]);
  }
}

// ------------------------------------------------------------ písemky: simulace testu (Základy) a cvičná písemka (MA1)
// Jako na papíře: příklady za sebou, bez zpětné vazby, bez taháku a nápovědy. Body, správné výsledky a postupy až na konci.
// Obojí běží přes stejný kód (examRun), liší se jen „spec“: odkud se berou příklady, jak se jmenují části, kam vede trénink.
const halfPts = x => Math.round(x * 2) / 2;
const fmtDate = t => new Date(t).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' });
let testWrong = [], testWrongSpec = null;   // úlohy, ve kterých se v posledním testu ztratily body (pro „Procvičit chyby“)

// ---------------- Základy matematiky
const TEST_PARTS = [
  ['1', 'Komplexní čísla', 4], ['2', 'Goniometrický tvar, mocnina, odmocniny', 10], ['3', 'Rovnice a nerovnice', 8],
  ['4', 'Graf funkce a průsečíky', 4], ['5', 'Přímka nebo rovina', 2], ['6', 'Vzájemná poloha rovin', 2],
];
const ZM_SPEC = {
  course: 'zm', route: '#/test', title: 'Simulace testu', word: 'test', doneLabel: 'Odevzdat test',
  key: v => 'zm-test-' + v,
  variant: v => (VARIANTS[v] ? { title: VARIANTS[v].title, items: VARIANTS[v].build().map(q => ({ id: q.id, pts: q.pts, make: q.make, redo: q.redo, topic: TOPIC[q.id], link: { label: 'Otevřít cestu k tomuhle typu', route: '#/cesta/' + q.path } })) } : null),
  partTitle: n => TEST_PARTS.find(p => p[0] === n)?.[1] || '',
  cheat: () => PATHS.filter(p => p.course === 'zm').flatMap(p => p.content.cheat.map(s => ({ ...s, title: `${p.short}: ${s.title}` }))),
  again: v => (v === 'N' ? ['#/test/N', 'Nová varianta'] : ['#/test', 'Jiná varianta']),
};

// ---------------- MA1: cvičná písemka
const MA1_PARTS = [['1', 'Definiční obor'], ['2', 'Monotonie a lokální extrémy'], ['3', 'Limita'], ['4', 'Taylorův polynom 2. řádu'], ['5', 'Neurčitý integrál'], ['6', 'Určitý integrál'], ['7', 'Pravda / nepravda (teorie)']];
const PRAKT_PARTS = { 1: 'Limity', 2: 'Lokální extrémy', 3: 'Asymptota', 4: 'Taylorův polynom', 5: 'Určitý integrál (per partes)' };
const examCache = new Map();
/** písemka podle id: minulá ('26A', 'IF', 'PR') nebo nová ('N123456') */
function ma1Exam(v) {
  if (examCache.has(v)) return examCache.get(v);
  let ex = null;
  const m1 = /^N(\d+)$/.exec(v);
  if (m1) { const e = newExam(Number(m1[1])); ex = { ...e, title: `Generovaná písemka č. ${e.seed}` }; }
  else { const e = examById(v); if (e) ex = { ...e, title: e.practical ? 'Praktická část' : `${e.course} · varianta ${e.letter}`, problems: examProblems(e) }; }
  if (ex) examCache.set(v, ex);
  return ex;
}
const MA1_SPEC = {
  course: 'ma1', route: '#/pisemka', title: 'Cvičná zápočtová zkouška', word: 'písemka', doneLabel: 'Odevzdat písemku', onFinish: (v, items) => pisAfterExam(v, items),
  key: v => 'ma1-test-' + (v[0] === 'N' ? 'N' : v),
  variant(v) {
    const ex = ma1Exam(v);
    if (!ex) return null;
    return {
      title: ex.title, print: '#/pisemka/tisk/' + v, practical: ex.practical,
      items: ex.problems.map(p => ({ id: p.n, pts: p.pts, make: p.card, redo: TRAIN[p.n[0]] && !ex.practical ? TRAIN[p.n[0]].gen : p.card,
        topic: ex.practical ? PRAKT_PARTS[p.n[0]] : MA1_PARTS[Number(p.n[0]) - 1]?.[1],
        link: ex.practical ? null : { label: 'Trénovat tenhle typ příkladu', route: '#/pisemka/trenink/' + p.n[0] } })),
    };
  },
  partTitle: n => MA1_PARTS.find(p => p[0] === n)?.[1] || PRAKT_PARTS[n] || '',
  cheat: () => PATHS.filter(p => p.course === 'ma1').flatMap(p => p.content.cheat.map(s => ({ ...s, title: `${p.short}: ${s.title}` }))),
  again: v => (v[0] === 'N' ? ['#/pisemka/N', 'Vygenerovat další písemku'] : ['#/pisemka', 'Zpět na zkoušku']),
};
const SPECS = { zm: ZM_SPEC, ma1: MA1_SPEC };
const specRuns = (spec, v) => store.get().fluency.filter(f => f.path === spec.key(v));

function testHome() {
  ensureCourse('zm');
  const main = h('main', { class: 'page test-home' });
  main.append(h('section', { class: 'test-hero' },
    h('h1', {}, 'Simulace testu'),
    h('p', {}, 'Stejná stavba jako papírový test ze Základů matematiky. Během psaní nevidíš, jestli je odpověď správně, a není tu tahák ani nápověda. Body, správné výsledky a postupy uvidíš až na konci.'),
    h('div', { class: 'test-parts' }, TEST_PARTS.map(([n, t, p]) => h('div', { class: 'test-part' }, h('span', { class: 'test-num' }, n), h('span', {}, t), h('b', {}, `${p} b`))),
      h('div', { class: 'test-part test-sum' }, h('span'), h('span', {}, 'Celkem'), h('b', {}, `${TOTAL} b`)))));
  main.append(h('h2', { class: 'section-title' }, 'Vyber variantu'));
  main.append(h('div', { class: 'path-grid' }, Object.entries(VARIANTS).map(([v, V]) => {
    const best = bestRun(testRuns(v));
    return h('button', { class: 'path-card variant-card', onclick: () => go('#/test/' + v) },
      h('span', { class: 'path-num' }, v === 'N' ? '?' : v),
      h('span', { class: 'path-text' }, h('b', {}, V.title), h('span', { class: 'muted' }, V.sub)),
      h('span', { class: 'variant-best' + (best ? '' : ' muted') }, best ? h('b', {}, `${fmtPts(best.correct)}/${TOTAL}`) : 'nové', best ? h('small', {}, 'nejlépe') : null));
  })));
  const hist = ['A', 'B', 'N'].flatMap(v => testRuns(v).map(r => ({ ...r, v }))).sort((a, b) => b.d - a.d).slice(0, 8);
  if (hist.length) main.append(h('h2', { class: 'section-title' }, 'Tvoje pokusy'), histList(hist.map(r => ({ ...r, label: VARIANTS[r.v].title }))));
  main.append(h('p', { class: 'muted small footnote' }, 'Tip: nejdřív projdi cesty, pak napiš variantu A. K variantě B a novým variantám se vrať po pár dnech, ať je vidět, co v hlavě opravdu drží.'));
  app.replaceChildren(topbar('#/', 'Simulace testu'), main);
}
function histList(rows) {
  return h('div', { class: 'hist test-hist' }, rows.map(r => h('div', { class: 'hist-row' },
    h('span', { class: 'hist-bar', style: `width:${Math.max(6, 100 * r.correct / r.total)}%` }),
    h('span', { class: 'small' }, `${r.label} · ${fmtPts(r.correct)}/${r.total} b · ${fmtTime(r.time)} · ${fmtDate(r.d)}`))));
}

/** spuštění písemky / testu; v = varianta */
function examRun(spec, v) {
  ensureCourse(spec.course);
  if (v === 'chyby') return testPractice(spec);
  const V = spec.variant(v);
  if (!V) return go(spec.route);
  const items = V.items.map(q => ({ q, card: null, cur: null, r: null, got: 0, skipped: false }));
  const TOT = items.reduce((s, it) => s + it.q.pts, 0);
  let idx = 0, done = false;
  const t0 = performance.now();
  const bar = h('div', { class: 'bar-fill' });
  const pill = h('span', { class: 'row-pill test-pill' });
  const clock = h('span', { class: 'test-clock', title: 'Jen pro tebe, žádný limit' });
  const stage = h('div', { class: 'stage' });
  const foot = h('footer', { class: 'lesson-foot' });
  const screen = h('div', { class: 'lesson test-run' },
    h('div', { class: 'lesson-top' }, h('button', { class: 'icon-btn', 'aria-label': 'Ukončit', html: ICONS.close, onclick: () => askClose() }), h('div', { class: 'bar lesson-bar' }, bar), clock, pill),
    stage, foot);
  app.replaceChildren(screen);
  const tick = () => { const s = Math.floor((performance.now() - t0) / 1000); clock.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  tick();
  const timer = setInterval(tick, 1000);

  function askClose() {
    modal(spec.word === 'test' ? 'Ukončit test?' : 'Ukončit písemku?', 'Rozepsané odpovědi se neuloží. Příště začneš znovu od prvního příkladu.', [
      { label: 'Psát dál', primary: true },
      { label: 'Ukončit', fn: () => go(spec.route) },
    ]);
  }
  function show() {
    if (idx >= items.length) return finish();
    const it = items[idx];
    it.card = it.q.make();
    (window.__ma1 ||= {}).card = it.card;
    it.cur = renderCard(it.card);
    bar.style.width = `${100 * idx / items.length}%`;
    pill.innerHTML = `<b>${it.q.id}</b><span>${idx + 1}/${items.length}</span>`;
    stage.replaceChildren(h('div', { class: 'test-qhead' }, h('b', {}, `Příklad ${it.q.id}`), h('span', { class: 'test-pts' }, `${fmtPts(it.q.pts)} ${it.q.pts >= 5 ? 'bodů' : 'body'}`)), it.cur.el);
    stage.scrollTop = 0;
    window.scrollTo(0, 0);
    it.cur.el.classList.add('enter');
    haptic('enter', { delay: 230 });
    const last = idx === items.length - 1;
    foot.className = 'lesson-foot';
    foot.replaceChildren(h('div', { class: 'foot-row' },
      h('button', { class: 'btn btn-ghost', onclick: skip }, 'Přeskočit'),
      h('button', { class: 'btn btn-primary', onclick: save }, last ? spec.doneLabel : 'Další příklad')));
    it.cur.focus && setTimeout(it.cur.focus, 30);
  }
  function save() {
    if (done) return;
    const it = items[idx];
    const r = it.cur.check();
    if (r.invalid) { haptic('nope'); return toast(r.invalid + ' Nebo dej Přeskočit.'); }
    it.r = r;
    it.got = halfPts(it.q.pts * (r.score ?? (r.ok ? 1 : 0)));
    haptic('step');
    idx++;
    show();
  }
  function skip() {
    if (done) return;
    const it = items[idx];
    it.r = { ...it.cur.reveal(), skipped: true };
    it.skipped = true;
    it.got = 0;
    haptic('soft');
    idx++;
    show();
  }
  function finish() {
    done = true;
    clearInterval(timer);
    document.removeEventListener('keydown', onKey);
    const time = (performance.now() - t0) / 1000;
    const total = halfPts(items.reduce((s, it) => s + it.got, 0));
    const before = bestRun(specRuns(spec, v));
    store.addFluency({ path: spec.key(v), d: Date.now(), time: Math.round(time), correct: total, total: TOT });
    const res = store.finishLesson(spec.key(v), { acc: total / TOT, time });
    testWrong = items.filter(it => it.got < it.q.pts).map(it => it.q);
    testWrongSpec = spec;
    spec.onFinish?.(v, items);
    testResults(spec, v, V, items, time, total, TOT, before, res);
  }
  function onKey(e) {
    if (document.querySelector('.modal-back')) return;
    if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); save(); return; }
    if (e.key === 'Escape') return askClose();
    const cur = items[idx]?.cur;
    if (cur && cur.key && /^[1-9]$/.test(e.key) && !cur.typing) cur.key(e.key);
  }
  document.addEventListener('keydown', onKey);
  cleanup = () => { document.removeEventListener('keydown', onKey); clearInterval(timer); };
  show();
}
const testRun = v => examRun(ZM_SPEC, v);

function testResults(spec, v, V, items, time, total, TOT, before, res) {
  const pct = Math.round(100 * total / TOT);
  const main = h('main', { class: 'page test-res' });
  // součty po příkladech (podle první číslice: 1a + 1b = příklad 1)
  const order = [...new Set(items.map(it => it.q.id[0]))];
  const parts = order.map(n => {
    const its = items.filter(it => it.q.id[0] === n);
    return { n, t: spec.partTitle(n), got: its.reduce((s, it) => s + it.got, 0), max: its.reduce((s, it) => s + it.q.pts, 0) };
  });
  const lost = parts.filter(p => p.got < p.max).sort((a, b) => (b.max - b.got) - (a.max - a.got));
  main.append(h('section', { class: 'test-score' },
    h('small', {}, V.title.toUpperCase()),
    h('div', { class: 'test-big' }, fmtPts(total), h('span', {}, ` / ${TOT}`)),
    h('p', { class: 'muted' }, `bodů · ${pct} % · ${fmtTime(time)}${spec.course === 'ma1' && !V.practical ? ' (na písemce je 100 minut)' : ''}`),
    h('div', { class: 'bar' }, h('div', { class: 'bar-fill', style: `width:${pct}%` })),
    before ? h('p', { class: 'small' }, total > before.correct ? `Nový rekord! Dřív nejlépe ${fmtPts(before.correct)} bodů.` : `Tvoje nejlepší tady: ${fmtPts(before.correct)} bodů.`) : null,
    res && res.streakUp ? h('p', { class: 'streak-msg', html: ICONS.flame + `<span>Série: ${res.streak} ${res.streak === 1 ? 'den' : res.streak < 5 ? 'dny' : 'dní'}</span>` }) : null));
  main.append(h('div', { class: 'test-tiles', style: `--n:${parts.length}` }, parts.map(p => h('button', {
    class: 'test-tile ' + (p.got === p.max ? 'full' : p.got === 0 ? 'zero' : 'part'), type: 'button',
    onclick: () => main.querySelector(`[data-part="${p.n}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
  }, h('span', { class: 'muted small' }, `Př. ${p.n}`), h('b', {}, `${fmtPts(p.got)}/${p.max}`)))));
  main.append(h('p', { class: 'end-msg' }, !lost.length ? 'Plný počet bodů. Tohle je přesně ono.'
    : `Nejvíc bodů uteklo v příkladu ${lost[0].n} (${lost[0].t.toLowerCase()}, −${fmtPts(lost[0].max - lost[0].got)} b). Tam se vyplatí vrátit.`));
  if (spec.course === 'ma1') main.append(h('p', { class: 'muted small test-note' }, 'Appka hodnotí výsledek. Na papíře se za správný postup dávají i dílčí body, takže skutečný výsledek může být vyšší.'));
  const [againR, againL] = spec.again(v);
  main.append(h('div', { class: 'end-actions' },
    testWrong.length ? h('button', { class: 'btn btn-primary', onclick: () => go(spec.route + '/chyby') }, `Procvičit chybné (${testWrong.length})`) : null,
    h('button', { class: testWrong.length ? 'btn btn-ghost' : 'btn btn-primary', onclick: () => go(againR) }, againL),
    V.print ? h('button', { class: 'btn btn-ghost', onclick: () => go(V.print) }, 'PDF se zadáním a řešením') : null,
    h('button', { class: 'btn btn-ghost', onclick: () => go('#/') }, 'Domů')));
  main.append(h('h2', { class: 'section-title' }, 'Příklad po příkladu'));
  let lastPart = null;
  for (const it of items) {
    const full = it.got === it.q.pts;
    const mark = full ? ICONS.check : it.got > 0 ? ICONS.bulb : ICONS.close;
    const steps = it.card.steps || it.r?.steps;
    const body = h('div', { class: 'test-item-body' }, it.cur.el,
      it.r?.msg && !full ? h('div', { class: 'fb-msg', html: m(it.r.msg) }) : null,
      steps && steps.length ? h('details', { class: 'steps', open: !full || null }, h('summary', {}, 'Postup krok za krokem'), h('ol', { class: 'steps-list' }, steps.map(s => h('li', { html: m(s) })))) : null,
      it.q.link ? h('button', { class: 'btn btn-ghost btn-small', onclick: () => go(it.q.link.route) }, it.q.link.label) : null);
    const det = h('details', { class: 'test-item ' + (full ? 'full' : it.got > 0 ? 'part' : 'zero'), open: !full || null },
      h('summary', {}, h('span', { class: 'test-mark', html: mark }), h('b', {}, it.q.id), h('span', { class: 'test-topic' }, it.q.topic || ''),
        h('span', { class: 'test-got' }, it.skipped ? 'přeskočeno' : `${fmtPts(it.got)}/${it.q.pts} b`)),
      body);
    if (it.q.id[0] !== lastPart) { lastPart = it.q.id[0]; det.dataset.part = lastPart; }
    main.append(det);
  }
  app.replaceChildren(main);
  window.scrollTo(0, 0);
  haptic(pct >= 80 ? 'silver' : 'complete', { delay: 120 });
}

/** chybné úlohy z posledního testu, každá dvakrát s jinými čísly, se zpětnou vazbou a postupem */
function testPractice(spec) {
  if (!testWrong.length || testWrongSpec !== spec) return go(spec.route);
  const fs = shuffle(testWrong.flatMap(q => [q.redo, q.redo]));
  runLesson({
    factories: fs, title: 'Chyby z testu', back: spec.route, mode: 'lesson', pathId: null, cheat: spec.cheat(),
    onFinish: ({ time, acc, exercises, mistakes }) => {
      const res = store.finishLesson(spec.key('chyby'), { acc, time });
      endScreen({ title: 'Procvičeno!', sub: 'Typy příkladů, ve kterých utekly body', acc, time, exercises, mistakes, res, back: spec.route, backLabel: spec.word === 'test' ? 'Zpět na simulaci' : 'Zpět na zkoušku', again: spec.route + '/chyby' });
    },
  });
}

// ---------------- MA1: cvičná zápočtová zkouška (přehled, trénink, tisk)
// Přehled je stavěný pro studenta pod tlakem: nahoře jeden doporučený krok, pak generovaná písemka,
// pak „kde ztrácíš body“ (připravenost po typech příkladů) a nakonec písemky z minulých let jako mřížka.
const ZK = 'Cvičná zápočtová zkouška';
const INF_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 8.2c-2.1 0-3.7 1.7-3.7 3.8s1.6 3.8 3.7 3.8c3.3 0 6.3-7.6 9.6-7.6 2.1 0 3.7 1.7 3.7 3.8s-1.6 3.8-3.7 3.8c-3.3 0-6.3-7.6-9.6-7.6z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHEV = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const PDF_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l5 5v13H7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M14 3v5h5M10 13h6M10 17h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

// připravenost po typech příkladů: posledních pár výsledků (písemky i trénink), jen v tomhle zařízení
const PIS_KEEP = 8, PIS_AVG = 5;
function pisRecord(n, f) {
  const st = { ...(store.get().pisStats || {}) };
  st[n] = [...(st[n] || []), { d: Date.now(), f: Math.max(0, Math.min(1, f)) }].slice(-PIS_KEEP);
  store.set({ pisStats: st });
}
function pisMastery(n) {
  const a = (store.get().pisStats || {})[n] || [];
  if (!a.length) return null;
  const last = a.slice(-PIS_AVG);
  return Math.round(100 * last.reduce((s, x) => s + x.f, 0) / last.length);
}
/** po odevzdané písemce: body po typech příkladů do připravenosti */
function pisAfterExam(v, items) {
  if (MA1_SPEC.variant(v)?.practical) return;
  for (const it of items) if (/^[1-7]$/.test(it.q.id)) pisRecord(it.q.id, it.got / it.q.pts);
}
const pisRuns = () => ['N', ...EXAMS.map(e => e.id)].flatMap(k => specRuns(MA1_SPEC, k).map(r => ({ ...r, k })));
const SERIES = { n26: 'řada 2026', n25: 'řada 2025', old: 'starší zadání', prakt: '' };
const examLabel = k => (k === 'N' ? 'Generovaná písemka' : examById(k)?.practical ? 'Praktická část' : `Varianta ${examById(k)?.letter}${dupNo(examById(k)) ? dupNo(examById(k)) : ''} (${SERIES[examById(k)?.group] || ''})`);
const pct = (a, b) => Math.round(100 * a / b);

/** co má student udělat teď */
function pisNextStep() {
  const runs = pisRuns();
  const m = MA1_PARTS.map(([n, t]) => ({ n, t, v: pisMastery(n) }));
  if (!runs.length && m.every(x => x.v == null)) {
    return { title: 'Začni jednou písemkou nanečisto', text: 'Napiš generovanou písemku v appce. Na konci uvidíš body po příkladech a appka ti ukáže, co trénovat nejdřív. Klidně i s chybami, o to tu jde.', label: 'Napsat generovanou písemku', route: '#/pisemka/N' };
  }
  const untried = m.find(x => x.v == null);
  if (untried) return { title: `Vyzkoušej příklad ${untried.n}: ${untried.t.toLowerCase()}`, text: 'Tenhle typ ještě nemáš vyzkoušený. Krátký trénink, pár příkladů s kontrolou a postupem.', label: 'Trénovat', route: '#/pisemka/trenink/' + untried.n };
  const weak = m.filter(x => x.v < 80).sort((a, b) => a.v - b.v)[0];
  if (weak) return { title: `Nejvíc bodů utíká v příkladu ${weak.n}`, text: `${weak.t}: zatím ${weak.v} %. Pár kol tréninku a bude to sedět. Po každém příkladu uvidíš postup.`, label: `Trénovat příklad ${weak.n}`, route: '#/pisemka/trenink/' + weak.n };
  const fresh = EXAMS.find(e => !e.practical && !specRuns(MA1_SPEC, e.id).length);
  if (fresh) return { title: 'Všechny typy ti jdou. Teď celá písemka', text: `Napiš si skutečné zadání z minulých let (${examLabel(fresh.id)}) celé najednou, jako na zkoušce.`, label: 'Napsat písemku', route: '#/pisemka/' + fresh.id };
  return { title: 'Na zkoušku je hotovo', text: 'Všechny typy nad 80 % a všechny minulé písemky napsané. Formu udržíš jednou generovanou písemkou denně.', label: 'Generovaná písemka', route: '#/pisemka/N' };
}

function pisemkaHome() {
  ensureCourse('ma1');
  const main = h('main', { class: 'page zk' });
  const runs = pisRuns();
  const known = MA1_PARTS.map(([n]) => pisMastery(n)).filter(v => v != null);
  const ready = known.length ? Math.round(known.reduce((s, v) => s + v, 0) / known.length) : null;
  const last = runs.sort((a, b) => b.d - a.d)[0];

  // ---- hlavička
  main.append(h('section', { class: 'zk-hero' },
    h('div', { class: 'zk-hero-text' },
      h('small', {}, 'MA1 · NANEČISTO'),
      h('h1', {}, ZK),
      h('div', { class: 'zk-chips' }, h('span', {}, '7 příkladů'), h('span', {}, '70 bodů'), h('span', {}, '100 minut')),
      h('p', {}, last ? `Poslední pokus: ${fmtPts(last.correct)}/${last.total} bodů · ${fmtDate(last.d)}` : 'Nic se nikam nepočítá. Piš, chybuj, uč se z postupů.')),
    h('div', { class: 'zk-ring', style: `--p:${ready ?? 0}`, title: 'Připravenost: průměr posledních výsledků po typech příkladů' },
      h('span', {}, h('b', {}, ready == null ? '–' : `${ready} %`), h('small', {}, 'připravenost')))));

  // ---- doporučený krok
  const ns = pisNextStep();
  main.append(h('section', { class: 'zk-next' },
    h('div', { class: 'zk-next-label' }, 'TEĎ UDĚLEJ TOHLE'),
    h('b', {}, ns.title), h('p', {}, ns.text),
    h('button', { class: 'btn btn-primary', onclick: () => go(ns.route) }, ns.label)));

  // ---- generovaná písemka
  const bestN = bestRun(specRuns(MA1_SPEC, 'N'));
  main.append(h('section', { class: 'zk-gen' },
    h('div', { class: 'zk-gen-head' },
      h('span', { class: 'zk-gen-icon', html: INF_ICON }),
      h('span', {}, h('b', {}, 'Generovaná písemka'), h('small', {}, bestN ? `nejlépe ${fmtPts(bestN.correct)}/70 · napsáno ${specRuns(MA1_SPEC, 'N').length}×` : 'pokaždé jiné zadání'))),
    h('p', {}, 'Generuj do nekonečna: každá písemka je jiná, ale vždy má přesně ty typy příkladů, které chodí na zkoušku. Když si ji stáhneš jako PDF, za zadáním najdeš řešení s celými postupy.'),
    h('div', { class: 'zk-gen-btns' },
      h('button', { class: 'btn btn-primary', onclick: () => go('#/pisemka/N') }, 'Psát v appce'),
      h('button', { class: 'btn btn-ghost', onclick: () => go('#/pisemka/tisk/N'), html: PDF_ICON + '<span>PDF k vytištění</span>' }))));

  // ---- kde ztrácíš body
  main.append(h('h2', { class: 'section-title zk-h2' }, 'Kde ztrácíš body'),
    h('p', { class: 'muted small zk-sub' }, known.length ? 'Z posledních písemek a tréninků. Ťukni na příklad a natrénuj ho.' : 'Tady se ukáže, jak ti jdou jednotlivé příklady. Ťukni na kterýkoli a natrénuj ho.'),
    h('div', { class: 'zk-skills' }, MA1_PARTS.map(([n, t]) => {
      const v = pisMastery(n);
      const lvl = v == null ? 'none' : v >= 80 ? 'good' : v >= 50 ? 'mid' : 'low';
      return h('button', { class: `zk-skill zk-${lvl}`, type: 'button', onclick: () => go('#/pisemka/trenink/' + n) },
        h('span', { class: 'zk-num' }, n),
        h('span', { class: 'zk-skill-main' }, h('span', { class: 'zk-skill-t' }, t),
          h('span', { class: 'zk-bar' }, h('i', { style: `width:${v ?? 0}%` }))),
        h('span', { class: 'zk-skill-v' }, v == null ? 'trénovat' : `${v} %`),
        h('span', { class: 'zk-chev', html: CHEV }));
    })),
    h('button', { class: 'zk-theory', type: 'button', onclick: () => go('#/pisemka/trenink/teorie') },
      h('span', { class: 'zk-theory-n' }, String(BANK.length)),
      h('span', {}, h('b', {}, 'Všechna tvrzení z příkladu 7'), h('small', {}, 'Teorie, která se na zkoušce opakuje. Každé tvrzení s vysvětlením a protipříkladem.')),
      h('span', { class: 'zk-chev', html: CHEV })));

  // ---- písemky z minulých let
  main.append(h('h2', { class: 'section-title zk-h2' }, 'Písemky z minulých let'),
    h('p', { class: 'muted small zk-sub' }, `${EXAMS.length} skutečných zadání. Ťukni na variantu: napsat v appce, nebo PDF s řešením.`));
  for (const g of GROUPS) {
    const exs = EXAMS.filter(e => e.group === g.id);
    const doneN = exs.filter(e => specRuns(MA1_SPEC, e.id).length).length;
    main.append(h('section', { class: 'zk-year' },
      h('div', { class: 'zk-year-head' }, h('span', {}, h('b', {}, g.sub.replace(/ \(.*\)$/, '')), h('small', {}, g.title)), h('span', { class: 'zk-year-count' }, `${doneN}/${exs.length}`)),
      h('div', { class: 'zk-tiles' }, exs.map(e => {
        const best = bestRun(specRuns(MA1_SPEC, e.id));
        const p = best ? pct(best.correct, best.total) : null;
        return h('button', { class: 'zk-tile' + (best ? ' done' : ''), type: 'button', style: best ? `--p:${p}` : null, onclick: () => pisExamMenu(e, best) },
          h('span', { class: 'zk-tile-l', html: e.practical ? 'P' : e.letter + (dupNo(e) ? `<sup>${dupNo(e)}</sup>` : '') }),
          h('span', { class: 'zk-tile-s' }, best ? `${fmtPts(best.correct)}/${best.total}` : e.practical ? '5 příkladů' : 'nenapsáno'));
      }))));
  }

  // ---- jak se boduje + historie
  main.append(h('details', { class: 'zk-more' }, h('summary', {}, 'Jak se na zkoušce boduje'),
    h('ul', {},
      h('li', {}, '7 příkladů, každý nejvýš 10 bodů, celkem 70 bodů, čas 100 minut.'),
      h('li', { html: m('Příklad 7 (pravda / nepravda): $+2$ za správnou odpověď, $-2$ za špatnou, bez odpovědi $0$. Celkem nejméně $0$ a nejvýš $10$ bodů. Nejistou odpověď je lepší vynechat.') }),
      h('li', {}, 'Appka hodnotí výsledek. Na papíře se za správný postup dávají i dílčí body, takže skutečné body bývají vyšší.'),
      h('li', {}, 'Během psaní tu není nápověda ani kontrola, jako na zkoušce. Postupy ke všem příkladům uvidíš po odevzdání.'))));
  if (runs.length) {
    main.append(h('details', { class: 'zk-more' }, h('summary', {}, `Tvoje pokusy (${runs.length})`),
      histList(runs.sort((a, b) => b.d - a.d).slice(0, 12).map(r => ({ ...r, label: examLabel(r.k) })))));
  }
  app.replaceChildren(topbar('#/', ZK), main);
}

/** stejné písmeno vícekrát ve skupině (starší zadání: dvě A, dvě E) → pořadové číslo, jinak 0 */
function dupNo(e) {
  const same = EXAMS.filter(x => x.group === e.group && x.letter === e.letter);
  return same.length > 1 ? same.indexOf(e) + 1 : 0;
}
/** volba u písemky z minulých let */
function pisExamMenu(e, best) {
  const g = GROUPS.find(x => x.id === e.group);
  modal(e.practical ? 'Praktická část' : `Varianta ${e.letter}${dupNo(e) ? ` (${dupNo(e)}. zadání)` : ''}`,
    `${g.title}, ${g.sub.toLowerCase()}.${best ? `<br>Nejlépe: <b>${fmtPts(best.correct)}/${best.total}</b> bodů.` : ''}`,
    [{ label: 'Psát v appce', primary: true, fn: () => go('#/pisemka/' + e.id) },
      { label: 'PDF s řešením', fn: () => go('#/pisemka/tisk/' + e.id) },
      { label: 'Zavřít' }]);
}

function pisemkaTrain(n) {
  ensureCourse('ma1');
  const back = '#/pisemka';
  let factories, title;
  if (n === 'teorie') { factories = shuffle(allStatements()); title = 'Všechna tvrzení z písemek'; }
  else { const T = TRAIN[n]; if (!T) return go(back); factories = Array.from({ length: n === '7' ? 10 : 6 }, () => T.gen); title = `Trénink: ${T.title}`; }
  runLesson({
    factories, title, back, mode: 'lesson', pathId: null, cheat: MA1_SPEC.cheat(),
    onFinish: ({ time, acc, exercises, mistakes }) => {
      const res = store.finishLesson('ma1-trenink-' + n, { acc, time });
      if (TRAIN[n]) pisRecord(n, acc);
      const v = TRAIN[n] ? pisMastery(n) : null;
      endScreen({ title: 'Trénink hotový', sub: title, acc, time, exercises, mistakes, res, back, backLabel: 'Zpět na zkoušku', again: '#/pisemka/trenink/' + n, againLabel: 'Další kolo', againFirst: true,
        extra: v != null ? h('p', { class: 'zk-after' }, `Připravenost na příklad ${n}: `, h('b', {}, `${v} %`)) : null });
    },
  });
}

/** zadání + řešení s postupy k tisku / do PDF */
function pisemkaPrint(v) {
  ensureCourse('ma1');
  if (v === 'N') { location.replace('#/pisemka/tisk/N' + examSeed()); return; }
  const ex = ma1Exam(v);
  if (!ex) return go('#/pisemka');
  const sheets = h('div', { class: 'pz-sheets' });
  const fit = () => {   // náhled: list A4 zmenšený na šířku stránky (při tisku vždy 100 %)
    const w = sheets.clientWidth;
    sheets.querySelectorAll('.pz-sheet').forEach(s => { s.style.zoom = ''; s.style.zoom = String(Math.min(1, w / s.offsetWidth)); });
  };
  const draw = () => { sheets.replaceChildren(examSheet(ex, ex.problems), solutionSheet(ex, ex.problems, true)); requestAnimationFrame(fit); };
  const bar = h('section', { class: 'zk-print' },
    h('b', {}, ex.generated ? 'Generovaná písemka' : ex.title),
    h('p', { class: 'muted small' }, 'První strana je zadání jako na zkoušce, za ním řešení s celými postupy. V okně tisku zvol „Uložit jako PDF“ (na Androidu „Uložit do PDF“), měřítko 100 %.'),
    h('div', { class: 'zk-gen-btns' },
      h('button', { class: 'btn btn-primary', onclick: () => window.print(), html: PDF_ICON + '<span>Uložit PDF / vytisknout</span>' }),
      ex.generated ? h('button', { class: 'btn btn-ghost', onclick: () => go('#/pisemka/tisk/N'), html: INF_ICON + '<span>Vygenerovat jinou</span>' }) : null,
      h('button', { class: 'btn btn-ghost', onclick: () => go('#/pisemka/' + v) }, 'Napsat v appce')));
  const main = h('main', { class: 'page pz-screen' }, bar, sheets);
  app.replaceChildren(topbar('#/pisemka', ex.generated ? `Generovaná písemka č. ${ex.seed}` : ex.title), main);
  document.documentElement.classList.add('pz-printing');
  window.addEventListener('resize', fit);
  cleanup = () => { window.removeEventListener('resize', fit); document.documentElement.classList.remove('pz-printing'); };
  document.fonts?.load('16px "CMU Serif"').finally(draw) ?? draw();
}

function pisemkaRoute(parts) {
  const v = parts[1];
  if (!v) return pisemkaHome();
  if (v === 'tisk') return pisemkaPrint(parts[2] || 'N');
  if (v === 'trenink') return pisemkaTrain(parts[2]);
  if (v === 'N') { location.replace('#/pisemka/N' + examSeed()); return; }
  return examRun(MA1_SPEC, v);
}
function pisemkaCard() {
  const known = MA1_PARTS.map(([n]) => pisMastery(n)).filter(v => v != null);
  const ready = known.length ? Math.round(known.reduce((s, v) => s + v, 0) / known.length) : null;
  return h('button', { class: 'coll-card test-card', onclick: () => go('#/pisemka') },
    h('span', { class: 'test-card-icon', html: ICONS.trophy }),
    h('span', { class: 'path-text' }, h('b', {}, ZK), h('span', { class: 'muted' }, ready != null ? `Připravenost ${ready} % · generované písemky i ${EXAMS.length} zadání z minulých let` : `Generované písemky do nekonečna i ${EXAMS.length} zadání z minulých let`)),
    h('span', { class: 'go' }, 'Otevřít'));
}

// ------------------------------------------------------------ sbírka pohárků
function collectionScreen(focus) {
  ensureCourse(PATHS.find(p => p.id === focus)?.course);
  const paths = PATHS.filter(p => p.content && p.course === course());
  const all = paths.flatMap(pathTrophies);
  const c = countTiers(all);
  const main = h('main', { class: 'page collection' });
  main.append(h('section', { class: 'coll-hero' },
    h('div', { class: 'coll-hero-icon', html: trophySvg(3, 112) }),
    h('div', { class: 'coll-hero-text' },
      h('small', {}, `${COURSES[course()].title.toUpperCase()} · POSBÍREJ JE VŠECHNY!`),
      h('h1', {}, `${c.gold} z ${c.total} zlatých`),
      h('div', { class: 'bar' }, h('div', { class: 'bar-fill gold-fill', style: `width:${100 * c.gold / c.total}%` })),
      h('p', { class: 'muted small' }, `Celkem máš ${c.earned} z ${c.total} pohárků, zbývá získat ${c.total - c.earned}.`))));
  main.append(h('div', { class: 'tier-row' },
    [[3, c.gold, 'zlatých'], [2, c.silver, 'stříbrných'], [1, c.bronze, 'bronzových'], [0, c.total - c.earned, 'nezískaných']].map(([t, n, l]) =>
      h('div', { class: 'tier-card t' + t }, h('span', { html: trophySvg(t, 44) }), h('b', {}, String(n)), h('span', { class: 'muted small' }, l)))));
  main.append(h('details', { class: 'rules-box' }, h('summary', {}, 'Jak získat pohárky?'),
    h('ul', {}, h('li', { html: trophySvg(1, 24) + '<span><b>Bronz</b>: dokonči lekci.</span>' }),
      h('li', { html: trophySvg(2, 24) + '<span><b>Stříbro</b>: nejvýš 1 chyba (v lekcích s 12 a více příklady nejvýš 2).</span>' }),
      h('li', { html: trophySvg(3, 24) + '<span><b>Zlato</b>: celá lekce bez jediné chyby.</span>' })),
    h('p', { class: 'muted small' }, 'Chyba je špatná odpověď, „Nevím“ i příklad vyřešený s nápovědou. Počítají se i chyby v opakováních na konci lekce: příklad, ve kterém chybuješ, se vrací s jinými čísly, dokud ho nevyřešíš (nejvýš 4×).'),
    h('p', { class: 'muted small' }, 'Lekci můžeš opakovat kolikrát chceš, počítá se nejlepší pokus. Pohárek se nikdy nezhorší.')));
  let target = null;
  for (const p of paths) {
    const items = pathTrophies(p);
    const pc = countTiers(items);
    const grid = h('div', { class: 'trophy-grid' }, items.map(t => h('button', {
      class: 'tcell t' + t.tier, type: 'button', title: `${t.title}: ${TIER_LABEL[t.tier]}`,
      onclick: () => (t.fluency ? go('#/cesta/' + p.id) : go('#/lekce/' + t.id)),
    }, h('span', { class: 'tcell-icon', html: trophySvg(t.tier, 52) }), h('span', { class: 'tcell-name' }, t.title))));
    const sec = h('section', { class: 'coll-path', id: 'p-' + p.id },
      h('div', { class: 'coll-path-head' },
        h('h2', {}, p.title),
        h('span', { class: 'coll-path-count' }, h('span', { html: trophySvg(3, 18) + pc.gold }), h('span', { html: trophySvg(2, 18) + pc.silver }), h('span', { html: trophySvg(1, 18) + pc.bronze }), h('span', { class: 'muted' }, `/ ${pc.total}`))),
      h('div', { class: 'bar thin' }, h('div', { class: 'bar-fill gold-fill', style: `width:${100 * pc.gold / pc.total}%` })),
      grid);
    if (focus === p.id) target = sec;
    main.append(sec);
  }
  app.replaceChildren(topbar('#/', `Sbírka pohárků · ${COURSES[course()].short}`), main);
  if (target) setTimeout(() => target.scrollIntoView({ block: 'start', behavior: 'smooth' }), 60);
}

// ------------------------------------------------------------ instalace jako aplikace (PWA)
let installPrompt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; document.querySelectorAll('.install-slot').forEach(s => s.replaceChildren(installButton())); });
window.addEventListener('appinstalled', () => { installPrompt = null; document.querySelectorAll('.install-slot').forEach(s => s.replaceChildren()); });
const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone;
function installButton() {
  if (!installPrompt || isStandalone()) return h('span');
  return h('button', { class: 'btn btn-ghost install-btn', onclick: async () => { installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; route(); }, html: ICONS.download + '<span>Nainstalovat jako aplikaci</span>' });
}
// ------------------------------------------------------------ mobil v režimu „Verze pro počítač“
// Chrome pak ignoruje viewport a vykreslí stránku na šířku počítače (~980 px) zmenšenou na displej.
// Nainstalovaná aplikace tu volbu dědí z Chromu a sama ji vypnout nejde → poradíme jak.
function desktopModeOnPhone() {
  const touch = navigator.maxTouchPoints > 0 || window.matchMedia?.('(pointer: coarse)').matches;
  if (!touch) return false;
  const vv = window.visualViewport;
  const zoomedOut = !!vv && vv.scale < 0.75 && window.innerWidth >= 900;
  const wideLayout = screen.width > 0 && screen.width < 700 && document.documentElement.clientWidth > screen.width * 1.3;
  return zoomedOut || wideLayout;
}
function desktopModeHint() {
  if (document.querySelector('.desktop-hint') || !desktopModeOnPhone()) return;
  // stránka je zmenšená na displej → písmo zvětšit stejným poměrem, ať je čitelné
  const zoom = Math.max(1 / Math.min(1, window.visualViewport?.scale || 1), screen.width > 0 ? document.documentElement.clientWidth / screen.width : 1);
  const how = isStandalone()
    ? 'Otevři Chrome → ⋮ → Nastavení → Nastavení webu → Verze pro počítač a vypni ji. Pak aplikaci zavři a otevři znovu.'
    : 'V menu Chromu ⋮ odškrtni „Verze pro počítač“.';
  const bar = h('div', { class: 'desktop-hint', role: 'alert', style: `font-size:${Math.round(16 * Math.min(zoom, 3.5))}px` },
    h('div', {}, h('b', {}, 'Aplikace běží v režimu pro počítač.'), ' ', how),
    h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Zavřít', onclick: () => bar.remove(), html: ICONS.close }));
  document.body.prepend(bar);
}
if (document.readyState === 'complete') desktopModeHint(); else window.addEventListener('load', desktopModeHint);

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

// ------------------------------------------------------------ nastavení
function settingsScreen() {
  const st = store.get();
  const fileIn = h('input', { type: 'file', accept: 'application/json', class: 'hidden', onchange: async e => {
    const f = e.target.files[0]; if (!f) return;
    try { store.import(await f.text()); toast('Pokrok nahrán.'); settingsScreen(); } catch { toast('Tenhle soubor neumím přečíst.'); }
  } });
  const main = h('main', { class: 'page settings' },
    h('h1', {}, 'Nastavení'),
    syncBlock(),
    h('label', { class: 'setting' },
      h('input', { type: 'checkbox', checked: st.unlockAll || null, onchange: e => store.set({ unlockAll: e.target.checked }) }),
      h('span', {}, h('b', {}, 'Odemknout všechny lekce'), h('span', { class: 'muted small' }, 'Pro ty, kdo už něco umí a chtějí přeskakovat.'))),
    h('label', { class: 'setting' },
      h('input', { type: 'checkbox', checked: st.wallpaper !== false || null, onchange: e => { store.set({ wallpaper: e.target.checked }); document.documentElement.dataset.wall = e.target.checked ? 'on' : 'off'; } }),
      h('span', {}, h('b', {}, 'Tapeta na pozadí'), h('span', { class: 'muted small' }, 'Symboly předmětu, které pomalu plují po hlavních stránkách. V lekcích a testu nikdy.'))),
    h('label', { class: 'setting' },
      h('input', { type: 'checkbox', checked: st.pocketManual || null, onchange: e => store.set({ pocketManual: e.target.checked }) }),
      h('span', {}, h('b', {}, 'Z hlavy: nepokračovat samo'), h('span', { class: 'muted small' }, 'Po správné odpovědi počká na tlačítko Pokračovat a ukáže vysvětlení.'))),
    h('label', { class: 'setting' + (hx.support ? '' : ' setting-off') },
      h('input', { type: 'checkbox', 'data-hx': 'own', checked: (hx.support && st.haptics !== false) || null, disabled: !hx.support || null, onchange: e => {
        store.set({ haptics: e.target.checked });
        if (e.target.checked) hx.haptic('success');
      } }),
      h('span', {}, h('b', {}, 'Haptika'), h('span', { class: 'muted small' },
        hx.support === 'full' ? 'Jemné vibrace při ťukání, odpovědích a animacích.'
          : hx.support === 'ticks' ? 'Jemná cvaknutí při ťukání a odpovědích. Na iPhonu to jde od iOS 18, plné vibrace Safari nepovoluje.'
            : 'Tohle zařízení vibrace nepodporuje. Haptiku poznáš v telefonu.'))),
    h('div', { class: 'setting-block' },
      h('b', {}, sync.configured ? 'Záloha do souboru' : 'Přenést pokrok na jiné zařízení'),
      h('p', { class: 'muted small' }, sync.configured ? 'Bez účtu: stáhni si pokrok do souboru a na druhém zařízení ho nahraj.' : 'Pokrok se ukládá jen v tomhle prohlížeči. Stáhni si ho do souboru a na druhém zařízení ho nahraj.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn btn-ghost', onclick: () => {
          const a = h('a', { href: URL.createObjectURL(new Blob([store.export()], { type: 'application/json' })), download: 'ma1-pokrok.json' });
          a.click();
        } }, 'Stáhnout pokrok'),
        h('button', { class: 'btn btn-ghost', onclick: () => fileIn.click() }, 'Nahrát pokrok'), fileIn)),
    h('div', { class: 'setting-block' },
      h('b', {}, 'Aplikace v telefonu'),
      h('p', { class: 'muted small', html: isStandalone() ? 'Už běžíš jako nainstalovaná aplikace.' : 'V Chromu na Androidu: tlačítko níž, nebo menu ⋮ → <b>Přidat na plochu / Nainstalovat aplikaci</b>. Na iPhonu v Safari: Sdílet → <b>Přidat na plochu</b>. Pak to funguje i offline.' }),
      h('div', { class: 'install-slot' }, installButton())),
    h('div', { class: 'setting-block' },
      h('button', { class: 'btn btn-ghost danger', onclick: () => modal('Smazat všechen pokrok?', sync.isLoggedIn() ? 'Tohle nejde vrátit. Pokrok se smaže i na ostatních přihlášených zařízeních.' : 'Tohle nejde vrátit.', [{ label: 'Nechat být', primary: true }, { label: 'Smazat', fn: () => { store.reset(); go('#/'); } }]) }, 'Začít úplně od začátku')));
  app.replaceChildren(topbar('#/', 'Nastavení', h('span')), main);
}

// ------------------------------------------------------------ router
function route() {
  if (cleanup) { cleanup(); cleanup = null; }
  hx.hapticCancelScheduled();   // naplánovaná haptika patří obrazovce, ze které se odchází
  document.querySelectorAll('.modal-back,.toast').forEach(x => x.remove());
  document.querySelector('.course-menu')?._close();
  const hash = location.hash.replace(/\?.*$/, '') || '#/';
  const parts = hash.slice(2).split('/');
  // tapeta jen na hlavních stránkách (domů, cesta, sbírka, výběr testu, nastavení), nikdy v lekci ani v testu
  const calm = ['', 'cesta', 'sbirka', 'nastaveni'].includes(parts[0]) || ((parts[0] === 'test' || parts[0] === 'pisemka') && !parts[1]);
  document.documentElement.dataset.wall = calm && store.get().wallpaper !== false ? 'on' : 'off';
  setWallpaper(course());
  window.scrollTo(0, 0);
  switch (parts[0]) {
    case 'cesta': pathScreen(parts[1]); break;
    case 'lekce': lessonScreen(parts[1]); break;
    case 'procvic': practiceScreen(parts[1]); break;
    case 'plynulost': fluencyScreen(parts[1]); break;
    case 'zhlavy': pocketScreen(parts[1], parts[2]); break;
    case 'nastaveni': settingsScreen(); break;
    case 'sbirka': collectionScreen(parts[1]); break;
    case 'test': parts[1] ? examRun(ZM_SPEC, parts[1]) : testHome(); break;
    case 'pisemka': pisemkaRoute(parts); break;
    default: homeScreen();
  }
  // odchod z obrazovky s pohárkem po první lekci (kamkoli) → nabídka přihlášení
  if (offerAfterEnd) { offerAfterEnd = false; if (canOfferSync()) setTimeout(syncOffer, 300); }
}
window.addEventListener('hashchange', route);
route();

// synchronizace: obnoví uložené přihlášení / dokončí návrat z Googlu, nepřihlášeným nabídne přihlášení
sync.init().then(res => {
  if (res.error) toast(res.error === 'cancelled' ? 'Přihlášení zrušeno.' : 'Přihlášení se nepovedlo. Zkus to znovu v Nastavení.');
  else if (res.signedIn) { if (!inLesson()) route(); toast('Přihlášeno. Pokrok se teď synchronizuje.'); }
  else if (canOfferSync() && !inLesson()) setTimeout(syncOffer, 500);
});

// exporty pro ladění v konzoli
window.__ma1 = Object.assign(window.__ma1 || {}, { GEN, asChoice, store, desktopModeHint });
