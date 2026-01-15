/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["\"Noto Sans SC\"", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        background: "#0f172a",
        glass: {
          100: "rgba(255, 255, 255, 0.1)",
          200: "rgba(255, 255, 255, 0.2)",
          border: "rgba(255, 255, 255, 0.15)",
        },
        neon: {
          red: "#f87171",
          blue: "#60a5fa",
          yellow: "#facc15",
          gray: "#94a3b8",
        },
      },
    },
  },
  plugins: [],
};
