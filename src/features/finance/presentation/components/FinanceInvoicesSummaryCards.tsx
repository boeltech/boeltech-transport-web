import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { StatCard, type StatCardTone } from "@shared/ui/data-display";
import { cn } from "@shared/lib/utils/cn";
import type { FinanceInvoiceStatus } from "@features/finance/domain";
import { financeCopy } from "../copy";

const kpiCopy = financeCopy.invoices.kpi;

interface KpiCardConfig {
  label: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  tone: StatCardTone;
  filterStatus: FinanceInvoiceStatus;
}

interface Props {
  stamped: number;
  draft: number;
  cancellationPending: number;
  cancelled: number;
  isLoading?: boolean;
  activeStatus?: string;
  onFilterStatus: (status: FinanceInvoiceStatus) => void;
}

export function FinanceInvoicesSummaryCards({
  stamped,
  draft,
  cancellationPending,
  cancelled,
  isLoading,
  activeStatus,
  onFilterStatus,
}: Props) {
  const cards: KpiCardConfig[] = [
    {
      label: kpiCopy.stamped.label,
      value: stamped,
      description: kpiCopy.stamped.description,
      icon: CheckCircle2,
      tone: "success",
      filterStatus: "stamped",
    },
    {
      label: kpiCopy.draft.label,
      value: draft,
      description: kpiCopy.draft.description,
      icon: Clock,
      tone: "neutral",
      filterStatus: "draft",
    },
    {
      label: kpiCopy.cancellationPending.label,
      value: cancellationPending,
      description: kpiCopy.cancellationPending.description,
      icon: Clock,
      tone: "warning",
      filterStatus: "cancellation_pending",
    },
    {
      label: kpiCopy.cancelled.label,
      value: cancelled,
      description: kpiCopy.cancelled.description,
      icon: XCircle,
      tone: "destructive",
      filterStatus: "cancelled",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeStatus === card.filterStatus;
        return (
          <button
            key={card.label}
            type="button"
            className="text-left"
            onClick={() => onFilterStatus(card.filterStatus)}
          >
            <StatCard
              title={card.label}
              value={card.value}
              description={card.description}
              tone={card.tone}
              icon={<Icon className="h-5 w-5" />}
              isLoading={isLoading}
              className={cn(
                "transition-shadow hover:shadow-md",
                isActive && "ring-2 ring-primary",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
