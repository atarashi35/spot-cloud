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
