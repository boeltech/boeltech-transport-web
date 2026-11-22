/**
 * Zona «Cobrado esta semana» — contador · EntityListTable compacta · día → Cobros.
 */

import { useMemo } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

import {
  buildFinanceCobrosDayPath,
  useCollectionsWeek,
  type CollectionsWeekDay,
} from "@features/finance";
import { Button } from "@shared/ui/button";
import { DetailAlertCard } from "@shared/ui/data-display";
import {
  EntityListTable,
  type EntityListColumnDef,
} from "@shared/ui/table";
import { dashboardCopy } from "../copy/dashboardCopy";

function formatDayLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return date;
  const utc = new Date(Date.UTC(y, m - 1, d, 12));
  const weekday = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    timeZone: "UTC",
  }).format(utc);
  const dayNum = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    timeZone: "UTC",
  }).format(utc);
  const label = `${weekday} ${dayNum}`;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatMxn(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(amount);
}

export interface DashboardCollectionsWeekZoneProps {
  /** `location.state` al salir a Cobros (H-U01-N01). */
  navState?: unknown;
}

export function DashboardCollectionsWeekZone({
  navState,
}: DashboardCollectionsWeekZoneProps = {}) {
  const { data, isLoading, isError, refetch, isFetching } = useCollectionsWeek();
  const copy = dashboardCopy.collectionsWeek;

  const rows = useMemo(
    () => (data?.days ?? []).filter((day) => day.total > 0),
    [data?.days],
  );

  const weekTotal = useMemo(
    () => rows.reduce((sum, day) => sum + day.total, 0),
    [rows],
  );

  const columns = useMemo<EntityListColumnDef<CollectionsWeekDay>[]>(
    () => [
      {
        id: "day",
        header: copy.columns.day,
        kind: "primary",
        accessor: (row) => formatDayLabel(row.date),
      },
      {
        id: "with_invoice",
        header: copy.columns.withInvoice,
        kind: "money",
        accessor: (row) => row.withInvoice,
      },
      {
        id: "without_invoice",
        header: copy.columns.withoutInvoice,
        kind: "money",
        accessor: (row) => row.withoutInvoice,
      },
      {
        id: "total",
        header: copy.columns.total,
        kind: "money",
        accessor: (row) => row.total,
      },
    ],
    [copy.columns],
  );

  return (
    <section className="flex min-w-0 flex-col gap-2" aria-labelledby="collections-week-title">
      <div className="flex flex-wrap items-baseline gap-2.5">
        <h2
          id="collections-week-title"
          className="text-base font-semibold leading-6 text-foreground"
        >
          {copy.title}
        </h2>
        <p className="text-[13px] text-muted-foreground">{copy.subtitle}</p>
      </div>

      {isError ? (
        <DetailAlertCard
          severity="critical"
          icon={<AlertCircle className="h-4 w-4" />}
          title={copy.errorTitle}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void refetch();
              }}
              disabled={isFetching}
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              {copy.retry}
            </Button>
          }
        />
      ) : !isLoading && rows.length === 0 ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card px-5 py-7 text-center shadow-sm">
          <p className="text-[15px] font-semibold text-foreground">
            {copy.empty}
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">{copy.footer}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <EntityListTable
            framed={false}
            density="compact"
            aria-label={copy.tableAriaLabel}
            columns={columns}
            rows={rows}
            getRowId={(row) => row.date}
            isLoading={isLoading}
            primaryTo={(row) => buildFinanceCobrosDayPath(row.date)}
            primaryState={navState ? () => navState : undefined}
            footer={
              !isLoading ? (
                <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-muted-foreground">
                  <span>{copy.weekTotal(formatMxn(weekTotal))}</span>
                  <span>{copy.footer}</span>
                </div>
              ) : null
            }
          />
        </div>
      )}
    </section>
  );
}
