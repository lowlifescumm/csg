"use client";

import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cosmic-void flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-cosmic-violet/20">
          <Search className="w-10 h-10 text-cosmic-gold" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2 font-playfair">
          Page Not Found
        </h1>
        <p className="text-cosmic-lavender/80 mb-8">
          The stars have not aligned for this page. It may have moved or never existed in this universe.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-cosmic-gold text-cosmic-void font-semibold hover:bg-cosmic-gold/90 transition-all"
        >
          <Home className="w-5 h-5" />
          Return Home
        </Link>
      </div>
    </div>
  );
}
