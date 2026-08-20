/**
 * Extrae etiquetas humanas del plan de reparación si el API las manda.
 * No inventa folios: si no hay serie/folio, no lista UUIDs.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function folioLabel(record: Record<string, unknown>): string | null {
  const serie = record.serie ?? record.invoiceSerie ?? record.invoice_serie;
  const folio = record.folio ?? record.invoiceFolio ?? record.invoice_folio;
  if (typeof serie !== "string" || serie.trim() === "") return null;
  if (typeof folio === "number" && Number.isFinite(folio)) {
    return `${serie.trim()}-${folio}`;
  }
  if (typeof folio === "string" && folio.trim() !== "") {
    return `${serie.trim()}-${folio.trim()}`;
  }
  return null;
}

function collectLabels(value: unknown, labels: Set<string>, depth: number): void {
  if (depth > 5 || value == null) return;
  if (Array.isArray(value)) {
    for (const item of value) collectLabels(item, labels, depth + 1);
    return;
  }
  if (!isRecord(value)) return;

  const label = folioLabel(value);
  if (label) labels.add(label);

  for (const key of [
    "cancelPhase",
    "cancel_phase",
    "byIngress",
    "by_ingress",
    "invoices",
    "affected",
  ]) {
    if (key in value) collectLabels(value[key], labels, depth + 1);
  }
}

export function getChainRepairAffectedLabels(
  details: Record<string, unknown> | undefined,
): string[] {
  if (!details) return [];
  const plan = details.repair_plan ?? details.repairPlan;
  if (!plan) return [];
  const labels = new Set<string>();
  collectLabels(plan, labels, 0);
  return [...labels];
}
