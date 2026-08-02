/**
 * Namespace: trips.copy.tripDetail.cargo.*
 */
export const cargoCopy = {
  section: {
    summary: "Resumen de cargas",
    list: "Cargas del viaje",
    byStatus: "Por estado",
    atStop: "Mercancía en esta parada",
    cargoTimeline: "Hitos de mercancía",
  },
  hint: {
    summary: "Totales consolidados de piezas, peso y valor declarado.",
    list: "Detalle por mercancía, movimientos y estado.",
    byStatus: "Cantidad de cargas según su estado operativo.",
    manageInTracking:
      "Para recoger, entregar o registrar movimientos, usa el tab Seguimiento.",
    trackingManageCargo:
      "Registra recogida, tránsito, entrega o incidencias de cada mercancía.",
    trackingViewCargo:
      "Estado actual de las mercancías del viaje.",
    reviewPlanning:
      "Revise la planeación de mercancías en edición completa para mantener consistencia operativa.",
    pendingBeforeDeparture:
      "Opera las mercancías pendientes en esta parada antes de registrar salida o cierre del viaje.",
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
    retry: "Reintentar",
    actionDisabledNotAtStop: "Registra llegada en esta parada para operar",
    deliver: "Entregar",
    pickup: "Recoger",
    return: "Devolver",
    cancel: "Cancelar",
    completePickupHere: "Recoger aquí",
    completeDeliveryHere: "Entregar aquí",
  },
  state: {
    emptyTitle: "Sin cargas registradas",
    emptyDescription: "Aún no hay mercancía asociada a este viaje.",
    loadError: "No se pudieron cargar las cargas del viaje.",
    noPickupStops: "No hay paradas con operación de carga en este viaje.",
    emptyAtStopTitle: "Sin cargas en esta parada",
    emptyAtStopHint:
      "La planeación de mercancías se gestiona en edición completa.",
    emptyDeliveryAtStopTitle: "Sin mercancía pendiente de entrega",
    emptyDeliveryAtStopHint:
      "Las cargas en tránsito aparecerán aquí para registrar entrega.",
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
    movementDone: "Movimiento hecho",
    pickupCompleted: "Recogida registrada",
    deliveryCompleted: "Entrega registrada",
    pickedUpAt: "Recogida",
    deliveredAt: "Entregada",
  },
  toast: {
    delivered: "Carga marcada como entregada",
    deliverError: "Error",
    pickup: "Carga marcada en tránsito",
    pickupError: "No se pudo registrar la recogida",
    returned: "Carga marcada como devuelta",
    returnError: "No se pudo registrar la devolución",
    cancelled: "Carga cancelada",
    cancelError: "No se pudo cancelar la carga",
    movementCompleted: "Movimiento registrado en parada",
    movementError: "No se pudo completar el movimiento",
  },
  format: {
    cargoCount: (count: number) =>
      `${count} ${count === 1 ? "carga" : "cargas"}`,
    stopNumber: (displayOrder: number) => `Parada #${displayOrder}`,
    merchandiseCount: (count: number) =>
      `${count} ${count === 1 ? "mercancía" : "mercancías"}`,
    stopLabelFallback: (stopIndex: number) => `Parada #${stopIndex + 1}`,
    satProductCode: (code: string) => `Producto ${code}`,
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
