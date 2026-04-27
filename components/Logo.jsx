"use client";
import Link from "next/link";
import Image from "next/image";

export function Logo({
  variant = "primary",
  className = "",
  alt = "Cosmic Spirit Guide — Tarot Readings & Astrology",
}) {
  const logoSrc =
    variant === "dark"
      ? "/logos/csg-logo-dark.svg"
      : variant === "icon"
      ? "/logos/csg-icon.svg"
      : "/logos/csg-logo-primary.svg";

  const dimensions =
    variant === "icon" ? { width: 40, height: 40 } : { width: 160, height: 48 };

  return (
    <Link
      href="/"
      className={`flex items-center group logo-wrapper ${className}`}
      aria-label="Cosmic Spirit Guide — Return to homepage"
    >
      <div className="relative overflow-hidden rounded-lg">
        <Image
          src={logoSrc}
          alt={alt}
          width={dimensions.width}
          height={dimensions.height}
          className="h-10 w-auto group-hover:scale-105 transition-transform duration-300"
          priority={true}
          fetchPriority="high"
        />
      </div>
    </Link>
  );
}
