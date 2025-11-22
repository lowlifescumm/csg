"use client";
import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";

/**
 * ConfirmDialog - Accessible confirmation dialog
 * 
 * Props:
 * - isOpen: Boolean to control dialog visibility
 * - onClose: Callback when dialog is cancelled
 * - onConfirm: Callback when user confirms
 * - title: Dialog title
 * - message: Confirmation message
 * - confirmText: Confirm button text (default: "Confirm")
 * - cancelText: Cancel button text (default: "Cancel")
 * - variant: "danger" | "warning" | "info" (default: "info")
 * - isLoading: Whether confirm action is in progress
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "info",
  isLoading = false,
}) {
  const confirmButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      // Focus confirm button when dialog opens
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  const variantClasses = {
    danger: "bg-red-500/20 border-red-400/50 text-red-200",
    warning: "bg-yellow-500/20 border-yellow-400/50 text-yellow-200",
    info: "bg-blue-500/20 border-blue-400/50 text-blue-200",
  };

  const buttonClasses = {
    danger: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
    warning: "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600",
    info: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnOverlayClick={!isLoading}
      closeOnEscape={!isLoading}
    >
      <div className="space-y-6">
        {/* Icon and Message */}
        <div className={`flex items-start gap-4 p-4 rounded-xl border ${variantClasses[variant]}`}>
          <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <p className="text-sm leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2.5 bg-white bg-opacity-10 text-white font-medium rounded-xl hover:bg-opacity-20 smooth-transition disabled:opacity-50 disabled:cursor-not-allowed border border-white border-opacity-20"
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-6 py-2.5 text-white font-medium rounded-xl smooth-transition disabled:opacity-50 disabled:cursor-not-allowed ${buttonClasses[variant]}`}
          >
            {isLoading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}

