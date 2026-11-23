/**
 * Copy — formulario único «Registrar cobro» (F1 · C6–C10, C16 · F1b H2–H4).
 */

export const registerCollectionCopy = {
  title: "Registrar cobro",
  channelChip: {
    with_invoice: "Con factura",
    without_invoice: "Sin factura",
  },
  whatYouCollect: "Qué cobras",
  whatYouCollectHint:
    "Un cobro cubre un solo canal. Elige facturas a crédito o viajes Sin factura.",
  /** H2: numeración + subtítulo V3. */
  sectionPayment: {
    number: "1 ·",
    title: "Pago del cliente",
    subtitle: "Lo que recibiste, tal como llegó.",
  },
  /** H2: numeración + subtítulo V3. */
  sectionCoverage: {
    number: "2 ·",
    title: "Qué cubre",
    subtitleWithInvoice: "Facturas a crédito del cliente con saldo.",
    subtitleWithoutInvoice: "Viajes Sin factura del cliente con saldo.",
  },
  zonePayment: "Pago del cliente",
  zoneCoverage: "Qué cubre",
  zoneEffects: "Al registrar",
  amount: "Monto recibido",
  paymentForm: "Forma de pago",
  paymentFormPlaceholder: "Selecciona forma de pago",
  reference: "Referencia",
  referenceOptional: "Opcional",
  paymentDate: "Fecha del cobro",
  paymentTime: "Hora",
  paymentTimeHint: "Va en el comprobante de pago",
  note: "Nota",
  notePlaceholder: "Referencia interna…",
  truncatedOpenPpd:
    "Esta lista no muestra todas las facturas abiertas del cliente. Ajusta el filtro o contacta soporte si faltan documentos.",
  effects: {
    emitsRep: "Se emite 1 comprobante de pago (REP)",
    emitsRepDetail: "Se timbra en segundo plano para el cliente.",
    noRep: "No se emite comprobante de pago (REP)",
    noRepDetail: "Cobro operativo sin factura ni complemento.",
    settled: (labels: string) => `${labels} quedan saldadas`,
    settledDetail: "Salen de Facturas a crédito.",
    partialLeft: (label: string, balance: string) =>
      `${label} queda con saldo de ${balance}`,
    partialLeftDetail: "Sigue en Pago parcial.",
  },
  balanceCard: {
    /** Saldo de documentos elegidos en «Qué cubre» — no AR total del cliente. */
    title: "Saldo de los elegidos",
    dueToday: "Pendiente",
    thisCollection: "Este cobro",
    remaining: "Queda por cubrir",
  },
  /** Paridad sin factura (`OPERATIONAL_RECEIPT_BATCH_BALANCE_CHANGED`). */
  balanceChangedAlert:
    "Los saldos cambiaron mientras capturabas. Ya los actualizamos; revisa el reparto antes de registrar.",
  /** 409 cuando la misma key se reutilizó con fingerprint distinto. */
  paymentIdempotencyConflict:
    "Este intento de cobro ya se usó con otros datos. Cierra y vuelve a abrir Registrar cobro.",
  columns: {
    invoice: "Factura",
    issued: "Emisión",
    trips: "Viajes",
    balance: "Saldo (MXN)",
    allocation: "Abono (MXN)",
    after: "Saldo después (MXN)",
  },
  footer: {
    selectedPending: "Saldo de los elegidos",
    allocated: "Repartido",
    unallocated: "Por repartir",
    unallocatedIdle: "Captura el monto para repartir",
    /** H3: "facturas" / "viajes" en vez de "documentos"; label forma de pago, no código SAT. */
    channelSummary: (channel: string, n: number, docWord: string, formLabel: string) =>
      `Cobro ${channel} · ${n} ${docWord} · ${formLabel}`,
  },
  resetSuggest: "Volver a sugerir",
  noAllocation: "Sin abono",
  submitIdle: "Registrar cobro",
  submit: (amountLabel: string, n: number, docWord: string) =>
    n === 1
      ? `Registrar ${amountLabel} en 1 ${docWord}`
      : `Registrar ${amountLabel} en ${n} ${docWord}`,
  docWord: {
    with_invoice: { one: "factura", many: "facturas" },
    without_invoice: { one: "viaje", many: "viajes" },
  },
  submitting: "Registrando…",
  cancel: "Cancelar",
  emptyInvoicesTitle: "Sin facturas a crédito con saldo",
  emptyInvoicesDescription:
    "Este cliente no tiene facturas PPD abiertas por cobrar.",
  loadErrorTitle: "No se pudieron cargar los documentos",
  loadErrorRetry: "Reintentar",
  missingClientTitle: "Falta el cliente",
  missingClientDescription:
    "Abre Registrar cobro desde la bandeja, la ficha o una factura.",
  validation: {
    amountRequired: "Indica el monto del cobro",
    amountPositive: "El monto debe ser mayor a cero",
    paymentFormRequired: "Selecciona la forma de pago",
    paymentDateRequired: "Indica la fecha del cobro",
    paymentDateFormat: "Usa el formato AAAA-MM-DD",
    paymentTimeFormat: "Usa el formato HH:mm",
    referenceMax: "La referencia no puede exceder 100 caracteres",
    noteMax: "La nota no puede exceder 500 caracteres",
    atLeastOne: "Asigna un abono a al menos un documento",
    unallocatedShort: (x: string) => `Faltan ${x} por repartir`,
    unallocatedOver: (x: string) => `Sobran ${x} por repartir`,
    lineMax: (pendingLabel: string) => `Máximo ${pendingLabel}`,
  },
  excessAlert: (excessLabel: string, pendingLabel: string) =>
    `El cobro excede por ${excessLabel} el saldo de los documentos elegidos (${pendingLabel}). Ajusta el monto o elige más documentos. No se registra saldo a favor: la nota es solo referencia interna y no contabiliza el excedente.`,
  toast: {
    successTitle: "Cobro registrado",
    successWithRep: (amount: string) =>
      `${amount} registrado. El comprobante de pago (REP) se timbra en segundo plano.`,
    successWithoutRep: (n: number) =>
      n === 1 ? "Cobro registrado · 1 viaje" : `Cobro registrado · ${n} viajes`,
    viewCollection: "Ver cobro",
    error: "No se pudo registrar el cobro",
  },
} as const;
