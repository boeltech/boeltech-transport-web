/**
 * Namespace: trips.copy.tripDetail.history.*
 */
export const historyCopy = {
  section: {
    statusHistory: "Historial de estados",
    activity: "Actividad",
  },
  action: {
    expand: "Ver historial de estados",
    collapse: "Ocultar historial",
    viewAll: "Ver toda la actividad",
  },
  state: {
    empty: "No hay historial de cambios disponible.",
  },
  label: {
    mileage: "Kilometraje",
    fromStatus: (previousLabel: string) => `(desde ${previousLabel})`,
  },
  format: {
    mileageLine: (formattedMileage: string) =>
      `Kilometraje: ${formattedMileage}`,
    passedTo: (statusLabel: string) => `Pasó a ${statusLabel}`,
    createdAs: (statusLabel: string) =>
      statusLabel === "Reserva" || statusLabel === "Borrador"
        ? "Reserva creada"
        : statusLabel,
  },
} as const;
