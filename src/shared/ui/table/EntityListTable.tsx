/**
 * EntityListTable — listado Operate canónico (SoT §7 T1–T10, salvo T8/T9).
 *
 * Card propia si `framed` (default); bajo ListPageShell usar `framed={false}`.
 * Density siempre en Table + kinds + sort aria-sort.
 * Empty → null (shell posee empty). Loading → skeleton por columns.
 */

import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { cn } from "@shared/lib/utils/cn";
import { Skeleton } from "@shared/ui/skeleton";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { formatDate } from "@shared/utils/dateUtils";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type TableDensity,
} from "./table";

// ---------------------------------------------------------------------------
// Types (contrato TEC §5 + footer slot §10)
// ---------------------------------------------------------------------------

export type EntityListColumnKind =
  | "primary"
  | "text"
  | "meta"
  | "stacked"
  | "code"
  | "number"
  | "money"
  | "date"
  | "status"
  | "actions";

export type EntityListSortDirection = "asc" | "desc";

export interface EntityListSortState {
  field: string;
  direction: EntityListSortDirection;
}

export interface EntityListStackedValue {
  primary: React.ReactNode;
  secondary?: React.ReactNode;
}

export interface EntityListColumnDef<TRow> {
  id: string;
  header: string;
  kind: EntityListColumnKind;
  /** Valor de celda; stacked → EntityListStackedValue */
  accessor: (
    row: TRow,
  ) => React.ReactNode | EntityListStackedValue | null | undefined;
  sortable?: boolean;
  /** Campo que viaja a URL/API cuando sortable */
  sortField?: string;
  className?: string;
  headerClassName?: string;
}

export interface EntityListTableProps<TRow> {
  columns: EntityListColumnDef<TRow>[];
  rows: TRow[];
  getRowId: (row: TRow) => string;
  isLoading?: boolean;
  /** default "list"; siempre se pasa a Table */
  density?: TableDensity;
  /** Href del link primario (obligatorio si hay columna kind=primary) */
  primaryTo?: (row: TRow) => string;
  /** `location.state` del Link primario (p. ej. cola `from` del listado) */
  primaryState?: (row: TRow) => unknown;
  sort?: EntityListSortState | null;
  onSortChange?: (next: EntityListSortState) => void;
  /** Sticky thead si true o rows.length > 25 (T10) */
  stickyHeader?: boolean;
  className?: string;
  /**
   * Si true (default), envuelve en card `rounded-xl border bg-card shadow-sm`.
   * Bajo `ListPageShell` table-mode pasar `framed={false}`: el shell aporta el marco
   * y el pie (summary + paginación). Evitar card-dentro-de-card.
   */
  framed?: boolean;
  /**
   * Slot bajo la tabla (`border-t`). Útil en demos / uso embebido fuera del shell.
   * Con `ListPageShell` el pie vive en el shell — no pasar `footer` ahí.
   */
  footer?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EMPTY_DASH = "—";
const SKELETON_ROW_COUNT = 5;
const STICKY_ROW_THRESHOLD = 25;

const numberFormatter = new Intl.NumberFormat("es-MX");

const PRIMARY_LINK_ATTR = "data-entity-primary-link";

function isStackedValue(value: unknown): value is EntityListStackedValue {
  return (
    typeof value === "object" &&
    value !== null &&
    "primary" in value &&
    !React.isValidElement(value)
  );
}

function isEmptyCellValue(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  return false;
}

function formatNumberValue(value: unknown): React.ReactNode {
  if (typeof value === "number" && Number.isFinite(value)) {
    return numberFormatter.format(value);
  }
  return value as React.ReactNode;
}

function formatMoneyValue(value: unknown): React.ReactNode {
  if (typeof value === "number" && Number.isFinite(value)) {
    const formatted = formatMxCurrency(value);
    if (value < 0) {
      return <span className="text-destructive">{formatted}</span>;
    }
    return formatted;
  }
  return value as React.ReactNode;
}

function formatDateValue(value: unknown): React.ReactNode {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return EMPTY_DASH;
    return formatDate(value.toISOString());
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return EMPTY_DASH;
    // ISO / DATE → display corto app; string ya formateado se respeta
    if (
      /^\d{4}-\d{2}-\d{2}/.test(trimmed) ||
      /^\d{4}-\d{2}-\d{2}T/.test(trimmed)
    ) {
      return formatDate(trimmed);
    }
    return trimmed;
  }
  return value as React.ReactNode;
}

function cellAlignClass(kind: EntityListColumnKind): string {
  if (kind === "number" || kind === "money" || kind === "actions") {
    return "text-right";
  }
  return "text-left";
}

function cellKindClass(kind: EntityListColumnKind): string {
  switch (kind) {
    case "primary":
      return "font-medium";
    case "meta":
      return "text-muted-foreground";
    case "code":
      return "font-mono text-[13px]";
    case "number":
    case "money":
      return "font-mono tabular-nums";
    case "date":
      return "tabular-nums";
    case "actions":
      return "w-12 pr-2";
    default:
      return "";
  }
}

function skeletonForKind(kind: EntityListColumnKind): React.ReactNode {
  switch (kind) {
    case "stacked":
      return (
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      );
    case "status":
      return <Skeleton className="h-6 w-16 rounded-full" />;
    case "actions":
      return <Skeleton className="ml-auto h-8 w-8" />;
    case "number":
    case "money":
      return <Skeleton className="ml-auto h-4 w-16" />;
    case "code":
      return <Skeleton className="h-4 w-24" />;
    case "date":
      return <Skeleton className="h-4 w-24" />;
    case "primary":
      return <Skeleton className="h-4 w-20" />;
    default:
      return <Skeleton className="h-4 w-32" />;
  }
}

function EmptyDash() {
  return <span className="text-muted-foreground">{EMPTY_DASH}</span>;
}

function renderStacked(value: EntityListStackedValue): React.ReactNode {
  const primaryEmpty = isEmptyCellValue(value.primary);
  const secondaryEmpty = isEmptyCellValue(value.secondary);
  if (primaryEmpty && secondaryEmpty) return <EmptyDash />;

  return (
    <div className="min-w-0">
      <div className="truncate font-medium text-sm">
        {primaryEmpty ? <EmptyDash /> : value.primary}
      </div>
      {!secondaryEmpty ? (
        <div className="truncate text-xs text-muted-foreground">
          {value.secondary}
        </div>
      ) : null}
    </div>
  );
}

function PrimaryRowLink({
  to,
  state,
  children,
}: {
  to: string;
  state?: unknown;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      state={state}
      data-entity-primary-link=""
      className="font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </Link>
  );
}

function renderCellContent<TRow>(
  column: EntityListColumnDef<TRow>,
  row: TRow,
  primaryTo?: (row: TRow) => string,
  primaryState?: (row: TRow) => unknown,
): React.ReactNode {
  const raw = column.accessor(row);

  if (column.kind === "actions") {
    return (raw as React.ReactNode) ?? null;
  }

  if (column.kind === "stacked") {
    if (raw == null) return <EmptyDash />;
    if (isStackedValue(raw)) return renderStacked(raw);
    // Fallback: treat as single line if caller returned a node
    if (isEmptyCellValue(raw)) return <EmptyDash />;
    return (
      <div className="font-medium text-sm">{raw as React.ReactNode}</div>
    );
  }

  if (column.kind === "status") {
    if (raw == null || (typeof raw === "string" && raw.trim() === "")) {
      return <EmptyDash />;
    }
    return raw as React.ReactNode;
  }

  let display: React.ReactNode;
  if (column.kind === "number") display = formatNumberValue(raw);
  else if (column.kind === "money") display = formatMoneyValue(raw);
  else if (column.kind === "date") display = formatDateValue(raw);
  else display = raw as React.ReactNode;

  if (isEmptyCellValue(display)) return <EmptyDash />;

  if (column.kind === "primary") {
    const href = primaryTo?.(row);
    const linkState = primaryState?.(row);
    // stacked + primary: link solo en la línea principal (ancla /vehicles)
    if (isStackedValue(raw)) {
      const primaryEmpty = isEmptyCellValue(raw.primary);
      const linkedPrimary =
        href && !primaryEmpty ? (
          <PrimaryRowLink to={href} state={linkState}>
            {raw.primary}
          </PrimaryRowLink>
        ) : (
          raw.primary
        );
      return renderStacked({
        primary: linkedPrimary,
        secondary: raw.secondary,
      });
    }
    if (href) {
      return (
        <PrimaryRowLink to={href} state={linkState}>
          {display}
        </PrimaryRowLink>
      );
    }
    return <span className="font-medium">{display}</span>;
  }

  if (column.kind === "text") {
    return <span className="block truncate">{display}</span>;
  }

  return display;
}

function sortFieldFor(column: EntityListColumnDef<unknown>): string {
  return column.sortField ?? column.id;
}

function ariaSortValue(
  column: EntityListColumnDef<unknown>,
  sort: EntityListSortState | null | undefined,
): "ascending" | "descending" | "none" | undefined {
  if (!column.sortable) return undefined;
  const field = sortFieldFor(column);
  if (!sort || sort.field !== field) return "none";
  return sort.direction === "asc" ? "ascending" : "descending";
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      `a, button, input, select, textarea, [role="button"], [role="menuitem"], [data-no-row-nav]`,
    ),
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EntityListTable<TRow>({
  columns,
  rows,
  getRowId,
  isLoading = false,
  density: densityProp,
  primaryTo,
  primaryState,
  sort = null,
  onSortChange,
  stickyHeader,
  className,
  framed = true,
  footer,
}: EntityListTableProps<TRow>) {
  const density: TableDensity = densityProp ?? "list";

  if (!isLoading && rows.length === 0) {
    return null;
  }

  const sticky =
    stickyHeader === true || (!isLoading && rows.length > STICKY_ROW_THRESHOLD);

  const handleSort = (column: EntityListColumnDef<TRow>) => {
    if (!column.sortable || !onSortChange) return;
    const field = sortFieldFor(column as EntityListColumnDef<unknown>);
    if (sort?.field === field) {
      onSortChange({
        field,
        direction: sort.direction === "asc" ? "desc" : "asc",
      });
      return;
    }
    onSortChange({ field, direction: "asc" });
  };

  const handleRowClick = (
    event: React.MouseEvent<HTMLTableRowElement>,
  ) => {
    if (isInteractiveTarget(event.target)) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    const link = event.currentTarget.querySelector(
      `a[${PRIMARY_LINK_ATTR}]`,
    );
    if (link instanceof HTMLAnchorElement) {
      link.click();
    }
  };

  const tableBlock = (
    <>
      <Table density={density}>
        <TableHeader
          className={cn(sticky && "sticky top-0 z-10 [&_th]:bg-muted")}
        >
          <TableRow>
            {columns.map((column) => {
              const ariaSort = ariaSortValue(
                column as EntityListColumnDef<unknown>,
                sort,
              );
              const active =
                column.sortable &&
                sort != null &&
                sort.field === sortFieldFor(column as EntityListColumnDef<unknown>);

              return (
                <TableHead
                  key={column.id}
                  aria-sort={ariaSort}
                  className={cn(
                    cellAlignClass(column.kind),
                    column.kind === "actions" && "w-12 pr-2",
                    column.headerClassName,
                  )}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      className={cn(
                        "inline-flex items-center gap-1 rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        column.kind === "number" || column.kind === "money"
                          ? "ml-auto"
                          : undefined,
                      )}
                      onClick={() => handleSort(column)}
                    >
                      <span>{column.header}</span>
                      {active ? (
                        sort?.direction === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        ) : (
                          <ArrowDown
                            className="h-3.5 w-3.5 shrink-0"
                            aria-hidden
                          />
                        )
                      ) : (
                        <ArrowUpDown
                          className="h-3.5 w-3.5 shrink-0 opacity-40"
                          aria-hidden
                        />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>

        {isLoading ? (
          <TableBody>
            {Array.from({ length: SKELETON_ROW_COUNT }).map((_, rowIndex) => (
              <TableRow key={`skeleton-${rowIndex}`} className="hover:bg-transparent">
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    className={cn(
                      cellAlignClass(column.kind),
                      column.kind === "actions" && "w-12 pr-2",
                      column.className,
                    )}
                  >
                    {skeletonForKind(column.kind)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        ) : (
          <TableBody>
            {rows.map((row) => {
              const hasPrimaryLink = Boolean(
                primaryTo && columns.some((c) => c.kind === "primary"),
              );
              return (
                <TableRow
                  key={getRowId(row)}
                  className={cn(hasPrimaryLink && "cursor-pointer")}
                  onClick={hasPrimaryLink ? handleRowClick : undefined}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      className={cn(
                        cellAlignClass(column.kind),
                        cellKindClass(column.kind),
                        column.className,
                      )}
                      onClick={
                        column.kind === "actions"
                          ? (e) => e.stopPropagation()
                          : undefined
                      }
                    >
                      {renderCellContent(
                        column,
                        row,
                        primaryTo,
                        primaryState,
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        )}
      </Table>

      {footer != null ? (
        <div className="border-t px-4 py-2.5 text-[13px] text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </>
  );

  if (!framed) {
    return <div className={cn(className)}>{tableBlock}</div>;
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-card shadow-sm overflow-hidden",
        className,
      )}
    >
      {tableBlock}
    </div>
  );
}
