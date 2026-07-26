/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "#404040",
        input: "#404040",
        ring: "#991b1b",
        background: "#0a0a0a",
        foreground: "#e5e5e5",
        primary: {
          DEFAULT: "#991b1b",
          foreground: "#e5e5e5",
        },
        secondary: {
          DEFAULT: "#171717",
          foreground: "#e5e5e5",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "#171717",
          foreground: "#e5e5e5",
        },
        accent: {
          DEFAULT: "#b91c1c",
          foreground: "#e5e5e5",
        },
        popover: {
          DEFAULT: "#0a0a0a",
          foreground: "#e5e5e5",
        },
        card: {
          DEFAULT: "#171717",
          foreground: "#e5e5e5",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        heading: ["var(--font-heading)"],
        sans: ["var(--font-sans)"],
        pirata: ["var(--font-pirata)"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
