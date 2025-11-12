/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cosmic: {
          purple: '#8B5CF6',
          pink: '#EC4899',
          indigo: '#6366F1',
        },
        // Theme accent colors
        accent: {
          1: '#ff5db4',
          2: '#ff7a59',
          3: '#a86bff',
          4: '#ffb86b',
        },
        // Text colors
        text: {
          DEFAULT: '#ffffff',
          muted: 'rgba(255, 255, 255, 0.62)',
        },
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
        soft: 'var(--shadow-soft)',
        'focus-ring': 'var(--focus-ring)',
      },
      backdropBlur: {
        glass: 'var(--glass-blur)',
      },
      backgroundImage: {
        'gradient-bg': 'var(--bg-gradient)',
        'page-overlay': 'var(--page-bg-overlay)',
        'card-border': 'var(--card-border)',
      },
      backgroundColor: {
        'card-bg': 'var(--card-bg)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',
        'pulse-subtle': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounce 2s infinite',
        'gradient-pulse': 'gradientPulse 3s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        gradientPulse: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}

