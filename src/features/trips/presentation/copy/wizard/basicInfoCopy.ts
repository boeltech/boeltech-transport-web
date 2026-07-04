/**
 * Namespace: trips.copy.wizard.basicInfo.*
 */
export const basicInfoCopy = {
  section: {
    assignments: "Asignaciones",
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
    supportStaffPositionFilter: "Filtrar empleados por puesto",
    supportStaffEmployee: "Empleado",
    paymentResponsible: "Responsable de pago",
    paymentNotes: "Notas (opcional)",
    tableEmployee: "Empleado",
    tablePaymentResponsible: "Resp. pago",
    tableNotes: "Notas",
  },
  hint: {
    client:
      "Quién contrata el servicio de transporte. Quién entrega y quién recibe en cada ubicación se captura por parada en el paso Ruta.",
    cfdiDocumentIntent:
      "Indica si el servicio se documentará principalmente como ingreso (factura de servicio) o como traslado (movimiento entre ubicaciones). Ajusta etiquetas en Ruta y paradas; el timbrado validará los datos finos.",
    supportStaff:
      "Personal que acompaña la operación y puede marcarse como responsable de pago de honorarios o viáticos. No sustituye al conductor principal del viaje.",
    scheduledArrival:
      "Sincronizado con la parada de destino del paso Ruta. Si se modifica en cualquiera de los dos puntos, se actualiza el otro.",
  },
  hintLabel: {
    client: "Cliente que contrata",
    cfdiDocumentIntent: "Tipo de comprobante del viaje",
    scheduledArrival: "Llegada estimada",
    supportStaff: "Equipo de apoyo interno",
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
  format: {
    vehicleOption: (unitNumber: string, licensePlate: string) =>
      `${unitNumber} — ${licensePlate}`,
    currentMileage: (km: number) =>
      `Kilometraje actual: ${km.toLocaleString()} km`,
  },
} as const;
