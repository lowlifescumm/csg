"use client";

import Link from "next/link";
import { Home, Server } from "lucide-react";

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cosmic-void flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10">
            <Server className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 font-playfair">
            Server Error
          </h1>
          <p className="text-cosmic-lavender/80 mb-8">
            Our servers are experiencing cosmic interference. Please try again in a moment.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-cosmic-violet/30 text-white font-semibold hover:bg-cosmic-violet/50 transition-all border border-cosmic-violet/30"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-cosmic-gold text-cosmic-void font-semibold hover:bg-cosmic-gold/90 transition-all"
            >
              <Home className="w-5 h-5" />
              Return Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
