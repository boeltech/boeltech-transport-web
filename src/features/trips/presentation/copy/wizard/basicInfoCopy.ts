/**
 * Namespace: trips.copy.wizard.basicInfo.*
 */
export const basicInfoCopy = {
  section: {
    assignments: "Asignaciones",
    listingOptions: "Opciones de listado",
    supportStaff: "Equipo de apoyo",
    scheduling: "Programación",
  },
  label: {
    originBranch: "Base operativa del viaje",
    vehicle: "Unidad",
    driver: "Conductor",
    client: "Cliente que contrata",
    cfdiDocumentIntent: "Tipo de viaje",
    scheduledDeparture: "Salida programada",
    scheduledArrival: "Llegada estimada",
    startMileage: "Kilometraje inicial",
    showAllFleet: "Ver toda la flota",
    allowExpiredDocs: "Permitir documentación vencida",
    supportStaffPositionFilter: "Filtrar empleados por puesto",
    supportStaffEmployee: "Empleado",
    paymentResponsible: "Responsable de pago",
    paymentNotes: "Notas (opcional)",
    tableEmployee: "Empleado",
    tablePaymentResponsible: "Resp. pago",
    tableNotes: "Notas",
  },
  hint: {
    assignmentsScope:
      "Asigna la base, unidad, conductor y cliente. Las paradas se capturan en el paso Ruta.",
    originBranch:
      "Filtra la flota sugerida y queda registrada para reportes. No es, por defecto, el punto donde se carga la mercancía.",
    client:
      "Quién contrata el servicio. Entrega y recepción por parada se definen en Ruta.",
    cfdiDocumentIntent:
      "Define si el viaje lleva factura de servicio o es solo traslado. Orienta etiquetas en Ruta.",
    supportStaff:
      "Personal que acompaña la operación y puede marcarse como responsable de pago de honorarios o viáticos. No sustituye al conductor principal del viaje.",
    scheduledArrival:
      "Sincronizado con la parada de destino del paso Ruta. Si se modifica en cualquiera de los dos puntos, se actualiza el otro.",
    fleetBranchFilter:
      "Listado filtrado por la base operativa. Activa la opción para ver todo el catálogo.",
    allowExpiredDocs:
      "Muestra activos con seguro, permiso SCT o licencia vencidos (con fecha) para asignarlos. Sin vigencia o sin registro no se liberan con este permiso.",
  },
  hintLabel: {
    originBranch: "Base operativa del viaje",
    client: "Cliente que contrata",
    cfdiDocumentIntent: "Tipo de viaje",
    scheduledArrival: "Llegada estimada",
    supportStaff: "Equipo de apoyo interno",
    allowExpiredDocs: "Permitir documentación vencida",
    cfdiDocumentIntentDetail:
      "Servicio con factura: viaje facturable al cliente. Solo traslado: movimiento entre ubicaciones sin factura de servicio.",
  },
  placeholder: {
    selectOriginBranch: "Seleccionar base operativa",
    selectVehicle: "Seleccionar unidad",
    selectDriver: "Seleccionar conductor",
    selectClient: "Seleccionar cliente",
    cfdiDocumentIntent: "Tipo de viaje",
    position: "Puesto",
    selectEmployee: "Seleccionar empleado",
    paymentNotes: "Ej. pago por apoyo en turno nocturno",
    startMileage: "0",
  },
  state: {
    available: "Disponibles",
    softBusy: "En otro viaje",
    withExpiredDocs: "Con documentación vencida",
    notAssignable: "No asignables",
    noBranches: "No hay sucursales activas",
    noVehicles: "No hay unidades disponibles",
    noDrivers: "No hay conductores disponibles",
    noTrailers: "No hay remolques disponibles",
    noDriversOutsideSupportStaff:
      "No hay conductores fuera del equipo de apoyo. Quita colaboradores de apoyo para poder asignarlos como conductor principal.",
    noEmployeesForPosition: "No hay empleados con este puesto",
    emptySupportStaffTable:
      "Completa el formulario superior y pulsa Agregar para listar colaboradores aquí.",
    yes: "Sí",
    dash: "—",
  },
  alert: {
    expiredAssignmentTitle: "Documentación vencida en la asignación",
    expiredVehicleItem: (reason: string) => reason,
    expiredDriverItem: (reason: string) => reason,
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
      return `${parts.resourceLabel} está en el viaje ${parts.tripCode} (${parts.statusLabel}${when}). Puedes guardar esta reserva; al confirmar, el recurso debe estar libre.`;
    },
    softBusyBodyGeneric: (resourceLabel: string) =>
      `${resourceLabel} está asignado a otro viaje activo. Puedes guardar esta reserva; al confirmar, el recurso debe estar libre.`,
    softBusyVehicleLabel: "Esta unidad",
    softBusyDriverLabel: "Este conductor",
    softBusyTrailerLabel: "Este remolque",
    softBusyStaffLabel: "Este colaborador",
    licenseCategorySoftTitle: "Categoría SICT y tipo de unidad",
    licenseCategorySoftHint:
      "Es una advertencia operativa: puedes continuar con la asignación.",
    licenseMissingFederalTitle: "Sin licencia federal SICT",
    licenseMissingFederalHint:
      "El conductor solo tiene licencia estatal o no tiene federal. Puedes asignarlo; se utilizará la estatal en Carta Porte si no cuenta con federal.",
    licenseSignalsLegend:
      "Señales: licencia vencida (grupo aparte) · categoría SICT ≠ unidad · sin licencia federal. Las dos últimas no bloquean.",
    assignmentClearedTitle: "Asignación actualizada",
    assignmentClearedBody:
      "La unidad o el conductor ya no corresponden a la base operativa. Vuelve a seleccionarlos.",
  },
  badge: {
    licenseCategorySoft: "Categoría SICT ≠ unidad",
    licenseMissingFederal: "Sin federal",
  },
  action: {
    add: "Agregar",
    removeCollaborator: "Quitar colaborador",
    tableRemoveSrOnly: "Quitar",
    createBranch: "Crear sucursal",
  },
  cfdiIntent: {
    ingreso: "Servicio con factura",
    traslado: "Solo traslado (sin factura de servicio)",
  },
  positionFilter: {
    conductor: "Conductores",
    helper: "Ayudantes generales",
  },
  error: {
    selectEmployee: "Selecciona un empleado.",
    cannotAddEmployee: "No puedes agregar este empleado.",
    employeeUnavailableForSupport:
      "Este empleado ya no está disponible para apoyo; elige otro.",
    alreadyInSupportStaff: "Este empleado ya está en el equipo de apoyo.",
    driverInSupportStaff:
      "El conductor principal no puede figurar en el equipo de apoyo.",
  },
  format: {
    vehicleOption: (unitNumber: string, licensePlate: string) =>
      `${unitNumber} — ${licensePlate}`,
    trailerOption: (licensePlate: string, satSubTipoRemCode: string) =>
      `${licensePlate} · ${satSubTipoRemCode}`,
    currentMileage: (km: number) =>
      `Kilometraje actual: ${km.toLocaleString()} km`,
  },
  preset: {
    todayAtEight: "Hoy 08:00",
    tomorrowAtEight: "Mañana 08:00",
  },
} as const;
