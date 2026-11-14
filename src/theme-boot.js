// Motiv nastavit ještě před vykreslením (jinak by stránka bliknula). Samostatný soubor kvůli CSP.
try { const t = JSON.parse(localStorage.getItem('ma1-progress-v1') || '{}').theme; if (t) document.documentElement.dataset.theme = t; } catch (e) {}
