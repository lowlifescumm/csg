"use client";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import ChatWindow from "@/components/ChatWindow";

function SessionChatContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params?.sessionId;
  const [session, setSession] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch current user
  useEffect(() => {
    fetch("/api/auth/user")
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.id) {
          setCurrentUserId(data.user.id);
        }
      })
      .catch((err) => {
        console.error("Error fetching user:", err);
      });
  }, []);

  // Fetch session details
  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch(`/api/marketplace/advisors/sessions/${sessionId}`);
      const data = await response.json();

      if (data.success && data.data) {
        setSession(data.data);
      } else {
        setError(data.error || "Failed to load session");
      }
    } catch (err) {
      console.error("Error fetching session:", err);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading chat session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 smooth-transition mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Marketplace
          </Link>
          
          <div className="glassmorphic rounded-3xl p-10 apple-shadow-lg border border-white border-opacity-40 bg-white bg-opacity-70 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Session Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              {error || "The chat session could not be loaded."}
            </p>
            <Link
              href="/marketplace"
              className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-8 rounded-xl font-semibold smooth-transition hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] apple-shadow-lg"
            >
              Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Determine advisor info
  const advisor = session.advisor || null;
  const isAdvisor = currentUserId === session.advisor_id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex flex-col">
      {/* Top Bar */}
      <div className="glassmorphic border-b border-white border-opacity-40 bg-white bg-opacity-70 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 smooth-transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back to Marketplace</span>
          </Link>
          
          <div className="text-sm text-gray-600">
            Session #{session.id}
          </div>
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 max-w-6xl mx-auto w-full p-4">
        <div className="glassmorphic rounded-3xl apple-shadow-lg border border-white border-opacity-40 bg-white bg-opacity-70 h-[calc(100vh-12rem)] flex flex-col overflow-hidden">
          <ChatWindow
            sessionId={session.id}
            session={session}
            currentUserId={currentUserId}
            advisor={advisor}
          />
        </div>
      </div>
    </div>
  );
}

export default function SessionChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
      </div>
    }>
      <SessionChatContent />
    </Suspense>
  );
}

