"use client";
import React, { useEffect, useState } from "react";
import "./MediaDashboard.css";
import MediaPanel from "../components/MediaPanel";
import StoragePanel from "../components/StoragePanel";
import UsagePanel from "../components/UsagePanel";
import MediaProfile from "../components/MediaProfile";

interface TabBase { key: string; label: string; }
interface TabWithComponent<P = Record<string, unknown>> extends TabBase { 
  component: React.ComponentType<P>; 
}

const allTabs: TabWithComponent[] = [
  { key: "media", label: "📣 Matangazo", component: MediaPanel },
  { key: "storage", label: "🖼️ Gallery", component: StoragePanel },
  { key: "usage", label: "📊 Matumizi", component: UsagePanel },
  { key: "profile", label: "🙍‍♂️ Profile", component: MediaProfile as React.ComponentType<{ userId: number }> },
];

export default function MediaDashboard() {
  const [activeTab, setActiveTab] = useState("media");
  const [allowedTabs, setAllowedTabs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const fetchUserTabs = async () => {
      const token = localStorage.getItem("session_token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      const res = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.error) {
        localStorage.removeItem("session_token");
        window.location.href = "/login";
        return;
      }

      setUserId(data.id);
      setUserRole(data.role);

      if (data.role === "admin") {
        setAllowedTabs(allTabs.map((t) => t.key));
        setActiveTab("media");
      } else {
        const tabs = data.allowedTabs;
        setAllowedTabs(Array.isArray(tabs) ? tabs : ["media", "profile", "usage"]);
        const lastTab = localStorage.getItem("media_active_tab") ?? "";
        setActiveTab(lastTab && tabs?.includes(lastTab) ? lastTab : (tabs?.[0] || "media"));
      }

      setLoading(false);

      let timeout: NodeJS.Timeout;
      const resetTimer = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          alert("Umeachwa bila shughuli. Tafadhali ingia tena.");
          handleLogout();
        }, 10 * 60 * 1000);
      };

      const events = ["mousemove", "keydown", "scroll", "click"];
      events.forEach((e) => window.addEventListener(e, resetTimer));
      resetTimer();

      return () => {
        clearTimeout(timeout);
        events.forEach((e) => window.removeEventListener(e, resetTimer));
      };
    };

    fetchUserTabs();
  }, []);

  useEffect(() => {
    if (userRole !== "admin") {
      localStorage.setItem("media_active_tab", activeTab);
    }
  }, [activeTab, userRole]);

  const handleLogout = () => {
    localStorage.removeItem("session_token");
    localStorage.removeItem("media_active_tab");
    window.location.href = "/login";
  };

  if (loading) return <div className="loading-screen">⏳ Inapakia dashibodi yako...</div>;

  return (
    <div className="media-dashboard">
      <aside className="sidebar">
        <div>
          <h2 className="sidebar-title">🎧 Media Center</h2>
          {allTabs
            .filter((tab) => allowedTabs.includes(tab.key))
            .map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`sidebar-btn ${activeTab === tab.key ? "active" : ""}`}
              >
                {tab.label}
              </button>
            ))}
        </div>

        <button
          onClick={handleLogout}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={`logout-btn ${hovered ? "hovered" : ""}`}
        >
          🚪 Toka / Logout
        </button>
      </aside>

      <main className="main-content">
        <h1 className="main-title">🕊️ Dashibodi ya Vyombo vya Habari</h1>
        {allTabs
          .filter((tab) => tab.key === activeTab && allowedTabs.includes(tab.key))
          .map((tab) => {
            const Component = tab.component;
            return tab.key === "profile" && userId !== null ? (
              <Component key={tab.key} userId={userId} />
            ) : (
              <Component key={tab.key} />
            );
          })}
      </main>
    </div>
  );
}
