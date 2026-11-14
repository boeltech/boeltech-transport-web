/**
 * ProfitabilityMasterDetailTable — agregados + detalle viaje (`EntityListTable`).
 *
 * Master: expand · dimensión · viajes · ingreso · costo · margen · % (7 cols).
 * Detail: densidades variables por scope — T4 excepción si pipeline/margen añaden cols.
 * density compact · framed false (borde en Card). Empty = emptyState del host.
 */

import { useMemo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, Filter } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Skeleton } from "@shared/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  EntityListTable,
  TableCell,
  TableRow,
  type EntityListColumnDef,
  type EntityListStackedValue,
} from "@shared/ui/table";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import {
  MARGIN_ANALYSIS_DIMENSIONS,
  useProfitabilityTrips,
  type MarginAnalysisDimension,
} from "@features/finance/application";
import type {
  FinancialBucket,
  ProfitabilityAggregateItem,
  ProfitabilityScope,
  ProfitabilityTripItem,
  ProfitabilityTripsFilters,
} from "@features/finance/domain";
import { shouldShowMissingCommissionChip } from "@features/finance/domain";
import { financeCopy } from "../copy";
import { getProfitabilityStatusConfig } from "../config/profitabilityStatusConfig";
import {
  buildProfitabilityTripsFiltersForExpand,
  filterTripsForExpandedGroup,
} from "../utils/profitabilityExpandTripsFilters";
import {
  aggregateDisplayCost,
  aggregateDisplayMargin,
  aggregateDisplayMarginPct,
  aggregateUsesOperationalBasis,
  tripDisplayCost,
  tripDisplayMargin,
  tripDisplayMarginPct,
  tripDisplayStatus,
  tripsUseOperationalBasis,
} from "../utils/operationalMarginDisplay";

const DIMENSION_LABELS = financeCopy.profitability.filters.dimensions;

const FINANCIAL_BUCKET_LABELS: Record<FinancialBucket, string> = {
  realized: financeCopy.profitability.buckets.realized,
  in_progress: financeCopy.profitability.buckets.in_progress,
  pipeline: financeCopy.profitability.buckets.pipeline,
  cancellation_loss: financeCopy.profitability.buckets.cancellation_loss,
};

const MASTER_COL_COUNT = 7;

function ProfitabilityRevenueCell({ row }: { row: ProfitabilityTripItem }) {
  const sourceLabel =
    row.revenueSource === "invoice_subtotal"
      ? financeCopy.profitability.table.revenueSourceInvoice
      : row.revenueSource === "trip_base_rate"
        ? financeCopy.profitability.table.revenueSourceBaseRate
        : null;

  return (
    <div className="flex flex-col items-end gap-1">
      <span>{formatMxCurrency(row.revenue)}</span>
      {sourceLabel ? (
        <Badge variant="outline" className="text-[10px] font-normal">
          {sourceLabel}
        </Badge>
      ) : null}
      {(row.cancelledInvoiceRevenue ?? 0) > 0 ? (
        <span className="text-[10px] text-muted-foreground">
          {financeCopy.profitability.table.cancelledInvoiceRevenue(
            formatMxCurrency(row.cancelledInvoiceRevenue ?? 0),
          )}
        </span>
      ) : null}
    </div>
  );
}

interface ProfitabilityMasterDetailTableProps {
  scope: ProfitabilityScope;
  dimension: MarginAnalysisDimension;
  onDimensionChange: (value: MarginAnalysisDimension) => void;
  /** Periodo de la tabla y de los viajes al abrir un grupo (días civiles CDMX). */
  from?: string;
  to?: string;
  /** Al abrir un grupo, solo sus viajes con pérdida. */
  lossOnly?: boolean;
  aggregate: ProfitabilityAggregateItem[] | undefined;
  aggregateLoading: boolean;
  /** Estado vacío del periodo (lo arma la vista, que conoce periodo y alcance). */
  emptyState: ReactNode;
  expandedKey: string | null;
  onExpandedKeyChange: (key: string | null) => void;
  queriesEnabled?: boolean;
}

function buildDetailColumns(
  dimension: MarginAnalysisDimension,
  scope: ProfitabilityScope,
  operational: boolean,
): EntityListColumnDef<ProfitabilityTripItem>[] {
  const showPipelineColumn = scope === "pipeline";
  const showMarginColumns = scope !== "pipeline" && scope !== "cancelled";
  const costLabel = operational
    ? financeCopy.profitability.table.operationalCost
    : financeCopy.profitability.table.actualTotal;
  const marginLabel = operational
    ? financeCopy.profitability.table.operationalMargin
    : financeCopy.profitability.table.margin;

  const columns: EntityListColumnDef<ProfitabilityTripItem>[] = [
    {
      id: "trip",
      header: financeCopy.profitability.table.trip,
      kind: "stacked",
      accessor: (row): EntityListStackedValue => {
        const missingCommission = shouldShowMissingCommissionChip(row);
        return {
          primary: row.tripId ? (
            <Link
              to={`/trips/${row.tripId}`}
              className="font-mono font-medium text-primary hover:underline"
              aria-label={financeCopy.profitability.masterDetail.viewTrip(
                row.tripCode,
              )}
            >
              {row.tripCode}
            </Link>
          ) : (
            <span className="font-mono font-medium">{row.tripCode}</span>
          ),
          secondary: missingCommission ? (
            <Badge
              variant="outline"
              className="text-[10px] font-normal"
              data-testid="missing-commission-chip"
            >
              {financeCopy.profitability.missingCommissionChip}
            </Badge>
          ) : undefined,
        };
      },
    },
  ];

  if (dimension !== "client") {
    columns.push({
      id: "client",
      header: financeCopy.profitability.table.client,
      kind: "text",
      accessor: (row) =>
        row.clientName ?? financeCopy.profitability.table.noClient,
    });
  }

  columns.push(
    {
      id: "bucket",
      header: financeCopy.profitability.table.bucket,
      kind: "status",
      accessor: (row) =>
        row.financialBucket ? (
          <Badge variant="outline" className="text-xs">
            {FINANCIAL_BUCKET_LABELS[row.financialBucket] ??
              row.financialBucket}
          </Badge>
        ) : null,
    },
    {
      id: "revenue",
      header: financeCopy.profitability.table.revenue,
      kind: "status",
      headerClassName: "text-right",
      className: "text-right",
      accessor: (row) => <ProfitabilityRevenueCell row={row} />,
    },
    {
      id: "cost",
      header: costLabel,
      kind: "money",
      accessor: (row) => tripDisplayCost(row, operational),
    },
  );

  if (showPipelineColumn) {
    columns.push({
      id: "projected",
      header: financeCopy.profitability.table.projected,
      kind: "money",
      accessor: (row) => row.projectedRevenue ?? 0,
    });
  }

  if (showMarginColumns) {
    columns.push(
      {
        id: "margin",
        header: marginLabel,
        kind: "money",
        accessor: (row) => tripDisplayMargin(row, operational),
      },
      {
        id: "marginPct",
        header: financeCopy.profitability.table.marginPct,
        kind: "meta",
        headerClassName: "text-right",
        className: "text-right",
        accessor: (row) => {
          const pct = tripDisplayMarginPct(row, operational);
          return pct == null ? null : `${pct.toFixed(2)}%`;
        },
      },
      {
        id: "status",
        header: financeCopy.profitability.table.status,
        kind: "status",
        headerClassName: "text-right",
        className: "text-right",
        accessor: (row) => {
          const displayStatus = tripDisplayStatus(row, operational);
          if (displayStatus == null) return null;
          const cfg = getProfitabilityStatusConfig(displayStatus);
          return (
            <Badge variant={cfg.badge.variant} tone={cfg.badge.tone}>
              {cfg.label ?? displayStatus}
            </Badge>
          );
        },
      },
    );
  }

  return columns;
}

function ProfitabilityTripDetailPanel({
  dimension,
  groupKey,
  filters,
  scope,
  lossOnly,
  queriesEnabled,
}: {
  dimension: MarginAnalysisDimension;
  groupKey: string;
  filters: ProfitabilityTripsFilters;
  scope: ProfitabilityScope;
  lossOnly: boolean;
  queriesEnabled: boolean;
}) {
  const { data, isLoading } = useProfitabilityTrips(filters, {
    enabled: queriesEnabled,
  });

  const rows = useMemo(
    () => filterTripsForExpandedGroup(dimension, groupKey, data?.data ?? []),
    [data?.data, dimension, groupKey],
  );

  if (isLoading) {
    return (
      <div className="space-y-2 px-4 py-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <Skeleton key={idx} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="px-4 py-3 text-sm text-muted-foreground">
        {lossOnly
          ? financeCopy.profitability.masterDetail.detailEmptyLoss
          : financeCopy.profitability.masterDetail.detailEmpty}
      </p>
    );
  }

  const operational = tripsUseOperationalBasis(data);

  return (
    <div className="overflow-x-auto border-t bg-muted/20 px-2 py-2 md:px-4">
      <EntityListTable
        framed={false}
        density="compact"
        columns={buildDetailColumns(dimension, scope, operational)}
        rows={rows}
        getRowId={(row) => row.tripId || row.tripCode}
      />
    </div>
  );
}

function buildMasterColumns(
  dimension: MarginAnalysisDimension,
  operational: boolean,
  expandedKey: string | null,
  canExpand: (key: string) => boolean,
  toggleRow: (key: string) => void,
): EntityListColumnDef<ProfitabilityAggregateItem>[] {
  const costLabel = operational
    ? financeCopy.profitability.aggregateTable.operationalCost
    : financeCopy.profitability.aggregateTable.actualTotal;
  const marginLabel = operational
    ? financeCopy.profitability.aggregateTable.operationalMargin
    : financeCopy.profitability.aggregateTable.margin;

  return [
    {
      id: "expand",
      header: "",
      kind: "status",
      className: "w-10 py-2",
      accessor: (item) => {
        if (!canExpand(item.key)) return null;
        const isExpanded = expandedKey === item.key;
        return (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-expanded={isExpanded}
            aria-label={
              isExpanded
                ? financeCopy.profitability.masterDetail.collapseRow
                : financeCopy.profitability.masterDetail.expandRow
            }
            onClick={(event) => {
              event.stopPropagation();
              toggleRow(item.key);
            }}
          >
            {isExpanded ? (
              <ChevronDown
                className="h-4 w-4 text-muted-foreground"
                aria-hidden
              />
            ) : (
              <ChevronRight
                className="h-4 w-4 text-muted-foreground"
                aria-hidden
              />
            )}
          </Button>
        );
      },
    },
    {
      id: "label",
      header: DIMENSION_LABELS[dimension],
      kind: "text",
      className: "font-medium",
      accessor: (item) => item.label,
    },
    {
      id: "trips",
      header: financeCopy.profitability.aggregateTable.trips,
      kind: "number",
      accessor: (item) => item.tripCount,
    },
    {
      id: "revenue",
      header: financeCopy.profitability.aggregateTable.revenue,
      kind: "money",
      accessor: (item) => item.totalRevenue,
    },
    {
      id: "cost",
      header: costLabel,
      kind: "money",
      accessor: (item) => aggregateDisplayCost(item, operational),
    },
    {
      id: "margin",
      header: marginLabel,
      kind: "money",
      accessor: (item) => aggregateDisplayMargin(item, operational),
    },
    {
      id: "marginPct",
      header: financeCopy.profitability.aggregateTable.marginPct,
      kind: "meta",
      headerClassName: "text-right",
      className: "text-right",
      accessor: (item) => {
        const pct = aggregateDisplayMarginPct(item, operational);
        return pct == null ? null : `${pct.toFixed(2)}%`;
      },
    },
  ];
}

export function ProfitabilityMasterDetailTable({
  scope,
  dimension,
  onDimensionChange,
  from,
  to,
  lossOnly = false,
  aggregate,
  aggregateLoading,
  emptyState,
  expandedKey,
  onExpandedKeyChange,
  queriesEnabled = true,
}: ProfitabilityMasterDetailTableProps) {
  const expandContext = useMemo(
    () => ({ scope, from, to, lossOnly }),
    [from, lossOnly, scope, to],
  );
  const expandedFilters = useMemo(() => {
    if (!expandedKey) return null;
    return buildProfitabilityTripsFiltersForExpand(
      dimension,
      expandedKey,
      expandContext,
    );
  }, [dimension, expandContext, expandedKey]);

  const items = aggregate ?? [];
  const showEmpty = !aggregateLoading && items.length === 0;
  const operational = aggregateUsesOperationalBasis(items);

  const toggleRow = (key: string) => {
    onExpandedKeyChange(expandedKey === key ? null : key);
  };

  const canExpand = (key: string) =>
    Boolean(
      buildProfitabilityTripsFiltersForExpand(dimension, key, expandContext),
    );

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 space-y-0 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1.5">
          <CardTitle>{financeCopy.profitability.aggregateTable.title}</CardTitle>
          <CardDescription>
            {financeCopy.profitability.aggregateTable.description}
          </CardDescription>
          {lossOnly ? (
            <p
              role="status"
              className="flex items-center gap-1.5 text-xs font-medium text-destructive"
            >
              <Filter className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {financeCopy.profitability.aggregateTable.lossFilterNote}
            </p>
          ) : null}
        </div>
        <Select
          value={dimension}
          onValueChange={(value) =>
            onDimensionChange(value as MarginAnalysisDimension)
          }
        >
          <SelectTrigger
            className="w-[180px]"
            aria-label={financeCopy.profitability.filters.dimensionPlaceholder}
          >
            <SelectValue
              placeholder={financeCopy.profitability.filters.dimensionPlaceholder}
            />
          </SelectTrigger>
          <SelectContent>
            {MARGIN_ANALYSIS_DIMENSIONS.map((value) => (
              <SelectItem key={value} value={value}>
                {DIMENSION_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {aggregateLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-12 w-full" />
            ))}
          </div>
        ) : showEmpty ? (
          emptyState
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <EntityListTable
              framed={false}
              density="compact"
              columns={buildMasterColumns(
                dimension,
                operational,
                expandedKey,
                canExpand,
                toggleRow,
              )}
              rows={items}
              getRowId={(item) => item.key}
              getRowClassName={(item) =>
                [
                  canExpand(item.key) ? "cursor-pointer hover:bg-muted/50" : "",
                  expandedKey === item.key ? "bg-muted/30" : "",
                ]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
              onRowActivate={(item) => {
                if (canExpand(item.key)) toggleRow(item.key);
              }}
              renderAfterRow={(item) => {
                if (expandedKey !== item.key || !expandedFilters) return null;
                return (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={MASTER_COL_COUNT} className="p-0">
                      <ProfitabilityTripDetailPanel
                        dimension={dimension}
                        groupKey={item.key}
                        filters={expandedFilters}
                        scope={scope}
                        lossOnly={lossOnly}
                        queriesEnabled={queriesEnabled}
                      />
                    </TableCell>
                  </TableRow>
                );
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
