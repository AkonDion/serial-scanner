import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Expose to all network interfaces
    port: 5173,
    strictPort: true, // Fail if port is in use
    https: false, // Enable if you need HTTPS locally
    cors: {
      origin: "*", // Be more restrictive in production
      methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    },
    allowedHosts: ["scan.comforthub.app", "localhost"],
  },
  preview: {
    port: 5173,
    strictPort: true,
    host: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@assets": path.resolve(__dirname, "./src/assets"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ocr-vendor": ["tesseract.js"],
        },
      },
    },
    // Optimize build for production
    target: "esnext",
    minify: "terser",
    sourcemap: false,
  },
});
