"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginMessage("");

    const form = e.target as HTMLFormElement;
    const username = form.username.value.trim();
    const password = form.password.value.trim();

    if (!username || !password) {
      setLoginMessage("❌ Tafadhali jaza taarifa zote");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setLoginMessage(`❌ ${data.error || "Login imeshindikana"}`);
        setLoading(false);
        return;
      }

      // ✅ Login success
      setLoginMessage("✅ Inakuelekeza...");

      // Hapa unaweza kupitisha user info kwa njia rahisi (mfano query string)
      // kwa kuwa hutaki cookies/localStorage
      const { username: u, fullName, role, phone } = data.user;

      setTimeout(() => {
        router.replace(
          `/home?username=${encodeURIComponent(u)}&name=${encodeURIComponent(
            fullName
          )}&role=${encodeURIComponent(role)}&phone=${encodeURIComponent(phone)}`
        );
      }, 500);
    } catch {
      setLoginMessage("❌ Hitilafu ya mtandao. Jaribu tena.");
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <form className="login-box" onSubmit={handleSubmit}>
        <h2>Karibu 👋</h2>

        <label>Username</label>
        <input
          type="text"
          name="username"
          placeholder="Weka username"
          autoComplete="username"
          required
        />

        <label>Password</label>
        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Weka password"
            autoComplete="current-password"
            required
          />

          <span
            className="pw-toggle"
            onClick={() => setShowPassword(!showPassword)}
            style={{ cursor: "pointer" }}
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "⏳ Inapakia..." : "🚪 Ingia"}
        </button>
      </form>

      {loginMessage && <div className="status">{loginMessage}</div>}
    </div>
  );
}
