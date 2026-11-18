// Motiv a předmět nastavit ještě před vykreslením (jinak by stránka bliknula). Samostatný soubor kvůli CSP.
// Ručně zvolený motiv přebarví i systémové lišty (theme-color), ať ladí s pozadím.
try {
  const st = JSON.parse(localStorage.getItem('ma1-progress-v1') || '{}');
  const t = st.theme, zm = st.course === 'zm';
  if (zm) document.documentElement.dataset.course = 'zm';
  const BAR = zm ? { light: '#eef2f8', dark: '#171a20' } : { light: '#f6f5f1', dark: '#1b1b19' };
  if (t) document.documentElement.dataset.theme = t;
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => { m.content = t ? BAR[t] : (m.media || '').includes('dark') ? BAR.dark : BAR.light; });
} catch (e) {}
