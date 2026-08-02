/**
 * SettingsPageShell
 * Shared UI - Page Shells
 *
 * Wrapper de alto nivel sobre el ya-existente `SettingsLayout`.
 * Mantiene la nomenclatura simétrica con los demás page-shells y
 * permite que las páginas de Settings se importen desde un solo lugar.
 *
 * Chrome: header + breadcrumb + tabs horizontales canónicas (`RouteTabsNav`)
 * (+ slot main). `hideSidebar` / `hideNav` ocultan las tabs (p. ej. detalle).
 */

import { memo, type ReactNode } from "react";
import { SettingsLayout } from "@features/settings/presentation/components/SettingsLayout";

// ============================================================================
// TYPES
// ============================================================================

export interface SettingsPageShellProps {
  /** Título de la sección actual (ej. "General", "Notificaciones"). */
  sectionTitle?: string;
  /** Título de la página. Por defecto, "Configuración". */
  title?: ReactNode;
  /** Bajada de la página. Por defecto, la descripción genérica del módulo. */
  description?: ReactNode;
  /** Elemento a la izquierda del título (p. ej. logo de la empresa). */
  headerSlot?: ReactNode;
  /** Oculta el sidebar / tabs (útil para detail pages dentro de Settings). */
  hideSidebar?: boolean;
  /** Contenido principal. */
  children: ReactNode;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const SettingsPageShell = memo(function SettingsPageShell({
  sectionTitle,
  title,
  description,
  headerSlot,
  hideSidebar,
  children,
  className,
}: SettingsPageShellProps) {
  return (
    <SettingsLayout
      sectionTitle={sectionTitle}
      title={title}
      description={description}
      headerSlot={headerSlot}
      hideSidebar={hideSidebar}
      className={className}
    >
      {children}
    </SettingsLayout>
  );
});

export default SettingsPageShell;
