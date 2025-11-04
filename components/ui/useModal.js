"use client";
import { useState, useCallback } from "react";

/**
 * useModal - Hook for managing modal state
 * 
 * Usage:
 *   const { isOpen, open, close } = useModal();
 *   <Modal isOpen={isOpen} onClose={close}>...</Modal>
 */
export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

