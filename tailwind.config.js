/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "golf-green": {
          900: "#1a3d20",
          800: "#215127",
          700: "#2a6a33",
          600: "#339940",
          500: "#3db34d",
        },
        gold: {
          600: "#8a670b",
          500: "#A67C0D",
          400: "#c4960f",
          300: "#e6b012",
        },
      },
      fontFamily: {
        heading: ['"Roboto Slab"', "serif"],
        body: ['"Source Sans Pro"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
