"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "@/app/components/ProtectedLayout";
import "./Dashboard.css";

const roleLabels: Record<string, string> = {
  admin: "Admin",
  usher: "Mhudumu",
  pastor: "Mchungaji",
  media: "Media",
  finance: "Fedha",
};

export default function Dashboard() {
  const [role, setRole] = useState("");
  const [fullName, setFullName] = useState("");
  const [branch, setBranch] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [lastLogin, setLastLogin] = useState("");
  const [allowedTabs, setAllowedTabs] = useState<string[]>([]);
  const [statusLight, setStatusLight] = useState<"green" | "red" | "grey">("grey");
  const [statusText, setStatusText] = useState("⏳ Tafadhali chagua paneli.");
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const TOKEN_KEY = "session_token";
  const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

  // ---------- Fetch user info (no double auth) ----------
  useEffect(() => {
    let mounted = true;

    const fetchUser = async () => {
      try {
        // IMPORTANT: this endpoint should return user info only if request is already authenticated
        // (ProtectedLayout / middleware should have validated the token).
        const res = await fetch("/api/user-info", { cache: "no-store" });
        if (!res.ok) {
          // If not ok, force redirect to login
          router.replace("/login");
          return;
        }

        const data = await res.json();
        if (data?.error) {
          router.replace("/login");
          return;
        }

        if (!mounted) return;

        setRole(data.role || "");
        setFullName(data.full_name || "");
        setBranch(data.branch || "");
        setProfileUrl(data.profile_url || "");
        setLastLogin(data.last_login ? new Date(data.last_login).toLocaleString() : "");
        setAllowedTabs(data.allowedTabs || []);
        setLoading(false);
      } catch (err) {
        router.replace("/login");
      }
    };

    fetchUser();

    return () => {
      mounted = false;
    };
  }, [router]);

  // ---------- Idle logout (debounced, robust) ----------
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return; // nothing to do if no token

    const timerRef = { id: undefined as unknown as number | null };

    const performLogout = async (showToast = true) => {
      try {
        // call server logout if token available
        const tokenNow = localStorage.getItem(TOKEN_KEY);
        if (tokenNow) {
          await fetch("/api/logout", {
            method: "POST",
            headers: { Authorization: `Bearer ${tokenNow}` },
          });
        }
      } catch {
        // ignore network errors for logout call
      } finally {
        // remove only the session token keys
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        if (showToast) {
          setToast("Umeachwa bila shughuli. Tafadhali ingia tena.");
          setTimeout(() => setToast(""), 4000);
        }
        router.replace("/login");
      }
    };

    const resetTimer = () => {
      if (timerRef.id) {
        window.clearTimeout(timerRef.id);
      }
      // set new timer
      timerRef.id = window.setTimeout(() => performLogout(true), IDLE_TIMEOUT_MS);
    };

    // activity events
    const activityEvents: Array<keyof WindowEventMap> = [
      "mousemove",
      "keydown",
      "mousedown",
      "touchstart",
      "wheel",
      "scroll",
    ];

    activityEvents.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));

    // start timer
    resetTimer();

    // cleanup
    return () => {
      if (timerRef.id) window.clearTimeout(timerRef.id);
      activityEvents.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [router]);

  // ---------- Network status watcher ----------
  useEffect(() => {
    const online = () => {
      setToast("🤗 Umerudi online!");
      setTimeout(() => setToast(""), 4000);
    };
    const offline = () => {
      setToast("😞 Umebakia offline.");
      setTimeout(() => setToast(""), 4000);
    };

    window.addEventListener("online", online);
    window.addEventListener("offline", offline);

    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  // ---------- Multi-tab sync logout ----------
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY && !e.newValue) {
        // token was removed in another tab
        router.replace("/login");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [router]);

  // ---------- Navigation to tabs ----------
  const goToTab = (tabId: string, page: string) => {
    if (!allowedTabs.includes(tabId)) {
      setStatusLight("red");
      setStatusText("🚫 Huna ruhusa ya kuingia sehemu hii.");
      setTimeout(() => {
        setStatusLight("grey");
        setStatusText("⏳ Tafadhali chagua paneli.");
      }, 3500);
      return;
    }
    setStatusLight("green");
    setStatusText(`⏳ Inaelekeza kwenye ${roleLabels[tabId] || tabId}...`);
    // small delay for UX
    setTimeout(() => {
      window.location.href = page;
    }, 300);
  };

  // ---------- Audio controls ----------
  const toggleAudio = async () => {
    if (!audioRef.current) return;
    try {
      if (audioPlaying) {
        audioRef.current.pause();
        setAudioPlaying(false);
      } else {
        await audioRef.current.play();
        setAudioPlaying(true);
      }
    } catch {
      setToast("Haiwezi kucheza muziki sasa.");
      setTimeout(() => setToast(""), 3000);
    }
  };

  // ---------- Logout ----------
  const handleLogout = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        await fetch("/api/logout", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      } catch {
        // ignore network error
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    router.replace("/login");
  };

  // ---------- Loading state while user info loads ----------
  if (loading) {
    return (
      <ProtectedLayout>
        <div className="dashboard-container">
          <div className="loading">Loading profile…</div>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="dashboard-container" role="main">
        {toast && <div className="toast" role="status">{toast}</div>}
        <div className="theme-verse">“Nuru yako itangaze gizani.” — Isaya 60:1</div>

        <h2>
          Karibu {roleLabels[role] || ""} {fullName}
        </h2>

        {branch && <div className="info-block">📍 Tawi: {branch}</div>}
        {lastLogin && <div className="info-block">🕒 Mwisho kuingia: {lastLogin}</div>}
        {profileUrl && <img src={profileUrl} alt="Profile" className="profile-img" />}

        <div className="controls-row">
          <button onClick={toggleAudio} aria-pressed={audioPlaying} className="audio-btn">
            🔊 {audioPlaying ? "Sitisha" : "Cheza Muziki"}
          </button>

          <button onClick={handleLogout} className="logout-btn" aria-label="Logout">
            🚪 Logout
          </button>
        </div>

        <audio ref={audioRef} loop>
          <source src="/ana.mp3" type="audio/mp3" />
        </audio>

        <div className={`status-indicator ${statusLight}`}>{statusText}</div>

        <div className="panel-links" aria-label="Available panels">
          {allowedTabs.includes("admin") && (
            <button onClick={() => goToTab("admin", "/admin")} className="panel-link">Admin</button>
          )}
          {allowedTabs.includes("usher") && (
            <button onClick={() => goToTab("usher", "/usher")} className="panel-link">Mhudumu</button>
          )}
          {allowedTabs.includes("pastor") && (
            <button onClick={() => goToTab("pastor", "/pastor")} className="panel-link">Mchungaji</button>
          )}
          {allowedTabs.includes("media") && (
            <button onClick={() => goToTab("media", "/media")} className="panel-link">Media</button>
          )}
          {allowedTabs.includes("finance") && (
            <button onClick={() => goToTab("finance", "/finance")} className="panel-link">Fedha</button>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
    }
            
