import type { CompensationAgreement } from "../../domain/entities";

type AgreementPeriod = Pick<
  CompensationAgreement,
  "effectiveFrom" | "effectiveTo"
>;

const OPEN_ENDED_DATE = "9999-12-31";

function periodEndDate(effectiveTo: string | null | undefined): string {
  return effectiveTo?.trim() ? effectiveTo.trim() : OPEN_ENDED_DATE;
}

/** Tarifa elegible en una fecha: activa + vigente ese día. */
export function isAgreementEligibleOnDate(
  agreement: Pick<
    CompensationAgreement,
    "isActive" | "effectiveFrom" | "effectiveTo"
  >,
  date: string,
): boolean {
  if (!agreement.isActive) return false;
  if (agreement.effectiveFrom > date) return false;
  if (agreement.effectiveTo && agreement.effectiveTo < date) return false;
  return true;
}

/** Traslape de rangos de vigencia (inclusive). */
export function doAgreementValidityPeriodsOverlap(
  a: AgreementPeriod,
  b: AgreementPeriod,
): boolean {
  return (
    a.effectiveFrom <= periodEndDate(b.effectiveTo) &&
    b.effectiveFrom <= periodEndDate(a.effectiveTo)
  );
}

/** Dos tarifas activas del mismo operador con vigencias traslapadas. */
export function doActiveAgreementsOverlap(
  a: CompensationAgreement,
  b: CompensationAgreement,
): boolean {
  if (a.id === b.id) return false;
  if (a.employeeId !== b.employeeId) return false;
  if (!a.isActive || !b.isActive) return false;
  return doAgreementValidityPeriodsOverlap(a, b);
}

/** IDs de tarifas que participan en al menos un conflicto de solape activo. */
export function getAgreementIdsWithOverlapConflict(
  agreements: readonly CompensationAgreement[],
): Set<string> {
  const conflictIds = new Set<string>();

  for (let i = 0; i < agreements.length; i += 1) {
    for (let j = i + 1; j < agreements.length; j += 1) {
      const left = agreements[i];
      const right = agreements[j];
      if (left && right && doActiveAgreementsOverlap(left, right)) {
        conflictIds.add(left.id);
        conflictIds.add(right.id);
      }
    }
  }

  return conflictIds;
}

export function findEligibleAgreementsForEmployeeOnDate(
  agreements: readonly CompensationAgreement[],
  employeeId: string,
  date: string,
): CompensationAgreement[] {
  return agreements.filter(
    (agreement) =>
      agreement.employeeId === employeeId &&
      isAgreementEligibleOnDate(agreement, date),
  );
}

/** Misma regla que preview API: effective_from DESC, created_at DESC. */
export function pickAgreementBySettlementTiebreak(
  candidates: readonly CompensationAgreement[],
): CompensationAgreement | null {
  if (candidates.length === 0) return null;

  const sorted = [...candidates].sort((left, right) => {
    const fromCompare = right.effectiveFrom.localeCompare(left.effectiveFrom);
    if (fromCompare !== 0) return fromCompare;
    return right.createdAt.localeCompare(left.createdAt);
  });

  return sorted[0] ?? null;
}

/** Tarifas activas existentes que se traslapan con un rango propuesto. */
export function findActiveOverlappingAgreements(
  agreements: readonly CompensationAgreement[],
  params: {
    employeeId: string;
    effectiveFrom: string;
    effectiveTo?: string | null;
    excludeAgreementId?: string;
  },
): CompensationAgreement[] {
  const probe: AgreementPeriod = {
    effectiveFrom: params.effectiveFrom,
    effectiveTo: params.effectiveTo?.trim() ? params.effectiveTo.trim() : null,
  };

  return agreements.filter((existing) => {
    if (existing.employeeId !== params.employeeId) return false;
    if (!existing.isActive) return false;
    if (params.excludeAgreementId && existing.id === params.excludeAgreementId) {
      return false;
    }
    return doAgreementValidityPeriodsOverlap(existing, probe);
  });
}

export function subtractOneCalendarDay(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}
