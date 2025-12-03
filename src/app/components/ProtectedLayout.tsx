"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  children: ReactNode;
}

export default function ProtectedLayout({ children }: Props) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("session_token");

    if (!token) {
      router.replace("/login");
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
          localStorage.clear();
          sessionStorage.clear();
          router.replace("/login");
        }
      } catch (err) {
        localStorage.clear();
        sessionStorage.clear();
        router.replace("/login");
      }
    };

    verifyToken();

    // Prevent browser caching back button
    window.history.replaceState(null, "", window.location.href);
  }, [router]);

  return <>{children}</>;
}
