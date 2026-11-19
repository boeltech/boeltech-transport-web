/**
 * DetailPageShell
 * Shared UI - Page Shells
 *
 * Esqueleto estándar para páginas de detalle del ERP.
 *
 * Estructura:
 *   1. Loading skeleton (variant="detail")
 *   2. Not-found state
 *   3. Header (staff crumbs | portal back) + title + actions
 *   4. Alerts → preStats → stats → tabs/children → metadata
 *
 * NL2–NL4 / NL6: staff = migas sin flecha/ícono; portal = ← Volver;
 * tabs con count/signal (label string).
 */

import { memo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Breadcrumbs, type Crumb } from "@shared/ui/breadcrumbs";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TabCount,
  TabSignalDot,
  type TabSignal,
} from "@shared/ui/tabs";
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

type DetailHeaderBase = {
  /** Título principal (h1). */
  title: ReactNode;
  /** Subtítulo opcional debajo del título. */
  subtitle?: ReactNode;
  /** Badge de estado (ej. <VehicleStatusBadge />). */
  statusBadge?: ReactNode;
  /** Slot de acciones (ej. <VehicleActions />). */
  actions?: ReactNode;
  /** Solo imagen real (logo/foto), 48 px. Nunca ícono genérico. */
  avatar?: { src: string; alt: string };
};

export type DetailPageShellHeader =
  | (DetailHeaderBase & {
      variant?: "staff";
      crumbs: readonly Crumb[];
    })
  | (DetailHeaderBase & {
      variant: "portal";
      backHref: string;
      backLabel?: string;
    });

export interface DetailPageShellTabItem {
  value: string;
  /** Etiqueta del tab (string). Contadores → `count`; puntos → `signal`. */
  label: string;
  content: ReactNode;
  /** Mantiene el panel montado al cambiar de tab (p. ej. mapas Mapbox). */
  forceMount?: boolean;
  /** Pastilla mono 11 px. 0/undefined = sin pastilla. */
  count?: number;
  /** Punto 6 px (attention / blocked / live). */
  signal?: TabSignal;
  /** aria-label del punto; default por signal. */
  signalLabel?: string;
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

function hasCrumbs(
  header: DetailPageShellHeader,
): header is DetailHeaderBase & { crumbs: readonly Crumb[] } {
  return (
    "crumbs" in header &&
    Array.isArray((header as { crumbs?: unknown }).crumbs)
  );
}

function isPortalHeader(
  header: DetailPageShellHeader,
): header is DetailHeaderBase & {
  variant: "portal";
  backHref: string;
  backLabel?: string;
} {
  return "variant" in header && header.variant === "portal";
}

function TabLabel({ item }: { item: DetailPageShellTabItem }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{item.label}</span>
      {item.signal ? (
        <TabSignalDot signal={item.signal} label={item.signalLabel} />
      ) : null}
      {item.count != null ? <TabCount count={item.count} /> : null}
    </span>
  );
}

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
  const portal = isPortalHeader(header);
  const staff = hasCrumbs(header);
  const avatar = header.avatar;

  if (isLoading) {
    return <LoadingPageState variant="detail" className={className} />;
  }

  if (notFound) {
    if (!notFoundConfig) {
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
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between xl:gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 xl:min-w-[55%]">
          {staff ? <Breadcrumbs crumbs={header.crumbs} /> : null}
          <div className="flex min-w-0 items-start gap-3">
            {portal ? (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => navigate(header.backHref)}
                aria-label={header.backLabel ?? "Volver"}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : null}
            {avatar?.src ? (
              <img
                src={avatar.src}
                alt={avatar.alt}
                className="h-12 w-12 shrink-0 rounded-lg object-cover"
                width={48}
                height={48}
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <h1 className="min-w-0 text-2xl font-bold leading-tight">
                  {header.title}
                </h1>
                {header.statusBadge ? (
                  <div className="shrink-0">{header.statusBadge}</div>
                ) : null}
              </div>
              {header.subtitle ? (
                <div className="mt-1 text-sm text-muted-foreground">
                  {header.subtitle}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {header.actions ? (
          <div className="flex w-full min-w-0 justify-end xl:max-w-[40%] xl:shrink">
            {header.actions}
          </div>
        ) : null}
      </div>

      {alerts}

      {preStats ? <div className="space-y-4">{preStats}</div> : null}

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

      {tabs ? (
        <Tabs
          defaultValue={tabs.defaultValue}
          value={tabs.value}
          onValueChange={tabs.onValueChange}
        >
          <TabsList>
            {tabs.items.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                <TabLabel item={tab} />
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

      {metadata ? <MetadataFooter {...metadata} /> : null}
    </div>
  );
});

export default DetailPageShell;
