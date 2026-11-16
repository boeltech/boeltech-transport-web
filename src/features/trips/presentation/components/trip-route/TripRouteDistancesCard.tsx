import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";

import { tripDetailCopy } from "../../copy";

const copy = tripDetailCopy.route;

export type TripRouteDistanceSegment = {
  id: string;
  fromLabel: string;
  toLabel: string;
  km: number | null;
};

export type TripRouteDistancesCardProps = {
  segments: readonly TripRouteDistanceSegment[];
  totalKm: number | null;
};

function formatKm(km: number): string {
  return km.toLocaleString("es-MX", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  });
}

function segmentKmLabel(km: number | null): string {
  return km != null ? copy.format.distanceKm(formatKm(km)) : "—";
}

function segmentAccessibleName(
  fromLabel: string,
  toLabel: string,
  km: number | null,
): string {
  return `${copy.format.segmentArrow(fromLabel, toLabel)}, ${segmentKmLabel(km)}`;
}

export function TripRouteDistancesCard({
  segments,
  totalKm,
}: TripRouteDistancesCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{copy.section.distances}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {segments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {copy.state.missingDistance}
          </p>
        ) : (
          <dl className="space-y-2 text-sm">
            {segments.map((segment) => {
              const kmLabel = segmentKmLabel(segment.km);
              return (
                <div
                  key={segment.id}
                  role="group"
                  className="flex items-start justify-between gap-3"
                  aria-label={segmentAccessibleName(
                    segment.fromLabel,
                    segment.toLabel,
                    segment.km,
                  )}
                >
                  <dt className="min-w-0 flex-1 text-muted-foreground" aria-hidden="true">
                    <span className="block line-clamp-2">
                      {segment.fromLabel}
                    </span>
                    <span className="block line-clamp-2">
                      → {segment.toLabel}
                    </span>
                  </dt>
                  <dd
                    className="shrink-0 font-mono tabular-nums text-foreground"
                    aria-hidden="true"
                  >
                    {kmLabel}
                  </dd>
                </div>
              );
            })}
            <div className="flex items-baseline justify-between gap-3 border-t pt-2 font-semibold">
              <dt>{copy.label.totalPlanned}</dt>
              <dd className="font-mono tabular-nums">
                {totalKm != null
                  ? copy.format.distanceKm(formatKm(totalKm))
                  : "—"}
              </dd>
            </div>
          </dl>
        )}
        <p className="text-xs text-muted-foreground">
          {copy.hint.distancesBilling}
        </p>
      </CardContent>
    </Card>
  );
}
