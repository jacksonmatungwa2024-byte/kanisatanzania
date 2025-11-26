"use client";

import { useState } from "react";
import CountryCodeSelector from "./CountryCodeSelector";

interface UserCardProps {
  user: any;
  onDelete: (id: number, username: string) => void; // 👈 sasa username
  onGenerateOtp: (id: number, username: string, countryCode: string) => void; // 👈 sasa username
  onApprove: (id: number) => void;
  saving: boolean;
}

export default function UserCard({ user, onDelete, onGenerateOtp, onApprove, saving }: UserCardProps) {
  const [countryCode, setCountryCode] = useState("+255");

  return (
    <div className="user-card">
      <div className="name">{user.full_name} ({user.role})</div>
      <div className="username">👤 {user.username}</div> {/* 👈 onyesha username */}
      <div className="status">🔐 Status: {user.metadata?.reset_status || "✅ Active"}</div>

      <CountryCodeSelector value={countryCode} onChange={setCountryCode} />

      <div className="action-buttons">
        <button onClick={() => onDelete(user.id, user.username)} disabled={saving}>
          🗑️ Futa Mtumiaji
        </button>
        <button onClick={() => onGenerateOtp(user.id, user.username, countryCode)} disabled={saving}>
          🔐 Tuma OTP
        </button>
        {user.metadata?.reset_status === "waiting_approval" && (
          <button onClick={() => onApprove(user.id)} disabled={saving}>
            ✅ Thibitisha OTP
          </button>
        )}
      </div>
    </div>
  );
}
