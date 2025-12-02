"use client";

import { useEffect } from "react";

export default function Logout() {
  useEffect(() => {
    const token = localStorage.getItem("session_token");

    if (token) {
      // Call backend to clear DB session
      fetch("/api/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    // Remove token from localStorage
    localStorage.removeItem("session_token");
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>👋 Umetoka</h1>
      <p>
        Akaunti yako imefungwa. Tafadhali anza tena safari yako kutoka
        ukurasa wa nyumbani.
      </p>
      <a href="/" style={{ color: "blue", textDecoration: "underline" }}>
        Rudi Nyumbani
      </a>
    </div>
  );
}
