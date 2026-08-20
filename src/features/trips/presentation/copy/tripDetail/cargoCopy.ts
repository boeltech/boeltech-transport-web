/**
 * Namespace: trips.copy.tripDetail.cargo.*
 * Léxico operativo (handoff Capa 1 D10) — superficie de lectura: carga / recogida / entrega.
 * Sin TI («vincular», «pickup») ni ruido SAT en lectura del tab.
 */
export const cargoCopy = {
  section: {
    list: "Cargas del viaje",
    detail: "Detalle de la carga",
    route: "Dónde va",
    pickup: "Recogida",
    delivery: "Entrega",
    insurance: "Seguro",
    notes: "Notas",
    /** Usado en Seguimiento (cargas en parada). */
    atStop: "Cargas en esta parada",
    cargoTimeline: "Hitos de carga",
  },
  hint: {
    list: "Planeación de cargas. La recogida y la entrega se registran en Seguimiento.",
    selectCargo: "Selecciona una carga de la lista.",
    manageInTracking: "Recogida y entrega se registran en Seguimiento.",
    trackingManageCargo:
      "Registra recogida, tránsito, entrega o incidencias de cada carga.",
    trackingViewCargo: "Estado actual de las cargas del viaje.",
    reviewPlanning: "Revisa la planeación de cargas.",
    cargoTimeline: "Estado y hitos de las cargas del viaje.",
    pendingBeforeDeparture:
      "Opera las cargas pendientes en esta parada antes de registrar salida o cierre del viaje.",
    mobileDetailSheet: "Carga",
  },
  alert: {
    noPickupTitle: "Cargas sin parada de recogida",
    noPickupBody: (count: number) =>
      count === 1
        ? "1 carga no tiene parada de recogida."
        : `${count} cargas no tienen parada de recogida.`,
    reviewTitle: "Revisa la planeación",
    noDeliveryBody: (count: number) =>
      count === 1
        ? "1 carga no tiene entrega planificada."
        : `${count} cargas no tienen entrega planificada.`,
    unresolvedMovementBody: (count: number) =>
      count === 1
        ? "1 carga no coincide con una parada de la ruta."
        : `${count} cargas no coinciden con una parada de la ruta.`,
  },
  action: {
    addCargo: "Agregar carga",
    editCargo: "Editar carga",
    removeCargo: "Eliminar carga",
    confirmRemoveTitle: "¿Eliminar esta carga?",
    confirmRemoveBody:
      "Se quitará de la planeación del viaje. Esta acción no se puede deshacer.",
    confirmRemove: "Eliminar",
    keepCargo: "Conservar",
    goToRoute: "Ir a Ruta",
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
    emptyDescription:
      "Agrega la carga que saldrá de la parada de recogida. No bloquea confirmar ni iniciar.",
    emptyNoPickupTitle: "Falta una parada de recogida",
    emptyNoPickupDescription:
      "Agrega una parada de recogida en Ruta antes de registrar cargas.",
    loadError: "No se pudieron cargar las cargas del viaje.",
    noPickupStops: "No hay paradas con operación de recogida en este viaje.",
    emptyAtStopTitle: "Sin cargas en esta parada",
    emptyAtStopHint:
      "Agrega cargas desde el tab Cargas cuando haya una parada de recogida.",
    emptyDeliveryAtStopTitle: "Sin cargas pendientes de entrega",
    emptyDeliveryAtStopHint:
      "Las cargas en tránsito aparecerán aquí para registrar entrega.",
    missingPickup: "Sin recogida",
    missingDelivery: "Sin entrega",
  },
  label: {
    totalWeight: "Peso",
    insuranceValue: "Valor del seguro",
    insurer: "Aseguradora",
    policy: "Póliza",
    origin: "Origen",
    destination: "Destino",
    waypoint: "Escala",
    pickupStop: "Parada de recogida",
    deliveryStop: "Parada de entrega",
    noMerchandise: "Sin cargas",
    hazardous: "Peligroso",
    defaultUnits: "uds",
    pickupCompleted: "Recogida registrada",
    deliveryCompleted: "Entrega registrada",
    pickedUpAt: "Recogida",
    deliveredAt: "Entregada",
    weight: "Peso",
    units: "Unidades",
    volume: "Volumen",
    notes: "Notas",
    specialInstructions: "Instrucciones",
    status: "Estado",
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
    cargoAdded: "Carga agregada",
    cargoAddError: "No se pudo agregar la carga",
    cargoStopUnresolved:
      "No se pudo asociar la carga a una parada del viaje. Revisa la ruta e intenta de nuevo.",
    cargoUpdated: "Carga actualizada",
    cargoUpdateError: "No se pudo actualizar la carga",
    cargoRemoved: "Carga eliminada",
    cargoRemoveError: "No se pudo eliminar la carga",
    saveErrorSeeInline: "Revisa el mensaje detallado en el formulario.",
    movementCompleted: "Operación registrada en parada",
    movementError: "No se pudo completar la operación",
  },
  format: {
    cargoCount: (count: number) =>
      `${count} ${count === 1 ? "carga" : "cargas"}`,
    metaLine: (count: number, weightKg: number) => {
      const countPart = `${count} ${count === 1 ? "carga" : "cargas"}`;
      if (weightKg <= 0) return countPart;
      return `${countPart} · ${weightKg.toLocaleString("es-MX")} kg`;
    },
    stopNumber: (displayOrder: number) => `Parada #${displayOrder}`,
    stopLabelFallback: (stopIndex: number) => `Parada #${stopIndex + 1}`,
    volume: (volume: string | number) => `${volume} m³`,
    routeSummary: (pickupLabel: string, deliveryLabel: string) =>
      `${pickupLabel} → ${deliveryLabel}`,
    pickupAtStop: (stopLabel: string) => `Recoge: ${stopLabel}`,
    deliveryAtStop: (stopLabel: string) => `Entrega: ${stopLabel}`,
    weightKg: (kg: number) => `${kg.toLocaleString("es-MX")} kg`,
    unitsCount: (units: number) => `${units} uds`,
    quantitiesLine: (parts: readonly string[]) => parts.join(" · "),
  },
} as const;
