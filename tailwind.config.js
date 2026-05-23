/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        stadium: "#05070A",
        cyanlive: "#00E5FF",
        goldcup: "#FFD700"
      }
    },
  },
  plugins: [],
};
