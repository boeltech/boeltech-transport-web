/**
 * Catalog Routes
 * Clean Architecture - Presentation Layer
 *
 * Configuración de rutas para el módulo de catálogos.
 * Se monta bajo /configuracion/catalogos
 */

import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Skeleton } from "@shared/ui/skeleton";

// Lazy load pages
const CatalogsPage = lazy(() => import("./pages/CatalogsPage"));
const CatalogDetailPage = lazy(() => import("./pages/CatalogDetailPage"));

// ============================================================================
// LOADING FALLBACK
// ============================================================================

function PageLoader() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}

// ============================================================================
// ROUTES
// ============================================================================

/**
 * Rutas del módulo de catálogos.
 *
 * Uso en el router principal:
 * ```tsx
 * <Route path="configuracion/catalogos/*" element={<CatalogRoutes />} />
 * ```
 */
export function CatalogRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Lista de catálogos */}
        <Route index element={<CatalogsPage />} />

        {/* Detalle de un catálogo */}
        <Route path=":typeCode" element={<CatalogDetailPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </Suspense>
  );
}

export default CatalogRoutes;
