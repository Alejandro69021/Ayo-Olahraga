import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        volt: {
          DEFAULT: "#DFFF00",
          light: "#EAFF4D",
          dark: "#BFE000",
          glow: "rgba(223, 255, 0, 0.4)",
        },
        onyx: {
          950: "#080808",
          900: "#0E0E0E",
          850: "#141414",
          800: "#1C1C1C",
          700: "#282828",
          600: "#383838",
        },
        pump: {
          DEFAULT: "#FF3E00",
          glow: "rgba(255, 62, 0, 0.5)",
        },
      },
      fontFamily: {
        metric: ["Oswald", "Impact", "sans-serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      boxShadow: {
        volt: "0 0 20px rgba(223, 255, 0, 0.35)",
        "volt-lg": "0 0 35px rgba(223, 255, 0, 0.5)",
        pump: "0 0 20px rgba(255, 62, 0, 0.4)",
      },
    },
  },
  plugins: [],
};
export default config;

