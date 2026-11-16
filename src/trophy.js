// Pohárky podle počtu chyb (od 2026-11-16). Chyba = špatná odpověď, „Nevím“ nebo správně jen s nápovědou,
// a počítá se i v opakováních na konci lekce.
//   zlato   = bez jediné chyby
//   stříbro = nejvýš 1 chyba (u lekcí s aspoň 12 příklady nejvýš 2)
//   bronz   = dokončeno
// Starší záznamy bez uloženého pohárku se dál hodnotí podle přesnosti napoprvé (tierFromAcc), aby nikomu nic nezmizelo.
export const TIER = { NONE: 0, BRONZE: 1, SILVER: 2, GOLD: 3 };
export const TIER_NAME = ['', 'bronz', 'stříbro', 'zlato'];
export const TIER_LABEL = ['Zatím nezískáno', 'Bronz', 'Stříbro', 'Zlato'];
export const SILVER_AT = 0.8;
export const BIG_LESSON = 12;

/** staré hodnocení podle nejlepší přesnosti napoprvé (jen pro záznamy z doby před počítáním chyb) */
export const tierFromAcc = acc => (acc == null ? 0 : acc >= 0.999 ? 3 : acc >= SILVER_AT ? 2 : 1);

/** kolik chyb ještě dá stříbro; n = počet příkladů v lekci */
export const silverMax = n => (n >= BIG_LESSON ? 2 : 1);
/** pohárek za pokus podle počtu chyb */
export const tierFromMistakes = (mist, n) => (mist <= 0 ? 3 : mist <= silverMax(n) ? 2 : 1);

/** 1 chyba, 2 chyby, 5 chyb */
export const chyb = n => `${n} ${n === 1 ? 'chyba' : n >= 2 && n <= 4 ? 'chyby' : 'chyb'}`;

/** co je potřeba na další úroveň */
export function nextGoal(tier, n = 0) {
  if (tier === 0) return 'Dokonči lekci a máš bronz.';
  if (tier === 1) return `Na stříbro nejvýš ${chyb(silverMax(n))}, na zlato žádná.`;
  if (tier === 2) return 'Na zlato celou lekci bez chyby a bez nápovědy.';
  return 'Maximum! Tenhle máš celý.';
}

// barvy kovů: [odlesk, světlá, střední, tmavá, nejtmavší]
const METAL = {
  3: ['#fffbe0', '#ffe066', '#f5b800', '#c98a00', '#7a5100'],
  2: ['#ffffff', '#eef1f6', '#c4ccd8', '#8d97a8', '#545d6c'],
  1: ['#ffe6cc', '#f2b27a', '#cd7f32', '#9a5a22', '#5a3212'],
  0: ['#f4f3ef', '#dedcd4', '#c9c6bc', '#aeaba1', '#8a877e'],
};

/**
 * Detailní „3D“ pohárek jako SVG.
 * tier 0 = šedá silueta (nezískáno).
 */
export function trophySvg(tier = 3, size = 40, { title } = {}) {
  if (!tier) {
    // nezískaný: plochá silueta bez lesku (barva přes currentColor, funguje ve světlém i tmavém režimu)
    return `<svg class="trophy trophy-0" width="${size}" height="${size}" viewBox="0 0 64 64" role="img" aria-label="${title || TIER_LABEL[0]}">
  <path d="M15 13c-8 0-9.5 13 1.5 16.5M49 13c8 0 9.5 13-1.5 16.5" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
  <path d="M13.5 8.5h37V19c0 12-8.2 21-18.5 21S13.5 31 13.5 19z M28.5 39h7l-1.4 8.5h-4.2z" fill="currentColor"/>
  <ellipse cx="32" cy="8.5" rx="18.5" ry="3.6" fill="currentColor"/>
  <path d="M19 50.5h26l1.5 7.5h-29z" fill="currentColor"/><rect x="17" y="56.5" width="30" height="2.8" rx="1" fill="currentColor"/>
  <text x="32" y="30" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="17" fill="var(--bg, #fff)" opacity=".9">?</text>
</svg>`;
  }
  const [hi, l, m, d, dd] = METAL[tier] || METAL[0];
  const id = 't' + tier;
  const dim = tier === 0 ? ' opacity="0.55"' : '';
  return `<svg class="trophy trophy-${tier}" width="${size}" height="${size}" viewBox="0 0 64 64" role="img" aria-label="${title || TIER_LABEL[tier]}"${dim}>
  <defs>
    <linearGradient id="${id}-cup" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="${d}"/><stop offset=".18" stop-color="${m}"/><stop offset=".38" stop-color="${hi}"/>
      <stop offset=".55" stop-color="${l}"/><stop offset=".8" stop-color="${m}"/><stop offset="1" stop-color="${dd}"/>
    </linearGradient>
    <linearGradient id="${id}-rim" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${hi}"/><stop offset="1" stop-color="${m}"/></linearGradient>
    <linearGradient id="${id}-in" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${dd}"/><stop offset="1" stop-color="${d}"/></linearGradient>
    <linearGradient id="${id}-base" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#5b4636"/><stop offset=".5" stop-color="#3b2c22"/><stop offset="1" stop-color="#241a14"/></linearGradient>
    <radialGradient id="${id}-glow" cx=".5" cy=".45" r=".5"><stop offset="0" stop-color="${l}" stop-opacity=".55"/><stop offset="1" stop-color="${l}" stop-opacity="0"/></radialGradient>
  </defs>
  ${tier === 3 ? `<circle cx="32" cy="27" r="30" fill="url(#${id}-glow)"/>` : ''}
  <ellipse cx="32" cy="60" rx="17" ry="2.6" fill="#000" opacity=".18"/>
  <!-- ucha -->
  <path d="M15 13c-8 0-9.5 13 1.5 16.5" fill="none" stroke="${dd}" stroke-width="5" stroke-linecap="round"/>
  <path d="M15 13c-8 0-9.5 13 1.5 16.5" fill="none" stroke="url(#${id}-cup)" stroke-width="3" stroke-linecap="round"/>
  <path d="M49 13c8 0 9.5 13-1.5 16.5" fill="none" stroke="${dd}" stroke-width="5" stroke-linecap="round"/>
  <path d="M49 13c8 0 9.5 13-1.5 16.5" fill="none" stroke="url(#${id}-cup)" stroke-width="3" stroke-linecap="round"/>
  <!-- noha -->
  <path d="M28.5 39h7l-1.4 8.5h-4.2z" fill="url(#${id}-cup)"/>
  <ellipse cx="32" cy="47.5" rx="7.5" ry="2.2" fill="url(#${id}-cup)"/>
  <!-- podstavec -->
  <path d="M19 50.5h26l1.5 7.5h-29z" fill="url(#${id}-base)"/>
  <rect x="17" y="56.5" width="30" height="2.8" rx="1" fill="#1d1510"/>
  <rect x="25.5" y="52.3" width="13" height="3.6" rx=".8" fill="url(#${id}-rim)" opacity=".95"/>
  <!-- kalich -->
  <path d="M13.5 8.5h37V19c0 12-8.2 21-18.5 21S13.5 31 13.5 19z" fill="url(#${id}-cup)"/>
  <path d="M13.5 8.5h37V19c0 12-8.2 21-18.5 21S13.5 31 13.5 19z" fill="none" stroke="${dd}" stroke-width=".8" opacity=".6"/>
  <ellipse cx="32" cy="8.5" rx="18.5" ry="3.6" fill="url(#${id}-rim)"/>
  <ellipse cx="32" cy="8.9" rx="15.5" ry="2.3" fill="url(#${id}-in)"/>
  <!-- ražba: hvězda -->
  <path d="M32 14.5l2.5 5.1 5.6.8-4 4 1 5.6-5.1-2.7-5 2.7 1-5.6-4.1-4 5.6-.8z" fill="${d}" opacity=".9"/>
  <path d="M32 13.6l2.5 5.1 5.6.8-4 4 1 5.6-5.1-2.7-5 2.7 1-5.6-4.1-4 5.6-.8z" fill="url(#${id}-rim)"/>
  <!-- odlesk -->
  <path d="M18.5 12.5c0 9 2 16 7 21.5-6.5-2.5-9.5-10-9.5-21.5z" fill="#fff" opacity=".55"/>
  <circle cx="20" cy="12.2" r="1.3" fill="#fff" opacity=".9"/>
  ${tier === 3 ? '<path d="M52 4l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z" fill="#fff"/><path d="M9 33l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z" fill="#fff" opacity=".85"/>' : ''}
</svg>`;
}
