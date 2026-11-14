/**
 * OperationalCashPendingTable — bandeja Cobros sin factura (`EntityListTable`).
 *
 * Agrupada por cliente. Viaje · Salida · Estado · Tarifa · Cobrado · Pendiente ·
 * Efectivo · Acciones. Empty → null (shell). `framed={false}` bajo ListPageShell.
 * Solo migración de tabla — no WIP cobranza/wayfinding.
 */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListStackedValue,
} from "@shared/ui/table";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { useListQueueFromState } from "@shared/utils/listQueueFrom";
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

function buildColumns(
  setBatchId: (id: string) => void,
): EntityListColumnDef<OperationalCashPendingTrip>[] {
  return [
    {
      id: "trip",
      header: copy.columns.trip,
      kind: "primary",
      accessor: (trip) => trip.code,
    },
    {
      id: "departure",
      header: copy.columns.departure,
      kind: "date",
      accessor: (trip) => trip.scheduledDeparture,
    },
    {
      id: "status",
      header: copy.columns.status,
      kind: "status",
      accessor: (trip) => (
        <TripStatusBadge status={trip.status as TripStatusType} />
      ),
    },
    {
      id: "baseRate",
      header: copy.columns.baseRate,
      kind: "money",
      accessor: (trip) => trip.baseRate,
    },
    {
      id: "collected",
      header: copy.columns.collected,
      kind: "stacked",
      headerClassName: "text-right",
      className: "text-right",
      accessor: (trip): EntityListStackedValue => {
        const receipt = trip.lastActiveReceipt;
        const showReceipt =
          Boolean(receipt) && trip.operationalCash.collectedTotal > 0;
        return {
          primary: (
            <span className="font-mono tabular-nums">
              {formatMxCurrency(trip.operationalCash.collectedTotal)}
            </span>
          ),
          secondary: showReceipt && receipt ? (
            <span>
              {trayCopy.lastReceipt(
                OPERATIONAL_PAYMENT_INSTRUMENT_LABELS[receipt.paymentInstrument],
                receipt.reference,
              )}
              {receipt.batchId ? (
                <>
                  {" · "}
                  <button
                    type="button"
                    className="text-primary underline-offset-2 hover:underline"
                    onClick={() => {
                      if (receipt.batchId) setBatchId(receipt.batchId);
                    }}
                  >
                    {trayCopy.batchLink}
                  </button>
                </>
              ) : null}
            </span>
          ) : undefined,
        };
      },
    },
    {
      id: "pending",
      header: copy.columns.pending,
      kind: "money",
      className: "font-medium",
      accessor: (trip) => trip.operationalCash.pendingAmount,
    },
    {
      id: "cashStatus",
      header: copy.columns.cashStatus,
      kind: "status",
      accessor: (trip) => (
        <Badge variant={cashStatusVariant(trip.operationalCash.status)}>
          {cashStatusLabel(trip.operationalCash.status)}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      kind: "actions",
      className: "w-auto",
      headerClassName: "w-0",
      accessor: (trip) => {
        const href = buildTripCostsHref(trip.id);
        return (
          <Button variant="outline" size="sm" asChild>
            <Link to={href} aria-label={copy.openCostsAria(trip.code)}>
              {copy.openCostsCta}
              <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" aria-hidden />
            </Link>
          </Button>
        );
      },
    },
  ];
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
  const fromState = useListQueueFromState();
  const [batchId, setBatchId] = useState<string | null>(null);

  const columns = useMemo(
    () =>
      buildColumns((id) => {
        setBatchId(id);
      }),
    [],
  );

  return (
    <div className="space-y-6">
      {isLoading ? (
        <EntityListTable
          framed={false}
          density="list"
          aria-label={copy.entityLabelPlural}
          columns={columns}
          rows={[]}
          getRowId={(row) => row.id}
          isLoading
        />
      ) : (
        groups.map((group) => {
          const name = group.clientName?.trim() || copy.clientUnknown;
          const visibleTripCount = group.trips.length;
          const subtotalLabel = copy.clientSubtotal(
            formatMxCurrency(group.pendingAmount),
            group.tripCount,
            visibleTripCount,
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
                      state={fromState}
                    >
                      {trayCopy.registerBatchCta}
                    </Link>
                  </Button>
                ) : null}
              </div>
              <EntityListTable
                framed={false}
                density="list"
                aria-label={name}
                columns={columns}
                rows={group.trips}
                getRowId={(row) => row.id}
                primaryTo={(trip) => buildTripCostsHref(trip.id)}
              />
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
