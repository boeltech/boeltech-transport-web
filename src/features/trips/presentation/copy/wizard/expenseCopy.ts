/**
 * Namespace: trips.copy.wizard.expense.*
 */
export const expenseCopy = {
  title: {
    addOperational: "Agregar concepto de ruta",
    editOperational: "Editar concepto de ruta",
    addIndirect: "Agregar concepto del operador",
    editIndirect: "Editar concepto del operador",
  },
  hint: {
    srOperational: "Registro de un concepto de la ruta o la unidad.",
    srIndirect: "Registro de un concepto del operador u otros extras.",
    operationalScope:
      "Combustible, casetas, maniobras, mantenimiento, seguros y permisos.",
    indirectScope:
      "Viáticos, hospedaje, estacionamiento y otros extras del viaje.",
    operationalKind: "Concepto de ruta",
    indirectKind: "Concepto del operador",
  },
  section: {
    concept: "Concepto",
    amount: "Monto",
    extras: "Proveedor y notas",
    dieselHelp: "Ayuda para estimar combustible",
  },
  sectionSummary: {
    extrasFilled: "Con proveedor o notas",
    extrasEmpty: "Sin proveedor ni notas",
  },
  label: {
    category: "Tipo de concepto",
    description: "Descripción",
    amount: "Monto (MXN)",
    totalDistance: "Distancia del viaje",
    fuelEfficiency: "Rendimiento de la unidad",
    estimatedConsumption: "Consumo estimado",
    dieselPrice: "Precio del diésel (MXN/L)",
    estimatedCost: "Monto estimado",
    vendor: "Proveedor",
    notes: "Notas",
  },
  placeholder: {
    description: "Ej.: casetas tramo MTY–SLP",
    amount: "0.00",
    vendor: "Nombre o razón social",
    notes: "Observaciones del concepto…",
  },
  action: {
    cancel: "Cancelar",
    saveChanges: "Guardar cambios",
    addConcept: "Agregar concepto",
    addAnother: "Guardar y agregar otro",
    useEstimate: "Usar esta estimación",
  },
  validation: {
    summaryTitle: "Faltan datos para guardar el concepto",
  },
  toast: {
    addedTitle: "Concepto agregado",
    addedBody: (description: string) =>
      `«${description}» quedó registrado. Puede agregar otro.`,
  },
  format: {
    dieselDescription: "Carga de diésel",
    dieselNotes: (liters: number, pricePerLiter: number) =>
      `${liters} L × $${pricePerLiter}/L (estimado)`,
    dieselHelpBody: (km: number, kmPerLiter: number) =>
      `Con ${km.toFixed(0)} km de ruta y ${kmPerLiter} km/L de la unidad.`,
  },
} as const;
