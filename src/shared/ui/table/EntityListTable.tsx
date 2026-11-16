/**
 * EntityListTable — listado Operate canónico (SoT §7 T1–T10, salvo T8/T9).
 *
 * Card propia si `framed` (default); bajo ListPageShell usar `framed={false}`.
 * Density siempre en Table + kinds + sort aria-sort.
 * Empty → null (shell posee empty). Loading → skeleton por columns.
 * Filas de grupo opcionales (`getGroupKey` + `renderGroupHeader`).
 * Kind `share` + prop `summaryRow` (F-ds · evolve-ds 2026-11-16).
 */

import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { cn } from "@shared/lib/utils/cn";
import { Progress } from "@shared/ui/progress";
import { Skeleton } from "@shared/ui/skeleton";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { formatDate } from "@shared/utils/dateUtils";

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  type TableDensity,
} from "./table";

// ---------------------------------------------------------------------------
// Types (contrato TEC §5 + footer slot §10 + F-ds share/summaryRow)
// ---------------------------------------------------------------------------

export type EntityListColumnKind =
  | "primary"
  | "text"
  | "meta"
  | "stacked"
  | "code"
  | "number"
  | "money"
  | "share"
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

/** Celda de porción: monto + % + barra (opt-in; p. ej. Reparto). */
export interface EntityListShareValue {
  amount?: number | null;
  /** 0–100 */
  percent: number;
  /** default true */
  bar?: boolean;
}

export interface EntityListSummaryRow {
  label: React.ReactNode;
  cells?: Partial<
    Record<string, React.ReactNode | EntityListShareValue | number>
  >;
}

export interface EntityListColumnDef<TRow> {
  id: string;
  header: string;
  kind: EntityListColumnKind;
  /** Valor de celda; stacked → EntityListStackedValue; share → EntityListShareValue */
  accessor: (
    row: TRow,
  ) =>
    | React.ReactNode
    | EntityListStackedValue
    | EntityListShareValue
    | null
    | undefined;
  sortable?: boolean;
  /** Campo que viaja a URL/API cuando sortable */
  sortField?: string;
  className?: string;
  headerClassName?: string;
  /** Peso de la línea 1 en `stacked` (default `"medium"`). */
  stackedWeight?: "medium" | "normal";
}

/**
 * Fila de grupo (sección dentro del mismo `<tbody>`).
 * `title` + `meta` ocupan desde la primera columna hasta la anterior a la
 * primera columna con contenido en `cells`; cada celda se alinea con su kind.
 */
export interface EntityListGroupHeader {
  title: React.ReactNode;
  /** Misma línea, muted, precedido de «·». */
  meta?: React.ReactNode;
  /** Contenido por `column.id` (p. ej. subtotal bajo la columna money, CTA en actions). */
  cells?: Partial<Record<string, React.ReactNode>>;
}

export interface EntityListGroup<TRow> {
  key: string;
  /** Filas visibles del grupo (corrida consecutiva con la misma key). */
  rows: TRow[];
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
  /**
   * Master-detail / selección puntual sin navegación.
   * Solo se usa si no hay `primaryTo` (T7: con link primario gana el Link).
   */
  onRowActivate?: (row: TRow) => void;
  /** Clases extra por fila (p. ej. selección `bg-primary-50`, aging). */
  getRowClassName?: (row: TRow) => string | undefined;
  /**
   * Attrs extra por fila (`data-testid`, `data-selected`, …).
   * No usar para `className`/`onClick` — van por `getRowClassName` / activate.
   */
  getRowProps?: (
    row: TRow,
  ) =>
    | Omit<React.HTMLAttributes<HTMLTableRowElement>, "className" | "onClick">
    | undefined;
  /**
   * Filas extra tras cada row (expansión de familia, detalle inline).
   * Debe devolver `TableRow` / fragmento de rows — no `<tbody>`.
   */
  renderAfterRow?: (row: TRow) => React.ReactNode;
  /**
   * Agrupa filas consecutivas con la misma key bajo una fila de grupo.
   * El caller entrega `rows` ya ordenadas por grupo (no se reordena aquí).
   * Requiere `renderGroupHeader`.
   */
  getGroupKey?: (row: TRow) => string;
  renderGroupHeader?: (group: EntityListGroup<TRow>) => EntityListGroupHeader;
  sort?: EntityListSortState | null;
  onSortChange?: (next: EntityListSortState) => void;
  /** Sticky thead si true o filas renderizadas (datos + grupo) > 25 (T10) */
  stickyHeader?: boolean;
  className?: string;
  /** `aria-label` del `<table>` (tests / a11y de listados con nombre). */
  "aria-label"?: string;
  /**
   * Si true (default), envuelve en card `rounded-xl border bg-card shadow-sm`.
   * Bajo `ListPageShell` table-mode pasar `framed={false}`: el shell aporta el marco
   * y el pie (summary + paginación). Evitar card-dentro-de-card.
   */
  framed?: boolean;
  /**
   * Slot bajo la tabla (`border-t`). Útil en demos / uso embebido fuera del shell.
   * Con `ListPageShell` el pie vive en el shell — no pasar `footer` ahí.
   * No confundir con `summaryRow` (fila de totales de columnas).
   */
  footer?: React.ReactNode;
  /**
   * Fila de totales al final (`<tfoot>`). Opt-in; no va en `rows[]`.
   * No hover / no `onRowActivate`. No usar para secciones (usar `getGroupKey`).
   */
  summaryRow?: EntityListSummaryRow;
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
    !("percent" in value) &&
    !React.isValidElement(value)
  );
}

function isShareValue(value: unknown): value is EntityListShareValue {
  return (
    typeof value === "object" &&
    value !== null &&
    "percent" in value &&
    !React.isValidElement(value)
  );
}

function isEmptyCellValue(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  return false;
}

function clampSharePercent(percent: number): number {
  if (!Number.isFinite(percent)) return 0;
  return Math.min(100, Math.max(0, percent));
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
  if (
    kind === "number" ||
    kind === "money" ||
    kind === "share" ||
    kind === "actions"
  ) {
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
    case "share":
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
    case "share":
      return (
        <div className="ml-auto w-24 space-y-1.5">
          <Skeleton className="ml-auto h-4 w-16" />
          <Skeleton className="h-1.5 w-full" />
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

/**
 * Share cell: amount (optional) + visible N% + thin Progress.
 * a11y: el % legible es la señal; la barra va `aria-hidden` (no duplicar progressbar).
 * Compact puede crecer ~1 línea vs fila de un solo valor — documentado en README.
 */
function renderShare(value: EntityListShareValue): React.ReactNode {
  const percent = clampSharePercent(value.percent);
  const showBar = value.bar !== false;
  const amountNode =
    value.amount != null && Number.isFinite(value.amount)
      ? formatMoneyValue(value.amount)
      : null;

  return (
    <div className="ml-auto flex w-full min-w-[5.5rem] max-w-[9rem] flex-col items-end gap-0.5">
      {amountNode != null ? (
        <div className="text-sm tabular-nums">{amountNode}</div>
      ) : null}
      <div className="flex w-full flex-col items-end gap-0.5">
        <span className="text-xs text-muted-foreground tabular-nums">
          {`${percent}%`}
        </span>
        {showBar ? (
          <Progress
            value={percent}
            aria-hidden
            className="h-1.5 w-full bg-primary/15"
          />
        ) : null}
      </div>
    </div>
  );
}

function renderStacked(
  value: EntityListStackedValue,
  weight: "medium" | "normal" = "medium",
): React.ReactNode {
  const primaryEmpty = isEmptyCellValue(value.primary);
  const secondaryEmpty = isEmptyCellValue(value.secondary);
  if (primaryEmpty && secondaryEmpty) return <EmptyDash />;

  return (
    <div className="min-w-0">
      <div
        className={cn(
          "truncate text-sm",
          weight === "medium" ? "font-medium" : "font-normal",
        )}
      >
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

  if (column.kind === "share") {
    if (raw == null) return <EmptyDash />;
    if (isShareValue(raw)) return renderShare(raw);
    if (isEmptyCellValue(raw)) return <EmptyDash />;
    return raw as React.ReactNode;
  }

  if (column.kind === "stacked") {
    if (raw == null) return <EmptyDash />;
    if (isStackedValue(raw)) return renderStacked(raw, column.stackedWeight);
    // Fallback: treat as single line if caller returned a node
    if (isEmptyCellValue(raw)) return <EmptyDash />;
    return (
      <div
        className={cn(
          "text-sm",
          column.stackedWeight === "normal" ? "font-normal" : "font-medium",
        )}
      >
        {raw as React.ReactNode}
      </div>
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

function buildGroups<TRow>(
  rows: TRow[],
  getGroupKey: (row: TRow) => string,
): EntityListGroup<TRow>[] {
  const groups: EntityListGroup<TRow>[] = [];
  for (const row of rows) {
    const key = getGroupKey(row);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.rows.push(row);
    } else {
      groups.push({ key, rows: [row] });
    }
  }
  return groups;
}

function formatGroupCellValue(
  kind: EntityListColumnKind,
  value: React.ReactNode,
): React.ReactNode {
  if (kind === "money") return formatMoneyValue(value);
  if (kind === "number") return formatNumberValue(value);
  return value;
}

function formatSummaryCellValue(
  kind: EntityListColumnKind,
  value: React.ReactNode | EntityListShareValue | number | undefined,
): React.ReactNode {
  if (value == null) return null;
  if (kind === "share") {
    if (isShareValue(value)) return renderShare(value);
    return value as React.ReactNode;
  }
  if (kind === "money") return formatMoneyValue(value);
  if (kind === "number") return formatNumberValue(value);
  return value as React.ReactNode;
}

function SummaryRow<TRow>({
  columns,
  summary,
}: {
  columns: EntityListColumnDef<TRow>[];
  summary: EntityListSummaryRow;
}) {
  const cells = summary.cells ?? {};
  const firstCellIndex = columns.findIndex(
    (column, index) => index > 0 && cells[column.id] !== undefined,
  );
  const labelSpan = firstCellIndex === -1 ? columns.length : firstCellIndex;

  return (
    <TableRow
      data-entity-summary-row=""
      className="bg-muted/60 font-semibold hover:bg-muted/60 dark:bg-muted dark:hover:bg-muted"
    >
      <TableCell colSpan={labelSpan} className="font-semibold text-foreground">
        {summary.label}
      </TableCell>
      {columns.slice(labelSpan).map((column) => (
        <TableCell
          key={column.id}
          className={cn(
            cellAlignClass(column.kind),
            cellKindClass(column.kind),
            "font-semibold",
            column.className,
          )}
        >
          {formatSummaryCellValue(column.kind, cells[column.id])}
        </TableCell>
      ))}
    </TableRow>
  );
}

function GroupHeaderRow<TRow>({
  columns,
  header,
}: {
  columns: EntityListColumnDef<TRow>[];
  header: EntityListGroupHeader;
}) {
  const cells = header.cells ?? {};
  const firstCellIndex = columns.findIndex(
    (column, index) => index > 0 && cells[column.id] !== undefined,
  );
  const labelSpan = firstCellIndex === -1 ? columns.length : firstCellIndex;

  return (
    <TableRow
      data-entity-group-row=""
      className="bg-muted/60 hover:bg-muted/60 dark:bg-muted dark:hover:bg-muted"
    >
      <TableCell colSpan={labelSpan}>
        <span className="font-semibold text-foreground">{header.title}</span>
        {header.meta != null ? (
          <span className="text-muted-foreground"> · {header.meta}</span>
        ) : null}
      </TableCell>
      {columns.slice(labelSpan).map((column) => (
        <TableCell
          key={column.id}
          className={cn(
            cellAlignClass(column.kind),
            cellKindClass(column.kind),
            column.className,
          )}
        >
          {formatGroupCellValue(column.kind, cells[column.id] ?? null)}
        </TableCell>
      ))}
    </TableRow>
  );
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
  onRowActivate,
  getRowClassName,
  getRowProps,
  renderAfterRow,
  getGroupKey,
  renderGroupHeader,
  sort = null,
  onSortChange,
  stickyHeader,
  className,
  "aria-label": ariaLabel,
  framed = true,
  footer,
  summaryRow,
}: EntityListTableProps<TRow>) {
  const density: TableDensity = densityProp ?? "list";

  if (!isLoading && rows.length === 0) {
    return null;
  }

  const groups =
    getGroupKey && renderGroupHeader ? buildGroups(rows, getGroupKey) : null;
  const renderedRowCount = rows.length + (groups?.length ?? 0);

  const sticky =
    stickyHeader === true ||
    (!isLoading && renderedRowCount > STICKY_ROW_THRESHOLD);

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
    row: TRow,
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
      return;
    }
    onRowActivate?.(row);
  };

  const hasPrimaryLink = Boolean(
    primaryTo && columns.some((c) => c.kind === "primary"),
  );
  const rowInteractive = hasPrimaryLink || Boolean(onRowActivate);

  const renderDataRow = (row: TRow) => {
    const rowProps = getRowProps?.(row);
    return (
      <React.Fragment key={getRowId(row)}>
        <TableRow
          {...rowProps}
          className={cn(
            rowInteractive && "cursor-pointer",
            getRowClassName?.(row),
          )}
          onClick={
            rowInteractive ? (event) => handleRowClick(event, row) : undefined
          }
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
              {renderCellContent(column, row, primaryTo, primaryState)}
            </TableCell>
          ))}
        </TableRow>
        {renderAfterRow?.(row)}
      </React.Fragment>
    );
  };

  const tableBlock = (
    <>
      <Table density={density} aria-label={ariaLabel}>
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
                        column.kind === "number" ||
                        column.kind === "money" ||
                        column.kind === "share"
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
            {groups && renderGroupHeader
              ? groups.map((group, index) => (
                  <React.Fragment key={`group-${index}-${group.key}`}>
                    <GroupHeaderRow
                      columns={columns}
                      header={renderGroupHeader(group)}
                    />
                    {group.rows.map(renderDataRow)}
                  </React.Fragment>
                ))
              : rows.map(renderDataRow)}
          </TableBody>
        )}

        {!isLoading && summaryRow != null ? (
          <TableFooter className="border-t bg-transparent font-semibold [&>tr]:border-0">
            <SummaryRow columns={columns} summary={summaryRow} />
          </TableFooter>
        ) : null}
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
