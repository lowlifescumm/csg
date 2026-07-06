"use client";

import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ errorInfo: info });
    // Log to console; could be extended to send to logging service
    console.error("[Client ErrorBoundary] Caught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
          <div className="glassmorphic rounded-3xl p-8 apple-shadow-lg border border-white border-opacity-40 w-full max-w-lg text-center">
            <div className="text-3xl mb-3">🌌</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">We hit a small glitch. Here are the details:</p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-left overflow-auto max-h-48">
              <pre className="text-red-700 text-xs whitespace-pre-wrap break-words">
                {this.state.error?.toString()}
              </pre>
              {this.state.errorInfo?.componentStack && (
                <pre className="text-red-500 text-xs whitespace-pre-wrap break-words mt-2">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                }}
                className="inline-block px-5 py-3 rounded-xl bg-blue-500 text-white font-medium"
              >
                Try Again
              </button>
              <a
                href="/login"
                className="inline-block px-5 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium"
              >
                Go to Login
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
