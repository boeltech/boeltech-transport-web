import type { Trip } from "@features/trips/domain";

/**
 * Namespace: trips.copy.tripDetail.operation.*
 */
export const operationCopy = {
  section: {
    scope: "Alcance de Operación",
    client: "Cliente y documento",
    schedule: "Programación y tiempos",
    assignment: "Unidad y conductor",
    mileage: "Kilometraje",
    notes: "Notas",
  },
  hint: {
    client:
      "Contratante del viaje e intención de CFDI para la operación.",
    schedule: "Salidas, llegadas estimadas y duración del trayecto.",
    assignment: "Vehículo, conductor y equipo de apoyo asignados.",
    mileage: "Lecturas de odómetro y distancia recorrida o estimada.",
    notes: "Observaciones registradas para este viaje.",
    scopeEditable:
      "Consulta programación, asignaciones y kilometraje. No sustituye al wizard ni a los demás tabs.",
    scopeEditableEdit:
      "Edite fechas en programación. Unidad, conductor y cliente en edición completa; paradas en Ruta.",
    scopeReadOnly:
      "Programación y asignaciones en solo lectura. Gastos y seguimiento en sus tabs.",
    staffSection: "Equipo de apoyo (interno)",
    paymentResponsible: "Responsable de pago",
  },
  action: {
    viewClient: "Ver cliente",
  },
  label: {
    legalName: "Razón social",
    cfdiIntent: "Intención CFDI",
    actualDeparture: "Salida real",
    actualArrival: "Llegada real",
    duration: "Duración",
    unit: "Unidad",
    plate: "Placa",
    driver: "Conductor",
    mileageStart: "Inicial",
    mileageEnd: "Final",
    distance: "Distancia",
  },
  state: {
    clientUnavailable: "Cliente no disponible en esta vista",
    noVehicle: "Sin vehículo asignado",
    noDriver: "Sin conductor asignado",
  },
  format: {
    cfdiIntent(intent: Trip["cfdiDocumentIntent"]): string {
      if (intent === "traslado") {
        return "Traslado — movimiento entre ubicaciones";
      }
      return "Ingreso — factura de servicio";
    },
    clientUnavailableId(clientId: string): string {
      return `${operationCopy.state.clientUnavailable} (ID: ${clientId})`;
    },
  },
} as const;
