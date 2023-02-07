/** @type {import('tailwindcss').Config} */
module.exports = {
  purge: ['./src/**/*.vue'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors:{
        'mjsoul-text-gold': '#bfac8c',
        'mjsoul-text-lightblue': '#9eb9f7',
        'mjsoul-bg-blue': '#1d213a',
        'mjsoul-fl-blue': '#242c43',
        'mjsoul-grad-dark-blue': '#111F40',
        'mjsoul-grad-middle-blue': '#1E2C4E',
        'mjsoul-grad-light-blue':'#223155',
        'mjsoul-card-blue':'#051434',
      },
    },
  },
  variants: {
    extend: {
      borderWidth: ['hover']
    },
  },
  plugins: [],
}
