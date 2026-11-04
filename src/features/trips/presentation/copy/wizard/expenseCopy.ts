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
  emptyReturn: {
    scopeLegend: "Qué incluye el combustible",
    scopeRoute: "Solo la ruta",
    scopeBoth: "Ruta y regreso vacío",
    scopeReturn: "Solo el regreso vacío",
    returnKm: "Km de regreso",
    returnKmHelp:
      "De la última parada a la base. Si esa parada ya es la base, deje «Solo la ruta».",
    returnKmError: "Escriba los km de regreso, mayores a cero.",
    useRouteDistance: "Usar la distancia de la ruta",
    useRouteDistanceTitle: "Usar la distancia de la ruta",
    useRouteDistanceBody:
      "Solo cuadra si la unidad salió de la base, hubo un destino y la vuelta es el mismo tramo. No cambia las paradas.",
    useRouteDistanceConfirm: "Usar la distancia",
    amountRoute: "De la ruta",
    amountReturn: "Del regreso vacío",
    amountTotal: "Total",
    alreadyHasRouteFuel:
      "Ya hay combustible de la ruta. Solo se agregará el del regreso vacío.",
    routeEditHint: "El regreso vacío se agrega con «Agregar de ruta».",
    checkbox: "Este concepto es el regreso vacío",
    checkboxHelp:
      "El monto se guarda como esa porción, a cuenta de la empresa, sin sumar los km de la ruta.",
    pairArmedHint:
      "Se guardarán dos conceptos. El monto de arriba es el de la ruta; el del regreso vacío va en el segundo.",
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
    addTwoConcepts: "Agregar 2 conceptos",
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
    addedPairBody: (routeDescription: string, returnDescription: string) =>
      `«${routeDescription}» y «${returnDescription}» quedaron registrados. Puede agregar otro.`,
  },
  format: {
    dieselDescription: "Carga de diésel",
    dieselEmptyReturnDescription: "Diésel del regreso vacío",
    dieselNotes: (liters: number, pricePerLiter: number) =>
      `${liters} L × $${pricePerLiter}/L (estimado)`,
    dieselHelpBody: (km: number, kmPerLiter: number) =>
      `Con ${km.toFixed(0)} km de ruta y ${kmPerLiter} km/L de la unidad.`,
  },
} as const;
