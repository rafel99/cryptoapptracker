/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#0B0E11",
        panel: "#12161C",
        raised: "#181D25",
        hairline: "#232933",
        ink: "#E4E9F0",
        mute: "#7A8494",
        faint: "#4B5563",
        up: "#17C99B",
        down: "#FF5C5C",
        signal: "#E8B339",
        // light mode
        "void-lt": "#F4F5F7",
        "panel-lt": "#FFFFFF",
        "raised-lt": "#F9FAFB",
        "hairline-lt": "#E2E5EA",
        "ink-lt": "#12161C",
        "mute-lt": "#6B7280",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        ticker: "ticker 45s linear infinite",
        pulseDot: "pulseDot 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
