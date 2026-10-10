import type { CompensationTemplate } from "../../domain/entities";
import { getTemplateDisplayStatus } from "./getTemplateDisplayStatus";

/** Marca el control que recibe el foco al cerrar el panel de Operadores de esa versión. */
export const TEMPLATE_FOCUS_ATTRIBUTE = "data-template-focus-id";

export function findTemplateFocusTarget(templateId: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[${TEMPLATE_FOCUS_ATTRIBUTE}="${templateId}"]`);
}

/** Reemplazadas y desactivadas se atenúan (PRD D11). */
export function isTemplateDimmed(template: CompensationTemplate): boolean {
  const displayStatus = getTemplateDisplayStatus(template);
  return displayStatus !== "draft" && displayStatus !== "active";
}
