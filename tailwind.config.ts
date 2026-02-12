import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#DC2626",
          dark: "#B91C1C",
          light: "#EF4444",
        },
        success: {
          DEFAULT: "#10B981",
          dark: "#059669",
        },
      },
    },
  },
  plugins: [],
};
export default config;
