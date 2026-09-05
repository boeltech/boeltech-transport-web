export const satCatalogComboboxCopy = {
  searchPlaceholder: "Buscar…",
  empty: "Sin coincidencias",
  emptyNoCatalog: "Escribe un nombre y confírmalo",
  loading: "Cargando…",
  clear: "Limpiar",
  useAsFreeText: (query: string) => `Usar “${query}” como texto libre`,
  neighborhood: {
    label: "Colonia",
    catalogPlaceholder: "Selecciona o captura colonia",
    catalogSearchPlaceholder: "Buscar colonia…",
    catalogAriaLabel: "Colonia",
    catalogEmpty: "Sin colonias que coincidan",
  },
  locality: {
    label: "Localidad",
    catalogPlaceholder: "Selecciona o captura localidad",
    catalogSearchPlaceholder: "Buscar localidad…",
    catalogAriaLabel: "Localidad",
    catalogEmpty: "Sin localidades que coincidan",
  },
} as const;
