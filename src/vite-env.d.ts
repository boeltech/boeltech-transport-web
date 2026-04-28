/// <reference types="vite/client" />
// ↑ Hereda los tipos base de Vite (VITE_*, MODE, DEV, PROD, etc.)

interface ImportMetaEnv {
  // Aquí declaras TUS variables personalizadas
  readonly VITE_API_URL: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Local-only pages under `src/pages/dev/` (gitignored).
 * Keeps `tsc` happy when those files are absent in CI clones.
 */
declare module "@/pages/dev/address-input" {
  import type { FC } from "react";
  const Page: FC;
  export default Page;
}
