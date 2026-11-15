import { h, m, pick, shuffle, PRAISE, SOFT, ICONS } from './ui.js';
import { renderCard } from './cards.js';
import { store } from './store.js';
import * as sync from './sync.js';
import { trophySvg, tierFromAcc, nextGoal, TIER_NAME, TIER_LABEL } from './trophy.js';
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

const GEN = { ...GEN0, ...GONIO_GEN };

const PATHS = [
  { id: 'defobor', title: 'Definiční obory', tagline: 'Kam smíš dosadit a kam ne', content: DEFOBOR, gen: GEN },
  { id: 'derivace', title: 'Derivace', tagline: 'Od tabulky po složené funkce', content: DERIVACE, gen: DGEN },
  { id: 'limity', title: 'Limity posloupností a funkcí', tagline: 'Kam to celé míří', content: LIMITY, gen: LGEN },
  { id: 'prubeh', title: 'Průběh funkce + Taylor', tagline: 'Z rovnice obrázek', content: PRUBEH, gen: PGEN },
  { id: 'integraly', title: 'Neurčité integrály', tagline: 'Derivace pozpátku', content: INTEGRALY, gen: IGEN },
];

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
const lessonTier = id => { const r = store.get().done[id]; return r ? tierFromAcc(r.acc) : 0; };
function fluencyTier(pid) {
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
const trophyCounts = () => countTiers(PATHS.filter(p => p.content).flatMap(pathTrophies));

// ------------------------------------------------------------ světlý / tmavý režim
const systemDark = () => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const isDark = () => (store.get().theme || (systemDark() ? 'dark' : 'light')) === 'dark';
// barvy systémových lišt = barva pozadí (--bg) světlého / tmavého motivu
const BAR_COLOR = { light: '#f6f5f1', dark: '#1b1b19' };
function applyTheme() {
  const t = store.get().theme;
  if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
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
    back ? h('button', { class: 'icon-btn', 'aria-label': 'Zpět', onclick: () => go(back), html: ICONS.back }) : h('div', { class: 'brand', 'aria-label': 'Přežij MA1' }, h('span', { class: 'brand-name' }, 'Přežij'), h('img', { class: 'brand-logo', src: 'icons/icon.svg', alt: 'MA1', width: 40, height: 40 })),
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
/** nabídka po spuštění pro nepřihlášené */
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
      h('button', { class: 'btn btn-ghost', type: 'button', onclick: close }, 'Teď ne')),
    h('button', { class: 'link-btn muted small', type: 'button', onclick: () => { store.set({ syncNoAsk: true }); close(); toast('Dobře. Přihlásit se jde kdykoli v Nastavení.'); } }, 'Už se neptat')));
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
const inLesson = () => /^#\/(lekce|procvic|plynulost)\//.test(location.hash);
// přišel pokrok z jiného zařízení → překreslit (ale nikdy uprostřed lekce)
sync.onData(() => { if (!inLesson() && !document.querySelector('.modal-back')) route(); });

function modal(title, body, actions) {
  if (document.querySelector('.modal-back')) return;   // už jeden otevřený je (opakovaný Esc)
  const back = h('div', { class: 'modal-back' });
  const close = () => back.remove();
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
  if (!st.seenWelcome) {
    main.append(h('section', { class: 'welcome' },
      h('h1', {}, 'Přežij MA1'),
      h('p', {}, 'Definiční obory, limity, derivace, průběh funkce a integrály, od úplných základů až po příklady jako na testu.'),
      h('p', {}, 'Tohle není sbírka úloh, kterou se naučíš nazpaměť. Každý příklad se generuje náhodně, takže pořád dostáváš nová čísla.'),
      h('ul', { class: 'promise' },
        h('li', {}, 'Napíšeš výsledek a appka ho hned zkontroluje.'),
        h('li', {}, 'Tlačítko „Nevím“ ukáže celý postup krok za krokem.'),
        h('li', {}, 'Co pokazíš, dostaneš na konci znovu, s jinými čísly.'),
        h('li', {}, 'Funguje to i offline a pokrok máš v mobilu i na počítači.')),
      h('button', { class: 'btn btn-primary', onclick: () => { store.set({ seenWelcome: true }); go('#/cesta/defobor'); } }, 'Začít')));
  }
  main.append(h('h2', { class: 'section-title' }, 'Tvoje cesty'));
  const grid = h('div', { class: 'path-grid' });
  PATHS.forEach((p, i) => {
    if (p.content) {
      const ls = lessonsOf(p.content);
      const done = ls.filter(l => store.isDone(l.id)).length;
      const pct = Math.round(100 * done / ls.length);
      grid.append(h('button', { class: 'path-card', onclick: () => go('#/cesta/' + p.id) },
        h('span', { class: 'path-num' }, String(i + 1)),
        h('span', { class: 'path-text' }, h('b', {}, p.title), h('span', { class: 'muted' }, p.tagline)),
        h('span', { class: 'ring', style: `--p:${pct}` }, h('span', {}, pct + ' %'))));
    } else {
      grid.append(h('div', { class: 'path-card soon' },
        h('span', { class: 'path-num' }, String(i + 1)),
        h('span', { class: 'path-text' }, h('b', {}, p.title), h('span', { class: 'muted' }, p.tagline)),
        h('span', { class: 'soon-tag' }, 'připravujeme')));
    }
  });
  main.append(grid);
  const tc = trophyCounts();
  main.append(h('button', { class: 'coll-card', onclick: () => go('#/sbirka') },
    h('span', { class: 'coll-card-icon', html: trophySvg(3, 56) }),
    h('span', { class: 'path-text' }, h('b', {}, 'Sbírka pohárků'), h('span', { class: 'muted' }, `${tc.gold} z ${tc.total} zlatých · celkem ${tc.earned} pohárků`)),
    h('span', { class: 'coll-card-mini', html: `${trophySvg(3, 20)}${tc.gold} ${trophySvg(2, 20)}${tc.silver} ${trophySvg(1, 20)}${tc.bronze}` })));
  main.append(h('div', { class: 'install-slot home-install' }, installButton()));
  main.append(h('p', { class: 'footnote muted small', html: 'Videa: <a href="https://homel.vsb.cz/~vod03/vyuka/VIDEA/MA1-videa/" target="_blank" rel="noopener">MA1 videa (VŠB-TUO)</a>. ' + (sync.isLoggedIn() ? 'Pokrok se synchronizuje přes tvůj účet Google.' : 'Pokrok se ukládá v tomhle prohlížeči.') }));
  app.replaceChildren(topbar(null, null), main);
}

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
    h('button', { class: 'btn btn-ghost btn-small', onclick: () => go('#/procvic/' + p.id), html: ICONS.dumbbell + '<span>Procvičit slabá místa</span>' })));

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
        ? `${TIER_LABEL[tier]} · ${Math.round((rec?.acc ?? 1) * 100)} % napoprvé${l.drill && rec?.lastAvg ? ` · ${fmtTime(rec.lastAvg)}/příklad` : ''}`
        : `≈ ${est.min} min · ${est.ex} ${est.ex === 1 ? 'úloha' : est.ex < 5 ? 'úlohy' : 'úloh'}`;
      const tag = l.drill ? h('span', { class: 'tag tag-drill' }, 'DRIL') : l.boss ? h('span', { class: 'tag tag-boss' }, 'SÉRIE') : null;
      const item = h('button', {
        class: `item item-${st}${l.boss ? ' item-boss' : ''}${isDone ? ' tier-' + tier : ''}`, type: 'button',
        onclick: () => (open ? go('#/lekce/' + l.id) : toast('Tahle lekce se odemkne po té předchozí.')),
      },
        h('span', { class: 'tile', html: icon }),
        h('span', { class: 'meta' }, h('b', {}, l.title), h('span', {}, meta)),
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

/** resumeKey + pool: když jsou zadané, lekce se dá po obnovení stránky dokončit */
function runLesson({ factories, title, back, mode = 'lesson', onFinish, pathId, cheat, resumeKey, pool }) {
  // slabá místa se ukládají zvlášť pro každou cestu (klíče jako t1 nebo tableTyped jsou ve více cestách)
  const weakKey = k => (k && pathId ? `${pathId}/${k}` : k);
  const resumed = loadLessonSave(resumeKey, pool);
  if (!resumed) clearLessonSave();
  const queue = resumed ? resumed.queue : factories.map(f => ({ f, tries: 0, seed: newSeed() }));
  let idx = resumed?.pos ?? 0, firstOk = resumed?.firstOk ?? 0, exercises = resumed?.exercises ?? 0;
  let t0 = performance.now() - (resumed?.elapsed ?? 0) * 1000, cardT0 = 0;
  let cur = null, phase = 'answer', cardData = null, attemptLog = resumed?.attemptLog ?? [], row = resumed?.row ?? 0, bestRow = resumed?.bestRow ?? 0, autoT = null;
  const drill = mode === 'drill';
  // tahák si v rámci lekce pamatuje rozbalené sekce a místo, kde byl odscrollovaný (i přes obnovení stránky)
  const sheetState = resumed?.sheet && Array.isArray(resumed.sheet.open) ? resumed.sheet : { open: [0], scroll: 0 };
  function saveProgress(pos) {
    if (!resumeKey || !pool) return;
    try {
      localStorage.setItem(LESSON_KEY, JSON.stringify({
        key: resumeKey, n: pool.length, at: Date.now(), pos,
        queue: queue.map(q => [pool.indexOf(q.f), q.tries, q.hinted ? 1 : 0, q.seed]),
        firstOk, exercises, row, bestRow, attemptLog: attemptLog.slice(-300), elapsed: (performance.now() - t0) / 1000,
        sheet: sheetState,
      }));
    } catch { /* plné úložiště / soukromé okno: lekce jede dál, jen bez zálohy */ }
  }

  const bar = h('div', { class: 'bar-fill' });
  const closeBtn = h('button', { class: 'icon-btn', 'aria-label': 'Ukončit lekci', html: ICONS.close, onclick: () => askClose() });
  const rowPill = h('span', { class: 'row-pill' });
  const stage = h('div', { class: 'stage' });
  const foot = h('footer', { class: 'lesson-foot' });
  // tahák je k dispozici v lekcích, drilech i procvičování; ve zkoušce plynulosti ne (tam se měří, co už umíš)
  const cheatBtn = cheat && mode !== 'fluency'
    ? h('button', { class: 'cheat-btn', type: 'button', title: 'Tahák: vzorce a pravidla', 'aria-label': 'Otevřít tahák', onclick: () => openSheet('Tahák', cheat, sheetState), html: ICONS.book + '<span>Tahák</span>' }) : null;
  const screen = h('div', { class: 'lesson' }, h('div', { class: 'lesson-top' }, closeBtn, h('div', { class: 'bar lesson-bar' }, bar), drill ? rowPill : null, cheatBtn), stage, foot);
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
    const item = queue[idx];
    item.seed ??= newSeed();
    cardData = seeded(item.seed, () => item.f());
    (window.__ma1 ||= {}).card = cardData;
    cur = seeded(item.seed ^ 0x9E3779B9, () => renderCard(cardData));   // i pořadí možností zůstane stejné
    phase = 'answer';
    cardT0 = performance.now();
    stage.replaceChildren(cur.el);
    stage.scrollTop = 0;
    cur.el.classList.add('enter');
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
    cur.el.append(h('div', { class: 'hint', html: ICONS.bulb + `<span>${m(cardData.hint)}</span>` }));
  }
  const item = () => queue[idx];

  function requeue() {
    const it = item();
    if (mode !== 'fluency' && it.tries < 2) queue.push({ f: it.f, tries: it.tries + 1, seed: newSeed() });   // podobný příklad, jiná čísla
  }

  function check() {
    if (phase !== 'answer') return;
    const r = cur.check();
    if (r.invalid) return toast(r.invalid);
    if (r.stepDone) return;              // řešení po krocích: jen se otevřel další krok
    const dt = (performance.now() - cardT0) / 1000;
    const it = item();
    store.record(weakKey(cardData.key), r.ok, dt);
    attemptLog.push({ ok: r.ok, t: dt });
    if (r.ok && it.tries === 0 && !it.hinted) firstOk++;
    if (!r.ok) requeue();
    if (drill) { row = r.ok ? row + 1 : 0; bestRow = Math.max(bestRow, row); setRow(); }
    feedback(r.ok, r);
    if (drill && r.ok) autoT = setTimeout(next, 900);   // dril: správně → rovnou další příklad
  }
  function dontKnow() {
    if (phase !== 'answer') return;
    const r = cur.reveal();
    if (r.stepDone) return;
    if (drill) { row = 0; setRow(); }
    store.record(weakKey(cardData.key), false, (performance.now() - cardT0) / 1000);
    attemptLog.push({ ok: false, t: 0 });
    requeue();
    feedback(false, { ...r, dontKnow: true });
  }

  function feedback(ok, r) {
    phase = 'feedback';
    saveProgress(idx + 1);   // odpověď už je započtená → po obnovení se pokračuje další úlohou
    const parts = [];
    const title = r.dontKnow ? 'V pohodě, tady je postup:' : ok ? pick(PRAISE) : pick(SOFT);
    if (r.msg) parts.push(h('div', { class: 'fb-msg', html: m(r.msg) }));
    const steps = r.steps || null;
    if (steps && steps.length) parts.push(stepsBox(steps, true));
    else if (r.stepsOptional && r.stepsOptional.length) parts.push(stepsBox(r.stepsOptional, false));
    if (!ok && mode !== 'fluency' && item().tries < 2) parts.push(h('p', { class: 'fb-note' }, 'Podobný příklad dostaneš ještě jednou na konci lekce.'));
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

  function next() { clearTimeout(autoT); if (phase !== 'feedback' && !cur.passive) return; idx++; show(); }

  function finish() {
    clearLessonSave();
    const time = (performance.now() - t0) / 1000;
    const acc = exercises ? firstOk / exercises : 1;
    const solved = attemptLog.filter(a => a.ok);
    const avg = solved.length ? solved.reduce((s, a) => s + a.t, 0) / solved.length : null;
    onFinish({ time, acc, firstOk, exercises, attemptLog, avg, bestRow });
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
  cleanup = () => { clearTimeout(autoT); document.removeEventListener('keydown', onKey); };
  show();
  if (resumed && resumed.pos > 0 && idx < queue.length) toast('Pokračuješ tam, kde lekce skončila.');
}

function lessonScreen(id) {
  const f = findLesson(id);
  if (!f) return go('#/');
  const { path, lesson, index, all } = f;
  if (!unlocked(all, index)) return go('#/cesta/' + path.id);
  const back = '#/cesta/' + path.id;
  runLesson({
    factories: lesson.cards, title: lesson.title, back, mode: lesson.drill ? 'drill' : 'lesson', pathId: path.id, cheat: path.content.cheat,
    resumeKey: 'lekce/' + id, pool: lesson.cards,
    onFinish: ({ time, acc, firstOk, exercises, avg, bestRow }) => {
      const prev = store.get().done[id];
      const tierBefore = lessonTier(id);
      const res = store.finishLesson(id, { acc, time, avg });
      const trophy = { before: tierBefore, now: lessonTier(id), got: tierFromAcc(acc) };
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
      endScreen({ title: lesson.drill ? 'Dril hotový!' : 'Lekce hotová!', sub: lesson.title, acc, time, exercises, res, back, again: '#/lekce/' + id, nextId: all[index + 1]?.id, extra, trophy });
    },
  });
}

function endScreen({ title, sub, acc, time, exercises, res, back, again, nextId, extra, trophy }) {
  const pct = Math.round(acc * 100);
  const msg = !exercises ? 'Teorie je v hlavě. Příště už počítáme.'
    : pct >= 90 ? 'Šlape ti to! Tohle už máš v ruce.'
      : pct >= 60 ? 'Dobrá práce. Chyby jsou přesně to, z čeho se mozek učí nejvíc.'
        : 'Tohle bylo těžší, a stejně je to hotové. Zkus lekci zítra znovu a uvidíš ten rozdíl.';
  let tBox = null;
  if (trophy) {
    const { before, now, got } = trophy;
    const head = now > before ? (before ? `Vylepšeno na ${TIER_NAME[now]}!` : `Nový pohárek: ${TIER_NAME[now]}!`)
      : got < now ? `Tvůj pohárek zůstává: ${TIER_NAME[now]}` : `Pohárek: ${TIER_NAME[now]}`;
    tBox = h('div', { class: 'end-trophy' + (now > before ? ' new' : '') },
      h('div', { class: 'end-trophy-icon', html: trophySvg(now, 128) }),
      h('b', {}, head),
      h('span', { class: 'muted small' }, nextGoal(now)));
  }
  const main = h('main', { class: 'page end' },
    tBox || h('div', { class: 'end-burst', html: ICONS.star }),
    h('h1', {}, title), h('p', { class: 'muted' }, sub),
    h('div', { class: 'metric-row' },
      exercises ? h('div', { class: 'metric' }, h('span', { class: 'muted small' }, 'Napoprvé'), h('b', {}, pct + ' %')) : null,
      h('div', { class: 'metric' }, h('span', { class: 'muted small' }, 'Čas'), h('b', {}, fmtTime(time)))),
    res && res.streakUp ? h('p', { class: 'streak-msg', html: ICONS.flame + `<span>Série: ${res.streak} ${res.streak === 1 ? 'den' : res.streak < 5 ? 'dny' : 'dní'}</span>` }) : null,
    extra || null,
    h('p', { class: 'end-msg' }, msg),
    h('div', { class: 'end-actions' },
      nextId ? h('button', { class: 'btn btn-primary', onclick: () => go('#/lekce/' + nextId) }, 'Další lekce') : null,
      h('button', { class: nextId ? 'btn btn-ghost' : 'btn btn-primary', onclick: () => go(back) }, 'Zpět na cestu'),
      again ? h('button', { class: 'btn btn-ghost', onclick: () => { if (location.hash === again) route(); else go(again); } }, 'Zopakovat') : null));
  app.replaceChildren(main);
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
    onFinish: ({ time, acc, firstOk, exercises }) => {
      const res = store.finishLesson('practice-' + p.id, { acc, time });
      endScreen({ title: 'Procvičeno!', sub: weak.length ? 'Zaměřeno na tvoje slabší místa' : 'Mix ze všeho', acc, time, exercises, res, back, again: '#/procvic/' + p.id });
    },
  });
}

function fluencyScreen(pathId) {
  const p = PATHS.find(x => x.id === pathId);
  if (!p?.content) return go('#/');
  const fl = p.content.fluency;
  const fs = shuffle(fl.pool).slice(0, fl.count);
  const back = '#/cesta/' + p.id;
  runLesson({
    factories: fs, title: fl.title, back, mode: 'fluency', pathId: p.id,
    resumeKey: 'plynulost/' + p.id, pool: fl.pool,
    onFinish: ({ time, acc, firstOk, exercises }) => {
      const hist = store.get().fluency.filter(f => f.path === p.id);
      const tierBefore = fluencyTier(p.id);
      const entry = { path: p.id, d: Date.now(), time: Math.round(time), correct: firstOk, total: exercises };
      store.addFluency(entry);
      const res = store.finishLesson('fluency-' + p.id, { acc, time });
      const trophy = { before: tierBefore, now: fluencyTier(p.id), got: tierFromAcc(exercises ? firstOk / exercises : 0) };
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
      endScreen({ title: 'Zkouška plynulosti hotová', sub: `${firstOk} z ${exercises} správně napoprvé`, acc, time, exercises, res, back, again: '#/plynulost/' + p.id, extra, trophy });
    },
  });
}

// ------------------------------------------------------------ sbírka pohárků
function collectionScreen(focus) {
  const paths = PATHS.filter(p => p.content);
  const all = paths.flatMap(pathTrophies);
  const c = countTiers(all);
  const main = h('main', { class: 'page collection' });
  main.append(h('section', { class: 'coll-hero' },
    h('div', { class: 'coll-hero-icon', html: trophySvg(3, 112) }),
    h('div', { class: 'coll-hero-text' },
      h('small', {}, 'POSBÍREJ JE VŠECHNY!'),
      h('h1', {}, `${c.gold} z ${c.total} zlatých`),
      h('div', { class: 'bar' }, h('div', { class: 'bar-fill gold-fill', style: `width:${100 * c.gold / c.total}%` })),
      h('p', { class: 'muted small' }, `Celkem máš ${c.earned} z ${c.total} pohárků, zbývá získat ${c.total - c.earned}.`))));
  main.append(h('div', { class: 'tier-row' },
    [[3, c.gold, 'zlatých'], [2, c.silver, 'stříbrných'], [1, c.bronze, 'bronzových'], [0, c.total - c.earned, 'nezískaných']].map(([t, n, l]) =>
      h('div', { class: 'tier-card t' + t }, h('span', { html: trophySvg(t, 44) }), h('b', {}, String(n)), h('span', { class: 'muted small' }, l)))));
  main.append(h('details', { class: 'rules-box' }, h('summary', {}, 'Jak získat pohárky?'),
    h('ul', {}, h('li', { html: trophySvg(1, 24) + '<span><b>Bronz</b>: dokonči lekci.</span>' }),
      h('li', { html: trophySvg(2, 24) + '<span><b>Stříbro</b>: aspoň 80 % úloh správně napoprvé.</span>' }),
      h('li', { html: trophySvg(3, 24) + '<span><b>Zlato</b>: všechno správně napoprvé, bez nápovědy a bez „Nevím“.</span>' })),
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
  app.replaceChildren(topbar('#/', 'Sbírka pohárků'), main);
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
  document.querySelectorAll('.modal-back,.toast').forEach(x => x.remove());
  const hash = location.hash.replace(/\?.*$/, '') || '#/';
  const parts = hash.slice(2).split('/');
  window.scrollTo(0, 0);
  switch (parts[0]) {
    case 'cesta': return pathScreen(parts[1]);
    case 'lekce': return lessonScreen(parts[1]);
    case 'procvic': return practiceScreen(parts[1]);
    case 'plynulost': return fluencyScreen(parts[1]);
    case 'nastaveni': return settingsScreen();
    case 'sbirka': return collectionScreen(parts[1]);
    default: return homeScreen();
  }
}
window.addEventListener('hashchange', route);
route();

// synchronizace: obnoví uložené přihlášení / dokončí návrat z Googlu, nepřihlášeným nabídne přihlášení
sync.init().then(res => {
  if (res.error) toast(res.error === 'cancelled' ? 'Přihlášení zrušeno.' : 'Přihlášení se nepovedlo. Zkus to znovu v Nastavení.');
  else if (res.signedIn) { if (!inLesson()) route(); toast('Přihlášeno. Pokrok se teď synchronizuje.'); }
  else if (sync.configured && !sync.isLoggedIn() && !sync.hasStoredLogin() && navigator.onLine
    && store.get().seenWelcome && !store.get().syncNoAsk && !inLesson()) setTimeout(syncOffer, 500);
});

// exporty pro ladění v konzoli
window.__ma1 = Object.assign(window.__ma1 || {}, { GEN, asChoice, store, desktopModeHint });
