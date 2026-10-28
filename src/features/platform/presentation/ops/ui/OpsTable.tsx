import * as React from "react";
import { cn } from "@shared/lib/utils/cn";

/**
 * Skeleton denso Ops (Ola 0). Consumir para listados/money tables en O1–O2;
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
