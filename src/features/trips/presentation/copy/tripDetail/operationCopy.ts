import type { Trip, TripInternalStaff } from "@features/trips/domain";

/**
 * Namespace: trips.copy.tripDetail.operation.*
 * Superficie operativa (Capa 1 D8 / D11 + handoff flota/tripulación): ficha quién / cuándo / flota / km.
 */
export const operationCopy = {
  section: {
    client: "Cliente y contrato",
    schedule: "Programación",
    assignment: "Flota y tripulación",
    mileage: "Kilometraje",
    notes: "Notas",
  },
  hint: {
    client: "Quién contrata, paga y recibe la factura.",
    /** RP-7: subtítulo del artboard. */
    schedule:
      "Los tiempos reales y el kilometraje se registran en Seguimiento.",
    assignment: "Unidad, remolques, operador principal y equipo de apoyo.",
    mileage: "Kilometraje al salir y al cerrar.",
    notes: "Observaciones del canal (teléfono, mensaje, etc.).",
    notesEmpty: "Sin notas",
    staffSection: "Equipo de apoyo",
    paymentResponsible: "Responsable de pago",
    trailersSection: "Remolques",
    cancelledFleetReadOnly:
      "Asignación al momento de cancelar. Solo lectura.",
    /** Hint largo solo en el selector (RP-8), no en la tarjeta. */
    routeType:
      "Define cómo se paga al operador: entrega urbana (Local), trayecto foráneo, o maniobra patio↔patio (Transfer / Patio). No es la facturación del viaje.",
    sinCfdiClient: "Cobro operativo; este viaje no emite factura.",
    /** RP-12: subtítulo bajo Resultado estimado. */
    resultIncludesQueued: "Incluye registros en revisión.",
  },
  action: {
    viewClient: "Ver cliente",
    changeRouteType: "Cambiar",
    saveSchedule: "Guardar programación",
    savingSchedule: "Guardando…",
    cancelSchedule: "Cancelar",
    reassignFleet: "Reasignar flota",
    assignFleet: "Asignar flota",
    liquidateEmployee: "Armar pago",
    liquidateEmployeeHint:
      "Abre el pago del período para este operador (incluye otros viajes del rango).",
    viewTripSettlements: "Ver pagos del viaje",
    callDriver: "Llamar",
    editSchedule: "Editar programación",
    viewCosts: "Ver costos",
    viewBilling: "Ver facturación",
    viewCash: "Ver cobro",
    viewAllActivity: "Ver toda la actividad",
    saveRouteType: "Guardar",
    savingRouteType: "Guardando…",
    cancel: "Cancelar",
  },
  rail: {
    result: "Resultado del viaje",
    resultEstimated: "Resultado estimado",
    billing: "Facturación y cobro",
    activity: "Actividad",
    noBillingPending: "Sin pendientes de facturación",
    billingPendingCount: (n: number, detail: string) =>
      n === 1 ? `1 pendiente: ${detail}` : `${n} pendientes: ${detail}`,
    freightInvoice: (folio: string) => `Factura de flete ${folio}`,
    freightPending: "Flete · Por facturar",
    /** RP-13: reparto parcial. */
    billingInProgress: "Facturación en curso",
    cancelledNoCosts: "Sin registros de costos. El viaje no se realizó.",
    marginWithQueued: (marginPct: string, _queued?: string) =>
      `Margen ${marginPct}`,
    marginOnly: (marginPct: string) => `Margen ${marginPct}`,
    marginWithCostsLink: (marginPct: string) =>
      `Margen ${marginPct} · Ver costos`,
    rate: "Tarifa",
    trailerPosition: (position: number) => `Posición ${position}`,
  },
  scheduleTable: {
    ariaLabel: "Programación programado frente a real",
    /** RP-7: primera columna sin «Concepto». */
    event: "",
    scheduled: "Programado",
    actual: "Real",
    difference: "Diferencia",
    mileageKm: "Kilometraje (km)",
    departure: "Salida",
    arrival: "Llegada",
    onTime: "A tiempo",
    after: (label: string) => `${label} después`,
    before: (label: string) => `${label} antes`,
    /** RP-7: sin pie «Planeado N km» (vive en Ruta / Recorrido). */
    footer: (parts: {
      actualKm: string | null;
      plannedKm: string | null;
      duration: string | null;
    }) => {
      const bits: string[] = [];
      if (parts.actualKm) bits.push(`Recorrido real ${parts.actualKm}`);
      if (parts.duration) bits.push(`Duración ${parts.duration}`);
      return bits.join(" · ");
    },
  },
  settlement: {
    sectionTitle: "Pagos a operadores",
  },
  fleetAssignment: {
    sheetTitle: "Flota y tripulación",
    /** Antes de iniciar (draft / scheduled). */
    sheetDescription:
      "Modifica la asignación de tractocamión, remolques y operadores antes de iniciar el viaje.",
    /** Mid-trip (in_progress) — Q9b / Ajuste-Flota. */
    sheetDescriptionInProgress:
      "Cambia la unidad, los remolques o los operadores del viaje en curso.",
    /**
     * Q7: no inventar «a N km» de unidad sin GPS.
     * Si no hay señal GPS, la distancia se omite (—); no se calcula a ojo.
     */
    vehicleDistanceUnknown: "—",
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
      /** Política B — odómetro de la unidad entrante al cambiar flota. */
      startMileage: "Kilometraje (odómetro de esta unidad)",
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
        "Habilita la asignación a pesar de tener póliza, permiso SCT o licencia vencidos (con fecha). Sin vigencia o sin registro no se liberan con este permiso.",
      vehicleSelect: "Selecciona una unidad disponible para el viaje.",
      driverSelect: "Selecciona un operador disponible.",
      supportStaff:
        "Selecciona puesto y empleado; el integrante queda en la lista al agregar o al guardar con la selección pendiente.",
      fleetBranchFilter:
        "Listado filtrado por la base operativa del viaje. Activa la opción para ver todo el catálogo.",
      startMileage:
        "Lectura del odómetro de la unidad que asignas. Se precarga con el kilometraje del catálogo; puedes corregirlo.",
      startMileageFromCatalog: (km: number) =>
        `Odómetro en catálogo: ${km.toLocaleString("es-MX")} km`,
    },
    placeholders: {
      vehicle: "Seleccionar unidad…",
      driver: "Seleccionar conductor…",
      supportStaffEmployee: "Seleccionar empleado…",
      startMileage: "0",
    },
    errors: {
      vehicleRequired: "Unidad requerida",
      driverRequired: "Conductor requerido",
      selectEmployeeToAdd: "Selecciona un empleado para agregar al equipo.",
      employeeUnavailable: "El empleado seleccionado no está disponible.",
      employeeAlreadyAssigned:
        "El empleado ya está asignado como conductor titular o en el equipo de apoyo.",
      employeeAlreadyInStaff: "Este empleado ya fue agregado al equipo de apoyo.",
      incomingOdometerRequired:
        "Indica el kilometraje (odómetro) de la unidad que asignas.",
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
      fiscalImpactTitle: "Factura ya emitida",
      fiscalImpactBody:
        "Este viaje ya cuenta con factura emitida. Cambiar unidad, conductor (operador principal) o remolques impacta el documento de transporte y requerirá sustitución de la factura. El equipo de apoyo no forma parte de ese documento y no dispara esa revisión.",
      fiscalConfirmDialogTitle: "¿Confirmar reasignación con factura emitida?",
      fiscalConfirmDialogBody: (tripCode: string) =>
        `El viaje ${tripCode} tiene una factura emitida asociada. Al cambiar unidad, conductor (operador principal) o remolques, la información física en ruta no coincidirá con el documento vigente hasta que se genere la sustitución correspondiente. El equipo de apoyo no forma parte del documento de transporte.`,
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
    routeTypeUpdated: "Clase de ruta actualizada",
    routeTypeUpdateError: "No se pudo guardar la clase de ruta",
    routeTypeLockedBySettlement:
      "No se puede cambiar la clase de ruta: el viaje ya está en una liquidación pagada",
  },
  error: {
    departureRequired: "La salida programada es obligatoria.",
  },
  preset: {
    todayAtEight: "Hoy 08:00",
    tomorrowAtEight: "Mañana 08:00",
  },
  label: {
    /** RP-8. */
    legalName: "Cliente (quien paga)",
    tripType: "Facturación del viaje",
    routeType: "Clase de ruta",
    originBranch: "Sucursal de origen",
    scheduledDeparture: "Salida programada",
    scheduledArrival: "Llegada estimada",
    scheduledDepartureReadOnly: "Salida",
    actualDeparture: "Salida real",
    actualArrival: "Llegada real",
    unit: "Unidad",
    plate: "Placa",
    trailers: "Remolques",
    driver: "Operador principal",
    mileageStart: "Odómetro al salir",
    mileageEnd: "Odómetro al cerrar",
    facturadoVigente: "Facturado vigente",
    cobradoViaje: "Cobrado del viaje",
  },
  state: {
    clientUnavailable: "Cliente no disponible en esta vista",
    noVehicle: "Sin vehículo asignado",
    noDriver: "Sin conductor asignado",
    noTrailers: "Sin remolques",
    noSupportStaff: "Sin equipo de apoyo",
    noOriginBranch: "Sin sucursal",
    emptyDash: "—",
  },
  format: {
    tripType(intent: Trip["cfdiDocumentIntent"]): string {
      if (intent === "traslado") {
        return "Solo traslado";
      }
      return "Servicio con factura";
    },
    trailerLine(_position: 1 | 2, licensePlate: string): string {
      return licensePlate;
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
    staffSupportLine: (count: number) =>
      count === 1 ? "Equipo de apoyo · 1" : `Equipo de apoyo · ${count}`,
  },
} as const;
