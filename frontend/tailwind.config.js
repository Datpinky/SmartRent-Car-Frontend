/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00b14f',
          dark: '#009940',
          light: '#e8f8ef',
        },
        secondary: '#1a1a2e',
        accent: '#ff6b35',
        'accent-sale': '#ff3b3b',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(0,0,0,0.08)',
        'md': '0 4px 16px rgba(0,0,0,0.10)',
        'lg': '0 8px 32px rgba(0,0,0,0.14)',
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
      },
      transitionDuration: {
        'DEFAULT': '200ms',
      },
      width: {
        'sidebar': '240px',
        'sidebar-collapsed': '68px',
      },
      margin: {
        'sidebar': '240px',
        'sidebar-collapsed': '68px',
      },
    },
  },
  plugins: [],
};
