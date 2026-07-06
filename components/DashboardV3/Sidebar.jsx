"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useCallback } from "react";
import { apiClient } from '@/lib/api-client';
import { useApiClientWithToast } from "@/src/hooks/useApiClientWithToast";
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

export default function Sidebar({ user, onLinkClick }) {
  const pathname = usePathname();
  const userName = user?.firstName || user?.email?.split("@")[0] || "there";

  // Close mobile sidebar when pathname changes
  useEffect(() => {
    if (onLinkClick && typeof window !== 'undefined' && window.innerWidth < 768) {
      onLinkClick();
    }
  }, [pathname, onLinkClick]);

  // API hook for logout - disabled initially, triggered by refetch
  const { loading: isLoggingOut, refetch: logout } = useApiClientWithToast(
    apiClient,
    useCallback(
      (c) => c.post("/api/auth/logout", {}, { timeout: 15000 }),
      []
    ),
    [],
    { 
      enabled: false,
      toastMessages: { error: "Could not log out. Please try again." },
      onSuccess: () => {
        window.location.href = "/login";
      }
    }
  );

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard", label: "Tarot Reading", icon: Sparkles },
    { href: "/birth-chart", label: "Birth Chart", icon: Star },
    { href: "/compatibility", label: "Compatibility", icon: Heart },
    // Meditation temporarily hidden
    // { href: "/coach", label: "Meditation", icon: Brain },
    { href: "/journal", label: "Spiritual Journal", icon: BookOpen },
    { href: "/coach", label: "Live Advisors", icon: MessageCircle, comingSoon: true },
  ];

  const isActive = (href) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="w-full md:w-64 h-full flex flex-col bg-cosmic-void/90 rounded-2xl p-4 sm:p-6 shadow-lg border border-cosmic-gold/15 backdrop-blur-md">
      {/* Header */}
      <div className="mb-4 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-cosmic-lavender mb-1 sm:mb-2">Cosmic Guide</h2>
        <p className="text-xs sm:text-sm text-cosmic-taupe">Welcome back, {userName}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 sm:space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (onLinkClick && typeof window !== 'undefined' && window.innerWidth < 768) {
                  onLinkClick();
                }
              }}
              className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl smooth-transition text-sm sm:text-base ${
                active
                  ? "bg-gradient-to-r from-cosmic-rose to-cosmic-purple text-white"
                  : "text-cosmic-taupe hover:bg-cosmic-gold/10"
              }`}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="font-medium truncate">{item.label}</span>
              {item.comingSoon && (
                <span className="ml-auto text-xs text-cosmic-gold bg-cosmic-gold/15 px-2 py-0.5 rounded-full">
                  Coming Soon
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-4 sm:pt-6 border-t border-cosmic-gold/15 space-y-1 sm:space-y-2">
        <Link
          href="/profile"
          onClick={() => {
            if (onLinkClick && typeof window !== 'undefined' && window.innerWidth < 768) {
              onLinkClick();
            }
          }}
          className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl smooth-transition text-sm sm:text-base ${
            pathname === "/profile"
              ? "bg-gradient-to-r from-cosmic-rose to-cosmic-purple text-white"
              : "text-cosmic-taupe hover:bg-cosmic-gold/10"
          }`}
        >
          <Settings className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          <span className="font-medium truncate">Settings</span>
        </Link>
        <button
          onClick={() => {
            if (onLinkClick && typeof window !== 'undefined' && window.innerWidth < 768) {
              onLinkClick();
            }
            handleLogout();
          }}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-cosmic-taupe hover:bg-cosmic-gold/10 smooth-transition text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          <span className="font-medium truncate">{isLoggingOut ? "Logging out..." : "Log Out"}</span>
        </button>
      </div>
    </div>
  );
}
