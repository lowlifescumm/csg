"use client";
import { useState } from "react";
import { ChevronDown, HelpCircle, MessageCircle, Mail } from "lucide-react";

export default function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "How do credits work?",
      answer: `Credits are our universal currency for premium readings and reports. Each service costs a specific amount:
      
• Daily Horoscope — FREE (no credits)
• 3-Card Tarot Reading — 1 credit
• Full Tarot Spread — 3 credits
• Moon Reading — 5 credits
• Birth Chart — 12 credits
• Compatibility Report — 20 credits
• Transit Dashboard — 8 credits

Free users get 3 credits/day (expire in 24 hours). Paid credits never expire, and Mystic subscribers get 160 credits/month with 30-day rollover.`
    },
    {
      question: "What's included in the Mystic subscription?",
      answer: `The Mystic tier ($19.99/month) includes:

• 160 credits per month (30-day rollover)
• 4 Moon Readings/month (5 credits each)
• 2 Compatibility Reports/month (20 credits each)
• 2 Birth Charts/month (12 credits each)
• 20% discount on additional reports
• Daily Transit Dashboard access

Credits not used roll over for 30 days, giving you flexibility to save up for bigger readings.`
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: `Yes! You can cancel your Mystic subscription at any time with no penalties or hidden fees. 

• Access continues until your next billing cycle
• Unused credits remain available for 30 days after cancellation
• You can re-subscribe anytime to regain access
• One-click cancellation in your account settings

We believe in earning your trust every month, not locking you into contracts.`
    },
    {
      question: "Do credits expire?",
      answer: `It depends on how you get them:

FREE DAILY CREDITS:
• Expire after 24 hours
• Refill automatically each day
• Best for casual exploration

PURCHASED CREDIT PACKS:
• Never expire
• Permanent balance
• Use whenever you want

MYSTIC SUBSCRIPTION CREDITS:
• 30-day rollover period
• Example: If you have 50 unused credits on billing day, they roll over
• After 30 days of inactivity, they expire

This gives you flexibility while encouraging regular engagement with your cosmic practice.`
    },
    {
      question: "What payment methods do you accept?",
      answer: `We accept all major credit and debit cards through our secure payment processor, Stripe:

• Visa
• Mastercard
• American Express
• Discover

Your payment information is never stored on our servers. All transactions are PCI DSS compliant and encrypted with 256-bit SSL security.

We do not currently accept PayPal, Apple Pay, or Google Pay, but these are on our roadmap!`
    },
    {
      question: "What's your refund policy?",
      answer: `We offer a fair and transparent refund policy:

CREDIT PACKS:
• Unused credits can be refunded within 14 days of purchase
• Partially used packs are not eligible for refunds
• Refunds processed within 5-7 business days

SUBSCRIPTIONS:
• Cancel anytime — no refunds for current billing period
• Access continues until end of paid period
• Prorated refunds only for technical issues

READINGS:
• Readings already generated cannot be refunded
• Technical errors causing failed generation are eligible for credit replacement

Contact support if you experience any issues with your purchase.`
    },
    {
      question: "How accurate are the readings?",
      answer: `Our readings combine verified astrological calculations with AI-powered interpretation:

• Birth charts use precise planetary positions from NASA ephemeris data
• Tarot readings use established card meanings with contextual interpretation
• Compatibility reports analyze multiple synastry factors
• AI augments but doesn't replace traditional astrological wisdom

Accuracy depends on:
• Precise birth time and location for natal charts
• The complexity of your question for tarot
• Your openness to interpretation

While we strive for accuracy, readings are for entertainment and self-reflection purposes. We recommend using them as guidance, not definitive predictions.`
    },
    {
      question: "Is my personal information safe?",
      answer: `Absolutely. We take your privacy seriously:

• Birth data (time/location) is encrypted and never sold
• Reading history is private to your account
• No social media tracking or data sharing
• GDPR compliant for EU users
• You can delete your data anytime in account settings

We only use your birth information to generate accurate astrological readings. We don't share it with advertisers, partners, or third parties.

See our full Privacy Policy for complete details.`
    }
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* FAQ Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-purple-200 text-lg max-w-2xl mx-auto">
            Everything you need to know about pricing, credits, and getting the most from your spiritual journey
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`bg-white/10 backdrop-blur-sm rounded-xl border transition-all duration-200 ${
                openIndex === index 
                  ? "border-purple-400/50 shadow-lg shadow-purple-500/10" 
                  : "border-white/20 hover:border-white/40"
              }`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="text-white font-semibold text-lg pr-4">{faq.question}</span>
                <ChevronDown
                  className={`w-6 h-6 text-purple-400 flex-shrink-0 transition-transform duration-200 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? "max-h-96" : "max-h-0"
                }`}
              >
                <div className="px-6 pb-6">
                  <div className="h-px bg-white/20 mb-4"></div>
                  <p className="text-purple-200 whitespace-pre-line leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Still Have Questions */}
        <div className="mt-12 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-8 border border-white/20 text-center">
          <MessageCircle className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-3">Still have questions?</h3>
          <p className="text-purple-200 mb-6 max-w-lg mx-auto">
            Can't find the answer you're looking for? Reach out to our support team and we'll get back to you within 24 hours.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@cosmicspiritguide.com"
              className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-semibold py-3 px-6 rounded-xl hover:bg-white/20 transition-all border border-white/20"
            >
              <Mail className="w-5 h-5" />
              support@cosmicspiritguide.com
            </a>
            <a
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
