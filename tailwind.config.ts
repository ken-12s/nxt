import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,md,mdx}',
    './components/**/*.{js,ts,jsx,tsx,md,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0f172a',
        panel: '#111827',
        text: '#e5e7eb',
        muted: '#9ca3af',
        border: '#1f2937',
        brand: '#60a5fa',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
export default config
