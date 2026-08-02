/**
 * SettingsLayout Component
 *
 * Layout principal del módulo de configuración (solo tenant/empresa).
 * Tabs horizontales canónicas (RouteTabsNav) + área de contenido.
 */

import { memo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Settings, ChevronRight } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { SettingsNavTabs } from "./SettingsNavTabs";

const DEFAULT_TITLE = "Configuración";
const DEFAULT_DESCRIPTION = "Administra la configuración de tu empresa";

export interface SettingsLayoutProps {
  children: ReactNode;
  /** Título de la sección actual (para breadcrumb) */
  sectionTitle?: string;
  /** Título de la página. Por defecto, "Configuración". */
  title?: ReactNode;
  /** Bajada de la página. Por defecto, la descripción genérica del módulo. */
  description?: ReactNode;
  /** Elemento a la izquierda del título (p. ej. logo de la empresa). */
  headerSlot?: ReactNode;
  /** Oculta tabs (p. ej. detalle de catálogo) */
  hideSidebar?: boolean;
  /** Alias de hideSidebar */
  hideNav?: boolean;
  className?: string;
}

export const SettingsLayout = memo(function SettingsLayout({
  children,
  sectionTitle,
  title,
  description,
  headerSlot,
  hideSidebar = false,
  hideNav,
  className,
}: SettingsLayoutProps) {
  const hideNavigation = hideNav ?? hideSidebar;

  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-4">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            to="/settings"
            className="flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
            <span>Configuración</span>
          </Link>
          {sectionTitle && (
            <>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{sectionTitle}</span>
            </>
          )}
        </nav>

        <div className="flex items-start gap-3">
          {headerSlot ? <div className="shrink-0">{headerSlot}</div> : null}
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">
              {title ?? DEFAULT_TITLE}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {description ?? DEFAULT_DESCRIPTION}
            </p>
          </div>
        </div>
      </div>

      {!hideNavigation && <SettingsNavTabs />}

      <main className={cn("min-w-0", hideNavigation && "max-w-4xl")}>
        {children}
      </main>
    </div>
  );
});

// ============================================================================
// SETTINGS SECTION COMPONENT
// ============================================================================

export interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Contenedor para una sección dentro de Settings
 */
export const SettingsSection = memo(function SettingsSection({
  title,
  description,
  children,
  className,
}: SettingsSectionProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
});

// ============================================================================
// SETTINGS CARD COMPONENT
// ============================================================================

export interface SettingsCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/**
 * Card para agrupar campos relacionados
 */
export const SettingsCard = memo(function SettingsCard({
  title,
  description,
  children,
  actions,
  className,
}: SettingsCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className,
      )}
    >
      <div className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-medium">{title}</h3>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
        {children}
      </div>
    </div>
  );
});
