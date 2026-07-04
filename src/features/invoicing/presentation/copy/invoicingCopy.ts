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
    issuerHeading: "Emisor",
    tripHeading: "Viaje vinculado",
    tripHeadingPlural: (count: number) => `Viajes vinculados (${count})`,
    tripBaseRate: "Tarifa base",
    receiverPrefilledHint: "Receptor precargado desde el cliente del viaje.",
    contextFooterCreate:
      "Revisa el comprobante fiscal y las partidas antes de guardar el borrador.",
    contextFooterEdit: "Viajes asociados a este borrador (no editables aquí).",
  },
  comprobante: {
    description:
      "Revisa los datos que irán en el CFDI antes de armar las partidas.",
    subsectionReceiver: "Receptor",
    subsectionPayment: "Condiciones de cobro",
  },
  hint: {
    issuer:
      "Datos del emisor tomados de Configuración → Empresa al crear el borrador.",
    tripCreate:
      "La factura se vinculará a este viaje. Revisa receptor, partidas de cobro e importes antes de guardar.",
    tripEdit: "Viajes asociados a este borrador (no editables aquí).",
    amountsAuto:
      "El subtotal se calcula desde las partidas de cobro. IVA, retención y total se actualizan al cambiar partidas o descuento.",
    amountsFromConcepts:
      "Los importes se calculan automáticamente desde las partidas de cobro y el descuento global.",
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
      comprobante: "Comprobante fiscal",
      paymentTerms: "Condiciones de cobro",
      stamping: "Timbrado / SAT",
      amounts: "Importes y saldo",
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
      repParcialidad: "Parcialidad",
      repParcialidadEstimated: (n: number) => `Parcialidad ${n} (estimada)`,
      repSaldoAnt: "Saldo anterior",
      repSaldoInsoluto: "Saldo insoluto",
      repPagado: "Importe pagado",
      repRetry: "Reintentar REP",
      ref: "Ref",
      repFiscalDeadline: "Plazo REP",
      cfdiUuid: "UUID CFDI",
      stampedAt: "Fecha timbrado",
      pacProvider: "PAC",
      exchangeRate: "Tipo de cambio",
    },
    overlayErrorSeeInline: "Revisa el mensaje detallado en el formulario.",
    paymentErrorTitle: "Error al registrar pago",
    cancelErrorTitle: "Error al cancelar factura",
    toast: {
      loadError: "Error al cargar factura",
      pdfError: "Error al generar PDF",
      repXmlError: "Error al descargar XML del REP",
      repPdfError: "Error al generar PDF del REP",
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
      restampPending: "Re-timbrado REP",
      restampPendingHint: "La cadena de parcialidades se está reparando",
      cancelling: "Cancelando REP",
      cancellingHint: "Cancelando complemento anterior ante el SAT",
      cancelled: "REP cancelado",
    },
    chainRepair: {
      title: "Reparar cadena de parcialidades",
      description:
        "Este pago altera el orden de parcialidades REP ya timbradas. Se cancelarán y volverán a timbrar los complementos afectados.",
      confirm: "Confirmar y registrar",
      cancel: "Volver",
      previewInstallment: (n: number) => `Parcialidad estimada: ${n}`,
    },
    hint: {
      noLinkedTrips: "Esta factura no tiene viajes vinculados.",
      conceptsSummary: (count: number, subtotal: string) =>
        `${count} partida${count === 1 ? "" : "s"} · Subtotal: ${subtotal}`,
      filesAlertTitle: "XML y PDF",
      filesAlertDescription:
        "El XML es el comprobante fiscal completo timbrado. El PDF es la representación impresa; si el viaje incluye Carta Porte, muestra un resumen de transporte.",
      xmlMissingTitle: "XML no disponible",
      xmlMissingDescription:
        "Actualiza la página para volver a cargar el comprobante desde el servidor.",
      substitutionPrefix: "Esta factura sustituye a",
      substitutionLink: "la factura original",
      substitutionSuffix: ".",
      cancellationPendingSat:
        "Pendiente de aceptación del receptor",
      pueSettled:
        "Liquidada al timbrar (PUE — pago en una sola exhibición)",
      repFiscalDeadlineApproaching: (deadline: string) =>
        `Uno o más pagos deben timbrar su complemento REP antes del ${deadline} (5.º día del mes siguiente, RMF).`,
      repFiscalDeadlineOverdue: (deadline: string) =>
        `Hay pagos con REP pendiente o fallido cuyo plazo fiscal (${deadline}) ya venció. Timbrar cuanto antes; el sistema no bloquea el reintento.`,
      repFiscalDeadlineRowApproaching: (deadline: string) =>
        `Plazo REP: ${deadline}`,
      repFiscalDeadlineRowOverdue: (deadline: string) =>
        `Plazo REP vencido (${deadline})`,
      paymentTimeHint:
        "Si no indicas hora, el SAT usa mediodía (12:00) en FechaPago.",
      paymentLateRegistrationHint:
        "La fecha del cobro ya superó el 5.º día del mes siguiente (RMF). Puedes registrar el pago; timbra el REP cuanto antes.",
    },
    substitute: {
      title: "Sustituir factura",
      subtitle: "Motivo SAT 01 — errores con relación",
      introTitle: "Qué va a pasar",
      introStepEmit:
        "Se timbra una nueva factura con los mismos viajes vinculados.",
      introStepCancel: (serie: string, folio: number) =>
        `Se solicita cancelar la factura ${serie}-${folio} (motivo 01: errores con relación al sustituto).`,
      introStepRequirement:
        "Solo disponible si esta factura no tiene pagos registrados.",
      introFootnote:
        "La nueva factura quedará vinculada a la cancelada (relación SAT 04).",
      optionalSectionHeading: "Correcciones antes de timbrar",
      optionalSectionHint:
        "Opcional. Los campos muestran los datos actuales; solo se envían los que modifiques.",
      optionalBadge: "Opcional",
      amounts: {
        sectionTitle: "Importes del sustituto",
        sectionHint:
          "Parten de los importes de esta factura. Si cambias el subtotal con un solo viaje vinculado, también se actualiza la tarifa base del viaje.",
        sectionHintWithTripCorrections:
          "Con corrección en paradas, los importes se heredan de la factura sustituida. Los cambios aquí aplican sobre el sustituto.",
      },
      concepts: {
        sectionTitle: "Conceptos de cobro del sustituto",
        sectionHint:
          "Edita las partidas (flete y servicios) del sustituto. El nuevo CFDI se emite con estas partidas y relación 04; los importes totales y la tarifa base del viaje se recalculan a partir de la línea de flete.",
      },
      trips: {
        sectionTitle: "Paradas y Carta Porte",
        sectionHint:
          "Corrige RFC o domicilio de paradas del viaje. Los cambios se reflejan en la Carta Porte del sustituto. Al corregir domicilio, el sistema recalcula distancias de los tramos afectados cuando las paradas tienen coordenadas; no modifica fechas de seguimiento.",
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
          "Cambia conductor o vehículo del viaje vinculado si no coinciden con lo que debe ir en Carta Porte. Al cambiar la unidad en un viaje cerrado, el kilometraje recorrido (odómetro final − inicial) se transfiere al odómetro de la nueva unidad.",
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
        sectionTitle: "Datos del receptor",
        sectionHint:
          "RFC, nombre, régimen y forma de pago del sustituto. Precargados desde esta factura.",
        rfc: "RFC del receptor",
        receiverName: "Nombre del receptor",
        postalCode: "Código postal",
        taxRegime: "Régimen fiscal",
        cfdiUsage: "Uso CFDI",
        paymentForm: "Forma de pago",
        paymentMethod: "Método de pago",
        propagateLabel: "Actualizar también el cliente del viaje",
        propagateHint:
          "Guarda RFC, nombre y régimen en el catálogo del cliente para no repetir el error en futuras facturas.",
      },
      cancellationReasonLabel: "Motivo de cancelación",
      cancellationReasonDescription:
        "Texto que el SAT exige al cancelar la factura original con motivo 01. Debe relacionarse con la corrección que estás haciendo.",
      cancellationReasonPlaceholder:
        "Ej. Corrección del RFC del receptor en la factura sustituta",
      notesLabel: "Notas internas",
      notesDescription: "Opcional. Solo para tu equipo; no aparecen en el CFDI.",
      notesPlaceholder: "Contexto para auditoría o seguimiento interno",
      validationSummary: "Revisa los datos antes de confirmar",
      close: "Cerrar",
      confirm: "Emitir sustituto y cancelar original",
      processing: "Procesando…",
      confirmLoadingTrips: "Cargando viajes…",
      successTitle: "Sustitución completada",
      successDescription: (serie: string, folio: number) =>
        `Factura ${serie}-${folio} timbrada. La factura original se canceló con motivo 01.`,
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
      pdf: "PDF",
      pdfGenerating: "Generando...",
      xml: "XML",
      pdfTitle: "Abrir representación impresa del CFDI",
      xmlTitle: "Descargar XML del comprobante timbrado",
      repXml: "XML REP",
      repXmlTitle: "Descargar XML del complemento REP timbrado",
      repPdf: "PDF REP",
      repPdfTitle: "Abrir representación impresa del complemento REP",
      repUuidCopyLabel: "Copiar UUID del REP",
      uuidLabel: "UUID",
      uuidCopyLabel: "Copiar UUID",
      receiverSubtitle: (name: string, rfc: string) => `${name} · ${rfc}`,
    },
  },
  concepts: {
    sectionDescription:
      "Arma el CFDI con una partida de flete (tarifa del viaje) y las partidas de servicio que apliquen. Puedes agregar varias.",
    introTitle: "Partidas de cobro",
    introDescription:
      "El flete refleja la tarifa del viaje. Agrega servicios adicionales (maniobras, resguardo, etc.) desde tu catálogo o captura manual.",
    fleteHint: "Partida principal vinculada a la tarifa base del viaje.",
    serviceHint: "Partida adicional de servicio. Puedes reutilizar un concepto del catálogo.",
    fleteRowTitle: "Flete",
    serviceRowTitle: (number: number) => `Servicio ${number}`,
    partidasSummary: (count: number, subtotal: string) =>
      `${count} partida${count === 1 ? "" : "s"} · Subtotal partidas: ${subtotal}`,
    addService: "Agregar partida de servicio",
    removeService: "Quitar partida",
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
      emptyDescription: "Agrega partidas de servicio además del flete del viaje.",
    },
    sheet: {
      createTitle: "Nueva partida de servicio",
      editFleteTitle: "Editar flete",
      editServiceTitle: (number: number) => `Editar servicio ${number}`,
      apply: "Aplicar partida",
      close: "Cerrar",
      validationSummary: "Revisa los datos de la partida",
      taxesHeading: "Impuestos de la partida",
      taxesHint: "Define si esta partida lleva IVA y/o retención.",
      ivaAplica: "Aplica IVA",
      retencionAplica: "Aplica retención",
    },
  },
  amountsPanel: {
    title: "Importes",
    totalLabel: "Total CFDI",
    hint: "IVA y retención se calculan por partida según la configuración de cada concepto.",
    ivaPerConceptHint: "según partidas",
    retentionPerConceptHint: "por partida",
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
