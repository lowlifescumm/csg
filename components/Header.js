"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { Menu, X, Home, LayoutDashboard, BookOpen, Sparkles, User, LogOut, CreditCard, Coins } from "lucide-react";

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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-lg shadow-lg shadow-black/5 border-b border-gray-200/50"
          : "bg-white/90 backdrop-blur-md border-b border-gray-200/30"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="flex flex-col"><span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent leading-tight">Cosmic Spirit Guide</span></div>
          </Link>

          <nav className="hidden lg:flex items-center space-x-1">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 lg:px-4 py-2 rounded-lg font-medium text-xs lg:text-sm transition-all duration-200 ${
                    isActive(item.href)
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-100 hover:text-purple-600"
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
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg"
                >
                  <Coins className="w-4 h-4" />
                  <span>Get Credits</span>
                </Link>
                <Link
                  href="/subscription"
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600 transition-all shadow-md hover:shadow-lg"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Premium</span>
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm text-gray-700 hover:bg-gray-100 transition-all"
                >
                  <User className="w-4 h-4" />
                  <span>{user.firstName || user.email?.split("@")[0]}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm text-gray-700 hover:bg-gray-100 hover:text-red-600 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg font-medium text-sm text-gray-700 hover:bg-gray-100 transition-all"
                >
                  Login
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg font-medium text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200/50 animate-fade-in max-h-[calc(100vh-80px)] overflow-y-auto">
            <nav className="flex flex-col space-y-2">
              {filteredNav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all ${
                      isActive(item.href)
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        : "text-gray-700 hover:bg-gray-100"
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
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  >
                    <Coins className="w-5 h-5" />
                    <span>Get Credits</span>
                  </Link>
                  <Link
                    href="/subscription"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium bg-gradient-to-r from-yellow-400 to-orange-500 text-white"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Premium</span>
                  </Link>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <User className="w-5 h-5" />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-100 hover:text-red-600 text-left w-full"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2 pt-2 border-t border-gray-200/50">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-lg font-medium text-center text-gray-700 hover:bg-gray-100"
                  >
                    Login
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-lg font-medium text-center bg-gradient-to-r from-purple-500 to-pink-500 text-white"
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











