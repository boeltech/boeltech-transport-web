import type { CompensationTemplate } from "../../domain/entities";
import { compensationCopy } from "../copy/compensationCopy";

/** Estado de presentación de una versión; el enum de la API no cambia. */
export type TemplateDisplayStatus =
  | "draft"
  | "active"
  | "superseded"
  | "deactivated"
  | "inactive_unknown";

type DisplayStatusInput = Pick<CompensationTemplate, "inactiveReason"> &
  Partial<Pick<CompensationTemplate, "status" | "isActive">>;

export function getTemplateDisplayStatus(template: DisplayStatusInput): TemplateDisplayStatus {
  const status = template.status ?? (template.isActive ? "active" : "inactive");
  if (status === "draft") return "draft";
  if (status === "active") return "active";
  if (template.inactiveReason === "superseded") return "superseded";
  if (template.inactiveReason === "manual" || template.inactiveReason === null) {
    return "deactivated";
  }
  return "inactive_unknown";
}

const statusCopy = compensationCopy.templates.status;

export const TEMPLATE_DISPLAY_STATUS_LABELS: Record<TemplateDisplayStatus, string> = {
  draft: statusCopy.draft,
  active: statusCopy.active,
  superseded: statusCopy.superseded,
  deactivated: statusCopy.deactivated,
  inactive_unknown: statusCopy.inactive,
};

export function getTemplateDisplayStatusLabel(template: DisplayStatusInput): string {
  return TEMPLATE_DISPLAY_STATUS_LABELS[getTemplateDisplayStatus(template)];
}

/** Configuración bloqueada porque la versión fue reemplazada (no por uso en pagos). */
export function isTemplateLockedBySupersede(
  template: Pick<CompensationTemplate, "lockedForEdit" | "lockedReason" | "inactiveReason">,
): boolean {
  return (
    template.lockedForEdit &&
    (template.lockedReason === "superseded" || template.inactiveReason === "superseded")
  );
}

/** Versión activa hoy de la familia; si hubiera varias, la de número mayor. */
export function pickActiveTemplateVersion<T extends Pick<CompensationTemplate, "status" | "version">>(
  versions: readonly T[] | undefined,
): T | null {
  let picked: T | null = null;
  for (const version of versions ?? []) {
    if (version.status !== "active") continue;
    if (!picked || version.version > picked.version) picked = version;
  }
  return picked;
}
