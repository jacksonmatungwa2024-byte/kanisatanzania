"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    const logoutUser = async () => {
      try {
        const token = localStorage.getItem("session_token");

        if (token) {
          // Call backend to clear all sessions
          const res = await fetch("/api/logout", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!res.ok) {
            console.error("Logout failed:", await res.json());
          }
        }

        // Clear localStorage and sessionStorage
        localStorage.clear();
        sessionStorage.clear();

        // Redirect automatically to login or home page
        router.replace("/login"); // or "/" if you prefer home
      } catch (err) {
        console.error("Logout error:", err);
      }
    };

    logoutUser();
  }, [router]);

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>👋 Umetoka</h1>
      <p>Akaunti yako imefungwa. Tafadhali anza tena safari yako kutoka ukurasa wa nyumbani.</p>
      <a href="/" style={{ color: "blue", textDecoration: "underline" }}>
        Rudi Nyumbani
      </a>
    </div>
  );
}
