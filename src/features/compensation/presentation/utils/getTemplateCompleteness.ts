import type { CompensationTemplate } from "../../domain/entities";
import type {
  BuilderSectionId,
  BuilderSectionStatus,
  TemplateCompleteness,
  TemplateCompletenessStep,
  TemplateUsageStatus,
} from "./templateCompositionTypes";

function statusFromCount(count: number): BuilderSectionStatus {
  return count > 0 ? "complete" : "empty";
}

export function getTemplateSectionStatuses(
  template: Pick<
    CompensationTemplate,
    "name" | "rules" | "fixedAllowances" | "corridorIds"
  >,
): Record<BuilderSectionId, BuilderSectionStatus> {
  const payment = statusFromCount(template.rules.length);
  const allowances = statusFromCount(template.fixedAllowances.length);
  const corridors = statusFromCount(template.corridorIds.length);

  return {
    payment,
    allowances,
    corridors,
  };
}

export function getTemplateCompleteness(
  template: CompensationTemplate,
): TemplateCompleteness {
  const hasRules = template.rules.length > 0;
  const hasCorridors = template.corridorIds.length > 0;
  const isComplete = hasRules || hasCorridors;

  const missingSteps: TemplateCompletenessStep[] = [];

  if (!hasRules) {
    missingSteps.push("rules");
  }

  if (!hasCorridors) {
    missingSteps.push("corridors");
  }

  return {
    isComplete,
    missingSteps: isComplete ? [] : missingSteps,
    sectionStatuses: getTemplateSectionStatuses(template),
  };
}

/** Uso al armar el pago (listado). Misma regla de completeness: rules OR corridors. */
export function getTemplateUsageStatus(
  template: Pick<
    CompensationTemplate,
    "status" | "isActive" | "rules" | "corridorIds"
  >,
): TemplateUsageStatus {
  const status =
    template.status ?? (template.isActive ? "active" : "inactive");
  const isComplete =
    template.rules.length > 0 || template.corridorIds.length > 0;

  if (status === "inactive") {
    return "paused";
  }
  if (!isComplete) {
    return "needs_payment";
  }
  if (status === "draft") {
    return "ready_to_activate";
  }
  return "ready";
}
