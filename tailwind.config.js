/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#eef3f8',
        panel: '#ffffff',
        ink: {
          DEFAULT: '#0f172a',
          muted: '#475569',
          subtle: '#64748b'
        },
        border: {
          DEFAULT: '#e2e8f0',
          strong: '#cbd5e1'
        },
        primary: {
          DEFAULT: '#1d4ed8',
          hover: '#1e40af',
          soft: '#dbeafe',
          fg: '#ffffff'
        },
        accent: {
          DEFAULT: '#0d9488',
          soft: '#ccfbf1',
          ink: '#0f766e'
        },
        success: {
          DEFAULT: '#16a34a',
          soft: '#dcfce7',
          ink: '#166534'
        },
        warning: {
          DEFAULT: '#d97706',
          soft: '#fef3c7',
          ink: '#92400e'
        },
        danger: {
          DEFAULT: '#dc2626',
          soft: '#fee2e2'
        },
        surface: {
          muted: '#f1f5f9'
        }
      },
      fontFamily: {
        sans: ["'Segoe UI'", 'system-ui', '-apple-system', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 2px rgb(15 23 42 / 0.06), 0 2px 10px rgb(15 23 42 / 0.04)',
        header: '0 1px 0 rgb(15 23 42 / 0.04)',
        'auth-card':
          '0 1px 0 rgb(255 255 255 / 0.95) inset, 0 22px 56px rgb(15 23 42 / 0.12), 0 0 0 1px rgb(37 99 235 / 0.06)'
      },
      keyframes: {
        authCardIn: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        authCardIn: 'authCardIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) both'
      }
    }
  },
  plugins: []
}
