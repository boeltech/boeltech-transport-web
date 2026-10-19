import { formatMxCurrencyWhole } from "@shared/utils/formatMxCurrency";

/**
 * Ingreso promedio por viaje (Visitor Value): actual_revenue / trip_count.
 * Returns "—" when there are no completed trips to divide by.
 */
export function formatRevenuePerTrip(
  actualRevenue: number | null | undefined,
  tripCount: number | null | undefined,
): string {
  if (tripCount == null || tripCount <= 0) return "—";
  if (actualRevenue == null || !Number.isFinite(actualRevenue)) return "—";
  return formatMxCurrencyWhole(actualRevenue / tripCount);
}
