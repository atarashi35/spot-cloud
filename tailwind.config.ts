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
        ink: "#13231c",
        moss: "#2f5d50",
        clay: "#8e6a52",
        sand: "#f3ebde",
        mist: "#f7f5ef"
      },
      boxShadow: {
        card: "0 20px 50px rgba(19, 35, 28, 0.08)"
      },
      fontFamily: {
        sans: ["'Noto Sans JP'", "sans-serif"],
        serif: ["'Noto Serif JP'", "serif"]
      }
    }
  },
  plugins: []
};

export default config;
