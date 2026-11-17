/**
 * OperationalCashPendingTable — bandeja Cobros sin factura (`EntityListTable`).
 *
 * Una sola tabla con filas de grupo por cliente. Viaje · Salida · Estado ·
 * Tarifa · Cobrado · Por cobrar · Acciones. Empty → null (shell).
 * `framed={false}` bajo ListPageShell.
 */

import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@shared/ui/button";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListGroup,
  type EntityListGroupHeader,
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
import type { CollectionDetailTarget } from "@features/finance/domain";
import { financeCopy, operationalReceiptBatchCopy, collectionDetailCopy } from "../copy";
import {
  operationalCashClientKey,
  type OperationalCashPendingClientGroup,
} from "../utils/groupOperationalCashPending";
import { CollectionDetailSheet } from "./CollectionDetailSheet";

const copy = financeCopy.efectivoPorCobrar;
const trayCopy = operationalReceiptBatchCopy.tray;

function collectedSecondary(
  trip: OperationalCashPendingTrip,
  openCollection: (target: CollectionDetailTarget) => void,
): ReactNode {
  if (trip.operationalCash.collectedTotal <= 0) return copy.noReceipts;
  const receipt = trip.lastActiveReceipt;
  if (!receipt) return undefined;
  return (
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
            className="rounded-sm text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => {
              if (receipt.batchId) {
                openCollection({ kind: "batch", batchId: receipt.batchId });
              }
            }}
          >
            {collectionDetailCopy.viewCobro}
          </button>
        </>
      ) : null}
    </span>
  );
}

function buildColumns(
  openCollection: (target: CollectionDetailTarget) => void,
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
      stackedWeight: "normal",
      headerClassName: "text-right",
      className: "text-right",
      accessor: (trip): EntityListStackedValue => ({
        primary: (
          <span className="font-mono tabular-nums">
            {formatMxCurrency(trip.operationalCash.collectedTotal)}
          </span>
        ),
        secondary: collectedSecondary(trip, openCollection),
      }),
    },
    {
      id: "pending",
      header: copy.columns.pending,
      kind: "money",
      className: "font-semibold",
      accessor: (trip) => trip.operationalCash.pendingAmount,
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
          <Button variant="ghost" size="sm" asChild>
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

const getGroupKey = (trip: OperationalCashPendingTrip) =>
  operationalCashClientKey(trip.clientId);

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
  const [collectionTarget, setCollectionTarget] =
    useState<CollectionDetailTarget | null>(null);

  const columns = useMemo(
    () => buildColumns(setCollectionTarget),
    [],
  );

  const rows = useMemo(() => groups.flatMap((group) => group.trips), [groups]);

  const groupsByKey = useMemo(
    () =>
      new Map(
        groups.map((group) => [operationalCashClientKey(group.clientId), group]),
      ),
    [groups],
  );

  const renderGroupHeader = (
    tableGroup: EntityListGroup<OperationalCashPendingTrip>,
  ): EntityListGroupHeader => {
    const group = groupsByKey.get(tableGroup.key);
    if (!group) return { title: copy.clientUnknown };
    const name = group.clientName?.trim() || copy.clientUnknown;
    return {
      title: name,
      meta: copy.groupTripCount(group.tripCount, tableGroup.rows.length),
      cells: {
        pending: group.pendingAmount,
        actions:
          canCreateBatch && group.clientId ? (
            <Button type="button" size="sm" variant="outline" asChild>
              <Link
                to={buildOperationalReceiptBatchCreatePath(group.clientId)}
                state={fromState}
                aria-label={copy.groupBatchAria(name)}
              >
                {copy.groupBatchCta}
              </Link>
            </Button>
          ) : undefined,
      },
    };
  };

  return (
    <>
      <EntityListTable
        framed={false}
        density="list"
        aria-label={copy.entityLabelPlural}
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        primaryTo={(trip) => buildTripCostsHref(trip.id)}
        getGroupKey={getGroupKey}
        renderGroupHeader={renderGroupHeader}
      />
      <CollectionDetailSheet
        target={collectionTarget}
        open={collectionTarget != null}
        onOpenChange={(open) => {
          if (!open) setCollectionTarget(null);
        }}
        onNavigateTarget={setCollectionTarget}
      />
    </>
  );
}
