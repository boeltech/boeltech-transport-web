import type { CompensationCalculationType } from "../../domain/enums";

/**
 * v1 inferencia sin `participation_role` en API: muestra badge "Apoyo" cuando
 * la regla aplicada o el acuerdo sugieren compensación de ayudante (tarifa diaria).
 */
export function shouldShowSupportParticipationBadge(
  appliedRule?: string | null,
  agreementCalculationType?: CompensationCalculationType | string | null,
): boolean {
  const rule = appliedRule?.toLowerCase() ?? "";
  if (rule.includes("tarifa diaria")) {
    return true;
  }
  return agreementCalculationType === "fixed_daily_rate";
}
