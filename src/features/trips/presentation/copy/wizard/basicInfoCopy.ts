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
    vehicle: "Vehículo",
    driver: "Conductor",
    client: "Cliente que contrata",
    cfdiDocumentIntent: "Tipo de comprobante del viaje",
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
      "Asigna vehículo, conductor y cliente. Las paradas se capturan en el paso Ruta.",
    client:
      "Quién contrata el servicio. Entrega y recepción por parada se definen en Ruta.",
    cfdiDocumentIntent:
      "Define si el viaje se documenta como ingreso o traslado. Ajusta etiquetas en Ruta.",
    supportStaff:
      "Personal que acompaña la operación y puede marcarse como responsable de pago de honorarios o viáticos. No sustituye al conductor principal del viaje.",
    scheduledArrival:
      "Sincronizado con la parada de destino del paso Ruta. Si se modifica en cualquiera de los dos puntos, se actualiza el otro.",
    fleetBranchFilter:
      "Listado filtrado por sucursal de origen. Activa la opción para ver todo el catálogo.",
    allowExpiredDocs:
      "Muestra activos con seguro, permiso SCT o licencia vencidos para asignarlos.",
  },
  hintLabel: {
    client: "Cliente que contrata",
    cfdiDocumentIntent: "Tipo de comprobante del viaje",
    scheduledArrival: "Llegada estimada",
    supportStaff: "Equipo de apoyo interno",
    allowExpiredDocs: "Permitir documentación vencida",
    cfdiDocumentIntentDetail:
      "Ingreso: factura de servicio. Traslado: movimiento entre ubicaciones. El timbrado validará los datos finales.",
  },
  placeholder: {
    selectVehicle: "Seleccionar vehículo",
    selectDriver: "Seleccionar conductor",
    selectClient: "Seleccionar cliente",
    cfdiDocumentIntent: "Tipo de comprobante",
    position: "Puesto",
    selectEmployee: "Seleccionar empleado",
    paymentNotes: "Ej. pago por apoyo en turno nocturno",
    startMileage: "0",
  },
  state: {
    available: "Disponibles",
    withExpiredDocs: "Con documentación vencida",
    notAssignable: "No asignables",
    noVehicles: "No hay vehículos disponibles",
    noDrivers: "No hay conductores disponibles",
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
  },
  cfdiIntent: {
    ingreso: "Ingreso — factura de servicio",
    traslado: "Traslado — movimiento entre ubicaciones",
  },
  positionFilter: {
    conductor: "Conductores",
    helper: "Ayudantes generales",
  },
  action: {
    add: "Agregar",
    removeCollaborator: "Quitar colaborador",
    tableRemoveSrOnly: "Quitar",
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
  paywall: {
    title: "Módulo no contratado",
    description:
      "El equipo de apoyo interno requiere el add-on de compensación interna. Actívalo desde Plan y consumo o contacta a Boeltech.",
    cta: "Ver plan y consumo",
  },
  format: {
    vehicleOption: (unitNumber: string, licensePlate: string) =>
      `${unitNumber} — ${licensePlate}`,
    currentMileage: (km: number) =>
      `Kilometraje actual: ${km.toLocaleString()} km`,
  },
} as const;
