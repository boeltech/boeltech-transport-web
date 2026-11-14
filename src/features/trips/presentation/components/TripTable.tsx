/**
 * TripTable — listado Operate workbench (`EntityListTable`, SoT §7).
 *
 * ≤7 cols datos + actions. T4: Unidad apila conductor (antes 8 cols con Cliente).
 * Empty → null (WorkbenchPageShell pinta empty). Sin checkboxes (T9: no hay lote).
 * `framed` default: Workbench no envuelve card de tabla.
 */

import { Badge } from "@shared/ui/badge";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListStackedValue,
} from "@shared/ui/table";
import { formatDate, formatTime } from "@shared/utils/dateUtils";
import type { TripListItem } from "../../domain";
import { TripStatusBadge } from "../config/tripStatusConfig";
import { tripsListCopy } from "../copy/listCopy";
import { getTripInvoicingBadgeConfig } from "../uiHelpers";
import { TripActions } from "./TripActions";
import { TripListRouteLabel } from "./TripListRouteLabel";
import { TripOverdueBadge } from "./TripOverdueBadge";

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
  /** Portal cliente: oculta columna Cliente (siempre es el mismo). */
  hideClientColumn?: boolean;
  /** Portal cliente: oculta badge operativo «Atención fiscal». */
  hideFiscalAttentionBadge?: boolean;
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
  >,
): EntityListColumnDef<TripListItem>[] {
  const {
    onView,
    onDelete,
    onSchedule,
    onCancel,
    hideClientColumn = false,
    hideFiscalAttentionBadge = false,
  } = props;

  const columns: EntityListColumnDef<TripListItem>[] = [
    {
      id: "code",
      header: copy.code,
      kind: "primary",
      accessor: (trip) => trip.tripCode,
    },
  ];

  if (!hideClientColumn) {
    columns.push({
      id: "client",
      header: copy.client,
      kind: "meta",
      accessor: (trip) => trip.client?.legalName ?? copy.noClient,
    });
  }

  columns.push(
    {
      id: "route",
      header: copy.route,
      kind: "text",
      accessor: (trip) => (
        <TripListRouteLabel trip={trip} className="leading-snug" />
      ),
    },
    {
      id: "fleet",
      header: copy.fleet,
      kind: "stacked",
      accessor: (trip): EntityListStackedValue => ({
        primary: trip.vehicle?.unitNumber,
        secondary:
          trip.driver?.fullName ??
          trip.vehicle?.licensePlate ??
          undefined,
      }),
    },
    {
      id: "departure",
      header: copy.departure,
      kind: "stacked",
      accessor: (trip): EntityListStackedValue => {
        const iso = trip.scheduledDeparture.toISOString();
        return {
          primary: formatDate(iso),
          secondary: formatTime(iso),
        };
      },
    },
    {
      id: "status",
      header: copy.status,
      kind: "status",
      accessor: (trip) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <TripStatusBadge status={trip.status} size="sm" showIcon />
          <TripOverdueBadge trip={trip} />
        </div>
      ),
    },
    {
      id: "invoice",
      header: copy.invoice,
      kind: "status",
      accessor: (trip) => {
        const invoicingConfig = getTripInvoicingBadgeConfig(trip);
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            {!hideFiscalAttentionBadge && trip.requiresFiscalAttention ? (
              <Badge variant="destructive" tone="soft">
                {tripsListCopy.badge.fiscalAttention}
              </Badge>
            ) : null}
            <Badge variant={invoicingConfig.variant}>
              {invoicingConfig.label}
            </Badge>
          </div>
        );
      },
    },
    {
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
    },
  );

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
  const columns = buildColumns({
    onView,
    onDelete,
    onSchedule,
    onCancel,
    hideClientColumn,
    hideFiscalAttentionBadge,
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
