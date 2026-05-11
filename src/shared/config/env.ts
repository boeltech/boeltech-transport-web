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
  app: {
    name: string;
    version: string;
    isDevelopment: boolean;
    isProduction: boolean;
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
  app: {
    name: import.meta.env.VITE_APP_NAME || "Boeltech ERP",
    version: import.meta.env.VITE_APP_VERSION || "1.0.0",
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
  },
};

// Freeze para evitar modificaciones accidentales
Object.freeze(config);
Object.freeze(config.api);
Object.freeze(config.geolocation);
Object.freeze(config.app);

export default config;
