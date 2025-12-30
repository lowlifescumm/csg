"use client";
import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, PhoneOff, Loader2, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/useToast";
import SessionTimer from "./SessionTimer";
import AudioLevelIndicator from "./AudioLevelIndicator";
import { useWebRTCConnection } from "@/lib/useWebRTCConnection";

/**
 * VoiceCallUI - Voice call interface with microphone controls and WebRTC
 * 
 * Props:
 * - sessionId: Session ID
 * - session: Session data (user_id, advisor_id, status, per_minute_rate, start_time)
 * - currentUserId: Current authenticated user ID
 * - onEndCall: Callback when call ends (optional)
 */
export default function VoiceCallUI({ sessionId, session, currentUserId, onEndCall }) {
  const [isMuted, setIsMuted] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState("");
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);
  const [insufficientFundsDisconnected, setInsufficientFundsDisconnected] = useState(false);

  const [localStream, setLocalStream] = useState(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const balanceCheckIntervalRef = useRef(null);
  const lastWarningTimeRef = useRef(null);
  const wasInWarningZoneRef = useRef(false);
  const router = useRouter();
  const toast = useToast();

  // Determine other participant
  const isAdvisor = currentUserId === session?.advisor_id;
  const otherUser = isAdvisor ? session?.user : session?.advisor;

  // WebRTC connection hook
  const {
    isConnecting,
    isConnected,
    connectionError,
    remoteStream,
    startConnection,
    endConnection
  } = useWebRTCConnection(
    sessionId,
    currentUserId,
    isAdvisor ? session?.user_id : session?.advisor_id,
    localStream
  );

  /**
   * Request microphone permission and get local stream
   */
  const requestMicrophonePermission = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Microphone access is not supported in this browser');
      setPermissionDenied(true);
      return;
    }

    try {
      setIsRequestingPermission(true);
      setError("");
      setPermissionDenied(false);

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      setPermissionGranted(true);
      
      // Start audio level monitoring
      startAudioLevelMonitoring(stream);

    } catch (error) {
      console.error('[VoiceCallUI] Error requesting microphone:', error);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setError('Microphone permission was denied. Please allow microphone access to use voice calls.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
        setPermissionDenied(true);
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setError('Microphone is already in use by another application.');
        setPermissionDenied(true);
      } else {
        setError(error.message || 'Failed to access microphone');
        setPermissionDenied(true);
      }
    } finally {
      setIsRequestingPermission(false);
    }
  };

  /**
   * Start monitoring audio levels using Web Audio API
   */
  const startAudioLevelMonitoring = (stream) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      microphone.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateAudioLevel = () => {
        if (!analyserRef.current) return;

        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average level
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const average = sum / dataArray.length;
        
        // Convert to 0-100 scale
        const level = Math.min(100, (average / 255) * 100);
        setAudioLevel(level);

        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };

      analyserRef.current = analyser;
      updateAudioLevel();
      audioContextRef.current = audioContext;

    } catch (error) {
      console.error('[VoiceCallUI] Error starting audio level monitoring:', error);
    }
  };

  /**
   * Stop audio level monitoring
   */
  const stopAudioLevelMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setAudioLevel(0);
  };

  /**
   * Toggle mute/unmute
   */
  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  // Check wallet balance
  const checkWalletBalance = async () => {
    try {
      const response = await fetch('/api/marketplace/wallet/balance');
      const data = await response.json();
      
      if (data.success && data.data) {
        const balance = parseFloat(data.data.balance) || 0;
        setWalletBalance(balance);
        
        // Check if balance is insufficient (only for user, not advisor)
        // Edge cases handled:
        // - Balance exactly equals rate: Will allow, server-side will catch on next billing cycle
        // - Balance becomes negative: Will terminate immediately
        // - Concurrent termination: Prevented by insufficientFundsDisconnected flag
        if (!isAdvisor && session?.status === 'ACTIVE' && session?.per_minute_rate) {
          const perMinuteRate = parseFloat(session.per_minute_rate) || 0;
          
          // Calculate minutes remaining
          const minutesRemaining = perMinuteRate > 0 ? balance / perMinuteRate : Infinity;
          
          // Show low balance warning if < 2 minutes remaining
          if (minutesRemaining < 2 && minutesRemaining >= 0 && perMinuteRate > 0) {
            const now = Date.now();
            const shouldShowWarning = 
              !wasInWarningZoneRef.current || // First time entering warning zone
              (lastWarningTimeRef.current && now - lastWarningTimeRef.current > 30000); // 30 seconds since last warning
            
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
            // Reset warning zone flag when balance is sufficient
            wasInWarningZoneRef.current = false;
          }
          
          // Terminate if balance is less than per-minute rate (can't afford even 1 minute)
          if (balance < perMinuteRate && !insufficientFundsDisconnected) {
            console.log('[VoiceCallUI] Insufficient funds detected. Auto-disconnecting...');
            console.log(`[VoiceCallUI] Balance: $${balance.toFixed(2)}, Required: $${perMinuteRate.toFixed(2)}`);
            setInsufficientFundsDisconnected(true);
            await handleAutoDisconnect('insufficient_funds');
          }
        }
      }
    } catch (err) {
      console.error('[VoiceCallUI] Error checking wallet balance:', err);
      // Don't show error to user, just log it
    }
  };

  // Auto-disconnect handler for insufficient funds
  const handleAutoDisconnect = async (reason) => {
    // Stop audio monitoring
    stopAudioLevelMonitoring();

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);

    // End WebRTC connection
    endConnection();
    connectionStartedRef.current = false;

    // Finalize session billing
    try {
      const response = await fetch(`/api/marketplace/advisors/sessions/${sessionId}/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      if (data.success) {
        console.log('[VoiceCallUI] Session disconnected due to insufficient funds');
        if (reason === 'insufficient_funds') {
          setError('Your session ended because your wallet balance is insufficient. Please add funds to continue.');
        }
      } else {
        console.error('[VoiceCallUI] Failed to disconnect session:', data.error);
        setInsufficientFundsDisconnected(false); // Allow retry
      }
    } catch (error) {
      console.error('[VoiceCallUI] Error disconnecting session:', error);
      setInsufficientFundsDisconnected(false); // Allow retry
    }

    // Call callback if provided
    if (onEndCall) {
      onEndCall();
    }
  };

  /**
   * End call and finalize billing
   */
  const handleEndCall = async () => {
    // Stop audio monitoring
    stopAudioLevelMonitoring();

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);

    // End WebRTC connection
    endConnection();
    connectionStartedRef.current = false;

    // Finalize session billing
    try {
      const response = await fetch(`/api/marketplace/advisors/sessions/${sessionId}/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      if (data.success) {
        console.log('[VoiceCallUI] Session disconnected and billing finalized');
      } else {
        console.error('[VoiceCallUI] Failed to disconnect session:', data.error);
      }
    } catch (error) {
      console.error('[VoiceCallUI] Error disconnecting session:', error);
    }

    // Call callback if provided
    if (onEndCall) {
      onEndCall();
    }
  };

  // Request permission on mount
  useEffect(() => {
    if (!permissionGranted && !permissionDenied && !isRequestingPermission) {
      requestMicrophonePermission();
    }
  }, []);

  // Start WebRTC connection when stream is available
  const connectionStartedRef = useRef(false);
  useEffect(() => {
    if (localStream && permissionGranted && !connectionStartedRef.current) {
      connectionStartedRef.current = true;
      startConnection();
    }
  }, [localStream, permissionGranted, startConnection]);

  // Handle remote audio stream
  useEffect(() => {
    if (remoteStream && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(error => {
        console.error('[VoiceCallUI] Error playing remote audio:', error);
      });
    }
  }, [remoteStream]);

  // Poll wallet balance during active sessions (only for users, not advisors)
  useEffect(() => {
    if (!sessionId || isAdvisor || session?.status !== 'ACTIVE') {
      if (balanceCheckIntervalRef.current) {
        clearInterval(balanceCheckIntervalRef.current);
        balanceCheckIntervalRef.current = null;
      }
      return;
    }

    // Initial balance check
    checkWalletBalance();

    // Poll balance every 4 seconds (balance between responsiveness and server load)
    balanceCheckIntervalRef.current = setInterval(() => {
      checkWalletBalance();
    }, 4000);

    return () => {
      if (balanceCheckIntervalRef.current) {
        clearInterval(balanceCheckIntervalRef.current);
        balanceCheckIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, session?.status, isAdvisor, session?.per_minute_rate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudioLevelMonitoring();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      endConnection();
      if (balanceCheckIntervalRef.current) {
        clearInterval(balanceCheckIntervalRef.current);
        balanceCheckIntervalRef.current = null;
      }
    };
  }, []);

  // Permission denied UI
  if (permissionDenied && !permissionGranted) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Microphone Access Required</h2>
        <p className="text-gray-600 mb-6 max-w-md">{error || 'Microphone permission is required for voice calls.'}</p>
        <button
          onClick={requestMicrophonePermission}
          disabled={isRequestingPermission}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-8 rounded-xl font-semibold smooth-transition hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isRequestingPermission ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Requesting...
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              Grant Permission
            </>
          )}
        </button>
      </div>
    );
  }

  // Loading state
  if (isRequestingPermission) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
        <p className="text-gray-600">Requesting microphone permission...</p>
      </div>
    );
  }

  // Main call UI
  return (
    <div className="flex flex-col h-full">
      {/* Header with participant info */}
      <div className="flex items-center justify-between p-6 border-b border-white border-opacity-20">
        <div className="flex items-center gap-4">
          {otherUser?.avatar_url ? (
            <img
              src={otherUser.avatar_url}
              alt={otherUser.name || 'User'}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
              {(otherUser?.name || 'U')[0].toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {otherUser?.name || (isAdvisor ? 'Client' : 'Advisor')}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">Connected</span>
                </>
              ) : isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
                  <span className="text-sm text-yellow-600">Connecting...</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Disconnected</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Session Timer */}
        {session?.start_time && (
          <SessionTimer 
            startTime={session.start_time} 
            rate={session.per_minute_rate} 
          />
        )}
      </div>

      {/* Error display */}
      {(error || connectionError) && (
        <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center gap-2 ${
          insufficientFundsDisconnected 
            ? 'bg-yellow-50 border border-yellow-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <AlertCircle className={`w-5 h-5 flex-shrink-0 ${
            insufficientFundsDisconnected ? 'text-yellow-500' : 'text-red-500'
          }`} />
          <div className={`text-sm ${
            insufficientFundsDisconnected ? 'text-yellow-700' : 'text-red-700'
          }`}>
            <p>{error || connectionError}</p>
            {insufficientFundsDisconnected && (
              <a 
                href="/marketplace?fund=true" 
                className="underline font-semibold hover:text-yellow-800 block mt-1"
              >
                Add funds to your wallet
              </a>
            )}
          </div>
        </div>
      )}

      {/* Main call area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Audio level indicator */}
        <div className="mb-8">
          <AudioLevelIndicator 
            audioLevel={isMuted ? 0 : audioLevel} 
            size="large"
            showLabel={true}
          />
        </div>

        {/* Mute status */}
        {isMuted && (
          <div className="mb-6 px-4 py-2 bg-yellow-100 border border-yellow-300 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium">Microphone is muted</p>
          </div>
        )}

        {/* Control buttons */}
        <div className="flex items-center gap-4">
          {/* Mute/Unmute button */}
          <button
            onClick={toggleMute}
            disabled={!permissionGranted}
            className={`w-16 h-16 rounded-full flex items-center justify-center smooth-transition ${
              isMuted
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300'
            } disabled:opacity-50 disabled:cursor-not-allowed apple-shadow-lg`}
            aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? (
              <MicOff className="w-8 h-8" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </button>

          {/* End call button */}
          <button
            onClick={handleEndCall}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center smooth-transition apple-shadow-lg hover:scale-[1.05] active:scale-[0.95]"
            aria-label="End call"
          >
            <PhoneOff className="w-8 h-8" />
          </button>
        </div>
      </div>

      {/* Remote audio element (hidden) */}
      <audio ref={remoteAudioRef} autoPlay playsInline />
    </div>
  );
}

