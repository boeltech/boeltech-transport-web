/**
 * Card «Declaración de viaje en falso» (D20 / F-11).
 * Quién + fecha + motivo desde timeline `false_trip_declared`; gastos → tab Costos.
 */

import { Link } from "react-router-dom";

import {
  useTripExpensesSummary,
  useTripTimeline,
} from "@features/trips/application";
import type { Trip } from "@features/trips/domain";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { InfoRow } from "@shared/ui/data-display";
import { Skeleton } from "@shared/ui/skeleton";
import { formatDateTime } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";

import { billingCopy } from "../../copy/tripDetail/billingCopy";
import { resolveFalseTripDeclaration } from "./resolveFalseTripDeclaration";

const copy = billingCopy.falseTrip;

export interface TripBillingFalseTripDeclarationCardProps {
  trip: Trip;
}

export function TripBillingFalseTripDeclarationCard({
  trip,
}: TripBillingFalseTripDeclarationCardProps) {
  const { data: timeline, isLoading: timelineLoading } = useTripTimeline(
    trip.id,
    { enabled: trip.operationalOutcome === "false_trip" },
  );
  const { data: expensesSummary, isLoading: expensesLoading } =
    useTripExpensesSummary(trip.id, {
      enabled: trip.operationalOutcome === "false_trip",
    });

  const declaration = resolveFalseTripDeclaration({
    trip,
    events: timeline?.events,
  });

  const who = declaration.declaredBy?.trim() || copy.whoUnknown;
  const when = declaration.declaredAt
    ? formatDateTime(declaration.declaredAt.toISOString())
    : null;
  const declaredLine = when
    ? copy.declaredAtLine(who, when)
    : who;
  const reason = declaration.reason?.trim() || copy.reasonMissing;
  const expensesTotal = expensesSummary?.total ?? null;
  const showExpenses =
    expensesTotal != null && Number.isFinite(expensesTotal) && expensesTotal > 0;

  return (
    <Card data-testid="trip-billing-false-trip">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{copy.cardTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {timelineLoading && !declaration.declaredAt && !declaration.reason ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <>
            <InfoRow
              variant="inline"
              label={copy.declaredBy}
              value={declaredLine}
            />
            <InfoRow variant="inline" label={copy.reason} value={reason} />
            {expensesLoading && expensesTotal == null ? (
              <Skeleton className="h-5 w-40" />
            ) : showExpenses ? (
              <InfoRow
                variant="inline"
                label={copy.expenses}
                value={
                  <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-mono tabular-nums">
                      {formatMxCurrency(expensesTotal)}
                    </span>
                    <Link
                      to={`/trips/${trip.id}?tab=costs`}
                      className="text-primary underline-offset-2 hover:underline"
                    >
                      {copy.viewCosts}
                    </Link>
                  </span>
                }
              />
            ) : (
              <p className="text-xs text-muted-foreground">
                <Link
                  to={`/trips/${trip.id}?tab=costs`}
                  className="text-primary underline-offset-2 hover:underline"
                >
                  {copy.viewCosts}
                </Link>
                {" · "}
                {copy.expensesHint}
              </p>
            )}
            {showExpenses ? (
              <p className="text-xs text-muted-foreground">{copy.expensesHint}</p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
