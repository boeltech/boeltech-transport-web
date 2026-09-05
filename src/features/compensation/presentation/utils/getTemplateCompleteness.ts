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
  return {
    payment: statusFromCount(template.rules.length),
    allowances: statusFromCount(template.fixedAllowances.length),
    corridors: statusFromCount(template.corridorIds.length),
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

/** Uso al liquidar (listado). Misma regla de completeness: rules OR corridors. */
export function getTemplateUsageStatus(
  template: Pick<CompensationTemplate, "isActive" | "rules" | "corridorIds">,
): TemplateUsageStatus {
  if (!template.isActive) {
    return "paused";
  }
  const isComplete =
    template.rules.length > 0 || template.corridorIds.length > 0;
  if (!isComplete) {
    return "needs_payment";
  }
  return "ready";
}
