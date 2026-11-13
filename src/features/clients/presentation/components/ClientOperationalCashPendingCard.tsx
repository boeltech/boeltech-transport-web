/**
 * Card «Cobros sin factura» en detalle de cliente (ADR-0096 + B2).
 * Lee candidatos del lote (`operational_cash.create`); bandeja solo con finance.read.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { HandCoins } from "lucide-react";

import { useAuth } from "@features/auth";
import {
  buildFinanceEfectivoPorCobrarPath,
  buildOperationalReceiptBatchCreatePath,
  buildTripCostsHref,
  isFinanceAnalyticsEnabled,
  useOperationalReceiptBatchCandidates,
} from "@features/finance/application";
import {
  ClientOperationalReceiptBatchesSheet,
  OperationalReceiptBatchSheet,
} from "@features/finance/presentation/components";
import { operationalReceiptBatchCopy } from "@features/finance/presentation/copy";
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
const batchCopy = operationalReceiptBatchCopy.card;

export function ClientOperationalCashPendingCard({
  clientId,
  className,
}: ClientOperationalCashPendingCardProps) {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const canFinanceRead = isFinanceAnalyticsEnabled({
    isClientPortal: isClientPortalRole(user?.role),
    hasFinanceRead: hasPermission("finance", "read"),
  });
  const canCreate = hasPermission("operational_cash", "create");
  const canSeeCard = canFinanceRead || canCreate;

  const { data, isLoading, isError } = useOperationalReceiptBatchCandidates(
    clientId,
    { enabled: canSeeCard && Boolean(clientId) },
  );

  const [listOpen, setListOpen] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);

  if (!canSeeCard || !clientId) return null;
  if (isLoading || isError || !data) return null;

  const pendingAmount = data.meta.totals.pendingAmount;
  const tripCount = data.meta.totals.tripCount;
  const batchCount = data.meta.batchCount;
  if (!(pendingAmount > 0) && !(batchCount > 0)) return null;

  const previewTrips = data.data.slice(0, PREVIEW_TRIP_LIMIT);
  const remaining = Math.max(0, tripCount - previewTrips.length);
  const bandejaHref = buildFinanceEfectivoPorCobrarPath(clientId);
  const batchCreateHref = buildOperationalReceiptBatchCreatePath(clientId);

  return (
    <>
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
                <li
                  key={trip.tripId}
                  className="flex items-baseline justify-between gap-2"
                >
                  <Link
                    to={buildTripCostsHref(trip.tripId)}
                    className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                    aria-label={copy.openCostsAria(trip.tripCode)}
                  >
                    {trip.tripCode}
                  </Link>
                  <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                    {formatMxCurrency(trip.pendingAmount)}
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

          <div className="mt-auto flex flex-wrap gap-2">
            {canCreate && pendingAmount > 0 ? (
              <Button type="button" size="sm" asChild>
                <Link
                  to={batchCreateHref}
                  aria-label={batchCopy.registerBatchAria}
                >
                  {batchCopy.registerBatchCta}
                </Link>
              </Button>
            ) : null}
            {canFinanceRead && pendingAmount > 0 ? (
              <Button type="button" size="sm" variant="outline" asChild>
                <Link to={bandejaHref} aria-label={copy.viewCtaAria}>
                  {copy.viewCta}
                </Link>
              </Button>
            ) : null}
            {canCreate && batchCount > 0 ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                aria-label={batchCopy.listBatchesAria}
                onClick={() => setListOpen(true)}
              >
                {batchCopy.listBatchesCta}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <ClientOperationalReceiptBatchesSheet
        clientId={clientId}
        open={listOpen}
        onOpenChange={setListOpen}
        onOpenBatch={(id) => setBatchId(id)}
      />
      <OperationalReceiptBatchSheet
        batchId={batchId}
        open={Boolean(batchId)}
        onOpenChange={(open) => {
          if (!open) setBatchId(null);
        }}
      />
    </>
  );
}
