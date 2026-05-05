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
        // WARM NEBULA DESIGN SYSTEM
        cosmic: {
          void: '#050214',        // Deepest space black-purple
          indigo: '#1a0f3c',      // Rich cosmic indigo
          violet: '#7c3aed',      // Electric violet accents
          gold: '#d4af37',        // Mystical gold
          rose: '#c45b7a',        // Warm cosmic rose
          lavender: '#c4b5fd',    // Soft lilac text
          cream: '#faf8f5',       // Light background (legacy)
          midnight: '#0f0f1a',    // Darker variant (legacy)
          purple: '#7c3aed',      // LEGACY ALIAS for cosmic-violet
          
          // Additional warm nebula tokens
          amber: '#d4936a',
          teal: '#5b8a8a',
          aqua: '#7ab5b5',
          taupe: '#9a8b84',
          deep: '#0a0c12',
        },
        
        // Legacy aliases
        pink: '#d4727a',
        
        accent: {
          1: '#e8a87c',
          2: '#b8a9a1',
          3: '#c45b7a',
          4: '#5b8a8a',
        },
        
        text: {
          DEFAULT: '#f5efe6',
          muted: 'rgba(245,239,230,0.55)',
          dark: '#14121c',
        },
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'var(--font-cormorant)', 'Georgia', 'serif'],
        body: ['var(--font-inter)', 'var(--font-source)', 'system-ui', 'sans-serif'],
      },
      spacing: {
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
        soft: '0 4px 20px rgba(12,10,20,0.12)',
        'focus-ring': '0 0 0 3px rgba(232,168,124,0.25)',
        copper: '0 4px 20px rgba(232,168,124,0.18)',
        rose: '0 4px 20px rgba(196,91,122,0.18)',
      },
      backgroundImage: {
        'nebula': 'radial-gradient(ellipse at top right, rgba(196,91,122,0.08), transparent 60%), radial-gradient(ellipse at bottom left, rgba(232,168,124,0.05), transparent 60%)',
        'stars': 'radial-gradient(ellipse at bottom, rgba(245,239,230,0.03), transparent 70%)',
        'copper-gradient': 'linear-gradient(135deg, #e8a87c 0%, #f4c8a0 50%, #e8a87c 100%)',
        'midnight': 'linear-gradient(180deg, #0c0a14 0%, #14121c 100%)',
        'warm-dark': 'linear-gradient(135deg, #0c0a14 0%, #14121c 50%, #1a1418 100%)',
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
          '0%': { boxShadow: '0 0 5px rgba(232,168,124,0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(232,168,124,0.4), 0 0 40px rgba(232,168,124,0.2)' },
        },
      },
    },
  },
  plugins: [],
}
