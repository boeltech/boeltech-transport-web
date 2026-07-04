import path from "path";
import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";

function buildSentryVitePlugin(): PluginOption | null {
  const authToken = process.env.SENTRY_AUTH_TOKEN;
  const org = process.env.SENTRY_ORG;
  const project = process.env.SENTRY_PROJECT;

  if (!authToken || !org || !project) {
    return null;
  }

  return sentryVitePlugin({
    org,
    project,
    authToken,
    release: {
      name: process.env.VITE_GIT_SHA || process.env.VITE_APP_VERSION,
    },
    sourcemaps: {
      filesToDeleteAfterUpload: ["./dist/**/*.map"],
    },
  });
}

const sentryPlugin = buildSentryVitePlugin();

// https://vite.dev/config/
export default defineConfig({
  // Carga .env*, .env.local, etc. desde env/ (alineado con env/.env.example y env/.env.local)
  envDir: path.resolve(__dirname, "env"),
  build: {
    sourcemap: Boolean(sentryPlugin),
  },
  plugins: [react(), tailwindcss(), ...(sentryPlugin ? [sentryPlugin] : [])],
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

  server: {
    watch: {
      ignored: ["**/boeltech-cfdi-domain/dist/**"],
    },
  },
});
