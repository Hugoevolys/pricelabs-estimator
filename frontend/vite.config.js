import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    strictPort: false,
    // En dev, on proxy /api vers le backend local pour éviter les soucis CORS.
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
