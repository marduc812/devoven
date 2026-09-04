import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

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
      },
      // The theme is switched by overriding utility classes in globals.css, so
      // prose has to take its color from the container it sits in rather than
      // baking in gray-900. Borders and the code-block background stay as the
      // plugin ships them; they read on both themes.
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body': 'inherit',
            '--tw-prose-headings': 'inherit',
            '--tw-prose-lead': 'inherit',
            '--tw-prose-links': 'inherit',
            '--tw-prose-bold': 'inherit',
            '--tw-prose-counters': 'inherit',
            '--tw-prose-bullets': 'inherit',
            '--tw-prose-quotes': 'inherit',
            '--tw-prose-captions': 'inherit',
            '--tw-prose-code': 'inherit',
            // The plugin wraps inline code in literal backticks and
            // blockquotes in curly quotes. Neither belongs in a preview of
            // markdown that already shows the source next to it.
            'code::before': { content: 'none' },
            'code::after': { content: 'none' },
            'blockquote p:first-of-type::before': { content: 'none' },
            'blockquote p:last-of-type::after': { content: 'none' },
          },
        },
      },
    },
  },
  plugins: [typography],
}
export default config
