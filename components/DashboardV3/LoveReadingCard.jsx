"use client";
import { Heart } from "lucide-react";
import Link from "next/link";
import Card from "@/components/ui/Card";

export default function LoveReadingCard() {
  return (
    <Card size="md">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-400" />
          <h3 className="text-white font-semibold">Love Reading</h3>
        </div>
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-pink-500/20 text-pink-200">
          Today
        </span>
      </div>
      <p className="text-purple-200 text-sm mb-4">Venus aligns with your heart chakra</p>
      <Link 
        href="/dashboard#tarot-section"
        className="text-purple-300 hover:text-purple-200 text-sm font-medium smooth-transition"
      >
        View Details &gt;
      </Link>
    </Card>
  );
}

