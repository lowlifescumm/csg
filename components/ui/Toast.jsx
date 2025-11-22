"use client";
import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

/**
 * Toast - Notification toast component
 * 
 * Props:
 * - id: Unique identifier
 * - message: Toast message
 * - type: "success" | "error" | "warning" | "info" (default: "info")
 * - duration: Auto-dismiss duration in ms (default: 5000, 0 = no auto-dismiss)
 * - onClose: Callback when toast is closed
 * - action: Optional action button { label, onClick }
 */
export default function Toast({
  id,
  message,
  type = "info",
  duration = 5000,
  onClose,
  action,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      if (onClose) onClose(id);
    }, 300);
  };

  // Icon and color mapping
  const iconMap = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colorClasses = {
    success: "bg-green-500/20 border-green-400/50 text-green-200",
    error: "bg-red-500/20 border-red-400/50 text-red-200",
    warning: "bg-yellow-500/20 border-yellow-400/50 text-yellow-200",
    info: "bg-blue-500/20 border-blue-400/50 text-blue-200",
  };

  const Icon = iconMap[type] || Info;

  return (
    <div
      className={`
        glassmorphic rounded-xl p-4 border min-w-[300px] max-w-[500px] 
        ${colorClasses[type]}
        transform transition-all duration-300 ease-out
        ${isVisible && !isExiting ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
        shadow-lg
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium break-words">{message}</p>
          {action && (
            <button
              onClick={action.onClick}
              className="mt-2 text-xs font-semibold underline hover:no-underline"
            >
              {action.label}
            </button>
          )}
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 rounded hover:bg-white hover:bg-opacity-10 smooth-transition"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

