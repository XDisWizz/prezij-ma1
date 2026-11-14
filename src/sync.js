// Volitelná synchronizace pokroku přes Supabase (přihlášení přes Google).
//
// Local-first: pokrok žije v localStorage a aplikace funguje celá bez účtu i bez sítě.
// Server je jen záloha/most mezi zařízeními. Když nejde, nic se nerozbije, jen se to zkusí později.
//
// Šetření limitů:
//  * přihlašovací knihovna se stahuje až když je potřeba (uložené přihlášení nebo klik na „Přihlásit“),
//  * čte se při spuštění a po návratu do aplikace (nejdřív po 15 min); server vrací data jen při změně,
//  * zapisuje se 60 s po poslední změně nebo při odchodu z aplikace, a jen když se něco opravdu změnilo,
//  * jednotlivé odpovědi na příklady se neposílají vůbec (log zůstává v zařízení).

import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { store } from './store.js';
import { merge, sanitize, stableJson } from './syncmerge.js';

const AUTH_KEY = 'ma1-auth';
const META_KEY = 'ma1-sync-v1';
const PUSH_DELAY = 60_000;
const PULL_EVERY = 15 * 60_000;
const RETRY_DELAY = 15_000;

// ------------------------------------------------------------ kontrola konfigurace
function jwtRole(key) {
  try { return JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role; } catch { return null; }
}
function checkConfig() {
  if (!SUPABASE_URL && !SUPABASE_KEY) return false;
  const key = String(SUPABASE_KEY);
  if (/^sb_secret_/.test(key) || (key.split('.').length === 3 && jwtRole(key) !== 'anon')) {
    console.error('[sync] config.js obsahuje TAJNÝ klíč! Okamžitě ho v Supabase zneplatni a nahraď publishable klíčem.');
    return false;
  }
  const urlOk = /^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(SUPABASE_URL) || /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(SUPABASE_URL);
  const keyOk = /^sb_publishable_[\w-]{10,}$/.test(key) || jwtRole(key) === 'anon';
  if (!urlOk || !keyOk) { console.warn('[sync] config.js: neplatná URL nebo klíč, synchronizace je vypnutá.'); return false; }
  return true;
}
export const configured = checkConfig();

// ------------------------------------------------------------ stav
let auth = null;          // GoTrueClient, načte se líně
let session = null;
let state = configured ? 'off' : 'disabled';   // disabled | off | syncing | ok | pending | offline | error
let pushTimer = null, retryTimer = null, running = null, wired = false;
const statusFns = new Set(), dataFns = new Set();

const loadMeta = () => { try { return JSON.parse(localStorage.getItem(META_KEY)) || {}; } catch { return {}; } };
let meta = loadMeta();     // { uid, version, serverHash, lastSync, lastPull }
const saveMeta = () => { try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch { /* nevadí */ } };

function hash(str) {   // cyrb53 – stačí na „změnilo se něco?“
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
const localHash = () => hash(stableJson(store.syncData()));

function setState(s) {
  state = s;
  for (const fn of statusFns) { try { fn(status()); } catch { /* UI chyba nesmí rozbít sync */ } }
}
export const status = () => ({ state, email: session?.user?.email || '', lastSync: meta.lastSync || 0 });
export const onStatus = fn => { statusFns.add(fn); return () => statusFns.delete(fn); };
/** zavolá se, když ze serveru přišel pokrok z jiného zařízení (UI se může překreslit) */
export const onData = fn => { dataFns.add(fn); return () => dataFns.delete(fn); };
export const hasStoredLogin = () => { try { return !!localStorage.getItem(AUTH_KEY); } catch { return false; } };
export const isLoggedIn = () => !!session;

// ------------------------------------------------------------ přihlašovací knihovna
async function getAuth() {
  if (auth) return auth;
  const { GoTrueClient } = await import('../vendor/supabase/auth-js.mjs');
  auth = new GoTrueClient({
    url: SUPABASE_URL + '/auth/v1',
    headers: { apikey: SUPABASE_KEY },
    storageKey: AUTH_KEY,
    flowType: 'pkce',            // návrat z Googlu nese ?code=…, ne tokeny v #hashi (ten patří routeru)
    persistSession: true,        // přihlášení přežije zavření aplikace
    autoRefreshToken: true,      // a samo se obnovuje; refresh token v Supabase standardně nevyprší
    detectSessionInUrl: true,
  });
  auth.onAuthStateChange((event, s) => {
    session = s;
    if (event === 'SIGNED_OUT') { setState('off'); }
  });
  return auth;
}

/** chyba z přihlášení: Supabase ji vrací v ?query i v #hashi (#error=…&error_description=…) */
function callbackError() {
  const q = new URLSearchParams(location.search);
  if (q.get('error')) return { error: q.get('error'), code: q.get('error_code'), desc: q.get('error_description') };
  if (/^#error=/.test(location.hash)) {
    const h = new URLSearchParams(location.hash.slice(1));
    return { error: h.get('error'), code: h.get('error_code'), desc: h.get('error_description') };
  }
  return null;
}

/** odstraní z adresy ?code=… / ?error=… / #error=… po návratu z Googlu */
function cleanUrl() {
  const hashErr = /^#error=/.test(location.hash);
  if (!location.search && !hashErr) return;
  history.replaceState(history.state, '', location.pathname + (hashErr ? '#/' : location.hash));
}

// ------------------------------------------------------------ volání databáze (jen 3 funkce)
async function token() {
  const { data } = await auth.getSession();   // případně si sám obnoví vypršelý access token
  session = data.session;
  if (!session) throw Object.assign(new Error('no session'), { status: 401 });
  return session.access_token;
}
async function rpc(name, body, { keepalive = false, tok } = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    keepalive,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: 'Bearer ' + (tok || await token()),
      'Content-Type': 'application/json',
      'Content-Profile': 'api',
      'Accept-Profile': 'api',
    },
    body: JSON.stringify(body || {}),
  });
  if (!res.ok) {
    let code = ''; try { code = (await res.json()).code || ''; } catch { /* prázdné tělo */ }
    throw Object.assign(new Error(`rpc ${name}: ${res.status}`), { status: res.status, code });
  }
  return res.status === 204 ? null : res.json();
}

// ------------------------------------------------------------ synchronizace
function applyRemote(row) {
  const remote = sanitize(row.data);
  const before = localHash();
  store.applySynced(merge(store.get(), remote));
  meta.version = row.version;
  meta.serverHash = hash(stableJson(remote));
  if (localHash() !== before) for (const fn of dataFns) { try { fn(); } catch { /* nevadí */ } }
}

async function pull() {
  const rows = await rpc('get_progress', { known_version: meta.version || 0 });
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) { meta.version = 0; meta.serverHash = null; }       // na serveru zatím nic není
  else if (row.data != null) applyRemote(row);
  meta.lastPull = Date.now();
  saveMeta();
}

async function push({ keepalive = false, tok } = {}) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const h = localHash();
    if (h === meta.serverHash) return;
    const v = await rpc('put_progress', { new_data: store.syncData(), base_version: meta.version || 0 }, { keepalive, tok });
    if (v > 0) { meta.version = v; meta.serverHash = h; saveMeta(); return; }
    // konflikt: jiné zařízení zapsalo mezitím → stáhnout, sloučit, zkusit znovu
    meta.version = 0;
    await pull();
  }
}

function handleError(e) {
  if (!navigator.onLine) return setState('offline');
  if (e?.status === 429) { scheduleRetry(); return setState('pending'); }
  if (e?.status === 401) return setState(session ? 'error' : 'off');
  console.warn('[sync]', e?.message || e);
  scheduleRetry(4);
  setState('error');
}
function scheduleRetry(mult = 1) {
  clearTimeout(retryTimer);
  retryTimer = setTimeout(() => syncNow({ pullFirst: false }), RETRY_DELAY * mult);
}

/** jedna synchronizace najednou; pullFirst = nejdřív stáhnout změny z ostatních zařízení */
export function syncNow({ pullFirst = true } = {}) {
  if (!session) return Promise.resolve();
  if (running) return running;
  if (!navigator.onLine) { setState('offline'); return Promise.resolve(); }
  clearTimeout(pushTimer); clearTimeout(retryTimer);
  setState('syncing');
  running = (async () => {
    try {
      if (pullFirst) await pull();
      await push();
      meta.lastSync = Date.now(); saveMeta();
      setState('ok');
    } catch (e) { handleError(e); } finally { running = null; }
  })();
  return running;
}

function schedulePush() {
  if (!session) return;
  if (localHash() === meta.serverHash) return;
  setState(navigator.onLine ? 'pending' : 'offline');
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => syncNow({ pullFirst: false }), PUSH_DELAY);
}

/** při odchodu z aplikace: poslat rovnou (keepalive), ať se nic neztratí */
function flushOnHide() {
  if (!session || running || !navigator.onLine) return;
  if (localHash() === meta.serverHash) return;
  const fresh = session.expires_at && session.expires_at * 1000 > Date.now() + 15_000;
  if (!fresh) return;   // token se musí obnovit → pošle se při příštím spuštění
  clearTimeout(pushTimer);
  running = push({ keepalive: true, tok: session.access_token })
    .then(() => { meta.lastSync = Date.now(); saveMeta(); setState('ok'); })
    .catch(handleError)
    .finally(() => { running = null; });
}

function wire() {
  if (wired) return;
  wired = true;
  store.onChange(schedulePush);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushOnHide();
    else if (Date.now() - (meta.lastPull || 0) > PULL_EVERY) syncNow();
  });
  window.addEventListener('pagehide', flushOnHide);
  window.addEventListener('online', () => syncNow());
  window.addEventListener('offline', () => { if (session) setState('offline'); });
}

async function startSession() {
  const a = await getAuth();
  const { data } = await a.getSession();
  session = data.session;
  if (!session) { setState('off'); return false; }
  if (meta.uid !== session.user.id) { meta = { uid: session.user.id, version: 0, serverHash: null }; saveMeta(); }
  wire();
  syncNow();
  return true;
}

// ------------------------------------------------------------ veřejné API
/**
 * Při spuštění aplikace. Knihovnu načte jen když je uložené přihlášení nebo se vracíme z Googlu.
 * Vrací { error } když se přihlášení nepovedlo (pro hlášku v UI).
 */
export async function init() {
  if (!configured) return {};
  const q = new URLSearchParams(location.search);
  const cbErr = callbackError();
  const err = cbErr?.error;
  if (cbErr) console.warn('[sync] přihlášení selhalo:', cbErr.error, cbErr.code || '', cbErr.desc || '');
  const callback = q.has('code') || !!cbErr;
  if (!hasStoredLogin() && cbErr) { cleanUrl(); setState('off'); return { error: err === 'access_denied' ? 'cancelled' : 'failed' }; }
  if (!hasStoredLogin() && !callback) { setState('off'); return {}; }
  try {
    const ok = await startSession();
    cleanUrl();
    if (err) return { error: err === 'access_denied' ? 'cancelled' : 'failed' };
    if (callback && !ok) return { error: 'failed' };
    return { signedIn: callback && ok };
  } catch (e) {
    cleanUrl();
    console.warn('[sync] init', e);
    setState(navigator.onLine ? 'error' : 'offline');
    return callback ? { error: 'failed' } : {};
  }
}

/** přesměruje na Google; po návratu se o zbytek postará init() */
export async function signIn() {
  if (!configured) return;
  if (!navigator.onLine) throw Object.assign(new Error('offline'), { offline: true });
  const a = await getAuth();
  const redirectTo = location.origin + location.pathname.replace(/index\.html$/, '');
  const { error } = await a.signInWithOAuth({ provider: 'google', options: { redirectTo, queryParams: { prompt: 'select_account' } } });
  if (error) throw error;
}

/** odhlásí jen tohle zařízení (ostatní zůstanou přihlášená); lokální pokrok zůstává */
export async function signOut() {
  if (!auth) return;
  try { await syncNow({ pullFirst: false }); } catch { /* nevadí */ }
  try { await auth.signOut({ scope: 'local' }); } catch { /* i offline se odhlásí lokálně */ }
  try { localStorage.removeItem(AUTH_KEY); } catch { /* nevadí */ }
  session = null; meta = {}; saveMeta(); clearTimeout(pushTimer); clearTimeout(retryTimer);
  setState('off');
}

/** smaže účet i data na serveru; lokální pokrok zůstává */
export async function deleteAccount() {
  if (!session) return;
  await rpc('delete_my_account');
  try { await auth.signOut({ scope: 'local' }); } catch { /* účet už neexistuje */ }
  try { localStorage.removeItem(AUTH_KEY); } catch { /* nevadí */ }
  session = null; meta = {}; saveMeta(); clearTimeout(pushTimer); clearTimeout(retryTimer);
  setState('off');
}
