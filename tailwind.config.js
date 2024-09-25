/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "metamask-active": "#007aa6",
        "metamask-default": "#2a2c3f",
      },
    },
  },
  plugins: [],
};
