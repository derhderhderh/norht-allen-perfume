import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#191512",
        smoke: "#F6F1EA",
        pearl: "#FFFDF8",
        champagne: "#D7B56D",
        moss: "#6C7159",
        clay: "#B08365",
        rosewood: "#7A4E45"
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "sans-serif"]
      },
      boxShadow: {
        glass: "0 24px 80px rgba(49, 38, 25, 0.10)",
        glow: "0 18px 45px rgba(215, 181, 109, 0.24)"
      },
      backgroundImage: {
        veil: "radial-gradient(circle at top left, rgba(215,181,109,.24), transparent 28%), linear-gradient(135deg, #fffdf8 0%, #f6f1ea 50%, #efe2d4 100%)"
      }
    }
  },
  plugins: []
};

export default config;
