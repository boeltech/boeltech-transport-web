/**
 * Copy — Cobro por lote Sin factura (B2 · PRD D2–D9).
 */

export const operationalReceiptBatchCopy = {
  page: {
    title: "Registrar cobro por lote",
    disclaimer:
      "Cobros sin factura. No genera factura ni comprobante de pago.",
    zonePayment: "Pago del cliente",
    zoneTrips: "Viajes que cubre",
    amount: "Monto del pago (MXN)",
    instrument: "Instrumento",
    reference: "Referencia",
    collectedAt: "Fecha del cobro",
    note: "Nota (opcional)",
    notePlaceholder: "Anota el excedente u otra referencia interna…",
    searchPlaceholder: "Buscar por folio del viaje",
    selectAll: "Seleccionar todos",
    selectNone: "Ninguno",
    selectedCount: (n: number, total: number) =>
      `${n} de ${total} viajes elegidos`,
    columns: {
      trip: "Viaje",
      departure: "Salida",
      status: "Estado",
      pendingBefore: "Saldo antes",
      amount: "Abono",
      pendingAfter: "Saldo después",
    },
    footer: {
      selectedPending: "Saldo de los elegidos",
      allocated: "Repartido",
      unallocated: "Por repartir",
    },
    editedBadge: "Reparto editado",
    resetSuggest: "Volver a sugerir por antigüedad",
    noAllocation: "Sin abono",
    notEligible: "Ya no admite cobro sin factura",
    submit: (amountLabel: string, n: number) =>
      n === 1
        ? `Registrar ${amountLabel} en 1 viaje`
        : `Registrar ${amountLabel} en ${n} viajes`,
    submitting: "Registrando…",
    cancel: "Cancelar",
    emptyTitle: "Sin viajes Sin factura con saldo",
    emptyDescription:
      "Este cliente no tiene viajes Sin factura con saldo por cobrar.",
    emptyBack: "Volver",
    loadErrorTitle: "No se pudieron cargar los viajes del cliente",
    loadErrorRetry: "Reintentar",
  },
  instruments: {
    cash: "Efectivo",
    transfer: "Transferencia",
    check: "Cheque",
    other: "Otro",
  },
  referencePlaceholder: {
    cash: "Opcional",
    transfer: "Clave de rastreo, folio o concepto",
    check: "Número de cheque",
    other: "Recomendada: ¿cómo identificas este pago?",
  },
  validation: {
    amountRequired: "Indica el monto del pago",
    amountPositive: "El monto debe ser mayor a cero",
    referenceRequiredTransfer: "Captura la referencia de la transferencia",
    referenceRequiredCheck: "Captura el número de cheque",
    referenceMax: "La referencia no puede exceder 120 caracteres",
    collectedAtRequired: "Indica la fecha del cobro",
    collectedAtFuture: "La fecha del cobro no puede ser futura",
    noteMax: "La nota no puede exceder 250 caracteres",
    lineMax: (pendingLabel: string) => `Máximo ${pendingLabel}`,
    unallocatedShort: (x: string) => `Faltan ${x} por repartir`,
    unallocatedOver: (x: string) => `Sobran ${x} por repartir`,
    atLeastOne: "Asigna un abono a al menos un viaje",
  },
  excessAlert: (excessLabel: string, pendingLabel: string) =>
    `El pago excede por ${excessLabel} el saldo de los viajes elegidos (${pendingLabel}). Ajusta el monto o elige más viajes. El saldo a favor no se registra aquí; anota el excedente en la nota.`,
  balanceChangedAlert:
    "Los saldos cambiaron mientras capturabas. Ya los actualizamos; revisa el reparto antes de registrar.",
  toast: {
    success: (n: number) =>
      n === 1
        ? "Cobro por lote registrado · 1 viaje"
        : `Cobro por lote registrado · ${n} viajes`,
    viewBatch: "Ver lote",
    voidSuccess: (n: number) =>
      n === 1 ? "Lote anulado · 1 abono" : `Lote anulado · ${n} abonos`,
    alreadyVoided: "Este lote ya estaba anulado",
    error: "No se pudo registrar el cobro por lote",
    voidError: "No se pudo anular el lote",
  },
  sheet: {
    title: "Cobro por lote",
    close: "Cerrar",
    voidCta: "Anular lote",
    voidConfirm: (n: number) =>
      `Se anularán los ${n} abonos de este lote y esos viajes vuelven a quedar con saldo por cobrar.`,
    voidSubmit: (n: number) =>
      n === 1 ? "Anular lote y 1 abono" : `Anular lote y ${n} abonos`,
    voidBack: "Volver",
    voidReason: "Motivo de anulación",
    voidReasonPlaceholder: "Cheque devuelto, error de captura…",
    voidReasonRequired: "Indica el motivo de anulación",
    voidReasonMax: "El motivo no puede exceder 250 caracteres",
    registeredBy: (name: string, date: string) =>
      `Registrado por ${name} · ${date}`,
    statusActive: "Activo",
    statusVoided: "Anulado",
    loadError: "No se pudo cargar el lote",
    loadRetry: "Reintentar",
    notFound: "Este lote no existe o no tienes acceso",
    r1Blocked: (codes: string) =>
      `No se puede anular: ${codes} pasaron a Con factura y su cobro quedó congelado.`,
    columns: {
      trip: "Viaje",
      departure: "Salida",
      amount: "Abono",
    },
  },
  listSheet: {
    title: "Cobros por lote",
    empty: "Este cliente aún no tiene cobros por lote.",
    openAria: (label: string) => `Abrir ${label}`,
  },
  card: {
    registerBatchCta: "Registrar cobro por lote",
    registerBatchAria: "Registrar cobro por lote de este cliente",
    listBatchesCta: "Cobros por lote",
    listBatchesAria: "Ver cobros por lote de este cliente",
  },
  tray: {
    registerBatchCta: "Registrar cobro por lote",
    lastReceipt: (instrument: string, reference: string | null) =>
      reference
        ? `Último: ${instrument} · ref ${reference}`
        : `Último: ${instrument}`,
    batchLink: "Lote",
  },
} as const;
