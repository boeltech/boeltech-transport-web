/**
 * Reexport de keys de viajes desde domain — punto de importación application
 * para mutaciones e invalidación (ADR-0102 / barrido T1).
 */
export {
  tripQueryKeys,
  cargoQueryKeys,
  expenseQueryKeys,
} from "@features/trips/domain";
