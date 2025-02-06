import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        host: true,
    },
    preview: {
        port: 3000,
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
        // Add security headers
        assetsDir: "assets",
        outDir: "dist",
        emptyOutDir: true,
    },
});
