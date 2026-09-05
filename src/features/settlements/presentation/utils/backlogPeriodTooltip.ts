import type { SettlementBacklogRowType } from "../../domain/entities";
import { settlementsCopy } from "../copy/settlementsCopy";

const backlogCopy = settlementsCopy.workbench.backlog;

export function resolveBacklogPeriodTooltip(
  rowType: SettlementBacklogRowType | undefined | null,
): string {
  if (!rowType) {
    return backlogCopy.periodTooltipFallback;
  }

  return backlogCopy.periodTooltips[rowType] ?? backlogCopy.periodTooltipFallback;
}
