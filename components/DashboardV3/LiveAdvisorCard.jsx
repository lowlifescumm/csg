"use client";
import { Users } from "lucide-react";
import Link from "next/link";
import Card from "@/components/ui/Card";

export default function LiveAdvisorCard() {
  return (
    <Card size="sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--accent-1), var(--accent-2))' }}>
          <Users className="w-5 h-5 text-white" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm truncate">Luna Martinez</h3>
          <p className="text-xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0"></span>
            <span style={{ color: 'var(--muted-text)' }}>Online</span>
          </p>
        </div>
      </div>
      <Link
        href="/live-advisors"
        className="gradient-button block w-full text-center px-3 py-2 text-xs font-semibold rounded-full smooth-transition relative"
        style={{ color: '#ffffff' }}
      >
        <span className="relative z-10">Start Live Chat</span>
      </Link>
    </Card>
  );
}

