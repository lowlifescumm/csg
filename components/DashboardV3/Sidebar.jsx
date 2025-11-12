"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Sparkles, 
  Star, 
  Heart, 
  Brain, 
  BookOpen, 
  MessageCircle, 
  Settings, 
  LogOut 
} from "lucide-react";

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const userName = user?.firstName || user?.email?.split("@")[0] || "there";

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard", label: "Tarot Reading", icon: Sparkles },
    { href: "/birth-chart", label: "Birth Chart", icon: Star },
    { href: "/compatibility", label: "Compatibility", icon: Heart },
    { href: "/coach", label: "Meditation", icon: Brain },
    { href: "/journal", label: "Spiritual Journal", icon: BookOpen },
    { href: "/coach", label: "Live Advisors", icon: MessageCircle },
  ];

  const isActive = (href) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="w-64 h-full flex flex-col glassmorphic rounded-2xl p-6 border border-white border-opacity-40">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-2">Cosmic Guide</h2>
        <p className="text-sm text-purple-200">Welcome back, {userName}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl smooth-transition ${
                active
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "text-purple-200 hover:bg-white hover:bg-opacity-10"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-6 border-t border-white border-opacity-20 space-y-2">
        <Link
          href="/profile"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl smooth-transition ${
            pathname === "/profile"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              : "text-purple-200 hover:bg-white hover:bg-opacity-10"
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-purple-200 hover:bg-white hover:bg-opacity-10 smooth-transition"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
