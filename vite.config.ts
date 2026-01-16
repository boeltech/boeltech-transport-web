import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@app": path.resolve(__dirname, "./src/app"),
      "@features": path.resolve(__dirname, "./src/features"),
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@widgets": path.resolve(__dirname, "./src/widgets"),
      "@pages": path.resolve(__dirname, "./src/pages"),
    },
  },

  // SOLO PARA CONFIG DE SHADCN/UI
  // resolve: {
  //   alias: {
  //     "@": path.resolve(__dirname, "./src"),
  //   },
  // },
});

// server: {
//     port: 3001,
//     open: true,

//     // ✅ Proxy para evitar CORS en desarrollo
//     proxy: {
//       "/api": {
//         target: "http://localhost:3000", // URL del backend
//         changeOrigin: true,
//         secure: false,
//       },
//     },
//   },
