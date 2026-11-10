import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { SettlementItem } from "../../domain/entities";
import { TRIP_ROUTE_TYPE_LABELS, type TripRouteType } from "../../domain/enums";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.detailPage.tripsSection;

interface SettlementTripsRuleTableProps {
  items: readonly SettlementItem[];
  tripLinkFrom?: string;
}

/** Tabla de viajes con columna Regla aplicada (CA F4.8). */
export function SettlementTripsRuleTable({
  items,
  tripLinkFrom,
}: SettlementTripsRuleTableProps) {
  const trips = items.filter((i) => i.itemType === "trip_commission");
  if (trips.length === 0) return null;

  return (
    <div className="rounded-2xl border bg-card" data-testid="settlement-trips-rule-table">
      <div className="px-5 pt-4 pb-1">
        <h2 className="text-base font-semibold leading-6">
          {copy.title(trips.length)}
        </h2>
        <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
      </div>
      <div className="overflow-x-auto px-2 pb-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{copy.colTrip}</TableHead>
              <TableHead>{copy.colRoute}</TableHead>
              <TableHead>{copy.colClass}</TableHead>
              <TableHead className="text-right">{copy.colKm}</TableHead>
              <TableHead>{copy.colRule}</TableHead>
              <TableHead className="text-right">{copy.colPay}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips.map((item) => {
              const details = item.calculationDetails;
              const routeType = details?.routeType as TripRouteType | undefined;
              const routeLabel = routeType
                ? (TRIP_ROUTE_TYPE_LABELS[routeType] ?? routeType)
                : "—";
              let routeDesc = item.description;
              const parenMatch = item.description.match(
                /\(([^·)]+)(?:·\s*([^)]+))?\)/,
              );
              if (parenMatch?.[1]) routeDesc = parenMatch[1].trim();

              return (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">
                    {item.tripId ? (
                      <Link
                        to={`/trips/${item.tripId}`}
                        state={
                          tripLinkFrom ? { from: tripLinkFrom } : undefined
                        }
                        className="text-primary hover:underline"
                      >
                        {item.tripCode ?? "—"}
                      </Link>
                    ) : (
                      (item.tripCode ?? "—")
                    )}
                  </TableCell>
                  <TableCell className="font-medium max-w-[220px] truncate">
                    {routeDesc}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {routeLabel}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-muted-foreground tabular-nums">
                    {details?.distanceKm != null
                      ? Number(details.distanceKm).toLocaleString("es-MX")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs max-w-[200px]">
                    {details?.appliedRule || copy.ruleFallback}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums font-medium">
                    {formatMxCurrency(item.amount)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
