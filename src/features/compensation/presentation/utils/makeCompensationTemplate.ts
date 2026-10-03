import type { CompensationTemplate } from "../../domain/entities";
import type { CompensationTemplateStatus } from "../../domain/enums";

/** Fixture mínimo con campos de lifecycle (Fase 3). */
export function makeCompensationTemplate(
  overrides: Partial<CompensationTemplate> & Pick<CompensationTemplate, "id" | "name">,
): CompensationTemplate {
  const status: CompensationTemplateStatus =
    overrides.status ??
    (overrides.isActive === false ? "inactive" : "active");

  return {
    description: null,
    version: 1,
    supersedesTemplateId: null,
    lockedForEdit: false,
    rules: [],
    fixedAllowances: [],
    deductions: [],
    corridorIds: [],
    corridors: [],
    activeAssignmentsCount: 0,
    ...overrides,
    isActive: (overrides.status ?? status) === "active",
    status: overrides.status ?? status,
    familyId: overrides.familyId ?? overrides.id,
  };
}
