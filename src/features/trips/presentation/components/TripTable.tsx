/**
 * TripTable — listado Operate workbench (`EntityListTable`, SoT §7).
 *
 * F11: 7 cols datos (Ingreso solo `finance.read`) + actions.
 * Empty → null (WorkbenchPageShell pinta empty). Sin checkboxes (T9: no hay lote).
 * `framed` default: Workbench no envuelve card de tabla.
 */

import { Clock } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListStackedValue,
} from "@shared/ui/table";
import { usePermissions } from "@shared/permissions";
import { cn } from "@shared/lib/utils/cn";
import type { TripListItem } from "../../domain";
import { TripStatusBadge } from "../config/tripStatusConfig";
import { tripsListCopy } from "../copy/listCopy";
import {
  formatTripListArrivalLine,
  formatTripListClientSecondary,
  formatTripListDeparture,
  getTripListInvoicingAppearance,
  isTripListFleetEmpty,
  resolveTripListStatusSecondary,
  tripListIncomeValue,
} from "../helpers/tripListDisplay";
import { getTripOverdueState } from "../utils/tripOverdue";
import { TripActions } from "./TripActions";
import { TripListRouteLabel } from "./TripListRouteLabel";

const copy = tripsListCopy.columns;

export interface TripTableProps {
  trips: TripListItem[];
  isLoading: boolean;
  /** Href del detalle (link primario + fila). */
  primaryTo: (trip: TripListItem) => string;
  /** Cola del listado (`location.state.from`). */
  primaryState?: (trip: TripListItem) => unknown;
  onView: (id: string) => void;
  onDelete?: (id: string) => void;
  onSchedule?: (id: string) => void;
  onCancel?: (id: string) => void;
  /** Portal cliente: oculta cliente bajo el código (siempre es el mismo). */
  hideClientColumn?: boolean;
  /** Portal cliente: oculta badge operativo «Atención fiscal». */
  hideFiscalAttentionBadge?: boolean;
}

function TripListInvoicingCell({
  trip,
  hideFiscalAttentionBadge,
}: {
  trip: TripListItem;
  hideFiscalAttentionBadge: boolean;
}) {
  const appearance = getTripListInvoicingAppearance(trip, {
    hideFiscalAttentionBadge,
  });

  if (appearance.mode === "empty") {
    return (
      <span className="text-muted-foreground">{copy.emptyCell}</span>
    );
  }

  if (appearance.mode === "quiet") {
    return (
      <div className="min-w-0">
        <span className="text-sm text-muted-foreground">{appearance.label}</span>
        {appearance.secondary ? (
          <div className="truncate font-mono text-xs text-muted-foreground">
            {appearance.secondary}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <Badge variant={appearance.variant} tone={appearance.tone ?? "soft"}>
        {appearance.label}
      </Badge>
      {appearance.secondary ? (
        <div className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
          {appearance.secondary}
        </div>
      ) : null}
    </div>
  );
}

function buildColumns(
  props: Pick<
    TripTableProps,
    | "onView"
    | "onDelete"
    | "onSchedule"
    | "onCancel"
    | "hideClientColumn"
    | "hideFiscalAttentionBadge"
  > & { showIncome: boolean },
): EntityListColumnDef<TripListItem>[] {
  const {
    onView,
    onDelete,
    onSchedule,
    onCancel,
    hideClientColumn = false,
    hideFiscalAttentionBadge = false,
    showIncome,
  } = props;

  const columns: EntityListColumnDef<TripListItem>[] = [
    {
      id: "code",
      header: copy.code,
      kind: "primary",
      accessor: (trip): EntityListStackedValue => ({
        primary: (
          <span className="font-mono whitespace-nowrap">{trip.tripCode}</span>
        ),
        secondary: hideClientColumn
          ? undefined
          : formatTripListClientSecondary(trip),
      }),
    },
    {
      id: "route",
      header: copy.route,
      kind: "text",
      accessor: (trip) => (
        <TripListRouteLabel
          trip={{
            originCity: trip.originCity,
            originState: trip.originState,
            destinationCity: trip.destinationCity,
            destinationState: trip.destinationState,
            routeType: trip.routeType,
            cargoCount: trip.cargoCount,
          }}
          className="leading-snug"
        />
      ),
    },
    {
      id: "fleet",
      header: copy.fleet,
      kind: "stacked",
      accessor: (trip): EntityListStackedValue | null => {
        if (isTripListFleetEmpty(trip)) return null;
        return {
          primary: trip.vehicle?.unitNumber?.trim() || copy.emptyCell,
          secondary: trip.driver?.fullName?.trim() || undefined,
        };
      },
    },
    {
      id: "departure",
      header: copy.departure,
      kind: "stacked",
      stackedWeight: "normal",
      accessor: (trip): EntityListStackedValue => {
        const overdue = getTripOverdueState(trip);
        const arrival = formatTripListArrivalLine(
          trip.scheduledDeparture,
          trip.scheduledArrival,
        );
        return {
          primary: formatTripListDeparture(trip.scheduledDeparture),
          secondary: (
            <span
              className={cn(overdue.isOverdue && "text-destructive")}
            >
              {arrival}
            </span>
          ),
        };
      },
    },
    {
      id: "status",
      header: copy.status,
      kind: "status",
      accessor: (trip) => {
        const secondary = resolveTripListStatusSecondary(trip);
        return (
          <div className="min-w-0">
            <TripStatusBadge status={trip.status} size="sm" showIcon={false} />
            {secondary ? (
              <div
                className={cn(
                  "mt-0.5 flex items-center gap-1 truncate text-xs",
                  secondary.tone === "late"
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              >
                {secondary.tone === "late" ? (
                  <Clock className="h-3 w-3 shrink-0" aria-hidden />
                ) : null}
                <span className="truncate">{secondary.text}</span>
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "invoice",
      header: copy.invoice,
      kind: "status",
      accessor: (trip) => (
        <TripListInvoicingCell
          trip={trip}
          hideFiscalAttentionBadge={hideFiscalAttentionBadge}
        />
      ),
    },
  ];

  if (showIncome) {
    columns.push({
      id: "income",
      header: copy.income,
      kind: "money",
      accessor: (trip) => tripListIncomeValue(trip.baseRate),
    });
  }

  columns.push({
    id: "actions",
    header: "",
    kind: "actions",
    accessor: (trip) => (
      <TripActions
        trip={trip}
        onView={onView}
        onDelete={onDelete}
        onSchedule={onSchedule}
        onCancel={onCancel}
      />
    ),
  });

  return columns;
}

export function TripTable({
  trips,
  isLoading,
  primaryTo,
  primaryState,
  onView,
  onDelete,
  onSchedule,
  onCancel,
  hideClientColumn = false,
  hideFiscalAttentionBadge = false,
}: TripTableProps) {
  const { hasPermission } = usePermissions();
  const showIncome = hasPermission("finance", "read");

  const columns = buildColumns({
    onView,
    onDelete,
    onSchedule,
    onCancel,
    hideClientColumn,
    hideFiscalAttentionBadge,
    showIncome,
  });

  return (
    <EntityListTable
      density="list"
      columns={columns}
      rows={trips}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      primaryTo={primaryTo}
      primaryState={primaryState}
    />
  );
}
