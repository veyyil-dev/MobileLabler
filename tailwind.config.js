// import gluestackPlugin from '@gluestack-ui/nativewind-utils/tailwind-plugin';

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "media",
  content: ["app/**/*.{tsx,jsx,ts,js}", "components/**/*.{tsx,jsx,ts,js}"],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Basic color palette
        primary: {
          500: '#4e54c8',
          600: '#3f44b5',
          700: '#2f348e',
        },
        secondary: {
          500: '#667eea',
          600: '#5a6ed3',
          700: '#4b5bc7',
        },
        error: {
          500: '#f44336',
          600: '#e53935',
          700: '#d32f2f',
        },
        success: {
          500: '#38ef7d',
          600: '#32d670',
          700: '#27ae60',
        },
        warning: {
          500: '#f1c40f',
          600: '#e0b50c',
          700: '#d39c09',
        },
        info: {
          500: '#4285F4',
          600: '#3a77db',
          700: '#3367d6',
        },
        background: {
          light: '#FBFBFB',
          dark: '#181719',
        },
      },
      fontFamily: {
        roboto: ['Roboto', 'sans-serif'],
      },
      fontSize: {
        '2xs': '10px',
      },
      boxShadow: {
        'soft-1': '0px 0px 10px rgba(38, 38, 38, 0.1)',
        'soft-2': '0px 0px 20px rgba(38, 38, 38, 0.2)',
      },
    },
  },
  plugins: [],
};
