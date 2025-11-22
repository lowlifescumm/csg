"use client";
import Link from "next/link";
import Card from "@/components/ui/Card";

const events = [
  { name: "Full Moon in Taurus", date: "Nov 15" },
  { name: "Mercury Retrograde Ends", date: "Nov 18" },
  { name: "Venus Enters Sagittarius", date: "Nov 22" },
  { name: "New Moon in Gemini", date: "Nov 29" },
];

export default function CosmicEventsCard() {
  return (
    <Card size="sm">
      <h3 className="text-white font-semibold text-sm mb-3">Cosmic Events</h3>
      <div className="space-y-2.5 mb-3">
        {events.map((event, index) => (
          <div key={index} className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--accent-1)' }} aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs truncate">{event.name}</p>
            </div>
            <span className="text-xs flex-shrink-0" style={{ color: 'var(--muted-text)' }}>{event.date}</span>
          </div>
        ))}
      </div>
      <Link
        href="/calendar"
        className="gradient-button block text-center px-3 py-1.5 text-xs rounded-full smooth-transition relative"
        style={{ color: '#ffffff' }}
      >
        <span className="relative z-10">View Calendar</span>
      </Link>
    </Card>
  );
}

