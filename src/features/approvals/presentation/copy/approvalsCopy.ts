import type {
  ApprovableType,
  ApprovalGuardCode,
  ApprovalReturnReasonCode,
} from "../../domain";

type ApprovableNounKey = "expense" | "advance" | "settlement";

const APPROVABLE_NOUN: Record<ApprovableNounKey, { singular: string; plural: string }> = {
  expense: { singular: "gasto", plural: "gastos" },
  advance: { singular: "anticipo", plural: "anticipos" },
  settlement: { singular: "pago", plural: "pagos" },
};

function nounKey(type?: ApprovableType): ApprovableNounKey {
  switch (type) {
    case "driver_advance_request":
      return "advance";
    case "internal_staff_compensation":
      return "settlement";
    default:
      return "expense";
  }
}

/** Sustantivo del concepto en el copy de autoacción (ADR-0098 §4.4). */
export type SelfApprovalSubject = "advance" | "settlement" | "expense";

const SELF_APPROVAL_SUBJECT_NOUN: Record<SelfApprovalSubject, string> = {
  advance: "anticipo",
  settlement: "pago",
  expense: "gasto",
};

export function selfApprovalSubjectForType(
  type: ApprovableType,
): SelfApprovalSubject {
  switch (type) {
    case "driver_advance_request":
      return "advance";
    case "internal_staff_compensation":
      return "settlement";
    default:
      return "expense";
  }
}

export const approvalsCopy = {
  selfApproval: {
    badge: "Autoaprobado",
    badgeTooltip:
      "Lo autorizó la misma persona que lo envió, porque en ese momento era el único autorizador de la empresa.",
    confirmTitle: "¿Autorizar tu propia solicitud?",
    confirmBody: (subject: SelfApprovalSubject) =>
      `Tú enviaste este ${SELF_APPROVAL_SUBJECT_NOUN[subject]}. Como eres el único autorizador activo, puedes autorizarlo tú mismo. Quedará marcado como autoaprobado en el historial.`,
    confirmAction: "Sí, autorizar",
    cancel: "Cancelar",
    confirmDisburseTitle: "¿Registrar el pago de tu propia solicitud?",
    confirmDisburseBody: (subject: Exclude<SelfApprovalSubject, "expense">) =>
      `Tú registraste este ${SELF_APPROVAL_SUBJECT_NOUN[subject]}. Como eres el único usuario que puede registrar pagos, puedes hacerlo tú mismo. Quedará marcado en el historial.`,
    bulkWarning: (count: number) =>
      `Incluye ${count} solicitud(es) enviadas por ti; quedarán marcadas como autoaprobadas.`,
    ownChip: "Enviada por ti",
    ownTooltip:
      "Debe autorizarla otra persona. Pídeselo a un gerente, contador o administrador.",
    ownDisburseTooltip:
      "Debe registrar el pago otra persona. Pídeselo a un contador o administrador.",
    serverRejected:
      "No puedes autorizar esta solicitud: la enviaste tú y hay otro autorizador activo en la empresa.",
    filterChip: "Autoaprobadas",
  },
  inbox: {
    title: "Aprobaciones",
    description:
      "Revisa y autoriza gastos de viaje, anticipos a operadores y pagos a operadores.",
    tabs: {
      tripExpense: "Gastos de viaje",
      driverAdvance: "Anticipos a operadores",
      settlement: "Pagos a operadores",
    },
    searchPlaceholder: "Viaje, operador o folio",
    related: {
      advances: {
        label: "Anticipos",
        description: "Anticipos en gestión en Pagos a operadores.",
      },
      pendingApproval: {
        label: "En autorización",
        description: "Cortes esperando autorización en Pagos a operadores.",
      },
      operatorPayments: {
        label: "Pagos a operadores",
        description:
          "Cortes y anticipos que suelen generar solicitudes de autorización.",
      },
    },
    empty: {
      titleClear: "Bandeja al día",
      descriptionClear:
        "No hay elementos pendientes de aprobación en este momento.",
      titleFiltered: "Sin resultados",
      descriptionFiltered:
        "No hay registros que coincidan con los filtros actuales.",
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
      showFilters: "Filtros",
      status: "Estado",
      statusAll: "Todos los estados",
      category: "Categoría",
      categoryAll: "Todas las categorías",
      dateLabel: "Fecha de registro",
      fromDate: "Desde",
      toDate: "Hasta",
      statusChip: (label: string) => `Estado: ${label}`,
      categoryChip: (label: string) => `Categoría: ${label}`,
      tripChip: (tripLabel: string) => `Viaje: ${tripLabel}`,
      tripUnknown: "Viaje",
      driverChip: (label: string) => `Operador: ${label}`,
      driverUnknown: "Operador",
      vehicleChip: (label: string) => `Unidad: ${label}`,
      vehicleUnknown: "Unidad",
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
      /** ADR-0085 E11 (D12): mismo nombre que en Pagos a operadores. */
      reimbursementSettlementBadge: "Pago de reembolsos",
      noReason: "(sin razón)",
      receiptCfdi: "CFDI validado",
      receiptTicket: "Ticket / Nota",
      receiptNone: "Sin comprobante",
      openDebtAlert: (amount: string, count?: number) =>
        `Deuda abierta: ${amount}${typeof count === "number" && count > 0 ? ` (${count} anticipo${count > 1 ? "s" : ""})` : ""}`,
      noOpenDebt: "Sin anticipos abiertos",
      /** Anticipo sin etiqueta de viaje (cuenta del operador; no es gasto de Costos). */
      advanceNoTrip: "Sin viaje (cuenta del operador)",
    },
    actions: {
      approve: "Aprobar",
      reject: "Rechazar",
      approveConfirmTitle: (type?: ApprovableType) => {
        switch (type) {
          case "driver_advance_request":
            return "¿Aprobar este anticipo?";
          case "internal_staff_compensation":
            return "¿Aprobar este pago?";
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
            return "El pago se marcará como autorizado y quedará listo para registrarse.";
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
            return "Autorizar pago";
          case "trip_expense":
          default:
            return "Aprobar gasto";
        }
      },
      cancel: "Cancelar",
    },
    toasts: {
      approveSuccess: (type?: ApprovableType) => {
        switch (type) {
          case "driver_advance_request":
            return "Anticipo aprobado para dispersión";
          case "internal_staff_compensation":
            return "Pago autorizado para registrarse";
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
            return "No se pudo autorizar el pago";
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
            return "Pago rechazado";
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
            return "No se pudo rechazar el pago";
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
      /** B3: label corto — el conteo ya va en «N seleccionado(s)». */
      approve: "Aprobar",
      reject: "Rechazar seleccionados",
      maxSelection: "Máximo 50 elementos por operación masiva",
      approveConfirmTitle: (type?: ApprovableType) => {
        switch (type) {
          case "driver_advance_request":
            return "¿Aprobar los anticipos seleccionados?";
          case "internal_staff_compensation":
            return "¿Autorizar los pagos seleccionados?";
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
            return `Se autorizarán ${count} pago(s). Esta acción no se puede deshacer.`;
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
          return "Rechazar pago";
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
          return `Rechazar ${count} pagos`;
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
          return "Indica la razón del rechazo del pago (mínimo 5 caracteres).";
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
          return `Indica la razón del rechazo para ${count} pago(s) (mínimo 5 caracteres).`;
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
    reasonTooLong: "La razón no puede pasar de 500 caracteres",
    counter: (current: number, max: number) => `${current}/${max}`,
    terminalWarning: "No procede y no se puede reenviar.",
  },
  /** ADR-0099 «Devolver para corregir» (handoff F6 D9). */
  returnSheet: {
    title: (type?: ApprovableType) =>
      `Devolver ${APPROVABLE_NOUN[nounKey(type)].singular} para corregir`,
    titleBulk: (count: number, type?: ApprovableType) =>
      `Devolver ${count} ${APPROVABLE_NOUN[nounKey(type)].plural} para corregir`,
    description:
      "Regresa a quien lo capturó; puede corregir y reenviar. Empezará de nuevo en el paso 1.",
    reasonCodeLabel: "Motivo rápido",
    reasonLabel: "Motivo",
    reasonPlaceholder: "Explica qué hay que corregir…",
    submit: "Devolver",
    cancel: "Cancelar",
    reasonTooShort: "El motivo debe tener al menos 5 caracteres",
    reasonTooLong: "El motivo no puede pasar de 500 caracteres",
    reasonCodes: {
      missing_receipt: "Falta comprobante",
      wrong_amount: "Monto incorrecto",
      wrong_operator: "Operador incorrecto",
      other: "Otro",
    } satisfies Record<ApprovalReturnReasonCode, string>,
  },
  /** ADR-0099: flujo de autorización por pasos en la bandeja. */
  flow: {
    queue: {
      label: "Cola de la bandeja",
      mine: "Me toca",
      all: "Todas",
    },
    stepLine: (current: number, total: number, pendingFor: string) =>
      pendingFor
        ? `Paso ${current} de ${total} · Falta: ${pendingFor}`
        : `Paso ${current} de ${total}`,
    signedLine: (name: string, role: string | null, date: string) =>
      `Firmó ${name}${role ? ` (${role})` : ""} · ${date}`,
    signedUnknown: "Otra persona",
    whyHint: "¿Por qué te toca?",
    whyTooltip: (input: {
      minAmount: string | null;
      condition: string | null;
      policyVersion: number | null;
      stepsTotal: number;
    }) => {
      const tier = input.minAmount ? `el tramo desde ${input.minAmount}` : "el tramo";
      const condition = input.condition ? `, ${input.condition}` : "";
      const rule =
        input.policyVersion !== null
          ? `de la regla v${input.policyVersion}`
          : "de la regla estándar";
      return `Entró por ${tier}${condition} ${rule}. Requiere ${input.stepsTotal} firmas.`;
    },
    conditions: {
      category: "por categoría",
      missing_cfdi: "sin CFDI",
      manual_adjustments: "con ajustes manuales",
    } as Record<string, string>,
    returnedChip: "Devuelta",
    /** Handoff F6 D15: alerta en el registro devuelto. */
    returnedAlertTitle: "Devuelta para corregir",
    returnedSummary: (input: {
      reasonLabel: string | null;
      reason: string | null;
      by: string | null;
      date: string | null;
    }) => {
      const quoted = input.reason ? `"${input.reason}"` : null;
      const reasonPart =
        input.reasonLabel && quoted
          ? `${input.reasonLabel}: ${quoted}`
          : (input.reasonLabel ?? quoted);
      return [reasonPart, input.by, input.date].filter(Boolean).join(" · ");
    },
    correctAndResubmit: "Corregir y reenviar",
    resubmitUnchanged: "Reenviar sin cambios",
    returnedTooltip: (input: { reason: string | null; by: string | null; date: string | null }) =>
      [input.reason ? `"${input.reason}"` : null, input.by, input.date]
        .filter(Boolean)
        .join(" · ") || "Devuelta para corregir.",
    alreadySignedChip: (step: number) => `Ya firmaste el paso ${step}`,
    alreadySignedTooltip: "El siguiente paso lo firma otra persona.",
    waitingChip: (who: string) => (who ? `Espera a ${who}` : "Espera a otra persona"),
    noActiveChip: "Sin autorizador activo",
    noActiveTooltip:
      "Nadie activo puede firmar este paso. Un administrador debe revisar las reglas de autorización.",
    escalatedChip: "Escalada a administración",
    escalatedTooltip:
      "Nadie del paso estaba activo; la regla sumó a los administradores.",
    reapprovalChip: "Reautorización",
    reapprovalTooltip: (changes: string) =>
      changes
        ? `Cambió desde la autorización anterior: ${changes}`
        : "Cambió desde la autorización anterior.",
    reapprovalTooltipInProgress: (changes: string) =>
      changes
        ? `Cambió mientras esperaba autorización: ${changes}`
        : "Cambió mientras esperaba autorización.",
    reapprovalTooltipNoChanges: "Se corrigió después de autorizarse; requiere nueva firma.",
    /** Handoff 12 D5: confirmación de Aprobar individual; concuerda con el concepto. */
    reapprovalConfirmLine: (changes: string, _type: ApprovableType | undefined) => {
      return changes
        ? `Ya estaba autorizado. Cambió: ${changes}.`
        : `Ya estaba autorizado; se corrigió y requiere nueva firma.`;
    },
    pendingForJoin: " o ",
    pendingForMore: (first: string, rest: number) => `${first} +${rest}`,
    fieldChanged: "cambió",
    fields: {
      amount: "Monto",
      net_amount: "Neto",
      category: "Categoría",
      currency: "Moneda",
      payment_method: "Método de pago",
      disbursement_method: "Método de pago",
      trip_id: "Viaje",
      employee_id: "Operador",
      period_start: "Inicio del periodo",
      period_end: "Fin del periodo",
      items: "Partidas",
      manual_items: "Partidas manuales",
      advance_deductions: "Descuentos de anticipos",
    } as Record<string, string>,
    menu: {
      more: "Más acciones",
      return: "Devolver para corregir",
      reject: "Rechazar",
      history: "Ver historial",
    },
    stepConfirmTitle: (current: number, total: number) =>
      `¿Firmar el paso ${current} de ${total}?`,
    stepConfirmBody: (current: number, total: number) =>
      `Tu firma completa el paso ${current}. Faltará el paso ${total} para que quede autorizada.`,
    stepConfirmAction: "Firmar paso",
    stepSignedToast: (current: number, total: number, nextRole?: string | null) =>
      `Firmaste el paso ${current}. Falta el paso ${total}${nextRole ? ` · ${nextRole}` : ""}.`,
    returnSuccess: (type?: ApprovableType) => {
      switch (type) {
        case "driver_advance_request":
          return "Anticipo devuelto para corregir";
        case "internal_staff_compensation":
          return "Liquidación devuelta para corregir";
        case "trip_expense":
        default:
          return "Gasto devuelto para corregir";
      }
    },
    returnError: "No se pudo devolver la solicitud",
    emptyMine: {
      title: "Nada te toca por ahora",
      description: (count: number) =>
        `Hay ${count} solicitudes pendientes que esperan a otra persona.`,
      cta: "Ver todas las pendientes",
    },
  },
  bulkFlow: {
    returnSelected: "Devolver seleccionados",
    prediction: (input: {
      total: number;
      approve: number;
      advance: number;
      nextStep: number | null;
      nextRole?: string | null;
    }) =>
      input.advance > 0
        ? `${input.total} seleccionadas: ${input.approve} quedan autorizadas y ${input.advance} pasan al paso ${input.nextStep ?? 2}${input.nextRole ? ` · ${input.nextRole}` : ""}.`
        : null,
    successSummary: (counts: {
      approved: number;
      stepSigned: number;
      returned: number;
      rejected: number;
      nextStep?: number | null;
      nextRole?: string | null;
    }) =>
      [
        counts.approved > 0 ? `${counts.approved} autorizadas` : null,
        counts.stepSigned > 0
          ? `${counts.stepSigned} pasaron al paso ${counts.nextStep ?? 2}${counts.nextRole ? ` · ${counts.nextRole}` : ""}`
          : null,
        counts.returned > 0 ? `${counts.returned} devueltas para corregir` : null,
        counts.rejected > 0 ? `${counts.rejected} rechazadas` : null,
      ]
        .filter(Boolean)
        .join(" · "),
    resultTitle: "Resultado de la operación",
    failuresTitle: (failed: number, total: number) =>
      `${failed} de ${total} no se procesaron`,
    reload: "Recargar bandeja",
    close: "Cerrar",
    unknownFolio: "Solicitud",
  },
  history: {
    title: "Historial de autorización",
    description: (label: string) => label,
    open: "Ver historial",
    empty: "Todavía no hay eventos de autorización.",
    loadError: "No se pudo cargar el historial",
    retry: "Reintentar",
    close: "Cerrar",
    step: (n: number) => `Paso ${n}`,
    policyVersion: (n: number) => `Regla v${n}`,
    policyStandard: "Regla estándar",
    actorUnknown: "Sistema",
    events: {
      submitted: () => "Enviada",
      step_approved: (step: number | null) =>
        step ? `Firmó el paso ${step}` : "Firmó un paso",
      approved: () => "Autorizada",
      rejected: () => "Rechazada",
      returned: () => "Devuelta para corregir",
      resubmitted: () => "Reenviada",
      escalated_no_eligible: () => "Escalada a administración",
      disbursed: () => "Pago registrado",
      edited: () => "Corrección registrada",
      note_added: () => "Nota agregada",
    } as Record<string, (step: number | null) => string>,
    invalidated: {
      material_change: "Autorización anulada por cambio",
      subject_cancelled: "Cancelada",
      subject_deleted: "Eliminada",
    } as Record<string, string>,
    invalidatedDefault: "Autorización anulada por cambio",
    unknownEvent: "Evento de autorización",
  },
  /** Handoff F6 §6: avisar y recargar; nunca reintentar. */
  guardErrors: {
    APPROVAL_STEP_CHANGED:
      "Otra persona firmó este paso mientras lo revisabas. Actualizamos la solicitud; revísala de nuevo.",
    APPROVAL_REVISION_CHANGED:
      "La solicitud cambió desde que la abriste. Revisa la versión nueva antes de decidir.",
    APPROVAL_REQUEST_RETURNED:
      "Esta solicitud ya se devolvió para corregir. Podrás decidir cuando la reenvíen.",
    APPROVAL_STEP_NOT_ELIGIBLE: "La regla de autorización no te incluye en este paso.",
    APPROVAL_STEP_ALREADY_SIGNED:
      "Ya firmaste un paso de esta solicitud; el siguiente lo firma otra persona.",
    APPROVAL_MATERIAL_EDIT_LOCKED:
      "Ya se registró el pago: los datos que cambian el monto no se pueden modificar.",
  } satisfies Record<ApprovalGuardCode, string>,
} as const;
