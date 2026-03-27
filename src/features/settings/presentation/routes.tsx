/**
 * Settings Routes
 *
 * Configuración de rutas del módulo de configuración.
 * Implementa lazy loading para optimizar el bundle.
 *
 * Ubicación: src/features/settings/ui/routes.tsx
 */

import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

// ============================================================================
// LAZY LOADED PAGES - Settings
// ============================================================================

const GeneralSettingsPage = lazy(() =>
  import("./pages/GeneralSettingsPage").then((m) => ({
    default: m.GeneralSettingsPage,
  })),
);

const BillingSettingsPage = lazy(() =>
  import("./pages/BillingSettingsPage").then((m) => ({
    default: m.BillingSettingsPage,
  })),
);

const NotificationsSettingsPage = lazy(() =>
  import("./pages/NotificationsSettingsPage").then((m) => ({
    default: m.NotificationsSettingsPage,
  })),
);

const SecuritySettingsPage = lazy(() =>
  import("./pages/SecuritySettingsPage").then((m) => ({
    default: m.SecuritySettingsPage,
  })),
);

const IntegrationsSettingsPage = lazy(() =>
  import("./pages/IntegrationsSettingsPage").then((m) => ({
    default: m.IntegrationsSettingsPage,
  })),
);

// ============================================================================
// LAZY LOADED PAGES - Catalogs (from catalogs feature)
// ============================================================================

const CatalogsPage = lazy(() =>
  import("@features/catalogs/presentation/pages/CatalogsPage").then((m) => ({
    default: m.CatalogsPage,
  })),
);

const CatalogDetailPage = lazy(() =>
  import("@features/catalogs/presentation/pages/CatalogDetailPage").then(
    (m) => ({
      default: m.CatalogDetailPage,
    }),
  ),
);

// ============================================================================
// LOADING FALLBACK
// ============================================================================

function SettingsLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

// ============================================================================
// ROUTES COMPONENT
// ============================================================================

/**
 * Rutas del módulo de configuración
 *
 * Estructura:
 * /settings              → Redirect a /settings/general
 * /settings/general      → Configuración de empresa
 * /settings/catalogs     → Catálogos SAT e internos
 * /settings/catalogs/:typeCode → Detalle de catálogo
 * /settings/billing      → Facturación electrónica
 * /settings/notifications → Preferencias de notificaciones
 * /settings/security     → Seguridad (próximamente)
 * /settings/integrations → Integraciones (próximamente)
 */
export function SettingsRoutes() {
  return (
    <Suspense fallback={<SettingsLoadingFallback />}>
      <Routes>
        {/* Index - redirect to general */}
        <Route index element={<Navigate to="general" replace />} />

        {/* General Settings */}
        <Route path="general" element={<GeneralSettingsPage />} />

        {/* Catalogs - from catalogs feature module */}
        <Route path="catalogs" element={<CatalogsPage />} />
        <Route path="catalogs/:typeCode" element={<CatalogDetailPage />} />

        {/* Billing Settings */}
        <Route path="billing" element={<BillingSettingsPage />} />

        {/* Notification Settings */}
        <Route path="notifications" element={<NotificationsSettingsPage />} />

        {/* Security Settings (placeholder) */}
        <Route path="security" element={<SecuritySettingsPage />} />

        {/* Integrations Settings (placeholder) */}
        <Route path="integrations" element={<IntegrationsSettingsPage />} />

        {/* Catch all - redirect to general */}
        <Route path="*" element={<Navigate to="general" replace />} />
      </Routes>
    </Suspense>
  );
}
