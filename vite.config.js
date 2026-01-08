import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@app": path.resolve(__dirname, "./src/app"),
      "@/pages": path.resolve(__dirname, "./src/pages"),
      "@/widgets": path.resolve(__dirname, "./src/widgets"),
      "@features": path.resolve(__dirname, "./src/features"),
      "@entities": path.resolve(__dirname, "./src/entities"),
      "@shared": path.resolve(__dirname, "./src/shared"),
    },
  },
  server: {
    port: 3001,
    open: true,

    // ✅ Proxy para evitar CORS en desarrollo
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // URL del backend
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    // Optimizaciones de build
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-dropdown-menu'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'query-vendor': ['@tanstack/react-query'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  },
});
