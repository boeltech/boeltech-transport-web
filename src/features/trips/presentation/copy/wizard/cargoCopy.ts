/**
 * Namespace: trips.copy.wizard.cargo.*
 */
export const cargoCopy = {
  validation: {
    requireCargo:
      "Agrega al menos una mercancía para construir el nodo Mercancias del comprobante.",
    requireWeight:
      "El peso bruto total de las mercancías debe ser mayor a cero.",
    noPickupStops:
      "No hay paradas con operación de carga. Regrese al paso de Ruta para configurarlas.",
    pickupWithoutCargo: (stopLabels: string) =>
      `Las siguientes paradas de carga no tienen mercancías registradas: ${stopLabels}`,
    weightExceeded: (
      description: string,
      deliveryWeight: number,
      cargoWeight: number,
    ) =>
      `"${description}": el peso total de entregas (${deliveryWeight} kg) excede el peso de la carga (${cargoWeight} kg)`,
    weightPending: (
      description: string,
      pendingWeight: number,
      deliveryWeight: number,
      cargoWeight: number,
    ) =>
      `"${description}": faltan ${pendingWeight} kg por asignar a puntos de entrega (${deliveryWeight}/${cargoWeight} kg)`,
    implicitDeliverySingle: (cargoName: string) =>
      `La carga "${cargoName}" no tiene punto de entrega asignado. Se entregará en la única parada de descarga del viaje.`,
    implicitDeliveryMultiple: (cargoNames: string) =>
      `Las cargas ${cargoNames} no tienen punto de entrega asignado. Se entregarán en la única parada de descarga del viaje.`,
    missingDeliveryPoints: (
      cargoNames: string,
      isSingle: boolean,
      deliveryStopCount: number,
    ) =>
      `${isSingle ? "La carga" : "Las cargas"} ${cargoNames} ${isSingle ? "no tiene" : "no tienen"} puntos de entrega asignados. Existen ${deliveryStopCount} paradas de descarga en la ruta, por lo que debe especificar a cuál ${isSingle ? "se entregará" : "se entregarán"}.`,
  },
  format: {
    stopPickupLabel: (index: number, label: string) =>
      `Parada #${index + 1} (${label})`,
    quotedName: (name: string) => `"${name}"`,
  },
  section: {
    merchandise: "Mercancías y movimientos",
  },
} as const;
