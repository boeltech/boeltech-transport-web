import type { TemplateAssignment } from "../../domain/entities";

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
