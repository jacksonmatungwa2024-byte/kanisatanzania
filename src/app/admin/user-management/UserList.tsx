"use client";

import React, { useState } from "react";
import CountryCodeSelector from "./CountryCodeSelector";

interface UserListProps {
  users: any[];
  onDelete: (userId: number, email: string) => void;
  onGenerateOtp: (userId: number, phoneNumberWithCode: string, currentMeta: any) => void;
  onApprove: (userId: number, currentMeta: any) => void;
  saving: boolean;
}

export default function UserList({ users, onDelete, onGenerateOtp, onApprove, saving }: UserListProps) {
  const [selectedCodes, setSelectedCodes] = useState<{ [key: number]: string }>({});
  const [phoneNumbers, setPhoneNumbers] = useState<{ [key: number]: string }>({});

  return (
    <div>
      {users.map((user) => {
        const status = user.metadata?.reset_status;
        const otpExists = user.metadata?.password_reset_otp;
        const code = selectedCodes[user.id] || "+255";
        const phone = phoneNumbers[user.id] || "";

        return (
          <div key={user.id} className="user-card">
            <div>{user.full_name} ({user.role})</div>
            <div>{user.email}</div>
            <div>Status: {status || "✅ Active"}</div>

            <div className="otp-section">
              <CountryCodeSelector
                value={code}
                onChange={(newCode) => setSelectedCodes(prev => ({ ...prev, [user.id]: newCode }))}
              />
              <input
                type="text"
                placeholder="Namba ya WhatsApp"
                value={phone}
                onChange={(e) => setPhoneNumbers(prev => ({ ...prev, [user.id]: e.target.value }))}
              />
              <button
                onClick={() => {
                  if (!phone) {
                    alert("⚠️ Tafadhali weka namba ya WhatsApp.");
                    return;
                  }
                  onGenerateOtp(user.id, code + phone, user.metadata || {});
                }}
                disabled={saving}
              >
                📲 Tuma OTP
              </button>
              {status === "waiting_approval" && otpExists && (
                <button
                  onClick={() => onApprove(user.id, user.metadata || {})}
                  disabled={saving}
                >
                  ✅ Thibitisha OTP
                </button>
              )}
            </div>

            <button onClick={() => onDelete(user.id, user.email)} disabled={saving}>
              🗑️ Futa Mtumiaji
            </button>
          </div>
        );
      })}
    </div>
  );
}
