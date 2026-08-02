/**
 * Deep-link del wizard de edición completa (5 pasos).
 * Query `step` es 1-based como el stepper visible (2 = Ruta, 3 = Cargas).
 */

/** Índice 0-based del paso, o 0 si ausente/inválido. */
export function parseTripWizardStepParam(
  raw: string | null | undefined,
): number {
  if (raw == null || raw.trim() === "") return 0;
  const normalized = raw.trim().toLowerCase();

  if (normalized === "route" || normalized === "2") return 1;
  if (normalized === "cargo" || normalized === "3") return 2;
  if (normalized === "info" || normalized === "1") return 0;
  if (normalized === "costs" || normalized === "4") return 3;
  if (normalized === "summary" || normalized === "5") return 4;

  const asNumber = Number(normalized);
  if (Number.isInteger(asNumber) && asNumber >= 1 && asNumber <= 5) {
    return asNumber - 1;
  }

  return 0;
}
