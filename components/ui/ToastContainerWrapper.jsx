"use client";
import dynamic from "next/dynamic";

// Dynamically import ToastContainer to avoid SSR issues
const ToastContainer = dynamic(
  () => import("@/components/ui").then((mod) => mod.ToastContainer),
  { ssr: false }
);

/**
 * ToastContainerWrapper - Client component wrapper for ToastContainer
 * This allows us to use ssr: false in a client component
 */
export default function ToastContainerWrapper() {
  return <ToastContainer />;
}

