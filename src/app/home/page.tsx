"use client";

import React, { useEffect, useState, useRef } from "react";
import ProtectedLayout from "@/app/components/ProtectedLayout";
import "./Dashboard.css";

const roleLabels: Record<string, string> = {
  admin: "Admin",
  usher: "Mhudumu",
  pastor: "Mchungaji",
  media: "Media",
  finance: "Fedha",
};

// Helper to read cookies in client-side JS
function getCookie(name: string) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export default function Dashboard() {
  const [role, setRole] = useState("");
  const [fullName, setFullName] = useState("");
  const [branch, setBranch] = useState(""); // optional if you want to add branch later
  const [profileUrl, setProfileUrl] = useState("");
  const [lastLogin, setLastLogin] = useState("");
  const [allowedTabs, setAllowedTabs] = useState<string[]>([]);
  const [audioPlaying, setAudioPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load user info directly from cookies
  useEffect(() => {
    const username = getCookie("auth_user");
    const role = getCookie("auth_role");
    const fullName = getCookie("auth_name");
    const phone = getCookie("auth_phone");

    if (!username || !role) {
      window.location.href = "/login";
      return;
    }

    setRole(role);
    setFullName(fullName || "");
    // You can set branch/profileUrl/lastLogin as constants or leave empty
    setBranch("Main Branch"); // example constant
    setProfileUrl("/default-profile.png"); // example constant
    setLastLogin(new Date().toLocaleString());

    // Allowed tabs based on role
    const roleTabsMap: Record<string, string[]> = {
      admin: ["admin", "usher", "pastor", "media", "finance"],
      usher: ["usher"],
      pastor: ["pastor"],
      media: ["media"],
      finance: ["finance"],
    };
    setAllowedTabs(roleTabsMap[role] || []);
  }, []);

  // Logout clears cookies
  const handleLogout = async () => {
    document.cookie = "auth_user=; Max-Age=0; path=/";
    document.cookie = "auth_role=; Max-Age=0; path=/";
    document.cookie = "auth_name=; Max-Age=0; path=/";
    document.cookie = "auth_phone=; Max-Age=0; path=/";
    window.location.href = "/login";
  };

  // Audio toggle
  const toggleAudio = async () => {
    if (!audioRef.current) return;
    if (audioPlaying) {
      audioRef.current.pause();
      setAudioPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setAudioPlaying(true);
      } catch (err) {
        console.warn("Audio play blocked", err);
      }
    }
  };

  const goToTab = (page: string) => {
    window.location.href = page;
  };

  return (
    <ProtectedLayout>
      <div className="dashboard-container">
        <div className="theme-verse">“Nuru yako itangaze gizani.” — Isaya 60:1</div>

        <h2>
          Karibu {roleLabels[role]} {fullName}
        </h2>

        {branch && <div className="info-block">📍 Tawi: {branch}</div>}
        {lastLogin && <div className="info-block">🕒 Mwisho kuingia: {lastLogin}</div>}
        {profileUrl && <img src={profileUrl} alt="Profile" className="profile-img" />}

        <div className="controls-row">
          <button onClick={toggleAudio}>
            🔊 {audioPlaying ? "Sitisha" : "Cheza Muziki"}
          </button>
          <button onClick={handleLogout} className="logout-btn">
            🚪 Logout
          </button>
        </div>

        <audio ref={audioRef} loop>
          <source src="/ana.mp3" type="audio/mp3" />
        </audio>

        <div className="panel-links">
          {allowedTabs.includes("admin") && (
            <button onClick={() => goToTab("/admin")}>Admin</button>
          )}
          {allowedTabs.includes("usher") && (
            <button onClick={() => goToTab("/usher")}>Mhudumu</button>
          )}
          {allowedTabs.includes("pastor") && (
            <button onClick={() => goToTab("/pastor")}>Mchungaji</button>
          )}
          {allowedTabs.includes("media") && (
            <button onClick={() => goToTab("/media")}>Media</button>
          )}
          {allowedTabs.includes("finance") && (
            <button onClick={() => goToTab("/finance")}>Fedha</button>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}
