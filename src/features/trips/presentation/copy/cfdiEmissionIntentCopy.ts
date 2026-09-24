/**
 * Copy ADR-0096 — intención de liquidación / emisión CFDI (viaje).
 * Sentence-case; PRD agent c6ed85df.
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
      "Este viaje no aparecerá en Por facturar. El cobro se registra en Dinero del viaje.",
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
    "Este viaje no se factura. Registra el cobro en Dinero del viaje.",
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
    statusPending: "Pendiente de cobro",
    statusCollected: "Cobrado en efectivo",
    scorecardLabel: "Cobrado en efectivo",
    ctaRegister: "Registrar cobro en efectivo",
    sheet: {
      title: "Registrar cobro en efectivo",
      description:
        "Registra el efectivo cobrado del flete. No genera CFDI ni afecta Cobrado del viaje fiscal.",
      amount: "Monto (MXN)",
      collectedAt: "Fecha y hora del cobro",
      note: "Nota (opcional)",
      notePlaceholder: "Referencia interna, folio de caja…",
      submit: "Registrar cobro",
      submitting: "Registrando…",
      cancel: "Cancelar",
    },
    toast: {
      success: "Cobro en efectivo registrado",
      error: "No se pudo registrar el cobro",
    },
    validation: {
      amountRequired: "Indica el monto cobrado",
      amountPositive: "El monto debe ser mayor a cero",
      collectedAtRequired: "Indica la fecha y hora del cobro",
      noteMax: "La nota no puede exceder 250 caracteres",
    },
  },
} as const;
