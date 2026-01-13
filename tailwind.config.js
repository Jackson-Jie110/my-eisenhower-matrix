/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit", "sans-serif"],
      },
      // ÑÏ¸ñ¸´¿Ì Flat Design É«°å
      colors: {
        primary: {
          DEFAULT: "#3B82F6", // Blue 500
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#10B981", // Emerald 500
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#F59E0B", // Amber 500
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F3F4F6", // Gray 100
          foreground: "#111827",
        }
      }
    },
  },
  plugins: [],
}
