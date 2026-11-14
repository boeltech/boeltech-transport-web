/**
 * SettlementTripsRuleTable — viajes del detalle de liquidación (`EntityListTable`).
 *
 * Viaje · Ruta · Clase · Km · Regla · Pago. density compact · framed false (card host).
 * Empty → null.
 */

import { Link } from "react-router-dom";
import {
  EntityListTable,
  type EntityListColumnDef,
} from "@shared/ui/table";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { SettlementItem } from "../../domain/entities";
import { TRIP_ROUTE_TYPE_LABELS, type TripRouteType } from "../../domain/enums";
import { settlementsCopy } from "../copy/settlementsCopy";
import { formatKmTimesRateRule } from "../utils/formatAppliedRuleKm";

const copy = settlementsCopy.detailPage.tripsSection;

interface SettlementTripsRuleTableProps {
  items: readonly SettlementItem[];
  tripLinkFrom?: string;
}

function buildColumns(
  tripLinkFrom?: string,
): EntityListColumnDef<SettlementItem>[] {
  return [
    {
      id: "trip",
      header: copy.colTrip,
      kind: "code",
      accessor: (item) => {
        if (item.tripId) {
          return (
            <Link
              to={`/trips/${item.tripId}`}
              state={tripLinkFrom ? { from: tripLinkFrom } : undefined}
              className="text-primary hover:underline"
            >
              {item.tripCode ?? "—"}
            </Link>
          );
        }
        return item.tripCode ?? "—";
      },
    },
    {
      id: "route",
      header: copy.colRoute,
      kind: "text",
      accessor: (item) => {
        let routeDesc = item.description;
        const parenMatch = item.description.match(
          /\(([^·)]+)(?:·\s*([^)]+))?\)/,
        );
        if (parenMatch?.[1]) routeDesc = parenMatch[1].trim();
        return routeDesc;
      },
    },
    {
      id: "class",
      header: copy.colClass,
      kind: "meta",
      accessor: (item) => {
        const routeType = item.calculationDetails?.routeType as
          | TripRouteType
          | undefined;
        return routeType
          ? (TRIP_ROUTE_TYPE_LABELS[routeType] ?? routeType)
          : null;
      },
    },
    {
      id: "km",
      header: copy.colKm,
      kind: "number",
      accessor: (item) => {
        const km = item.calculationDetails?.distanceKm;
        return km != null ? Number(km) : null;
      },
    },
    {
      id: "rule",
      header: copy.colRule,
      kind: "code",
      accessor: (item) => {
        const details = item.calculationDetails;
        return formatKmTimesRateRule({
          distanceKm: details?.distanceKm,
          ratePerKm: details?.ratePerKm,
          appliedRule: details?.appliedRule,
          formatRate: formatMxCurrency,
          compose: copy.ruleKmTimesRate,
          fallback: copy.ruleFallback,
        });
      },
    },
    {
      id: "pay",
      header: copy.colPay,
      kind: "money",
      accessor: (item) => item.amount,
    },
  ];
}

/** Tabla de viajes con columna Regla aplicada (CA F4.8). */
export function SettlementTripsRuleTable({
  items,
  tripLinkFrom,
}: SettlementTripsRuleTableProps) {
  const trips = items.filter((i) => i.itemType === "trip_commission");
  if (trips.length === 0) return null;

  return (
    <div
      className="rounded-2xl border bg-card"
      data-testid="settlement-trips-rule-table"
    >
      <div className="px-5 pt-4 pb-1">
        <h2 className="text-base font-semibold leading-6">
          {copy.title(trips.length)}
        </h2>
        <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
      </div>
      <div className="overflow-x-auto px-2 pb-3">
        <EntityListTable
          framed={false}
          density="compact"
          columns={buildColumns(tripLinkFrom)}
          rows={[...trips]}
          getRowId={(row) => row.id}
          aria-label={copy.title(trips.length)}
        />
      </div>
    </div>
  );
}
