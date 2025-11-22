"use client";
import { useState, useEffect } from "react";
import Toast from "./Toast";

// Global toast state (shared across all useToast hooks)
let toastState = [];
let toastListeners = new Set();

function setToastState(newToasts) {
  toastState = newToasts;
  toastListeners.forEach((listener) => listener(newToasts));
}

function addToast(toast) {
  setToastState([...toastState, toast]);
}

function removeToast(id) {
  setToastState(toastState.filter((toast) => toast.id !== id));
}

// Export for useToast hook
export function addToastToQueue(toast) {
  addToast(toast);
}

/**
 * ToastContainer - Container for managing multiple toasts
 * 
 * This component should be placed at the root of your app (e.g., in layout.jsx)
 * It works with the useToast hook to display notifications
 */
export default function ToastContainer() {
  const [toasts, setToasts] = useState(toastState);

  useEffect(() => {
    // Subscribe to toast state changes
    const listener = (newToasts) => {
      setToasts([...newToasts]);
    };

    toastListeners.add(listener);
    return () => {
      toastListeners.delete(listener);
    };
  }, []);

  return (
    <div
      className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            action={toast.action}
            onClose={removeToast}
          />
        </div>
      ))}
    </div>
  );
}
