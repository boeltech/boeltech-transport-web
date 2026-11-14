/**
 * SettlementItemsTable — partidas del detalle de liquidación (`EntityListTable`).
 *
 * Dos bloques: percepciones (6 cols) · deducciones (4 cols).
 * density compact · framed false (borde del host). Empty texto del detalle (sin EmptyState).
 * T4: 6 cols en percepciones — detalle denso de negocio (≤7).
 */

import { Link } from "react-router-dom";
import { Badge } from "@shared/ui/badge";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListStackedValue,
} from "@shared/ui/table";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { SettlementItem } from "../../domain/entities";
import {
  EXPENSE_CATEGORY_LABELS,
  TRIP_ROUTE_TYPE_LABELS,
  COMPENSATION_SALARY_PERIOD_LABELS,
  ADVANCE_CATEGORY_LABELS,
  type TripRouteType,
  type CompensationSalaryPeriod,
  type AdvanceCategory,
} from "../../domain/enums";
import { settlementsCopy } from "../copy/settlementsCopy";
import { shouldShowSupportParticipationBadge } from "../utils/settlementParticipationHelpers";
import {
  getSettlementItemCategoryLabel,
  getSettlementItemOriginTitle,
  orderSettlementDeductions,
} from "../utils/settlementItemOrigin";
import {
  isManualPayeeReimbursement,
  reimbursementItemTripLine,
} from "../utils/reimbursementLines";
import type { CompensationCalculationType } from "../../domain/enums";

export interface SettlementItemsTableTotals {
  grossAmount: number;
  totalAdvancesDeducted: number;
  totalOtherDeductions: number;
}

interface SettlementItemsTableProps {
  items: readonly SettlementItem[];
  agreementCalculationType?: CompensationCalculationType | string | null;
  /** Origen para el chevron del detalle de viaje (p. ej. detalle del pago). */
  tripLinkFrom?: string;
  /** Totales del encabezado del pago; sin ellos los subtotales suman las partidas. */
  totals?: SettlementItemsTableTotals;
}

export function formatItemTitleAndSubtitle(item: SettlementItem, copy: typeof settlementsCopy.detailPage.items) {
  const details = item.calculationDetails;

  if (item.itemType === "base_salary") {
    const rawPeriod = (item.description.match(/\(([^)]+)\)/)?.[1] || "").toLowerCase();
    const periodLabel =
      COMPENSATION_SALARY_PERIOD_LABELS[rawPeriod as CompensationSalaryPeriod] ??
      (rawPeriod.includes("seman") ? "Semanal" : rawPeriod.includes("quincen") ? "Quincenal" : rawPeriod.includes("mensual") ? "Mensual" : rawPeriod || "Periódico");

    return {
      title: copy.guaranteedBaseSalary,
      subtitle: `Frecuencia: ${periodLabel}`,
      badgeTag: null,
    };
  }

  if (item.itemType === "trip_commission") {
    const routeType = details?.routeType as TripRouteType | undefined;
    const routeTypeLabel = routeType ? (TRIP_ROUTE_TYPE_LABELS[routeType] ?? routeType) : null;

    // Extraer origen y destino limpios si vienen en la descripción
    let routeDesc = "";
    const parenMatch = item.description.match(/\(([^·)]+)(?:·\s*([^)]+))?\)/);
    if (parenMatch && parenMatch[1]) {
      routeDesc = parenMatch[1].trim();
    } else {
      routeDesc = item.tripCode ? `Viaje ${item.tripCode}` : item.description;
    }

    // ADR-0086 D1: sin `minimumGuaranteedApplied` la partida es anterior al cambio.
    const minimumLegend =
      details?.minimumGuaranteedApplied === true && item.amount > 0
        ? typeof details.commissionBeforeMinimum === "number"
          ? copy.minimumGuaranteedLegend(formatMxCurrency(details.commissionBeforeMinimum))
          : copy.minimumGuaranteedLegendNoCalc
        : null;

    return {
      title: copy.tripCommissionTitle,
      subtitle: minimumLegend ? `${routeDesc} · ${minimumLegend}` : routeDesc,
      badgeTag: routeTypeLabel,
    };
  }

  if (item.itemType === "approved_expense_reimbursement") {
    const rawCategory = (details?.expenseCategory || details?.category || "").toLowerCase();
    const cleanCategory =
      EXPENSE_CATEGORY_LABELS[rawCategory] ??
      (item.description.match(/Reembolso:\s*([^-—]+)/i)?.[1]?.trim() || "Gasto de viaje");

    const categoryLabel =
      EXPENSE_CATEGORY_LABELS[cleanCategory.toLowerCase()] ?? cleanCategory;

    // Extraer detalle secundario (descripción real o ticket)
    let detailNote = "";
    const dashMatch = item.description.match(/(?:-|—)\s*(.+)$/);
    if (dashMatch && dashMatch[1]) {
      detailNote = dashMatch[1].trim();
    }

    const receipt = details?.receiptFolio || details?.receiptNumber;
    if (receipt) {
      detailNote = detailNote ? `${detailNote} · ${copy.receiptPrefix}: ${receipt}` : `${copy.receiptPrefix}: ${receipt}`;
    }

    return {
      title: `${copy.reimbursementPrefix}: ${categoryLabel}`,
      subtitle: detailNote || "Comprobado y autorizado",
      badgeTag: null,
    };
  }

  if (item.itemType === "advance_deduction") {
    const rawCat = (details?.category || "").toLowerCase();
    const catLabel = ADVANCE_CATEGORY_LABELS[rawCat as AdvanceCategory] ?? (rawCat || null);
    const folio = details?.advanceFolio || (item.description.match(/(ANT-[A-Z0-9-]+)/)?.[1] ?? null);

    const sub = [folio, catLabel].filter(Boolean).join(" · ");

    return {
      title: copy.advanceDeductionTitle,
      subtitle: sub || copy.linkedAdvanceFallback,
      badgeTag: null,
    };
  }

  const origin = getSettlementItemOriginTitle(item);
  if (origin) {
    return { ...origin, badgeTag: null };
  }

  return {
    title: item.description,
    subtitle: null,
    badgeTag: null,
  };
}

function earningsColumns(
  copy: typeof settlementsCopy.detailPage.items,
  agreementCalculationType: SettlementItemsTableProps["agreementCalculationType"],
  tripLinkFrom: string | undefined,
  participationBadgeLabel: string,
): EntityListColumnDef<SettlementItem>[] {
  return [
    {
      id: "concept",
      header: copy.headerConcept,
      kind: "stacked",
      className: "max-w-[340px]",
      accessor: (item): EntityListStackedValue => {
        const { title, subtitle, badgeTag } = formatItemTitleAndSubtitle(item, copy);
        const tripLine = reimbursementItemTripLine(item);
        const manualPayee = isManualPayeeReimbursement(item);
        const showSupportBadge =
          item.itemType === "trip_commission" &&
          shouldShowSupportParticipationBadge(
            item.calculationDetails?.appliedRule as string | undefined,
            agreementCalculationType,
          );

        const hasSecondary = Boolean(subtitle || tripLine || manualPayee);

        return {
          primary: (
            <span className="inline-flex flex-wrap items-center gap-1.5">
              <span>{title}</span>
              {showSupportBadge ? (
                <Badge
                  variant="neutral"
                  tone="soft"
                  className="text-[10px] py-0 px-1.5 h-4 font-normal"
                >
                  {participationBadgeLabel}
                </Badge>
              ) : null}
              {badgeTag ? (
                <Badge
                  variant="outline"
                  className="text-[10px] py-0 px-1.5 h-4 font-normal"
                >
                  {badgeTag}
                </Badge>
              ) : null}
            </span>
          ),
          secondary: hasSecondary ? (
            <span className="flex flex-col gap-0.5 whitespace-normal">
              {subtitle ? <span>{subtitle}</span> : null}
              {tripLine ? (
                <span data-testid="reimbursement-trip-line">{tripLine}</span>
              ) : null}
              {manualPayee ? (
                <span className="text-warning">
                  {settlementsCopy.reimbursements.manualPayeeLine}
                </span>
              ) : null}
            </span>
          ) : undefined,
        };
      },
    },
    {
      id: "category",
      header: copy.headerCategory,
      kind: "status",
      accessor: (item) => (
        <Badge variant="neutral" tone="soft">
          {getSettlementItemCategoryLabel(item)}
        </Badge>
      ),
    },
    {
      id: "trip",
      header: copy.headerTripReference,
      kind: "code",
      accessor: (item) => {
        if (item.tripId) {
          return (
            <Link
              to={`/trips/${item.tripId}`}
              state={tripLinkFrom ? { from: tripLinkFrom } : undefined}
              className="font-medium text-primary hover:underline"
            >
              {item.tripCode ?? copy.viewTripFallback}
            </Link>
          );
        }
        return item.tripCode ?? null;
      },
    },
    {
      id: "quantity",
      header: copy.headerQuantity,
      kind: "number",
      accessor: (item) => item.quantity,
    },
    {
      id: "unitRate",
      header: copy.headerUnitRate,
      kind: "money",
      accessor: (item) => item.unitRate,
    },
    {
      id: "amount",
      header: copy.headerAmount,
      kind: "money",
      accessor: (item) => item.amount,
    },
  ];
}

function deductionsColumns(
  copy: typeof settlementsCopy.detailPage.items,
): EntityListColumnDef<SettlementItem>[] {
  return [
    {
      id: "concept",
      header: copy.headerConcept,
      kind: "stacked",
      className: "max-w-[340px]",
      accessor: (item): EntityListStackedValue => {
        const { title, subtitle } = formatItemTitleAndSubtitle(item, copy);
        return {
          primary: title,
          secondary: subtitle ?? undefined,
        };
      },
    },
    {
      id: "category",
      header: copy.headerCategory,
      kind: "status",
      accessor: (item) => (
        <Badge variant="warning" tone="soft">
          {getSettlementItemCategoryLabel(item)}
        </Badge>
      ),
    },
    {
      id: "reference",
      header: copy.headerReference,
      kind: "code",
      accessor: (item) => {
        if (item.advanceId) {
          return (
            item.calculationDetails?.advanceFolio ?? copy.linkedAdvanceFallback
          );
        }
        return null;
      },
    },
    {
      id: "amount",
      header: copy.headerDeductedAmount,
      kind: "money",
      accessor: (item) => (item.amount > 0 ? -item.amount : item.amount),
    },
  ];
}

export function SettlementItemsTable({
  items,
  agreementCalculationType,
  tripLinkFrom,
  totals,
}: SettlementItemsTableProps) {
  const copy = settlementsCopy.detailPage.items;
  const participationBadgeLabel =
    settlementsCopy.createPage.trips.supportParticipationBadge;

  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        {copy.emptyEarnings}
      </div>
    );
  }

  const earnings = items.filter((it) => !it.isDeduction);
  const deductions = orderSettlementDeductions(items.filter((it) => it.isDeduction));

  const sumAmounts = (list: readonly SettlementItem[]) =>
    list.reduce((sum, it) => sum + (it.amount || 0), 0);
  const totalEarnings = totals?.grossAmount ?? sumAmounts(earnings);
  const totalAdvances =
    totals?.totalAdvancesDeducted ??
    sumAmounts(deductions.filter((it) => it.itemType === "advance_deduction"));
  const totalOtherDeductions =
    totals?.totalOtherDeductions ??
    sumAmounts(deductions.filter((it) => it.itemType !== "advance_deduction"));
  const totalDeductions = totalAdvances + totalOtherDeductions;
  const showDeductionsBreakdown = totalAdvances > 0 && totalOtherDeductions > 0;

  return (
    <div className="space-y-6">
      {/* 1. SECCIÓN DE PERCEPCIONES */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {copy.earningsTitle}
            </h3>
            <p className="text-xs text-muted-foreground">
              {copy.earningsSubtitle}
            </p>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {earnings.length} {earnings.length === 1 ? copy.countConceptSingular : copy.countConceptPlural}
          </span>
        </div>

        <div className="rounded-md border overflow-hidden">
          {earnings.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground italic">
              {copy.emptyEarnings}
            </div>
          ) : (
            <EntityListTable
              framed={false}
              density="compact"
              columns={earningsColumns(
                copy,
                agreementCalculationType,
                tripLinkFrom,
                participationBadgeLabel,
              )}
              rows={[...earnings]}
              getRowId={(row) => row.id}
              aria-label={copy.earningsTableAriaLabel}
              footer={
                <div className="flex justify-end gap-6 font-semibold">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    {copy.subtotalEarnings}
                  </span>
                  <span className="tabular-nums font-mono text-foreground font-bold">
                    {formatMxCurrency(totalEarnings)}
                  </span>
                </div>
              }
            />
          )}
        </div>
      </div>

      {/* 2. SECCIÓN DE DEDUCCIONES */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {copy.deductionsTitle}
            </h3>
            <p className="text-xs text-muted-foreground">
              {copy.deductionsSubtitle}
            </p>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {deductions.length} {deductions.length === 1 ? copy.countDeductionSingular : copy.countDeductionPlural}
          </span>
        </div>

        <div className="rounded-md border overflow-hidden">
          {deductions.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground italic">
              {copy.emptyDeductions}
            </div>
          ) : (
            <EntityListTable
              framed={false}
              density="compact"
              columns={deductionsColumns(copy)}
              rows={[...deductions]}
              getRowId={(row) => row.id}
              aria-label={copy.deductionsTableAriaLabel}
              footer={
                <div className="space-y-1.5 font-semibold">
                  {showDeductionsBreakdown ? (
                    <>
                      <div className="flex justify-end gap-6">
                        <span className="text-xs text-muted-foreground font-medium">
                          {copy.subtotalAdvances}
                        </span>
                        <span className="tabular-nums font-mono text-destructive font-medium">
                          -{formatMxCurrency(totalAdvances)}
                        </span>
                      </div>
                      <div className="flex justify-end gap-6">
                        <span className="text-xs text-muted-foreground font-medium">
                          {copy.subtotalOtherDeductions}
                        </span>
                        <span className="tabular-nums font-mono text-destructive font-medium">
                          -{formatMxCurrency(totalOtherDeductions)}
                        </span>
                      </div>
                    </>
                  ) : null}
                  <div className="flex justify-end gap-6">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                      {copy.subtotalDeductions}
                    </span>
                    <span className="tabular-nums font-mono text-destructive font-bold">
                      -{formatMxCurrency(totalDeductions)}
                    </span>
                  </div>
                </div>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
