const CACHE_NAME = "lumina-cache-v3";
const OFFLINE_URL = "/offline.html";

// --- INSTALL ---
self.addEventListener("install", (event) => {
  console.log("✨ [Lumina SW] Installing and caching assets...");
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const assets = [
        "/",                     // Home
        OFFLINE_URL,             // Offline fallback
        "/manifest.json",

        // MEDIA
        "/aerial.mp4",
        "/theme.mp3",
        "/intro-tone.mp3",

        // MATCH MANIFEST.JSON ICONS (IMPORTANT!)
        "/icons/lumina-192.png",
        "/icons/lumina-256.png",
        "/icons/lumina-512.png",
        "/icons/lumina-maskable.png",
        "/icons/lumina-monochrome.png"
      ];
      // safer: don't fail if one asset is missing
      await Promise.allSettled(assets.map((asset) => cache.add(asset)));
    })
  );
  self.skipWaiting();
});

// --- ACTIVATE ---
self.addEventListener("activate", (event) => {
  console.log("🚀 [Lumina SW] Activated!");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("🗑️ [SW] Deleting old cache:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();

  // Notify clients that SW is ready
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: "SW_READY" });
    });
  });
});

// --- MESSAGE HANDLER (for Refresh App button) ---
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    console.log("⏭️ [SW] Skip waiting triggered");
    self.skipWaiting();
  }
});

// --- NETWORK STATUS ---
let wasOnline = true;
function broadcastStatus(message) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: "NETWORK_STATUS", message });
    });
  });
}

// --- FETCH HANDLER ---
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Handle API requests
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request, { credentials: "include" })
        .then((res) => res)
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Page navigation
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (!wasOnline) {
            wasOnline = true;
            broadcastStatus("🤗 Umerudi online!");
          }
          return res;
        })
        .catch(() => {
          if (wasOnline) {
            wasOnline = false;
            broadcastStatus("😞 Uko offline.");
          }
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // Static assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((res) => {
          caches.open(CACHE_NAME).then((cache) =>
            cache.put(event.request, res.clone())
          );
          return res;
        })
        .catch(() => caches.match(OFFLINE_URL));
    })
  );
});

// --- PUSH NOTIFICATIONS ---
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  const title = data.title || "Lumina Update";
  const options = {
    body: data.body || "Una taarifa mpya!",
    icon: "/icons/lumina-192.png",
    badge: "/icons/lumina-192.png",
    data: data.url || "/home",
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data));
});
