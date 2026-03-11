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
          accent: "#6366F1",
          background: "#FFFFFF",
          surface: "#F8FAFC",
          surface2: "#F1F5F9",
          border: "#E2E8F0",
          text: "#0F172A",
          body: "#475569",
          muted: "#94A3B8",
          secondary: "#7C3AED",
        }
      },
    },
  },
  plugins: [],
}

export default config
