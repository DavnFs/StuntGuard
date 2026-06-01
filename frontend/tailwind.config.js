/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Noto Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["Figtree", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "rgb(var(--color-brand-50) / <alpha-value>)",
          100: "rgb(var(--color-brand-100) / <alpha-value>)",
          200: "rgb(var(--color-brand-200) / <alpha-value>)",
          300: "rgb(var(--color-brand-300) / <alpha-value>)",
          400: "rgb(var(--color-brand-400) / <alpha-value>)",
          500: "rgb(var(--color-brand-500) / <alpha-value>)",
          600: "rgb(var(--color-brand-600) / <alpha-value>)",
          700: "rgb(var(--color-brand-700) / <alpha-value>)",
          800: "rgb(var(--color-brand-800) / <alpha-value>)",
          900: "rgb(var(--color-brand-900) / <alpha-value>)",
        },
        care: {
          50: "rgb(var(--color-care-50) / <alpha-value>)",
          100: "rgb(var(--color-care-100) / <alpha-value>)",
          200: "rgb(var(--color-care-200) / <alpha-value>)",
          300: "rgb(var(--color-care-300) / <alpha-value>)",
          400: "rgb(var(--color-care-400) / <alpha-value>)",
          500: "rgb(var(--color-care-500) / <alpha-value>)",
          600: "rgb(var(--color-care-600) / <alpha-value>)",
          700: "rgb(var(--color-care-700) / <alpha-value>)",
          800: "rgb(var(--color-care-800) / <alpha-value>)",
          900: "rgb(var(--color-care-900) / <alpha-value>)",
        },
        canvas: "rgb(var(--color-canvas) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        ink: {
          DEFAULT: "rgb(var(--color-ink) / <alpha-value>)",
          deep: "rgb(var(--color-ink-deep) / <alpha-value>)",
        },
      },
      boxShadow: {
        card: "0 16px 45px -30px rgb(var(--color-brand-800) / 0.38)",
      },
    },
  },
  plugins: [],
};
