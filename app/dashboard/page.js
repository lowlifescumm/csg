"use client";

import { useState, useEffect, Component } from "react";
import { apiClient } from "@/lib/api-client";
import DashboardLayoutShell from "@/components/DashboardLayoutShell";
import DashboardV3 from "@/components/DashboardV3";
import LoadingSkeleton from "@/components/LoadingSkeleton";

// GSTA-399: Redirect loop prevention
const REDIRECT_GUARD_KEY = "dashboard_redirect_guard";
const REDIRECT_THRESHOLD = 2;
const REDIRECT_WINDOW_MS = 30_000;

function checkRedirectGuard() {
  try {
    const raw = sessionStorage.getItem(REDIRECT_GUARD_KEY);
    if (!raw) return { count: 0, firstTs: 0 };
    const { count, firstTs } = JSON.parse(raw);
    if (Date.now() - firstTs > REDIRECT_WINDOW_MS) {
      sessionStorage.removeItem(REDIRECT_GUARD_KEY);
      return { count: 0, firstTs: 0 };
    }
    return { count, firstTs };
  } catch {
    return { count: 0, firstTs: 0 };
  }
}

function incrementRedirectGuard() {
  try {
    const state = checkRedirectGuard();
    const newState = {
      count: state.count + 1,
      firstTs: state.firstTs || Date.now(),
    };
    sessionStorage.setItem(REDIRECT_GUARD_KEY, JSON.stringify(newState));
    return newState;
  } catch {
    // sessionStorage unavailable
  }
}

function clearRedirectGuard() {
  try {
    sessionStorage.removeItem(REDIRECT_GUARD_KEY);
  } catch {
    // sessionStorage unavailable
  }
}

/**
 * Dashboard-specific error boundary that catches render crashes
 * and shows debug info instead of redirecting to login.
 */
class DashboardErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("[Dashboard ErrorBoundary] Component crashed:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cosmic-void flex items-center justify-center p-4">
          <div className="text-white max-w-2xl w-full">
            <h2 className="text-xl font-bold mb-4 text-red-400">Dashboard Render Error</h2>
            <p className="mb-4 text-white/80">A component crashed while rendering the dashboard. This is the error:</p>
            <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 mb-4 overflow-auto max-h-60">
              <pre className="text-red-300 text-sm whitespace-pre-wrap break-words">
                {this.state.error?.toString()}
              </pre>
            </div>
            {this.state.errorInfo?.componentStack && (
              <div className="bg-gray-900/50 border border-gray-500/30 rounded-lg p-4 mb-4 overflow-auto max-h-60">
                <p className="text-xs text-gray-400 mb-2">Component Stack:</p>
                <pre className="text-gray-300 text-xs whitespace-pre-wrap break-words">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500"
              >
                Try Again
              </button>
              <button 
                onClick={() => window.location.href = "/login?redirect=dashboard"}
                className="px-4 py-2 bg-cosmic-gold text-cosmic-void rounded-lg font-medium"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loopError, setLoopError] = useState(false);
  const [debugLog, setDebugLog] = useState([]);

  const addLog = (msg) => {
    setDebugLog(prev => [...prev, `[${new Date().toISOString()}] ${msg}`]);
    console.log(`[Dashboard Debug] ${msg}`);
  };

  useEffect(() => {
    const checkAuth = async () => {
      addLog("Starting auth check...");
      try {
        addLog("Calling /api/auth/user...");
        const data = await apiClient.get("/api/auth/user", { cache: 'no-store' });
        addLog(`Response received: user=${data.user ? 'present' : 'null'}, keys=${Object.keys(data).join(',')}`);
        
        if (data.user) {
          addLog(`User authenticated: id=${data.user.id}, email=${data.user.email}`);
          setUser(data.user);
          clearRedirectGuard();
          setLoading(false);
        } else if (data.error) {
          addLog(`API error: ${data.error}`);
          setError(data.error);
          setLoading(false);
        } else {
          addLog("No user and no error — not authenticated");
          const guard = incrementRedirectGuard();
          if (guard && guard.count >= REDIRECT_THRESHOLD) {
            addLog("Redirect loop detected — showing loop error");
            setLoopError(true);
            setLoading(false);
            return;
          }
          addLog("Redirecting to /login");
          window.location.href = "/login?redirect=dashboard";
        }
      } catch (err) {
        addLog(`Auth check threw: ${err?.message || err?.code || JSON.stringify(err)}`);
        const guard = incrementRedirectGuard();
        if (guard && guard.count >= REDIRECT_THRESHOLD) {
          addLog("Redirect loop detected after error — showing loop error");
          setLoopError(true);
          setLoading(false);
          return;
        }
        addLog("Redirecting to /login after error");
        window.location.href = "/login?redirect=dashboard";
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (loopError) {
    return (
      <div className="min-h-screen bg-cosmic-void flex items-center justify-center">
        <div className="text-white text-center max-w-md p-8">
          <h2 className="text-xl font-bold mb-4 text-cosmic-gold">Session Issue Detected</h2>
          <p className="mb-6">Your session could not be loaded. This may be due to:</p>
          <ul className="text-left text-white/70 mb-6 list-disc pl-6">
            <li>Expired authentication</li>
            <li>Cookie conflicts between auth methods</li>
            <li>Browser storage issues</li>
          </ul>
          {debugLog.length > 0 && (
            <div className="bg-gray-900/50 border border-gray-500/30 rounded-lg p-3 mb-4 text-left overflow-auto max-h-40">
              <p className="text-xs text-gray-400 mb-1">Debug Log:</p>
              {debugLog.map((log, i) => (
                <p key={i} className="text-xs text-gray-300 font-mono">{log}</p>
              ))}
            </div>
          )}
          <button 
            onClick={() => {
              clearRedirectGuard();
              document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
              document.cookie = "next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
              document.cookie = "__Secure-next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
              window.location.href = "/login?redirect=dashboard";
            }}
            className="px-6 py-3 bg-cosmic-gold text-cosmic-void rounded-lg font-medium hover:bg-cosmic-gold/90"
          >
            Clear Session &amp; Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-cosmic-void flex items-center justify-center">
        <div className="text-white text-center">
          <p className="mb-4">{error || "Please log in to view your dashboard"}</p>
          <button 
            onClick={() => window.location.href = "/login?redirect=dashboard"}
            className="px-4 py-2 bg-cosmic-gold text-cosmic-void rounded-lg font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardErrorBoundary>
      <DashboardLayoutShell>
        <DashboardV3 user={user} />
      </DashboardLayoutShell>
    </DashboardErrorBoundary>
  );
}