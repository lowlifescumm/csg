// app/components/Logo.tsx — Updated with new branding
// Replace existing logo implementation in your header

import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  variant?: 'primary' | 'dark' | 'icon';
  className?: string;
  alt?: string;
}

export function Logo({ 
  variant = 'primary', 
  className = '',
  alt = 'Cosmic Spirit Guide — Tarot Readings & Astrology'
}: LogoProps) {
  const logoSrc = variant === 'dark' 
    ? '/logos/csg-logo-dark.svg'
    : variant === 'icon'
    ? '/logos/csg-icon.svg'
    : '/logos/csg-logo-primary.svg';

  const dimensions = variant === 'icon' 
    ? { width: 40, height: 40 }
    : { width: 160, height: 48 };

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
          unoptimized={true}
        />
      </div>
    </Link>
  );
}

// Usage in header:
// <Logo variant="primary" alt="Cosmic Spirit Guide — Free Tarot Readings" />