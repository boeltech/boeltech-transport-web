/**
 * Tabla agrupada por cliente — bandeja Cobros sin factura.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Skeleton } from "@shared/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { usePermissions } from "@shared/permissions";
import {
  buildOperationalReceiptBatchCreatePath,
  buildTripCostsHref,
} from "@features/finance/application";
import {
  OPERATIONAL_PAYMENT_INSTRUMENT_LABELS,
  type OperationalCashPendingTrip,
} from "@features/finance/domain";
import type { TripStatusType } from "@features/trips/domain";
import { TripStatusBadge } from "@features/trips/presentation";
import { financeCopy, operationalReceiptBatchCopy } from "../copy";
import type { OperationalCashPendingClientGroup } from "../utils/groupOperationalCashPending";
import { OperationalReceiptBatchSheet } from "./OperationalReceiptBatchSheet";

const copy = financeCopy.efectivoPorCobrar;
const trayCopy = operationalReceiptBatchCopy.tray;

function cashStatusLabel(
  status: OperationalCashPendingTrip["operationalCash"]["status"],
): string {
  if (status === "partial") return copy.cashStatus.partial;
  if (status === "collected") return copy.cashStatus.collected;
  return copy.cashStatus.pending;
}

function cashStatusVariant(
  status: OperationalCashPendingTrip["operationalCash"]["status"],
): "neutral" | "warning" | "success" {
  if (status === "partial") return "warning";
  if (status === "collected") return "success";
  return "neutral";
}

function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="ml-auto h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="ml-auto h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="ml-auto h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-28" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}

export function OperationalCashPendingTable({
  groups,
  isLoading,
}: {
  groups: OperationalCashPendingClientGroup[];
  isLoading: boolean;
}) {
  const { hasPermission } = usePermissions();
  const canCreateBatch = hasPermission("operational_cash", "create");
  const [batchId, setBatchId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{copy.columns.trip}</TableHead>
                <TableHead>{copy.columns.departure}</TableHead>
                <TableHead>{copy.columns.status}</TableHead>
                <TableHead className="text-right">
                  {copy.columns.baseRate}
                </TableHead>
                <TableHead className="text-right">
                  {copy.columns.collected}
                </TableHead>
                <TableHead className="text-right">
                  {copy.columns.pending}
                </TableHead>
                <TableHead>{copy.columns.cashStatus}</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <LoadingSkeleton />
          </Table>
        </div>
      ) : (
        groups.map((group) => {
          const name = group.clientName?.trim() || copy.clientUnknown;
          const subtotalLabel = copy.clientSubtotal(
            formatMxCurrency(group.pendingAmount),
            group.tripCount,
          );
          return (
            <section
              key={group.clientId ?? "__none__"}
              className="space-y-2"
              aria-label={name}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-sm font-semibold text-foreground">
                    {name}
                  </h2>
                  <p className="text-xs text-muted-foreground">{subtotalLabel}</p>
                </div>
                {canCreateBatch && group.clientId ? (
                  <Button type="button" size="sm" variant="outline" asChild>
                    <Link
                      to={buildOperationalReceiptBatchCreatePath(group.clientId)}
                    >
                      {trayCopy.registerBatchCta}
                    </Link>
                  </Button>
                ) : null}
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{copy.columns.trip}</TableHead>
                      <TableHead>{copy.columns.departure}</TableHead>
                      <TableHead>{copy.columns.status}</TableHead>
                      <TableHead className="text-right">
                        {copy.columns.baseRate}
                      </TableHead>
                      <TableHead className="text-right">
                        {copy.columns.collected}
                      </TableHead>
                      <TableHead className="text-right">
                        {copy.columns.pending}
                      </TableHead>
                      <TableHead>{copy.columns.cashStatus}</TableHead>
                      <TableHead className="w-0" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.trips.map((trip) => {
                      const href = buildTripCostsHref(trip.id);
                      return (
                        <TableRow key={trip.id}>
                          <TableCell className="font-mono font-medium">
                            <Link
                              to={href}
                              className="text-foreground underline-offset-2 hover:underline"
                            >
                              {trip.code}
                            </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(trip.scheduledDeparture)}
                          </TableCell>
                          <TableCell>
                            <TripStatusBadge
                              status={trip.status as TripStatusType}
                            />
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatMxCurrency(trip.baseRate)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            <div className="flex flex-col items-end gap-0.5">
                              <span>
                                {formatMxCurrency(
                                  trip.operationalCash.collectedTotal,
                                )}
                              </span>
                              {trip.lastActiveReceipt &&
                              trip.operationalCash.collectedTotal > 0 ? (
                                <span className="text-xs text-muted-foreground">
                                  {trayCopy.lastReceipt(
                                    OPERATIONAL_PAYMENT_INSTRUMENT_LABELS[
                                      trip.lastActiveReceipt.paymentInstrument
                                    ],
                                    trip.lastActiveReceipt.reference,
                                  )}
                                  {trip.lastActiveReceipt.batchId ? (
                                    <>
                                      {" · "}
                                      <button
                                        type="button"
                                        className="text-primary underline-offset-2 hover:underline"
                                        onClick={() =>
                                          setBatchId(
                                            trip.lastActiveReceipt!.batchId,
                                          )
                                        }
                                      >
                                        {trayCopy.batchLink}
                                      </button>
                                    </>
                                  ) : null}
                                </span>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {formatMxCurrency(
                              trip.operationalCash.pendingAmount,
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={cashStatusVariant(
                                trip.operationalCash.status,
                              )}
                            >
                              {cashStatusLabel(trip.operationalCash.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" asChild>
                              <Link
                                to={href}
                                aria-label={copy.openCostsAria(trip.code)}
                              >
                                {copy.openCostsCta}
                                <ArrowUpRight
                                  className="ml-1.5 h-3.5 w-3.5"
                                  aria-hidden
                                />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </section>
          );
        })
      )}
      <OperationalReceiptBatchSheet
        batchId={batchId}
        open={Boolean(batchId)}
        onOpenChange={(open) => {
          if (!open) setBatchId(null);
        }}
      />
    </div>
  );
}
