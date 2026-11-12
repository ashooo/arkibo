import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1d4ed8",
          dark: "#0037b0",
          light: "#2563eb",
          container: "#1d4ed8",
          "on-container": "#cad3ff",
          fixed: "#dce1ff",
          "fixed-dim": "#b7c4ff",
          "on-fixed": "#001551",
          soft: "#eff6ff",
        },
        secondary: {
          DEFAULT: "#10b981",
          dark: "#006c49",
          container: "#6cf8bb",
          "on-container": "#00714d",
          fixed: "#6ffbbe",
          "fixed-dim": "#4edea3",
          soft: "#ecfdf5",
        },
        tertiary: {
          DEFAULT: "#f59e0b",
          dark: "#623c00",
          container: "#825100",
          "on-container": "#ffcb8f",
          fixed: "#ffddb8",
          "fixed-dim": "#ffb95f",
          soft: "#fffbeb",
        },
        error: {
          DEFAULT: "#ba1a1a",
          container: "#ffdad6",
          "on-container": "#93000a",
          soft: "#fef2f2",
        },
        surface: {
          DEFAULT: "#faf8ff",
          bright: "#faf8ff",
          dim: "#d2d9f4",
          lowest: "#ffffff",
          low: "#f2f3ff",
          container: "#eaedff",
          high: "#e2e7ff",
          highest: "#dae2fd",
          variant: "#dae2fd",
          tint: "#2151da",
        },
        slate: {
          dark: "#0f172a",
          body: "#334155",
          muted: "#64748b",
          border: "#e2e8f0",
          canvas: "#f8fafc",
        },
        outline: {
          DEFAULT: "#747686",
          variant: "#c4c5d7",
        },
        "on-surface": {
          DEFAULT: "#131b2e",
          variant: "#434655",
        },
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "Plus Jakarta Sans", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.5rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
        full: "9999px",
      },
      spacing: {
        "space-xs": "0.25rem",
        "space-sm": "0.5rem",
        "space-md": "1rem",
        "space-lg": "1.5rem",
        "space-xl": "2rem",
        gutter: "1.5rem",
        margin: "2rem",
      },
      boxShadow: {
        subtle: "0 1px 3px rgba(15, 23, 42, 0.04)",
        card: "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
        floating: "0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.03)",
      },
    },
  },
  plugins: [],
};

export default config;

