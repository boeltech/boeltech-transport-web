import type { ReactNode } from "react";
import { Undo2 } from "lucide-react";
import { DetailAlertCard } from "@shared/ui/data-display";
import type { ApprovalBlock } from "../../domain";
import { approvalsCopy } from "../copy/approvalsCopy";
import { formatReturnedSummary } from "../utils/approvalFlowFormat";

const copy = approvalsCopy.flow;

/**
 * Alerta «Devuelta para corregir» en el registro (handoff F6 D15 / Ola 2 D5).
 * CTAs van en el slot canónico `action` de DetailAlertCard.
 */
export function ReturnedAlert({
  approval,
  action,
  className,
}: {
  approval: Pick<ApprovalBlock, "returned"> | null | undefined;
  /** CTA(s) del banner — se renderizan en DetailAlertCard.action. */
  action?: ReactNode;
  className?: string;
}) {
  const summary = formatReturnedSummary(approval?.returned);
  return (
    <DetailAlertCard
      severity="warning"
      icon={<Undo2 className="h-4 w-4" />}
      title={copy.returnedAlertTitle}
      className={className}
      action={action}
    >
      {summary ? <p>{summary}</p> : null}
    </DetailAlertCard>
  );
}
