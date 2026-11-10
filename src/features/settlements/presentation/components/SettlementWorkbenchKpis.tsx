import { cn } from "@shared/lib/utils/cn";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { Skeleton } from "@shared/ui/skeleton";
import type { SettlementWorkbenchSummary } from "../../domain/entities";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.workbench.kpis;

interface SettlementWorkbenchKpisProps {
  summary: SettlementWorkbenchSummary;
  isLoading?: boolean;
}

function resolveKpis(summary: SettlementWorkbenchSummary) {
  const kpis = summary.kpis;
  return {
    toArm: kpis?.toArm ?? {
      count: summary.pending,
      amount: 0,
    },
    inApproval: kpis?.inApproval ?? {
      count: summary.approval,
      amount: 0,
    },
    authorizedUnpaid: kpis?.authorizedUnpaid ?? {
      count: summary.payable,
      amount: 0,
    },
    advancesToDeduct: kpis?.advancesToDeduct ?? {
      count: summary.openAdvances,
      amount: summary.advancesDeductibleEstimate ?? 0,
    },
  };
}

/**
 * 4 KPIs del workbench Pagos (CA F4.3 · Operate-Pagos-Workbench).
 * En autorización con warning si aging > 1 día.
 */
export function SettlementWorkbenchKpis({
  summary,
  isLoading = false,
}: SettlementWorkbenchKpisProps) {
  const kpis = resolveKpis(summary);
  const aging = summary.approvalAgingDaysMax;
  const approvalWarn = typeof aging === "number" && aging > 1;

  const cards = [
    {
      id: "to_arm",
      label: copy.toArm.label,
      amount: kpis.toArm.amount,
      detail: copy.toArm.detail(kpis.toArm.count),
      warn: false,
    },
    {
      id: "in_approval",
      label: copy.inApproval.label,
      amount: kpis.inApproval.amount,
      detail: copy.inApproval.detail(kpis.inApproval.count, aging ?? null),
      warn: approvalWarn,
    },
    {
      id: "authorized_unpaid",
      label: copy.authorizedUnpaid.label,
      amount: kpis.authorizedUnpaid.amount,
      detail: copy.authorizedUnpaid.detail(kpis.authorizedUnpaid.count),
      warn: false,
    },
    {
      id: "advances_to_deduct",
      label: copy.advancesToDeduct.label,
      amount: kpis.advancesToDeduct.amount,
      detail: copy.advancesToDeduct.detail(kpis.advancesToDeduct.count),
      warn: false,
    },
  ] as const;

  return (
    <div
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      data-testid="settlement-workbench-kpis"
      aria-label={copy.ariaLabel}
    >
      {cards.map((card) => (
        <div
          key={card.id}
          className={cn(
            "flex flex-col gap-1 rounded-2xl border bg-card px-4 py-3.5",
            card.warn && "border-warning",
          )}
          data-testid={`settlement-kpi-${card.id}`}
        >
          <span className="text-xs font-medium text-muted-foreground">
            {card.label}
          </span>
          {isLoading ? (
            <Skeleton className="h-7 w-24" />
          ) : (
            <span className="font-mono text-[22px] font-semibold leading-7 tabular-nums">
              {formatMxCurrency(card.amount)}
            </span>
          )}
          {isLoading ? (
            <Skeleton className="h-3 w-32" />
          ) : (
            <span className="text-xs text-muted-foreground">{card.detail}</span>
          )}
        </div>
      ))}
    </div>
  );
}
