/** Forma SAT hardcodeada del tab Cobros (solo lectura en confirmación). */
export const COBROS_PAYMENT_FORM = "03";

/**
 * Hora SAT por defecto del tab Cobros cuando el operador no indica hora
 * (picker opcional en Confirmar cobro; misma semántica que Registrar pago).
 */
export const COBROS_PAYMENT_TIME = "12:00:00";

/** Valor inicial del picker de hora (HH:mm); vacío o este valor → mediodía al enviar. */
export const COBROS_PAYMENT_TIME_DEFAULT = "12:00";

const TIME_HH_MM = /^\d{2}:\d{2}$/;
const TIME_HH_MM_SS = /^\d{2}:\d{2}:\d{2}$/;

/** Normaliza hora del sheet a `HH:mm:ss` para el payload de cobro. */
export function normalizeCobrosPaymentTime(time: string | undefined): string {
  const trimmed = time?.trim() ?? "";
  if (!trimmed) return COBROS_PAYMENT_TIME;
  if (TIME_HH_MM.test(trimmed)) return `${trimmed}:00`;
  if (TIME_HH_MM_SS.test(trimmed)) return trimmed;
  return COBROS_PAYMENT_TIME;
}
