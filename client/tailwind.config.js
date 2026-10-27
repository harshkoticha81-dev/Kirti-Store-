/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#09090b', // Deep jet black
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        secondary: {
          DEFAULT: '#18181b', // Deep charcoal / dark slate
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          500: '#52525b',
          600: '#27272a',
          700: '#18181b',
          800: '#09090b',
        },
        accent: {
          DEFAULT: '#09090b', // Bold black accent
          hover: '#27272a',  // Charcoal hover
          50: '#f4f4f5',     // Soft gray container
          100: '#e4e4e7',    // Light gray border
          200: '#d4d4d8',
          500: '#18181b',
          600: '#09090b',
        },
        surface: {
          bg: '#f8fafc',      // Clean off-white canvas
          card: '#ffffff',    // Pure white cards
          border: '#e4e4e7',  // Crisp modern gray border
          muted: '#f4f4f5',   // Muted gray
          dark: '#18181b',    // Gray-black surface
        },
        charcoal: {
          DEFAULT: '#18181b', // Main charcoal text
          light: '#71717a',   // Subtle neutral gray text
          dark: '#09090b',    // Jet black headings
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
        'premium-hover': '0 20px 40px -10px rgba(0, 0, 0, 0.1), 0 8px 12px -3px rgba(0, 0, 0, 0.04)',
        'glow-accent': '0 0 25px rgba(0, 0, 0, 0.12)',
      }
    },
  },
  plugins: [],
}
