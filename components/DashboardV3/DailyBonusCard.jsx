"use client";
import { Gift } from "lucide-react";
import Link from "next/link";
import Card from "@/components/ui/Card";

export default function DailyBonusCard() {
  return (
    <Card size="md" className="relative">
      <span className="absolute top-4 right-4 px-2 py-1 text-xs font-bold rounded-full bg-yellow-500 text-purple-900">
        NEW
      </span>
      <div className="flex items-center gap-2 mb-2">
        <Gift className="w-5 h-5 text-yellow-400" />
        <h3 className="text-white font-semibold">Daily Bonus</h3>
      </div>
      <p className="text-purple-200 text-sm mb-4">Claim your free reading</p>
      <Link 
        href="/dashboard#tarot-section"
        className="text-purple-300 hover:text-purple-200 text-sm font-medium smooth-transition"
      >
        Claim Now &gt;
      </Link>
    </Card>
  );
}

