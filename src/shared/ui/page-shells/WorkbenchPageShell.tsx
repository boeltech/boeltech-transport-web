/**
 * WorkbenchPageShell — ADR-0090
 *
 * Shell para centros de trabajo operativos (entender estado, priorizar, actuar).
 * No ampliar ListPageShell ni fusionar con HubPageShell.
 *
 * Anatomía (orden fijo):
 *   Header → beforeAwareness? → Awareness strip → afterAwareness? → Toolbar → Degraded? → renderContent → Pagination? → Related config?
 */

import { memo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { Button } from "@shared/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@shared/ui/tooltip";
import {
  ActiveFilterChips,
  ListingPagination,
  ListingSearchInput,
  type ActiveFilterChip,
} from "@shared/ui/listing";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Skeleton } from "@shared/ui/skeleton";
import { cn } from "@shared/lib/utils/cn";

// ============================================================================
// TYPES
// ============================================================================

export type WorkbenchBucketTone =
  | "default"
  | "success"
  | "warning"
  | "destructive";

export interface WorkbenchBucket {
  id: string;
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  tone?: WorkbenchBucketTone;
  /** Helper bajo el label (estilo scorecard). */
  description?: string;
  /** Navegación fuera del workbench (registry, hub, otra bandeja). */
  crossLink?: { href: string; label: string };
}

export interface WorkbenchPageShellPrimaryAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  /**
   * Si es false, la acción no se renderiza.
   * Permite ocultarla por permisos sin condicionales adentro del JSX.
   */
  visible?: boolean;
  disabled?: boolean;
  disabledTitle?: string;
}

export interface WorkbenchPageShellToolbar {
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  filters?: ReactNode;
  extraActions?: ReactNode;
  onRefresh?: () => Promise<void> | void;
  isRefreshing?: boolean;
  activeFilterChips?: ActiveFilterChip[];
  onClearFilters?: () => void;
  hasFilters?: boolean;
}

export interface WorkbenchPageShellPagination {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
}

export interface WorkbenchPageShellRelatedConfig {
  label: string;
  href: string;
  description?: string;
}

export interface WorkbenchPageShellProps {
  title: string;
  description?: string;
  /** Si es false, oculta título/descripción/CTAs del header (p. ej. inbox embebido en hub). */
  showHeader?: boolean;
  /** Contenido entre header y awareness strip (avisos read-only, copy embebido). */
  beforeAwareness?: ReactNode;
  /** Contenido entre awareness strip y toolbar (p. ej. scorecard hermano). */
  afterAwareness?: ReactNode;
  /** Filtro de alcance (sucursal, período, etc.). */
  scopeFilter?: ReactNode;
  primaryAction?: WorkbenchPageShellPrimaryAction;
  secondaryActions?: ReactNode;

  /** Obligatorio en v1 — franja unida clickable. */
  buckets: WorkbenchBucket[];
  /** Título del scorecard encima del strip (estilo dashboard). */
  bucketsTitle?: string;
  /** Subtítulo bajo bucketsTitle. */
  bucketsDescription?: string;
  bucketsAriaLabel?: string;
  bucketsLoading?: boolean;

  toolbar?: WorkbenchPageShellToolbar;

  /**
   * true = endpoint workbench raíz falló.
   * El shell muestra degraded (Alert + link).
   */
  isDegraded?: boolean;
  degradedMessage?: string;
  degradedHref?: string;
  degradedLinkLabel?: string;

  /** Work surface — la feature decide tabla/cards/cola y empty/error por bucket. */
  renderContent: () => ReactNode;

  pagination?: WorkbenchPageShellPagination;
  onPageChange?: (page: number) => void;

  relatedConfig?: WorkbenchPageShellRelatedConfig;

  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const TONE_CLASS: Record<WorkbenchBucketTone, string> = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

function WorkbenchPrimaryActionButton({
  action,
}: {
  action: WorkbenchPageShellPrimaryAction;
}) {
  const button = (
    <Button
      onClick={action.onClick}
      leftIcon={action.icon}
      disabled={action.disabled}
    >
      {action.label}
    </Button>
  );

  if (action.disabled && action.disabledTitle) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{button}</span>
        </TooltipTrigger>
        <TooltipContent side="bottom">{action.disabledTitle}</TooltipContent>
      </Tooltip>
    );
  }

  return button;
}

function bucketCellBorderClass(index: number, total: number): string {
  const isLast = index === total - 1;
  return cn(
    index % 2 === 0 && "border-r border-border",
    index < 2 && total > 2 && "border-b border-border lg:border-b-0",
    !isLast && "lg:border-r lg:border-border",
    index % 2 === 1 && "max-lg:border-r-0",
  );
}

function awarenessGridClass(count: number): string {
  if (count <= 2) return "grid grid-cols-2";
  if (count === 3) return "grid grid-cols-2 lg:grid-cols-3";
  if (count === 5) return "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5";
  return "grid grid-cols-2 lg:grid-cols-4";
}

function WorkbenchAwarenessStrip({
  buckets,
  bucketsLoading,
  ariaLabel,
  title,
  description,
}: {
  buckets: WorkbenchBucket[];
  bucketsLoading?: boolean;
  ariaLabel: string;
  title?: string;
  description?: string;
}) {
  return (
    <section
      className="overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm"
      aria-label={ariaLabel}
    >
      {title ? (
        <div className="border-b px-5 py-3 sm:px-6">
          <h2 className="text-base font-medium tracking-tight">{title}</h2>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}
      <div
        className={awarenessGridClass(buckets.length)}
        role="tablist"
        aria-label={ariaLabel}
      >
        {buckets.map((bucket, index) => {
          const tone = bucket.tone ?? "default";
          const cellClass = cn(
            "flex flex-col justify-between gap-3 p-4 text-left transition-colors sm:gap-4 sm:p-5",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
            bucketCellBorderClass(index, buckets.length),
            bucket.isActive && "bg-primary/5",
            !bucket.crossLink && "hover:bg-muted/40",
            bucket.crossLink && "hover:bg-muted/40",
          );

          const body = (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {bucket.label}
                  </p>
                  {bucket.description ? (
                    <p className="text-xs text-muted-foreground">
                      {bucket.description}
                    </p>
                  ) : null}
                </div>
                {bucket.crossLink ? (
                  <ArrowUpRight
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                ) : null}
              </div>
              <div className="space-y-1">
                {bucketsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p
                    className={cn(
                      "text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl",
                      TONE_CLASS[tone],
                    )}
                  >
                    {bucket.count}
                  </p>
                )}
              </div>
            </>
          );

          if (bucket.crossLink) {
            return (
              <Link
                key={bucket.id}
                to={bucket.crossLink.href}
                className={cellClass}
                aria-label={bucket.crossLink.label}
              >
                {body}
              </Link>
            );
          }

          return (
            <button
              key={bucket.id}
              type="button"
              role="tab"
              aria-selected={bucket.isActive}
              disabled={bucketsLoading}
              className={cn(cellClass, "disabled:opacity-60")}
              onClick={bucket.onClick}
            >
              {body}
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

function WorkbenchPageShellInner({
  title,
  description,
  showHeader = true,
  beforeAwareness,
  afterAwareness,
  scopeFilter,
  primaryAction,
  secondaryActions,
  buckets,
  bucketsTitle,
  bucketsDescription,
  bucketsAriaLabel = "Etapas del centro de trabajo",
  bucketsLoading = false,
  toolbar,
  isDegraded = false,
  degradedMessage = "No se pudo cargar el centro de trabajo. Puedes consultar el registro histórico mientras tanto.",
  degradedHref,
  degradedLinkLabel = "Ir al registro",
  renderContent,
  pagination,
  onPageChange,
  relatedConfig,
  className,
}: WorkbenchPageShellProps) {
  const showActionButton = primaryAction && primaryAction.visible !== false;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      {showHeader ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              {description ? (
                <p className="text-muted-foreground">{description}</p>
              ) : null}
            </div>
            {scopeFilter}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {secondaryActions}
            {showActionButton ? (
              <WorkbenchPrimaryActionButton action={primaryAction} />
            ) : null}
          </div>
        </div>
      ) : null}

      {beforeAwareness}

      {/* Awareness strip — omit when empty (portal client, embedded workbenches). */}
      {buckets.length > 0 ? (
        <WorkbenchAwarenessStrip
          buckets={buckets}
          bucketsLoading={bucketsLoading}
          ariaLabel={bucketsAriaLabel}
          title={bucketsTitle}
          description={bucketsDescription}
        />
      ) : null}

      {afterAwareness}

      {/* Toolbar */}
      {toolbar ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              {toolbar.search ? (
                <ListingSearchInput
                  value={toolbar.search.value}
                  onChange={toolbar.search.onChange}
                  placeholder={toolbar.search.placeholder ?? "Buscar..."}
                />
              ) : null}

              {toolbar.filters}
            </div>

            <div className="flex flex-wrap items-center gap-3 xl:justify-end">
              {toolbar.extraActions}

              {toolbar.hasFilters && toolbar.onClearFilters ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toolbar.onClearFilters}
                >
                  Limpiar filtros
                </Button>
              ) : null}

              {toolbar.onRefresh ? (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toolbar.onRefresh}
                  disabled={toolbar.isRefreshing}
                  aria-label="Actualizar"
                >
                  <RefreshCw
                    className={cn(
                      "h-4 w-4",
                      toolbar.isRefreshing && "animate-spin",
                    )}
                  />
                </Button>
              ) : null}
            </div>
          </div>

          {toolbar.activeFilterChips &&
          toolbar.activeFilterChips.length > 0 ? (
            <ActiveFilterChips chips={toolbar.activeFilterChips} />
          ) : null}
        </div>
      ) : null}

      {/* Degraded */}
      {isDegraded ? (
        <Alert variant="warning">
          <AlertTitle>Centro de trabajo no disponible</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{degradedMessage}</p>
            {degradedHref ? (
              <p>
                <Link
                  to={degradedHref}
                  className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-4"
                >
                  {degradedLinkLabel}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </p>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Work surface */}
      {renderContent()}

      {/* Pagination */}
      {pagination && onPageChange ? (
        <ListingPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
        />
      ) : null}

      {/* Related config */}
      {relatedConfig ? (
        <div className="border-t pt-4">
          <Link
            to={relatedConfig.href}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            {relatedConfig.label}
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
          {relatedConfig.description ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {relatedConfig.description}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export const WorkbenchPageShell = memo(WorkbenchPageShellInner);

export default WorkbenchPageShell;
