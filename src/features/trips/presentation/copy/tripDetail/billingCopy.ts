/**
 * Copy del tab Facturación / Cobro (F5 · D7, D14–D29 · Q11).
 */

export const billingCopy = {
  invoices: {
    title: "Facturas del viaje",
    /** D19 / F-01: título de la tabla de piernas. */
    titleSplit: "Reparto del flete entre clientes",
    description:
      "Servicio con factura · el cobro lo lleva quien recibe cada factura.",
    /** D27: ambas vigentes ante el SAT hasta cancelar la original. */
    descriptionPartialSubstitution:
      "Hasta cancelar la original, las dos facturas están vigentes ante el SAT.",
    descriptionSplit:
      "Cada cliente factura y cobra su porción del flete.",
    descriptionFalseTrip:
      "El viaje en falso es la única factura vigente de este viaje.",
    emptyAccessories: "Sin facturas de servicios adicionales",
    /** F-02: card aparte bajo la tabla de piernas. */
    accessoriesSectionTitle: "Servicios adicionales",
    history: "Historial",
    accessoryCta: "Facturar servicios adicionales",
    columns: {
      document: "Documento",
      /** D19: eje cliente en modo reparto. */
      client: "Cliente",
      statusFolio: "Estado y folio",
      /** D19: estado + folio / CTA en modo reparto. */
      invoice: "Factura",
      total: "Total",
      /** F-ds: columna share (monto + % + barra). */
      share: "Parte del flete",
      collected: "Cobrado",
      balance: "Saldo",
    },
    /** F-ds: label de summaryRow en modo reparto. */
    freightBasis: "Base de flete",
    /** D-INV-4: summary modo docs (excluye borrador/canceladas). */
    facturadoVigente: "Facturado vigente",
    /** Summary de Factura en Base de flete (Σ totales vigentes del reparto). */
    facturadoSummary: (amount: string) => `Facturado ${amount}`,
    docFreight: "Flete",
    /** D27: fila del CFDI reemplazado (aún sin cancelar o ya cancelado). */
    docFreightOriginal: "Flete original",
    /** D27 / split: porción reemplazada. */
    docSplitOriginal: (label: string) => `${label} · original`,
    docAccessory: "Servicio adicional",
    /** D20 / F-11: título tipado de la fila de ingreso en falso. */
    docFalseTrip: "Viaje en falso",
    /** Subtítulo de la fila (ingreso sin CP); el estado «Por facturar» vive en la columna Estado. */
    docFalseTripSubtitle: "Ingreso sin Carta Porte",
    /** Título de fila pierna = razón social (D19); legacy tests usan docSplit. */
    docSplit: (label: string) => label,
    badgePrimaryClient: "Cliente principal",
    badgeCarriesCp: "Lleva Carta Porte",
    withCartaPorte: "Con Carta Porte",
    withoutCartaPorte: "Sin Carta Porte",
    /** F5b P1-A: flete vigente con Atención fiscal. */
    toSubstitute: "Por sustituir",
    /** D27: original reemplazada aún sin cancelar ante el SAT. */
    toCancel: "Por cancelar",
    /** D-INV-7: cadena de sustitución (folios del listado). */
    replaces: (folio: string) => `Sustituye a ${folio}`,
    replacedBy: (folio: string) => `Reemplazada por ${folio}`,
    openInvoice: "Abrir factura",
    /** Slot sin CFDI (falso / porción). */
    pendingInvoice: "Por facturar",
    /** Badge en columna Factura (modo reparto, artboard D19). */
    pendingInvoiceBadge: "Pendiente de facturar",
    pendingInvoiceDetail: "Aún sin factura",
    /** D-INV-8: viaje cancelado sin factura en la porción. */
    noEmit: "Sin factura · no emitir",
    emptyTable: "Aún no hay facturas en este viaje. Usa Facturar en el encabezado.",
    /** Texto % (tests / chip); la celda share formatea el % vía EntityListTable. */
    sharePercent: (pct: number) => `${pct}%`,
    viewInvoice: "Ver factura",
    invoicePortion: "Facturar porción",
    openDraft: "Continuar borrador",
    draftNotInTotals: "Los borradores no cuentan en el total cobrado.",
    /** Total CFDI en celda Factura (modo reparto). */
    invoiceTotal: (amount: string) => `Total ${amount}`,
  },
  cobroRail: {
    title: "Cobro",
    facturado: "Facturado vigente",
    cobrado: "Cobrado del viaje",
    porCobrar: "Por cobrar",
    paymentsOnInvoice: (folio: string) =>
      `Los pagos se registran en la factura ${folio}.`,
    paymentsOnInvoiceGeneric:
      "Los pagos se registran en la factura activa.",
    substituteHint:
      "Registra los cobros en la factura activa (la sustituta ya timbrada). Los cobros anteriores no se mueven.",
    /** D27 / Q10: apunta a la sustituta por folio. */
    paymentsOnSubstitute: (folio: string) =>
      `Registra los pagos en la sustituta ${folio}.`,
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
    /** D27: no invita a Sustituir de nuevo; oriente a cancelar original. */
    cancelOriginalTitle: (folio: string) =>
      `Cancela la factura original ${folio}`,
    cancelOriginalBody: (originalFolio: string, substituteFolio: string) =>
      `La sustituta ${substituteFolio} ya está vigente y la original ${originalFolio} sigue sin cancelar. Abre la original y reintenta la cancelación. No sustituyas de nuevo ni corrijas flota por este aviso.`,
    cancelOriginalCta: "Abrir factura original",
    cancelOriginalBadge: "Original sin cancelar",
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
    /** D20 / F-11 · artboard Fact-Falso. */
    cardTitle: "Declaración de viaje en falso",
    declaredBy: "Declaró",
    reason: "Motivo",
    reasonMissing: "Sin motivo registrado",
    whoUnknown: "—",
    expenses: "Gastos del viaje",
    viewCosts: "Ver costos",
    expensesHint: "Los gastos se capturan antes de declarar.",
    declaredAtLine: (who: string, when: string) => `${who} · ${when}`,
  },
  substitute: {
    chip: "Sustitución",
    openOriginal: "Abrir factura original",
    historyTitle: "Sustitución",
    historyDescription: "Por qué hay dos facturas de flete.",
    historyCancelPending: (folio: string) =>
      `Cancelación de ${folio} no completada · reintentar`,
    historyWaitingReceptor: (folio: string) =>
      `${folio} en espera del receptor · reintentar si aplica`,
    historySubstituteStamped: (subFolio: string, origFolio: string) =>
      `${subFolio} timbrada como sustituta de ${origFolio}`,
    historyOriginalStamped: (folio: string) => `${folio} timbrada`,
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
