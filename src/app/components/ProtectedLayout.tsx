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

    // Small delay to ensure token is set by login page
    const timeoutId = setTimeout(() => {
      const token = localStorage.getItem("session_token");

      if (!token) {
        logoutAndRedirect();
        return;
      }

      const verifyToken = async () => {
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

      verifyToken();
    }, 50); // 50ms delay

    // Multi-tab logout sync
    const handleStorage = () => {
      const t = localStorage.getItem("session_token");
      if (!t) logoutAndRedirect();
    };
    window.addEventListener("storage", handleStorage);

    // Re-verify on window focus (desktop fix)
    const handleFocus = () => {
      const t = localStorage.getItem("session_token");
      if (!t) logoutAndRedirect();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
    };
  }, [router]);

  if (loading) return <div>Loading...</div>;

  return <>{children}</>;
}
