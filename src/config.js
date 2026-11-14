// Nastavení synchronizace přes Supabase (volitelné).
//
// Obě hodnoty jsou VEŘEJNÉ a patří do gitu: URL projektu a *publishable* klíč (sb_publishable_…).
// Bezpečnost nestojí na jejich utajení, ale na právech v databázi (supabase/migrations/).
//
// NIKDY sem nedávej secret klíč (sb_secret_…), service_role klíč ani heslo k databázi.
// Aplikace je nepotřebuje a sync.js se s nimi odmítne spustit.
//
// Prázdné hodnoty = synchronizace se v aplikaci vůbec neukáže.

export const SUPABASE_URL = 'https://uxsllmxytqvudgjikrdu.supabase.co';   // např. 'https://abcdefghijklmnopqrst.supabase.co'
export const SUPABASE_KEY = 'sb_publishable_cbmTWiqwFW4nMw6VaV8oZA_pJSaAno4';   // např. 'sb_publishable_…'
