import type { HubReadinessItem } from "@shared/ui/page-shells";
import { getTodayString } from "@shared/utils/dateUtils";
import type { CompensationTemplate } from "../../domain/entities";
import {
  COMPENSATION_CORRIDORS_PATH,
  COMPENSATION_TEMPLATES_PATH,
  compensationTemplateBuildPath,
  compensationTemplateOperatorsPath,
} from "../compensationRoutes";
import { getTemplateCompleteness } from "../../presentation/utils/getTemplateCompleteness";
import { compensationCopy } from "../../presentation/copy/compensationCopy";
import { useCompensationTemplates } from "./useTemplates";
import { useCorridorTariffs } from "./useCorridors";
import { useTemplateAssignments } from "./useAssignments";

const copy = compensationCopy.hub.readiness;

/** Máximo de plantillas activas a evaluar client-side (v1; summary API post-v1). */
export const COMPENSATION_READINESS_TEMPLATES_PAGE_SIZE = 200;

export interface CompensationReadiness {
  items: HubReadinessItem[];
  isReady: boolean;
  isLoading: boolean;
}

export interface BuildCompensationReadinessInput {
  templates: CompensationTemplate[];
  templatesTotal: number;
  corridorsTotal: number;
  assignmentsTotal: number;
}

/**
 * Deriva chips de readiness (cero React).
 * Cutover mínimo: templates_active ≥ 1 ∧ assignments_active ≥ 1.
 */
export function buildCompensationReadinessItems(
  input: BuildCompensationReadinessInput,
): { items: HubReadinessItem[]; isReady: boolean } {
  const incompleteTemplates = input.templates.filter(
    (template) => !getTemplateCompleteness(template).isComplete,
  );
  const incompleteCount = incompleteTemplates.length;
  const firstIncompleteId = incompleteTemplates[0]?.id;
  const firstTemplateId = input.templates[0]?.id;

  const templatesActive = input.templatesTotal;
  const corridorsActive = input.corridorsTotal;
  const assignmentsActive = input.assignmentsTotal;

  const items: HubReadinessItem[] = [
    {
      id: "templates_active",
      label: copy.templatesActiveLabel,
      value: templatesActive,
      status: templatesActive >= 1 ? "ok" : "empty",
      href: COMPENSATION_TEMPLATES_PATH,
    },
    {
      id: "templates_incomplete",
      label: copy.templatesIncompleteLabel,
      value: incompleteCount,
      status: incompleteCount === 0 ? "ok" : "warn",
      href:
        firstIncompleteId != null
          ? compensationTemplateBuildPath(firstIncompleteId)
          : COMPENSATION_TEMPLATES_PATH,
    },
    {
      id: "corridors_active",
      label: copy.corridorsActiveLabel,
      value: corridorsActive,
      status: "info",
      href: COMPENSATION_CORRIDORS_PATH,
    },
    {
      id: "assignments_active",
      label: copy.assignmentsActiveLabel,
      value: assignmentsActive,
      status: assignmentsActive >= 1 ? "ok" : "empty",
      href:
        firstTemplateId != null
          ? compensationTemplateOperatorsPath(firstTemplateId)
          : COMPENSATION_TEMPLATES_PATH,
    },
  ];

  const isReady = templatesActive >= 1 && assignmentsActive >= 1;

  return { items, isReady };
}

export function useCompensationReadiness(): CompensationReadiness {
  const today = getTodayString();

  const templatesQuery = useCompensationTemplates({
    isActive: true,
    page: 1,
    pageSize: COMPENSATION_READINESS_TEMPLATES_PAGE_SIZE,
  });

  const corridorsQuery = useCorridorTariffs({
    isActive: true,
    page: 1,
    pageSize: 1,
  });

  const assignmentsQuery = useTemplateAssignments({
    activeOn: today,
    page: 1,
    pageSize: 1,
  });

  const templates = templatesQuery.data?.data ?? [];
  const templatesTotal =
    templatesQuery.data?.pagination?.total ?? templates.length;
  const corridorsTotal =
    corridorsQuery.data?.pagination?.total ??
    corridorsQuery.data?.data?.length ??
    0;
  const assignmentsTotal =
    assignmentsQuery.data?.pagination?.total ??
    assignmentsQuery.data?.data?.length ??
    0;

  const { items, isReady } = buildCompensationReadinessItems({
    templates,
    templatesTotal,
    corridorsTotal,
    assignmentsTotal,
  });

  const isLoading =
    templatesQuery.isLoading ||
    corridorsQuery.isLoading ||
    assignmentsQuery.isLoading;

  return { items, isReady, isLoading };
}
