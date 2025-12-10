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
  const [loading, setLoading] = useState(true);

  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const router = useRouter();

  // ---------------- Fetch user info ----------------
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/user-info", {
          cache: "no-store",
          credentials: "include", // tumia cookies zilizowekwa login
        });
        if (!res.ok) return router.replace("/login");

        const data = await res.json();

        setRole(data.role || "");
        setFullName(data.full_name || "");
        setBranch(data.branch || "");
        setProfileUrl(data.profile_url || "");
        setLastLogin(data.last_login ? new Date(data.last_login).toLocaleString() : "");
        setAllowedTabs(data.allowedTabs || []);
        setLoading(false);
      } catch {
        router.replace("/login");
      }
    };

    load();
  }, [router]);

  // ---------------- Logout ----------------
  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST", credentials: "include" });
    router.replace("/login");
  };

  // ---------------- Audio toggle ----------------
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

  // ---------------- Go to tab ----------------
  const goToTab = (page: string) => {
    window.location.href = page;
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
