"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import styles from "./Usher1.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type UsherProfileProps = {
  onClose: () => void;
};

export default function UsherProfile({ onClose }: UsherProfileProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const email = sessionData?.session?.user?.email;

    if (!email) {
      setUser(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (!error && data) setUser(data);
    setLoading(false);
  };

  if (loading) return <p className={styles.loading}>⏳ Loading profile...</p>;
  if (!user)
    return <p className={styles.error}>🚫 Hakuna taarifa za mtumiaji.</p>;

  return (
    <div className={styles.container}>
      <button onClick={onClose} className={styles.closeBtn}>
        ← Rudi Nyumbani
      </button>

      <h2 className={styles.header}>🙋 Karibu {user.full_name}</h2>
      <div className={styles.card}>
        <img
          src={user.profile_url || "default-profile.png"}
          alt="Profile"
          className={styles.avatar}
        />
        <div className={styles.info}>
          <p>
            <strong>📧 Email:</strong> {user.email}
          </p>
          <p>
            <strong>📞 Simu:</strong> {user.phone || "—"}
          </p>
          <p>
            <strong>🧑‍💼 Nafasi:</strong> {user.role}
          </p>
          <p>
            <strong>🌿 Tawi:</strong> {user.branch || "—"}
          </p>
          <p>
            <strong>🧠 Bio:</strong> {user.bio || "—"}
          </p>
          <p>
            <strong>🕒 Membership:</strong>{" "}
            {new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
