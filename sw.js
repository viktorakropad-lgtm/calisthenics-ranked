/* Service worker : l'appli marche hors ligne apres la premiere ouverture.
   Page et manifeste: reseau d'abord (toujours la derniere version si on est en ligne), cache en secours.
   Icones: cache d'abord. Bibliotheque d'IA, modele et polices: cache d'abord (gros fichiers, ne changent pas). */
const CACHE = 'ranked-64c2325975';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net', 'storage.googleapis.com'];
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const same = u.origin === self.location.origin;
  if (!same && FONT_HOSTS.indexOf(u.hostname) < 0) return;
  const page = same && (r.mode === 'navigate' || /\/(index\.html|manifest\.webmanifest)?$/.test(u.pathname));
  if (page) {
    e.respondWith(fetch(r, { cache: 'no-cache' }).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); }
      return res;
    }).catch(() => caches.open(CACHE).then(c => c.match(r, { ignoreSearch: true }).then(hit => hit || c.match('index.html')))));
    return;
  }
  e.respondWith(caches.open(CACHE).then(c => c.match(r, { ignoreSearch: same }).then(hit => {
    const net = fetch(r).then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(r, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  })));
});
