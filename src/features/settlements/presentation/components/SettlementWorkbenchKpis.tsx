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

function resolveAttentionKpis(summary: SettlementWorkbenchSummary) {
  const kpis = summary.kpis;
  return {
    inApproval: kpis?.inApproval ?? {
      count: summary.approval,
      amount: 0,
    },
    advancesToDeduct: kpis?.advancesToDeduct ?? {
      count: summary.openAdvances,
      amount: summary.advancesDeductibleEstimate ?? 0,
    },
  };
}

/**
 * KPIs de atención del workbench Pagos (PM-04 / D-PM-1).
 * No espeja 1:1 los buckets del riel: solo aging (En autorización) + Anticipos.
 */
export function SettlementWorkbenchKpis({
  summary,
  isLoading = false,
}: SettlementWorkbenchKpisProps) {
  const kpis = resolveAttentionKpis(summary);
  const aging = summary.approvalAgingDaysMax;
  const approvalWarn = typeof aging === "number" && aging > 1;

  const cards = [
    {
      id: "in_approval",
      label: copy.inApproval.label,
      amount: kpis.inApproval.amount,
      detail: copy.inApproval.detail(kpis.inApproval.count, aging ?? null),
      warn: approvalWarn,
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
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
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
            <span className="font-mono text-[22px] font-semibold leading-7 tabular-nums text-foreground">
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
