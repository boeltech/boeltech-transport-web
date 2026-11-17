/**
 * Zona «Viajes de hoy» — franja de conteos + EntityListTable compacta ≤6.
 */

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, RefreshCw } from "lucide-react";

import { ROLES } from "@shared/constants/roles";
import { useTripOpsDaySummary } from "@features/trips/application";
import type { TripOpsDayItem } from "@features/trips/domain";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { DetailAlertCard } from "@shared/ui/data-display";
import { FilterCountStrip } from "@shared/ui/filter-count-strip";
import {
  EntityListTable,
  type EntityListColumnDef,
} from "@shared/ui/table";
import { formatTime, getTodayString } from "@shared/utils/dateUtils";
import {
  buildOpsDayAllHref,
  buildOpsDayBucketHref,
  opsDayApproximateTotal,
  opsDayBucketBadgeVariant,
  opsDayBucketLabel,
  resolveOpsDayHour,
  resolveOpsDayRowBucket,
} from "../../domain/opsDayDisplay";
import { dashboardCopy } from "../copy/dashboardCopy";

export interface DashboardOpsDayZoneProps {
  role: string | undefined;
}

function subtitleForRole(role: string | undefined): string {
  const copy = dashboardCopy.opsDay.subtitle;
  if (role === ROLES.DISPATCHER || role === ROLES.OPERATOR) {
    return copy.dispatcher;
  }
  if (role === ROLES.ADMIN || role === ROLES.MANAGER) {
    return copy.manager;
  }
  return copy.default;
}

export function DashboardOpsDayZone({ role }: DashboardOpsDayZoneProps) {
  const today = getTodayString();
  const { data, isLoading, isError, refetch, isFetching } =
    useTripOpsDaySummary();

  const counts = data?.counts;
  const items = data?.items ?? [];
  const nextTrip = data?.nextTrip;
  const total = counts ? opsDayApproximateTotal(counts) : 0;
  const copy = dashboardCopy.opsDay;

  const stripItems = useMemo(() => {
    const c = counts ?? {
      departing: 0,
      inProgress: 0,
      overdue: 0,
      arrived: 0,
    };
    return [
      {
        id: "departing",
        label: copy.strip.departing,
        count: c.departing,
        href: buildOpsDayBucketHref("departing", today),
      },
      {
        id: "in_progress",
        label: copy.strip.inProgress,
        count: c.inProgress,
        href: buildOpsDayBucketHref("in_progress", today),
      },
      {
        id: "overdue",
        label: copy.strip.overdue,
        count: c.overdue,
        href: buildOpsDayBucketHref("overdue", today),
        warn: c.overdue > 0,
      },
      {
        id: "arrived",
        label: copy.strip.arrived,
        count: c.arrived,
        href: buildOpsDayBucketHref("arrived", today),
      },
    ];
  }, [counts, copy.strip, today]);

  const columns = useMemo<EntityListColumnDef<TripOpsDayItem>[]>(
    () => [
      {
        id: "trip",
        header: copy.columns.trip,
        kind: "primary",
        accessor: (row) => row.tripCode,
      },
      {
        id: "route",
        header: copy.columns.route,
        kind: "stacked",
        accessor: (row) => ({
          primary: `${row.originCity || "—"} → ${row.destinationCity || "—"}`,
        }),
      },
      {
        id: "crew",
        header: copy.columns.crew,
        kind: "stacked",
        accessor: (row) => ({
          primary: row.driverFullName?.trim() || copy.noDriver,
          secondary: row.vehicleUnitNumber ?? undefined,
        }),
      },
      {
        id: "status",
        header: copy.columns.status,
        kind: "status",
        accessor: (row) => {
          const bucket = resolveOpsDayRowBucket(row);
          return (
            <Badge
              variant={opsDayBucketBadgeVariant(bucket)}
              tone="soft"
            >
              {opsDayBucketLabel(bucket)}
            </Badge>
          );
        },
      },
      {
        id: "hour",
        header: copy.columns.hour,
        kind: "stacked",
        accessor: (row) => {
          const bucket = resolveOpsDayRowBucket(row);
          const { iso, hint } = resolveOpsDayHour(row, bucket);
          const late = bucket === "overdue";
          return {
            primary: (
              <span
                className={
                  late
                    ? "font-mono tabular-nums text-destructive"
                    : "font-mono tabular-nums"
                }
              >
                {formatTime(iso)}
              </span>
            ),
            secondary: hint ?? undefined,
          };
        },
      },
    ],
    [copy.columns, copy.noDriver],
  );

  const isEmpty =
    !isLoading &&
    !isError &&
    total === 0 &&
    (counts?.overdue ?? 0) === 0 &&
    items.length === 0;

  return (
    <section
      className="flex min-w-0 flex-col gap-2"
      aria-labelledby="ops-day-zone-title"
    >
      <div className="flex flex-wrap items-baseline gap-2.5">
        <h2
          id="ops-day-zone-title"
          className="text-base font-semibold leading-6 text-foreground"
        >
          {copy.title}
        </h2>
        <p className="text-[13px] text-muted-foreground">
          {subtitleForRole(role)}
        </p>
        {!isEmpty && total > 0 ? (
          <Link
            to={buildOpsDayAllHref(today)}
            className="ml-auto text-[13px] font-medium text-primary no-underline hover:underline"
          >
            {copy.viewAll(total)}
          </Link>
        ) : null}
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
      ) : isEmpty ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card px-5 py-7 text-center shadow-sm">
          <p className="text-[15px] font-semibold text-foreground">
            {copy.empty}
          </p>
          {nextTrip ? (
            <p className="mt-1 text-[13px] text-muted-foreground">
              {copy.nextTrip(
                nextTrip.tripCode,
                formatTime(nextTrip.scheduledDeparture),
              )}{" "}
              <Link
                to={`/trips/${nextTrip.id}`}
                className="font-medium text-primary no-underline hover:underline"
              >
                {copy.nextTripCta}
              </Link>
            </p>
          ) : null}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <FilterCountStrip
            items={stripItems}
            aria-label={copy.strip.ariaLabel}
          />
          <EntityListTable
            framed={false}
            density="compact"
            aria-label={copy.tableAriaLabel}
            columns={columns}
            rows={[...items]}
            getRowId={(row) => row.id}
            isLoading={isLoading}
            primaryTo={(row) => `/trips/${row.id}`}
            footer={
              !isLoading && items.length > 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-muted-foreground">
                  <span>{copy.footer(items.length, Math.max(total, items.length))}</span>
                  <span className="hidden sm:inline">{copy.footerHint}</span>
                </div>
              ) : null
            }
          />
        </div>
      )}
    </section>
  );
}
