"use client";

import React, { useEffect, useState, useRef } from "react";
import "./Dashboard.css";
import { initNetworkStatus } from "../../utils/networkStatus";
import { usePermissions } from "@/utils/usePermissions";

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

  // 🔒 Session check using cookie
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" }); // 👈 cookie auto-sent
        const data = await res.json();

        if (data.error) {
          window.location.href = "/login";
          return;
        }

        setRole(data.role);
        setFullName(data.full_name || "");
        setBranch(data.branch || "");
        setProfileUrl(data.profile_url || "");
        setLastLogin(data.last_login ? new Date(data.last_login).toLocaleString() : "");
        setAllowedTabs(data.allowedTabs || []);

        // 🔹 Auto logout after 30 mins inactivity
        const timeout = setTimeout(async () => {
          alert("Umeachwa bila shughuli. Tafadhali ingia tena.");
          await fetch("/api/logout", { method: "POST", credentials: "include" });
          window.location.href = "/login";
        }, 30 * 60 * 1000);

        return () => clearTimeout(timeout);
      } catch (err) {
        console.error("Session load failed:", err);
        window.location.href = "/login";
      }
    };

    checkSession();
  }, []);

  // 🌐 Network status listener
  useEffect(() => {
    const handleOnline = () => {
      setToast("🤗 Umerudi online!");
      setTimeout(() => setToast(""), 4000);
    };
    const handleOffline = () => {
      setToast("😞 Umepoteza internet, uko offline.");
      setTimeout(() => setToast(""), 4000);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleClick = (tabId: string, page: string) => {
    if (!allowedTabs.includes(tabId)) {
      setStatusLight("red");
      setStatusText("🚫 Huna ruhusa ya kuingia sehemu hii.");
      return;
    }
    setStatusLight("green");
    setStatusText(`✅ Unaelekezwa kwenye ${tabId}...`);
    window.location.href = page;
  };

  const handleAudioToggle = () => {
    if (audioRef.current) {
      if (audioPlaying) {
        audioRef.current.pause();
        setAudioPlaying(false);
      } else {
        audioRef.current.play();
        setAudioPlaying(true);
      }
    }
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST", credentials: "include" }); // 👈 clear cookie + DB
    window.location.href = "/logout";
  };

  return (
    <div className="dashboard-container">
      {toast && <div className="toast">{toast}</div>}

      <div className="theme-verse">“Nuru yako itangaze gizani.” — Isaya 60:1</div>
      <h2>Karibu {roleLabels[role] || ""} {fullName}</h2>
      {branch && <div className="info-block">📍 Tawi: {branch}</div>}
      {lastLogin && <div className="info-block">🕒 Ilipoingia mwisho: {lastLogin}</div>}
      {profileUrl && <img src={profileUrl} alt="Profile" className="profile-img" />}

      <button onClick={handleAudioToggle}>
        🔊 {audioPlaying ? "Pause Theme" : "Play Theme"}
      </button>
      <audio ref={audioRef} loop>
        <source src="/ana.mp3" type="audio/mp3" />
      </audio>

      <div className={`status-indicator ${statusLight}`}>
        {statusText}
      </div>

      <div className="panel-links">
        {allowedTabs.includes("admin") && (
          <div onClick={() => handleClick("admin", "/admin")}>Admin Panel</div>
        )}
        {allowedTabs.includes("usher") && (
          <div onClick={() => handleClick("usher", "/usher")}>Usher Panel</div>
        )}
        {allowedTabs.includes("pastor") && (
          <div onClick={() => handleClick("pastor", "/pastor")}>Pastor Panel</div>
        )}
        {allowedTabs.includes("media") && (
          <div onClick={() => handleClick("media", "/media")}>Media Team</div>
        )}
        {allowedTabs.includes("finance") && (
          <div onClick={() => handleClick("finance", "/finance")}>Finance</div>
        )}
      </div>

      <button onClick={handleLogout} className="logout-btn">
        🚪 Logout
      </button>
    </div>
  );
          }
