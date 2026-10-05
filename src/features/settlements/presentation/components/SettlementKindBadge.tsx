import { Badge } from "@shared/ui/badge";
import { cn } from "@shared/lib/utils/cn";
import type { SettlementKind } from "../../domain/entities";
import { settlementsCopy } from "../copy/settlementsCopy";

export interface SettlementKindBadgeProps {
  kind: SettlementKind | null | undefined;
  className?: string;
}

/** D12: solo los pagos de reembolsos llevan insignia de tipo. */
export function SettlementKindBadge({ kind, className }: SettlementKindBadgeProps) {
  if (kind !== "reimbursement_only") return null;
  return (
    <Badge
      variant="neutral"
      tone="soft"
      className={cn("font-normal", className)}
      data-testid="settlement-kind-badge"
    >
      {settlementsCopy.reimbursements.kindLabel}
    </Badge>
  );
}
