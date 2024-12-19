/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      backgroundImage: {
        "checked-circle":
          "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-2 -2 12 12'%3e%3cpath fill='%23fff' d='M6.564.75l-3.59 3.612-1.538-1.55L0 4.26 2.974 7.25 8 2.193z'/%3e%3c/svg%3e\")",
      },
      colors: {
        "metamask-active": "#007aa6",
        "metamask-default": "#2a2c3f",
        "body-bg": "var(--body-bg)",
        primary: "var(--primary)",
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
