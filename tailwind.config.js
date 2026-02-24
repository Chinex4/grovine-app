/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        satoshi: ["Satoshi", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: '#4CAF50',
          dark: '#388E3C',
          light: '#C8E6C9',
        },
        secondary: '#FF9800',
        background: '#FFFFFF',
        text: {
          DEFAULT: '#333333',
          light: '#757575',
          dark: '#212121',
        },
      },
    },
  },
  plugins: [],
}
