import { formatMxCurrency } from "@shared/utils/formatMxCurrency";

/** Em dash canónico para vacío de monto (V-M5 / D-PM-2). */
export const PIPELINE_AMOUNT_EMPTY = "\u2014";

/**
 * Monto del riel Pagos/Anticipos.
 * - Con suma API → moneda.
 * - count>0 sin suma → fallback honesto (no «—»).
 * - count=0 → em dash.
 */
export function formatPipelineBucketAmount(
  amount: number | null | undefined,
  count: number,
  missingSumLabel: string,
): string {
  if (typeof amount === "number") {
    return formatMxCurrency(amount);
  }
  if (count > 0) {
    return missingSumLabel;
  }
  return PIPELINE_AMOUNT_EMPTY;
}
