"use client";
const logger = require('@/lib/logger');
import { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, X, Gauge } from "lucide-react";

/**
 * MeditationPlayer - Full-featured meditation audio player
 * 
 * Props:
 * - meditation: Meditation object
 * - sessionId: Session ID from start endpoint
 * - onComplete: Callback when meditation completes
 * - onClose: Callback to close player
 * - compact: Whether to show compact floating player
 */
export default function MeditationPlayer({
  meditation,
  sessionId,
  onComplete,
  onClose,
  compact = false,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(meditation.duration_seconds || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [ambientEnabled, setAmbientEnabled] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const audioRef = useRef(null);
  const ambientAudioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || meditation.duration_seconds);
    const handleEnded = () => {
      setIsPlaying(false);
      handleComplete();
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [meditation.duration_seconds]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((err) => {
        logger.error("Play error:", err);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const newTime = percent * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleComplete = async () => {
    if (isCompleted) return;
    setIsCompleted(true);

    try {
      const res = await fetch(`/api/meditations/${meditation.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      const data = await res.json();
      if (res.ok && data.success && onComplete) {
        onComplete(data);
      }
    } catch (error) {
      logger.error("Error completing meditation:", error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const remainingTime = duration - currentTime;

  if (compact) {
    return (
      <div className="fixed bottom-6 right-6 z-50 glassmorphic rounded-2xl p-4 apple-shadow-lg border border-white border-opacity-40 max-w-sm w-full">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={handlePlayPause}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white smooth-transition hover:scale-110"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{meditation.title}</p>
            <p className="text-purple-200 text-xs">{formatTime(remainingTime)} remaining</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white hover:bg-opacity-20 flex items-center justify-center smooth-transition"
            aria-label="Close player"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div
          className="h-2 bg-white bg-opacity-10 rounded-full cursor-pointer"
          onClick={handleSeek}
          role="slider"
          aria-label="Seek"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.preventDefault();
              const audio = audioRef.current;
              if (!audio) return;
              const delta = e.key === "ArrowLeft" ? -5 : 5;
              audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + delta));
            }
          }}
        >
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full smooth-transition"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <audio ref={audioRef} src={meditation.narration_audio_url} preload="metadata" />
        {ambientEnabled && (
          <audio
            ref={ambientAudioRef}
            src="/audio/ambient-nature.mp3"
            loop
            volume={0.3}
            preload="metadata"
          />
        )}
      </div>
    );
  }

  return (
    <div className="glassmorphic rounded-3xl p-8 apple-shadow-lg border border-white border-opacity-40">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold gradient-text mb-1">{meditation.title}</h2>
          {meditation.narrator && (
            <p className="text-purple-200 text-sm">Narrated by {meditation.narrator}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full hover:bg-white hover:bg-opacity-20 flex items-center justify-center smooth-transition"
          aria-label="Close player"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div
          className="h-3 bg-white bg-opacity-10 rounded-full cursor-pointer mb-2"
          onClick={handleSeek}
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.preventDefault();
              const audio = audioRef.current;
              if (!audio) return;
              const delta = e.key === "ArrowLeft" ? -5 : 5;
              audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + delta));
            }
          }}
        >
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full smooth-transition relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg" />
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-purple-200">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(remainingTime)} remaining</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={handlePlayPause}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white smooth-transition hover:scale-110 apple-shadow-lg"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
        </button>
      </div>

      {/* Secondary Controls */}
      <div className="flex items-center justify-center gap-6 flex-wrap">
        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="w-10 h-10 rounded-full hover:bg-white hover:bg-opacity-20 flex items-center justify-center smooth-transition"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
          </button>
          {!isMuted && (
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24"
              aria-label="Volume"
            />
          )}
        </div>

        {/* Playback Speed */}
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-purple-200" />
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            className="px-3 py-1 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label="Playback speed"
          >
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1">1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
        </div>

        {/* Ambient Sound Toggle */}
        <button
          onClick={() => {
            setAmbientEnabled(!ambientEnabled);
            if (ambientAudioRef.current) {
              if (!ambientEnabled) {
                ambientAudioRef.current.play().catch((err) => logger.error("Audio playback error:", err));
              } else {
                ambientAudioRef.current.pause();
              }
            }
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium smooth-transition ${
            ambientEnabled
              ? "bg-purple-500 text-white"
              : "bg-white bg-opacity-10 text-purple-200 hover:bg-opacity-20"
          }`}
          aria-label={ambientEnabled ? "Disable ambient sounds" : "Enable ambient sounds"}
        >
          {ambientEnabled ? "Ambient On" : "Ambient Off"}
        </button>
      </div>

      {/* Transcript (if available) */}
      {meditation.transcript && (
        <div className="mt-6 p-4 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-10 max-h-48 overflow-y-auto">
          <h4 className="text-white font-semibold mb-2 text-sm">Transcript</h4>
          <p className="text-purple-200 text-sm leading-relaxed whitespace-pre-line">
            {meditation.transcript}
          </p>
        </div>
      )}

      <audio ref={audioRef} src={meditation.narration_audio_url} preload="metadata" />
      {ambientEnabled && (
        <audio
          ref={ambientAudioRef}
          src="/audio/ambient-nature.mp3"
          loop
          volume={0.3}
          preload="metadata"
        />
      )}
    </div>
  );
}


