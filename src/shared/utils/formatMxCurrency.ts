const MXN_CURRENCY = "MXN" as const;
const LOCALE = "es-MX" as const;

const mxnFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: MXN_CURRENCY,
});

const mxnWholeFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: MXN_CURRENCY,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Monto en pesos mexicanos (2 decimales). */
export function formatMxCurrency(amount: number): string {
  return mxnFormatter.format(amount);
}

/** Monto en pesos sin centavos (p. ej. límites de crédito). */
export function formatMxCurrencyWhole(amount: number): string {
  return mxnWholeFormatter.format(amount);
}

/** `null`/`undefined` → `null`; útil en detalle cuando el campo es opcional. */
export function formatMxCurrencyNullable(
  value: number | null | undefined,
): string | null {
  if (value == null) return null;
  return formatMxCurrency(value);
}

/** `null`/`undefined` → em dash para UI de solo lectura. */
export function formatMxCurrencyOrDash(
  value: number | null | undefined,
): string {
  if (value == null) return "—";
  return formatMxCurrency(value);
}
