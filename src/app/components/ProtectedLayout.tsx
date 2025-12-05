"use client";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Props { children: ReactNode; }

export default function ProtectedLayout({ children }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    router.replace("/login");
  };

  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem("session_token");
      if (!token) return logout();

      const res = await fetch("/api/check-session", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) logout();
      else setLoading(false);
    };

    verifySession();

    const syncLogout = () => {
      const t = localStorage.getItem("session_token");
      if (!t) logout();
    };

    window.addEventListener("storage", syncLogout);
    window.addEventListener("focus", verifySession);

    return () => {
      window.removeEventListener("storage", syncLogout);
      window.removeEventListener("focus", verifySession);
    };
  }, [router]);

  if (loading) return <div>Loading...</div>;
  return <>{children}</>;
}
