"use client";
import { DollarSign } from "lucide-react";

/**
 * WalletBalanceDisplay - Component to display USD wallet balance
 * 
 * Props:
 * - balance: USD balance as number (required)
 * - className: Additional CSS classes (optional)
 * 
 * Visual Design:
 * - Green/teal color scheme to differentiate from purple credits
 * - DollarSign icon to indicate currency
 * - Clear label "Advisor Balance" to distinguish from AI Credits
 * - USD format with $ symbol and 2 decimal places
 */
export default function WalletBalanceDisplay({ balance, className = "" }) {
  // Format balance to 2 decimal places with proper fallback
  const formattedBalance = typeof balance === 'number' 
    ? balance.toFixed(2) 
    : '0.00';
  
  return (
    <div className={`flex items-center gap-2 px-4 py-2 bg-green-500 bg-opacity-10 rounded-xl border border-green-400 border-opacity-30 hover:bg-opacity-20 smooth-transition ${className}`}>
      <DollarSign className="w-5 h-5 text-green-400" />
      <div className="flex flex-col">
        <span className="text-xs text-green-300 leading-none">Advisor Balance</span>
        <span className="text-white font-semibold leading-tight">${formattedBalance}</span>
      </div>
    </div>
  );
}

