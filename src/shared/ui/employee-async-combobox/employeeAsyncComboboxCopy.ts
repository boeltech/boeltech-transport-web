export const employeeAsyncComboboxCopy = {
  label: "Operador",
  placeholder: "Buscar operador por nombre o número…",
  multiPlaceholder: "Seleccionar operadores…",
  multiSummary: (count: number) =>
    count === 1 ? "1 operador seleccionado" : `${count} operadores seleccionados`,
  searchPlaceholder: "Buscar por nombre o número de empleado…",
  loading: "Buscando operadores…",
  loadError: "No se pudieron cargar operadores",
  empty: "No se encontraron operadores",
  clear: "Quitar selección",
  ariaLabel: "Seleccionar operador",
  ariaLabelMulti: "Seleccionar operadores",
} as const;
