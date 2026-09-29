/** Recortes del panel «Filtros». No cuenta search ni la vista Eliminadas. */
export function countBranchPanelFilters(input: {
  status: string;
  isMain: string;
  createdFrom: string;
  createdTo: string;
}): number {
  return (
    Number(Boolean(input.status)) +
    Number(Boolean(input.isMain)) +
    Number(Boolean(input.createdFrom || input.createdTo))
  );
}
