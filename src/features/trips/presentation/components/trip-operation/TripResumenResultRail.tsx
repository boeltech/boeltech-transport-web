import type { ReactNode } from "react";

import { TripStatus, type Trip, type TripExpense } from "@features/trips/domain";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { cn } from "@shared/lib/utils/cn";

import { tripDetailCopy } from "../../copy";
import {
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

function CostValue({ amount }: { amount: number }) {
  if (amount === 0) return <span>{formatMxCurrency(0)}</span>;
  return <span>−{formatMxCurrency(amount)}</span>;
}

function Kv({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: ReactNode;
  emphasize?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-3 py-1",
        emphasize && "font-semibold",
      )}
    >
      <span
        className={cn(
          "text-sm",
          emphasize ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
      <span className={cn("font-mono text-sm tabular-nums", emphasize && "font-semibold")}>
        {value}
      </span>
    </div>
  );
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

  const marginPctLabel =
    snapshot.financial.marginPct == null
      ? null
      : `${snapshot.financial.marginPct.toFixed(1)}%`;

  const showQueuedHint =
    !isCompleted && snapshot.queuedCostsTotal > 0;

  return (
    <Card data-testid="trip-resumen-result-rail">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {emptyCancelled
            ? opCopy.rail.result
            : isCompleted
              ? opCopy.rail.result
              : opCopy.rail.resultEstimated}
        </CardTitle>
        {!emptyCancelled && showQueuedHint ? (
          <CardDescription>{opCopy.hint.resultIncludesQueued}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {emptyCancelled ? (
          <p className="text-sm text-muted-foreground">
            {opCopy.rail.cancelledNoCosts}
          </p>
        ) : (
          <>
            <div className="space-y-0">
              <Kv
                label={costsCopy.label.income}
                value={formatMxCurrency(snapshot.financial.baseRate)}
              />
              <Kv
                label={costsCopy.label.costs}
                value={
                  <CostValue
                    amount={snapshot.financial.totalOperationalCosts}
                  />
                }
              />
              <Kv
                label={costsCopy.label.expenses}
                value={
                  <CostValue
                    amount={snapshot.financial.totalIndirectExpenses}
                  />
                }
              />
              <Kv
                label={
                  isCompleted
                    ? costsCopy.label.marginConfirmed
                    : costsCopy.label.margin
                }
                value={
                  <span className={snapshot.marginToneClass}>
                    {formatMxCurrency(snapshot.financial.margin)}
                  </span>
                }
                emphasize
              />
            </div>
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
            <div className="flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
              {marginPctLabel ? (
                canReadCosts ? (
                  <button
                    type="button"
                    className="font-medium text-primary hover:underline"
                    onClick={onOpenCostsTab}
                  >
                    {opCopy.rail.marginWithCostsLink(marginPctLabel)}
                  </button>
                ) : (
                  <span>{opCopy.rail.marginOnly(marginPctLabel)}</span>
                )
              ) : canReadCosts ? (
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
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
