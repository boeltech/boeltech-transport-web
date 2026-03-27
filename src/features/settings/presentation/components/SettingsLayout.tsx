/**
 * SettingsLayout Component
 *
 * Layout principal del módulo de configuración.
 * Incluye el sidebar interno y el área de contenido.
 *
 * Ubicación: src/features/settings/ui/components/SettingsLayout.tsx
 */

import { memo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Settings, ChevronRight } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { SettingsSidebar } from "./SettingsSidebar";

// ============================================================================
// TYPES
// ============================================================================

export interface SettingsLayoutProps {
  children: ReactNode;
  /** Título de la sección actual (para breadcrumb) */
  sectionTitle?: string;
  /** Si ocultar el sidebar (para páginas como detail de catálogo) */
  hideSidebar?: boolean;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const SettingsLayout = memo(function SettingsLayout({
  children,
  sectionTitle,
  hideSidebar = false,
  className,
}: SettingsLayoutProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            to="/settings"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
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

        {/* Title */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Configuración
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administra la configuración de tu empresa y del sistema
          </p>
        </div>
      </div>

      {/* Content area */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        {!hideSidebar && (
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <SettingsSidebar />
          </aside>
        )}

        {/* Main content */}
        <main className={cn("flex-1 min-w-0", hideSidebar && "max-w-4xl")}>
          {children}
        </main>
      </div>
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
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
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
        "rounded-lg border bg-card text-card-foreground",
        className,
      )}
    >
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-medium">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
        {children}
      </div>
    </div>
  );
});
