/**
 * Copy — hoja unificada «Cobro» (F3 · C17–C21 · copy #12).
 */

export const collectionDetailCopy = {
  title: "Cobro",
  channelWithInvoice: "Con factura",
  channelWithoutInvoice: "Sin factura",
  statusActive: "Activo",
  statusVoided: "Anulado",
  close: "Cerrar",
  viewCobro: "Ver cobro",
  viewCobroAria: "Ver detalle del cobro",

  fields: {
    collectedAt: "Fecha del cobro",
    paymentForm: "Forma de pago",
    reference: "Referencia",
    note: "Nota",
    registeredBy: "Registrado por",
    emDash: "—",
  },

  registeredBy: (name: string, when: string) =>
    `${name} · ${when}`,

  allocatedIn: {
    invoices: (n: number) =>
      n === 1 ? "Repartido en 1 factura" : `Repartido en ${n} facturas`,
    trips: (n: number) =>
      n === 1 ? "Repartido en 1 viaje" : `Repartido en ${n} viajes`,
    total: "Total",
    columns: {
      invoice: "Factura",
      trip: "Viaje",
      departure: "Salida",
      installment: "Parcialidad",
      balanceBefore: "Saldo antes",
      amount: "Abono",
      balanceAfter: "Saldo después",
    },
  },

  comprobante: {
    title: "Comprobante de pago",
    notEmittedTitle: "No se emite",
    notEmittedBody:
      "Cobro sin factura: no genera factura ni comprobante de pago (REP).",
    multiInvoiceHint: (n: number) =>
      n === 1
        ? "Un comprobante para 1 factura"
        : `Un comprobante para las ${n} facturas`,
    notSent: "Sin enviar al cliente",
    sent: "Enviado al cliente",
    attempts: (n: number) =>
      n === 1 ? "1 intento" : `${n} intentos`,
    pdf: "PDF",
    xml: "XML",
    uuid: "UUID",
  },

  cta: {
    send: "Enviar al cliente",
    resend: "Reenviar al cliente",
    retryStamp: "Reintentar timbrado",
    openBlocking: "Abrir el comprobante que bloquea",
  },

  void: {
    cta: "Anular cobro",
    confirmBatch: (n: number) =>
      n === 1
        ? "Se anulará el abono de este cobro y el viaje vuelve a quedar con saldo por cobrar."
        : `Se anularán los ${n} abonos de este cobro y esos viajes vuelven a quedar con saldo por cobrar.`,
    confirmReceipt:
      "Se anulará este cobro y el viaje vuelve a quedar con saldo por cobrar.",
    submitBatch: (n: number) =>
      n === 1 ? "Anular cobro y 1 abono" : `Anular cobro y ${n} abonos`,
    submitReceipt: "Anular cobro",
    back: "Volver",
    reason: "Motivo de anulación",
    reasonPlaceholder: "Cheque devuelto, error de captura…",
    reasonRequired: "Indica el motivo de anulación",
    reasonMax: "El motivo no puede exceder 250 caracteres",
    pending: "Anulando…",
  },

  toast: {
    voidBatchSuccess: (n: number) =>
      n === 1 ? "Cobro anulado · 1 abono" : `Cobro anulado · ${n} abonos`,
    voidReceiptSuccess: "Cobro anulado",
    alreadyVoided: "Este cobro ya estaba anulado",
    voidError: "No se pudo anular el cobro",
    retrySuccess: "Reintento de timbrado encolado",
    retryError: "No se pudo reintentar el timbrado",
    pdfError: "No se pudo abrir el PDF",
    xmlError: "No se pudo descargar el XML",
  },

  load: {
    error: "No se pudo cargar el cobro",
    retry: "Reintentar",
    notFound: "Este cobro no existe o no tienes acceso",
  },

  invoiceSection: {
    title: (n: number) =>
      n === 1
        ? "Cobros de esta factura · 1"
        : `Cobros de esta factura · ${n}`,
    empty: "Aún no hay cobros registrados en esta factura.",
    registerCta: "Registrar cobro",
    registerCtaAria: "Registrar cobro de esta factura",
    total: "Total",
    collected: "Cobrado",
    balanceDue: "Por cobrar",
    columns: {
      date: "Fecha",
      form: "Forma de pago",
      reference: "Referencia",
      installment: "Parcialidad",
      amount: "Abono (MXN)",
      balanceAfter: "Saldo después (MXN)",
      comprobante: "Comprobante",
    },
    partOfMulti: (amount: string, n: number) =>
      n === 1
        ? `Parte de un cobro de ${amount}`
        : `Parte de un cobro de ${amount} en ${n} facturas`,
  },
} as const;
