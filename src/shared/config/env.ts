import { BRAND } from "@shared/ui/brand";

/**
 * Configuración centralizada de la aplicación.
 * Todas las variables de entorno se acceden desde aquí.
 */

interface AppConfig {
  api: {
    baseUrl: string;
    timeout?: number;
    headers?: Record<string, string>;
  };
  geolocation: {
    provider: "mapbox" | "stub";
    mapboxPublicToken: string;
  };
  turnstile: {
    siteKey: string;
  };
  auth: {
    /** Espejo UX de PUBLIC_SELF_SERVE_REGISTER (API). Default true. */
    publicSelfServeRegister: boolean;
    /** Alinear con AUTH_SESSION_MODE de la API (Fase 4). Default cookies. */
    sessionMode: "bearer" | "dual" | "cookies";
  };
  app: {
    name: string;
    version: string;
    isDevelopment: boolean;
    isProduction: boolean;
  };
  support: {
    /** Destinatario mailto del Dialog Ayuda. Override: VITE_SUPPORT_EMAIL. */
    email: string;
    /** URL externa de guías; vacío = no mostrar botón. Override: VITE_HELP_DOCS_URL. */
    helpDocsUrl: string;
  };
  observability: {
    sentryDsn: string;
    environment: string;
    release: string;
    enabled: boolean;
  };
}

const config: AppConfig = {
  api: {
    baseUrl: import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1",
    timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
    headers: {
      // "Content-Type": "application/json",
      Accept: "application/json",
    },
  },
  geolocation: {
    provider:
      (import.meta.env.VITE_GEO_PROVIDER as "mapbox" | "stub" | undefined) ||
      "mapbox",
    mapboxPublicToken: import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || "",
  },
  turnstile: {
    siteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY || "",
  },
  auth: {
    publicSelfServeRegister: parseEnvBool(
      import.meta.env.VITE_PUBLIC_SELF_SERVE_REGISTER,
      true,
    ),
    sessionMode: parseAuthSessionMode(
      import.meta.env.VITE_AUTH_SESSION_MODE,
    ),
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || BRAND.productName,
    version: import.meta.env.VITE_APP_VERSION || "1.0.0",
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
  },
  support: {
    email:
      (import.meta.env.VITE_SUPPORT_EMAIL || "").trim() || BRAND.supportEmail,
    helpDocsUrl: (import.meta.env.VITE_HELP_DOCS_URL || "").trim(),
  },
  observability: {
    sentryDsn: import.meta.env.VITE_SENTRY_DSN || "",
    environment: import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE,
    release:
      import.meta.env.VITE_GIT_SHA ||
      import.meta.env.VITE_APP_VERSION ||
      "unknown",
    enabled:
      Boolean(import.meta.env.VITE_SENTRY_DSN) && import.meta.env.PROD,
  },
};

// Freeze para evitar modificaciones accidentales
Object.freeze(config);
Object.freeze(config.api);
Object.freeze(config.geolocation);
Object.freeze(config.turnstile);
Object.freeze(config.auth);
Object.freeze(config.app);
Object.freeze(config.support);
Object.freeze(config.observability);

export default config;

function parseEnvBool(raw: string | undefined, defaultValue: boolean): boolean {
  if (raw === undefined || raw === "") {
    return defaultValue;
  }
  return raw === "1" || raw.toLowerCase() === "true";
}

function parseAuthSessionMode(
  raw: string | undefined,
): "bearer" | "dual" | "cookies" {
  const value = (raw ?? "cookies").trim().toLowerCase();
  if (value === "bearer" || value === "dual" || value === "cookies") {
    return value;
  }
  return "cookies";
}
