/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'grid-cols-1',
    'grid-cols-2',
    'grid-cols-3',
  ],
  theme: {
    extend: {
      colors: {
        // NEW DESIGN SYSTEM: Spiritual/Mystical Palette
        cosmic: {
          indigo: '#1a1a2e',      // Primary: Deep indigo - spiritual, mysterious
          gold: '#d4af37',        // Accent: Gold - premium, trustworthy
          lavender: '#b19cd9',    // Secondary: Soft lavender - calming
          purple: '#7c3aed',      // CTA: Vibrant purple - action
          cream: '#faf8f5',       // Light background
          midnight: '#0f0f1a',    // Darker variant
        },
        // Legacy colors (for gradual migration)
        pink: '#EC4899',
        // Theme accent colors
        accent: {
          1: '#d4af37',  // Gold
          2: '#b19cd9',  // Lavender
          3: '#7c3aed',  // Purple
          4: '#1a1a2e',  // Indigo
        },
        // Text colors
        text: {
          DEFAULT: '#1a1a2e',
          muted: 'rgba(26, 26, 46, 0.62)',
          light: '#faf8f5',
        },
      },
      fontFamily: {
        // NEW: Elegant serif for headlines
        display: ['var(--font-playfair)', 'var(--font-cormorant)', 'Georgia', 'serif'],
        // NEW: Clean sans-serif for body
        body: ['var(--font-inter)', 'var(--font-source)', 'system-ui', 'sans-serif'],
      },
      spacing: {
        // Using spacing unit (8px) as base
        unit: 'var(--spacing-unit)',
        'unit-2': 'calc(var(--spacing-unit) * 2)',
        'unit-3': 'calc(var(--spacing-unit) * 3)',
        'unit-4': 'calc(var(--spacing-unit) * 4)',
        'unit-6': 'calc(var(--spacing-unit) * 6)',
        'unit-8': 'calc(var(--spacing-unit) * 8)',
      },
      borderRadius: {
        lg: 'var(--radius-lg)',
        md: 'var(--radius-md)',
      },
      boxShadow: {
        soft: '0 4px 20px rgba(26, 26, 46, 0.08)',
        'focus-ring': '0 0 0 3px rgba(124, 58, 237, 0.3)',
        gold: '0 4px 20px rgba(212, 175, 55, 0.25)',
        purple: '0 4px 20px rgba(124, 58, 237, 0.25)',
      },
      backgroundImage: {
        // NEW: Subtle celestial gradients (NOT generic)
        'celestial': 'radial-gradient(ellipse at top, rgba(177, 156, 217, 0.15), transparent 70%)',
        'stars': 'radial-gradient(ellipse at bottom, rgba(26, 26, 46, 0.05), transparent 70%)',
        'gold-gradient': 'linear-gradient(135deg, #d4af37 0%, #f4d03f 50%, #d4af37 100%)',
        'indigo-gradient': 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',
        'float': 'float 6s ease-in-out infinite',
        'twinkle': 'twinkle 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(212, 175, 55, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.6), 0 0 40px rgba(212, 175, 55, 0.3)' },
        },
      },
    },
  },
  plugins: [],
}
