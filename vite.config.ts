import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    host: true,
    // @ts-ignore
    allowedHosts: [
      "orange-rabbits-follow.loca.lt",
      ".loca.lt",
      "uncover-projector-dastardly.ngrok-free.dev",
      ".ngrok-free.dev",
      "localhost",
      "127.0.0.1"
    ],
    // Để Vite tự động nhận diện cổng và host cho HMR
    // Điều này giúp tránh lỗi vòng lặp reload trên localhost
    hmr: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8002",
        changeOrigin: true
      },
      "/static": {
        target: "http://127.0.0.1:8002",
        changeOrigin: true
      }
    }
  }
});