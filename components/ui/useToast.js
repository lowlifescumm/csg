"use client";
import { useCallback } from "react";
import { addToastToQueue } from "./ToastContainer";

let toastIdCounter = 0;

/**
 * useToast - Hook for showing toast notifications
 * 
 * Usage:
 *   const toast = useToast();
 *   toast.success("Operation completed!");
 *   toast.error("Something went wrong");
 *   toast.warning("Please check your input");
 *   toast.info("New feature available");
 */
export function useToast() {
  const showToast = useCallback((message, type = "info", options = {}) => {
    const id = `toast-${++toastIdCounter}`;
    const toast = {
      id,
      message,
      type,
      duration: options.duration ?? 5000,
      action: options.action,
    };

    addToastToQueue(toast);
    return id;
  }, []);

  return {
    success: (message, options) => showToast(message, "success", options),
    error: (message, options) => showToast(message, "error", options),
    warning: (message, options) => showToast(message, "warning", options),
    info: (message, options) => showToast(message, "info", options),
    show: showToast,
  };
}

