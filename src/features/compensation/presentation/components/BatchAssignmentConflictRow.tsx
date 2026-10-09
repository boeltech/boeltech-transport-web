import { Button } from "@shared/ui/button";
import { formatDate } from "@shared/utils/dateUtils";
import type { BatchAssignmentConflict } from "../../domain/entities";
import { compensationCopy } from "../copy/compensationCopy";
import type {
  BatchConflictExisting,
  BatchConflictLink,
  BatchConflictPrimaryAction,
  BatchConflictView,
} from "../utils/resolveBatchConflictView";

const copy = compensationCopy.batchAssignment;
const conflictCopy = copy.conflicts;

interface BatchAssignmentConflictRowProps {
  conflict: BatchAssignmentConflict;
  view: BatchConflictView;
  employeeName: string;
  onPrimaryAction: (action: BatchConflictPrimaryAction) => void;
  /** Sin él no se muestra el enlace a la asignación que bloquea. */
  onOpenLink?: (link: BatchConflictLink) => void;
}

/** Renglón de operador omitido (PRD D1), igual en vista previa y en resultado. */
export function BatchAssignmentConflictRow({
  conflict,
  view,
  employeeName,
  onPrimaryAction,
  onOpenLink,
}: BatchAssignmentConflictRowProps) {
  const { cause, action } = describeConflict(view, conflict);
  const primaryAction = "primaryAction" in view ? view.primaryAction : undefined;
  const link = onOpenLink && "link" in view ? view.link : undefined;

  return (
    <li className="space-y-1" data-testid="batch-conflict-row" data-kind={view.kind}>
      <p className="font-semibold text-foreground">{employeeName}</p>
      {cause ? <p>{cause}</p> : null}
      {action ? <p>{action}</p> : null}
      {primaryAction || link ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
          {primaryAction ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPrimaryAction(primaryAction)}
            >
              {primaryAction.type === "assign-from"
                ? conflictCopy.assignFrom(employeeName, formatDate(primaryAction.effectiveFrom))
                : conflictCopy.markClosePrevious}
            </Button>
          ) : null}
          {link ? (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto px-0"
              onClick={() => onOpenLink?.(link)}
            >
              {link.type === "other-template"
                ? conflictCopy.goToAssignment(
                    copy.templateVersion(link.templateName, link.templateVersion),
                  )
                : conflictCopy.viewOwnAssignment}
            </Button>
          ) : null}
        </div>
      ) : null}
      {link?.type === "other-template" ? (
        <p className="text-xs text-muted-foreground">{conflictCopy.goToAssignmentHelp}</p>
      ) : null}
    </li>
  );
}

function describeConflict(
  view: BatchConflictView,
  conflict: BatchAssignmentConflict,
): { cause: string; action?: string } {
  const message = conflict.message?.trim() || undefined;
  switch (view.kind) {
    case "D3":
      return {
        cause: conflictCopy.previousStartsCause(templateLabel(view.existing), periodLabel(view.existing)),
        action: conflictCopy.previousClosedAction(
          formatDate(view.nextEffectiveFrom),
          formatDate(view.newEffectiveFrom),
          templateLabel(view.existing),
        ),
      };
    case "D4":
      return {
        cause: conflictCopy.previousStartsCause(templateLabel(view.existing), periodLabel(view.existing)),
        action: previousOpenAction(view.existing, view.newEffectiveFrom),
      };
    case "D5":
      return {
        cause: conflictCopy.sameTemplateCause(periodLabel(view.existing)),
        action: conflictCopy.sameTemplateAction,
      };
    case "D6-close":
      return {
        cause: conflictCopy.overlapCause(templateLabel(view.existing), periodLabel(view.existing)),
        action: conflictCopy.overlapCloseAction(formatDate(view.closePreviousOn)),
      };
    case "D6-dates":
      return {
        cause: conflictCopy.overlapCause(templateLabel(view.existing), periodLabel(view.existing)),
        action: view.nextEffectiveFrom
          ? conflictCopy.previousClosedAction(
              formatDate(view.nextEffectiveFrom),
              formatDate(view.newEffectiveFrom),
              templateLabel(view.existing),
            )
          : previousOpenAction(view.existing, view.newEffectiveFrom),
      };
    case "D7":
      return { cause: conflictCopy.settledCause, action: message };
    case "D8":
      return { cause: message ?? conflictCopy.unknownMessage };
  }
}

function previousOpenAction(existing: BatchConflictExisting, newEffectiveFrom: string): string {
  return conflictCopy.previousOpenAction(
    formatDate(existing.effectiveFrom),
    formatDate(newEffectiveFrom),
    templateLabel(existing),
  );
}

function templateLabel(existing: BatchConflictExisting): string {
  return copy.templateVersion(existing.templateName, existing.templateVersion);
}

function periodLabel(existing: BatchConflictExisting): string {
  return existing.effectiveTo
    ? copy.closedPeriod(formatDate(existing.effectiveFrom), formatDate(existing.effectiveTo))
    : copy.openPeriod(formatDate(existing.effectiveFrom));
}
