import { financeCopy } from "../copy";

/**
 * Labels operativos para forma de cobro en listados (D5).
 * No altera el valor enviado al API.
 */
export function formatFinancePaymentMethodLabel(method: string): string {
  const normalized = method.trim().toUpperCase();
  if (normalized === "PPD") return financeCopy.paymentMethods.ppd;
  if (normalized === "PUE") return financeCopy.paymentMethods.pue;
  return method.trim() || "—";
}
