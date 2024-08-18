/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{tsx,jsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        roboto: 'Roboto_400Regular',
        'roboto-bold': 'Roboto_700Bold'
      },
    },
  },
  plugins: [],
}

