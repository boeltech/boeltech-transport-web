import type { CompensationTemplate } from "../../domain/entities";
import type {
  BuilderSectionId,
  BuilderSectionStatus,
  TemplateCompleteness,
  TemplateCompletenessStep,
  TemplateUsageStatus,
} from "./templateCompositionTypes";

const ROUTE_TYPES = ["long_haul", "local", "transfer"] as const;

function statusFromCount(count: number): BuilderSectionStatus {
  return count > 0 ? "complete" : "empty";
}

function tripsStatus(
  template: Pick<
    CompensationTemplate,
    "rules" | "corridorIds" | "salaryOnly"
  >,
): BuilderSectionStatus {
  if (template.salaryOnly) return "complete";
  const hasCorridors = template.corridorIds.length > 0;
  const covered = new Set(template.rules.map((rule) => rule.routeType));
  const ruleCount = template.rules.length;
  if (!hasCorridors && ruleCount === 0) return "empty";
  if (hasCorridors && ROUTE_TYPES.every((type) => covered.has(type))) {
    return "complete";
  }
  if (ruleCount === ROUTE_TYPES.length && !hasCorridors) return "complete";
  if (hasCorridors || ruleCount > 0) return "partial";
  return "empty";
}

export function getTemplateSectionStatuses(
  template: Pick<
    CompensationTemplate,
    "name" | "rules" | "fixedAllowances" | "corridorIds" | "deductions" | "salaryOnly"
  >,
): Record<BuilderSectionId, BuilderSectionStatus> {
  return {
    trips: tripsStatus(template),
    allowances: statusFromCount(template.fixedAllowances.length),
    deductions: statusFromCount((template.deductions ?? []).length),
  };
}

export function isTemplateActivatableClient(
  template: Pick<
    CompensationTemplate,
    "rules" | "corridorIds" | "salaryOnly" | "paymentPeriod"
  >,
): boolean {
  if (template.salaryOnly) {
    return Boolean(template.paymentPeriod);
  }
  return template.rules.length > 0 || template.corridorIds.length > 0;
}

export function getTemplateCompleteness(
  template: CompensationTemplate,
): TemplateCompleteness {
  const isComplete = isTemplateActivatableClient(template);

  const missingSteps: TemplateCompletenessStep[] = [];

  if (template.rules.length === 0) {
    missingSteps.push("rules");
  }

  if (template.corridorIds.length === 0) {
    missingSteps.push("corridors");
  }

  return {
    isComplete,
    missingSteps: isComplete ? [] : missingSteps,
    sectionStatuses: getTemplateSectionStatuses(template),
  };
}

/** Uso al armar el pago (listado). Misma regla de completeness: rules OR corridors OR salaryOnly. */
export function getTemplateUsageStatus(
  template: Pick<
    CompensationTemplate,
    | "status"
    | "isActive"
    | "rules"
    | "corridorIds"
    | "inactiveReason"
    | "salaryOnly"
    | "paymentPeriod"
  >,
): TemplateUsageStatus {
  const status =
    template.status ?? (template.isActive ? "active" : "inactive");
  const isComplete = isTemplateActivatableClient(template);

  if (status === "inactive") {
    return template.inactiveReason === "superseded" ? "superseded_paying" : "paused";
  }
  if (!isComplete) {
    return "needs_payment";
  }
  if (status === "draft") {
    return "ready_to_activate";
  }
  return "ready";
}
