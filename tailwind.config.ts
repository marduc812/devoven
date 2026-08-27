import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './*.ts',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './Components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    {
      pattern: /(group-hover:(bg|text)|bg|text|border)-\w+-([\d]{1,3}|[\d]{1,3}\/[\d]{1,3})/,
    },
    {
      pattern: /hover:(bg|border)-\w+-\d{1,3}\/\d{1,3}/,
    },
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      minWidth: {
        '350': '350px',
      }
    },
  },
  plugins: [],
}
export default config
