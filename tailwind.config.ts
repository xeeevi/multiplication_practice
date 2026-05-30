import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
      },
      colors: {
        // Palette — mirrors the CSS custom properties in the legacy design
        school: {
          green:      '#27ae60',
          'green-sh': '#1e8449',
          yellow:     '#f39c12',
          'yellow-sh':'#d68910',
          orange:     '#e67e22',
          'orange-sh':'#ca6f1e',
          coral:      '#e74c3c',
          'coral-sh': '#cb4335',
          blue:       '#2980b9',
          'blue-sh':  '#1f618d',
          purple:     '#8e44ad',
          'purple-sh':'#6c3483',
          bg:         '#fff8ef',
          card:       '#ffffff',
          card2:      '#fef5e7',
          text:       '#2d2a26',
          soft:       '#6b6560',
          border:     '#e0d5c8',
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        // Floating math symbols in background
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%':      { transform: 'translateY(-18px) rotate(8deg)' },
        },
        // Input shake on wrong answer
        shake: {
          '0%, 100%':       { transform: 'translateX(0)' },
          '20%, 60%':       { transform: 'translateX(-8px)' },
          '40%, 80%':       { transform: 'translateX(8px)' },
        },
        // Green glow flash on correct answer
        flashGreen: {
          '0%':   { boxShadow: '0 6px 0 #e0d5c8, 0 0 0 0 rgba(39,174,96,0.5)' },
          '100%': { boxShadow: '0 6px 0 #e0d5c8, 0 0 55px 22px rgba(39,174,96,0)' },
        },
        // Timer warning pulse
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.45' },
        },
        // New-record badge bounce
        bounce: {
          from: { transform: 'scale(1)' },
          to:   { transform: 'scale(1.08)' },
        },
        // Confetti piece falling
        confettiFall: {
          to: {
            top: '110vh',
            transform: 'rotate(var(--rot)) translateX(var(--drift))',
          },
        },
      },
      animation: {
        float:        'float var(--dur, 6s) ease-in-out infinite',
        shake:        'shake 0.4s ease-in-out',
        flashGreen:   'flashGreen 0.5s ease-out',
        pulse:        'pulse 0.5s ease-in-out infinite',
        'pulse-fast': 'pulse 0.3s ease-in-out infinite',
        bounce:       'bounce 0.6s ease-in-out infinite alternate',
        confettiFall: 'confettiFall var(--fall-dur, 2s) linear forwards',
      },
    },
  },
  plugins: [],
} satisfies Config
