/**
 * Card «Efectivo por cobrar» en detalle de cliente (F3 ADR-0096 addendum).
 * Solo lectura: CTA a bandeja filtrada. No reutiliza Cobrar → Cobros fiscales.
 */

import { Link } from "react-router-dom";
import { HandCoins } from "lucide-react";

import { useAuth } from "@features/auth";
import {
  buildFinanceEfectivoPorCobrarPath,
  buildTripCostsHref,
  isFinanceAnalyticsEnabled,
  useOperationalCashPending,
} from "@features/finance/application";
import { isClientPortalRole } from "@shared/constants/roles";
import { usePermissions } from "@shared/permissions";
import { Button } from "@shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { cn } from "@shared/lib/utils/cn";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";

import { clientDetailCopy } from "../copy/clientDetailCopy";

/** Máximo de filas de viaje en la vista previa (resto → bandeja). */
const PREVIEW_TRIP_LIMIT = 3;

export interface ClientOperationalCashPendingCardProps {
  clientId: string;
  className?: string;
}

const copy = clientDetailCopy.operationalCashPending;

export function ClientOperationalCashPendingCard({
  clientId,
  className,
}: ClientOperationalCashPendingCardProps) {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const canRead = isFinanceAnalyticsEnabled({
    isClientPortal: isClientPortalRole(user?.role),
    hasFinanceRead: hasPermission("finance", "read"),
  });

  const { data, isLoading, isError } = useOperationalCashPending(
    { clientId, page: 1, limit: PREVIEW_TRIP_LIMIT },
    { enabled: canRead && Boolean(clientId) },
  );

  if (!canRead || !clientId) return null;
  if (isLoading || isError || !data) return null;

  const pendingAmount = data.meta.totals.pendingAmount;
  const tripCount = data.meta.totals.tripCount;
  if (!(pendingAmount > 0)) return null;

  const previewTrips = data.data.slice(0, PREVIEW_TRIP_LIMIT);
  const remaining = Math.max(0, tripCount - previewTrips.length);
  const bandejaHref = buildFinanceEfectivoPorCobrarPath(clientId);

  return (
    <Card className={cn("flex h-full flex-col", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <HandCoins className="h-4 w-4 shrink-0 text-primary" />
          {copy.title}
        </CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 pt-0">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {copy.pendingLabel}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
            {formatMxCurrency(pendingAmount)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {copy.tripsSummary(tripCount)}
          </p>
        </div>

        {previewTrips.length > 0 ? (
          <ul className="space-y-1.5 border-t border-border/60 pt-3">
            {previewTrips.map((trip) => (
              <li key={trip.id} className="flex items-baseline justify-between gap-2">
                <Link
                  to={buildTripCostsHref(trip.id)}
                  className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                  aria-label={copy.openCostsAria(trip.code)}
                >
                  {trip.code}
                </Link>
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                  {formatMxCurrency(trip.operationalCash.pendingAmount)}
                </span>
              </li>
            ))}
            {remaining > 0 ? (
              <li className="text-xs text-muted-foreground">
                {copy.previewMore(remaining)}
              </li>
            ) : null}
          </ul>
        ) : null}

        <Button type="button" size="sm" variant="outline" className="mt-auto w-fit" asChild>
          <Link to={bandejaHref} aria-label={copy.viewCtaAria}>
            {copy.viewCta}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
