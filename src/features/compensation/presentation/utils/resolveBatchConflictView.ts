import { COMPENSATION_ERROR_CODES } from "../../domain/enums";
import type {
  BatchAssignmentConflict,
  PeriodMismatchItem,
} from "../../domain/entities";
import type { FixedAllowancePeriod } from "../../domain/enums";

export type BatchConflictKind =
  | "D3"
  | "D4"
  | "D5"
  | "D6-close"
  | "D6-dates"
  | "D7"
  | "D8"
  | "D9-period";

/** Solo ajustan el formulario; nunca guardan (PRD D2). */
export type BatchConflictPrimaryAction =
  | { type: "assign-from"; employeeId: string; effectiveFrom: string }
  | { type: "mark-close-previous" };

export type BatchConflictLink =
  | {
      type: "other-template";
      employeeId: string;
      assignmentId: string;
      templateId: string;
      templateName: string;
      templateVersion: number;
    }
  | { type: "same-template"; employeeId: string; assignmentId: string; templateId: string };

export interface BatchConflictExisting {
  templateName: string;
  templateVersion: number;
  effectiveFrom: string;
  effectiveTo: string | null;
}

type AssignFromAction = Extract<BatchConflictPrimaryAction, { type: "assign-from" }>;
type OtherTemplateLink = Extract<BatchConflictLink, { type: "other-template" }>;
type SameTemplateLink = Extract<BatchConflictLink, { type: "same-template" }>;

export type BatchConflictView =
  | {
      kind: "D3";
      existing: BatchConflictExisting;
      newEffectiveFrom: string;
      nextEffectiveFrom: string;
      primaryAction: AssignFromAction;
      link?: OtherTemplateLink;
    }
  | {
      kind: "D4";
      existing: BatchConflictExisting;
      newEffectiveFrom: string;
      link?: OtherTemplateLink;
    }
  | { kind: "D5"; existing: BatchConflictExisting; link?: SameTemplateLink }
  | {
      kind: "D6-close";
      existing: BatchConflictExisting;
      closePreviousOn: string;
      primaryAction: Extract<BatchConflictPrimaryAction, { type: "mark-close-previous" }>;
    }
  | {
      kind: "D6-dates";
      existing: BatchConflictExisting;
      newEffectiveFrom: string;
      nextEffectiveFrom?: string;
      primaryAction?: AssignFromAction;
      link?: OtherTemplateLink;
    }
  | { kind: "D7"; primaryAction?: AssignFromAction }
  | { kind: "D8" }
  | {
      kind: "D9-period";
      employeeId: string;
      employeeSalaryType: FixedAllowancePeriod | null;
      mismatches: PeriodMismatchItem[];
    };

export interface BatchConflictViewContext {
  /** Versión en la que se está asignando el lote. */
  templateId: string;
  /** «Vigente desde» con el que se evaluó el conflicto. */
  newEffectiveFrom: string;
}

/** Elige el renglón (PRD D3–D8 · api#60 D9-period) y sus salidas (D18) para un operador omitido. */
export function resolveBatchConflictView(
  conflict: BatchAssignmentConflict,
  { templateId, newEffectiveFrom }: BatchConflictViewContext,
): BatchConflictView {
  const existing = readExisting(conflict);
  const assignFrom = conflict.suggestedEffectiveFrom
    ? ({
        type: "assign-from",
        employeeId: conflict.employeeId,
        effectiveFrom: conflict.suggestedEffectiveFrom,
      } as const)
    : undefined;

  if (existing && conflict.existingTemplateId === templateId) {
    return {
      kind: "D5",
      existing,
      link: conflict.existingAssignmentId
        ? {
            type: "same-template",
            employeeId: conflict.employeeId,
            assignmentId: conflict.existingAssignmentId,
            templateId,
          }
        : undefined,
    };
  }

  if (
    conflict.reason === "period_settled" ||
    conflict.code === COMPENSATION_ERROR_CODES.ASSIGNMENT_PERIOD_SETTLED
  ) {
    return { kind: "D7", primaryAction: assignFrom };
  }

  if (
    conflict.reason === "period_mismatch" ||
    conflict.code === COMPENSATION_ERROR_CODES.COMPENSATION_PERIOD_MISMATCH
  ) {
    return {
      kind: "D9-period",
      employeeId: conflict.employeeId,
      employeeSalaryType: conflict.employeeSalaryType ?? null,
      mismatches: conflict.mismatches ?? [],
    };
  }

  if (!existing) return { kind: "D8" };

  const link = otherTemplateLink(conflict, existing);

  if (conflict.reason === "previous_starts_on_or_after") {
    if (existing.effectiveTo && assignFrom) {
      return {
        kind: "D3",
        existing,
        newEffectiveFrom,
        nextEffectiveFrom: assignFrom.effectiveFrom,
        primaryAction: assignFrom,
        link,
      };
    }
    return { kind: "D4", existing, newEffectiveFrom, link };
  }

  if (conflict.reason === "overlap_close_disabled") {
    if (conflict.closePreviousOn) {
      return {
        kind: "D6-close",
        existing,
        closePreviousOn: conflict.closePreviousOn,
        primaryAction: { type: "mark-close-previous" },
      };
    }
    const closedWithNext = existing.effectiveTo && assignFrom ? assignFrom : undefined;
    return {
      kind: "D6-dates",
      existing,
      newEffectiveFrom,
      nextEffectiveFrom: closedWithNext?.effectiveFrom,
      primaryAction: closedWithNext,
      link,
    };
  }

  return { kind: "D8" };
}

function readExisting(conflict: BatchAssignmentConflict): BatchConflictExisting | null {
  const templateName = conflict.existingTemplateName?.trim();
  const templateVersion = conflict.existingTemplateVersion;
  const effectiveFrom = conflict.existingEffectiveFrom;
  if (!templateName || templateVersion == null || !effectiveFrom) return null;
  return {
    templateName,
    templateVersion,
    effectiveFrom,
    effectiveTo: conflict.existingEffectiveTo ?? null,
  };
}

function otherTemplateLink(
  conflict: BatchAssignmentConflict,
  existing: BatchConflictExisting,
): OtherTemplateLink | undefined {
  if (!conflict.existingAssignmentId || !conflict.existingTemplateId) return undefined;
  return {
    type: "other-template",
    employeeId: conflict.employeeId,
    assignmentId: conflict.existingAssignmentId,
    templateId: conflict.existingTemplateId,
    templateName: existing.templateName,
    templateVersion: existing.templateVersion,
  };
}
