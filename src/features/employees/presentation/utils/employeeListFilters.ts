/** Recortes del panel «Filtros». No cuenta search ni acciones. */
export function countEmployeePanelFilters(input: {
  status: string;
  type: string;
  position: string;
}): number {
  return (
    Number(Boolean(input.status)) +
    Number(Boolean(input.type)) +
    Number(Boolean(input.position))
  );
}
