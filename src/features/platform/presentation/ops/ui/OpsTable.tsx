import * as React from "react";
import { Check, MoreHorizontal, X } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";

/**
 * Skeleton denso Ops. Consumir para listados/money tables;
 * no reutilizar `@shared/ui/table` desde `ops/**` fuera de este kit.
 */
export function OpsTable({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="ops-table-wrap" data-testid="ops-table">
      <table className={cn("ops-table", className)} {...props} />
    </div>
  );
}

export const OpsTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={className} {...props} />
));
OpsTableHeader.displayName = "OpsTableHeader";

export const OpsTableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={className} {...props} />
));
OpsTableBody.displayName = "OpsTableBody";

export interface OpsTableRowProps
  extends React.HTMLAttributes<HTMLTableRowElement> {
  tick?: "warn" | "danger";
}

export const OpsTableRow = React.forwardRef<
  HTMLTableRowElement,
  OpsTableRowProps
>(({ className, tick, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn("ops-row", className)}
    {...props}
    {...(tick ? { "data-ops-tick": tick } : {})}
  />
));
OpsTableRow.displayName = "OpsTableRow";

export const OpsTableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th ref={ref} className={className} {...props} />
));
OpsTableHead.displayName = "OpsTableHead";

export const OpsTableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td ref={ref} className={className} {...props} />
));
OpsTableCell.displayName = "OpsTableCell";

export type OpsTableStatusTone = "ok" | "warn" | "danger";

const statusGlyph: Record<
  OpsTableStatusTone,
  React.ComponentType<{ className?: string; strokeWidth?: number }> | null
> = {
  ok: Check,
  warn: null,
  danger: X,
};

export interface OpsTableStatusProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  tone: OpsTableStatusTone;
  label: string;
}

/** Disco circular semántico a la izquierda de fila (oficio GH ✓/✗). */
export function OpsTableStatus({
  tone,
  label,
  className,
  ...props
}: OpsTableStatusProps) {
  const Icon = statusGlyph[tone];
  return (
    <span
      data-ops-table-status={tone}
      className={cn("ops-table-status", className)}
      title={label}
      {...props}
    >
      {Icon ? (
        <Icon className="ops-table-status-icon" strokeWidth={2.5} aria-hidden />
      ) : (
        <span className="ops-table-status-dot" aria-hidden />
      )}
      <span className="sr-only">{label}</span>
    </span>
  );
}

export interface OpsTablePrimaryProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  meta?: React.ReactNode;
}

/** Título + meta caption (fila densa Primer). */
export function OpsTablePrimary({
  title,
  meta,
  className,
  ...props
}: OpsTablePrimaryProps) {
  return (
    <div className={cn("ops-table-primary", className)} {...props}>
      <span className="ops-table-primary-title">{title}</span>
      {meta != null ? (
        <span className="ops-table-primary-meta">{meta}</span>
      ) : null}
    </div>
  );
}

export interface OpsTableEllipsisProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
}

/** Acción `…` de fila (demo / menú). */
export const OpsTableEllipsis = React.forwardRef<
  HTMLButtonElement,
  OpsTableEllipsisProps
>(({ className, label = "Más acciones", ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    aria-label={label}
    data-ops-table-ellipsis=""
    className={cn("ops-table-ellipsis ops-ring-accent", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} aria-hidden />
  </button>
));
OpsTableEllipsis.displayName = "OpsTableEllipsis";
