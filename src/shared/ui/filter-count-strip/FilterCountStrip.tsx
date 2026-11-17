/**
 * Franja de conteos que filtran — patrón hub Operate (evolve-ds Inicio F2).
 * Cada celda = label + número mono; enlace a la bandeja con ese filtro.
 */

import { Link } from "react-router-dom";

import { cn } from "@shared/lib/utils/cn";

export interface FilterCountStripItem {
  id: string;
  label: string;
  count: number;
  href: string;
  /** Ámbar en número + dot (p. ej. Con retraso). */
  warn?: boolean;
}

export interface FilterCountStripProps {
  items: readonly FilterCountStripItem[];
  className?: string;
  "aria-label"?: string;
}

export function FilterCountStrip({
  items,
  className,
  "aria-label": ariaLabel = "Filtros por conteo",
}: FilterCountStripProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "grid border-b border-border",
        items.length === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3",
        className,
      )}
    >
      {items.map((item, index) => (
        <Link
          key={item.id}
          to={item.href}
          className={cn(
            "flex flex-col gap-0.5 px-4 py-3 text-inherit no-underline transition-colors",
            "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            index < items.length - 1 && "border-r border-border",
          )}
        >
          <span
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium text-muted-foreground",
            )}
          >
            {item.warn ? (
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning"
                aria-hidden
              />
            ) : null}
            {item.label}
          </span>
          <span
            className={cn(
              "font-mono text-[22px] font-bold leading-7 tabular-nums",
              item.warn
                ? "text-warning-soft-foreground"
                : "text-foreground",
            )}
          >
            {item.count}
          </span>
        </Link>
      ))}
    </nav>
  );
}
