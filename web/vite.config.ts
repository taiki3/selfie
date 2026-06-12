/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Dev server proxies API + probe paths to the local Fastify backend so the
// frontend always talks to relative paths (mirrors nginx in production).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: true },
      "/health": "http://localhost:3001",
      "/ready": "http://localhost:3001",
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
