import type { Trip, TripInternalStaff } from "@features/trips/domain";

/**
 * Namespace: trips.copy.tripDetail.operation.*
 * Superficie operativa (Capa 1 D8 / D11 + handoff flota/tripulación): ficha quién / cuándo / flota / km.
 */
export const operationCopy = {
  section: {
    client: "Cliente",
    schedule: "Programación",
    assignment: "Flota y tripulación",
    mileage: "Kilometraje",
    notes: "Notas",
  },
  hint: {
    client: "Quién contrata el viaje.",
    schedule: "Salida y llegada programadas. Los tiempos reales se registran al operar.",
    assignment: "Unidad, remolques, operador principal y equipo de apoyo.",
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
    reassignFleet: "Reasignar flota",
    assignFleet: "Asignar flota",
    liquidateEmployee: "Liquidar período",
    liquidateEmployeeHint:
      "Abre una liquidación del período para este operador (incluye otros viajes del rango).",
    viewTripSettlements: "Ver liquidaciones del viaje",
  },
  settlement: {
    sectionTitle: "Liquidaciones",
  },
  fleetAssignment: {
    sheetTitle: "Flota y tripulación",
    sheetDescription:
      "Modifica la asignación de tractocamión, remolques y operadores antes de iniciar el viaje.",
    saveButton: "Guardar y reasignar",
    savingButton: "Guardando…",
    cancelButton: "Cancelar",
    sections: {
      vehicle: "Unidad y remolques",
      driver: "Conductor y tripulación",
      supportStaff: "Personal de apoyo",
      exceptions: "Excepciones documentales",
    },
    labels: {
      vehicle: "Unidad tractora",
      driver: "Operador principal",
      allowExpiredDocs: "Permitir asignación con documentación vencida",
      supportStaffFilter: "Filtrar por puesto",
      supportStaffEmployee: "Empleado",
      supportStaffRole: "Rol interno",
      supportStaffNotes: "Notas de pago / viáticos",
      availableGroup: "Disponibles",
      softBusyGroup: "En otro viaje",
      softHoldGroup: "En reserva",
      unavailableGroup: "No disponibles",
      blockedBadgeDefault: "Bloqueado",
      roleSecondaryDriver: "Segundo conductor",
      roleHelper: "Ayudante general",
      roleSecondaryDriverShort: "2º Conductor",
      roleHelperShort: "Ayudante",
      positionDriver: "Conductor",
      positionHelper: "Ayudante general",
      withExpiredDocs: "Con documentación vencida",
      noVehicles: "No hay unidades disponibles",
      noDrivers: "No hay conductores disponibles",
      noDriversOutsideSupportStaff:
        "No hay conductores fuera del equipo de apoyo. Quita colaboradores de apoyo para poder asignarlos como conductor principal.",
      showAllFleet: "Ver toda la flota",
      licenseCategorySoft: "Categoría no recomendada",
      licenseMissingFederal: "Sin licencia federal",
      listingOptions: "Opciones de listado",
    },
    actions: {
      addStaffMember: "Agregar integrante",
      deleteStaffMember: "Eliminar integrante",
    },
    hints: {
      allowExpiredDocs:
        "Habilita la asignación a pesar de tener póliza, permiso SCT o licencia fuera de vigencia, o sin fecha de vigencia.",
      vehicleSelect: "Selecciona una unidad disponible para el viaje.",
      driverSelect: "Selecciona un operador disponible.",
      supportStaff:
        "Selecciona puesto y empleado; el integrante queda en la lista al agregar o al guardar con la selección pendiente.",
      fleetBranchFilter:
        "Listado filtrado por la base operativa del viaje. Activa la opción para ver todo el catálogo.",
    },
    placeholders: {
      vehicle: "Seleccionar unidad…",
      driver: "Seleccionar conductor…",
      supportStaffEmployee: "Seleccionar empleado…",
    },
    errors: {
      vehicleRequired: "Unidad requerida",
      driverRequired: "Conductor requerido",
      selectEmployeeToAdd: "Selecciona un empleado para agregar al equipo.",
      employeeUnavailable: "El empleado seleccionado no está disponible.",
      employeeAlreadyAssigned:
        "El empleado ya está asignado como conductor titular o en el equipo de apoyo.",
      employeeAlreadyInStaff: "Este empleado ya fue agregado al equipo de apoyo.",
    },
    removeStaffConfirm: {
      title: (employeeName: string) =>
        `¿Quitar a ${employeeName} del equipo de apoyo?`,
      description:
        "Al eliminarlo del viaje, este empleado dejará de ser elegible para liquidación en este viaje. Esta acción no se puede deshacer.",
      confirm: "Confirmar remoción",
      cancel: "Cancelar",
    },
    validation: {
      summaryTitle: "Revisa la asignación de flota",
    },
    alerts: {
      licenseSoftMatchTitle: "Aviso de compatibilidad de licencia",
      fiscalImpactTitle: "CFDI / Carta Porte timbrada",
      fiscalImpactBody:
        "Este viaje ya cuenta con CFDI y Carta Porte timbrados. Cambiar unidad, conductor (operador principal) o remolques impacta el complemento y requerirá sustitución del CFDI. El equipo de apoyo no forma parte de Carta Porte y no dispara esa revisión.",
      fiscalConfirmDialogTitle: "¿Confirmar reasignación con Carta Porte timbrada?",
      fiscalConfirmDialogBody: (tripCode: string) =>
        `El viaje ${tripCode} tiene un CFDI timbrado asociado. Al cambiar unidad, conductor (operador principal) o remolques, la información física en ruta no coincidirá con el documento fiscal vigente hasta que se genere la sustitución correspondiente. El equipo de apoyo no forma parte del complemento.`,
      fiscalConfirmDialogConfirm: "Sí, reasignar flota",
      fiscalConfirmDialogCancel: "Regresar al formulario",
      expiredAssignmentTitle: "Asignación con documentación vencida",
      softBusyTitle: "Recurso comprometido en otro viaje",
      softBusyBody: (parts: {
        resourceLabel: string;
        tripCode: string;
        statusLabel: string;
        departureLabel?: string | null;
      }) => {
        const when = parts.departureLabel
          ? ` · salida ${parts.departureLabel}`
          : "";
        return `${parts.resourceLabel} está en el viaje ${parts.tripCode} (${parts.statusLabel}${when}). Puedes guardar; al confirmar, el recurso debe estar libre.`;
      },
      softBusyBodyGeneric: (resourceLabel: string) =>
        `${resourceLabel} está asignado a otro viaje activo. Puedes guardar; al confirmar, el recurso debe estar libre.`,
      softBusyVehicleLabel: "Esta unidad",
      softBusyDriverLabel: "Este conductor",
      softBusyStaffLabel: "Este colaborador",
      softHoldTitle: "Recurso en una reserva",
      softHoldBody: (parts: {
        resourceLabel: string;
        tripCode: string;
        departureLabel?: string | null;
      }) => {
        const when = parts.departureLabel
          ? ` · salida ${parts.departureLabel}`
          : "";
        return `${parts.resourceLabel} figura en la reserva ${parts.tripCode}${when}. Puedes reasignar; la reserva no bloquea este viaje.`;
      },
      softHoldBodyGeneric: (resourceLabel: string) =>
        `${resourceLabel} figura en una reserva solapada. Puedes reasignar; la reserva no bloquea este viaje.`,
      assignmentClearedTitle: "Asignación desmarcada",
      assignmentClearedBody:
        "El recurso seleccionado ya no es válido con los filtros actuales.",
    },
    toasts: {
      success: "Flota y tripulación actualizadas correctamente",
      error: "No fue posible actualizar la asignación de flota",
      overlapWarningTitle: "Posible traslape con una reserva",
    },
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
    driver: "Operador principal",
    mileageStart: "Inicial",
    mileageEnd: "Final",
  },
  state: {
    clientUnavailable: "Cliente no disponible en esta vista",
    noVehicle: "Sin vehículo asignado",
    noDriver: "Sin conductor asignado",
    noTrailers: "Sin remolques asignados",
    noSupportStaff: "Sin equipo de apoyo",
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
    /** Rol en ruta del card (mismas etiquetas que fleetAssignment.labels). */
    staffRole(role: TripInternalStaff["internalRole"]): string {
      if (role === "secondary_driver") {
        return "Segundo conductor";
      }
      if (role === "helper") {
        return "Ayudante general";
      }
      return "Sin rol";
    },
  },
} as const;
