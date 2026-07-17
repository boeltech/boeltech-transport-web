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
import { PermissionGuard, usePermissions } from "@shared/permissions";

// ============================================================================
// LAZY LOADED PAGES - Settings
// ============================================================================

const GeneralSettingsPage = lazy(() =>
  import("./pages/GeneralSettingsPage").then((m) => ({
    default: m.GeneralSettingsPage,
  })),
);

const TenantLocationsPage = lazy(() =>
  import("./pages/TenantLocationsPage").then((m) => ({
    default: m.TenantLocationsPage,
  })),
);

const BillingSettingsPage = lazy(() =>
  import("./pages/BillingSettingsPage").then((m) => ({
    default: m.BillingSettingsPage,
  })),
);

const BillingServiceConceptsPage = lazy(() =>
  import("./pages/BillingServiceConceptsPage").then((m) => ({
    default: m.BillingServiceConceptsPage,
  })),
);

const BillingSubscriptionPage = lazy(() =>
  import("@features/billing/presentation/pages/BillingSubscriptionPage").then(
    (m) => ({
      default: m.BillingSubscriptionPage,
    }),
  ),
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

const DashboardLayoutsSettingsPage = lazy(() =>
  import("./pages/DashboardLayoutsSettingsPage").then((m) => ({
    default: m.DashboardLayoutsSettingsPage,
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

function SettingsIndexRedirect() {
  const { hasPermission } = usePermissions();
  const canEditSettings = hasPermission("settings", "update");

  return <Navigate to={canEditSettings ? "general" : "billing"} replace />;
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
        <Route index element={<SettingsIndexRedirect />} />

        {/* General Settings */}
        <Route
          path="general"
          element={
            <PermissionGuard
              module="settings"
              action="update"
              fallback={<Navigate to="/forbidden" replace />}
            >
              <GeneralSettingsPage />
            </PermissionGuard>
          }
        />

        {/* Catalogs - from catalogs feature module */}
        <Route
          path="catalogs"
          element={
            <PermissionGuard
              module="settings"
              action="update"
              fallback={<Navigate to="/forbidden" replace />}
            >
              <CatalogsPage />
            </PermissionGuard>
          }
        />
        <Route
          path="catalogs/:typeCode"
          element={
            <PermissionGuard
              module="settings"
              action="update"
              fallback={<Navigate to="/forbidden" replace />}
            >
              <CatalogDetailPage />
            </PermissionGuard>
          }
        />

        {/* Tenant directory */}
        <Route
          path="locations"
          element={
            <PermissionGuard
              module="settings"
              action="update"
              fallback={<Navigate to="/forbidden" replace />}
            >
              <TenantLocationsPage />
            </PermissionGuard>
          }
        />

        {/* Billing Settings */}
        <Route path="billing" element={<BillingSettingsPage />} />
        <Route path="billing/service-concepts" element={<BillingServiceConceptsPage />} />

        {/* SaaS subscription (read-only) */}
        <Route
          path="subscription"
          element={
            <PermissionGuard
              module="billing"
              action="read"
              fallback={<Navigate to="/forbidden" replace />}
            >
              <BillingSubscriptionPage />
            </PermissionGuard>
          }
        />

        {/* Notification Settings */}
        <Route
          path="notifications"
          element={
            <PermissionGuard
              module="settings"
              action="update"
              fallback={<Navigate to="/forbidden" replace />}
            >
              <NotificationsSettingsPage />
            </PermissionGuard>
          }
        />

        {/* Dashboard layouts by role */}
        <Route
          path="dashboard-layouts"
          element={
            <PermissionGuard
              module="settings"
              action="update"
              fallback={<Navigate to="/forbidden" replace />}
            >
              <DashboardLayoutsSettingsPage />
            </PermissionGuard>
          }
        />

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
