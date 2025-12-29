"use client";
import { useState, useEffect, useRef } from "react";
import { Send, Loader2, AlertCircle } from "lucide-react";
import SessionTimer from "./SessionTimer";

/**
 * ChatWindow - Real-time chat interface with message bubbles and timer
 * 
 * Props:
 * - sessionId: Session ID
 * - session: Session data (user_id, advisor_id, status, per_minute_rate, start_time)
 * - currentUserId: Current authenticated user ID
 * - advisor: Advisor profile data (optional)
 */
export default function ChatWindow({ sessionId, session, currentUserId, advisor = null }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const lastMessageIdRef = useRef(null);

  // Determine if current user is the advisor
  const isAdvisor = currentUserId === session?.advisor_id;

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/marketplace/advisors/sessions/${sessionId}/messages`);
      const data = await response.json();

      if (data.success && data.data?.messages) {
        const fetchedMessages = data.data.messages;
        
        // Only update if we have new messages (avoid unnecessary re-renders)
        const latestId = fetchedMessages.length > 0 
          ? fetchedMessages[fetchedMessages.length - 1].id 
          : null;
        
        if (latestId !== lastMessageIdRef.current) {
          setMessages(fetchedMessages);
          lastMessageIdRef.current = latestId;
          
          // Scroll to bottom when new messages arrive
          setTimeout(() => scrollToBottom(), 100);
        }
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      if (!error) {
        setError("Failed to load messages");
      }
    } finally {
      if (loading) {
        setLoading(false);
      }
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    if (!sessionId || session?.status === 'COMPLETED' || session?.status === 'FAILED') {
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchMessages();

    // Poll every 2 seconds (similar to ReportViewer pattern)
    const interval = setInterval(() => {
      fetchMessages();
    }, 2000);

    return () => clearInterval(interval);
  }, [sessionId, session?.status]);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setSending(true);
    setError("");

    // Optimistically add message to UI
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      session_id: sessionId,
      sender_id: currentUserId,
      message_text: messageText,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMessage]);
    setTimeout(() => scrollToBottom(), 100);

    try {
      const response = await fetch(`/api/marketplace/advisors/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message_text: messageText,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        // Replace optimistic message with real one
        setMessages(prev => 
          prev.map(msg => 
            msg.id === optimisticMessage.id ? data.data : msg
          )
        );
      } else {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        setError(data.error || "Failed to send message");
        setNewMessage(messageText); // Restore message text
      }
    } catch (err) {
      console.error("Error sending message:", err);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setError("Failed to send message. Please try again.");
      setNewMessage(messageText); // Restore message text
    } finally {
      setSending(false);
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get sender name for message
  const getSenderName = (senderId) => {
    if (senderId === currentUserId) {
      return "You";
    }
    if (senderId === session?.advisor_id && advisor) {
      return advisor.name || "Advisor";
    }
    return "Unknown";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <span className="ml-3 text-gray-600">Loading chat...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header with Timer */}
      <div className="glassmorphic border-b border-white border-opacity-40 bg-white bg-opacity-70 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isAdvisor 
                ? `Chat with ${session?.user?.name || 'Client'}`
                : `Chat with ${advisor?.name || session?.advisor?.name || 'Advisor'}`
              }
            </h2>
            {session?.per_minute_rate && (
              <p className="text-sm text-gray-600">
                ${parseFloat(session.per_minute_rate).toFixed(2)}/min
              </p>
            )}
          </div>
          {session?.start_time && (
            <SessionTimer 
              startTime={session.start_time} 
              rate={session.per_minute_rate ? parseFloat(session.per_minute_rate) : null}
            />
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-600">{error}</span>
        </div>
      )}

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-center">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender_id === currentUserId;
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} smooth-transition`}
              >
                <div
                  className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-2 ${
                    isOwnMessage
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-white bg-opacity-80 text-gray-900 border border-gray-200'
                  }`}
                >
                  {/* Sender name (for advisor messages) */}
                  {!isOwnMessage && (
                    <div className="text-xs font-semibold mb-1 opacity-75">
                      {getSenderName(message.sender_id)}
                    </div>
                  )}
                  
                  {/* Message text */}
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.message_text}
                  </p>
                  
                  {/* Timestamp */}
                  <div className={`text-xs mt-1 ${
                    isOwnMessage ? 'text-white/70' : 'text-gray-500'
                  }`}>
                    {formatTimestamp(message.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {session?.status !== 'COMPLETED' && session?.status !== 'FAILED' && (
        <form onSubmit={handleSendMessage} className="glassmorphic border-t border-white border-opacity-40 bg-white bg-opacity-70 p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              disabled={sending}
              maxLength={5000}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold smooth-transition hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 apple-shadow-lg"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send
                </>
              )}
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2 text-right">
            {newMessage.length}/5000
          </div>
        </form>
      )}

      {/* Session Completed Message */}
      {(session?.status === 'COMPLETED' || session?.status === 'FAILED') && (
        <div className="mx-4 mb-4 p-4 bg-gray-100 rounded-xl text-center text-gray-600">
          This session has ended.
        </div>
      )}
    </div>
  );
}

