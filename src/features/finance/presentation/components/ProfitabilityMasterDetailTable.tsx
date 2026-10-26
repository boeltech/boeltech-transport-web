import { Fragment, useMemo, type ReactNode } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { cn } from "@shared/lib/utils/cn";
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

  const showPipelineColumn = scope === "pipeline";
  const showMarginColumns = scope !== "pipeline" && scope !== "cancelled";
  const operational = tripsUseOperationalBasis(data);
  const costLabel = operational
    ? financeCopy.profitability.table.operationalCost
    : financeCopy.profitability.table.actualTotal;
  const marginLabel = operational
    ? financeCopy.profitability.table.operationalMargin
    : financeCopy.profitability.table.margin;

  return (
    <div className="overflow-x-auto border-t bg-muted/20 px-2 py-2 md:px-4">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-8 text-xs">
              {financeCopy.profitability.table.trip}
            </TableHead>
            {dimension !== "client" ? (
              <TableHead className="h-8 text-xs">
                {financeCopy.profitability.table.client}
              </TableHead>
            ) : null}
            <TableHead className="h-8 text-xs">
              {financeCopy.profitability.table.bucket}
            </TableHead>
            <TableHead className="h-8 text-right text-xs">
              {financeCopy.profitability.table.revenue}
            </TableHead>
            <TableHead className="h-8 text-right text-xs">{costLabel}</TableHead>
            {showPipelineColumn ? (
              <TableHead className="h-8 text-right text-xs">
                {financeCopy.profitability.table.projected}
              </TableHead>
            ) : null}
            {showMarginColumns ? (
              <>
                <TableHead className="h-8 text-right text-xs">
                  {marginLabel}
                </TableHead>
                <TableHead className="h-8 text-right text-xs">
                  {financeCopy.profitability.table.marginPct}
                </TableHead>
                <TableHead className="h-8 text-right text-xs">
                  {financeCopy.profitability.table.status}
                </TableHead>
              </>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => {
            const displayMargin = tripDisplayMargin(row, operational);
            const displayMarginPct = tripDisplayMarginPct(row, operational);
            const displayStatus = tripDisplayStatus(row, operational);
            const missingCommission = shouldShowMissingCommissionChip(row);
            return (
              <TableRow
                key={row.tripId || `${row.tripCode}-${index}`}
                className="hover:bg-muted/40"
              >
                <TableCell className="py-2 text-sm">
                  <div className="flex flex-col items-start gap-1">
                    {row.tripId ? (
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
                    )}
                    {missingCommission ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-normal"
                        data-testid="missing-commission-chip"
                      >
                        {financeCopy.profitability.missingCommissionChip}
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                {dimension !== "client" ? (
                  <TableCell className="py-2 text-sm">
                    {row.clientName ?? financeCopy.profitability.table.noClient}
                  </TableCell>
                ) : null}
                <TableCell className="py-2 text-sm">
                  {row.financialBucket ? (
                    <Badge variant="outline" className="text-xs">
                      {FINANCIAL_BUCKET_LABELS[row.financialBucket] ??
                        row.financialBucket}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="py-2 text-right text-sm">
                  <ProfitabilityRevenueCell row={row} />
                </TableCell>
                <TableCell className="py-2 text-right text-sm">
                  {formatMxCurrency(tripDisplayCost(row, operational))}
                </TableCell>
                {showPipelineColumn ? (
                  <TableCell className="py-2 text-right text-sm">
                    {formatMxCurrency(row.projectedRevenue ?? 0)}
                  </TableCell>
                ) : null}
                {showMarginColumns ? (
                  <>
                    <TableCell className="py-2 text-right text-sm">
                      {displayMargin == null
                        ? "—"
                        : formatMxCurrency(displayMargin)}
                    </TableCell>
                    <TableCell className="py-2 text-right text-sm">
                      {displayMarginPct == null
                        ? "—"
                        : `${displayMarginPct.toFixed(2)}%`}
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      {displayStatus == null ? (
                        "—"
                      ) : (
                        <Badge
                          variant={
                            getProfitabilityStatusConfig(displayStatus).badge
                              .variant
                          }
                          tone={
                            getProfitabilityStatusConfig(displayStatus).badge.tone
                          }
                        >
                          {getProfitabilityStatusConfig(displayStatus).label ??
                            displayStatus}
                        </Badge>
                      )}
                    </TableCell>
                  </>
                ) : null}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
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
  const costLabel = operational
    ? financeCopy.profitability.aggregateTable.operationalCost
    : financeCopy.profitability.aggregateTable.actualTotal;
  const marginLabel = operational
    ? financeCopy.profitability.aggregateTable.operationalMargin
    : financeCopy.profitability.aggregateTable.margin;

  const toggleRow = (key: string) => {
    onExpandedKeyChange(expandedKey === key ? null : key);
  };

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
            <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" aria-hidden />
            <TableHead>{DIMENSION_LABELS[dimension]}</TableHead>
            <TableHead className="text-right">
              {financeCopy.profitability.aggregateTable.trips}
            </TableHead>
            <TableHead className="text-right">
              {financeCopy.profitability.aggregateTable.revenue}
            </TableHead>
            <TableHead className="text-right">{costLabel}</TableHead>
            <TableHead className="text-right">{marginLabel}</TableHead>
            <TableHead className="text-right">
              {financeCopy.profitability.aggregateTable.marginPct}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => {
                const rowKey = `${dimension}-${item.key || item.label}-${index}`;
                const isExpanded = expandedKey === item.key;
                const canExpand = Boolean(
                  buildProfitabilityTripsFiltersForExpand(
                    dimension,
                    item.key,
                    expandContext,
                  ),
                );
                const displayMarginPct = aggregateDisplayMarginPct(
                  item,
                  operational,
                );

                return (
                  <Fragment key={rowKey}>
                    <TableRow
                      className={cn(
                        canExpand && "cursor-pointer hover:bg-muted/50",
                        isExpanded && "bg-muted/30",
                      )}
                      onClick={
                        canExpand ? () => toggleRow(item.key) : undefined
                      }
                    >
                      <TableCell className="w-10 py-2">
                        {canExpand ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            aria-expanded={isExpanded}
                            aria-label={
                              isExpanded
                                ? financeCopy.profitability.masterDetail
                                    .collapseRow
                                : financeCopy.profitability.masterDetail
                                    .expandRow
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
                        ) : null}
                      </TableCell>
                      <TableCell className="font-medium">{item.label}</TableCell>
                      <TableCell className="text-right">{item.tripCount}</TableCell>
                      <TableCell className="text-right">
                        {formatMxCurrency(item.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMxCurrency(
                          aggregateDisplayCost(item, operational),
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMxCurrency(
                          aggregateDisplayMargin(item, operational),
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {displayMarginPct == null
                          ? "—"
                          : `${displayMarginPct.toFixed(2)}%`}
                      </TableCell>
                    </TableRow>
                    {isExpanded && expandedFilters ? (
                      <TableRow key={`${rowKey}-detail`} className="hover:bg-transparent">
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
                    ) : null}
                  </Fragment>
                );
              })}
        </TableBody>
      </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
