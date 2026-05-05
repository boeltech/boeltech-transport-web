import type { Employee } from "../../domain/entities";

const MS_DAY = 1000 * 60 * 60 * 24;
/** Promedio de días por mes en calendario gregoriano. */
const AVG_DAYS_MONTH = 365.25 / 12;

/**
 * Etiqueta de antigüedad hasta `asOfMs` (o fecha de baja si aplica antes).
 */
export function formatEmployeeTenure(
  hireDateIso: string,
  terminatedAtIso: string | null | undefined,
  asOfMs: number,
): string {
  const hireMs = new Date(hireDateIso).getTime();
  if (Number.isNaN(hireMs)) return "—";

  let endMs = asOfMs;
  if (terminatedAtIso) {
    const t = new Date(terminatedAtIso).getTime();
    if (!Number.isNaN(t)) endMs = Math.min(endMs, t);
  }

  if (endMs <= hireMs) return "—";

  const totalDays = (endMs - hireMs) / MS_DAY;
  const rawMonthsTotal = Math.floor(totalDays / AVG_DAYS_MONTH);
  const years = Math.floor(rawMonthsTotal / 12);
  const months = rawMonthsTotal % 12;

  if (years >= 1) {
    if (months >= 1) return `${years} año${years === 1 ? "" : "s"} · ${months} mes${months === 1 ? "" : "es"}`;
    return `${years} año${years === 1 ? "" : "s"}`;
  }

  if (months >= 1) return `${months} mes${months === 1 ? "" : "es"}`;

  const weeks = Math.max(1, Math.floor(totalDays / 7));
  if (weeks >= 2) return `${weeks} semanas`;
  return "< 1 mes";
}

export function isNssMissing(employee: Employee): boolean {
  return !employee.nss?.trim();
}

/** Días hasta la baja programada (futuro); negativo o null si no aplica. */
export function daysUntilTermination(
  terminationDateIso: string | null | undefined,
  asOfMs: number,
): number | null {
  if (!terminationDateIso?.trim()) return null;
  const t = new Date(terminationDateIso).getTime();
  if (Number.isNaN(t)) return null;
  const diff = t - asOfMs;
  if (diff <= 0) return null;
  return Math.ceil(diff / MS_DAY);
}

export function shouldHintEventualContract(employee: Employee): boolean {
  return (
    employee.employmentType === "temporary" &&
    employee.status !== "terminated"
  );
}
