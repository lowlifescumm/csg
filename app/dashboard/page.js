"use client";

import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-cosmic-void flex items-center justify-center">
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cosmic-void pt-20">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-white mb-8">Dashboard Working!</h1>
        <p className="text-white/60">If you see this, the dashboard page is rendering correctly.</p>
      </div>
    </div>
  );
}
