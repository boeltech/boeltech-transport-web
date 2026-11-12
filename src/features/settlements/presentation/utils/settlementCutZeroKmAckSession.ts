/**
 * Persistencia de «Confirmar km» (zero-km ack) por sesión de corte.
 * Clave = periodStart|periodEnd|salaryPeriod — sobrevive remount al salir a Tarifas/Asignar.
 */

export const CUT_ZERO_KM_ACK_STORAGE_PREFIX = "settlements.cut.zeroKmAck.v1";

export function buildCutZeroKmAckStorageKey(params: {
  periodStart: string;
  periodEnd: string;
  salaryPeriod: string;
}): string {
  return `${CUT_ZERO_KM_ACK_STORAGE_PREFIX}:${params.periodStart}|${params.periodEnd}|${params.salaryPeriod}`;
}

export function readCutZeroKmAcks(storageKey: string): Set<string> {
  if (typeof sessionStorage === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed.filter((id): id is string => typeof id === "string" && id.length > 0),
    );
  } catch {
    return new Set();
  }
}

export function writeCutZeroKmAcks(
  storageKey: string,
  employeeIds: ReadonlySet<string>,
): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    if (employeeIds.size === 0) {
      sessionStorage.removeItem(storageKey);
      return;
    }
    sessionStorage.setItem(storageKey, JSON.stringify([...employeeIds]));
  } catch {
    // Quota or private mode: in-memory state still covers this visit.
  }
}

export function clearCutZeroKmAcks(storageKey: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(storageKey);
  } catch {
    // ignore
  }
}
