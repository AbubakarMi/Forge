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
          secondary: "#7C3AED",
          accent: "#F97316",
          background: "#0F172A",
          surface: "#1E293B",
          border: "#334155",
          text: "#F8FAFC",
          muted: "#94A3B8"
        }
      },
    },
  },
  plugins: [],
}

export default config
