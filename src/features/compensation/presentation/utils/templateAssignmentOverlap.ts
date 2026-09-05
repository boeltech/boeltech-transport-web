import type { TemplateAssignment } from "../../domain/entities";

const OPEN_ENDED_DATE = "9999-12-31";

function periodEndDate(effectiveTo: string | null | undefined): string {
  return effectiveTo?.trim() ? effectiveTo.trim() : OPEN_ENDED_DATE;
}

export function doAssignmentPeriodsOverlap(
  left: { effectiveFrom: string; effectiveTo?: string | null },
  right: { effectiveFrom: string; effectiveTo?: string | null },
): boolean {
  return (
    left.effectiveFrom <= periodEndDate(right.effectiveTo) &&
    right.effectiveFrom <= periodEndDate(left.effectiveTo)
  );
}

export function findOverlappingAssignmentsForEmployee(
  assignments: readonly TemplateAssignment[],
  params: {
    employeeId: string;
    effectiveFrom: string;
    effectiveTo?: string | null;
    excludeAssignmentId?: string;
  },
): TemplateAssignment[] {
  const probe = {
    effectiveFrom: params.effectiveFrom,
    effectiveTo: params.effectiveTo?.trim() ? params.effectiveTo.trim() : null,
  };

  return assignments.filter((existing) => {
    if (existing.employeeId !== params.employeeId) return false;
    if (!existing.isActive) return false;
    if (params.excludeAssignmentId && existing.id === params.excludeAssignmentId) {
      return false;
    }
    return doAssignmentPeriodsOverlap(existing, probe);
  });
}

export function previewBatchAssignmentConflicts(
  allAssignments: readonly TemplateAssignment[],
  employeeIds: string[],
  effectiveFrom: string,
  effectiveTo?: string | null,
): Array<{ employeeId: string; assignment: TemplateAssignment }> {
  const conflicts: Array<{ employeeId: string; assignment: TemplateAssignment }> = [];

  for (const employeeId of employeeIds) {
    const overlapping = findOverlappingAssignmentsForEmployee(allAssignments, {
      employeeId,
      effectiveFrom,
      effectiveTo,
    });
    const first = overlapping[0];
    if (first) {
      conflicts.push({ employeeId, assignment: first });
    }
  }

  return conflicts;
}

/** Asignación elegible en una fecha: activa + vigente ese día. */
export function isAssignmentEligibleOnDate(
  assignment: Pick<TemplateAssignment, "isActive" | "effectiveFrom" | "effectiveTo">,
  date: string,
): boolean {
  if (!assignment.isActive) return false;
  if (assignment.effectiveFrom > date) return false;
  if (assignment.effectiveTo && assignment.effectiveTo < date) return false;
  return true;
}

export function findEligibleAssignmentsForEmployeeOnDate(
  assignments: readonly TemplateAssignment[],
  employeeId: string,
  date: string,
): TemplateAssignment[] {
  return assignments.filter(
    (assignment) =>
      assignment.employeeId === employeeId && isAssignmentEligibleOnDate(assignment, date),
  );
}

/** Misma regla que preview API: effective_from DESC, created_at DESC. */
export function pickAssignmentBySettlementTiebreak(
  candidates: readonly TemplateAssignment[],
): TemplateAssignment | null {
  if (candidates.length === 0) return null;

  const sorted = [...candidates].sort((left, right) => {
    const fromCompare = right.effectiveFrom.localeCompare(left.effectiveFrom);
    if (fromCompare !== 0) return fromCompare;
    const leftCreated = left.createdAt ?? "";
    const rightCreated = right.createdAt ?? "";
    return rightCreated.localeCompare(leftCreated);
  });

  return sorted[0] ?? null;
}
