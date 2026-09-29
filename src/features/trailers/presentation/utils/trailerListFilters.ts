/** Recortes del panel «Filtros». No cuenta search ni isActive. */
export function countTrailerPanelFilters(input: { status: string }): number {
  return Number(Boolean(input.status));
}
