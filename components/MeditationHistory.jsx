const logger = require('./lib/logger');
"use client";
import { useState, useEffect } from "react";
import { Brain, Clock, Trophy, Calendar, Loader2 } from "lucide-react";

/**
 * MeditationHistory - Displays user's meditation session history
 * 
 * Props:
 * - userId: User ID for fetching sessions
 */
export default function MeditationHistory({ userId }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (userId) {
      fetchSessions();
    }
  }, [userId]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/meditations?limit=20");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSessions(data.sessions || []);
          setTotal(data.total || 0);
        }
      }
    } catch (err) {
      logger.error("Failed to fetch meditation sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (secs === 0) return `${mins}m`;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border border-white border-opacity-40 mb-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border border-white border-opacity-40 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold gradient-text mb-2">Meditation History</h2>
          <p className="text-purple-200 text-sm sm:text-base">
            {total} session{total !== 1 ? "s" : ""} completed
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Brain className="w-6 h-6 text-white" />
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <Brain className="w-12 h-12 text-purple-300 mx-auto mb-4 opacity-50" />
          <p className="text-purple-200 text-lg mb-2">No meditation sessions yet</p>
          <p className="text-purple-200/80 text-sm">Start your first meditation to see your history here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-white bg-opacity-10 rounded-xl p-4 border border-white border-opacity-20 hover:bg-opacity-20 smooth-transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold mb-2">{session.meditationTitle}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-purple-200">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(session.startedAt)}</span>
                    </div>
                    {session.durationSeconds && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDuration(session.durationSeconds)}</span>
                      </div>
                    )}
                    {session.xpAwarded > 0 && (
                      <div className="flex items-center gap-1">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-300">+{session.xpAwarded} XP</span>
                      </div>
                    )}
                  </div>
                </div>
                {session.completedAt && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-green-400" title="Completed" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


