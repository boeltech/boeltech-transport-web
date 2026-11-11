/**
 * DriverAdvancesTable
 * Clean Architecture - Presentation Layer (Components)
 *
 * Componente de tabla para listar anticipos entregados a operadores.
 * Homologado con DriverTable.
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
 * PM-06: above-the-fold = Folio · Operador · Categoría · Saldo · Entrega.
 * Método/ref va en 2ª línea de Entrega; estado/acciones quedan para Operate.
 */
const TABLE_HEADERS = [
  { key: "folio", label: copy.fields.folio, className: "w-[7.5rem]" },
  { key: "employee", label: copy.fields.employee, className: "min-w-0" },
  { key: "category", label: copy.fields.category, className: "w-[7.5rem]" },
  {
    key: "balanceRemaining",
    label: copy.fields.balanceRemaining,
    className: "w-[8rem] text-right font-medium text-foreground",
  },
  {
    key: "deliveryDate",
    label: copy.fields.deliveryDate,
    className: "w-[9rem]",
  },
  { key: "status", label: copy.fields.status, className: "w-[7.5rem]" },
  { key: "actions", label: "", className: "w-12 text-right" },
];

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function TableHeaderRow() {
  return (
    <TableHeader>
      <TableRow>
        {TABLE_HEADERS.map((header) => (
          <TableHead key={header.key} className={header.className}>
            {header.label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}

function LoadingSkeleton() {
  return (
    <TableBody>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-28 font-mono" />
          </TableCell>
          <TableCell>
            <div className="space-y-1">
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
            <Skeleton className="h-8 w-8 ml-auto" />
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
  if (isLoading) {
    return (
      <div className="rounded-md border bg-card">
        <Table aria-label="Listado de anticipos" className="w-full table-fixed">
          <TableHeaderRow />
          <LoadingSkeleton />
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
        <TableHeaderRow />
        <TableBody>
          {advances.map((adv) => {
            const catLabel =
              ADVANCE_CATEGORY_LABELS[adv.category as AdvanceCategory] ??
              adv.category;
            const balance = adv.availableBalance ?? adv.balanceRemaining;
            const estimated = estimatedByEmployee?.get(adv.employeeId);
            const exceeds =
              estimated != null &&
              balance > estimated &&
              (adv.status === "disbursed" || adv.status === "partially_applied");
            const hasPlan =
              adv.periodDeductionCap != null && adv.periodDeductionCap > 0;
            return (
              <TableRow key={adv.id} className="hover:bg-muted/50 transition-colors">
                {/* Folio */}
                <TableCell className="truncate font-semibold text-primary font-mono text-sm">
                  {adv.folio}
                </TableCell>

                {/* Operador / Viaje */}
                <TableCell className="min-w-0 font-medium">
                  <div className="truncate">{adv.employeeFullName ?? "—"}</div>
                  {adv.tripCode ? (
                    <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                      Viaje: {adv.tripCode}
                    </p>
                  ) : null}
                </TableCell>

                {/* Categoría */}
                <TableCell className="truncate text-sm">{catLabel}</TableCell>

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
                    <div className="mt-1">
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

                {/* Estado */}
                <TableCell className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1">
                    <AdvanceStatusBadge status={adv.status} showIcon size="sm" />
                    {showsSelfApprovedBadge({
                      kind: "advance",
                      status: adv.status,
                      selfSegregatedApproval: adv.selfSegregatedApproval,
                    }) ? (
                      <SelfApprovedBadge />
                    ) : null}
                  </div>
                  <ApprovalFlowLines approval={adv.approval} />
                </TableCell>

                {/* Acciones */}
                <TableCell className="w-12 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-0.5">
                    {onRepartir &&
                    (exceeds ||
                      adv.status === "disbursed" ||
                      adv.status === "partially_applied") ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="px-1.5"
                        onClick={() => onRepartir(adv)}
                        data-testid={`advance-repartir-${adv.id}`}
                      >
                        {advancesCopy.repartir.actionLabel}
                      </Button>
                    ) : null}
                    <AdvanceActions advance={adv} />
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
