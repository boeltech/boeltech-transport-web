/**
 * Tab Cobro (Sin factura) — Q11 puente · D14/D15.
 * Tabla «Cobros de este viaje»; Anular solo sin batchId; Ver cobro abre lote.
 */

import { useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";

import { OperationalReceiptBatchSheet } from "@features/finance/presentation/components";
import { OPERATIONAL_PAYMENT_INSTRUMENT_LABELS } from "@features/finance/domain";
import { useOperationalCashReceipts } from "@features/trips/application";
import {
  canRegisterOperationalCashAbono,
  resolveOperationalCashSummary,
  type OperationalCashReceipt,
  type OperationalCashSummary,
  type TripSettlementException,
} from "@features/trips/domain";
import { usePermissions } from "@shared/permissions";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { DetailAlertCard, InfoRow } from "@shared/ui/data-display";
import { Skeleton } from "@shared/ui/skeleton";
import {
  EntityListTable,
  type EntityListColumnDef,
} from "@shared/ui/table";
import { formatDateTime } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";

import { billingCopy } from "../../copy/tripDetail/billingCopy";
import { cfdiEmissionIntentCopy } from "../../copy/cfdiEmissionIntentCopy";
import {
  operationalCashStatusBadgeVariant,
  operationalCashStatusLabel,
} from "../../utils/operationalCashUi";
import { VoidOperationalCashReceiptSheet } from "../trip-costs/VoidOperationalCashReceiptSheet";
import { buildOperationalCashBalanceRows } from "./buildOperationalCashBalanceRows";

const copy = billingCopy.sinCfdi;
const cashCopy = cfdiEmissionIntentCopy.cash;
const govCopy = cfdiEmissionIntentCopy.governance;

type CobroRow = {
  id: string;
  receipt: OperationalCashReceipt;
  balanceAfter: number | null;
};

export interface TripSinCfdiCobroPanelProps {
  tripId: string;
  baseRate: number;
  operationalCash?: OperationalCashSummary | null;
  operationalCashAmount?: number | null;
  settlementException?: TripSettlementException | null;
}

export function TripSinCfdiCobroPanel({
  tripId,
  baseRate,
  operationalCash,
  operationalCashAmount,
  settlementException,
}: TripSinCfdiCobroPanelProps) {
  const { hasPermission } = usePermissions();
  const canVoid = hasPermission("operational_cash", "void");
  const canCreate = hasPermission("operational_cash", "create");

  const cashSummary = resolveOperationalCashSummary(
    { operationalCash, operationalCashAmount },
    baseRate,
  );
  const canRegister = canCreate && canRegisterOperationalCashAbono(cashSummary);

  const {
    data: receipts = [],
    isLoading,
    isError,
    refetch,
  } = useOperationalCashReceipts(tripId, { includeVoided: true });

  const [voidReceipt, setVoidReceipt] = useState<OperationalCashReceipt | null>(
    null,
  );
  const [batchSheetId, setBatchSheetId] = useState<string | null>(null);

  const balanceRows = useMemo(
    () => buildOperationalCashBalanceRows(receipts, cashSummary.baseRate),
    [receipts, cashSummary.baseRate],
  );

  const tableRows: CobroRow[] = useMemo(
    () =>
      balanceRows.map(({ receipt, balanceAfter }) => ({
        id: receipt.id,
        receipt,
        balanceAfter,
      })),
    [balanceRows],
  );

  const activeCount = receipts.filter((r) => r.voidedAt == null).length;
  const panelDescription =
    cashSummary.status === "collected" && activeCount === 1
      ? copy.panelDescriptionCollected
      : copy.panelDescription;

  const columns: EntityListColumnDef<CobroRow>[] = useMemo(
    () => [
      {
        id: "date",
        header: copy.columns.date,
        kind: "stacked",
        accessor: (row) => {
          const { receipt } = row;
          const isVoided = receipt.voidedAt != null;
          let secondary: string | undefined;
          if (isVoided && receipt.voidReason) {
            secondary = copy.voidedReason(receipt.voidReason);
          } else if (receipt.batchId) {
            secondary = copy.batchPartOfMulti;
          }
          return {
            primary: formatDateTime(receipt.collectedAt.toISOString()),
            secondary,
          };
        },
      },
      {
        id: "instrument",
        header: copy.columns.instrument,
        kind: "stacked",
        accessor: (row) => {
          const label =
            OPERATIONAL_PAYMENT_INSTRUMENT_LABELS[
              row.receipt.paymentInstrument
            ] ?? "Efectivo";
          return {
            primary: label,
            secondary: row.receipt.reference
              ? row.receipt.reference
              : undefined,
          };
        },
      },
      {
        id: "status",
        header: copy.columns.status,
        kind: "status",
        accessor: (row) => {
          const isVoided = row.receipt.voidedAt != null;
          return (
            <Badge
              variant={isVoided ? "neutral" : "success"}
              tone="soft"
              className="text-xs font-medium"
            >
              {isVoided ? copy.statusVoided : copy.statusActive}
            </Badge>
          );
        },
      },
      {
        id: "amount",
        header: copy.columns.amount,
        kind: "money",
        accessor: (row) => {
          const isVoided = row.receipt.voidedAt != null;
          return (
            <span
              className={
                isVoided
                  ? "text-muted-foreground line-through tabular-nums"
                  : "tabular-nums"
              }
            >
              {formatMxCurrency(row.receipt.amount)}
            </span>
          );
        },
      },
      {
        id: "balanceAfter",
        header: copy.columns.balanceAfter,
        kind: "money",
        accessor: (row) =>
          row.balanceAfter == null
            ? copy.emDash
            : formatMxCurrency(row.balanceAfter),
      },
      {
        id: "actions",
        header: "",
        kind: "actions",
        accessor: (row) => {
          const { receipt } = row;
          if (receipt.voidedAt != null) return null;
          if (receipt.batchId) {
            return (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setBatchSheetId(receipt.batchId)}
              >
                {copy.viewCobro}
              </Button>
            );
          }
          if (!canVoid) return null;
          return (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => setVoidReceipt(receipt)}
            >
              {copy.voidCta}
            </Button>
          );
        },
      },
    ],
    [canVoid],
  );

  const progressPct =
    cashSummary.baseRate > 0
      ? Math.min(
          100,
          Math.round(
            (cashSummary.collectedTotal / cashSummary.baseRate) * 100,
          ),
        )
      : 0;

  return (
    <div
      className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]"
      data-testid="trip-billing-sin-cfdi-cobro"
    >
      <div className="space-y-4">
        <DetailAlertCard severity="info" title={cfdiEmissionIntentCopy.options.sin_cfdi_efectivo}>
          <p className="text-sm text-muted-foreground">{copy.banner}</p>
        </DetailAlertCard>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">{copy.panelTitle}</CardTitle>
              <Badge
                variant={operationalCashStatusBadgeVariant(cashSummary.status)}
                tone="soft"
                className="text-xs font-medium"
                data-testid="trip-cobro-status-badge"
              >
                {operationalCashStatusLabel(cashSummary.status)}
              </Badge>
            </div>
            <CardDescription>{panelDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">{copy.tarifa}</p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatMxCurrency(cashSummary.baseRate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{copy.cobrado}</p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatMxCurrency(cashSummary.collectedTotal)}
                </p>
                {cashSummary.receiptCount > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {cashSummary.receiptCount}{" "}
                    {cashSummary.receiptCount === 1
                      ? "cobro activo"
                      : "cobros activos"}
                  </p>
                ) : null}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{copy.porCobrar}</p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatMxCurrency(cashSummary.pendingAmount)}
                </p>
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={progressPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">{copy.tableTitle}</h3>
              {isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : isError ? (
                <DetailAlertCard
                  severity="critical"
                  icon={<AlertCircle className="h-4 w-4" />}
                  title={copy.loadError}
                  action={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        void refetch();
                      }}
                    >
                      {copy.retry}
                    </Button>
                  }
                />
              ) : tableRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">{copy.empty}</p>
              ) : (
                <EntityListTable
                  columns={columns}
                  rows={tableRows}
                  getRowId={(row) => row.id}
                  density="compact"
                  framed={false}
                />
              )}
            </div>

            {canRegister ? (
              <p className="text-xs text-muted-foreground">
                Usa «{cashCopy.ctaRegister}» en el encabezado para registrar un
                cobro.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-4">
        <Card data-testid="trip-billing-sin-cfdi-invoice-card">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">{copy.invoiceCardTitle}</CardTitle>
              <Badge variant="warning" tone="soft">
                {copy.invoiceCardSin}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {settlementException ? (
              <>
                <InfoRow
                  variant="inline"
                  label={govCopy.requesterLabel}
                  value={
                    settlementException.requestedByName?.trim() ||
                    govCopy.requesterUnknown
                  }
                />
                <div>
                  <p className="text-xs text-muted-foreground">
                    {govCopy.reasonLabel}
                  </p>
                  <p className="mt-0.5 text-foreground">
                    {settlementException.reason}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">
                {govCopy.historyEmptyByProfile}
              </p>
            )}
            {activeCount > 0 ? (
              <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                {copy.cashFreeze}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{copy.notApplicableTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              {copy.notApplicableItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </aside>

      {canVoid ? (
        <VoidOperationalCashReceiptSheet
          tripId={tripId}
          receipt={voidReceipt}
          open={voidReceipt != null}
          onOpenChange={(open) => {
            if (!open) setVoidReceipt(null);
          }}
        />
      ) : null}
      <OperationalReceiptBatchSheet
        batchId={batchSheetId}
        open={batchSheetId != null}
        onOpenChange={(open) => {
          if (!open) setBatchSheetId(null);
        }}
      />
    </div>
  );
}
