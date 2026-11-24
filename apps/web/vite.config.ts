import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // The browser only ever talks to Vite (localhost:5173). Vite forwards
    // /api/* to the Express API, so to the browser it's all one website:
    // no CORS, and cookies just work (Milestone 6).
    //   browser → /api/plans  →  Vite  →  http://localhost:3000/plans
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
