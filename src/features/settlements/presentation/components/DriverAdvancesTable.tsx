/**
 * DriverAdvancesTable
 * Clean Architecture - Presentation Layer (Components)
 *
 * Componente de tabla para listar anticipos entregados a operadores.
 * Homologado con DriverTable.
 *
 * Layout Abiertos (dictamen PRD D1–D6): Operador con tope; Estado stack;
 * Repartir inline solo si supera pago.
 *
 * Ubicación: src/features/settlements/presentation/components/DriverAdvancesTable.tsx
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { Skeleton } from "@shared/ui/skeleton";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
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

// ============================================================================
// TYPES
// ============================================================================

interface DriverAdvancesTableProps {
  advances: DriverAdvance[];
  isLoading: boolean;
  onRepartir?: (advance: DriverAdvance) => void;
  estimatedByEmployee?: ReadonlyMap<string, number>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * D1/D6: Folio · Operador · Categoría · Saldo · Entrega · Estado · Acciones.
 * Operador con tope (no esponja); Categoría ~11rem wrap; Folio/Saldo/Entrega fijos.
 */
function buildTableHeaders(reserveRepartir: boolean) {
  return [
    { key: "folio", label: copy.fields.folio, className: "w-[7.5rem]" },
    { key: "employee", label: copy.fields.employee, className: "w-[20ch]" },
    { key: "category", label: copy.fields.category, className: "w-[11rem]" },
    {
      key: "balanceRemaining",
      label: copy.fields.balanceRemaining,
      className: "w-[9rem] text-right font-medium text-foreground",
    },
    {
      key: "deliveryDate",
      label: copy.fields.deliveryDate,
      className: "w-[8.5rem]",
    },
    { key: "status", label: copy.fields.status, className: "w-[9rem]" },
    {
      key: "actions",
      label: "",
      className: reserveRepartir ? "w-[10rem] text-right" : "w-12 text-right",
    },
  ] as const;
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

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function TableHeaderRow({ reserveRepartir }: { reserveRepartir: boolean }) {
  const headers = buildTableHeaders(reserveRepartir);
  return (
    <TableHeader>
      <TableRow>
        {headers.map((header) => (
          <TableHead key={header.key} className={header.className}>
            {header.label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}

function LoadingSkeleton({ reserveRepartir }: { reserveRepartir: boolean }) {
  return (
    <TableBody>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-28 font-mono" />
          </TableCell>
          <TableCell>
            <div className="max-w-[20ch] space-y-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-20" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="h-4 w-20 ml-auto" />
          </TableCell>
          <TableCell>
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-20" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton
              className={
                reserveRepartir ? "h-8 w-24 ml-auto" : "h-8 w-8 ml-auto"
              }
            />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}

function deliveryMethodLabel(adv: DriverAdvance): string {
  return (
    DISBURSEMENT_METHOD_LABELS[adv.paymentMethod as DisbursementMethod] ??
    adv.paymentMethod
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DriverAdvancesTable({
  advances,
  isLoading,
  onRepartir,
  estimatedByEmployee,
}: DriverAdvancesTableProps) {
  const reserveRepartir = Boolean(onRepartir);

  if (isLoading) {
    return (
      <div className="rounded-md border bg-card">
        <Table aria-label="Listado de anticipos" className="w-full table-fixed">
          <TableHeaderRow reserveRepartir={reserveRepartir} />
          <LoadingSkeleton reserveRepartir={reserveRepartir} />
        </Table>
      </div>
    );
  }

  // Empty lo resuelve SettlementsAdvancesPage (EmptyState único del shell).
  if (advances.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border bg-card">
      <Table aria-label="Listado de anticipos" className="w-full table-fixed">
        <TableHeaderRow reserveRepartir={reserveRepartir} />
        <TableBody>
          {advances.map((adv) => {
            const catLabel =
              ADVANCE_CATEGORY_LABELS[adv.category as AdvanceCategory] ??
              adv.category;
            const balance = adv.availableBalance ?? adv.balanceRemaining;
            const exceeds = advanceExceedsPayment(adv, estimatedByEmployee);
            const hasPlan =
              adv.periodDeductionCap != null && adv.periodDeductionCap > 0;
            const offerRepartir = Boolean(onRepartir && canOfferRepartir(adv));
            // D4: inline solo si supera; si no, menú ⋯ (D5).
            const showRepartirInline = offerRepartir && exceeds;
            return (
              <TableRow key={adv.id} className="hover:bg-muted/50 transition-colors">
                {/* Folio */}
                <TableCell className="truncate font-semibold text-primary font-mono text-sm">
                  {adv.folio}
                </TableCell>

                {/* Operador / Viaje — D6: tope ~20ch, no esponja */}
                <TableCell className="w-[20ch] max-w-[20ch] font-medium">
                  <div className="max-w-[20ch] truncate">
                    {adv.employeeFullName ?? "—"}
                  </div>
                  {adv.tripCode ? (
                    <p className="mt-0.5 max-w-[20ch] truncate font-mono text-xs text-muted-foreground">
                      Viaje: {adv.tripCode}
                    </p>
                  ) : null}
                </TableCell>

                {/* Categoría — D1: ~11rem, wrap 2 líneas */}
                <TableCell className="text-sm">
                  <span className="line-clamp-2 break-words">{catLabel}</span>
                </TableCell>

                {/* Saldo restante — V-M2: ink, no primary */}
                <TableCell className="text-right font-mono text-sm font-medium tabular-nums text-foreground">
                  {formatMxCurrency(balance)}
                  <p className="mt-0.5 text-[10px] font-normal text-muted-foreground">
                    {formatMxCurrency(adv.amount)} entregado
                  </p>
                  {adv.reservedAmount && adv.reservedAmount > 0 ? (
                    <p className="mt-0.5 whitespace-normal text-[10px] font-normal text-muted-foreground">
                      {copy.createPage.summary.reservedAdvanceHint}
                    </p>
                  ) : null}
                  {exceeds ? (
                    <div className="mt-1 flex justify-end">
                      <Badge variant="warning" tone="soft" className="text-[10px]">
                        {advancesCopy.exceedsBadge}
                      </Badge>
                    </div>
                  ) : null}
                  {hasPlan ? (
                    <p className="mt-1 text-[10px] font-normal text-muted-foreground">
                      {advancesCopy.planPerPeriod(
                        formatMxCurrency(adv.periodDeductionCap!),
                        Math.max(
                          1,
                          Math.ceil(balance / (adv.periodDeductionCap ?? 1)),
                        ),
                      )}
                    </p>
                  ) : null}
                </TableCell>

                {/* Entrega + método/ref (PM-06 2ª línea) */}
                <TableCell className="min-w-0 text-xs text-muted-foreground sm:text-sm">
                  <div className="truncate">
                    {adv.disbursedAt ? formatDate(adv.disbursedAt) : "—"}
                  </div>
                  <span className="mt-0.5 block truncate text-[11px]">
                    {deliveryMethodLabel(adv)}
                    {adv.bankReference ? ` · ${adv.bankReference}` : ""}
                  </span>
                </TableCell>

                {/* Estado — D3: stack vertical; sin acciones */}
                <TableCell className="min-w-0">
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
                </TableCell>

                {/* Acciones — D4/D5: (Repartir si supera) + ⋯ */}
                <TableCell
                  className={
                    reserveRepartir ? "w-[10rem] text-right" : "w-12 text-right"
                  }
                  onClick={(e) => e.stopPropagation()}
                >
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
