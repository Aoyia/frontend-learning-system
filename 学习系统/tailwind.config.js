/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'md': '769px',
      },
      colors: {
        primary: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--primary-hover, #5a52d5)', // 如果有需要我们提供一个fallback
          light: 'var(--primary-light)',
          muted: 'var(--primary-muted)',
        },
        secondary: 'var(--accent2)',
        success: {
          DEFAULT: 'var(--success)',
          light: 'var(--success-light)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          light: 'var(--warning-light)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          light: 'var(--danger-light)',
        },
        bg: 'var(--bg)',
        surface: {
          DEFAULT: 'var(--surface)',
          alt: 'var(--surface2)',
        },
        border: 'var(--border)',
        text: {
          DEFAULT: 'var(--text)',
          secondary: 'var(--text2)',
          strong: 'var(--strong-text)',
        }
      },
      spacing: {
        '4.5': '1.125rem', // 18px
        '7.5': '1.875rem', // 30px
        '2.25': '0.5625rem', // 9px
      }
    },
  },
  plugins: [],
}
