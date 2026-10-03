import type { ReactNode } from "react";
import { Undo2 } from "lucide-react";
import { DetailAlertCard } from "@shared/ui/data-display";
import type { ApprovalBlock } from "../../domain";
import { approvalsCopy } from "../copy/approvalsCopy";
import { formatReturnedSummary } from "../utils/approvalFlowFormat";

const copy = approvalsCopy.flow;

/**
 * Alerta «Devuelta para corregir» en el registro (handoff F6 D15). Las
 * acciones («Corregir y reenviar», …) las pone la superficie anfitriona.
 */
export function ReturnedAlert({
  approval,
  actions,
  className,
}: {
  approval: Pick<ApprovalBlock, "returned"> | null | undefined;
  actions?: ReactNode;
  className?: string;
}) {
  const summary = formatReturnedSummary(approval?.returned);
  return (
    <DetailAlertCard
      severity="warning"
      icon={<Undo2 className="h-4 w-4" />}
      title={copy.returnedAlertTitle}
      className={className}
    >
      {summary ? <p>{summary}</p> : null}
      {actions ? <div className="mt-2 flex flex-wrap gap-2">{actions}</div> : null}
    </DetailAlertCard>
  );
}
