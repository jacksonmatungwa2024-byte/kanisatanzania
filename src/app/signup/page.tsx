"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import "./signup.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SignupPage: React.FC = () => {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const form = e.currentTarget;
    const password = (form.elements.namedItem("password") as HTMLInputElement)?.value.trim();
    const full_name = (form.elements.namedItem("full_name") as HTMLInputElement)?.value.trim();
    const role = (form.elements.namedItem("role") as HTMLSelectElement)?.value.trim();
    const branch = (form.elements.namedItem("branch") as HTMLInputElement)?.value.trim();
    const username = (form.elements.namedItem("username") as HTMLInputElement)?.value.trim();
    const phone = (form.elements.namedItem("phone") as HTMLInputElement)?.value.trim();

    if (!password || !full_name || !role || !username) {
      setMessage("⚠️ Tafadhali jaza taarifa zote muhimu.");
      setLoading(false);
      return;
    }

    try {
      // Call API to insert user
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          full_name,
          role,
          branch,
          username,
          phone,
          profileUrl: null, // No profile picture
        }),
      });

      const data = await res.json();
      if (data.error) {
        setMessage(`❌ Usajili haukufanikiwa: ${data.error}`);
      } else {
        localStorage.setItem("session_token", data.token);
        setMessage("✅ Usajili umefanikiwa! Unaelekezwa...");
        setTimeout(() => router.push("/home"), 1500);
      }
    } catch (err: any) {
      setMessage(`❌ Tatizo: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-wrapper">
      <h2>📝 Sajili Akaunti Mpya</h2>

      <form onSubmit={handleSignup}>
        <label>👤 Jina Kamili:</label>
        <input type="text" id="full_name" name="full_name" required />

        <label>🆔 Jina la Mtumiaji:</label>
        <input type="text" id="username" name="username" required />

        <label>🔑 Nenosiri:</label>
        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            required
          />
          <button
            type="button"
            className="toggle-btn"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        <label>📞 Simu:</label>
        <input type="text" id="phone" name="phone" />

        <label>🎯 Nafasi:</label>
        <select id="role" name="role" required>
          <option value="">-- Chagua Nafasi --</option>
          <option value="usher">Mhudumu</option>
          <option value="pastor">Mchungaji</option>
          <option value="media">Media</option>
          <option value="finance">Fedha</option>
        </select>

        <label>📍 Tawi:</label>
        <input type="text" id="branch" name="branch" />

        <button type="submit" disabled={loading}>
          {loading ? "⌛ Inasajili..." : "📝 Sajili"}
        </button>
      </form>

      <div className="signup-message">{message}</div>
    </div>
  );
};

export default SignupPage;
