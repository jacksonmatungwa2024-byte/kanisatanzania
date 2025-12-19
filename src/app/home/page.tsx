"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProtectedLayout from "@/app/components/ProtectedLayout";
import "./Dashboard.css";

const roleLabels: Record<string, string> = {
  admin: "Admin",
  usher: "Mhudumu",
  pastor: "Mchungaji",
  media: "Media",
  finance: "Fedha",
};

function Dashboard() {
  const params = useSearchParams();
  const router = useRouter();
  const [role, setRole] = useState("");
  const [fullName, setFullName] = useState("");
  const [branch, setBranch] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [lastLogin, setLastLogin] = useState("");
  const [allowedTabs, setAllowedTabs] = useState<string[]>([]);
  const [audioPlaying, setAudioPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const username = params.get("username");
    const role = params.get("role");
    const fullName = params.get("name");

    if (!username || !role) {
      router.replace("/login");
      return;
    }

    setRole(role);
    setFullName(fullName || "");
    setBranch("Main Branch");
    setProfileUrl("/default-profile.png");
    setLastLogin(new Date().toLocaleString());

    const roleTabsMap: Record<string, string[]> = {
      admin: ["admin", "usher", "pastor", "media", "finance"],
      usher: ["usher"],
      pastor: ["pastor"],
      media: ["media"],
      finance: ["finance"],
    };
    setAllowedTabs(roleTabsMap[role] || []);
  }, [params, router]);

  const handleLogout = () => {
    router.replace("/login");
  };

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
    router.push(page);
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

export default Dashboard;
