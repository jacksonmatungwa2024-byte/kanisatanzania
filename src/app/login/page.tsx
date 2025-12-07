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

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setLoginMessage(`❌ ${data.error || "Login failed"}`);
        setLoading(false);
        return;
      }

      // COOKIE IMESHASETWA BY API — NO LOCALSTORAGE
      setLoginMessage("✅ Inakuelekeza...");
      router.replace("/home"); // FASTER than push()

    } catch (err: any) {
      setLoginMessage("❌ Hitilafu ya mtandao: " + err.message);
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
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Weka password"
            required
          />
          <span onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        <button disabled={loading}>
          {loading ? "⏳ Inapakia..." : "🚪 Ingia"}
        </button>
      </form>

      {loginMessage && <div className="status">{loginMessage}</div>}
    </div>
  );
}
