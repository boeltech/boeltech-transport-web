/**
 * Namespace: trips.copy.tripDetail.cargo.*
 */
export const cargoCopy = {
  section: {
    scope: "Alcance de Cargas",
    summary: "Resumen de cargas",
    list: "Cargas del viaje",
    byStatus: "Por estado",
  },
  hint: {
    summary: "Totales consolidados de piezas, peso y valor declarado.",
    list: "Detalle por mercancía, movimientos y estado.",
    byStatus: "Cantidad de cargas según su estado operativo.",
    scopeEditable:
      "Estado operativo de la carga. Agregar o reestructurar mercancías en edición completa.",
    scopeReadOnly:
      "Cargas en solo lectura. Replanificación solo en borrador/programado.",
    reviewPlanning:
      "Revise la planeación de mercancías en edición completa para mantener consistencia operativa.",
  },
  alert: {
    noPickupTitle: "Cargas sin parada de carga",
    noPickupBody: (count: number) =>
      `${count} carga(s) no tienen movimiento de pickup asociado.`,
    reviewTitle: "Revisión operativa recomendada",
    noDeliveryBody: (count: number) =>
      `${count} carga(s) no tienen entrega planificada.`,
    unresolvedMovementBody: (count: number) =>
      `${count} movimiento(s) no se pudieron vincular con una parada del viaje.`,
  },
  action: {
    openFullEdit: "Abrir edición completa",
    addInFullEdit: "Agregar carga en edición completa",
    viewByCargo: "Por mercancía",
    viewByPickup: "Por parada de carga",
    retry: "Reintentar",
    deliver: "Entregar",
  },
  state: {
    emptyTitle: "Sin cargas registradas",
    emptyDescription: "Aún no hay mercancía asociada a este viaje.",
    loadError: "No se pudieron cargar las cargas del viaje.",
    noPickupStops: "No hay paradas con operación de carga en este viaje.",
    emptyAtStopTitle: "Sin cargas en esta parada",
    emptyAtStopHint:
      "La planeación de mercancías se gestiona en edición completa.",
  },
  label: {
    totalCargos: "Total cargas",
    totalWeight: "Peso total",
    declaredValue: "Valor declarado",
    origin: "Origen",
    destination: "Destino",
    waypoint: "Escala",
    pickupOperation: "Carga",
    noMerchandise: "Sin mercancías",
    hazmat: "Mat. peligroso",
    defaultUnits: "uds",
  },
  toast: {
    delivered: "Carga marcada como entregada",
    deliverError: "Error",
  },
  format: {
    cargoCount: (count: number) =>
      `${count} ${count === 1 ? "carga" : "cargas"}`,
    stopNumber: (sequenceOrder: number) => `Parada #${sequenceOrder}`,
    merchandiseCount: (count: number) =>
      `${count} ${count === 1 ? "mercancía" : "mercancías"}`,
    stopLabelFallback: (stopIndex: number) => `Parada #${stopIndex + 1}`,
    satProductCode: (code: string) => `Clave ${code}`,
    volume: (volume: string | number) => `Volumen: ${volume} m³`,
    declaredValueInline: (formatted: string) => `Valor: ${formatted}`,
    insurance: (name: string) => `Seguro: ${name}`,
    policy: (policyNumber: string) => `Póliza: ${policyNumber}`,
    pickupAtStop: (stopLabel: string, weightSuffix?: string) =>
      `Recoger: ${stopLabel}${weightSuffix ?? ""}`,
    deliveryAtStop: (
      stopLabel: string,
      weightSuffix?: string,
      unitsSuffix?: string,
    ) => `Entrega: ${stopLabel}${weightSuffix ?? ""}${unitsSuffix ?? ""}`,
    weightSuffix: (kg: number) => ` · ${kg} kg`,
    unitsSuffix: (units: number) => ` · ${units} uds`,
  },
} as const;
