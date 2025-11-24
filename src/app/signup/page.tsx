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
  const [pendingUser, setPendingUser] = useState<string | null>(null);
  const [token, setToken] = useState("");

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const form = e.currentTarget;
    const password = (form.elements.namedItem("password") as HTMLInputElement)?.value.trim();
    const fullName = (form.elements.namedItem("full_name") as HTMLInputElement)?.value.trim();
    const role = (form.elements.namedItem("role") as HTMLSelectElement)?.value.trim();
    const branch = (form.elements.namedItem("branch") as HTMLInputElement)?.value.trim();
    const username = (form.elements.namedItem("username") as HTMLInputElement)?.value.trim();
    const phone = (form.elements.namedItem("phone") as HTMLInputElement)?.value.trim();
    const profileFile = (form.elements.namedItem("profile_file") as HTMLInputElement)?.files?.[0];

    if (!password || !fullName || !role || !username || !profileFile) {
      setMessage("⚠️ Tafadhali jaza taarifa zote muhimu na weka picha ya profile.");
      setLoading(false);
      return;
    }

    try {
      // Upload profile picture
      const fileExt = profileFile.name.split(".").pop();
      const fileName = `${Date.now()}-${username}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, profileFile);

      if (uploadError) {
        setMessage(`❌ Picha haijapakiwa: ${uploadError.message}`);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(filePath);

      const profileUrl = urlData?.publicUrl;

      // Call API route
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          full_name: fullName,
          role,
          branch,
          username,
          phone,
          profileUrl,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setMessage(`❌ Usajili haukufanikiwa: ${data.error}`);
      } else {
        if (role === "admin") {
          // Admin → show OTP form
          setPendingUser(username);
          setMessage("🔐 Ingiza OTP ya admin ili kuthibitisha.");
        } else {
          localStorage.setItem("session_token", data.token);
          setMessage("✅ Usajili umefanikiwa! Unaelekezwa...");
          setTimeout(() => router.push("/home"), 1500);
        }
      }
    } catch (err: any) {
      setMessage(`❌ Tatizo: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;

    setLoading(true);
    try {
      // Fetch OTP from backend
      const otpRes = await fetch("/api/generate-otp-json?password=2021");
      const otpData = await otpRes.json();

      if (!otpData.otp) {
        setMessage("⚠️ OTP haikupatikana!");
        setLoading(false);
        return;
      }

      if (token !== otpData.otp) {
        setMessage("❌ OTP si sahihi!");
      } else {
        // Verify success
        const res = await fetch("/api/verify-2fa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: pendingUser, token }),
        });
        const data = await res.json();
        if (data.error) {
          setMessage(`❌ Verification failed: ${data.error}`);
        } else {
          localStorage.setItem("session_token", data.token);
          setMessage("✅ 2FA imefanikiwa! Unaelekezwa...");
          setTimeout(() => router.push("/home"), 1500);
        }
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

      {!pendingUser ? (
        <form onSubmit={handleSignup}>
          {/* signup form fields */}
        </form>
      ) : (
        <div className="verify-2fa">
          <h3>🔐 Thibitisha OTP</h3>
          <form onSubmit={handleVerify2FA}>
            <label>Ingiza OTP:</label>
            <input
              type="number"
              inputMode="numeric"
              pattern="\d{6}"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
            <button type="submit" disabled={loading || token.length !== 6}>
              {loading ? "⌛ Inathibitisha..." : "✅ Thibitisha"}
            </button>
          </form>
        </div>
      )}

      <div className="signup-message">{message}</div>
    </div>
  );
};

export default SignupPage;
