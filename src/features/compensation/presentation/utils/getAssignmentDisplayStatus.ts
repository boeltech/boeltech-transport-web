import { getTodayString } from "@shared/utils/dateUtils";
import type { TemplateAssignment } from "../../domain/entities";

/**
 * Estado de una asignación contra hoy (CDMX). Misma partición que los conteos de la API:
 * «Vigente» = `active_assignments_count`, «Programada» = `scheduled_assignments_count`.
 */
export type AssignmentDisplayStatus = "current" | "scheduled" | "concluded" | "deactivated";

type AssignmentStatusInput = Pick<TemplateAssignment, "isActive" | "effectiveFrom" | "effectiveTo">;

export function getAssignmentDisplayStatus(
  assignment: AssignmentStatusInput,
  today: string = getTodayString(),
): AssignmentDisplayStatus {
  if (!assignment.isActive) return "deactivated";
  const effectiveTo = assignment.effectiveTo?.slice(0, 10);
  if (effectiveTo && effectiveTo < today) return "concluded";
  if (assignment.effectiveFrom.slice(0, 10) > today) return "scheduled";
  return "current";
}
