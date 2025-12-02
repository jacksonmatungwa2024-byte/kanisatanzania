"use client";

import React, { useEffect, useState, useRef } from "react";
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
  const audioRef = useRef<HTMLAudioElement>(null);
  const [toast, setToast] = useState("");

  // Track token safely for client-side only
  const [token, setToken] = useState<string | null>(null);

  // Initialize token on client-side
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("session_token"));
    }
  }, []);

  // Listen to localStorage changes (multi-tab support)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorage = () => {
      const newToken = localStorage.getItem("session_token");
      if (newToken !== token) setToken(newToken);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [token]);

  // Session check & token validation
  useEffect(() => {
    if (!token) return;

    const checkSession = async () => {
      try {
        const res = await fetch("/api/me", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data.error) {
          localStorage.removeItem("session_token");
          window.location.href = "/login";
          return;
        }

        setRole(data.role);
        setFullName(data.full_name || "");
        setBranch(data.branch || "");
        setProfileUrl(data.profile_url || "");
        setLastLogin(data.last_login ? new Date(data.last_login).toLocaleString() : "");
        setAllowedTabs(data.allowedTabs || []);

        // Auto logout on inactivity
        let idleTimer: NodeJS.Timeout;
        const resetIdleTimer = () => {
          clearTimeout(idleTimer);
          idleTimer = setTimeout(async () => {
            alert("Umeachwa bila shughuli. Tafadhali ingia tena.");
            await fetch("/api/logout", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            });
            localStorage.removeItem("session_token");
            window.location.href = "/login";
          }, 30 * 60 * 1000); // 30 min
        };

        ["mousemove", "keydown", "click", "scroll"].forEach(event =>
          window.addEventListener(event, resetIdleTimer)
        );
        resetIdleTimer();

        return () => {
          clearTimeout(idleTimer);
          ["mousemove", "keydown", "click", "scroll"].forEach(event =>
            window.removeEventListener(event, resetIdleTimer)
          );
        };
      } catch {
        localStorage.removeItem("session_token");
        window.location.href = "/login";
      }
    };

    checkSession();
  }, [token]);

  // Network status
  useEffect(() => {
    if (typeof window === "undefined") return;

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

  // Panel navigation
  const goToTab = (tabId: string, page: string) => {
    if (!allowedTabs.includes(tabId)) {
      setStatusLight("red");
      setStatusText("🚫 Huna ruhusa ya kuingia sehemu hii.");
      return;
    }
    setStatusLight("green");
    setStatusText(`⏳ Inaelekeza kwenye ${roleLabels[tabId] || tabId}...`);
    window.location.href = page;
  };

  // Audio toggle
  const toggleAudio = () => {
    if (!audioRef.current) return;
    audioPlaying ? audioRef.current.pause() : audioRef.current.play();
    setAudioPlaying(!audioPlaying);
  };

  // Logout
  const handleLogout = async () => {
    if (token) {
      await fetch("/api/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    localStorage.removeItem("session_token");
    setToken(null);
    window.location.href = "/login";
  };

  return (
    <div className="dashboard-container">
      {toast && <div className="toast">{toast}</div>}
      <div className="theme-verse">“Nuru yako itangaze gizani.” — Isaya 60:1</div>

      <h2>
        Karibu {roleLabels[role] || ""} {fullName}
      </h2>

      {branch && <div className="info-block">📍 Tawi: {branch}</div>}
      {lastLogin && <div className="info-block">🕒 Mwisho kuingia: {lastLogin}</div>}
      {profileUrl && <img src={profileUrl} alt="Profile" className="profile-img" />}

      <button onClick={toggleAudio}>
        🔊 {audioPlaying ? "Sitisha" : "Cheza Muziki"}
      </button>

      <audio ref={audioRef} loop>
        <source src="/ana.mp3" type="audio/mp3" />
      </audio>

      <div className={`status-indicator ${statusLight}`}>{statusText}</div>

      <div className="panel-links">
        {allowedTabs.includes("admin") && <div onClick={() => goToTab("admin", "/admin")}>Admin</div>}
        {allowedTabs.includes("usher") && <div onClick={() => goToTab("usher", "/usher")}>Mhudumu</div>}
        {allowedTabs.includes("pastor") && <div onClick={() => goToTab("pastor", "/pastor")}>Mchungaji</div>}
        {allowedTabs.includes("media") && <div onClick={() => goToTab("media", "/media")}>Media</div>}
        {allowedTabs.includes("finance") && <div onClick={() => goToTab("finance", "/finance")}>Fedha</div>}
      </div>

      <button onClick={handleLogout} className="logout-btn">
        🚪 Logout
      </button>
    </div>
  );
}
