/**
 * Copy ADR-0096 — intención de liquidación / emisión CFDI (viaje).
 * Sentence-case; PRD agent c6ed85df · ledger abonos (addendum 2026-10-04).
 */

export const cfdiEmissionIntentCopy = {
  field: {
    /** D3′: prefijo del viaje. Jerga CFDI solo en el hint. */
    label: "Factura del viaje",
    hint: "Hereda del cliente. Sin factura no lleva Carta Porte. Si necesitas Carta Porte, usa Con factura: el efectivo va en el CFDI.",
  },
  options: {
    emitir_cfdi: "Con factura",
    sin_cfdi_efectivo: "Sin factura",
  },
  chip: {
    sinCfdi: "Sin factura",
    conCfdi: "Con factura",
  },
  complianceNotice:
    "Este modo no emite CFDI. La responsabilidad fiscal queda en tu operación.",
  overrideConfirm: {
    title: "¿Pasar a Sin factura?",
    description:
      "Este viaje no aparecerá en Por facturar ni llevará Carta Porte. Si el patio necesita Carta Porte, elige Con factura y registra el efectivo en el CFDI.",
    confirm: "Usar Sin factura",
    cancel: "Cancelar",
  },
  blockEmitir: {
    title: "No se puede usar Con factura",
    description:
      "El cliente está en Sin factura. Completa RFC y régimen antes de facturar.",
    goToClient: "Completar datos del cliente",
  },
  banner:
    "Este viaje no se factura. Registra el cobro en Costos.",
  /** Tooltip opcional si quedara un CTA fiscal deshabilitado. */
  fiscalCtaDisabledTooltip: "Este viaje es Sin factura",
  /**
   * Gate de carga operativa (ADR-0096): sin_cfdi_efectivo exige ≥1 carga activa
   * antes de iniciar / completar. PRD agent 011d44c3.
   */
  cargoGate: {
    emptyTitle: "Sin cargas",
    emptyBody:
      "Este viaje es flete real sin factura. Agrega al menos una carga antes de iniciar o completar.",
    emptyHint:
      "Si no hubo mercancía, cancela el viaje; no uses este modo como viaje en falso.",
    ctaStartBlocked: "Agrega al menos una carga para iniciar",
    ctaCompleteBlocked: "Agrega al menos una carga para completar",
    alertSheet:
      "Falta la carga del flete. Sin ella no se puede operar este viaje Sin factura.",
  },
  cash: {
    sectionTitle: "Cobro sin factura",
    statusPending: "Pendiente",
    statusPartial: "Cobro parcial",
    statusCollected: "Cobrado",
    /** @deprecated Prefer scorecardAccumulatedLabel */
    scorecardLabel: "Cobrado",
    scorecardAccumulatedLabel: "Cobrado",
    scorecardPendingLabel: "Por cobrar",
    ctaRegister: "Registrar abono",
    ctaDisabledCollected: "El cobro ya cubre la tarifa",
    emptyHistory: "Aún no hay abonos registrados.",
    historyTitle: "Historial de abonos",
    receiptVoided: "Anulado",
    receiptActive: "Activo",
    voidCta: "Anular",
    batchChip: "Lote",
    viewBatchCta: "Ver lote",
    instrumentLine: (instrument: string, reference: string | null) =>
      reference ? `${instrument} · ref ${reference}` : instrument,
    pendingHint: (amountLabel: string) => `Por cobrar: ${amountLabel}`,
    sheet: {
      title: "Registrar abono",
      description:
        "Registra un abono del flete Sin factura. No genera factura ni afecta Cobrado del viaje con factura.",
      amount: "Monto del abono (MXN)",
      paymentInstrument: "Instrumento",
      reference: "Referencia",
      referencePlaceholder: {
        cash: "Opcional",
        transfer: "Clave de rastreo, folio o concepto",
        check: "Número de cheque",
        other: "Recomendada: ¿cómo identificas este pago?",
      },
      collectedAt: "Fecha y hora del cobro",
      note: "Nota (opcional)",
      notePlaceholder: "Referencia interna, folio de caja…",
      submit: "Registrar abono",
      submitting: "Registrando…",
      cancel: "Cancelar",
      pendingHint: (amountLabel: string) =>
        `Saldo por cobrar: ${amountLabel}. El monto por defecto es ese saldo.`,
      warningPartial: (amountLabel: string) =>
        `Este abono no cubre todo el saldo (${amountLabel} por cobrar). Podrás registrar el resto después.`,
      warningExceeds: (amountLabel: string) =>
        `El abono no puede exceder el saldo por cobrar (${amountLabel}).`,
    },
    voidSheet: {
      title: "Anular abono",
      description:
        "El abono quedará en el historial como anulado. Para corregir el monto, registra un abono nuevo después.",
      reason: "Motivo de anulación",
      reasonPlaceholder: "Error de captura, cobro duplicado…",
      submit: "Anular abono",
      submitting: "Anulando…",
      cancel: "Cancelar",
      amountLabel: "Monto a anular",
    },
    toast: {
      success: "Abono registrado",
      error: "No se pudo registrar el abono",
      voidSuccess: "Abono anulado",
      voidError: "No se pudo anular el abono",
      exceedsRate: "El abono excede el saldo por cobrar",
      notAllowed: "Este viaje no admite cobros sin factura",
      alreadyVoided: "Este abono ya estaba anulado",
      inBatch: "Este abono pertenece a un lote",
      viewBatchCta: "Ver lote",
    },
    validation: {
      amountRequired: "Indica el monto del abono",
      amountPositive: "El monto debe ser mayor a cero",
      amountExceedsPending: "El monto no puede exceder el saldo por cobrar",
      collectedAtRequired: "Indica la fecha y hora del cobro",
      collectedAtFuture: "La fecha del cobro no puede ser futura",
      referenceRequiredTransfer: "Captura la referencia de la transferencia",
      referenceRequiredCheck: "Captura el número de cheque",
      referenceMax: "La referencia no puede exceder 120 caracteres",
      noteMax: "La nota no puede exceder 250 caracteres",
      voidReasonRequired: "Indica el motivo de anulación",
      voidReasonMax: "El motivo no puede exceder 250 caracteres",
    },
  },
  governance: {
    changeCta: "Cambiar a Sin factura",
    useSinCfdi: "Usar Sin factura",
    requestSinCfdi: "Solicitar Sin factura",
    regularizeCta: "Pasar a Con factura",
    reasonLabel: "Motivo",
    reasonHint: "Entre 10 y 500 caracteres. Queda en la bitácora del viaje.",
    reasonMin: "El motivo debe tener al menos 10 caracteres",
    reasonMax: "El motivo no puede exceder 500 caracteres",
    dialogTitleSin: "Pasar a Sin factura",
    dialogTitleRegularize: "Pasar a Con factura",
    dialogTitleReject: "Rechazar solicitud",
    dialogTitleCancel: "Cancelar solicitud",
    pending: "Solicitud pendiente de autorización",
    approve: "Aprobar",
    reject: "Rechazar",
    cancelRequest: "Cancelar solicitud",
    approvalsLink: "Ver en Aprobaciones",
    approveTitle: "¿Aprobar Sin factura?",
    approveBody:
      "El viaje pasará a Sin factura. No emitirá CFDI ni Carta Porte.",
    cashFreeze:
      "No se puede pasar a Con factura: ya hay abonos y el cobro queda congelado.",
    history: "Historial",
    historyTitle: "Historial de Factura del viaje",
    historyEmpty: "Aún no hay una solicitud de Sin factura en este viaje.",
    applied: "El viaje quedó Sin factura",
    requested:
      "Solicitud registrada. El viaje sigue Con factura hasta que se autorice.",
    regularized: "Viaje regularizado a Con factura",
    cancelled: "Solicitud cancelada",
    approved: "Solicitud aprobada",
    rejected: "Solicitud rechazada",
    startCancelled:
      "Se canceló la solicitud de Sin factura. El viaje sigue Con factura.",
    error: "No se pudo actualizar la Factura del viaje",
    status: {
      in_progress: "Pendiente",
      approved: "Aprobada",
      rejected: "Rechazada",
      cancelled: "Cancelada",
      superseded: "Sustituida",
    },
  },
} as const;
