/** Recortes del panel «Filtros». No cuenta search ni la vista tabla/cards. */
export function countUserPanelFilters(input: {
  status: string;
  role: string;
  createdFrom: string;
  createdTo: string;
  lastLoginFrom: string;
  lastLoginTo: string;
}): number {
  return (
    Number(Boolean(input.status)) +
    Number(Boolean(input.role)) +
    Number(Boolean(input.createdFrom || input.createdTo)) +
    Number(Boolean(input.lastLoginFrom || input.lastLoginTo))
  );
}
