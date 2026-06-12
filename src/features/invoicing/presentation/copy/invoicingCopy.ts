/**
 * Namespace: invoicing.copy.*
 */
export const invoicingCopy = {
  create: {
    title: "Nueva factura",
    submit: "Crear borrador",
    successToast: "Factura creada exitosamente",
    errorToast: "Error al crear factura",
    tripRequiredToast: "Viaje requerido",
    tripRequiredDescription:
      "Para crear una factura debes iniciar desde un viaje con facturación disponible.",
    prefillErrorToast: "No se pudo cargar el viaje",
    blockedSubtitle: "No se puede crear otra factura para este viaje",
    subtitleFromTrip: (tripCode: string) => `Desde viaje ${tripCode}`,
  },
  edit: {
    title: "Editar factura",
    submit: "Guardar cambios",
    successToast: "Factura actualizada exitosamente",
    errorToast: "Error al actualizar factura",
    loadErrorToast: "No se pudo cargar el borrador",
    subtitleDraft: (serie: string, folio: number) => `Borrador ${serie}-${folio}`,
    notEditableTitle: "Edición no disponible",
    notEditableHint: "Solo borradores son editables",
    notEditableBody:
      "Solo las facturas en estado borrador pueden editarse.",
    backToFinance: "Volver a finanzas",
  },
  empty: {
    title: "Facturar desde un viaje",
    body:
      "El CFDI se genera desde un viaje con facturación disponible. Abre el viaje y usa «Generar factura», o el listado de viajes.",
    backToFinance: "Volver a finanzas",
  },
  blocked: {
    title: "Este viaje ya está facturado",
    backToTrip: "Volver al viaje",
    viewInvoice: (folio?: string | null) =>
      folio ? `Ver factura (${folio})` : "Ver factura",
    goFinance: "Ir a finanzas",
  },
  section: {
    issuer: "Emisor (snapshot fiscal)",
    trip: "Viaje vinculado",
    receiver: "Datos del receptor",
    cfdi: "Datos CFDI",
    amounts: "Importes",
    notes: "Notas internas",
  },
  hint: {
    issuer:
      "Datos del emisor tomados de Configuración → Empresa al crear el borrador.",
    tripCreate:
      "La factura se vinculará a este viaje. Revisa receptor e importes antes de guardar.",
    tripEdit: "Viajes asociados a este borrador (no editables aquí).",
    amountsAuto:
      "IVA y total se calculan al ingresar el subtotal. Puedes ajustarlos manualmente si es necesario.",
    retainedTax:
      "Art. 1-A LIVA — autotransporte terrestre de carga",
  },
  label: {
    issuerRfc: "RFC emisor",
    issuerName: "Razón social",
    issuerRegime: "Régimen fiscal",
    issueLocation: "Lugar de expedición",
    tripCode: "Código de viaje",
    tripClient: "Cliente del viaje",
    tripSubtotal: "Importe base del viaje",
    viewTrip: "Ver detalle del viaje",
    rfc: "RFC",
    postalCode: "Código postal (domicilio fiscal)",
    receiverName: "Nombre / razón social",
    taxRegime: "Régimen fiscal",
    cfdiUsage: "Uso CFDI",
    paymentForm: "Forma de pago",
    paymentMethod: "Método de pago",
    currency: "Moneda",
    subtotal: "Subtotal",
    discount: "Descuento",
    total: "Total",
    iva: "IVA",
    retainedTax: "IVA retenido",
    retainedTaxApply: "Aplica retención IVA 4% (persona moral)",
    notesPlaceholder: "Referencias internas u observaciones…",
    cancel: "Cancelar",
    saving: "Guardando…",
  },
  validation: {
    formSummary: "Revisa los datos de la factura",
    fiscalSummary: "Revisa los requisitos fiscales antes de guardar",
  },
  action: {
    back: "Volver",
  },
  detail: {
    section: {
      issuer: "Emisor",
      receiver: "Receptor",
      cfdi: "Datos CFDI",
      linkedTrips: (count: number) => `Viajes vinculados (${count})`,
      payments: (count: number) => `Pagos y complementos REP (${count})`,
      notes: "Notas internas",
      cancellation: "Cancelación",
      cancellationPending: "Cancelación en proceso",
    },
    label: {
      issueDate: "Fecha emisión",
      paymentForm: "Forma de pago",
      paymentMethod: "Método de pago",
      currency: "Moneda",
      subtotal: "Subtotal",
      discount: "Descuento",
      ivaTrasladado: "IVA Trasladado",
      ivaRetenido: "IVA Retenido",
      total: "Total",
      paid: "Pagado",
      balance: "Saldo",
      tripBaseRate: "Tarifa base",
      viewTrip: "Ver detalle del viaje",
      satStatus: "Estatus SAT",
      date: "Fecha",
      satReason: "Motivo SAT",
      description: "Descripción",
      substitutionUuid: "UUID sustitución",
      statTotal: "Total factura",
      statPaid: "Pagado",
      statBalance: "Saldo pendiente",
      repUuid: "REP UUID",
      repRetry: "Reintentar REP",
      ref: "Ref",
      cfdiUuid: "UUID CFDI",
      stampedAt: "Fecha timbrado",
      pacProvider: "PAC",
      exchangeRate: "Tipo de cambio",
    },
    toast: {
      loadError: "Error al cargar factura",
      pdfError: "Error al generar PDF",
      copied: "Copiado al portapapeles",
      copyFailed: "No se pudo copiar",
      paymentRegistered:
        "Pago registrado. El complemento REP se timbrará en segundo plano.",
      repRetrySuccess: "Timbrado REP reencolado para reintento",
      repRetryError: "No se pudo reencolar el timbrado REP",
    },
    repStatus: {
      notRequired: "Sin REP",
      pending: "REP pendiente",
      pendingHint: "El complemento de pagos se está timbrando",
      stamped: "REP timbrado",
      failed: "REP falló",
      failedHint: "El timbrado del complemento de pagos no se completó",
    },
    hint: {
      xmlWithContent:
        "El XML descargable es el CFDI timbrado completo (Carta Porte 3.1 y TimbreFiscalDigital van dentro del mismo archivo). El PDF de representación impresa resume el CFDI y, si el XML incluye Carta Porte, muestra un resumen de transporte.",
      xmlMissing:
        "Si no aparece el botón para descargar XML, actualice la página para volver a cargar el comprobante desde el servidor.",
      substitutionPrefix: "Esta factura sustituye a",
      substitutionLink: "la factura original",
      substitutionSuffix: ".",
      cancellationPendingSat:
        "Pendiente de aceptación del receptor",
      pueSettled:
        "Liquidada al timbrar (PUE — pago en una sola exhibición)",
    },
    substitute: {
      title: "Sustituir factura (SAT 01)",
      descriptionPrefix: "Se emitirá un",
      descriptionNewCfdi: "nuevo CFDI",
      descriptionRelation:
        "vinculado fiscalmente a esta factura (relación SAT 04 — sustitución de CFDI previos), con los mismos viajes.",
      descriptionCancel:
        "Luego se solicitará la cancelación de esta factura",
      descriptionMotivo: "con motivo",
      descriptionMotivoCode: "01",
      descriptionMotivoLabel: "(errores con relación)",
      descriptionRequirement:
        "Requiere factura sin pagos registrados. Opcionalmente puedes corregir datos fiscales e importes antes de timbrar.",
      amounts: {
        sectionTitle: "Corregir importes",
        sectionHint:
          "Precargado con los importes del CFDI original. No modifica los viajes vinculados; solo afecta el sustituto.",
        sectionHintWithTripCorrections:
          "Si corriges paradas del viaje, los importes pueden re-derivarse desde los viajes. Los overrides aquí siguen aplicando sobre el sustituto.",
      },
      trips: {
        sectionTitle: "Corregir viaje / Carta Porte",
        sectionHint:
          "Los cambios se aplican al viaje y se reflejan en la Carta Porte del sustituto. Solo se envían las paradas que modifiques.",
        noPermission:
          "Tu rol no permite corregir datos fiscales de paradas. Requiere permiso trips.stops.fiscal_edit.",
        loadingTrip: (tripCode: string) => `Cargando paradas del viaje ${tripCode}…`,
        noStops: (tripCode: string) => `El viaje ${tripCode} no tiene paradas cargadas.`,
        tripHeading: (tripCode: string, origin: string, destination: string) =>
          `${tripCode}: ${origin} → ${destination}`,
        stopLabel: (sequence: number, stopType: string) =>
          `Parada ${sequence + 1} · ${stopType}`,
        correctStop: "Corregir RFC",
        editAgain: "Editar de nuevo",
        saveStopCorrection: "Incluir en sustitución",
      },
      corrections: {
        sectionTitle: "Corregir datos fiscales",
        sectionHint:
          "Precargado con los datos del CFDI original. Solo se envían al API los campos que modifiques.",
        rfc: "RFC del receptor",
        receiverName: "Nombre del receptor",
        postalCode: "Código postal",
        taxRegime: "Régimen fiscal",
        cfdiUsage: "Uso CFDI",
        paymentForm: "Forma de pago",
        paymentMethod: "Método de pago",
      },
      cancellationReasonLabel: "Motivo de cancelación del CFDI original",
      cancellationReasonPlaceholder: "Ej. Corrección de datos fiscales del receptor",
      notesLabel: "Notas internas (opcional)",
      notesPlaceholder: "Contexto para auditoría",
      validationSummary: "Revisa los datos de sustitución",
      close: "Cerrar",
      confirm: "Confirmar sustitución",
      processing: "Procesando...",
      confirmLoadingTrips: "Cargando viajes…",
      successTitle: "Sustitución completada",
      successDescription: (serie: string, folio: number) =>
        `Nueva factura ${serie}-${folio} timbrada; original cancelada (01).`,
      errorTitle: "Error en sustitución",
      tripsStopLoadErrorTitle: "No se pudieron cargar las paradas",
      tripsStopLoadErrorDescription:
        "Espera a que terminen de cargar los viajes vinculados o vuelve a intentar.",
    },
    notFound: {
      title: "Factura no encontrada",
      backLabel: "Regresar",
    },
    missingId: {
      title: "Factura no especificada",
      description: "La URL no incluye un identificador de factura válido.",
    },
    forbidden: {
      title: "Acceso denegado",
      description: "No tienes permiso para ver esta factura.",
    },
    serverError: {
      title: "No se pudo cargar la factura",
      description: "Ocurrió un error en el servidor. Intenta de nuevo.",
      retry: "Reintentar",
    },
    actions: {
      stamp: "Timbrar",
      stamping: "Timbrando...",
      editDraft: "Editar",
      deleteDraft: "Eliminar borrador",
      registerPayment: "Registrar pago",
      substitute: "Sustituir factura",
      cancel: "Cancelar",
      pdfError: "No se pudo abrir el PDF",
    },
    header: {
      title: "Factura",
      backLabel: "Volver",
      pdf: "PDF",
      pdfGenerating: "Generando...",
      xml: "XML",
      pdfTitle: "Ver PDF",
      xmlTitle: "Descargar XML timbrado",
      uuidLabel: "UUID",
      uuidSubtitle: (uuid: string) => `UUID: ${uuid}`,
      receiverSubtitle: (name: string, rfc: string) => `${name} · ${rfc}`,
    },
  },
} as const;

/** CTA compartido con Finanzas y empty states */
export const invoiceFromTripCta = {
  label: "Facturar desde viaje",
  tooltip:
    "Abre el listado de viajes para generar CFDI desde un viaje con facturación disponible",
  emptyDescription:
    "Genera CFDI desde un viaje elegible en el módulo Viajes.",
  tripsPath: "/trips",
} as const;
