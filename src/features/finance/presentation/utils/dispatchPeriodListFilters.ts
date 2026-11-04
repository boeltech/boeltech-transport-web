/** Recortes del panel «Filtros» en Correo del periodo. No cuenta acciones. */
export function countDispatchPeriodPanelFilters(input: {
  status: string;
  billingSchemeId: string;
}): number {
  return Number(Boolean(input.status)) + Number(Boolean(input.billingSchemeId));
}
