/**
 * Copy ADR-0096 — intención de liquidación / emisión CFDI (viaje).
 * Sentence-case; PRD agent c6ed85df · ledger abonos (addendum 2026-10-04).
 */

export const cfdiEmissionIntentCopy = {
  field: {
    label: "Liquidación",
    hint: "Hereda del perfil del cliente. Puedes cambiarlo en este viaje.",
  },
  options: {
    emitir_cfdi: "Emitir CFDI",
    sin_cfdi_efectivo: "Sin CFDI · efectivo",
  },
  chip: {
    sinCfdi: "Sin CFDI · efectivo",
    conCfdi: "Emitir CFDI",
  },
  complianceNotice:
    "Este modo no emite CFDI. La responsabilidad fiscal queda en tu operación.",
  overrideConfirm: {
    title: "¿Liquidar sin CFDI?",
    description:
      "Este viaje no aparecerá en Por facturar. El cobro se registra en Costos.",
    confirm: "Usar Sin CFDI · efectivo",
    cancel: "Cancelar",
  },
  blockEmitir: {
    title: "No se puede emitir CFDI",
    description:
      "El cliente es Solo comercial. Completa RFC y régimen (perfil Receptor CFDI) antes de facturar.",
    goToClient: "Completar datos del cliente",
  },
  banner:
    "Este viaje no se factura. Registra el cobro en Costos.",
  /** Tooltip opcional si quedara un CTA fiscal deshabilitado. */
  fiscalCtaDisabledTooltip: "Este viaje se liquida sin CFDI",
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
      "Falta la carga del flete. Sin ella no se puede operar este viaje sin CFDI.",
  },
  cash: {
    sectionTitle: "Cobro en efectivo",
    statusPending: "Pendiente",
    statusPartial: "Cobro parcial",
    statusCollected: "Cobrado",
    /** @deprecated Prefer scorecardAccumulatedLabel */
    scorecardLabel: "Efectivo acumulado",
    scorecardAccumulatedLabel: "Efectivo acumulado",
    scorecardPendingLabel: "Por cobrar",
    ctaRegister: "Registrar abono",
    ctaDisabledCollected: "El cobro ya cubre la tarifa",
    emptyHistory: "Aún no hay abonos registrados.",
    historyTitle: "Historial de abonos",
    receiptVoided: "Anulado",
    receiptActive: "Activo",
    voidCta: "Anular",
    pendingHint: (amountLabel: string) => `Por cobrar: ${amountLabel}`,
    sheet: {
      title: "Registrar abono",
      description:
        "Registra un abono del flete en efectivo. No genera CFDI ni afecta Cobrado del viaje fiscal.",
      amount: "Monto del abono (MXN)",
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
      notAllowed: "Este viaje no admite cobro operativo en efectivo",
      alreadyVoided: "Este abono ya estaba anulado",
    },
    validation: {
      amountRequired: "Indica el monto del abono",
      amountPositive: "El monto debe ser mayor a cero",
      amountExceedsPending: "El monto no puede exceder el saldo por cobrar",
      collectedAtRequired: "Indica la fecha y hora del cobro",
      noteMax: "La nota no puede exceder 250 caracteres",
      voidReasonRequired: "Indica el motivo de anulación",
      voidReasonMax: "El motivo no puede exceder 250 caracteres",
    },
  },
} as const;
