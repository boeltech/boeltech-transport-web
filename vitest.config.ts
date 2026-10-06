import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

/**
 * Convención: un test que necesita DOM (jsdom, Testing Library, renderHook,
 * window/document/storage) vive en `*.test.tsx`; `*.test.ts` corre en node.
 * `src/smoke/**` es el proyecto `flows` sin importar la extensión.
 *
 * Smokes: un archivo por flujo, `src/smoke/<slug>.smoke.test.tsx`. Se corren con
 * `npm run test:flows -- <slug>` (filtro de Vitest por nombre de archivo); no se
 * agregan scripts `test:smoke:*` nuevos — los existentes son alias deprecados.
 */
const SMOKE = "src/smoke/**";
const DOM_SETUP = "./src/test/setup.dom.ts";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    // Tope global: todos los proyectos comparten un solo pool y este límite
    // (mismo `sequence.groupOrder`). `--maxWorkers` por CLI NO se propaga a
    // los proyectos; para serializar usa `--no-file-parallelism` o VITEST_SERIAL=1.
    maxWorkers: process.env.CI ? undefined : 2,
    fileParallelism: process.env.VITEST_SERIAL !== "1",
    // vmForks reutiliza el entorno jsdom entre archivos; el tope recicla el
    // worker antes de que su heap crezca sin control. Con 512MB el pico local
    // ronda ~2 GB con 2 workers (1GB lo sube a ~3 GB en máquinas de 12 GB).
    vmMemoryLimit: "512MB",
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          pool: "threads",
          include: ["src/**/*.test.ts"],
          exclude: [...configDefaults.exclude, SMOKE],
        },
      },
      {
        extends: true,
        test: {
          name: "dom",
          environment: "jsdom",
          pool: "vmForks",
          setupFiles: [DOM_SETUP],
          include: ["src/**/*.test.tsx"],
          exclude: [...configDefaults.exclude, SMOKE],
        },
      },
      {
        extends: true,
        test: {
          name: "flows",
          environment: "jsdom",
          pool: "vmForks",
          setupFiles: [DOM_SETUP],
          include: [`${SMOKE}/*.test.{ts,tsx}`],
        },
      },
    ],
  },
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
});
