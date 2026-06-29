import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In local dev, run `vercel dev` to get /api/* working alongside Vite.
// Vite proxies /api to localhost:3000 if you prefer running them separately.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
