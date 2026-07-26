/// <reference types="vite/client" />
// ↑ Hereda los tipos base de Vite (MODE, DEV, PROD, etc.)

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_API_TIMEOUT?: string;
  readonly VITE_GEO_PROVIDER?: string;
  readonly VITE_MAPBOX_PUBLIC_TOKEN?: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_DISABLE_DEV_POLLING?: string;
  readonly VITE_ENABLE_RETRY?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_ENVIRONMENT?: string;
  readonly VITE_GIT_SHA?: string;
  readonly VITE_SENTRY_TRACES_SAMPLE_RATE?: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
  readonly VITE_PUBLIC_SELF_SERVE_REGISTER?: string;
  readonly VITE_AUTH_SESSION_MODE?: string;
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
