/**
 * PerformanceMonthlyTable — desempeño mensual (`EntityListTable`).
 *
 * Mes · Ingreso · Costo · Margen · % · [Personal] · Viajes · [Δ×3 si compare].
 * density compact · framed false (borde en Card).
 * T4: con compare + personal puede superar 7 cols (análisis).
 * Sin colspan: mes en curso muestra mensaje en 1ª col Δ; resto vacío.
 */

import { Link } from "react-router-dom";
import {
  buildFinanceMarginMonthHref,
  computeMarginPct,
  computeVariation,
  type AlignedPerformanceMonth,
} from "@features/finance/application";
import { Badge } from "@shared/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListStackedValue,
} from "@shared/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@shared/ui/tooltip";
import { financeCopy } from "../copy";
import {
  formatPct,
  formatPerformanceMonth,
  formatPerformanceMonthWithStatus,
} from "../utils/monthlyPerformanceFormat";
import { PerformanceVariation } from "./PerformanceVariation";

const copy = financeCopy.performance.table;
const provisionalCopy = financeCopy.performance.provisional;

interface PerformanceMonthlyTableProps {
  months: AlignedPerformanceMonth[];
  compare: boolean;
  /** ADR-0108 — columna Costo de personal aparte. */
  showPersonnelColumn?: boolean;
}

function ProvisionalMonthChip({ monthLabel }: { monthLabel: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1.5">
          <Badge
            variant="warning"
            tone="soft"
            className="text-xs font-normal"
            aria-label={provisionalCopy.ariaLabel}
          >
            {provisionalCopy.chip}
          </Badge>
          <span className="text-xs text-warning">{provisionalCopy.hint}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">
        {provisionalCopy.chipTooltip(monthLabel)}
      </TooltipContent>
    </Tooltip>
  );
}

function buildColumns(
  compare: boolean,
  showPersonnelColumn: boolean,
): EntityListColumnDef<AlignedPerformanceMonth>[] {
  const columns: EntityListColumnDef<AlignedPerformanceMonth>[] = [
    {
      id: "month",
      header: copy.month,
      kind: "stacked",
      className: "whitespace-nowrap",
      accessor: (month): EntityListStackedValue => {
        const showProvisionalChip =
          month.current.provisional && !month.isInProgress;
        const monthLabel = formatPerformanceMonth(month.period);
        const countsLine = showProvisionalChip
          ? provisionalCopy.countsLine(
              month.current.incompleteTripCount,
              month.current.tripsWithPendingExpenses,
            )
          : "";

        return {
          primary: (
            <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
              <Link
                to={buildFinanceMarginMonthHref(month.period)}
                className="text-primary underline-offset-4 hover:underline"
                aria-label={copy.openMonthAria(
                  formatPerformanceMonthWithStatus(
                    month.period,
                    month.isInProgress,
                  ),
                )}
              >
                {formatPerformanceMonthWithStatus(
                  month.period,
                  month.isInProgress,
                )}
              </Link>
              {showProvisionalChip ? (
                <ProvisionalMonthChip monthLabel={monthLabel} />
              ) : null}
            </span>
          ),
          secondary: countsLine || undefined,
        };
      },
    },
    {
      id: "revenue",
      header: copy.revenue,
      kind: "money",
      accessor: (month) => month.current.actualRevenue,
    },
    {
      id: "cost",
      header: copy.cost,
      kind: "money",
      accessor: (month) => month.current.actualCost,
    },
    {
      id: "margin",
      header: copy.margin,
      kind: "money",
      accessor: (month) => month.current.actualMargin,
    },
    {
      id: "marginPct",
      header: copy.marginPct,
      kind: "meta",
      headerClassName: "text-right",
      className: "text-right tabular-nums",
      accessor: (month) =>
        formatPct(
          computeMarginPct(
            month.current.actualMargin,
            month.current.actualRevenue,
          ),
        ),
    },
  ];

  if (showPersonnelColumn) {
    columns.push({
      id: "personnel",
      header: copy.personnelCost,
      kind: "money",
      accessor: (month) => month.current.periodPersonnelCost ?? 0,
    });
  }

  columns.push({
    id: "trips",
    header: copy.trips,
    kind: "number",
    accessor: (month) => month.current.tripCount,
  });

  if (compare) {
    columns.push(
      {
        id: "deltaRevenue",
        header: copy.deltaRevenue,
        kind: "status",
        headerClassName: "text-right",
        className: "text-right",
        accessor: (month) => {
          if (month.isInProgress) {
            return (
              <span className="text-xs text-muted-foreground">
                {copy.inProgressComparison}
              </span>
            );
          }
          return (
            <PerformanceVariation
              variation={computeVariation(
                month.current.actualRevenue,
                month.previous.actualRevenue,
              )}
              polarity="higher-is-better"
            />
          );
        },
      },
      {
        id: "deltaCost",
        header: copy.deltaCost,
        kind: "status",
        headerClassName: "text-right",
        className: "text-right",
        accessor: (month) => {
          // Fragmento vacío (no null) para no pintar "—" del kind status.
          if (month.isInProgress) return <></>;
          return (
            <PerformanceVariation
              variation={computeVariation(
                month.current.actualCost,
                month.previous.actualCost,
              )}
              polarity="lower-is-better"
            />
          );
        },
      },
      {
        id: "deltaMargin",
        header: copy.deltaMargin,
        kind: "status",
        headerClassName: "text-right",
        className: "text-right",
        accessor: (month) => {
          if (month.isInProgress) return <></>;
          return (
            <PerformanceVariation
              variation={computeVariation(
                month.current.actualMargin,
                month.previous.actualMargin,
              )}
              polarity="higher-is-better"
            />
          );
        },
      },
    );
  }

  return columns;
}

export function PerformanceMonthlyTable({
  months,
  compare,
  showPersonnelColumn = false,
}: PerformanceMonthlyTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {months.length === 0 ? null : (
          <div className="overflow-x-auto rounded-md border">
            <EntityListTable
              framed={false}
              density="compact"
              columns={buildColumns(compare, showPersonnelColumn)}
              rows={months}
              getRowId={(row) => row.period}
              getRowClassName={(row) =>
                row.isInProgress ? "bg-muted/40" : undefined
              }
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
