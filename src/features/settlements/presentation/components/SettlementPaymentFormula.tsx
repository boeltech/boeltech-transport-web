import { cn } from "@shared/lib/utils/cn";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { DriverSettlement } from "../../domain/entities";
import { roundCents } from "../../domain/settlementTotals";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.detailPage.formula;

interface SettlementPaymentFormulaProps {
  settlement: DriverSettlement;
}

/**
 * Fórmula de 5 términos above-the-fold (pieza #12 · CA F4.7).
 * Por viajes + Sueldo y fijos + Reembolsos − Anticipos y descuentos = A pagar.
 */
export function SettlementPaymentFormula({
  settlement,
}: SettlementPaymentFormulaProps) {
  const tripItems =
    settlement.items?.filter((i) => i.itemType === "trip_commission") ?? [];
  const tripsAmount = roundCents(
    tripItems.reduce((sum, i) => sum + i.amount, 0) ||
      settlement.totalTripsCommission,
  );
  const tripsCount =
    settlement.tripsCount ??
    tripItems.length;

  const salaryAndFixed = roundCents(
    settlement.totalBaseSalary +
      (settlement.items
        ?.filter(
          (i) =>
            !i.isDeduction &&
            i.calculationDetails?.source === "fixed_allowance",
        )
        .reduce((sum, i) => sum + i.amount, 0) ?? 0),
  );

  const fixedOnly = roundCents(
    Math.max(0, salaryAndFixed - settlement.totalBaseSalary),
  );

  const reimbursements = roundCents(settlement.totalReimbursableExpenses);
  const deductions = roundCents(
    settlement.totalAdvancesDeducted + settlement.totalOtherDeductions,
  );

  const terms = [
    {
      id: "trips",
      label: copy.trips,
      amount: tripsAmount,
      sub: copy.tripsSub(tripsCount),
      negative: false,
      result: false,
    },
    {
      id: "salary",
      label: copy.salaryAndFixed,
      amount: salaryAndFixed,
      sub: copy.salaryAndFixedSub(
        formatMxCurrency(settlement.totalBaseSalary),
        formatMxCurrency(fixedOnly),
      ),
      negative: false,
      result: false,
    },
    {
      id: "reimbursements",
      label: copy.reimbursements,
      amount: reimbursements,
      sub: copy.reimbursementsSub(
        settlement.items?.filter(
          (i) => i.itemType === "approved_expense_reimbursement",
        ).length ?? 0,
      ),
      negative: false,
      result: false,
    },
    {
      id: "deductions",
      label: copy.deductions,
      amount: deductions,
      sub: copy.deductionsSub(
        formatMxCurrency(settlement.totalAdvancesDeducted),
        formatMxCurrency(settlement.totalOtherDeductions),
      ),
      negative: true,
      result: false,
    },
    {
      id: "net",
      label: copy.netToPay,
      amount: settlement.netAmount,
      sub: copy.netToPaySub(settlement.employeeFullName.split(" ")[0] ?? ""),
      negative: false,
      result: true,
    },
  ] as const;

  const ops = ["+", "+", "−", "="] as const;

  return (
    <div
      className="grid grid-cols-1 gap-1 rounded-2xl border bg-card p-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1.1fr]"
      data-testid="settlement-payment-formula"
      aria-label={copy.ariaLabel}
    >
      {terms.map((term, index) => (
        <div key={term.id} className="contents">
          {index > 0 ? (
            <div
              className="hidden items-center justify-center text-xl font-medium text-muted-foreground sm:flex"
              aria-hidden
            >
              {ops[index - 1]}
            </div>
          ) : null}
          <div
            className={cn(
              "flex flex-col gap-1 rounded-xl px-3 py-2.5",
              term.result && "bg-secondary",
            )}
          >
            <span className="text-xs font-semibold text-muted-foreground">
              {term.label}
            </span>
            <span
              className={cn(
                "font-mono font-semibold tabular-nums",
                term.result ? "text-lg leading-6" : "text-sm",
                term.negative && term.amount > 0 && "text-destructive",
              )}
            >
              {term.negative && term.amount > 0
                ? `−${formatMxCurrency(term.amount)}`
                : formatMxCurrency(term.amount)}
            </span>
            <span className="text-xs text-muted-foreground">{term.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
