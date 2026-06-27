/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        ink: {
          DEFAULT: "#0A0E17",
          800: "#0D1220",
          700: "#111726",
        },
        surface: {
          DEFAULT: "#121829",
          hover: "#161E32",
          raised: "#19223A",
        },
        line: {
          DEFAULT: "rgba(148,163,184,0.10)",
          strong: "rgba(148,163,184,0.18)",
        },
        content: {
          DEFAULT: "#E8ECF4",
          muted: "#9AA6B8",
          dim: "#66728A",
        },
        iris: {
          DEFAULT: "#6366F1",
          bright: "#818CF8",
          deep: "#4F46E5",
        },
        violet: { DEFAULT: "#A855F7" },
        // Severity / health scale (meaningful, not decorative)
        critical: "#FB7185",
        serious: "#FB923C",
        moderate: "#FBBF24",
        minor: "#64748B",
        pass: "#34D399",
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.02) inset, 0 8px 30px -12px rgba(0,0,0,0.5)",
        glow: "0 0 0 1px rgba(99,102,241,0.4), 0 8px 40px -8px rgba(99,102,241,0.45)",
      },
      backgroundImage: {
        "iris-violet": "linear-gradient(135deg, #6366F1 0%, #A855F7 100%)",
        "grid-faint":
          "linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        scan: {
          "0%": { transform: "translateY(-10%)" },
          "100%": { transform: "translateY(1000%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};
