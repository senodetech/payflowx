/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f8ff',
          100: '#ebf1ff',
          500: '#2563eb', // Stripe-like Indigo / Blue
          600: '#1d4ed8',
          700: '#1e40af',
        }
      }
    },
  },
  plugins: [],
}
