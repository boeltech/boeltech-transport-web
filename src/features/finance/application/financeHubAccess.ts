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

/**
 * Corridas de despacho (ADR-0082): staff con invoices.read.
 * Portal client excluido (SDD §8) aunque tenga invoices.read.
 */
export function canAccessBillingDispatchRuns(options: {
  isClientPortal: boolean;
  hasInvoicesRead: boolean;
}): boolean {
  return !options.isClientPortal && options.hasInvoicesRead;
}
