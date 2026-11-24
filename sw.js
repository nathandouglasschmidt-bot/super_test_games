const cacheName='pocket-rink-v1-'+new URL(self.registration.scope).pathname;
self.addEventListener('install',event=>event.waitUntil(caches.open(cacheName).then(cache=>cache.addAll(['./','./index.html','./game.js','./manifest.webmanifest','./icon.png']))));
self.addEventListener('fetch',event=>{if(event.request.method==='GET'&&event.request.url.startsWith(self.registration.scope))event.respondWith(fetch(event.request).catch(()=>caches.match(event.request).then(response=>response||(event.request.mode==='navigate'?caches.match('./index.html'):Response.error()))));});
