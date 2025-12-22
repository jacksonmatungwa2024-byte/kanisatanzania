"use client";
import { useEffect, useState } from "react";

export default function PWARegister() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showRefresh, setShowRefresh] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("✅ Service Worker Registered:", registration);

          // Detect new SW waiting
          if (registration.waiting) {
            setWaitingWorker(registration.waiting);
            setShowRefresh(true);
          }

          registration.onupdatefound = () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.onstatechange = () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  setWaitingWorker(newWorker);
                  setShowRefresh(true);
                  console.log("🔄 New content available, refresh to update.");
                }
              };
            }
          };
        })
        .catch((err) => console.error("❌ SW Registration Failed:", err));

      // Listen for messages from SW (e.g., network status)
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "NETWORK_STATUS") {
          console.log("🌐 Network status:", event.data.message);
        }
      });
    }
  }, []);

  const refreshApp = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
      setShowRefresh(false);
      window.location.reload();
    }
  };

  return (
    <>
      {showRefresh && (
        <button
          onClick={refreshApp}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            padding: "10px 16px",
            background: "#FFD700",
            color: "#000",
            borderRadius: "6px",
            fontWeight: "bold",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            zIndex: 9999,
          }}
        >
          🔄 Refresh App
        </button>
      )}
    </>
  );
            }
