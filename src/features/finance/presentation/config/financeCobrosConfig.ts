/**
 * Defaults de hora SAT para cobros con factura (formulario único).
 * La forma de pago es elegible en el form — ya no hay constante fija «03».
 */

/**
 * Hora SAT por defecto cuando el operador no indica hora
 * (misma semántica que el antiguo Registrar pago / Confirmar cobro).
 */
export const COBROS_PAYMENT_TIME = "12:00:00";

/** Valor inicial del picker de hora (HH:mm); vacío o este valor → mediodía al enviar. */
export const COBROS_PAYMENT_TIME_DEFAULT = "12:00";

const TIME_HH_MM = /^\d{2}:\d{2}$/;
const TIME_HH_MM_SS = /^\d{2}:\d{2}:\d{2}$/;

/** Normaliza hora del form a `HH:mm:ss` para el payload de cobro. */
export function normalizeCobrosPaymentTime(time: string | undefined): string {
  const trimmed = time?.trim() ?? "";
  if (!trimmed) return COBROS_PAYMENT_TIME;
  if (TIME_HH_MM.test(trimmed)) return `${trimmed}:00`;
  if (TIME_HH_MM_SS.test(trimmed)) return trimmed;
  return COBROS_PAYMENT_TIME;
}
