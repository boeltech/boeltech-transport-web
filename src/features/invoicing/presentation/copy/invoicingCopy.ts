/**
 * Namespace: invoicing.copy.*
 */
export const invoicingCopy = {
  create: {
    title: "Nueva factura",
    titleAccessory: "Factura de servicios adicionales",
    submit: "Guardar borrador",
    /** Consecuencia del CTA: el borrador no es una factura válida todavía. */
    submitConsequence:
      "Se guarda como borrador. En el siguiente paso lo revisas y lo timbras.",
    successToast: "Factura creada exitosamente",
    errorToast: "Error al crear factura",
    tripRequiredToast: "Viaje requerido",
    tripRequiredDescription:
      "Para crear una factura debes iniciar desde un viaje con facturación disponible.",
    prefillErrorToast: "No se pudo cargar el viaje",
    blockedSubtitle: "No se puede crear otra factura para este viaje",
    blockedSubtitleAccessory:
      "No se pueden facturar servicios adicionales para este viaje",
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
      "La factura se genera desde un viaje con facturación disponible. Abre el viaje y usa «Generar factura», o elige uno en la cola «Por facturar» de Finanzas.",
    backToFinance: "Ir a Facturas",
  },
  blocked: {
    title: "Este viaje ya está facturado",
    titleNotReady: "Faltan datos del viaje para poder facturar",
    titleAccessory: "Servicios adicionales no disponibles",
    backToTrip: "Volver al viaje",
    goToRouteTab: "Ir a Ruta",
    goToCargoTab: "Ir a Carga",
    viewInvoice: (folio?: string | null) =>
      folio ? `Ver factura (${folio})` : "Ver factura",
    goFinance: "Ir a finanzas",
  },
  billingScope: {
    primary: "Cobro del viaje",
    accessory: "Cobro adicional",
  },
  section: {
    issuer: "Emisor",
    trip: "Viaje vinculado",
    receiver: "Datos del receptor",
    cfdi: "Datos CFDI",
    comprobante: "Comprobante fiscal",
    concepts: "Conceptos de cobro",
    amounts: "Importes",
    notes: "Notas internas",
  },
  createContext: {
    // Línea de contexto del alta: a quién · qué viaje · cuánto.
    receiverHeading: "Se factura a",
    tripLabel: "Viaje",
    totalHeading: "Total a facturar",
    currencyCode: "MXN",
    issuerLine: (name: string, rfc: string) =>
      `Emites como ${name}${rfc ? ` · RFC ${rfc}` : ""}`,
    // Banda de viajes vinculados (edición de borrador).
    issuerHeading: "Emisor",
    tripHeading: "Viaje vinculado",
    tripHeadingPlural: (count: number) => `Viajes vinculados (${count})`,
    tripBaseRate: "Tarifa base",
    receiverPrefilledHint: "Receptor precargado desde el cliente del viaje.",
    contextFooterEdit: "Viajes asociados a este borrador (no editables aquí).",
  },
  comprobante: {
    title: "Datos fiscales",
    description:
      "Así se emitirá la factura. Se toman del cliente del viaje.",
    edit: "Corregir datos fiscales",
    subsectionReceiver: "Receptor",
    subsectionPayment: "Condiciones de cobro",
    paymentSummary: (paymentMethod: string, paymentForm: string) =>
      `${paymentMethod} · ${paymentForm}`,
    sheet: {
      title: "Corregir datos fiscales",
      description:
        "Solo cambia lo que esté mal. Se aplica a esta factura, no al cliente.",
      apply: "Aplicar cambios",
      close: "Cancelar",
      validationSummary: "Revisa los datos fiscales",
    },
    rfcPlaceholder: "RFC del receptor (12 o 13 caracteres)",
    receiverNamePlaceholder: "Razón social o nombre completo",
    postalCodePlaceholder: "5 dígitos",
    selectPlaceholder: "Selecciona una opción",
  },
  hint: {
    issuer:
      "Datos del emisor tomados de Configuración → Empresa al crear el borrador.",
    tripEdit: "Viajes asociados a este borrador (no editables aquí).",
    // Sheet de sustitución (detalle fiscal).
    amountsAuto:
      "El subtotal se calcula desde los conceptos. IVA, retención y total se actualizan al cambiar conceptos o descuento.",
    retainedTax:
      "Art. 1-A LIVA — autotransporte terrestre de carga. Obligatoria para persona moral.",
  },
  label: {
    issuerRfc: "RFC emisor",
    issuerName: "Razón social",
    issuerRegime: "Régimen fiscal",
    issueLocation: "Lugar de expedición",
    tripClient: "Cliente del viaje",
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
    notesField: "Referencia u observaciones",
    notesDescription: "Solo para tu equipo. No aparecen en la factura.",
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
      issuer: "Tu empresa",
      receiver: "Cliente facturado",
      cfdi: "Datos fiscales",
      comprobante: "Datos de la factura",
      paymentTerms: "Condiciones de cobro",
      stamping: "Factura sellada",
      amounts: "Desglose de montos",
      billed: "Qué se cobró",
      fiscalDossier: "Expediente fiscal",
      fiscalDossierHint:
        "Folio fiscal, sellado, régimen y datos SAT (útil para contabilidad)",
      linkedTrips: (count: number) =>
        count === 1 ? "Viaje vinculado" : `Viajes vinculados (${count})`,
      payments: (count: number) =>
        count === 1 ? "Pagos recibidos" : `Pagos recibidos (${count})`,
      notes: "Notas internas",
      cancellation: "Cancelación",
      cancellationPending: "Cancelación en proceso",
    },
    label: {
      issueDate: "Fecha de emisión",
      paymentForm: "Forma de pago",
      paymentMethod: "Cómo se cobra",
      currency: "Moneda",
      subtotal: "Subtotal",
      discount: "Descuento",
      ivaTrasladado: "IVA",
      ivaRetenido: "IVA retenido",
      total: "Total",
      paid: "Cobrado",
      balance: "Por cobrar",
      tripBaseRate: "Tarifa base",
      viewTrip: "Ver detalle del viaje",
      satStatus: "Estado ante el SAT",
      date: "Fecha",
      satReason: "Motivo de cancelación",
      description: "Descripción",
      substitutionUuid: "Folio fiscal del sustituto",
      statTotal: "Total",
      statPaid: "Cobrado",
      statBalance: "Por cobrar",
      repUuid: "Folio del comprobante de pago",
      repParcialidad: "Parcialidad",
      repParcialidadEstimated: (n: number) => `Parcialidad ${n} (estimada)`,
      repSaldoAnt: "Saldo anterior",
      repSaldoInsoluto: "Saldo insoluto",
      repPagado: "Importe pagado",
      repRetry: "Reintentar sello del comprobante",
      ref: "Ref",
      repFiscalDeadline: "Plazo para sellar el comprobante de pago",
      cfdiUuid: "Folio fiscal (UUID)",
      stampedAt: "Fecha de sellado",
      pacProvider: "Proveedor de timbrado",
      exchangeRate: "Tipo de cambio",
      issuerShort: "Factura de",
    },
    overlayErrorSeeInline: "Revisa el mensaje detallado en el formulario.",
    paymentErrorTitle: "Error al registrar pago",
    cancelErrorTitle: "Error al cancelar factura",
    toast: {
      loadError: "Error al cargar factura",
      pdfError: "Error al generar PDF",
      repXmlError: "Error al descargar el XML del comprobante de pago",
      repPdfError: "Error al generar el PDF del comprobante de pago",
      copied: "Copiado al portapapeles",
      copyFailed: "No se pudo copiar",
      paymentRegistered:
        "Pago registrado. El comprobante de pago se sellará en segundo plano.",
      repRetrySuccess: "Sello del comprobante de pago reencolado",
      repRetryError: "No se pudo reencolar el sello del comprobante de pago",
    },
    repStatus: {
      notRequired: "Sin comprobante de pago",
      pending: "Comprobante de pago pendiente",
      pendingHint: "El comprobante de este pago se está sellando",
      stamped: "Comprobante de pago listo",
      failed: "No se pudo sellar el comprobante",
      failedHint: "El sello del comprobante de pago no se completó",
      failedErrorFallback:
        "Error al timbrar el complemento de pago. Reintente o contacte a soporte.",
      restampPending: "Reparando comprobantes de pago",
      restampPendingHint: "Se están regenerando los comprobantes de parcialidades",
      cancelling: "Cancelando comprobante de pago",
      cancellingHint: "Cancelando el comprobante anterior ante el SAT",
      cancelled: "Comprobante de pago cancelado",
    },
    chainRepair: {
      title: "Actualizar comprobantes de pago anteriores",
      description:
        "Este cobro cambia el orden de pagos ya sellados. Se cancelarán y volverán a sellar los comprobantes de pago afectados.",
      confirm: "Confirmar y registrar",
      cancel: "Volver",
      submitting: "Guardando...",
      previewInstallment: (n: number) => `Será el cobro parcial nº ${n}`,
    },
    paymentForm: {
      title: "Registrar pago",
      ppdHint:
        "Factura a crédito. Al registrar el cobro se generará un comprobante de pago (REP).",
      ppdHintLabel: "Más sobre factura a crédito",
      contextLine: (serie: string, folio: number, clientName: string) =>
        `${serie}-${folio} · ${clientName}`,
      balanceDue: "Por cobrar",
      total: "Total",
      paid: "Cobrado",
      settledMessage:
        "Esta factura ya está liquidada; no se pueden registrar más pagos.",
      amount: "Monto",
      paymentDate: "Fecha del cobro",
      paymentTime: "Hora (opcional)",
      paymentForm: "Forma de pago",
      paymentFormPlaceholder: "Selecciona forma de pago",
      additionalData: "Datos adicionales",
      reference: "Referencia (opcional)",
      referencePlaceholder: "Número de transferencia, cheque…",
      notes: "Notas (opcional)",
      notesPlaceholder: "Notas adicionales",
      validationSummaryTitle: "Revisa los datos del pago",
      cancel: "Cancelar",
      submit: "Registrar pago",
      submitting: "Guardando...",
      noBalanceTitle: "Sin saldo por cobrar",
      noBalanceDescription: "Esta factura ya no tiene saldo por cobrar.",
      amountExceedsTitle: "Monto inválido",
      amountExceedsDescription:
        "El pago no puede exceder el importe por cobrar.",
      validation: {
        amountRequired: "Monto requerido",
        amountPositive: "El monto debe ser mayor a 0",
        paymentDateFormat: "Formato requerido: YYYY-MM-DD",
        paymentTimeFormat: "Formato HH:mm o HH:mm:ss",
        paymentFormRequired: "Forma de pago requerida",
      },
    },
    hint: {
      noLinkedTrips: "Esta factura no tiene viajes vinculados.",
      conceptsSummary: (count: number, subtotal: string) =>
        `${count} partida${count === 1 ? "" : "s"} · Subtotal: ${subtotal}`,
      filesAlertTitle: "Archivos listos para descargar",
      filesAlertDescription:
        "Puedes descargar el PDF (representación impresa) y el XML (archivo fiscal). Si el viaje incluye Carta Porte, el PDF muestra un resumen de transporte.",
      xmlMissingTitle: "Archivo fiscal no disponible",
      xmlMissingDescription:
        "Actualiza la página para volver a cargar el archivo desde el servidor.",
      substitutionPrefix: "Esta factura sustituye a",
      substitutionLink: "la factura original",
      substitutionSuffix: ".",
      cancellationPendingSat:
        "Pendiente de aceptación del cliente",
      pueSettled:
        "Se liquidó al emitir (pago de contado)",
      pueSettledTitle: "PUE — pago en una sola exhibición",
      repFiscalDeadlineApproaching: (deadline: string) =>
        `Uno o más pagos deben sellar su comprobante de pago antes del ${deadline} (5.º día del mes siguiente).`,
      repFiscalDeadlineOverdue: (deadline: string) =>
        `Hay pagos con comprobante pendiente o fallido cuyo plazo (${deadline}) ya venció. Sella cuanto antes; el sistema no bloquea el reintento.`,
      repFiscalDeadlineRowApproaching: (deadline: string) =>
        `Plazo para sellar: ${deadline}`,
      repFiscalDeadlineRowOverdue: (deadline: string) =>
        `Plazo vencido (${deadline})`,
      paymentTimeHint:
        "Si no indicas hora, se usa mediodía (12:00).",
      paymentLateRegistrationHint:
        "La fecha del cobro ya superó el 5.º día del mes siguiente. Puedes registrar el pago; sella el comprobante de pago cuanto antes.",
    },
    substitute: {
      title: "Sustituir factura",
      contextLine: (serie: string, folio: number, clientName: string) =>
        `${serie}-${folio} · ${clientName}`,
      satCodesHintLabel: "Detalle fiscal de la sustitución",
      satCodesHint:
        "Cancelación por errores con factura de reemplazo (motivo SAT 01). La nueva factura queda relacionada con la original (relación SAT 04).",
      introTitle: "Qué va a pasar",
      introStepEmit:
        "Se emite una factura nueva con los mismos viajes vinculados.",
      introStepCancel: (serie: string, folio: number) =>
        `Se cancela la factura ${serie}-${folio}.`,
      introFootnote:
        "Si no cambias nada abajo, se repite el contenido actual.",
      optionalSectionHeading: "¿Qué quieres corregir? (opcional)",
      optionalSectionHint:
        "Los campos muestran los datos actuales; solo se envían los que modifiques.",
      optionalBadge: "Opcional",
      sectionHintMoreLabel: "Más detalle",
      amounts: {
        sectionTitle: "Importes",
        sectionHint: "Parten de los importes de esta factura.",
        sectionHintDetail:
          "Si cambias el subtotal con un solo viaje vinculado, también se actualiza la tarifa base del viaje.",
        sectionHintWithTripCorrections:
          "Con corrección en paradas, los importes se heredan de esta factura.",
        sectionHintWithTripCorrectionsDetail:
          "Los cambios de importe aplican sobre la nueva factura.",
      },
      concepts: {
        sectionTitle: "Partidas de cobro",
        sectionHint:
          "Edita las partidas de flete y servicios de la nueva factura.",
        sectionHintDetail:
          "Los importes totales y la tarifa base del viaje se recalculan a partir de la línea de flete.",
      },
      trips: {
        sectionTitle: "Paradas del viaje",
        sectionHint:
          "Corrige RFC o domicilio de las paradas. Los cambios se reflejan en el complemento de transporte de la nueva factura.",
        sectionHintDetail:
          "Al corregir domicilio se recalculan distancias de los tramos afectados cuando hay coordenadas; no se modifican fechas de seguimiento.",
        noPermission:
          "Tu rol no permite corregir paradas del viaje. Solicita acceso a un administrador.",
        loadingTrip: (tripCode: string) => `Cargando paradas del viaje ${tripCode}…`,
        noStops: (tripCode: string) => `El viaje ${tripCode} no tiene paradas cargadas.`,
        tripHeading: (tripCode: string, origin: string, destination: string) =>
          `${tripCode}: ${origin} → ${destination}`,
        stopLabel: (sequence: number, stopType: string) =>
          `Parada ${sequence + 1} · ${stopType}`,
        correctStop: "Corregir RFC",
        correctAddress: "Corregir dirección",
        editAgain: "Editar de nuevo",
        saveStopCorrection: "Incluir en sustitución",
      },
      assignment: {
        sectionTitle: "Operador y unidad",
        sectionHint:
          "Cambia conductor o vehículo del viaje si no coinciden con lo que debe ir en el complemento de transporte.",
        sectionHintDetail:
          "Al cambiar la unidad en un viaje cerrado, el kilometraje recorrido (odómetro final − inicial) se transfiere a la nueva unidad.",
        noPermission:
          "Tu rol no permite cambiar operador o unidad. Solicita acceso a un administrador.",
        loadingTrip: (tripCode: string) => `Cargando viaje ${tripCode}…`,
        tripHeading: (tripCode: string, origin: string, destination: string) =>
          `${tripCode}: ${origin} → ${destination}`,
        driverLabel: "Operador",
        driverPlaceholder: "Selecciona operador",
        vehicleLabel: "Unidad",
        vehiclePlaceholder: "Selecciona unidad",
        reasonLabel: "Motivo del cambio",
        reasonTooShort: "El motivo debe tener al menos 5 caracteres",
        noAssignmentChange:
          "Selecciona un operador o una unidad distinta a la asignación actual del viaje",
        saveCorrection: "Incluir en sustitución",
        editAgain: "Actualizar corrección",
      },
      address: {
        swapLabel: "Buscar dirección existente",
        swapDescription:
          "Reutiliza un domicilio del catálogo (cliente o directorio del tenant). Al incluir la corrección se copia a la parada; no modifica la fuente.",
        inlineLabel: "Capturar domicilio corregido",
        locationNameLabel: "Nombre del lugar",
        locationNamePlaceholder:
          "Ej: Bodega Central, CEDIS Norte, Planta Monterrey…",
        pickerLabel: "Buscar dirección existente",
        pickerPlaceholder: "Nombre, calle o código postal…",
        tripClientRequired:
          "El viaje debe tener cliente asignado para reutilizar un domicilio del catálogo en la sustitución.",
        reasonLabel: "Motivo del cambio",
        reasonTooShort: "El motivo debe tener al menos 5 caracteres",
        pickerRequired: "Selecciona una dirección del catálogo",
        addressUnchanged:
          "La dirección elegida coincide con la registrada en la parada",
        saveCorrection: "Incluir en sustitución",
        cancel: "Cancelar",
        addressValidationFailed:
          "El domicilio no cumple los requisitos SAT para parada. Revisa el detalle abajo.",
        addressValidationSummaryTitle: "Revisa el domicilio corregido",
        coordinatesFarFromPostalCode: (distanceKm: number, postalCode: string) =>
          `Las coordenadas están a unos ${Math.round(distanceKm)} km del centro aproximado del CP ${postalCode}. Revisa latitud y longitud: no bloquea el timbrado, pero puede afectar distancias en Carta Porte.`,
        coordinatesFarFromPostalCodeReference: (input: {
          label: string;
          latitude: number;
          longitude: number;
          query: string;
          resolutionSource: string;
        }) =>
          `Referencia del sistema para el CP (consulta «${input.query}», fuente ${input.resolutionSource}): ${input.label} — lat ${input.latitude.toFixed(6)}, lng ${input.longitude.toFixed(6)}.`,
        preflightRfcMissing:
          "La dirección elegida no tiene RFC remitente/destinatario. La sustitución fallará al timbrar; corrige el RFC de la parada o elige otra fuente.",
        preflightRfcInvalid:
          "El RFC de la dirección elegida no tiene formato SAT válido. Corrígelo antes de sustituir.",
      },
      preflight: {
        summaryTitle: "Revisa el RFC de las paradas antes de sustituir",
        reasonMissing: "RFC faltante",
        reasonInvalid: "RFC con formato inválido",
      },
      corrections: {
        sectionTitle: "Cliente / receptor",
        sectionHint:
          "RFC, nombre, régimen y forma de pago. Precargados desde esta factura.",
        rfc: "RFC del receptor",
        receiverName: "Nombre del receptor",
        postalCode: "Código postal",
        taxRegime: "Régimen fiscal",
        cfdiUsage: "Uso CFDI",
        paymentForm: "Forma de pago",
        paymentMethod: "Cómo se cobra",
        propagateLabel: "Actualizar también el cliente del viaje",
        propagateHint:
          "Guarda RFC, nombre y régimen en el catálogo del cliente para no repetir el error en futuras facturas.",
      },
      cancellationReasonLabel: "Motivo de la corrección",
      cancellationReasonDescription:
        "El SAT lo usa al cancelar la factura original. Debe relacionarse con la corrección que estás haciendo.",
      cancellationReasonPlaceholder:
        "Ej. Corrección del RFC del receptor",
      notesLabel: "Notas internas",
      notesDescription:
        "Opcional. Solo para tu equipo; no aparecen en la factura.",
      notesPlaceholder: "Contexto para auditoría o seguimiento interno",
      validationSummary: "Revisa los datos antes de confirmar",
      close: "Cerrar",
      confirm: "Sustituir factura",
      processing: "Procesando…",
      confirmLoadingTrips: "Cargando viajes…",
      successTitle: "Sustitución completada",
      successDescription: (serie: string, folio: number) =>
        `Factura ${serie}-${folio} emitida. La factura original quedó cancelada.`,
      errorTitle: "Error en sustitución",
      errorSeeInline: "Revisa el mensaje detallado en el formulario.",
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
      pdf: "Descargar PDF",
      pdfGenerating: "Generando...",
      xml: "Descargar XML",
      pdfTitle: "Abrir representación impresa",
      xmlTitle: "Descargar archivo fiscal (XML)",
      repXml: "XML del comprobante",
      repXmlTitle: "Descargar XML del comprobante de pago",
      repPdf: "PDF del comprobante",
      repPdfTitle: "Abrir PDF del comprobante de pago",
      repUuidCopyLabel: "Copiar folio del comprobante de pago",
      uuidLabel: "Folio fiscal",
      uuidCopyLabel: "Copiar folio fiscal",
      receiverSubtitle: (name: string, rfc: string) => `${name} · ${rfc}`,
      issuerLine: (issuerName: string) => `Factura de ${issuerName}`,
    },
  },
  concepts: {
    sectionDescription:
      "El flete toma la tarifa del viaje. Agrega los servicios que apliquen: maniobras, estadías, resguardo.",
    sectionDescriptionAccessory:
      "Esta factura incluye solo servicios (maniobras, estadías, resguardo). No lleva flete.",
    fleteHint: "Concepto principal, ligado a la tarifa del viaje.",
    serviceHint: "Concepto de servicio. Puedes tomarlo de tu catálogo o capturarlo.",
    fleteRowTitle: "Flete",
    emptyTitle: "Sin conceptos",
    conceptsCount: (count: number) =>
      `${count} concepto${count === 1 ? "" : "s"}`,
    addConcept: "Agregar concepto",
    removeConcept: "Quitar concepto",
    discountHint: "Se resta del subtotal de los conceptos.",
    catalogLabel: "Catálogo de servicios",
    catalogPlaceholder: "Selecciona un servicio guardado",
    catalogManual: "Captura manual",
    catalogEmpty: "No hay servicios en el catálogo.",
    catalogEmptyLink: "Configurar en ajustes",
    claveProdServ: "Clave producto/servicio",
    claveUnidad: "Clave unidad",
    description: "Descripción",
    quantity: "Cantidad",
    unitPrice: "Precio unitario",
    amount: "Importe",
    typeFlete: "Flete",
    typeService: "Servicio",
    fleteBaseRateWarning: (baseRate: number, fleteAmount: number) =>
      `El importe de flete (${fleteAmount.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}) difiere de la tarifa base del viaje (${baseRate.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}).`,
    detailTable: {
      type: "Tipo",
      clave: "Clave",
      description: "Descripción",
      quantity: "Cant.",
      unitPrice: "P. unit.",
      amount: "Importe",
      iva: "IVA",
      flete: "Flete",
      service: "Servicio",
      actions: "Acciones",
      edit: "Editar",
      qtyUnitSummary: (quantity: number, unitPrice: string) =>
        `${quantity} × ${unitPrice}`,
    },
    table: {
      emptyDescription: "Agrega el flete del viaje y los servicios que apliquen.",
      emptyDescriptionAccessory:
        "Agrega al menos un servicio (maniobras, estadías) para esta factura.",
    },
    sheet: {
      createTitle: "Nuevo concepto",
      editFleteTitle: "Editar flete",
      editConceptTitle: "Editar concepto",
      apply: "Guardar concepto",
      close: "Cancelar",
      validationSummary: "Revisa los datos del concepto",
      taxesHeading: "Impuestos del concepto",
      taxesHint: "Define si este concepto lleva IVA y/o retención.",
      ivaAplica: "Aplica IVA",
      retencionAplica: "Aplica retención",
      retencionRequiredHint:
        "Retención IVA 4% obligatoria sobre el flete para persona moral (autotransporte de carga).",
      validation: {
        claveProdServRequired: "Selecciona o captura la clave producto/servicio SAT.",
        claveUnidadRequired: "Selecciona o captura la clave de unidad SAT.",
        unidadRequired: "Indica la unidad de medida.",
        descriptionRequired: "Indica la descripción que aparecerá en el CFDI.",
        quantityPositive: "La cantidad debe ser mayor a cero.",
        unitPriceMin: "El precio unitario no puede ser negativo.",
        unitPriceRequired: "Indica el precio unitario del concepto.",
      },
    },
  },
  amountsPanel: {
    title: "Importes",
    totalLabel: "Total a facturar",
    hint: "El IVA y la retención se calculan concepto por concepto.",
    ivaPerConceptHint: "según conceptos",
    retentionPerConceptHint: "por concepto",
    /** Retención 4% en lenguaje llano (Art. 1-A LIVA, autotransporte de carga). */
    retentionExplainer:
      "Se retiene el 4% de IVA porque el receptor es persona moral y el servicio es de transporte de carga.",
  },
} as const;

/** CTA compartido con Finanzas y empty states */
export const invoiceFromTripCta = {
  label: "Ver viajes por facturar",
  tooltip:
    "Abre la cola de viajes con facturación disponible en Finanzas",
  emptyDescription:
    "Elige un viaje de la cola «Por facturar» para generar su factura.",
  invoiceablePath: "/finance?tab=invoiceable",
} as const;
