"use client";

import { useEffect, useState } from "react";

export default function ClientErrorCatcher() {
  const [hasClientError, setHasClientError] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const onError = (event) => {
      // Avoid blocking; just show a soft banner
      setHasClientError(true);
      setMessage(event?.message || "A client error occurred.");
      // keep app running
      return false;
    };
    const onUnhandledRejection = (event) => {
      setHasClientError(true);
      setMessage(event?.reason?.message || "A network or script error occurred.");
      return false;
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  if (!hasClientError) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="glassmorphic rounded-2xl px-4 py-3 border border-white/40 bg-red-500/10 text-red-700 backdrop-blur">
        <div className="text-sm font-medium">
          We noticed a small hiccup. You can continue safely. {message ? `(${message})` : ""}
        </div>
      </div>
    </div>
  );
}


