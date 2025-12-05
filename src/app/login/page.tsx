"use client";
import React, { useState, useEffect } from "react";
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

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.error) setLoginMessage(`❌ ${data.error}`);
      else {
        localStorage.setItem("session_token", data.token);
        setLoginMessage("✅ Inakuelekeza...");
        setTimeout(() => router.push("/home"), 700);
      }
    } catch (err: any) {
      setLoginMessage("❌ Hitilafu ya mtandao: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <form className="login-box" onSubmit={handleSubmit}>
        <h2>Karibu 👋</h2>
        <label>Username</label>
        <input type="text" name="username" placeholder="Weka username" required />
        <label>Password</label>
        <div className="password-wrapper">
          <input type={showPassword ? "text" : "password"} name="password" placeholder="Weka password" required />
          <span onClick={() => setShowPassword(!showPassword)}>{showPassword ? "🙈" : "👁️"}</span>
        </div>
        <button disabled={loading}>{loading ? "⏳ Inapakia..." : "🚪 Ingia"}</button>
      </form>
      {loginMessage && <div className="status">{loginMessage}</div>}
    </div>
  );
}
