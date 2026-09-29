/** Recortes del panel «Filtros». No cuenta search ni licencias por vencer. */
export function countDriverPanelFilters(input: {
  status: string;
  branchId: string;
}): number {
  return Number(Boolean(input.status)) + Number(Boolean(input.branchId));
}
