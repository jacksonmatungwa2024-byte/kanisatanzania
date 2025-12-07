"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "@/app/components/ProtectedLayout";
import "./Dashboard.css";

const roleLabels = {
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
  const [allowedTabs, setAllowedTabs] = useState([]);
  const [statusLight, setStatusLight] = useState("grey");
  const [statusText, setStatusText] = useState("⏳ Tafadhali chagua paneli.");
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef(null);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

  // ---------------- Fetch user via COOKIE ----------------
  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await fetch("/api/user-info", { cache: "no-store" });

        if (!res.ok) return router.replace("/login");

        const data = await res.json();
        if (!active) return;

        setRole(data.role);
        setFullName(data.full_name);
        setBranch(data.branch);
        setProfileUrl(data.profile_url);
        setLastLogin(
          data.last_login ? new Date(data.last_login).toLocaleString() : ""
        );
        setAllowedTabs(data.allowedTabs || []);

        setLoading(false);
      } catch {
        router.replace("/login");
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [router]);

  // ---------------- Idle logout (cookie-based) ----------------
  useEffect(() => {
    const logout = async () => {
      await fetch("/api/logout", { method: "POST" });
      router.replace("/login");
    };

    let timer: number;
const reset = () => {
  clearTimeout(timer);
  timer = window.setTimeout(logout, IDLE_TIMEOUT_MS);
};
    

    ["mousemove", "keydown", "mousedown", "touchstart", "scroll"].forEach((ev) =>
      window.addEventListener(ev, reset)
    );

    reset();

    return () => {
      clearTimeout(timer);
      ["mousemove", "keydown", "mousedown", "touchstart", "scroll"].forEach((ev) =>
        window.removeEventListener(ev, reset)
      );
    };
  }, [router]);

  // ---------------- Multi-tab logout sync ----------------
  useEffect(() => {
    const bc = new BroadcastChannel("auth");

    bc.onmessage = (msg) => {
      if (msg.data === "logout") router.replace("/login");
    };

    return () => bc.close();
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    new BroadcastChannel("auth").postMessage("logout");
    router.replace("/login");
  };

  // ---------------- Audio toggle ----------------
  const [audioPlaying, setAudioPlaying] = useState(false);
const audioRef = useRef<HTMLAudioElement | null>(null); // ✅ typed ref

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
  

  // ---------------- Tab navigation ----------------
  const goToTab = (tabId, page) => {
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
    setStatusText(`⏳ Inaelekeza kwenye ${roleLabels[tabId]}...`);
    setTimeout(() => (window.location.href = page), 300);
  };

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
      <div className="dashboard-container">
        {toast && <div className="toast">{toast}</div>}

        <div className="theme-verse">“Nuru yako itangaze gizani.” — Isaya 60:1</div>

        <h2>
          Karibu {roleLabels[role]} {fullName}
        </h2>

        {branch && <div className="info-block">📍 Tawi: {branch}</div>}
        {lastLogin && <div className="info-block">🕒 Mwisho kuingia: {lastLogin}</div>}
        {profileUrl && <img src={profileUrl} alt="Profile" className="profile-img" />}

        <div className="controls-row">
          <button onClick={toggleAudio}>🔊 {audioPlaying ? "Sitisha" : "Cheza Muziki"}</button>
          <button onClick={handleLogout} className="logout-btn">🚪 Logout</button>
        </div>

        <audio ref={audioRef} loop>
          <source src="/ana.mp3" type="audio/mp3" />
        </audio>

        <div className={`status-indicator ${statusLight}`}>{statusText}</div>

        <div className="panel-links">
          {allowedTabs.includes("admin") && (
            <button onClick={() => goToTab("admin", "/admin")}>Admin</button>
          )}
          {allowedTabs.includes("usher") && (
            <button onClick={() => goToTab("usher", "/usher")}>Mhudumu</button>
          )}
          {allowedTabs.includes("pastor") && (
            <button onClick={() => goToTab("pastor", "/pastor")}>Mchungaji</button>
          )}
          {allowedTabs.includes("media") && (
            <button onClick={() => goToTab("media", "/media")}>Media</button>
          )}
          {allowedTabs.includes("finance") && (
            <button onClick={() => goToTab("finance", "/finance")}>Fedha</button>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
       }
          
