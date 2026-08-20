import type { Trip } from "@features/trips/domain";

/**
 * Namespace: trips.copy.tripDetail.operation.*
 * Superficie operativa (Capa 1 D8 / D11): ficha quién / cuándo / quién maneja / km.
 */
export const operationCopy = {
  section: {
    client: "Cliente",
    schedule: "Programación",
    assignment: "Unidad y conductor",
    mileage: "Kilometraje",
    notes: "Notas",
  },
  hint: {
    client: "Quién contrata el viaje.",
    schedule: "Salida y llegada programadas. Los tiempos reales se registran al operar.",
    assignment: "Quién maneja y con qué unidad.",
    mileage: "Kilometraje al salir y al cerrar.",
    notes: "Observaciones del canal (teléfono, mensaje, etc.).",
    staffSection: "Equipo de apoyo",
    paymentResponsible: "Responsable de pago",
    trailersSection: "Remolques",
  },
  action: {
    viewClient: "Ver cliente",
    saveSchedule: "Guardar programación",
    savingSchedule: "Guardando…",
    cancelSchedule: "Cancelar",
    viewPlan: "Ver Tu plan",
  },
  alert: {
    staffModuleInactiveTitle: "Módulo no activo",
    staffModuleInactiveBody:
      "Este viaje incluye equipo de apoyo, pero el add-on ya no está activo en tu cuenta. Los datos se muestran solo lectura.",
  },
  toast: {
    scheduleUpdated: "Programación actualizada",
    scheduleUpdateError: "No se pudo guardar la programación",
  },
  error: {
    departureRequired: "La salida programada es obligatoria.",
  },
  preset: {
    todayAtEight: "Hoy 08:00",
    tomorrowAtEight: "Mañana 08:00",
  },
  label: {
    legalName: "Razón social",
    tripType: "Tipo de viaje",
    scheduledDeparture: "Salida programada",
    scheduledArrival: "Llegada estimada",
    scheduledDepartureReadOnly: "Salida",
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
    noTrailers: "Sin remolques asignados",
  },
  format: {
    tripType(intent: Trip["cfdiDocumentIntent"]): string {
      if (intent === "traslado") {
        return "Solo traslado";
      }
      return "Servicio con factura";
    },
    trailerLine(position: 1 | 2, licensePlate: string): string {
      return `${licensePlate} · ${position}`;
    },
  },
} as const;
