"use client";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  children: ReactNode;
}

export default function ProtectedLayout({ children }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const TOKEN_KEY = "session_token";

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    router.replace("/login");
  };

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return logout();

      try {
        const res = await fetch("/api/check-session", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          logout();
          return;
        }

        if (isMounted) setLoading(false);
      } catch {
        logout();
      }
    };

    verifySession();

    const syncLogout = () => {
      if (!localStorage.getItem(TOKEN_KEY)) logout();
    };

    window.addEventListener("storage", syncLogout);
    window.addEventListener("focus", verifySession);

    return () => {
      isMounted = false;
      window.removeEventListener("storage", syncLogout);
      window.removeEventListener("focus", verifySession);
    };
  }, []);

  if (loading) return <div>Loading...</div>;
  return <>{children}</>;
}
