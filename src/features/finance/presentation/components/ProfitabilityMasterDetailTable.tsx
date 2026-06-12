import { Fragment, useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, TrendingUp } from "lucide-react";
import { Badge } from "@shared/ui/badge";
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
import { EmptyState } from "@shared/ui/feedback-states";
import { cn } from "@shared/lib/utils/cn";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { useProfitabilityTrips } from "@features/finance/application";
import type {
  FinancialBucket,
  ProfitabilityAggregateItem,
  ProfitabilityDimension,
  ProfitabilityScope,
  ProfitabilityStatus,
  ProfitabilityTripItem,
  ProfitabilityTripsFilters,
} from "@features/finance/domain";
import { financeCopy } from "../copy";
import { getProfitabilityStatusConfig } from "../config/profitabilityStatusConfig";
import {
  buildProfitabilityTripsFiltersForExpand,
  filterTripsForExpandedGroup,
} from "../utils/profitabilityExpandTripsFilters";

const DIMENSION_LABELS: Record<ProfitabilityDimension, string> = {
  client: financeCopy.profitability.filters.dimensions.client,
  vehicle: financeCopy.profitability.filters.dimensions.vehicle,
  driver: financeCopy.profitability.filters.dimensions.driver,
  route: financeCopy.profitability.filters.dimensions.route,
  month: financeCopy.profitability.filters.dimensions.month,
};

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
  dimension: ProfitabilityDimension;
  onDimensionChange: (value: ProfitabilityDimension) => void;
  status: string;
  onStatusChange: (value: string) => void;
  aggregate: ProfitabilityAggregateItem[] | undefined;
  aggregateLoading: boolean;
  profitabilityStatus: ProfitabilityStatus[] | undefined;
  expandedKey: string | null;
  onExpandedKeyChange: (key: string | null) => void;
  queriesEnabled: boolean;
}

function ProfitabilityTripDetailPanel({
  dimension,
  groupKey,
  filters,
  scope,
  queriesEnabled,
}: {
  dimension: ProfitabilityDimension;
  groupKey: string;
  filters: ProfitabilityTripsFilters;
  scope: ProfitabilityScope;
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
        {financeCopy.profitability.masterDetail.detailEmpty}
      </p>
    );
  }

  const showPipelineColumn = scope === "pipeline";
  const showMarginColumns = scope !== "pipeline" && scope !== "cancelled";

  return (
    <div className="border-t bg-muted/20 px-2 py-2 md:px-4">
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
            <TableHead className="h-8 text-right text-xs">
              {financeCopy.profitability.table.actualTotal}
            </TableHead>
            {showPipelineColumn ? (
              <TableHead className="h-8 text-right text-xs">
                {financeCopy.profitability.table.projected}
              </TableHead>
            ) : null}
            {showMarginColumns ? (
              <>
                <TableHead className="h-8 text-right text-xs">
                  {financeCopy.profitability.table.margin}
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
          {rows.map((row, index) => (
            <TableRow
              key={row.tripId || `${row.tripCode}-${index}`}
              className="hover:bg-muted/40"
            >
              <TableCell className="py-2 text-sm">
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
                {formatMxCurrency(row.actualTotal)}
              </TableCell>
              {showPipelineColumn ? (
                <TableCell className="py-2 text-right text-sm">
                  {formatMxCurrency(row.projectedRevenue ?? 0)}
                </TableCell>
              ) : null}
              {showMarginColumns ? (
                <>
                  <TableCell className="py-2 text-right text-sm">
                    {row.grossMargin == null
                      ? "—"
                      : formatMxCurrency(row.grossMargin)}
                  </TableCell>
                  <TableCell className="py-2 text-right text-sm">
                    {row.grossMarginPct == null
                      ? "—"
                      : `${row.grossMarginPct.toFixed(2)}%`}
                  </TableCell>
                  <TableCell className="py-2 text-right">
                    {row.profitabilityStatus == null ? (
                      "—"
                    ) : (
                      <Badge
                        variant={
                          getProfitabilityStatusConfig(row.profitabilityStatus)
                            .badge.variant
                        }
                        tone={
                          getProfitabilityStatusConfig(row.profitabilityStatus)
                            .badge.tone
                        }
                      >
                        {getProfitabilityStatusConfig(row.profitabilityStatus)
                          .label ?? row.profitabilityStatus}
                      </Badge>
                    )}
                  </TableCell>
                </>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ProfitabilityMasterDetailTable({
  scope,
  dimension,
  onDimensionChange,
  status,
  onStatusChange,
  aggregate,
  aggregateLoading,
  profitabilityStatus,
  expandedKey,
  onExpandedKeyChange,
  queriesEnabled,
}: ProfitabilityMasterDetailTableProps) {
  const expandedFilters = useMemo(() => {
    if (!expandedKey) return null;
    return buildProfitabilityTripsFiltersForExpand(
      dimension,
      expandedKey,
      profitabilityStatus,
      scope,
    );
  }, [dimension, expandedKey, profitabilityStatus, scope]);

  const items = aggregate ?? [];
  const showEmpty = !aggregateLoading && items.length === 0;

  const toggleRow = (key: string) => {
    onExpandedKeyChange(expandedKey === key ? null : key);
  };

  const filterControls = (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Select
        value={status}
        onValueChange={onStatusChange}
      >
        <SelectTrigger
          className="w-[180px]"
          aria-label={financeCopy.profitability.filters.statusPlaceholder}
        >
          <SelectValue placeholder={financeCopy.profitability.filters.statusPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{financeCopy.profitability.filters.allStatuses}</SelectItem>
          {(
            Object.keys(financeCopy.profitability.statuses) as ProfitabilityStatus[]
          ).map((key) => (
            <SelectItem key={key} value={key}>
              {financeCopy.profitability.statuses[key]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={dimension}
        onValueChange={(value) => onDimensionChange(value as ProfitabilityDimension)}
      >
        <SelectTrigger
          className="w-[180px]"
          aria-label={financeCopy.profitability.filters.dimensionPlaceholder}
        >
          <SelectValue placeholder={financeCopy.profitability.filters.dimensionPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(DIMENSION_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 space-y-0 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1.5">
          <CardTitle>{financeCopy.profitability.aggregateTable.title}</CardTitle>
          <CardDescription>
            {financeCopy.profitability.aggregateTable.description}
          </CardDescription>
        </div>
        {filterControls}
      </CardHeader>
      <CardContent>
        {aggregateLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-12 w-full" />
            ))}
          </div>
        ) : showEmpty ? (
          <EmptyState
            icon={<TrendingUp className="h-10 w-10 text-muted-foreground" />}
            title={financeCopy.profitability.empty.title}
            description={financeCopy.profitability.empty.description}
          />
        ) : (
          <div className="overflow-hidden rounded-md border">
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
            <TableHead className="text-right">
              {financeCopy.profitability.aggregateTable.actualTotal}
            </TableHead>
            <TableHead className="text-right">
              {financeCopy.profitability.aggregateTable.margin}
            </TableHead>
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
                    profitabilityStatus,
                    scope,
                  ),
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
                      aria-expanded={canExpand ? isExpanded : undefined}
                    >
                      <TableCell className="w-10 py-2">
                        {canExpand ? (
                          isExpanded ? (
                            <ChevronDown
                              className="h-4 w-4 text-muted-foreground"
                              aria-hidden
                            />
                          ) : (
                            <ChevronRight
                              className="h-4 w-4 text-muted-foreground"
                              aria-hidden
                            />
                          )
                        ) : null}
                      </TableCell>
                      <TableCell className="font-medium">{item.label}</TableCell>
                      <TableCell className="text-right">{item.tripCount}</TableCell>
                      <TableCell className="text-right">
                        {formatMxCurrency(item.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMxCurrency(item.totalActual)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMxCurrency(item.blendedMargin)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.blendedMarginPct == null
                          ? "—"
                          : `${item.blendedMarginPct.toFixed(2)}%`}
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
