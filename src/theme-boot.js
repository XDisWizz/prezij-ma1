// Motiv nastavit ještě před vykreslením (jinak by stránka bliknula). Samostatný soubor kvůli CSP.
// Ručně zvolený motiv přebarví i systémové lišty (theme-color), ať ladí s pozadím.
try {
  const t = JSON.parse(localStorage.getItem('ma1-progress-v1') || '{}').theme;
  if (t) {
    document.documentElement.dataset.theme = t;
    const bar = t === 'dark' ? '#1b1b19' : '#f6f5f1';
    document.querySelectorAll('meta[name="theme-color"]').forEach(m => { m.content = bar; });
  }
} catch (e) {}
