import { Calculator } from "lucide-react";

import { TripStatus, type Trip, type TripExpense } from "@features/trips/domain";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { cn } from "@shared/lib/utils/cn";

import { tripDetailCopy } from "../../copy";
import {
  TripWizardFinancialSummary,
  buildTripWizardFinancialSnapshot,
  formatMxCurrency,
} from "../trip-financial";
import { tripExpensesToWizardLines } from "../trip-costs/tripExpenseFormBridge";

const opCopy = tripDetailCopy.operation;
const costsCopy = tripDetailCopy.costs.financialSummary;

export interface TripResumenResultRailProps {
  trip: Trip;
  expenses: readonly TripExpense[];
  canReadCosts: boolean;
  onOpenCostsTab: () => void;
}

export function TripResumenResultRail({
  trip,
  expenses,
  canReadCosts,
  onOpenCostsTab,
}: TripResumenResultRailProps) {
  const isCompleted = trip.status === TripStatus.COMPLETED;
  const isCancelled = trip.status === TripStatus.CANCELLED;
  const expenseLines = tripExpensesToWizardLines([...expenses]);
  const snapshot = buildTripWizardFinancialSnapshot(
    trip.costs.baseRate,
    expenseLines,
    { costBasis: isCompleted ? "approved" : "all" },
  );

  const emptyCancelled =
    isCancelled && expenses.length === 0 && snapshot.totalExpenses === 0;

  const queuedHint =
    isCompleted && snapshot.queuedCostsTotal > 0
      ? costsCopy.hint.queuedMayLower(
          formatMxCurrency(snapshot.queuedCostsTotal),
        )
      : null;

  const marginPctLabel =
    snapshot.financial.marginPct == null
      ? null
      : `${snapshot.financial.marginPct.toFixed(1)}%`;

  const footerBits: string[] = [];
  if (marginPctLabel) {
    if (queuedHint) {
      footerBits.push(
        opCopy.rail.marginWithQueued(
          marginPctLabel,
          formatMxCurrency(snapshot.queuedCostsTotal),
        ),
      );
    } else {
      footerBits.push(opCopy.rail.marginOnly(marginPctLabel));
    }
  }

  return (
    <Card data-testid="trip-resumen-result-rail">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="h-4 w-4 shrink-0 text-primary" />
          {emptyCancelled
            ? opCopy.rail.result
            : isCompleted
              ? opCopy.rail.result
              : opCopy.rail.resultEstimated}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {emptyCancelled ? (
          <p className="text-sm text-muted-foreground">
            {opCopy.rail.cancelledNoCosts}
          </p>
        ) : (
          <>
            <TripWizardFinancialSummary
              showCard={false}
              variant="totals"
              snapshot={snapshot}
              summaryCopy={costsCopy}
              title={undefined}
              marginLabel={
                isCompleted ? costsCopy.label.marginConfirmed : undefined
              }
              calculationStatusHint={
                isCompleted
                  ? costsCopy.hint.calculationApprovedOnly
                  : costsCopy.hint.calculationEstimated
              }
              queuedCostsHint={queuedHint}
            />
            {snapshot.financial.marginPct != null &&
            snapshot.financial.marginPct > 0 ? (
              <div
                className="h-1.5 overflow-hidden rounded-full bg-muted"
                aria-hidden
              >
                <div
                  className={cn(
                    "h-full rounded-full",
                    snapshot.marginToneClass.includes("success")
                      ? "bg-success"
                      : snapshot.marginToneClass.includes("warning")
                        ? "bg-warning"
                        : "bg-primary",
                  )}
                  style={{
                    width: `${Math.min(100, Math.max(0, snapshot.financial.marginPct))}%`,
                  }}
                />
              </div>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-2">
              {footerBits.length > 0 ? (
                <p className="text-xs text-muted-foreground">{footerBits[0]}</p>
              ) : (
                <span />
              )}
              {canReadCosts ? (
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={onOpenCostsTab}
                >
                  {opCopy.action.viewCosts}
                </button>
              ) : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
