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
    { name: "Readings", href: "/tarot", icon: Sparkles },
    { name: "Pricing", href: "/pricing", icon: CreditCard },
    { name: "Blog", href: "/blog", icon: BookOpen },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, auth: true },
  ];

  const filteredNav = navigation.filter((item) => !item.auth || user);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 overflow-visible ${
        scrolled 
          ? 'bg-cosmic-indigo/95 backdrop-blur-md shadow-lg shadow-cosmic-midnight/20' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                    isActive(item.href)
                      ? 'text-cosmic-gold bg-cosmic-gold/10'
                      : 'text-white/80 hover:text-cosmic-gold hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="whitespace-nowrap">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right side buttons */}
          <div className="hidden lg:flex items-center space-x-2">
            {user ? (
              <>
                <Link
                  href="/pricing"
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm bg-cosmic-gold text-cosmic-indigo hover:bg-cosmic-gold/90 transition-all"
                >
                  <Coins className="w-4 h-4" />
                  <span>Get Credits</span>
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm text-white hover:text-cosmic-gold transition-all"
                >
                  <User className="w-4 h-4" />
                  <span>{user.firstName || user.email?.split("@")[0]}</span>
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg font-medium text-sm text-white/80 hover:text-white transition-all"
                >
                  Log In
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg font-medium text-sm bg-cosmic-gold text-cosmic-indigo hover:bg-cosmic-gold/90 transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-white/80 hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-white/10 bg-cosmic-indigo/95 backdrop-blur-md">
            <nav className="flex flex-col space-y-2">
              {filteredNav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-sm ${
                      isActive(item.href)
                        ? 'text-cosmic-gold bg-cosmic-gold/10'
                        : 'text-white/80'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              {!user && (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-sm text-white/80"
                  >
                    <User className="w-5 h-5" />
                    <span>Log In</span>
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-sm bg-cosmic-gold text-cosmic-indigo"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>Sign Up</span>
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
