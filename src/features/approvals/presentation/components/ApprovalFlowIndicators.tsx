import { Badge } from "@shared/ui/badge";
import { HintIcon } from "@shared/ui/hint-icon";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@shared/ui/tooltip";
import { formatDate } from "@shared/utils/dateUtils";
import {
  isMultiStepApproval,
  showsApprovalPolicySignals,
  type ApprovalActionUi,
  type ApprovalBlock,
} from "../../domain";
import { approvalsCopy } from "../copy/approvalsCopy";
import {
  formatFieldChanges,
  formatPendingFor,
  formatSignedLine,
  formatWhyTooltip,
} from "../utils/approvalFlowFormat";
import { OwnRequestChip } from "./SelfApprovalIndicators";

const copy = approvalsCopy.flow;

type FlowChipVariant = "neutral" | "info" | "warning" | "destructive";

function FlowChip({
  label,
  tooltip,
  variant = "neutral",
}: {
  label: string;
  tooltip?: string;
  variant?: FlowChipVariant;
}) {
  const badge = (
    <Badge variant={variant} tone="soft" className="whitespace-nowrap">
      {label}
    </Badge>
  );
  if (!tooltip) return badge;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {badge}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

export function ReturnedChip({ approval }: { approval: ApprovalBlock | null | undefined }) {
  const returned = approval?.returned;
  const reasonLabel = returned?.reasonCode
    ? (approvalsCopy.returnSheet.reasonCodes as Record<string, string>)[returned.reasonCode]
    : null;
  const reason = [reasonLabel, returned?.reason].filter(Boolean).join(": ") || null;
  return (
    <TooltipProvider delayDuration={200}>
      <FlowChip
        label={copy.returnedChip}
        variant="warning"
        tooltip={copy.returnedTooltip({
          reason,
          by: returned?.returnedByName ?? null,
          date: returned?.returnedAt ? formatDate(returned.returnedAt) : null,
        })}
      />
    </TooltipProvider>
  );
}

/**
 * Líneas de flujo dentro de la celda «Estado» (handoff F6 D6, sin columna nueva).
 * Un paso sin regla propia: no agrega nada (UX5).
 */
export function ApprovalFlowLines({
  approval,
}: {
  approval: ApprovalBlock | null | undefined;
}) {
  if (!approval) return null;
  if (approval.flowStatus === "returned") {
    return (
      <div className="mt-1">
        <ReturnedChip approval={approval} />
      </div>
    );
  }
  const open =
    approval.flowStatus === "in_progress" || approval.flowStatus === "not_started";
  const multiStep = isMultiStepApproval(approval);
  const policySignals = showsApprovalPolicySignals(approval);
  const pendingFor = formatPendingFor(approval.pendingFor);
  const changes = approval.reapproval
    ? formatFieldChanges(approval.reapproval.changes).join(" · ")
    : "";

  const showStepLine = open && multiStep && approval.stepCurrent !== null;
  const showSigned = multiStep && approval.signedSteps.length > 0;
  const showReapproval = open && policySignals && approval.reapproval !== null;
  const showEscalated = open && policySignals && approval.escalated;

  if (!showStepLine && !showSigned && !showReapproval && !showEscalated) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
        {showStepLine ? (
          <div className="flex items-center gap-0.5">
            <span>{copy.stepLine(approval.stepCurrent ?? 1, approval.stepsTotal, pendingFor)}</span>
            <HintIcon label={copy.whyHint} className="h-5 w-5">
              {formatWhyTooltip(approval)}
            </HintIcon>
          </div>
        ) : null}
        {showSigned
          ? approval.signedSteps.map((step) => (
              <div key={`${step.stepNo}-${step.userId ?? "x"}`}>{formatSignedLine(step)}</div>
            ))
          : null}
        {showReapproval || showEscalated ? (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {showReapproval ? (
              <FlowChip
                label={copy.reapprovalChip}
                variant="info"
                tooltip={copy.reapprovalTooltip(changes)}
              />
            ) : null}
            {showEscalated ? (
              <FlowChip
                label={copy.escalatedChip}
                variant="warning"
                tooltip={copy.escalatedTooltip}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </TooltipProvider>
  );
}

/**
 * Chip que sustituye las acciones cuando quien mira no puede decidir.
 * «Devuelta» vive en la celda «Estado» (`ApprovalFlowLines`).
 */
export function ApprovalActionStateChip({ actionUi }: { actionUi: ApprovalActionUi }) {
  switch (actionUi.kind) {
    case "own_blocked":
      return <OwnRequestChip />;
    case "already_signed":
      return (
        <TooltipProvider delayDuration={200}>
          <FlowChip
            label={copy.alreadySignedChip(actionUi.stepNo)}
            tooltip={copy.alreadySignedTooltip}
          />
        </TooltipProvider>
      );
    case "waiting":
      return (
        <TooltipProvider delayDuration={200}>
          <FlowChip label={copy.waitingChip(formatPendingFor(actionUi.pendingFor))} />
        </TooltipProvider>
      );
    case "no_active_eligible":
      return (
        <TooltipProvider delayDuration={200}>
          <FlowChip
            label={copy.noActiveChip}
            variant="destructive"
            tooltip={copy.noActiveTooltip}
          />
        </TooltipProvider>
      );
    default:
      return null;
  }
}
