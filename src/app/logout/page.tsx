"use client";

import { useEffect } from "react";

export default function Logout() {
  useEffect(() => {
    // call backend logout to clear cookie + DB session
    fetch("/api/logout", { method: "POST", credentials: "include" });
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>👋 Umetoka</h1>
      <p>
        Cookie yako ya ufikiaji imefutwa. Tafadhali anza tena safari yako kutoka
        ukurasa wa nyumbani.
      </p>
      <a href="/" style={{ color: "blue", textDecoration: "underline" }}>
        Rudi Nyumbani
      </a>
    </div>
  );
}
