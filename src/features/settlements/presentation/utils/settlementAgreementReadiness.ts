import type { AgreementSnapshot } from "../../domain/entities";
import type {
  AgreementCommissionType,
  CompensationCalculationType,
} from "../../domain/enums";

/**
 * Readiness de tarifa de liquidación (Capa 1 PD1).
 * Inferido del snapshot de preview: el API sin acuerdo devuelve un fallback
 * sintético `salary_only` (sin sueldo fijo ni reglas) que NO es tarifa válida.
 */

export type SettlementAgreementReadiness =
  | "ready"
  | "missing_agreement"
  | "incomplete_agreement";

type AgreementLike = AgreementSnapshot | Record<string, unknown>;

function readBool(agreement: AgreementLike, camel: string, snake: string): boolean {
  const raw = agreement as Record<string, unknown>;
  return Boolean(raw[camel] ?? raw[snake]);
}

function readNumber(agreement: AgreementLike, camel: string, snake: string): number {
  const raw = agreement as Record<string, unknown>;
  return Number(raw[camel] ?? raw[snake] ?? 0);
}

function readString(agreement: AgreementLike, camel: string, snake: string): string {
  const raw = agreement as Record<string, unknown>;
  const value = raw[camel] ?? raw[snake];
  return value == null ? "" : String(value);
}

function readRules(agreement: AgreementLike): readonly Record<string, unknown>[] {
  const raw = agreement as Record<string, unknown>;
  const rules = raw.rules;
  return Array.isArray(rules) ? (rules as Record<string, unknown>[]) : [];
}

function hasUsableRuleCommission(rules: readonly Record<string, unknown>[]): boolean {
  return rules.some((rule) => {
    const type = (rule.commissionType ?? rule.commission_type) as
      | AgreementCommissionType
      | undefined;
    const rate = Number(rule.rateValue ?? rule.rate_value ?? 0);
    if (!type || type === "none") return false;
    return rate > 0;
  });
}

function hasUsableLegacyCommission(agreement: AgreementLike): boolean {
  const calcType = readString(agreement, "calculationType", "calculation_type") as
    | CompensationCalculationType
    | "";
  const ratePerKm = readNumber(agreement, "ratePerKm", "rate_per_km");
  const percentageRate = readNumber(agreement, "percentageRate", "percentage_rate");
  const baseRate = readNumber(agreement, "baseRate", "base_rate");
  const helperDailyRate = readNumber(agreement, "helperDailyRate", "helper_daily_rate");

  return (
    (calcType === "rate_per_km" && ratePerKm > 0) ||
    (calcType === "percentage_of_freight" && percentageRate > 0) ||
    (calcType === "fixed_per_trip" && baseRate > 0) ||
    (calcType === "fixed_daily_rate" && helperDailyRate > 0)
  );
}

/**
 * Heurística del fallback API (sin acuerdo persistido):
 * salary_only + sin sueldo fijo + sin reglas + período "none".
 */
function looksLikeApiFallback(agreement: AgreementLike): boolean {
  const calcType = readString(agreement, "calculationType", "calculation_type");
  const hasFixedSalary = readBool(agreement, "hasFixedSalary", "has_fixed_salary");
  const fixedSalaryPeriod = readString(agreement, "fixedSalaryPeriod", "fixed_salary_period");
  const rules = readRules(agreement);

  return (
    calcType === "salary_only" &&
    !hasFixedSalary &&
    rules.length === 0 &&
    (fixedSalaryPeriod === "none" || fixedSalaryPeriod === "")
  );
}

export function resolveSettlementAgreementReadiness(
  agreement: AgreementLike | null | undefined,
): SettlementAgreementReadiness {
  if (!agreement) return "missing_agreement";

  const hasFixedSalary = readBool(agreement, "hasFixedSalary", "has_fixed_salary");
  const fixedSalaryAmount = readNumber(agreement, "fixedSalaryAmount", "fixed_salary_amount");
  const hasUsableFixedSalary = hasFixedSalary && fixedSalaryAmount > 0;
  const rules = readRules(agreement);

  if (
    hasUsableFixedSalary ||
    hasUsableRuleCommission(rules) ||
    hasUsableLegacyCommission(agreement)
  ) {
    return "ready";
  }

  if (looksLikeApiFallback(agreement)) {
    return "missing_agreement";
  }

  return "incomplete_agreement";
}

export function isSettlementAgreementReady(
  agreement: AgreementLike | null | undefined,
): boolean {
  return resolveSettlementAgreementReadiness(agreement) === "ready";
}
