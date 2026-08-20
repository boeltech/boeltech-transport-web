/**
 * Namespace: trips.copy.tripDetail.history.*
 */
export const historyCopy = {
  section: {
    statusHistory: "Historial de estados",
  },
  action: {
    expand: "Ver historial de estados",
    collapse: "Ocultar historial",
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
  },
} as const;
