/** Recortes del panel «Filtros». No cuenta search ni acciones. */
export function countClientPanelFilters(input: {
  type: string;
  paymentTerms: string;
  status: string;
}): number {
  return (
    Number(Boolean(input.type)) +
    Number(Boolean(input.paymentTerms)) +
    Number(Boolean(input.status))
  );
}

/** Mapea el recorte de estado del listado al boolean de API `is_active`. */
export function resolveClientListIsActive(
  status: string,
): boolean | undefined {
  if (status === "active") return true;
  if (status === "inactive") return false;
  return undefined;
}
