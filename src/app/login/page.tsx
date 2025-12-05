"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { initNetworkStatus } from "../../utils/networkStatus";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState("");

  // Network status watcher
  useEffect(() => {
    initNetworkStatus((status) => {
      setToast(status);
      setTimeout(() => setToast(""), 4000);
    });
  }, []);

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

      if (data.error) {
        setLoginMessage(`❌ ${data.error}`);
      } else if (data.token) {
        // 🟢 SAVE SESSION TOKEN TO localStorage
        localStorage.setItem("session_token", data.token);

        // Confirm token is saved
        console.log("Saved session_token:", localStorage.getItem("session_token"));

        setLoginMessage("✅ Inakuelekeza...");

        // Small delay to ensure ProtectedLayout reads token properly
        setTimeout(() => {
          router.push("/home");
        }, 300);
      } else {
        setLoginMessage("❌ Hitilafu: token haipo kwenye response");
      }
    } catch (err: any) {
      setLoginMessage("❌ Hitilafu ya mtandao: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {toast && <div className="toast">{toast}</div>}

      <form className="login-box" onSubmit={handleSubmit}>
        <h2>Karibu 👋</h2>
        <p>Ingia kwenye akaunti yako</p>

        <label>Jina la Mtumiaji</label>
        <input
          type="text"
          name="username"
          placeholder="Weka username"
          required
        />

        <label>Nenosiri</label>
        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Weka nenosiri"
            required
          />
          <span onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        <button disabled={loading}>
          {loading ? "⏳ Inapakia..." : "🚪 Ingia"}
        </button>

        <button type="button" onClick={() => router.push("/signup")}>
          📝 Jisajili
        </button>

        <button
          type="button"
          className="help-btn"
          onClick={() => router.push("/chatbot")}
        >
          🤖 Msaada ChatBot
        </button>

        {loginMessage && <div className="status">{loginMessage}</div>}

        <footer className="system-footer">
          <p>
            🙌 Mfumo huu umetengenezwa na <br />
            <strong>Abel Memorial Programmers</strong> <br />
            kwa ushirikiano na <br />
            <strong>Kitengo cha Usimamizi wa Rasilimali na Utawala – Tanga Quarters</strong>
          </p>
        </footer>
      </form>
    </div>
  );
}
