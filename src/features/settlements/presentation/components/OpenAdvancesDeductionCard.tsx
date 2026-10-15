import { CheckCheck, RotateCcw } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { FieldInlineError, getFieldErrorAriaProps, MoneyInput } from "@shared/ui/form";
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
import type { OpenAdvancePreview } from "../../domain/entities";
import { ADVANCE_CATEGORY_LABELS } from "../../domain/enums";
import { settlementsCopy } from "../copy/settlementsCopy";
import { deductableAdvanceBalance } from "../utils/settlementDeductionCapacity";

const createCopy = settlementsCopy.createPage;
const capCopy = settlementsCopy.settlementFlow.deductionsCap;

export interface OpenAdvancesDeductionCardProps {
  title: string;
  advances: readonly OpenAdvancePreview[];
  deductions: Readonly<Record<string, number>>;
  maxDeductible: number;
  fieldId: string;
  error?: string;
  onToggle: (advanceId: string, available: number, checked: boolean) => void;
  onAmountChange: (advanceId: string, maxAmount: number, amount: number) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

/** Anticipos abiertos del operador con el monto a descontar en este pago. */
export function OpenAdvancesDeductionCard({
  title,
  advances,
  deductions,
  maxDeductible,
  fieldId,
  error,
  onToggle,
  onAmountChange,
  onSelectAll,
  onClearAll,
}: OpenAdvancesDeductionCardProps) {
  return (
    <Card className="border-border shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            <CardDescription>{createCopy.sections.advancesDescription}</CardDescription>
          </div>
          {advances.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onSelectAll}
                className="text-xs h-7 px-2"
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1 text-primary" />
                {createCopy.advances.selectAll}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="text-xs h-7 px-2 text-muted-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                {createCopy.advances.clearAll}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {advances.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground border rounded-lg bg-muted/20">
            {createCopy.advances.emptyAdvances}
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">{createCopy.advances.applyCol}</TableHead>
                  <TableHead className="w-24">{createCopy.advances.folioCol}</TableHead>
                  <TableHead>{createCopy.advances.conceptCol}</TableHead>
                  <TableHead className="text-right">{createCopy.advances.balanceCol}</TableHead>
                  <TableHead className="text-right w-44">{createCopy.advances.deductCol}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {advances.map((adv) => {
                  const isSelected = deductions[adv.advanceId] !== undefined;
                  const currentVal = deductions[adv.advanceId] ?? 0;
                  const maxDeduct = deductableAdvanceBalance(adv);
                  const remainingAfterDeduction = Math.max(0, maxDeduct - currentVal);
                  return (
                    <TableRow key={adv.advanceId} className={isSelected ? "bg-muted/30" : ""}>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={isSelected}
                          disabled={maxDeduct <= 0}
                          aria-label={`${createCopy.advances.amountAriaLabel} ${adv.folio}`}
                          onCheckedChange={(checked) =>
                            onToggle(adv.advanceId, maxDeduct, checked === true)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-semibold text-foreground font-mono text-xs tabular-nums">
                        {adv.folio}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-medium text-foreground">
                          {ADVANCE_CATEGORY_LABELS[adv.category] ?? adv.category}
                        </span>
                        {adv.disbursedAt && (
                          <span className="text-xs text-muted-foreground block mt-0.5">
                            {createCopy.advances.deliveredPrefix} {formatDate(adv.disbursedAt)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium text-foreground text-xs">
                        {formatMxCurrency(maxDeduct)}
                        {adv.reservedBySettlementNumber ? (
                          <span
                            className="block text-xs font-normal text-muted-foreground mt-0.5"
                            data-testid={`advance-reserved-elsewhere-${adv.advanceId}`}
                          >
                            {createCopy.summary.reservedElsewhereHint(adv.reservedBySettlementNumber)}
                          </span>
                        ) : (adv.reservedAmount ?? 0) > 0 ? (
                          <span className="block text-xs font-normal text-muted-foreground mt-0.5">
                            {createCopy.summary.reservedAdvanceHint}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          <MoneyInput
                            disabled={!isSelected}
                            value={isSelected ? currentVal : undefined}
                            onValueChange={(val) =>
                              onAmountChange(
                                adv.advanceId,
                                maxDeduct,
                                Math.min(maxDeduct, Math.max(0, val ?? 0)),
                              )
                            }
                            aria-label={`${createCopy.advances.amountAriaLabel} ${adv.folio}`}
                            error={isSelected && Boolean(error)}
                            {...(isSelected ? getFieldErrorAriaProps(fieldId, error) : {})}
                            className="h-8 text-xs"
                          />
                          {isSelected && remainingAfterDeduction > 0 && (
                            <p className="text-xs text-muted-foreground text-right tabular-nums">
                              {capCopy.pendingNextCut(formatMxCurrency(remainingAfterDeduction))}
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        {advances.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-muted-foreground tabular-nums">
              {capCopy.maxDeductibleHint(formatMxCurrency(maxDeductible))}
            </p>
            <FieldInlineError fieldId={fieldId} message={error} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
