/**
 * HubPageShell — ADR-0091 D3 / Hub v2 + D3.2 readiness
 *
 * Landing de módulo de configuración: orientar + lanzar (listados / Builder).
 * Slots opcionales genéricos — cero dominio de feature.
 *
 * Anatomía (orden fijo):
 *   Header (+ Actions?) → Readiness? → Orientation? → Guide? → Nav? → Children → Related config?
 *
 * Sin orientation/nav/guide/readiness/actions/relatedConfig = compat v1 (solo title + children).
 */

import { memo, useEffect, useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Circle,
  Info,
} from "lucide-react";
import { Button } from "@shared/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { Tabs, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { cn } from "@shared/lib/utils/cn";

// ============================================================================
// TYPES
// ============================================================================

export interface HubNavItem {
  id: string;
  label: string;
  href: string;
  badge?: ReactNode;
}

export interface HubOrientation {
  text: string;
  link?: { label: string; href: string };
}

/** Puente operativo al pie del hub (mismo patrón que Workbench relatedConfig). */
export interface HubRelatedConfig {
  label: string;
  href: string;
  description?: string;
}

export interface HubGuide {
  title: string;
  steps: string[];
  /** Estado inicial si no hay preferencia en storage. Default true. */
  defaultOpen?: boolean;
  /** Si se define, persiste open/collapsed en localStorage. */
  storageKey?: string;
}

export interface HubPageShellAction {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "ghost";
  icon?: ReactNode;
}

/** Estado visual de un chip de readiness (ADR-0091 D3.2). */
export type HubReadinessStatus = "ok" | "warn" | "empty" | "info";

/**
 * Chip de salud de configuración del módulo.
 * Cero dominio: la feature construye los items.
 * `label` no debe duplicar `value` (ej. value=3, label="esquemas activos").
 */
export interface HubReadinessItem {
  id: string;
  label: string;
  value: number | string;
  status: HubReadinessStatus;
  href?: string;
  onClick?: () => void;
}

export interface HubPageShellProps {
  title: string;
  description?: string;
  orientation?: HubOrientation;
  /** Franja de readiness (D3.2). Opcional; sin items = no se renderiza. */
  readiness?: HubReadinessItem[];
  readinessAriaLabel?: string;
  nav?: HubNavItem[];
  activeNavId?: string;
  navAriaLabel?: string;
  guide?: HubGuide;
  primaryActions?: HubPageShellAction[];
  secondaryActions?: HubPageShellAction[];
  /** Enlace operativo al pie (p. ej. ir a liquidaciones). */
  relatedConfig?: HubRelatedConfig;
  children: ReactNode;
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function HubActionButton({ action }: { action: HubPageShellAction }) {
  const variant = action.variant ?? "default";
  const content = (
    <>
      {action.icon}
      {action.label}
    </>
  );

  if (action.href) {
    return (
      <Button asChild variant={variant} size="sm">
        <Link to={action.href}>{content}</Link>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      onClick={action.onClick}
    >
      {content}
    </Button>
  );
}

const READINESS_STATUS_ICON: Record<
  HubReadinessStatus,
  typeof CheckCircle2
> = {
  ok: CheckCircle2,
  warn: AlertTriangle,
  empty: Circle,
  info: Info,
};

const READINESS_STATUS_CLASS: Record<HubReadinessStatus, string> = {
  ok: "text-success",
  warn: "text-warning",
  empty: "text-destructive",
  info: "text-muted-foreground",
};

function HubReadinessChip({ item }: { item: HubReadinessItem }) {
  const Icon = READINESS_STATUS_ICON[item.status];
  const statusClass = READINESS_STATUS_CLASS[item.status];
  const ariaLabel = `${item.value} ${item.label}`;

  const body = (
    <>
      <Icon
        className={cn("h-3.5 w-3.5 shrink-0", statusClass)}
        aria-hidden
        data-status={item.status}
      />
      <span className={cn("tabular-nums font-semibold", statusClass)}>
        {item.value}
      </span>
      <span className="text-muted-foreground">{item.label}</span>
    </>
  );

  const className = cn(
    "inline-flex shrink-0 items-center gap-1.5 rounded-md border bg-card px-2.5 py-1.5 text-xs",
    "transition-colors",
    (item.href || item.onClick) &&
      "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  );

  if (item.href) {
    return (
      <Link to={item.href} className={className} aria-label={ariaLabel}>
        {body}
      </Link>
    );
  }

  if (item.onClick) {
    return (
      <button
        type="button"
        className={className}
        aria-label={ariaLabel}
        onClick={item.onClick}
      >
        {body}
      </button>
    );
  }

  return (
    <span className={className} aria-label={ariaLabel}>
      {body}
    </span>
  );
}

function HubReadinessStrip({
  items,
  ariaLabel,
}: {
  items: HubReadinessItem[];
  ariaLabel: string;
}) {
  if (items.length === 0) return null;

  return (
    <div
      className="-mx-1 overflow-x-auto px-1"
      role="list"
      aria-label={ariaLabel}
      data-testid="hub-readiness-strip"
    >
      <div className="flex w-max min-w-full flex-nowrap gap-2 sm:flex-wrap sm:w-auto">
        {items.map((item) => (
          <div key={item.id} role="listitem">
            <HubReadinessChip item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}

function HubGuidePanel({ guide }: { guide: HubGuide }) {
  const defaultOpen = guide.defaultOpen ?? true;
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (!guide.storageKey) {
      setOpen(defaultOpen);
      return;
    }
    try {
      const stored = window.localStorage.getItem(guide.storageKey);
      if (stored !== null) {
        // storage stores "collapsed" semantics: "true" = collapsed
        setOpen(stored === "false");
        return;
      }
      setOpen(defaultOpen);
    } catch {
      setOpen(defaultOpen);
    }
  }, [guide.storageKey, defaultOpen]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!guide.storageKey) return;
    try {
      window.localStorage.setItem(
        guide.storageKey,
        next ? "false" : "true",
      );
    } catch {
      // ignore storage errors
    }
  };

  return (
    <Collapsible open={open} onOpenChange={handleOpenChange}>
      <div className="rounded-lg border bg-muted/20">
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="flex h-auto w-full items-center justify-between gap-2 px-4 py-3 text-left font-normal"
          >
            <span className="text-sm font-medium text-foreground">
              {guide.title}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                open && "rotate-180",
              )}
              aria-hidden
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4">
          <ol className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:gap-6">
            {guide.steps.map((step, index) => (
              <li key={step} className="flex gap-2">
                <span className="font-medium text-foreground">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Shell de contenido para hubs: orientar en un módulo de config y lanzar
 * sub-rutas / Builder. No es Workbench ni Builder.
 */
export const HubPageShell = memo(function HubPageShell({
  title,
  description,
  orientation,
  readiness,
  readinessAriaLabel = "Estado de configuración del módulo",
  nav,
  activeNavId,
  navAriaLabel = "Secciones del módulo",
  guide,
  primaryActions,
  secondaryActions,
  relatedConfig,
  children,
  className,
}: HubPageShellProps) {
  const hasActions =
    (primaryActions?.length ?? 0) > 0 || (secondaryActions?.length ?? 0) > 0;
  const resolvedActiveNavId =
    activeNavId ?? (nav && nav.length > 0 ? nav[0].id : undefined);
  const readinessItems = readiness?.length ? readiness : undefined;

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {hasActions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {secondaryActions?.map((action) => (
              <HubActionButton key={action.id} action={action} />
            ))}
            {primaryActions?.map((action) => (
              <HubActionButton key={action.id} action={action} />
            ))}
          </div>
        ) : null}
      </div>

      {readinessItems ? (
        <HubReadinessStrip
          items={readinessItems}
          ariaLabel={readinessAriaLabel}
        />
      ) : null}

      {orientation ? (
        <p className="text-sm text-muted-foreground">
          {orientation.text}
          {orientation.link ? (
            <>
              {" "}
              <Link
                to={orientation.link.href}
                className="text-primary hover:underline"
              >
                {orientation.link.label}
              </Link>
            </>
          ) : null}
        </p>
      ) : null}

      {guide ? <HubGuidePanel guide={guide} /> : null}

      {nav && nav.length > 0 && resolvedActiveNavId ? (
        <Tabs value={resolvedActiveNavId}>
          <TabsList aria-label={navAriaLabel}>
            {nav.map((item) => (
              <TabsTrigger key={item.id} value={item.id} asChild>
                <NavLink to={item.href} className="inline-flex items-center gap-1.5">
                  {item.label}
                  {item.badge}
                </NavLink>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      ) : null}

      <div className="space-y-6">{children}</div>

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
});

export default HubPageShell;
