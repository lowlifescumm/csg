"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

/**
 * Modal - Accessible modal component with keyboard support
 * 
 * Props:
 * - isOpen: Boolean to control modal visibility
 * - onClose: Callback when modal should close
 * - title: Modal title (optional)
 * - children: Modal content
 * - size: "sm" | "md" | "lg" | "xl" | "full" (default: "md")
 * - closeOnOverlayClick: Whether to close when clicking overlay (default: true)
 * - closeOnEscape: Whether to close on Escape key (default: true)
 * - showCloseButton: Whether to show close button (default: true)
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
}) {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Size classes
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    full: "max-w-full mx-4",
  };

  // Handle Escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Handle focus trap
  useEffect(() => {
    if (!isOpen) return;

    // Store previous focus
    previousFocusRef.current = document.activeElement;

    // Focus modal on open
    const modal = modalRef.current;
    if (modal) {
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      if (firstElement) {
        firstElement.focus();
      }
    }

    // Prevent body scroll
    document.body.style.overflow = "hidden";

    return () => {
      // Restore previous focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        ref={modalRef}
        className={`relative bg-gradient-to-br from-violet-800 via-purple-800 to-indigo-800 rounded-3xl apple-shadow-xl border border-white border-opacity-40 w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden flex flex-col`}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-white border-opacity-20 flex-shrink-0">
            {title && (
              <h2 id="modal-title" className="text-2xl font-bold text-white">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-white hover:text-purple-200 smooth-transition p-2 rounded-lg hover:bg-white hover:bg-opacity-10"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

