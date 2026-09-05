import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { Badge } from "@shared/ui/badge";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { SettlementItem } from "../../domain/entities";
import {
  SETTLEMENT_ITEM_TYPE_LABELS,
  EXPENSE_CATEGORY_LABELS,
  TRIP_ROUTE_TYPE_LABELS,
  COMPENSATION_SALARY_PERIOD_LABELS,
  ADVANCE_CATEGORY_LABELS,
  type SettlementItemType,
  type TripRouteType,
  type CompensationSalaryPeriod,
  type AdvanceCategory,
} from "../../domain/enums";
import { settlementsCopy } from "../copy/settlementsCopy";
import { shouldShowSupportParticipationBadge } from "../utils/settlementParticipationHelpers";
import type { CompensationCalculationType } from "../../domain/enums";

interface SettlementItemsTableProps {
  items: readonly SettlementItem[];
  agreementCalculationType?: CompensationCalculationType | string | null;
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

    return {
      title: copy.tripCommissionTitle,
      subtitle: routeDesc,
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

  return {
    title: item.description,
    subtitle: null,
    badgeTag: null,
  };
}

export function SettlementItemsTable({
  items,
  agreementCalculationType,
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
  const deductions = items.filter((it) => it.isDeduction);

  const totalEarnings = earnings.reduce((sum, it) => sum + (it.amount || 0), 0);
  const totalDeductions = deductions.reduce((sum, it) => sum + (it.amount || 0), 0);

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
          <Table aria-label={copy.earningsTableAriaLabel}>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>{copy.headerConcept}</TableHead>
                <TableHead>{copy.headerCategory}</TableHead>
                <TableHead>{copy.headerTripReference}</TableHead>
                <TableHead className="text-right">{copy.headerQuantity}</TableHead>
                <TableHead className="text-right">{copy.headerUnitRate}</TableHead>
                <TableHead className="text-right">{copy.headerAmount}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {earnings.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-6 text-center text-xs text-muted-foreground italic"
                  >
                    {copy.emptyEarnings}
                  </TableCell>
                </TableRow>
              ) : (
                earnings.map((item, index) => {
                  const itemTypeLabel =
                    SETTLEMENT_ITEM_TYPE_LABELS[item.itemType as SettlementItemType] ??
                    item.itemType;
                  const { title, subtitle, badgeTag } = formatItemTitleAndSubtitle(item, copy);
                  const showSupportBadge =
                    item.itemType === "trip_commission" &&
                    shouldShowSupportParticipationBadge(
                      item.calculationDetails?.appliedRule as string | undefined,
                      agreementCalculationType,
                    );

                  return (
                    <TableRow key={item.id ?? index}>
                      <TableCell className="max-w-[340px]">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-foreground text-xs sm:text-sm">
                              {title}
                            </span>
                            {showSupportBadge ? (
                              <Badge
                                variant="neutral"
                                tone="soft"
                                className="text-[10px] py-0 px-1.5 h-4 font-normal"
                              >
                                {participationBadgeLabel}
                              </Badge>
                            ) : null}
                            {badgeTag && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 font-normal">
                                {badgeTag}
                              </Badge>
                            )}
                          </div>
                          {subtitle && (
                            <span className="text-xs text-muted-foreground leading-snug">
                              {subtitle}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral" tone="soft">
                          {itemTypeLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.tripId ? (
                          <Link
                            to={`/trips/${item.tripId}`}
                            className="font-medium text-primary hover:underline font-mono text-xs"
                          >
                            {item.tripCode ?? copy.viewTripFallback}
                          </Link>
                        ) : item.tripCode ? (
                          <span className="font-medium text-foreground font-mono text-xs">
                            {item.tripCode}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMxCurrency(item.unitRate)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-foreground">
                        {formatMxCurrency(item.amount)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
            {earnings.length > 0 && (
              <TableFooter className="bg-muted/50 border-t font-semibold">
                <TableRow>
                  <TableCell colSpan={5} className="text-right text-xs uppercase tracking-wider text-muted-foreground">
                    {copy.subtotalEarnings}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-foreground font-bold">
                    {formatMxCurrency(totalEarnings)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
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
          <Table aria-label={copy.deductionsTableAriaLabel}>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>{copy.headerConcept}</TableHead>
                <TableHead>{copy.headerCategory}</TableHead>
                <TableHead>{copy.headerAdvanceReference}</TableHead>
                <TableHead className="text-right">{copy.headerDeductedAmount}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deductions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-6 text-center text-xs text-muted-foreground italic"
                  >
                    {copy.emptyDeductions}
                  </TableCell>
                </TableRow>
              ) : (
                deductions.map((item, index) => {
                  const itemTypeLabel =
                    SETTLEMENT_ITEM_TYPE_LABELS[item.itemType as SettlementItemType] ??
                    item.itemType;
                  const { title, subtitle } = formatItemTitleAndSubtitle(item, copy);

                  return (
                    <TableRow key={item.id ?? index}>
                      <TableCell className="max-w-[340px]">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-foreground text-xs sm:text-sm">
                            {title}
                          </span>
                          {subtitle && (
                            <span className="text-xs text-muted-foreground leading-snug">
                              {subtitle}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="warning" tone="soft">
                          {itemTypeLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.advanceId ? (
                          <span className="font-mono text-xs">
                            {item.calculationDetails?.advanceFolio ?? copy.linkedAdvanceFallback}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-destructive">
                        -{formatMxCurrency(item.amount)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
            {deductions.length > 0 && (
              <TableFooter className="bg-muted/50 border-t font-semibold">
                <TableRow>
                  <TableCell colSpan={3} className="text-right text-xs uppercase tracking-wider text-muted-foreground">
                    {copy.subtotalDeductions}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-destructive font-bold">
                    -{formatMxCurrency(totalDeductions)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </div>
    </div>
  );
}
