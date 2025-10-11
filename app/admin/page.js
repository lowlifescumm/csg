"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  Activity, 
  DollarSign, 
  Star,
  Moon,
  Heart,
  Sparkles,
  Calendar,
  LogOut
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentReadings, setRecentReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();

      if (res.ok) {
        setStats(data.stats);
        setRecentUsers(data.recentUsers);
        setRecentReadings(data.recentReadings);
      } else {
        setError(data.error || "Failed to load statistics");
        if (res.status === 401 || res.status === 403) {
          router.push("/admin/login");
        }
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="glassmorphic rounded-3xl p-8 max-w-md">
          <p className="text-red-600 text-center">{error}</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ icon: Icon, label, value, subtext, color = "purple" }) => (
    <div className="glassmorphic rounded-2xl p-6 apple-shadow border border-white border-opacity-40 smooth-transition hover:scale-[1.02]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className={`text-3xl font-bold gradient-text-${color}`}>{value.toLocaleString()}</p>
          {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
        </div>
        <div className={`bg-gradient-to-br from-${color}-500 to-${color}-600 p-3 rounded-xl`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="text-3xl font-bold gradient-text">Admin Dashboard</h1>
              <p className="text-gray-600">Cosmic Spiritual Guide Statistics</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 smooth-transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Users}
            label="Total Users"
            value={stats?.users?.total || 0}
            subtext={`${stats?.users?.newToday || 0} new today`}
            color="purple"
          />
          <StatCard
            icon={Star}
            label="Premium Subscribers"
            value={stats?.users?.premiumSubscribers || 0}
            subtext={`${stats?.users?.newThisWeek || 0} new this week`}
            color="blue"
          />
          <StatCard
            icon={DollarSign}
            label="Total Revenue"
            value={`$${(stats?.revenue?.total || 0).toFixed(2)}`}
            subtext="All-time earnings"
            color="green"
          />
          <StatCard
            icon={Activity}
            label="Tarot Readings"
            value={stats?.readings?.tarotTotal || 0}
            subtext={`${stats?.readings?.tarotToday || 0} today`}
            color="pink"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="glassmorphic rounded-2xl p-6 apple-shadow border border-white border-opacity-40">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Reading Statistics
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Birth Charts</span>
                <span className="font-semibold">{stats?.readings?.birthCharts || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Horoscopes</span>
                <span className="font-semibold">{stats?.readings?.horoscopes || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Compatibility Reports</span>
                <span className="font-semibold">{stats?.readings?.compatibilityReports || 0}</span>
              </div>
            </div>
          </div>

          <div className="glassmorphic rounded-2xl p-6 apple-shadow border border-white border-opacity-40">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Revenue Breakdown
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Compatibility</span>
                <span className="font-semibold text-green-600">${(stats?.revenue?.compatibility || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Moon Readings</span>
                <span className="font-semibold text-green-600">${(stats?.revenue?.moonReadings || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Purchases</span>
                <span className="text-sm">{(stats?.revenue?.compatibilityPurchases || 0) + (stats?.revenue?.moonReadingPurchases || 0)}</span>
              </div>
            </div>
          </div>

          <div className="glassmorphic rounded-2xl p-6 apple-shadow border border-white border-opacity-40">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Activity Today
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">New Users</span>
                <span className="font-semibold">{stats?.users?.newToday || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tarot Readings</span>
                <span className="font-semibold">{stats?.readings?.tarotToday || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Birth Charts</span>
                <span className="font-semibold">{stats?.readings?.birthChartsToday || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glassmorphic rounded-2xl p-6 apple-shadow border border-white border-opacity-40">
            <h3 className="text-lg font-semibold mb-4">Recent Users</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex justify-between items-center p-3 bg-white bg-opacity-50 rounded-xl">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <div className="text-right">
                    {user.isPremium && <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">Premium</span>}
                    {user.role === 'admin' && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full ml-1">Admin</span>}
                    <p className="text-xs text-gray-500 mt-1">{new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glassmorphic rounded-2xl p-6 apple-shadow border border-white border-opacity-40">
            <h3 className="text-lg font-semibold mb-4">Recent Readings</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {recentReadings.map((reading) => (
                <div key={reading.id} className="flex justify-between items-center p-3 bg-white bg-opacity-50 rounded-xl">
                  <div>
                    <p className="font-medium capitalize">{reading.type.replace('_', ' ')}</p>
                    <p className="text-sm text-gray-600">{reading.userEmail}</p>
                  </div>
                  <p className="text-xs text-gray-500">{new Date(reading.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
