/**
 * Namespace: trips.copy.wizard.expense.*
 */
export const expenseCopy = {
  title: {
    addCost: "Agregar costo",
    editCost: "Editar costo",
    addExpense: "Agregar gasto",
    editExpense: "Editar gasto",
  },
  hint: {
    srCost: "Formulario de costo operativo del viaje.",
    srExpense: "Formulario de gasto indirecto del viaje.",
    costScope:
      "combustible, casetas, maniobras, mantenimiento, seguros y permisos.",
    expenseScope:
      "viáticos, hospedaje, estacionamiento y otros conceptos del viaje.",
    costKind: "Costo operativo",
    expenseKind: "Gasto indirecto",
  },
  section: {
    classification: "Clasificación",
    amount: "Monto y descripción",
    vendor: "Proveedor y notas",
    dieselEstimate: "Estimación de diesel",
  },
  label: {
    category: "Categoría",
    currency: "Moneda",
    description: "Descripción",
    amount: "Monto (MXN)",
    totalDistance: "Distancia total",
    fuelEfficiency: "Rendimiento",
    estimatedConsumption: "Consumo estimado",
    dieselPrice: "Precio diesel (MXN/L)",
    estimatedCost: "Costo estimado",
    vendor: "Proveedor",
    notes: "Notas",
  },
  placeholder: {
    description: "Ej: Casetas tramo MTY-SLP",
    amount: "0.00",
    vendor: "Nombre o razón social",
    notes: "Observaciones del concepto...",
  },
  action: {
    cancel: "Cancelar",
    saveChanges: "Guardar cambios",
    addConcept: "Agregar concepto",
    useEstimate: "Usar estimación",
  },
  validation: {
    summaryTitle: "Faltan datos obligatorios en el concepto",
  },
  format: {
    dieselDescription: "Carga de diesel",
    dieselNotes: (liters: number, pricePerLiter: number) =>
      `${liters} L × $${pricePerLiter}/L (estimado)`,
  },
} as const;
