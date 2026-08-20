/**
 * Visibilidad de tabs analíticos (Resumen / Análisis) y Cobros en el hub Finanzas.
 * Lockstep API: finance.read (analytics) y finance.create (cobros).
 */

export function isFinanceAnalyticsEnabled(options: {
  isClientPortal: boolean;
  hasFinanceRead: boolean;
}): boolean {
  return !options.isClientPortal && options.hasFinanceRead;
}

export function isFinanceCobrosTabEnabled(options: {
  isClientPortal: boolean;
  hasFinanceCreate: boolean;
}): boolean {
  return !options.isClientPortal && options.hasFinanceCreate;
}
