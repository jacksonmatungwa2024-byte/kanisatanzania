"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  children: ReactNode;
}

export default function ProtectedLayout({ children }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const logoutAndRedirect = () => {
    localStorage.clear();
    sessionStorage.clear();
    router.replace("/login");
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("session_token");

    // No token → redirect
    if (!token) {
      logoutAndRedirect();
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch("/api/check-session", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (!res.ok) {
          logoutAndRedirect();
        }
      } catch {
        logoutAndRedirect();
      } finally {
        setLoading(false);
      }
    };

    verify();

    // 🔄 Multi-tab logout sync
    const syncLogout = () => {
      const t = localStorage.getItem("session_token");
      if (!t) logoutAndRedirect();
    };
    window.addEventListener("storage", syncLogout);

    // 🔄 Re-verify on window focus (desktop fix)
    const onFocus = () => {
      const t = localStorage.getItem("session_token");
      if (!t) logoutAndRedirect();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("storage", syncLogout);
      window.removeEventListener("focus", onFocus);
    };
  }, [router]);

  if (loading) return <div>Loading...</div>;

  return <>{children}</>;
}
