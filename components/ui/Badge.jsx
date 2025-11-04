"use client";

/**
 * Badge - Small status badge component
 * 
 * Props:
 * - children: Badge content
 * - variant: "default" | "success" | "error" | "warning" | "info" | "premium" (default: "default")
 * - size: "sm" | "md" | "lg" (default: "md")
 * - className: Additional CSS classes
 */
export default function Badge({
  children,
  variant = "default",
  size = "md",
  className = "",
}) {
  const variantClasses = {
    default: "bg-purple-500/30 text-purple-200 border-purple-400/50",
    success: "bg-green-500/30 text-green-200 border-green-400/50",
    error: "bg-red-500/30 text-red-200 border-red-400/50",
    warning: "bg-yellow-500/30 text-yellow-200 border-yellow-400/50",
    info: "bg-blue-500/30 text-blue-200 border-blue-400/50",
    premium: "bg-gradient-to-r from-yellow-500/30 to-orange-500/30 text-yellow-200 border-yellow-400/50",
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <span
      className={`
        inline-flex items-center font-semibold rounded-full border
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

