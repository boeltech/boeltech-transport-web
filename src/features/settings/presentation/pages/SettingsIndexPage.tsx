/**
 * SettingsIndexPage
 *
 * Página índice de configuración.
 * En desktop muestra el overview, en rutas directas hace redirect.
 *
 * Ubicación: src/features/settings/ui/pages/SettingsIndexPage.tsx
 */

import { memo } from "react";
import { Navigate } from "react-router-dom";

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Redirige automáticamente a /settings/general
 * ya que el índice de settings no tiene contenido propio
 */
export const SettingsIndexPage = memo(function SettingsIndexPage() {
  return <Navigate to="/settings/general" replace />;
});
