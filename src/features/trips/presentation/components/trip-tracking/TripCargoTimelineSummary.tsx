import { Package } from "lucide-react";

import {
  CARGO_STATUS_LABELS,
  type TripCargo,
} from "@features/trips/domain";
import { Badge } from "@shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { formatDateTime } from "@shared/utils/dateUtils";

import { tripDetailCopy } from "../../copy";
import { getCargoStatusVariant } from "../trip-cargos/tripCargoDetailHelpers";

const copy = tripDetailCopy.cargo;

type TripCargoTimelineSummaryProps = {
  cargos: readonly TripCargo[];
};

export function TripCargoTimelineSummary({
  cargos,
}: TripCargoTimelineSummaryProps) {
  if (cargos.length === 0) return null;

  const withMilestones = cargos.filter(
    (cargo) => cargo.pickedUpAt != null || cargo.deliveredAt != null,
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          {copy.section.cargoTimeline}
        </CardTitle>
        <CardDescription>{copy.hint.byStatus}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {cargos.map((cargo) => (
          <div
            key={cargo.id}
            className="flex flex-col gap-1 rounded-md border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{cargo.description}</p>
              {(cargo.pickedUpAt || cargo.deliveredAt) && (
                <p className="text-xs text-muted-foreground">
                  {cargo.pickedUpAt
                    ? `${copy.label.pickedUpAt}: ${formatDateTime(cargo.pickedUpAt.toISOString())}`
                    : null}
                  {cargo.pickedUpAt && cargo.deliveredAt ? " · " : null}
                  {cargo.deliveredAt
                    ? `${copy.label.deliveredAt}: ${formatDateTime(cargo.deliveredAt.toISOString())}`
                    : null}
                </p>
              )}
              {withMilestones.length === 0 && !cargo.pickedUpAt && !cargo.deliveredAt ? (
                <p className="text-xs text-muted-foreground">
                  {CARGO_STATUS_LABELS[cargo.status]}
                </p>
              ) : null}
            </div>
            <Badge
              variant={getCargoStatusVariant(cargo.status)}
              className="w-fit shrink-0 text-xs font-normal"
            >
              {CARGO_STATUS_LABELS[cargo.status] ?? cargo.status}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
