// tailwind.config.js
const {heroui} = require("@heroui/react")


/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./renderer/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [heroui({
    themes: {
      "xbox-dark": {
        extend: "dark",
        colors: {
          primary: {
            50: "#DCF8CD",
            100: "#DCF8CD",
            200: "#B3F19D",
            300: "#7AD766",
            400: "#47B03D",
            500: "#107C10",
            600: "#0B6A13",
            700: "#085916",
            800: "#054716",
            900: "#033B16",
            DEFAULT: "#107C10",
            foreground: "#ffffff",
          },
        }
      },
      "xbox-light": {
        extend: "light",
        colors: {
          primary: {
            50: "#DCF8CD",
            100: "#DCF8CD",
            200: "#B3F19D",
            300: "#7AD766",
            400: "#47B03D",
            500: "#107C10",
            600: "#0B6A13",
            700: "#085916",
            800: "#054716",
            900: "#033B16",
            DEFAULT: "#107C10",
          },
        }
      }
    }
  })]
}