import type { Trip } from "@features/trips/domain";

/**
 * Namespace: trips.copy.tripDetail.operation.*
 */
export const operationCopy = {
  section: {
    client: "Cliente",
    schedule: "Programación y tiempos",
    assignment: "Unidad y conductor",
    mileage: "Kilometraje",
    notes: "Notas",
  },
  hint: {
    client: "Contratante del viaje y tipo de operación.",
    schedule: "Salidas, llegadas estimadas y tiempos reales.",
    assignment: "Vehículo, conductor y equipo de apoyo asignados.",
    mileage: "Lecturas de odómetro al inicio y al cierre.",
    notes: "Observaciones y notas del canal (teléfono, mensaje, etc.).",
    staffSection: "Equipo de apoyo (interno)",
    paymentResponsible: "Responsable de pago",
  },
  action: {
    viewClient: "Ver cliente",
  },
  label: {
    legalName: "Razón social",
    tripType: "Tipo de viaje",
    actualDeparture: "Salida real",
    actualArrival: "Llegada real",
    unit: "Unidad",
    plate: "Placa",
    driver: "Conductor",
    mileageStart: "Inicial",
    mileageEnd: "Final",
  },
  state: {
    clientUnavailable: "Cliente no disponible en esta vista",
    noVehicle: "Sin vehículo asignado",
    noDriver: "Sin conductor asignado",
  },
  format: {
    tripType(intent: Trip["cfdiDocumentIntent"]): string {
      if (intent === "traslado") {
        return "Solo traslado (sin factura de servicio)";
      }
      return "Servicio con factura";
    },
    clientUnavailableId(clientId: string): string {
      return `${operationCopy.state.clientUnavailable} (ID: ${clientId})`;
    },
  },
} as const;
