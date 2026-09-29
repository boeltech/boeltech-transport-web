/**
 * Namespace: trips.copy.wizard.costs.*
 *
 * Léxico operativo del paso Costos: tarifa, conceptos del viaje y resultado.
 * No reutiliza títulos ALL CAPS ni «rentabilidad» del detalle.
 */
export const costsCopy = {
  section: {
    income: "Lo que cobra el viaje",
    operational: "En la ruta y la unidad",
    indirect: "Del operador y extras",
  },
  label: {
    baseRate: "Tarifa base (MXN)",
  },
  hint: {
    baseRateTraslado: "Opcional en viajes solo de traslado.",
    baseRateRequired:
      "Obligatoria cuando el viaje tiene cliente y se cobrará el flete.",
    baseRateNoClient:
      "Opcional si aún no hay cliente en el paso Información.",
  },
  action: {
    addOperational: "Agregar concepto de ruta",
    addIndirect: "Agregar concepto del operador",
  },
  state: {
    emptyOperationalTitle: "Todavía no hay conceptos de ruta",
    emptyOperationalDescription:
      "Combustible, casetas, maniobras, mantenimiento, seguros y permisos.",
    emptyIndirectTitle: "Todavía no hay conceptos del operador",
    emptyIndirectDescription:
      "Viáticos, hospedaje, estacionamiento y otros extras del viaje.",
  },
  result: {
    title: "Lo que deja el viaje",
    income: "Ingreso",
    concepts: "Conceptos",
    utility: "Utilidad",
    margin: "Margen",
    healthyHint: "El margen estimado se ve sano.",
    warningHint: "El margen estimado es moderado; conviene revisarlo.",
    criticalHint:
      "El margen estimado queda bajo. Ajuste la tarifa o los conceptos antes de continuar.",
    neutralHint: "Capture la tarifa para ver el margen estimado.",
    formatMarginPct: (pct: number) => `${pct.toFixed(0)} %`,
  },
  financialSummary: {
    section: {
      title: "Resumen del viaje",
      income: "Ingreso",
      operational: (count: number) =>
        count === 1
          ? "Ruta y unidad (1)"
          : `Ruta y unidad (${count})`,
      indirect: (count: number) =>
        count === 1
          ? "Operador y extras (1)"
          : `Operador y extras (${count})`,
    },
    label: {
      freight: "Flete",
      baseRate: "Tarifa base",
      income: "Ingreso",
      concepts: "Conceptos",
      costs: "Ruta y unidad",
      expenses: "Operador y extras",
      margin: "Utilidad",
      marginPct: "Margen",
    },
    state: {
      emptyLines: "Sin conceptos",
    },
  },
} as const;
