import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { FieldInlineError } from "@shared/ui/form";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { useToast } from "@shared/hooks";
import type { DriverAdvance } from "../../domain/entities";
import { useSetAdvancePeriodDeductionPlan } from "../../application/hooks";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.advancesList.repartir;

interface AdvancePeriodDeductionSheetProps {
  advance: DriverAdvance | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tope visible = capacidad del próximo pago estimado (si se conoce). */
  periodCapacity?: number | null;
}

/**
 * Flujo Repartir P10 (pieza #14 · CA F4.13 / P10).
 * Persiste `amount_per_period` → `period_deduction_cap`.
 * Tope visible = min(saldo, capacidad del pago) cuando hay capacidad.
 */
export function AdvancePeriodDeductionSheet({
  advance,
  open,
  onOpenChange,
  periodCapacity = null,
}: AdvancePeriodDeductionSheetProps) {
  const { toast } = useToast();
  const mutation = useSetAdvancePeriodDeductionPlan();
  const balance = advance
    ? (advance.availableBalance ?? advance.balanceRemaining)
    : 0;
  const maxAllowed =
    periodCapacity != null && periodCapacity > 0
      ? Math.min(balance, periodCapacity)
      : balance;

  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !advance) return;
    const initial =
      advance.periodDeductionCap != null && advance.periodDeductionCap > 0
        ? String(advance.periodDeductionCap)
        : periodCapacity != null && periodCapacity > 0
          ? String(Math.min(balance, periodCapacity))
          : "";
    setAmount(initial);
    setError(null);
  }, [open, advance, periodCapacity, balance]);

  const handleSubmit = async () => {
    if (!advance) return;
    const parsed = Number(amount.replace(/,/g, ""));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError(copy.amountRequired);
      return;
    }
    if (parsed > maxAllowed + 0.001) {
      setError(copy.amountExceedsCap(formatMxCurrency(maxAllowed)));
      return;
    }
    setError(null);
    try {
      const plan = await mutation.mutateAsync({
        id: advance.id,
        amountPerPeriod: parsed,
      });
      toast({
        title: copy.successTitle,
        description: copy.successDescription(
          formatMxCurrency(plan.amountPerPeriod),
          plan.projectedPeriodsEstimate,
        ),
        variant: "success",
      });
      onOpenChange(false);
    } catch (err) {
      toast({
        title: copy.errorTitle,
        description: getErrorMessage(err),
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="sm:max-w-md"
        data-testid="advance-repartir-sheet"
        // Sheet desde ⋯ «Repartir»: Radix dispara onFocusOutside al cerrar el menú.
        // Ver .cursor/rules/sheet-from-menu-focus.mdc
        onFocusOutside={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>{copy.title}</SheetTitle>
          <SheetDescription>
            {advance
              ? copy.description(
                  advance.employeeFullName ?? advance.folio,
                  formatMxCurrency(balance),
                )
              : null}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">{copy.balanceLabel}</span>
              <span className="font-mono font-semibold tabular-nums">
                {formatMxCurrency(balance)}
              </span>
            </div>
            <div className="mt-1 flex justify-between gap-2">
              <span className="text-muted-foreground">{copy.capLabel}</span>
              <span className="font-mono tabular-nums">
                {formatMxCurrency(maxAllowed)}
              </span>
            </div>
            {periodCapacity != null && periodCapacity > 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {copy.capHint(formatMxCurrency(periodCapacity))}
              </p>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">{copy.capHintNoEstimate}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount-per-period">{copy.amountLabel}</Label>
            <Input
              id="amount-per-period"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError(null);
              }}
              aria-invalid={Boolean(error)}
              data-testid="advance-repartir-amount"
            />
            {error ? (
              <FieldInlineError fieldId="amount-per-period" message={error} />
            ) : null}
          </div>

          <p className="text-xs text-muted-foreground">{copy.footerNote}</p>
        </div>

        <SheetFooter className="mt-6 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {copy.cancel}
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={mutation.isPending || !advance}
          >
            {mutation.isPending ? copy.saving : copy.confirm}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
