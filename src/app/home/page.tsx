"use client";

import { Suspense } from "react";
import Dashboard from "@/app/components/Dashboard";

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <Dashboard />
    </Suspense>
  );
}
