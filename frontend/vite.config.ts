import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, "/");
          if (normalized.includes("node_modules/recharts") || normalized.includes("node_modules/d3")) {
            return "charts";
          }
          if (
            normalized.includes("node_modules/react") ||
            normalized.includes("node_modules/react-dom") ||
            normalized.includes("node_modules/react-router-dom")
          ) {
            return "react";
          }
          return undefined;
        },
      },
    },
  },
});
