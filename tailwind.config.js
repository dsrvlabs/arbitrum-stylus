/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "metamask-active": "#007aa6",
        "metamask-default": "#2a2c3f",
        "body-bg": "var(--body-bg)",
      },
      keyframes: {
        bouncingLoader: {
          to: {
            opacity: "0.1",
            transform: "translateY(-5px)",
          },
        },
      },
      animation: {
        bouncingLoader: "bouncingLoader 0.6s infinite alternate",
      },
    },
  },
  plugins: [
    function ({ addUtilities, e, theme, variants }) {
      const delays = theme("transitionDelay");
      const delayUtilities = Object.entries(delays).map(([key, value]) => ({
        [`.${e(`delay-${key}`)}`]: {
          animationDelay: value,
        },
      }));
      addUtilities(delayUtilities, variants("animationDelay"));
    },
  ],
};
