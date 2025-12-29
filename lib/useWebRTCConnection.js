"use client";
import { useState, useEffect, useRef, useCallback } from "react";

/**
 * useWebRTCConnection - Custom hook for managing WebRTC peer connections
 * 
 * @param {number} sessionId - Session ID
 * @param {number} currentUserId - Current user ID
 * @param {number} otherUserId - Other participant's user ID
 * @param {MediaStream} localStream - Local audio stream
 * @returns {object} Connection state and methods
 */
export function useWebRTCConnection(sessionId, currentUserId, otherUserId, localStream) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const peerConnectionRef = useRef(null);
  const signalingPollIntervalRef = useRef(null);
  const iceCandidatePollIntervalRef = useRef(null);
  const isInitiatorRef = useRef(false);
  const offerCreatedRef = useRef(false);
  const answerCreatedRef = useRef(false);

  // STUN servers for NAT traversal
  const rtcConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  /**
   * Create and configure RTCPeerConnection
   */
  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      // Update tracks if stream changed
      if (localStream) {
        const existingTracks = peerConnectionRef.current.getSenders().map(sender => sender.track);
        const newTracks = localStream.getTracks();
        
        // Remove old tracks that are no longer in the stream
        existingTracks.forEach(track => {
          if (!newTracks.includes(track)) {
            peerConnectionRef.current.removeTrack(
              peerConnectionRef.current.getSenders().find(s => s.track === track)
            );
          }
        });
        
        // Add new tracks
        newTracks.forEach(track => {
          if (!existingTracks.includes(track)) {
            peerConnectionRef.current.addTrack(track, localStream);
          }
        });
      }
      return peerConnectionRef.current;
    }

    const pc = new RTCPeerConnection(rtcConfiguration);

    // Add local stream tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote stream');
      setRemoteStream(event.streams[0]);
      setIsConnected(true);
    };

    // Handle ICE candidates
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        try {
          await fetch(`/api/marketplace/advisors/sessions/${sessionId}/webrtc/ice-candidate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ candidate: event.candidate })
          });
        } catch (error) {
          console.error('[WebRTC] Failed to send ICE candidate:', error);
        }
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log('[WebRTC] Connection state:', state);
      
      if (state === 'connected' || state === 'completed') {
        setIsConnected(true);
        setIsConnecting(false);
      } else if (state === 'disconnected' || state === 'failed') {
        setIsConnected(false);
        setIsConnecting(false);
        setConnectionError('Connection lost');
      } else if (state === 'connecting') {
        setIsConnecting(true);
      }
    };

    // Handle ICE connection state
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      console.log('[WebRTC] ICE connection state:', state);
      
      if (state === 'failed' || state === 'disconnected') {
        setConnectionError('Connection failed');
        setIsConnected(false);
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [localStream]);

  /**
   * Poll for incoming signaling data (offers, answers, ICE candidates)
   */
  const pollSignaling = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/marketplace/advisors/sessions/${sessionId}/webrtc/signals`
      );
      const data = await response.json();

      if (!data.success || !data.data?.signals) {
        return;
      }

      const signals = data.data.signals;
      const pc = peerConnectionRef.current;

      if (!pc) return;

      for (const signal of signals) {
        try {
          if (signal.signal_type === 'offer') {
            // Received offer, create answer
            await pc.setRemoteDescription(new RTCSessionDescription(signal.signal_data));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            // Send answer
            await fetch(`/api/marketplace/advisors/sessions/${sessionId}/webrtc/answer`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ answer })
            });

            answerCreatedRef.current = true;
            console.log('[WebRTC] Answer created and sent');

          } else if (signal.signal_type === 'answer') {
            // Received answer
            await pc.setRemoteDescription(new RTCSessionDescription(signal.signal_data));
            console.log('[WebRTC] Answer received and set');

          } else if (signal.signal_type === 'ice-candidate') {
            // Received ICE candidate
            try {
              await pc.addIceCandidate(new RTCIceCandidate(signal.signal_data));
            } catch (error) {
              // Ignore errors for candidates that arrive after connection is established
              if (pc.connectionState !== 'connected' && pc.connectionState !== 'completed') {
                console.warn('[WebRTC] Failed to add ICE candidate:', error);
              }
            }
          }
        } catch (error) {
          console.error('[WebRTC] Error processing signal:', error);
        }
      }
    } catch (error) {
      console.error('[WebRTC] Error polling signals:', error);
    }
  }, [sessionId]);

  /**
   * Start WebRTC connection
   */
  const startConnection = useCallback(async () => {
    if (!localStream) {
      setConnectionError('No local stream available');
      return;
    }

    try {
      setIsConnecting(true);
      setConnectionError(null);

      const pc = createPeerConnection();
      
      // Ensure local stream tracks are added
      if (localStream) {
        localStream.getTracks().forEach(track => {
          const sender = pc.getSenders().find(s => s.track === track);
          if (!sender) {
            pc.addTrack(track, localStream);
          }
        });
      }

      // Determine initiator (user with lower ID starts)
      isInitiatorRef.current = currentUserId < otherUserId;

      if (isInitiatorRef.current && !offerCreatedRef.current) {
        // Create and send offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await fetch(`/api/marketplace/advisors/sessions/${sessionId}/webrtc/offer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ offer })
        });

        offerCreatedRef.current = true;
        console.log('[WebRTC] Offer created and sent');
      }

      // Start polling for signaling data
      signalingPollIntervalRef.current = setInterval(pollSignaling, 1000); // Poll every second

    } catch (error) {
      console.error('[WebRTC] Error starting connection:', error);
      setConnectionError(error.message || 'Failed to start connection');
      setIsConnecting(false);
    }
  }, [sessionId, currentUserId, otherUserId, localStream, createPeerConnection, pollSignaling]);

  // Update peer connection when local stream changes
  useEffect(() => {
    if (peerConnectionRef.current && localStream) {
      localStream.getTracks().forEach(track => {
        const sender = peerConnectionRef.current.getSenders().find(s => s.track === track);
        if (!sender) {
          peerConnectionRef.current.addTrack(track, localStream);
        }
      });
    }
  }, [localStream]);

  /**
   * End WebRTC connection
   */
  const endConnection = useCallback(() => {
    // Stop polling
    if (signalingPollIntervalRef.current) {
      clearInterval(signalingPollIntervalRef.current);
      signalingPollIntervalRef.current = null;
    }

    if (iceCandidatePollIntervalRef.current) {
      clearInterval(iceCandidatePollIntervalRef.current);
      iceCandidatePollIntervalRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Stop local stream tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    // Reset state
    setIsConnected(false);
    setIsConnecting(false);
    setRemoteStream(null);
    offerCreatedRef.current = false;
    answerCreatedRef.current = false;
  }, [localStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endConnection();
    };
  }, [endConnection]);

  return {
    isConnecting,
    isConnected,
    connectionError,
    remoteStream,
    startConnection,
    endConnection
  };
}

