import type { CompensationTemplate } from "../../domain/entities";
import { compensationCopy } from "../copy/compensationCopy";
import { getTemplateDisplayStatus } from "./getTemplateDisplayStatus";

const lineCopy = compensationCopy.templates.statusLine;

type StatusLineInput = Pick<
  CompensationTemplate,
  | "status"
  | "isActive"
  | "inactiveReason"
  | "rules"
  | "corridorIds"
  | "activeAssignmentsCount"
  | "scheduledAssignmentsCount"
>;

/** Línea gris bajo la insignia de Estado del listado; `null` cuando no aporta (PRD D10). */
export function getTemplateStatusLine(template: StatusLineInput): string | null {
  const displayStatus = getTemplateDisplayStatus(template);
  const hasPayment = template.rules.length > 0 || template.corridorIds.length > 0;

  switch (displayStatus) {
    case "draft":
      return hasPayment ? lineCopy.readyToActivate : lineCopy.needsPayment;
    case "active":
      return hasPayment ? null : lineCopy.needsPayment;
    case "superseded": {
      const current = template.activeAssignmentsCount ?? 0;
      if (current > 0) return lineCopy.supersededPaying(current);
      const scheduled = template.scheduledAssignmentsCount ?? 0;
      return scheduled > 0
        ? lineCopy.supersededScheduled(scheduled)
        : lineCopy.supersededNone;
    }
    case "deactivated":
      return lineCopy.deactivated;
    case "inactive_unknown":
      return null;
  }
}

export interface FamilySupersededOperators {
  total: number;
  current: number;
  scheduled: number;
}

/**
 * Operadores que siguen en otras versiones reemplazadas de la familia (PRD D18). Solo en la
 * fila activa del listado agrupado; en otros estados manda la línea de D10.
 */
export function getFamilySupersededOperators(
  template: Pick<CompensationTemplate, "status" | "isActive" | "inactiveReason" | "family">,
): FamilySupersededOperators | null {
  if (!template.family || getTemplateDisplayStatus(template) !== "active") return null;
  const current = template.family.supersededActiveAssignmentsCount;
  const scheduled = template.family.supersededScheduledAssignmentsCount;
  const total = current + scheduled;
  return total > 0 ? { total, current, scheduled } : null;
}
