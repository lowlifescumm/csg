"use client";
const logger = require('../lib/logger');

import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console; could be extended to send to logging service
    logger.error("[Client ErrorBoundary] Caught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
          <div className="glassmorphic rounded-3xl p-8 apple-shadow-lg border border-white border-opacity-40 w-full max-w-md text-center">
            <div className="text-3xl mb-3">🌌</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-6">We hit a small glitch. Please try again, or continue with email/password.</p>
            <a
              href="/login"
              className="inline-block px-5 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium"
            >
              Go to Login
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}



