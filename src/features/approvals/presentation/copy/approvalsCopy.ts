import type { ApprovableType } from "../../domain";

export const approvalsCopy = {
  inbox: {
    title: "Aprobaciones",
    description:
      "Revisa y autoriza gastos de viaje, anticipos a operadores y liquidaciones de la operación.",
    tabs: {
      tripExpense: "Gastos de viaje",
      driverAdvance: "Anticipos a chofer",
      settlement: "Liquidaciones",
    },
    searchPlaceholder: "Buscar por viaje, operador, folio o descripción…",
    empty: {
      titleClear: "Bandeja al día",
      descriptionClear:
        "No hay elementos pendientes de aprobación en este momento.",
      titleFiltered: "Sin resultados",
      descriptionFiltered:
        "No hay registros que coincidan con los filtros actuales. Prueba otro estado o rango de fechas.",
      descriptionTripFilter: (tripLabel: string) =>
        `No hay elementos pendientes para el viaje ${tripLabel} con los filtros actuales.`,
    },
    refreshSuccess: "Bandeja actualizada",
    readOnly: {
      title: "Solo consulta",
      description:
        "Tu rol puede ver la bandeja, pero no autorizar ni rechazar solicitudes. Contacta a un gerente o contador si requieres autorización.",
    },
    errors: {
      loadTitle: "No se pudo cargar la bandeja",
      retry: "Reintentar",
    },
    filters: {
      type: "Tipo de aprobación",
      status: "Estado",
      statusAll: "Todos los estados",
      category: "Categoría",
      categoryAll: "Todas las categorías",
      fromDate: "Desde",
      toDate: "Hasta",
      statusChip: (label: string) => `Estado: ${label}`,
      categoryChip: (label: string) => `Categoría: ${label}`,
      tripChip: (tripLabel: string) => `Viaje: ${tripLabel}`,
      driverChip: (driverId: string) => `Operador: ${driverId}`,
      vehicleChip: (vehicleId: string) => `Unidad: ${vehicleId}`,
      dateFilterHeading: "Filtrar por fecha de registro",
      dateFilterPlaceholder: "Filtrar por fecha",
    },
    table: {
      select: "Seleccionar",
      type: "Tipo",
      trip: "Referencia",
      category: "Categoría",
      description: "Detalle / Soporte",
      amount: "Monto",
      date: "Fecha",
      status: "Estado",
      actions: "Acciones",
      noDescription: "—",
      noReason: "(sin razón)",
      receiptCfdi: "CFDI validado",
      receiptTicket: "Ticket / Nota",
      receiptNone: "Sin comprobante",
      openDebtAlert: (amount: string, count?: number) =>
        `Deuda abierta: ${amount}${typeof count === "number" && count > 0 ? ` (${count} anticipo${count > 1 ? "s" : ""})` : ""}`,
      noOpenDebt: "Sin anticipos abiertos",
    },
    actions: {
      approve: "Aprobar",
      reject: "Rechazar",
      approveConfirmTitle: (type?: ApprovableType) => {
        switch (type) {
          case "driver_advance_request":
            return "¿Aprobar este anticipo?";
          case "internal_staff_compensation":
            return "¿Aprobar esta liquidación?";
          case "trip_expense":
          default:
            return "¿Aprobar este gasto?";
        }
      },
      approveConfirmDescription: (type?: ApprovableType) => {
        switch (type) {
          case "driver_advance_request":
            return "El anticipo se marcará como aprobado y quedará listo para dispersión en Tesorería.";
          case "internal_staff_compensation":
            return "La liquidación se marcará como aprobada y quedará lista para pago.";
          case "trip_expense":
          default:
            return "El gasto se marcará como aprobado y el costo real del viaje se actualizará.";
        }
      },
      approveConfirmDescriptionContext: (input: {
        tripCode: string;
        category: string;
        amount: string;
        description?: string;
      }) => {
        const detail = [input.tripCode, input.category, input.amount];
        if (input.description) detail.push(input.description);
        return `${detail.join(" · ")}. El gasto se marcará como aprobado y el costo real del viaje se actualizará.`;
      },
      approveConfirmAction: (type?: ApprovableType) => {
        switch (type) {
          case "driver_advance_request":
            return "Aprobar anticipo";
          case "internal_staff_compensation":
            return "Aprobar liquidación";
          case "trip_expense":
          default:
            return "Aprobar gasto";
        }
      },
      cancel: "Cancelar",
      selfApprovalNotAllowed:
        "No puedes autorizar o rechazar una solicitud que tú mismo enviaste",
    },
    toasts: {
      approveSuccess: (type?: ApprovableType) => {
        switch (type) {
          case "driver_advance_request":
            return "Anticipo aprobado para dispersión";
          case "internal_staff_compensation":
            return "Liquidación aprobada para pago";
          case "trip_expense":
          default:
            return "Gasto aprobado";
        }
      },
      approveError: (type?: ApprovableType) => {
        switch (type) {
          case "driver_advance_request":
            return "No se pudo aprobar el anticipo";
          case "internal_staff_compensation":
            return "No se pudo aprobar la liquidación";
          case "trip_expense":
          default:
            return "No se pudo aprobar el gasto";
        }
      },
      rejectSuccess: (type?: ApprovableType) => {
        switch (type) {
          case "driver_advance_request":
            return "Anticipo rechazado";
          case "internal_staff_compensation":
            return "Liquidación rechazada";
          case "trip_expense":
          default:
            return "Gasto rechazado";
        }
      },
      rejectError: (type?: ApprovableType) => {
        switch (type) {
          case "driver_advance_request":
            return "No se pudo rechazar el anticipo";
          case "internal_staff_compensation":
            return "No se pudo rechazar la liquidación";
          case "trip_expense":
          default:
            return "No se pudo rechazar el gasto";
        }
      },
      bulkSuccess: (successes: number, total: number) =>
        `Procesadas ${successes} de ${total} operaciones`,
      bulkPartial: (failures: number) =>
        `${failures} operación(es) no se completaron`,
      loadError: "No se pudo cargar la bandeja de aprobaciones",
    },
    bulk: {
      selected: (count: number) => `${count} seleccionado(s)`,
      clearSelection: "Quitar selección",
      approve: "Aprobar seleccionados",
      reject: "Rechazar seleccionados",
      maxSelection: "Máximo 50 elementos por operación masiva",
      approveConfirmTitle: (type?: ApprovableType) => {
        switch (type) {
          case "driver_advance_request":
            return "¿Aprobar los anticipos seleccionados?";
          case "internal_staff_compensation":
            return "¿Aprobar las liquidaciones seleccionadas?";
          case "trip_expense":
          default:
            return "¿Aprobar los gastos seleccionados?";
        }
      },
      approveConfirmDescription: (count: number, type?: ApprovableType) => {
        switch (type) {
          case "driver_advance_request":
            return `Se aprobarán ${count} anticipo(s) para su posterior dispersión. Esta acción no se puede deshacer.`;
          case "internal_staff_compensation":
            return `Se aprobarán ${count} liquidación(es) para su pago. Esta acción no se puede deshacer.`;
          case "trip_expense":
          default:
            return `Se aprobarán ${count} gasto(s). Esta acción no se puede deshacer.`;
        }
      },
    },
    unsupportedType: "Tipo no soportado en esta versión",
  },
  rejectSheet: {
    title: (type?: ApprovableType) => {
      switch (type) {
        case "driver_advance_request":
          return "Rechazar anticipo";
        case "internal_staff_compensation":
          return "Rechazar liquidación";
        case "trip_expense":
        default:
          return "Rechazar gasto";
      }
    },
    titleBulk: (count: number, type?: ApprovableType) => {
      switch (type) {
        case "driver_advance_request":
          return `Rechazar ${count} anticipos`;
        case "internal_staff_compensation":
          return `Rechazar ${count} liquidaciones`;
        case "trip_expense":
        default:
          return `Rechazar ${count} gastos`;
      }
    },
    description: (type?: ApprovableType) => {
      switch (type) {
        case "driver_advance_request":
          return "Indica la razón del rechazo del anticipo (mínimo 5 caracteres).";
        case "internal_staff_compensation":
          return "Indica la razón del rechazo de la liquidación (mínimo 5 caracteres).";
        case "trip_expense":
        default:
          return "Indica la razón del rechazo del gasto (mínimo 5 caracteres).";
      }
    },
    descriptionBulk: (count: number, type?: ApprovableType) => {
      switch (type) {
        case "driver_advance_request":
          return `Indica la razón del rechazo para ${count} anticipo(s) (mínimo 5 caracteres).`;
        case "internal_staff_compensation":
          return `Indica la razón del rechazo para ${count} liquidación(es) (mínimo 5 caracteres).`;
        case "trip_expense":
        default:
          return `Indica la razón del rechazo para ${count} gasto(s) (mínimo 5 caracteres).`;
      }
    },
    reasonLabel: "Razón del rechazo",
    reasonPlaceholder: "Describe por qué se rechaza esta solicitud…",
    cancel: "Cancelar",
    submit: "Rechazar",
    reasonTooShort: "La razón debe tener al menos 5 caracteres",
    counter: (current: number, max: number) => `${current}/${max}`,
  },
} as const;
