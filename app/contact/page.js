"use client";
const logger = require('../../lib/logger');
import { useState } from "react";
import Link from "next/link";
import { Mail, Send, ArrowLeft, MessageSquare, CheckCircle } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", message: "" });
        setTimeout(() => setStatus(""), 5000);
      } else {
        setStatus("error");
      }
    } catch (error) {
      logger.error("Contact form error:", error);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900">
      <div className="p-8 sm:p-10">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-purple-200 hover:text-white smooth-transition mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-semibold gradient-text mb-2">Contact Us</h1>
                <p className="text-purple-200">We&apos;d love to hear from you. Send us a message!</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="glassmorphic rounded-3xl p-8 sm:p-10 apple-shadow-lg border border-white border-opacity-40">
            {status === "success" ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-white mb-2">Message Sent!</h2>
                <p className="text-purple-200 mb-6">
                  Thank you for reaching out. We&apos;ll get back to you as soon as possible.
                </p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 smooth-transition"
                >
                  Return to Dashboard
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-purple-200 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full p-4 rounded-xl border border-white border-opacity-20 bg-white bg-opacity-10 text-white placeholder-purple-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none smooth-transition"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-purple-200 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-200" />
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-white border-opacity-20 bg-white bg-opacity-10 text-white placeholder-purple-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none smooth-transition"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-purple-200 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows="6"
                    className="w-full p-4 rounded-xl border border-white border-opacity-20 bg-white bg-opacity-10 text-white placeholder-purple-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none smooth-transition resize-none"
                    placeholder="Tell us how we can help..."
                  />
                </div>

                {status === "error" && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/20 border border-red-400/30 text-red-200 text-sm">
                    Failed to send message. Please try again or email us directly.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed apple-shadow-lg flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Additional Info */}
          <div className="mt-8 glassmorphic rounded-2xl p-6 apple-shadow-lg border border-white border-opacity-40">
            <h3 className="text-lg font-semibold text-white mb-4">Other Ways to Reach Us</h3>
            <div className="space-y-3 text-purple-200">
              <p className="text-sm">
                For urgent matters or technical support, please include your account email in your message.
              </p>
              <p className="text-sm">
                We typically respond within 24-48 hours during business days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
