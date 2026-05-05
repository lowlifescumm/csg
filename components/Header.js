"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { Menu, X, Home, LayoutDashboard, BookOpen, Sparkles, User, LogOut, CreditCard, Coins } from "lucide-react";
import { Logo } from "./Logo";

export default function Header() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/user");
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    if (typeof window !== "undefined") {
      handleScroll();
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isActive = (path) => {
    if (path === "/" && pathname !== "/") return false;
    return pathname === path || pathname.startsWith(path + "/");
  };

  const navigation = [
    { name: "Home", href: "/", icon: Home },
    { name: "Services", href: "/services", icon: Sparkles },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, auth: true },
    { name: "Blog", href: "/blog", icon: BookOpen },
    { name: "Forecasts", href: "/forecasts", icon: Sparkles, auth: true },
  ];

  const filteredNav = (!user ? [...navigation, { name: "Log In", href: "/login" }, { name: "Start Free Reading", href: "/login" }] : navigation).filter((item) => !item.auth || user);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-cosmic-void/90 backdrop-blur-lg border-b border-cosmic-violet/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>

          <nav className="hidden lg:flex items-center space-x-1">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                    isActive(item.href)
                      ? "text-cosmic-gold bg-cosmic-gold/10"
                      : "text-cosmic-lavender hover:text-white hover:bg-white/5"
                  }`}
                >
                  {Icon ? <Icon className="w-4 h-4" /> : null}
                  <span className="whitespace-nowrap">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center space-x-2 lg:space-x-3">
            {user ? (
              <>
                <Link
                  href="/pricing"
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm bg-cosmic-gold text-cosmic-void hover:bg-cosmic-gold/90 transition-all"
                >
                  <Coins className="w-4 h-4" />
                  <span>Get Credits</span>
                </Link>
                <Link
                  href="/subscription"
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm border border-cosmic-violet/30 text-cosmic-lavender hover:bg-cosmic-violet/10 transition-all"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Premium</span>
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm text-cosmic-lavender hover:text-white transition-all"
                >
                  <User className="w-4 h-4" />
                  <span>{user.firstName || user.email?.split("@")[0]}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm text-cosmic-lavender hover:text-red-400 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg font-medium text-sm text-cosmic-lavender hover:text-white transition-all"
                >
                  Log In
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg font-medium text-sm bg-cosmic-gold text-cosmic-void hover:bg-cosmic-gold/90 transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="lg:hidden p-2 text-cosmic-lavender hover:text-white"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-white/10 animate-fade-in max-h-[calc(100vh-80px)] overflow-y-auto">
            <nav className="flex flex-col space-y-2">
              {filteredNav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                      isActive(item.href)
                        ? "text-cosmic-gold bg-cosmic-gold/10"
                        : "text-cosmic-lavender hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {Icon ? <Icon className="w-5 h-5" /> : null}
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              {user ? (
                <>
                  <Link
                    href="/pricing"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium bg-cosmic-gold text-cosmic-void"
                  >
                    <Coins className="w-5 h-5" />
                    <span>Get Credits</span>
                  </Link>
                  <Link
                    href="/subscription"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium border border-cosmic-violet/30 text-cosmic-lavender hover:bg-cosmic-violet/10"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Premium</span>
                  </Link>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-cosmic-lavender hover:text-white"
                  >
                    <User className="w-5 h-5" />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-cosmic-lavender hover:text-red-400"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Log Out</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2 pt-2 border-t border-white/10">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-lg font-medium text-cosmic-lavender hover:text-white hover:bg-white/5"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-lg font-medium text-center bg-cosmic-gold text-cosmic-void"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
