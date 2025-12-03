const CACHE_NAME = "lumina-cache-v2";
const OFFLINE_URL = "/offline.html";

// --- INSTALL ---
self.addEventListener("install", (event) => {
  console.log("✨ [Lumina SW] Installing and caching assets...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([
        "/",
        OFFLINE_URL,
        "/manifest.json",
        "/aerial.mp4",
        "/theme.mp3",
        "/intro-tone.mp3",
        "/icons/icon-192.png",
        "/icons/icon-256.png",
        "/icons/icon-384.png",
        "/icons/icon-512.png"
      ])
    )
  );
  self.skipWaiting();
});

// --- ACTIVATE ---
self.addEventListener("activate", (event) => {
  console.log("🚀 [Lumina SW] Activated and ready to serve!");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("🗑️ [Lumina SW] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// --- NETWORK STATUS BROADCAST ---
let wasOnline = true;
function broadcastStatus(message) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: "NETWORK_STATUS", message });
    });
  });
}

// --- FETCH HANDLER (Offline Fallback + Cache) ---
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (!wasOnline) {
            wasOnline = true;
            broadcastStatus("🤗 Umerudi online!");
          }
          return response;
        })
        .catch(() => {
          if (wasOnline) {
            wasOnline = false;
            broadcastStatus("😞 Umepoteza internet, uko offline.");
          }
          console.warn("⚠️ [Lumina SW] Offline, serving fallback page.");
          return caches.match(OFFLINE_URL);
        })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((res) => {
        if (res) return res;
        return fetch(event.request)
          .then((response) => {
            caches.open(CACHE_NAME).then((cache) =>
              cache.put(event.request, response.clone())
            );
            return response;
          })
          .catch(() => caches.match(OFFLINE_URL))
      })
    );
  }
});

// --- PUSH NOTIFICATIONS ---
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  const title = data.title || "Lumina Update";
  const options = {
    body: data.body || "Una taarifa mpya!",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: data.url || "/home"
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data)
  );
});
