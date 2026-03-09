// tailwind.config.js
const { heroui } = require("@heroui/react")


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
          background: "#090A0F",
          foreground: "#F8FAFC",
          focus: "#107C10",
          divider: "#1E2235",
          content1: "#131620",
          content2: "#181C28",
          content3: "#1E2235",
          content4: "#2A2E42",
          default: {
            50: "#0F121A",
            100: "#131620",
            200: "#1E2235",
            300: "#2A2E42",
            400: "#64748B",
            500: "#94A3B8",
            600: "#CBD5E1",
            700: "#E2E8F0",
            800: "#F8FAFC",
            900: "#FFFFFF",
            foreground: "#F8FAFC",
          },
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