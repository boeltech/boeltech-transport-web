/** Recortes del panel «Filtros». No cuenta search ni isActive. */
export function countVehiclePanelFilters(input: {
  status: string;
  type: string;
  branchId: string;
}): number {
  return (
    Number(Boolean(input.status)) +
    Number(Boolean(input.type)) +
    Number(Boolean(input.branchId))
  );
}
