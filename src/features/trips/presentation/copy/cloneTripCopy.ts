/**
 * Namespace: trips.copy.cloneTrip.*
 * Sheet «Clonar viaje» (Ola 1 F1).
 */
export const cloneTripCopy = {
  action: {
    label: "Clonar viaje",
    submit: "Clonar viaje",
    submitting: "Clonando…",
    cancel: "Cancelar",
  },
  sheet: {
    title: "Clonar viaje",
    description: (tripCode: string) =>
      `Crea un viaje nuevo a partir de ${tripCode}. Se copian cliente, ruta, cargas, flota y tarifa. No se copian facturas, seguimiento ni estados del viaje origen.`,
  },
  label: {
    scheduledDeparture: "Salida programada",
    scheduledArrival: "Llegada estimada",
  },
  validation: {
    departureRequired: "Indica la salida programada.",
    arrivalRequired: "Indica la llegada estimada.",
    arrivalAfterDeparture:
      "La llegada estimada debe ser posterior a la salida.",
  },
  preset: {
    todayAtEight: "Hoy 08:00",
    tomorrowAtEight: "Mañana 08:00",
  },
  toast: {
    success: (tripCode: string) => `Viaje ${tripCode} creado`,
    successTitle: "Viaje clonado",
    error: "No se pudo clonar el viaje",
    overlayErrorSeeInline: "Revisa el mensaje detallado en el formulario.",
    overlapWarningTitle: "Posible traslape con una reserva",
  },
} as const;
