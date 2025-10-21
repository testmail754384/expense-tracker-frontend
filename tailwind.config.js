// tailwind.config.js (or tailwind.config.cjs)
/** @type {import('tailwindcss').Config} */
export default { // or module.exports = { for CJS
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Make sure this matches your project structure
  ],
  darkMode: 'class', // <--- Add this line
  theme: {
    extend: {},
  },
  plugins: [],
}