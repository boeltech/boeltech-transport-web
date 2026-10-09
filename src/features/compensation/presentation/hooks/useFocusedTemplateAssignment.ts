import { useTemplateAssignment, useTemplateAssignments } from "../../application/hooks";
import type { TemplateAssignment } from "../../domain/entities";

/** Página del sheet de operadores; la asignación enfocada puede quedar fuera (TEC C12). */
export const TEMPLATE_OPERATORS_PAGE_SIZE = 100;

export type FocusedTemplateAssignment =
  | { status: "none" }
  | { status: "loading" }
  | { status: "found"; assignment: TemplateAssignment; inPage: boolean }
  | { status: "missing" };

/**
 * Asignación del parámetro `focus` (PRD D20/D21): primero en la página del sheet; si no
 * está, se pide por id. De otra plantilla o inexistente → «missing».
 */
export function useFocusedTemplateAssignment(
  templateId: string | undefined,
  focusId: string | undefined,
): FocusedTemplateAssignment {
  const page = useTemplateAssignments({
    templateId,
    pageSize: TEMPLATE_OPERATORS_PAGE_SIZE,
    enabled: Boolean(templateId),
  });
  const inPage = focusId ? page.data?.data.find((row) => row.id === focusId) : undefined;
  const byId = useTemplateAssignment(focusId, {
    enabled: Boolean(templateId && focusId && page.isSuccess && !inPage),
  });

  if (!templateId || !focusId) return { status: "none" };
  if (inPage) return { status: "found", assignment: inPage, inPage: true };
  if (page.isError) return { status: "missing" };
  if (!page.isSuccess) return { status: "loading" };
  if (byId.data) {
    return byId.data.templateId === templateId
      ? { status: "found", assignment: byId.data, inPage: false }
      : { status: "missing" };
  }
  if (byId.isError) return { status: "missing" };
  return { status: "loading" };
}
