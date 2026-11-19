/**
 * Copy del tab Facturación / Cobro (F5 · D7, D14–D29 · Q11).
 */

export const billingCopy = {
  invoices: {
    title: "Facturas del viaje",
    description:
      "Servicio con factura · el cobro lo lleva quien recibe cada factura.",
    descriptionSplit:
      "Reparto del flete · cada porción se factura y cobra por su cuenta.",
    descriptionFalseTrip:
      "Ingreso sin Carta Porte · el cobro lo lleva quien recibe la factura.",
    emptyAccessories: "Sin facturas de servicios adicionales",
    history: "Historial",
    accessoryCta: "Facturar servicios adicionales",
    columns: {
      document: "Documento",
      statusFolio: "Estado y folio",
      total: "Total",
      /** F-ds: columna share (monto + % + barra). */
      share: "Parte del flete",
      collected: "Cobrado",
      balance: "Saldo",
    },
    /** F-ds: label de summaryRow en modo reparto. */
    freightBasis: "Base de flete",
    docFreight: "Flete",
    docAccessory: "Servicio adicional",
    docFalseTrip: "Ingreso sin Carta Porte",
    docSplit: (label: string) => `Porción · ${label}`,
    withCartaPorte: "Con Carta Porte",
    withoutCartaPorte: "Sin Carta Porte",
    /** F5b P1-A: flete vigente con Atención fiscal. */
    toSubstitute: "Por sustituir",
    /** Texto % (tests / chip); la celda share formatea el % vía EntityListTable. */
    sharePercent: (pct: number) => `${pct}%`,
    viewInvoice: "Ver factura",
    invoicePortion: "Facturar porción",
    openDraft: "Continuar borrador",
    draftNotInTotals: "Los borradores no cuentan en el total cobrado.",
  },
  cobroRail: {
    title: "Cobro",
    facturado: "Facturado vigente",
    cobrado: "Cobrado del viaje",
    porCobrar: "Por cobrar",
    paymentsOnInvoice: (folio: string) =>
      `Los pagos se registran en la factura · Abrir ${folio}`,
    paymentsOnInvoiceGeneric:
      "Los pagos se registran en la factura activa.",
    substituteHint:
      "Registra los cobros en la factura activa (la sustituta ya timbrada). Los cobros anteriores no se mueven.",
  },
  pendientes: {
    title: "Pendientes de facturación",
    emptyTitle: "Sin pendientes",
    emptyBody:
      "Si el viaje cambia después de facturar, aquí aparece Atención fiscal con su acción (Sustituir factura).",
    attentionTitle: "Atención fiscal",
    whatLabel: "Qué cambió",
    whenLabel: "Cuándo",
    whoLabel: "Quién",
    whoUnknown: "—",
    substituteCta: "Sustituir factura",
    openInvoiceCta: "Abrir factura",
    /**
     * Títulos humanos por `mutation_kind` (SoT de UI).
     * No pintar `reason` técnico del API en «Qué cambió».
     */
    mutationKinds: {
      stop_replan: "Se reordenaron las escalas",
      stops: "Se ajustaron paradas o la ruta",
      /** Alias web histórico. */
      route: "Se ajustaron paradas o la ruta",
      cargo: "Se agregó o cambió carga",
      fleet: "Se cambió unidad u operador",
      reassignment: "Se cambió unidad u operador",
      base_rate: "Se modificó la tarifa",
      unknown: "Cambio operativo con factura vigente",
    },
    actionBody:
      "Hay factura vigente. Sustituye la factura para que coincida con el viaje.",
    actionBodySplit:
      "Hay factura vigente. Sustituye cada porción ya facturada para alinear la factura con la ruta.",
  },
  stampError: {
    chip: "No se timbró",
    title: "Error al timbrar",
    whenWho: (when: string, who: string | null) =>
      who ? `${when} · ${who}` : when,
    fixStopCta: "Corregir esta parada",
  },
  traslado: {
    title: "Solo traslado",
    body: "Este viaje es solo traslado: no se emiten documentos de ingreso ni Carta Porte desde tlamx.",
  },
  falseTrip: {
    cardTitle: "Viaje en falso",
    declaredBy: "Declaró",
    reasonMissing: "Sin motivo registrado",
  },
  substitute: {
    chip: "Sustitución",
    openOriginal: "Abrir factura original",
    historyTitle: "Historial",
  },
  split: {
    draftChip: "Reparto sin confirmar",
    /** Porciones numéricas, p. ej. `60`, `40` → «Reparto 60 / 40». */
    activeChip: (...shares: string[]) => `Reparto ${shares.join(" / ")}`,
    progress: (done: number, total: number) =>
      `${done} de ${total} porciones facturadas`,
    cancelledProgress: (done: number, total: number) =>
      `${done} de ${total} canceladas`,
    continueDraft: "Continuar",
    cancelDraft: "Cancelar",
    closeSplit: "Cerrar reparto",
    previewConfirm: "Así quedará al confirmar",
  },
  fleet: {
    /** Panel title in Facturación tab (reuse card elsewhere). */
    sectionTitle: "Datos para Carta Porte",
  },
  sinCfdi: {
    banner:
      "Este viaje no se factura. Este modo no emite CFDI ni Carta Porte. La responsabilidad fiscal queda en tu operación.",
    panelTitle: "Cobro sin factura",
    panelDescription:
      "Cada cobro que tocó este viaje, con lo que abonó. Para corregir un monto, anula el cobro desde su detalle y registra uno nuevo.",
    panelDescriptionCollected:
      "Cobrado con un solo cobro. Se consulta y se anula desde su detalle.",
    tarifa: "Tarifa",
    cobrado: "Cobrado",
    porCobrar: "Por cobrar",
    tableTitle: "Cobros de este viaje",
    columns: {
      date: "Fecha del cobro",
      instrument: "Forma de pago",
      status: "Estado",
      amount: "Abono (MXN)",
      balanceAfter: "Saldo después (MXN)",
    },
    statusActive: "Activo",
    statusVoided: "Anulado",
    viewCobro: "Ver cobro",
    voidCta: "Anular",
    empty: "Aún no hay cobros registrados.",
    loadError: "No se pudo cargar los cobros de este viaje.",
    retry: "Reintentar",
    batchPartOfMulti: "Parte de un cobro de varios viajes",
    voidedReason: (reason: string) => `Anulado · ${reason}`,
    emDash: "—",
    cashFreeze:
      "No se puede pasar a Con factura mientras haya cobros activos. Anúlalos desde su detalle (Ver cobro).",
    notApplicableTitle: "No aplica en este viaje",
    notApplicableItems: [
      "No aparece en Por facturar",
      "No lleva Carta Porte ni Datos para Carta Porte",
      "Exige al menos una carga para iniciar o completar",
    ],
    invoiceCardTitle: "Factura del viaje",
    invoiceCardSin: "Sin factura",
  },
} as const;
