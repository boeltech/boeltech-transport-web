/**
 * DetailPageShell
 * Shared UI - Page Shells
 *
 * Esqueleto estándar para páginas de detalle del ERP.
 * Reemplaza el patrón duplicado en VehicleDetailPage, DriverDetailPage,
 * EmployeeDetailPage, ClientDetailPage, TripDetailPage.
 *
 * Estructura:
 *   1. Loading skeleton (variant="detail")
 *   2. Not-found state
 *   3. Header (back + icon + title + subtitle + statusBadge + actions)
 *   4. Alerts (slot opcional)
 *   5. preStats (slot opcional, p. ej. resumen fiscal encima de KPIs)
 *   6. Stats grid (opcional, lista de StatCard)
 *   7. Tabs (opcional) o children libre
 *   8. Metadata footer (opcional)
 */

import { memo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import {
  LoadingPageState,
  NotFoundState,
  type NotFoundStateProps,
} from "@shared/ui/feedback-states";
import {
  MetadataFooter,
  StatCard,
  type MetadataFooterProps,
  type StatCardProps,
} from "@shared/ui/data-display";
import { cn } from "@shared/lib/utils/cn";

// ============================================================================
// TYPES
// ============================================================================

export interface DetailPageShellHeader {
  /** Ruta a la que regresa el botón back. */
  backHref: string;
  /** Aria-label del botón back. */
  backLabel?: string;
  /** Icono de la entidad (envuelto en un círculo de fondo). */
  icon: ReactNode;
  /** Variante del fondo del icono. Por defecto "primary". */
  iconVariant?: "primary" | "muted";
  /** Forma del fondo del icono. Por defecto "rounded". */
  iconShape?: "rounded" | "circle";
  /** Título principal (h1). */
  title: ReactNode;
  /** Subtítulo opcional debajo del título. */
  subtitle?: ReactNode;
  /** Badge de estado (ej. <VehicleStatusBadge />). */
  statusBadge?: ReactNode;
  /** Slot de acciones (ej. <VehicleActions />). */
  actions?: ReactNode;
}

export interface DetailPageShellTabItem {
  value: string;
  label: ReactNode;
  content: ReactNode;
  /** Mantiene el panel montado al cambiar de tab (p. ej. mapas Mapbox). */
  forceMount?: boolean;
}

export interface DetailPageShellTabs {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  items: DetailPageShellTabItem[];
}

export interface DetailPageShellProps {
  // ── Estado ────────────────────────────────────────────────────────────────
  isLoading: boolean;
  /** Cuando es true, renderiza NotFoundState. */
  notFound?: boolean;
  /** Configuración del NotFoundState. Requerido si `notFound` puede ser true. */
  notFoundConfig?: Omit<NotFoundStateProps, "className">;

  // ── Header ────────────────────────────────────────────────────────────────
  header: DetailPageShellHeader;

  // ── Bloques opcionales ────────────────────────────────────────────────────
  /** Slot para alertas (vencimientos, problemas críticos). */
  alerts?: ReactNode;
  /**
   * Contenido entre alertas y stats (p. ej. bloque fiscal en detalle de viaje).
   * No añade espacio extra si se omite o es null/false.
   */
  preStats?: ReactNode;
  /** Lista de StatCard. Si vacío/undefined no se renderiza el grid. */
  stats?: StatCardProps[];
  /** Tabs. Si se omite, se renderizan los `children` directamente. */
  tabs?: DetailPageShellTabs;
  /** Contenido directo (alternativa a tabs o complementario). */
  children?: ReactNode;
  /** Metadata footer. Si se omite, no se renderiza. */
  metadata?: MetadataFooterProps;

  // ── Misc ──────────────────────────────────────────────────────────────────
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const iconBgVariants: Record<
  NonNullable<DetailPageShellHeader["iconVariant"]>,
  string
> = {
  primary: "bg-primary/10 text-primary",
  muted: "bg-muted text-muted-foreground",
};

const iconShapeVariants: Record<
  NonNullable<DetailPageShellHeader["iconShape"]>,
  string
> = {
  rounded: "rounded-lg",
  circle: "rounded-full",
};

// ============================================================================
// COMPONENT
// ============================================================================

export const DetailPageShell = memo(function DetailPageShell({
  isLoading,
  notFound,
  notFoundConfig,
  header,
  alerts,
  preStats,
  stats,
  tabs,
  children,
  metadata,
  className,
}: DetailPageShellProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return <LoadingPageState variant="detail" className={className} />;
  }

  if (notFound) {
    if (!notFoundConfig) {
      // Defensivo: si no hay config, mostramos un fallback genérico.
      return (
        <NotFoundState
          icon={<span aria-hidden>?</span>}
          title="Recurso no encontrado"
        />
      );
    }
    return <NotFoundState {...notFoundConfig} />;
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* ====================================================================
       * Header
       * ================================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(header.backHref)}
            aria-label={header.backLabel ?? "Volver"}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center",
              iconShapeVariants[header.iconShape ?? "rounded"],
              iconBgVariants[header.iconVariant ?? "primary"],
            )}
          >
            {header.icon}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">{header.title}</h1>
            {header.subtitle ? (
              <div className="text-sm text-muted-foreground">{header.subtitle}</div>
            ) : null}
          </div>
          {header.statusBadge ? (
            <div className="shrink-0">{header.statusBadge}</div>
          ) : null}
        </div>

        {header.actions ? (
          <div className="shrink-0">{header.actions}</div>
        ) : null}
      </div>

      {/* ====================================================================
       * Alerts
       * ================================================================== */}
      {alerts}

      {preStats ? <div className="space-y-4">{preStats}</div> : null}

      {/* ====================================================================
       * Stats
       * ================================================================== */}
      {stats && stats.length > 0 ? (
        <div
          className={cn(
            "grid gap-4",
            stats.length === 2 && "md:grid-cols-2",
            stats.length === 3 && "md:grid-cols-3",
            stats.length === 4 && "md:grid-cols-2 lg:grid-cols-4",
            stats.length >= 5 && "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
          )}
        >
          {stats.map((stat, idx) => (
            <StatCard key={`${stat.title}-${idx}`} {...stat} />
          ))}
        </div>
      ) : null}

      {/* ====================================================================
       * Tabs o children
       * ================================================================== */}
      {tabs ? (
        <Tabs
          defaultValue={tabs.defaultValue}
          value={tabs.value}
          onValueChange={tabs.onValueChange}
        >
          <TabsList>
            {tabs.items.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.items.map((tab) => (
            <TabsContent
              key={tab.value}
              value={tab.value}
              forceMount={tab.forceMount || undefined}
              className="space-y-4 mt-4"
            >
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>
      ) : null}

      {children}

      {/* ====================================================================
       * Metadata footer
       * ================================================================== */}
      {metadata ? <MetadataFooter {...metadata} /> : null}
    </div>
  );
});

export default DetailPageShell;
