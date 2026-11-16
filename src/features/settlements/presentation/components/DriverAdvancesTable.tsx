/**
 * DriverAdvancesTable — listado Operate (`EntityListTable`).
 *
 * Folio · Operador · Categoría · Saldo · Entrega · Estado · Acciones.
 * Empty → null (SettlementsAdvancesPage). `framed={false}`.
 * Fechas con `formatDate`. Sin sort API nuevo.
 */

import { Button } from "@shared/ui/button";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListStackedValue,
} from "@shared/ui/table";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { DriverAdvance } from "../../domain/entities";
import {
  ADVANCE_CATEGORY_LABELS,
  DISBURSEMENT_METHOD_LABELS,
  type AdvanceCategory,
  type DisbursementMethod,
} from "../../domain/enums";
import { showsSelfApprovedBadge } from "@features/approvals/domain";
import {
  ApprovalFlowLines,
  SelfApprovedBadge,
} from "@features/approvals/presentation/components";
import { AdvanceStatusBadge } from "./SettlementStatusBadge";
import { AdvanceActions } from "./AdvanceActions";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy;
const advancesCopy = settlementsCopy.advancesList;

interface DriverAdvancesTableProps {
  advances: DriverAdvance[];
  isLoading: boolean;
  onRepartir?: (advance: DriverAdvance) => void;
  estimatedByEmployee?: ReadonlyMap<string, number>;
}

function canOfferRepartir(adv: DriverAdvance): boolean {
  return adv.status === "disbursed" || adv.status === "partially_applied";
}

function advanceExceedsPayment(
  adv: DriverAdvance,
  estimatedByEmployee?: ReadonlyMap<string, number>,
): boolean {
  const balance = adv.availableBalance ?? adv.balanceRemaining;
  const estimated = estimatedByEmployee?.get(adv.employeeId);
  return (
    estimated != null &&
    balance > estimated &&
    canOfferRepartir(adv)
  );
}

function deliveryMethodLabel(adv: DriverAdvance): string {
  return (
    DISBURSEMENT_METHOD_LABELS[adv.paymentMethod as DisbursementMethod] ??
    adv.paymentMethod
  );
}

function showRepartirInlineFor(
  adv: DriverAdvance,
  onRepartir: DriverAdvancesTableProps["onRepartir"],
  estimatedByEmployee: DriverAdvancesTableProps["estimatedByEmployee"],
): boolean {
  return Boolean(
    onRepartir &&
      canOfferRepartir(adv) &&
      advanceExceedsPayment(adv, estimatedByEmployee),
  );
}

function buildColumns(
  props: Pick<
    DriverAdvancesTableProps,
    "onRepartir" | "estimatedByEmployee" | "advances"
  >,
): EntityListColumnDef<DriverAdvance>[] {
  const { onRepartir, estimatedByEmployee, advances } = props;
  const widenActions = advances.some((adv) =>
    showRepartirInlineFor(adv, onRepartir, estimatedByEmployee),
  );

  return [
    {
      id: "folio",
      header: copy.fields.folio,
      kind: "code",
      className: "w-[7.5rem]",
      accessor: (adv) => adv.folio,
    },
    {
      id: "employee",
      header: copy.fields.employee,
      kind: "stacked",
      className: "w-[20ch] max-w-[20ch]",
      accessor: (adv): EntityListStackedValue => ({
        primary: (
          <span className="max-w-[20ch] truncate block">
            {adv.employeeFullName ?? "—"}
          </span>
        ),
        secondary: adv.tripCode ? (
          <span className="max-w-[20ch] truncate font-mono">
            Viaje: {adv.tripCode}
          </span>
        ) : undefined,
      }),
    },
    {
      id: "category",
      header: copy.fields.category,
      kind: "text",
      className: "w-[11rem]",
      accessor: (adv) =>
        ADVANCE_CATEGORY_LABELS[adv.category as AdvanceCategory] ??
        adv.category,
    },
    {
      id: "balanceRemaining",
      header: copy.fields.balanceRemaining,
      kind: "stacked",
      stackedWeight: "normal",
      className: "w-[9rem] text-right",
      headerClassName: "w-[9rem] text-right",
      accessor: (adv): EntityListStackedValue => {
        const balance = adv.availableBalance ?? adv.balanceRemaining;
        const hasPlan =
          adv.periodDeductionCap != null && adv.periodDeductionCap > 0;
        return {
          primary: (
            <span className="font-mono tabular-nums">
              {formatMxCurrency(balance)}
            </span>
          ),
          secondary: hasPlan
            ? advancesCopy.planPerPeriod(
                formatMxCurrency(adv.periodDeductionCap!),
                Math.max(
                  1,
                  Math.ceil(balance / (adv.periodDeductionCap ?? 1)),
                ),
              )
            : undefined,
        };
      },
    },
    {
      id: "deliveryDate",
      header: copy.fields.deliveryDate,
      kind: "stacked",
      className: "w-[8.5rem]",
      accessor: (adv): EntityListStackedValue => ({
        primary: adv.disbursedAt
          ? formatDate(adv.disbursedAt)
          : copy.fields.deliveryPending,
        secondary: `${deliveryMethodLabel(adv)}${
          adv.bankReference ? ` · ${adv.bankReference}` : ""
        }`,
      }),
    },
    {
      id: "status",
      header: copy.fields.status,
      kind: "status",
      className: "w-[9rem]",
      accessor: (adv) => (
        <div className="flex flex-col items-start gap-1">
          <AdvanceStatusBadge status={adv.status} showIcon size="sm" />
          {showsSelfApprovedBadge({
            kind: "advance",
            status: adv.status,
            selfSegregatedApproval: adv.selfSegregatedApproval,
          }) ? (
            <SelfApprovedBadge />
          ) : null}
          <ApprovalFlowLines approval={adv.approval} />
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      kind: "actions",
      className: widenActions ? "w-[10rem]" : "w-12",
      headerClassName: widenActions ? "w-[10rem] text-right" : "w-12 text-right",
      accessor: (adv) => {
        const offerRepartir = Boolean(onRepartir && canOfferRepartir(adv));
        const showRepartirInline = showRepartirInlineFor(
          adv,
          onRepartir,
          estimatedByEmployee,
        );
        return (
          <div className="flex items-center justify-end gap-0.5">
            {showRepartirInline ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 px-1.5"
                onClick={() => onRepartir?.(adv)}
                data-testid={`advance-repartir-${adv.id}`}
              >
                {advancesCopy.repartir.actionLabel}
              </Button>
            ) : null}
            <AdvanceActions
              advance={adv}
              onRepartir={
                offerRepartir && !showRepartirInline
                  ? () => onRepartir?.(adv)
                  : undefined
              }
            />
          </div>
        );
      },
    },
  ];
}

export function DriverAdvancesTable({
  advances,
  isLoading,
  onRepartir,
  estimatedByEmployee,
}: DriverAdvancesTableProps) {
  const columns = buildColumns({ onRepartir, estimatedByEmployee, advances });

  return (
    <EntityListTable
      framed={false}
      density="list"
      aria-label="Listado de anticipos"
      className="[&_table]:w-full [&_table]:table-fixed"
      columns={columns}
      rows={advances}
      getRowId={(row) => row.id}
      isLoading={isLoading}
    />
  );
}
