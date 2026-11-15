// Service worker: aplikace jde nainstalovat a funguje i offline.
// Strategie „nejdřív síť“: online vždycky čerstvá verze, bez sítě poslední uložená.
// Při větší změně stačí zvýšit číslo verze.
const CACHE = 'ma1-v15';
const CORE = [
  './', './index.html', './manifest.webmanifest', './css/style.css',
  './vendor/katex/katex.min.css', './vendor/katex/katex.min.js',
  // písma KaTeXu, aby sazba fungovala i při prvním spuštění bez sítě
  './vendor/katex/fonts/KaTeX_AMS-Regular.woff2', './vendor/katex/fonts/KaTeX_Main-Bold.woff2', './vendor/katex/fonts/KaTeX_Main-BoldItalic.woff2', './vendor/katex/fonts/KaTeX_Main-Italic.woff2', './vendor/katex/fonts/KaTeX_Main-Regular.woff2', './vendor/katex/fonts/KaTeX_Math-BoldItalic.woff2', './vendor/katex/fonts/KaTeX_Math-Italic.woff2', './vendor/katex/fonts/KaTeX_Size1-Regular.woff2', './vendor/katex/fonts/KaTeX_Size2-Regular.woff2', './vendor/katex/fonts/KaTeX_Size3-Regular.woff2', './vendor/katex/fonts/KaTeX_Size4-Regular.woff2',
  './icons/icon.svg', './icons/favicon-32.png', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png',
  './src/main.js', './src/ui.js', './src/cards.js', './src/store.js', './src/theme-boot.js', './src/config.js', './src/sync.js', './src/syncmerge.js', './vendor/supabase/auth-js.mjs', './src/sym.js', './src/trophy.js', './src/intervals.js', './src/numberline.js', './src/mathfield.js',
  './src/defobor/content.js', './src/defobor/gen.js', './src/defobor/gonio.js',
  './src/derivace/content.js', './src/derivace/gen.js',
  './src/limity/content.js', './src/limity/gen.js',
  './src/prubeh/content.js', './src/prubeh/gen.js',
  './src/integraly/content.js', './src/integraly/gen.js',
];

self.addEventListener('install', e => {
  // cache: 'reload' = stáhnout čerstvě, ne z paměti prohlížeče
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // videa a ostatní cizí stránky neřešíme, jen naše soubory a písma
  const ours = url.origin === location.origin;
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  // Supabase (přihlášení, synchronizace) ani nic jiného cizího service worker neřeší
  if (!ours && !fonts) return;
  // adresy s ?query (např. návrat z Googlu s ?code=…) se nekešují
  const cacheable = !(ours && url.search);
  // Naše soubory se vždycky ověří u serveru (cache: 'no-cache' → krátké 304, když se nic nezměnilo).
  // Jinak by prohlížeč po nasazení ještě 10 minut vracel staré kopie (GitHub Pages: max-age=600).
  // Navigaci necháváme být: init u požadavku typu navigate nejde zadat a obnovení stránky ji stejně ověří.
  const net = ours && req.mode !== 'navigate' ? fetch(req, { cache: 'no-cache' }) : fetch(req);
  e.respondWith(
    net.then(res => {
      if (cacheable && res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))),
  );
});
