"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Loader2, AlertCircle, PhoneOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/useToast";
import SessionTimer from "./SessionTimer";
import { Client, Conversation } from "@twilio/conversations";

/**
 * TwilioChatWindow - Real-time chat interface using Twilio Conversations SDK
 * 
 * Props:
 * - sessionId: Session ID
 * - session: Session data (user_id, advisor_id, status, per_minute_rate, start_time, conversation_sid)
 * - currentUserId: Current authenticated user ID
 * - advisor: Advisor profile data (optional)
 */
export default function TwilioChatWindow({ sessionId, session, currentUserId, advisor = null }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [disconnecting, setDisconnecting] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);
  const [insufficientFundsDisconnected, setInsufficientFundsDisconnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const clientRef = useRef(null);
  const conversationRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const router = useRouter();
  const balanceCheckIntervalRef = useRef(null);
  const lastWarningTimeRef = useRef(null);
  const wasInWarningZoneRef = useRef(false);
  const toast = useToast();

  // Determine if current user is the advisor
  const isAdvisor = currentUserId === session?.advisor_id;

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Initialize Twilio Conversations Client
  useEffect(() => {
    if (!session?.conversation_sid || session?.status === 'COMPLETED' || session?.status === 'FAILED') {
      setLoading(false);
      return;
    }

    let mounted = true;

    const initializeTwilioConversation = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch access token
        const tokenResponse = await fetch('/api/marketplace/chat/token', {
          method: 'POST',
        });

        if (!tokenResponse.ok) {
          throw new Error('Failed to get access token');
        }

        const tokenData = await tokenResponse.json();
        
        if (!tokenData.token) {
          throw new Error('Access token not found in response');
        }

        // Initialize Twilio Conversations Client
        const client = new Client(tokenData.token, {
          logLevel: 'error',
        });

        clientRef.current = client;

        // Handle client connection state
        client.on('connectionStateChanged', (state) => {
          if (!mounted) return;
          setConnectionStatus(state);
          
          if (state === 'connected') {
            console.log('[TwilioChatWindow] Connected to Twilio Conversations');
          } else if (state === 'disconnected' || state === 'denied') {
            console.error('[TwilioChatWindow] Disconnected from Twilio Conversations:', state);
            if (state === 'denied') {
              setError('Connection denied. Please refresh the page.');
            }
          }
        });

        // Get conversation by SID
        const conversation = await client.getConversationBySid(session.conversation_sid);
        conversationRef.current = conversation;

        // Set up conversation event listeners (pass conversation for read receipts)
        setupConversationListeners(conversation);

        // Load existing messages
        const existingMessages = await conversation.getMessages();
        if (mounted) {
          const formattedMessages = existingMessages.items.map(msg => formatTwilioMessage(msg, conversation));
          setMessages(formattedMessages);
          setLoading(false);
          setTimeout(() => scrollToBottom(), 100);
        }

      } catch (err) {
        console.error('[TwilioChatWindow] Error initializing conversation:', err);
        if (mounted) {
          setError(err.message || 'Failed to connect to chat');
          setLoading(false);
        }
      }
    };

    initializeTwilioConversation();

    return () => {
      mounted = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (conversationRef.current) {
        conversationRef.current.removeAllListeners();
      }
      if (clientRef.current) {
        clientRef.current.shutdown();
      }
    };
  }, [session?.conversation_sid, session?.status, scrollToBottom]);

  // Set up conversation event listeners
  const setupConversationListeners = (conversation) => {
    // Message added
    conversation.on('messageAdded', (message) => {
      const formatted = formatTwilioMessage(message, conversation);
      setMessages(prev => {
        // Check if message already exists (avoid duplicates)
        if (prev.some(m => m.sid === formatted.sid)) {
          return prev;
        }
        const updated = [...prev, formatted];
        setTimeout(() => scrollToBottom(), 100);
        return updated;
      });
    });

    // Message updated
    conversation.on('messageUpdated', ({ message, updateReasons }) => {
      if (updateReasons.includes('attributes') || updateReasons.includes('body')) {
        setMessages(prev => 
          prev.map(msg => 
            msg.sid === message.sid ? formatTwilioMessage(message, conversation) : msg
          )
        );
      }
    });

    // Typing started
    conversation.on('typingStarted', ({ participant }) => {
      if (participant.identity !== currentUserId.toString()) {
        setTypingUsers(prev => new Set([...prev, participant.identity]));
      }
    });

    // Typing ended
    conversation.on('typingEnded', ({ participant }) => {
      setTypingUsers(prev => {
        const updated = new Set(prev);
        updated.delete(participant.identity);
        return updated;
      });
    });

    // Participant updated (for read receipts - when other participant reads messages)
    conversation.on('participantUpdated', ({ participant }) => {
      // Refresh read receipts when participant's lastReadMessageIndex changes
      setMessages(prev => 
        prev.map(msg => {
          if (msg._twilioMessage) {
            return formatTwilioMessage(msg._twilioMessage, conversation);
          }
          return msg;
        })
      );
    });
  };

  // Format Twilio message to our format
  const formatTwilioMessage = (twilioMessage, conversation) => {
    // Check if message has been read by the other participant
    // A message is read if the other participant's lastReadMessageIndex >= this message's index
    let isRead = false;
    if (conversation && twilioMessage.index !== null && typeof twilioMessage.index === 'number') {
      try {
        const currentUserIdentity = currentUserId.toString();
        const participants = conversation.participants;
        
        if (participants && typeof participants.values === 'function') {
          // Find the other participant (not the current user)
          const participantsArray = Array.from(participants.values());
          const otherParticipant = participantsArray.find(
            p => p && p.identity && p.identity !== currentUserIdentity
          );
          
          if (otherParticipant && typeof otherParticipant.lastReadMessageIndex === 'number') {
            // Message is read if other participant's lastReadMessageIndex >= message index
            isRead = otherParticipant.lastReadMessageIndex >= twilioMessage.index;
          }
        }
      } catch (err) {
        // If error accessing participants, assume not read
        console.warn('[TwilioChatWindow] Error checking read receipt:', err);
      }
    }
    
    return {
      id: twilioMessage.index, // Use index as ID
      sid: twilioMessage.sid,
      session_id: sessionId,
      sender_id: parseInt(twilioMessage.author, 10),
      message_text: twilioMessage.body || '',
      created_at: twilioMessage.dateCreated?.toISOString() || new Date().toISOString(),
      read: isRead,
      // Store Twilio message object for re-formatting
      _twilioMessage: twilioMessage,
    };
  };

  // Send typing indicator
  const sendTypingIndicator = useCallback(() => {
    if (!conversationRef.current) return;

    conversationRef.current.typing();
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Send typing indicator again after 3 seconds if still typing
    typingTimeoutRef.current = setTimeout(() => {
      if (newMessage.trim()) {
        sendTypingIndicator();
      }
    }, 3000);
  }, [newMessage]);

  // Handle input change with typing indicator
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (e.target.value.trim() && conversationRef.current) {
      sendTypingIndicator();
    }
  };

  // Check wallet balance (same as original)
  const checkWalletBalance = async () => {
    try {
      const response = await fetch('/api/marketplace/wallet/balance');
      const data = await response.json();
      
      if (data.success && data.data) {
        const balance = parseFloat(data.data.balance) || 0;
        setWalletBalance(balance);
        
        if (!isAdvisor && session?.status === 'ACTIVE' && session?.per_minute_rate) {
          const perMinuteRate = parseFloat(session.per_minute_rate) || 0;
          const minutesRemaining = perMinuteRate > 0 ? balance / perMinuteRate : Infinity;
          
          if (minutesRemaining < 2 && minutesRemaining >= 0 && perMinuteRate > 0) {
            const now = Date.now();
            const shouldShowWarning = 
              !wasInWarningZoneRef.current || 
              (lastWarningTimeRef.current && now - lastWarningTimeRef.current > 30000);
            
            if (shouldShowWarning) {
              const minutesText = minutesRemaining < 0.1 
                ? 'less than 10 seconds' 
                : minutesRemaining < 1 
                  ? `${Math.round(minutesRemaining * 60)} seconds`
                  : `${minutesRemaining.toFixed(1)} minute${minutesRemaining !== 1 ? 's' : ''}`;
              
              toast.warning(
                `Low balance: You have ${minutesText} remaining. Add funds to continue your session.`,
                {
                  duration: 8000,
                  action: {
                    label: 'Add Funds',
                    onClick: () => router.push('/marketplace?fund=true')
                  }
                }
              );
              
              lastWarningTimeRef.current = now;
              wasInWarningZoneRef.current = true;
            }
          } else {
            wasInWarningZoneRef.current = false;
          }
          
          if (balance < perMinuteRate && !insufficientFundsDisconnected) {
            console.log('[TwilioChatWindow] Insufficient funds detected. Auto-disconnecting...');
            setInsufficientFundsDisconnected(true);
            await handleAutoDisconnect('insufficient_funds');
          }
        }
      }
    } catch (err) {
      console.error('[TwilioChatWindow] Error checking wallet balance:', err);
    }
  };

  // Auto-disconnect handler
  const handleAutoDisconnect = async (reason) => {
    if (disconnecting) return;
    
    setDisconnecting(true);
    setError("");

    try {
      const response = await fetch(`/api/marketplace/advisors/sessions/${sessionId}/disconnect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        if (session) {
          session.status = 'COMPLETED';
          session.end_time = data.data.end_time;
          session.total_cost_usd = data.data.total_cost_usd;
        }

        if (reason === 'insufficient_funds') {
          setError("Your session ended because your wallet balance is insufficient. Please add funds to continue.");
        }
      } else {
        setError(data.error || "Failed to disconnect session");
        setDisconnecting(false);
        setInsufficientFundsDisconnected(false);
      }
    } catch (err) {
      console.error("Error auto-disconnecting session:", err);
      setError("Failed to disconnect session. Please try again.");
      setDisconnecting(false);
      setInsufficientFundsDisconnected(false);
    }
  };

  // Poll wallet balance (same as original)
  useEffect(() => {
    if (!sessionId || isAdvisor || session?.status !== 'ACTIVE') {
      if (balanceCheckIntervalRef.current) {
        clearInterval(balanceCheckIntervalRef.current);
        balanceCheckIntervalRef.current = null;
      }
      return;
    }

    checkWalletBalance();
    balanceCheckIntervalRef.current = setInterval(() => {
      checkWalletBalance();
    }, 4000);

    return () => {
      if (balanceCheckIntervalRef.current) {
        clearInterval(balanceCheckIntervalRef.current);
        balanceCheckIntervalRef.current = null;
      }
    };
  }, [sessionId, session?.status, isAdvisor, session?.per_minute_rate]);

  // Send message via Twilio Conversations
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending || !conversationRef.current) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setSending(true);
    setError("");

    // Clear typing indicator timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    try {
      // Send message via Twilio Conversations
      await conversationRef.current.sendMessage(messageText);
      // Message will be added via messageAdded event listener
      setTimeout(() => scrollToBottom(), 100);
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again.");
      setNewMessage(messageText); // Restore message text
    } finally {
      setSending(false);
    }
  };

  // Handle session disconnect (same as original)
  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to end this session? Billing will be finalized.')) {
      return;
    }

    setDisconnecting(true);
    setError("");

    try {
      const response = await fetch(`/api/marketplace/advisors/sessions/${sessionId}/disconnect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        if (session) {
          session.status = 'COMPLETED';
          session.end_time = data.data.end_time;
          session.total_cost_usd = data.data.total_cost_usd;
        }

        setTimeout(() => {
          router.push('/marketplace');
        }, 2000);
      } else {
        setError(data.error || "Failed to disconnect session");
        setDisconnecting(false);
      }
    } catch (err) {
      console.error("Error disconnecting session:", err);
      setError("Failed to disconnect session. Please try again.");
      setDisconnecting(false);
    }
  };

  // Format timestamp
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

  // Get sender name
  const getSenderName = (senderId) => {
    if (senderId === currentUserId) {
      return "You";
    }
    if (senderId === session?.advisor_id && advisor) {
      return advisor.name || "Advisor";
    }
    return "Unknown";
  };

  // Get typing user name
  const getTypingUserName = () => {
    if (typingUsers.size === 0) return null;
    const typingUserId = Array.from(typingUsers)[0];
    if (typingUserId === session?.advisor_id?.toString()) {
      return advisor?.name || "Advisor";
    }
    return "User";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <span className="ml-3 text-gray-600">Connecting to chat...</span>
      </div>
    );
  }

  const typingUserName = getTypingUserName();

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
            {connectionStatus === 'connected' && (
              <p className="text-xs text-green-600 mt-1">● Connected</p>
            )}
            {connectionStatus === 'connecting' && (
              <p className="text-xs text-yellow-600 mt-1">● Connecting...</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {session?.start_time && (
              <SessionTimer 
                startTime={session.start_time} 
                rate={session.per_minute_rate ? parseFloat(session.per_minute_rate) : null}
              />
            )}
            {session?.status === 'ACTIVE' && (
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold smooth-transition hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 apple-shadow-lg"
                title="End Session"
              >
                {disconnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Ending...</span>
                  </>
                ) : (
                  <>
                    <PhoneOff className="w-4 h-4" />
                    <span className="hidden sm:inline">End Session</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`mx-4 mt-4 p-3 rounded-xl flex items-center gap-2 ${
          insufficientFundsDisconnected 
            ? 'bg-yellow-50 border border-yellow-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <AlertCircle className={`w-5 h-5 flex-shrink-0 ${
            insufficientFundsDisconnected ? 'text-yellow-500' : 'text-red-500'
          }`} />
          <span className={`text-sm ${
            insufficientFundsDisconnected ? 'text-yellow-700' : 'text-red-600'
          }`}>
            {error}
            {insufficientFundsDisconnected && (
              <span className="block mt-1">
                <a 
                  href="/marketplace?fund=true" 
                  className="underline font-semibold hover:text-yellow-800"
                >
                  Add funds to your wallet
                </a>
              </span>
            )}
          </span>
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
          <>
            {messages.map((message) => {
              const isOwnMessage = message.sender_id === currentUserId;
              
              return (
                <div
                  key={message.sid || message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} smooth-transition`}
                >
                  <div
                    className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-2 ${
                      isOwnMessage
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'bg-white bg-opacity-80 text-gray-900 border border-gray-200'
                    }`}
                  >
                    {!isOwnMessage && (
                      <div className="text-xs font-semibold mb-1 opacity-75">
                        {getSenderName(message.sender_id)}
                      </div>
                    )}
                    
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.message_text}
                    </p>
                    
                    <div className={`text-xs mt-1 flex items-center gap-2 ${
                      isOwnMessage ? 'text-white/70' : 'text-gray-500'
                    }`}>
                      <span>{formatTimestamp(message.created_at)}</span>
                      {isOwnMessage && message.read && (
                        <span className="text-white/70">✓✓ Read</span>
                      )}
                      {isOwnMessage && !message.read && (
                        <span className="text-white/50">✓ Sent</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Typing Indicator */}
            {typingUserName && (
              <div className="flex justify-start smooth-transition">
                <div className="max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-2 bg-white bg-opacity-80 text-gray-900 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-xs text-gray-500">{typingUserName} is typing...</span>
                  </div>
                </div>
              </div>
            )}
          </>
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
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              disabled={sending || connectionStatus !== 'connected'}
              maxLength={5000}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending || connectionStatus !== 'connected'}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold smooth-transition hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 apple-shadow-lg"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span className="hidden sm:inline">Send</span>
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

