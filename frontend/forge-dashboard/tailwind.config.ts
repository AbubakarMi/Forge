import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        forge: {
          primary: "#4F46E5",
          accent: "#4F46E5",
          background: "#FFFFFF",
          surface: "#F8FAFC",
          border: "#E2E8F0",
          text: "#0F172A",
          muted: "#64748B",
          secondary: "#7C3AED", // Keep a secondary for variety
        }
      },
    },
  },
  plugins: [],
}

export default config
