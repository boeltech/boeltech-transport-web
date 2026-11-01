/**
 * Reexport del helper de período de Armar pago para consumidores de otras features
 * (p. ej. compensation) sin importar `presentation` cruzado (ADR-0102).
 */
export {
  buildSuggestedSettlementPeriod,
  type BuildSuggestedPeriodInput,
  type PeriodResult,
  type SalaryPeriodKind,
} from "../presentation/utils/buildSuggestedSettlementPeriod";
