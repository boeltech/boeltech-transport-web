/**
 * Settings Routes
 *
 * Configuración de rutas del módulo de configuración.
 * Implementa lazy loading para optimizar el bundle.
 *
 * Ubicación: src/features/settings/ui/routes.tsx
 */

import { Suspense } from "react";
import { lazyWithRetry } from "@shared/lib/lazyWithRetry";
import { Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { PermissionGuard, usePermissions } from "@shared/permissions";

// ============================================================================
// LAZY LOADED PAGES - Settings
// ============================================================================

const GeneralSettingsPage = lazyWithRetry(() =>
  import("./pages/GeneralSettingsPage").then((m) => ({
    default: m.GeneralSettingsPage,
  })),
);

const TenantLocationsPage = lazyWithRetry(() =>
  import("./pages/TenantLocationsPage").then((m) => ({
    default: m.TenantLocationsPage,
  })),
);

const BillingSettingsPage = lazyWithRetry(() =>
  import("./pages/BillingSettingsPage").then((m) => ({
    default: m.BillingSettingsPage,
  })),
);

const BillingServiceConceptsPage = lazyWithRetry(() =>
  import("./pages/BillingServiceConceptsPage").then((m) => ({
    default: m.BillingServiceConceptsPage,
  })),
);

const BillingSubscriptionPage = lazyWithRetry(() =>
  import("@features/billing/presentation/pages/BillingSubscriptionPage").then(
    (m) => ({
      default: m.BillingSubscriptionPage,
    }),
  ),
);

const NotificationsSettingsPage = lazyWithRetry(() =>
  import("./pages/NotificationsSettingsPage").then((m) => ({
    default: m.NotificationsSettingsPage,
  })),
);

const IntegrationsSettingsPage = lazyWithRetry(() =>
  import("./pages/IntegrationsSettingsPage").then((m) => ({
    default: m.IntegrationsSettingsPage,
  })),
);

const DashboardLayoutsSettingsPage = lazyWithRetry(() =>
  import("./pages/DashboardLayoutsSettingsPage").then((m) => ({
    default: m.DashboardLayoutsSettingsPage,
  })),
);

// ============================================================================
// LAZY LOADED PAGES - Catalogs (from catalogs feature)
// ============================================================================

const CatalogsPage = lazyWithRetry(() =>
  import("@features/catalogs/presentation/pages/CatalogsPage").then((m) => ({
    default: m.CatalogsPage,
  })),
);

const CatalogDetailPage = lazyWithRetry(() =>
  import("@features/catalogs/presentation/pages/CatalogDetailPage").then(
    (m) => ({
      default: m.CatalogDetailPage,
    }),
  ),
);

const ImportsHubPage = lazyWithRetry(() =>
  import("@features/imports/presentation/pages/ImportsHubPage").then((m) => ({
    default: m.ImportsHubPage,
  })),
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
  const canReadSettings = hasPermission("settings", "read");

  return <Navigate to={canReadSettings ? "general" : "billing"} replace />;
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
 * /settings/notifications → Avisos de la empresa (documentos por vencer)
 * /settings/security     → Redirect a /account/security
 * /settings/integrations → Integraciones (próximamente)
 */
export function SettingsRoutes() {
  return (
    <Suspense fallback={<SettingsLoadingFallback />}>
      <Routes>
        {/* Index - redirect to general */}
        <Route index element={<SettingsIndexRedirect />} />

        {/* General Settings — lectura para todo rol con acceso a Configuración */}
        <Route
          path="general"
          element={
            <PermissionGuard
              module="settings"
              action="read"
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
              module="catalogs"
              action="read"
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
              module="catalogs"
              action="read"
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

        {/* Tenant master CSV imports (ADR-0074) */}
        <Route
          path="imports"
          element={
            <PermissionGuard
              module="imports"
              action="read"
              fallback={<Navigate to="/forbidden" replace />}
            >
              <ImportsHubPage />
            </PermissionGuard>
          }
        />

        {/* Billing Settings */}
        <Route path="billing" element={<BillingSettingsPage />} />
        <Route path="billing/service-concepts" element={<BillingServiceConceptsPage />} />

        {/* SaaS subscription (también ruta top-level sin RBAC billing para paywall) */}
        <Route path="subscription" element={<BillingSubscriptionPage />} />

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

        {/* Seguridad del usuario → Mi cuenta */}
        <Route
          path="security"
          element={<Navigate to="/account/security" replace />}
        />

        {/* Integrations Settings (placeholder) */}
        <Route path="integrations" element={<IntegrationsSettingsPage />} />

        {/* Catch all - redirect to general */}
        <Route path="*" element={<Navigate to="general" replace />} />
      </Routes>
    </Suspense>
  );
}
