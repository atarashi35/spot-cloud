import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111111",
        moss: "#e8261a",
        teal: {
          DEFAULT: "#0d9488",
          50:  "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          400: "#2dd4bf",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
        },
        clay: "#888888",
        sand: "#f4f4f4",
        mist: "#f8f8f8"
      },
      boxShadow: {
        card: "0 20px 50px rgba(0, 0, 0, 0.08)"
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "var(--font-noto)", "sans-serif"],
        serif: ["var(--font-outfit)", "var(--font-noto)", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
