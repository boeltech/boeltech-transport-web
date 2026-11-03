import type { DispatchRunStatus } from "../../domain/billingDispatchRun.types";

export const dispatchRunsCopy = {
  workbench: {
    title: "Envíos",
    description:
      "Mandar por correo facturas y comprobantes de pago (REP) ya emitidos. Puedes mandar ahora o armar el lote del periodo.",
    bucketsAriaLabel: "Etapas de envíos",
    armPeriodCta: "Armar envío del periodo",
    buckets: {
      pending: "Pendientes",
      sent: "Enviadas",
      period: "Por periodo",
    },
    bucketDescriptions: {
      pending: "Documentos por mandar o reenviar",
      sent: "Ya se mandaron por correo",
      period:
        "Envíos armados o enviados del corte (facturas y comprobantes de pago REP)",
    },
    periodLinkAria: "Ver envíos del periodo",
    relatedConfig: {
      label: "Ver registro de facturas",
      description: "Listado completo de facturas emitidas.",
    },
    /** Etiquetas tipadas de fila / sheet (F0: anti-redundancia REP). */
    documentLabels: {
      invoice: (folio: string) => folio,
      invoiceFallback: "Factura",
      /** Documento = seudofolio API; sin prefijo largo. */
      rep: (folio: string) => folio,
      repFallback: "REP",
      typeInvoice: "Factura",
      typeRep: "REP",
      /** Aria / tooltip del badge Tipo (explicación larga). */
      typeRepLong: "Comprobante de pago (REP)",
    },
    typeFilter: {
      showFilters: "Filtros",
      label: "Tipo",
      all: "Todos",
      invoice: "Facturas",
      rep: "REPs",
      chip: (label: string) => `Tipo: ${label}`,
      ariaLabel: "Filtrar por tipo de documento",
    },
    pending: {
      searchPlaceholder: "Buscar por folio o cliente…",
      entityLabelPlural: "documentos",
      loadErrorTitle: "No se pudo cargar la cola",
      loadError: "Error al cargar los documentos pendientes de envío",
      retry: "Reintentar",
      selectAllAria: "Seleccionar todos los documentos de esta página",
      selectDocument: (label: string) => `Seleccionar ${label}`,
      columns: {
        document: "Documento",
        client: "Cliente",
        issuedAt: "Fecha",
        total: "Total",
        type: "Tipo",
      },
      selectedHint:
        "Puedes seleccionar facturas y comprobantes de pago de distintos clientes.",
      sendCta: (count: number) =>
        count === 1 ? "Enviar 1 documento" : `Enviar ${count} documentos`,
      empty: {
        title: "Todos los documentos listos ya fueron enviados",
        description:
          "No hay facturas ni comprobantes de pago pendientes de envío por correo. Revisa las enviadas o Por periodo.",
        ctaSent: "Ver enviadas",
        noResultsTitle: "Sin resultados",
        withFilters:
          "No hay pendientes con los filtros actuales. Prueba otro folio, cliente o tipo.",
        clearFilters: "Limpiar filtros",
      },
    },
    /** Cola Enviadas del workbench. */
    sent: {
      searchPlaceholder: "Buscar por folio o cliente…",
      entityLabelPlural: "documentos",
      loadErrorTitle: "No se pudo cargar la cola",
      loadError: "Error al cargar los documentos enviados",
      retry: "Reintentar",
      selectAllAria: "Seleccionar todos los documentos de esta página",
      selectDocument: (label: string) => `Seleccionar ${label}`,
      rowActionsAria: (label: string) => `Acciones de ${label}`,
      columns: {
        document: "Documento",
        client: "Cliente",
        issuedAt: "Fecha emisión",
        sentAt: "Enviado el",
        total: "Total",
        type: "Tipo",
        actions: "Acciones",
      },
      actions: {
        resend: "Reenviar",
        view: "Ver factura",
      },
      filters: {
        dateRangeHeading: "Periodo de emisión",
        dateRangePlaceholder: "Filtrar por fecha de emisión",
        chipFrom: (value: string) => `Desde: ${value}`,
        chipTo: (value: string) => `Hasta: ${value}`,
      },
      selectedHint:
        "Puedes seleccionar facturas y comprobantes de pago de distintos clientes.",
      resendCta: (count: number) =>
        count === 1 ? "Reenviar 1 documento" : `Reenviar ${count} documentos`,
      empty: {
        title: "Aún no hay documentos enviados por correo",
        description:
          "Cuando mandes facturas o comprobantes de pago desde Pendientes, aparecerán aquí para consultar o reenviar.",
        ctaPending: "Ir a pendientes",
        noResultsTitle: "Sin resultados",
        withFilters:
          "No hay enviadas con los filtros actuales. Prueba otra búsqueda, periodo o tipo.",
        clearFilters: "Limpiar filtros",
      },
    },
    /** Sheet de confirmación multi-cliente (mixto factura + REP). */
    confirmSheet: {
      title: "Confirmar envío",
      titleResend: "Confirmar reenvío",
      description:
        "Se enviará un correo por cliente con la lista de facturas y comprobantes de pago (REP), y un enlace para descargar PDF y XML en un ZIP. No se regeneran los archivos. El envío se procesa en segundo plano.",
      resendWarning:
        "Estos documentos ya se enviaron antes. Reenviar puede duplicar el correo en la bandeja del cliente y genera un enlace nuevo. No se regenera el PDF ni el XML.",
      /** P12 — hint único (sin umbral >4). */
      linkHint:
        "Los archivos se descargan desde el correo (enlace), no van adjuntos.",
      summary: (documentCount: number, clientCount: number) => {
        const docs =
          documentCount === 1
            ? "1 documento"
            : `${documentCount} documentos`;
        const clientes =
          clientCount === 1 ? "1 cliente" : `${clientCount} clientes`;
        return `${docs} · ${clientes}`;
      },
      groupTotal: (amountLabel: string) => `Total ${amountLabel}`,
      groupFolioCount: (n: number) =>
        n === 1 ? "1 documento" : `${n} documentos`,
      recipientsHeading: "Destinatarios",
      recipientsHint:
        "Correo de facturación y contactos que reciben facturas. Puedes desmarcar alguno para este envío.",
      recipientsSelected: (selected: number) =>
        selected === 1
          ? "1 destinatario seleccionado"
          : `${selected} destinatarios seleccionados`,
      zeroSelected: "Marca al menos un destinatario para enviar este cliente.",
      noRecipientsTitle: "Sin destinatarios",
      noRecipients:
        "Este cliente no tiene correo de facturación ni contactos que reciban facturas. Los demás clientes sí se pueden enviar.",
      clientLink: "Ir a la ficha del cliente",
      loadingRecipients: "Cargando destinatarios…",
      loadRecipientsError: "No se pudieron cargar los destinatarios.",
      retryRecipients: "Reintentar",
      clientFallback: (shortId: string) => `Cliente ${shortId}`,
      rfcOnlyLabel: "Sin cliente vinculado",
      progress: (current: number, total: number) =>
        total <= 1
          ? "Preparando el correo…"
          : `Preparando el correo ${current} de ${total}…`,
      confirm: "Confirmar envío",
      confirmResend: "Confirmar reenvío",
      cancel: "Cancelar",
      close: "Cerrar",
      submitting: "Preparando…",
      nothingSendable:
        "No hay documentos listos para enviar. Agrega destinatarios o marca al menos un correo por cliente.",
      resultTitle: "Resultado",
      resultOk: "Preparado",
      resultFail: "Error",
      resultSkipped: "Omitido",
      /** P13 — ack inmediato; no afirmar «enviadas». */
      toastQueued: (documentCount: number, clientCount: number) => {
        const docs =
          documentCount === 1
            ? "1 documento"
            : `${documentCount} documentos`;
        const clientes =
          clientCount === 1 ? "1 cliente" : `${clientCount} clientes`;
        return `Correo preparado · ${docs} · ${clientes}`;
      },
      toastQueuedResend: (documentCount: number, clientCount: number) => {
        const docs =
          documentCount === 1
            ? "1 documento"
            : `${documentCount} documentos`;
        const clientes =
          clientCount === 1 ? "1 cliente" : `${clientCount} clientes`;
        return `Reenvío preparado · ${docs} · ${clientes}`;
      },
      toastPartial: (okClients: number, failClients: number) =>
        `Parcial: ${okClients} cliente${okClients === 1 ? "" : "s"} preparados, ${failClients} con error. Revisa el detalle.`,
      toastAllFailed: "No se pudo preparar el envío a ningún cliente",
    },
  },
  tab: {
    title: "Envíos del periodo",
    subtitle:
      "Revisa el lote, confirma y manda un correo por cliente con facturas y comprobantes de pago (REP) del periodo. No genera documentos nuevos. Si el automático no encontró listos, arma el envío cuando ya haya documentos listos.",
    executeCta: "Armar envío del periodo",
    backToWorkbench: "Volver a envíos",
    /** Atajo page-local (no ListPageShell.relatedConfig) → Configuración. */
    relatedConfig: {
      label: "Frecuencias de envío",
      description:
        "Define cada cuánto se agrupa el correo a cada cliente.",
      href: "/settings/billing-schemes",
    },
    entityLabelPlural: "envíos",
    loadError: "Error al cargar los envíos del periodo",
    filters: {
      showFilters: "Filtros",
      statusLabel: "Estado",
      statusAll: "Todos",
      schemeLabel: "Frecuencia de envío",
      schemeAll: "Todas",
      statusPlaceholder: "Estado",
      schemePlaceholder: "Frecuencia de envío",
      all: "Todos",
      chipStatus: (label: string) => `Estado: ${label}`,
      chipScheme: (name: string) => `Frecuencia: ${name}`,
      /** Default on: oculta scheduled+cancelled (evaluación sin envío). */
      hideEmptyScheduledOn: "Ocultar evaluaciones sin envío",
      hideEmptyScheduledOff: "Incluir evaluaciones sin envío",
      hideEmptyScheduledAria: "Ocultar evaluaciones automáticas sin envío",
    },
    empty: {
      title: "Aún no hay envíos del periodo",
      description:
        "Primero define cada cuánto y asígnalo en los clientes.",
      recorteTitle: "Ningún envío con estos filtros",
      withFilters:
        "No hay envíos con los filtros actuales. Prueba otro estado o frecuencia de envío.",
      clearFilters: "Limpiar filtros",
      onboardingTitle: "Antes del primer envío",
      onboardingSteps: [
        {
          label: "Crea una frecuencia de envío.",
          href: "/settings/billing-schemes",
          linkLabel: "Crear frecuencias",
        },
        {
          label: "En cada cliente, elige cada cuánto y revisa el correo.",
          href: "/clients",
          linkLabel: "Ir a clientes",
        },
        {
          label:
            "Arma el envío del periodo (o activa que se mande solo).",
        },
      ] as const,
    },
    table: {
      period: "Periodo",
      scheme: "Frecuencia de envío",
      origin: "Origen",
      status: "Estado",
      createdAt: "Creada",
      actions: "Acciones",
      periodCalendar: (inclusiveStart: string, cutDate: string) =>
        `${inclusiveStart} — corte ${cutDate}`,
      periodEvent: (hours: number) => `Últimas ${hours} h`,
    },
    actions: {
      open: "Abrir",
      cancel: "Cancelar envío",
      menuAria: (periodLabel: string) => `Acciones del envío ${periodLabel}`,
    },
    cancelDialog: {
      title: "¿Cancelar este envío?",
      body: "El lote queda cancelado y deja de usarse. No se borra. Después puedes armar otro del mismo corte.",
      keepReviewing: "Seguir revisando",
      confirm: "Cancelar envío",
    },
    origin: {
      manual: "Manual",
      scheduled: "Automático",
    },
    createDialog: {
      title: "Armar envío del periodo",
      description:
        "Se arma el último corte ya cerrado de esa frecuencia. No es el periodo en curso y las fechas no se eligen a mano. Tras una evaluación automática sin listos, este es el camino si generaste las facturas después. En semanal, el siguiente viernes no rescata el periodo previo.",
      schemeLabel: "Frecuencia de envío",
      schemeHint:
        "Semanal, cortes del mes o mensual. El lote usa el corte que ya cerró, no el que está corriendo.",
      schemeSummaryLabel: "Resumen de la frecuencia",
      previewTitle: "Qué entra en este lote",
      previewEmpty: "Elige una frecuencia para ver qué días entran.",
      previewLoading: "Calculando el último corte cerrado…",
      previewError: "No se pudo calcular el corte.",
      previewRetry: "Reintentar",
      submit: "Armar lista",
      cancel: "Cancelar",
      noSchemes: "No hay frecuencias de envío activas.",
      settingsLink: "Crea una en Envíos del periodo",
      alreadyOpen: {
        title: "Ya hay un lote de este corte",
        bodyOnList:
          "Este corte ya tiene un envío Lista para revisar. No se armó otro. Ábrelo en la lista de esta pantalla.",
        bodyFromWorkbench:
          "Este corte ya tiene un envío Lista para revisar. No se armó otro. Entra a Por periodo y ábrelo en la lista.",
        dismiss: "Entendido",
      },
    },
  },
  status: {
    draft: "Borrador",
    previewed: "Lista para revisar",
    send_confirmed: "En proceso de envío",
    sending: "Enviando",
    completed: "Completada",
    failed: "Envío con errores",
    cancelled: "Cancelada",
  } satisfies Record<DispatchRunStatus, string>,
  /** Presentación: origin=scheduled + status=cancelled (sin status API nuevo). */
  emptyScheduled: {
    label: "Sin documentos listos",
    tooltip:
      "Evaluación automática: no había facturas ni comprobantes de pago listos al corte",
  },
  itemStatus: {
    listed: "En lista",
    skipped: "Omitido",
    queued: "En cola",
    sent: "Enviado",
    failed: "Fallido",
  },
  detail: {
    titleFallback: "Lista del periodo",
    titleCalendar: (inclusiveStart: string, inclusiveEnd: string) =>
      `Lista del periodo · ${inclusiveStart}–${inclusiveEnd}`,
    titleEvent: (hours: number) => `Lista del periodo · últimas ${hours} h`,
    pageSubtitle:
      "Revisa lo listo y manda un correo por cliente con las secciones Facturas y/o Comprobantes de pago que correspondan a este corte.",
    subtitleClosedCut: (schemeName: string) =>
      `Último corte cerrado · ${schemeName}`,
    loadErrorTitle: "No se pudo cargar la lista del periodo",
    loadError: "Intenta de nuevo. Si persiste, vuelve a Correo del periodo.",
    retry: "Reintentar",
    i1Banner:
      "Esto solo manda por correo lo ya timbrado. No factura ni cobra.",
    emptyScheduledAlert: {
      title: "No se mandó nada en el corte automático",
      body: "No había facturas ni comprobantes de pago listos al corte. Si generas documentos después el mismo día, arma la lista del periodo. En corte semanal, el siguiente corte no incluye este periodo.",
      cta: "Armar lista del periodo",
    },
    periodCalendar: (
      inclusiveStart: string,
      inclusiveEnd: string,
      cutDate: string,
    ) =>
      `Viajes que cerraron del ${inclusiveStart} al ${inclusiveEnd}. El ${cutDate} es el día del corte y no entra.`,
    periodEvent: (hours: number) =>
      `Viajes que cerraron en las últimas ${hours} horas, hasta ahora.`,
    periodShortCalendar: (inclusiveStart: string, inclusiveEnd: string) =>
      `${inclusiveStart} – ${inclusiveEnd}`,
    periodShortEvent: (hours: number) => `Últimas ${hours} h`,
    datesFixedNote: "Las fechas las fija la frecuencia; no se pueden cambiar.",
    schemeTypeLabel: (name: string) => `Frecuencia de envío: ${name}`,
    originScheduled: "Sin confirmar (automático)",
    originManual: "Con confirmar",
    refreshPreview: "Actualizar lista",
    cancelRun: "Cancelar envío",
    sendCta: "Mandar el correo del periodo",
    resendCta: "Reenviar seleccionados",
    moreActions: "Más",
    backToList: "Volver a Correo del periodo",
    backToWorkbench: "Volver a envíos",
    backToInvoice: "Volver a la factura",
    cutBar: {
      ariaLabel: "Contexto del corte",
      periodLabel: "Periodo",
      frequencyLabel: "Frecuencia de envío",
      countsAria: "Conteos tipados",
      pendingNote: (count: number) =>
        count === 1
          ? "Falta 1 por generar: no se incluye en este correo."
          : `Faltan ${count} por generar: no se incluyen en este correo.`,
    },
    decisionSummary: (
      invoiceCount: number,
      repCount: number,
      clientCount: number,
      pendingCount: number,
    ) => {
      const parts: string[] = [];
      if (invoiceCount > 0) {
        parts.push(
          invoiceCount === 1
            ? "1 factura lista"
            : `${invoiceCount} facturas listas`,
        );
      }
      if (repCount > 0) {
        parts.push(
          repCount === 1
            ? "1 comprobante de pago listo"
            : `${repCount} comprobantes de pago listos`,
        );
      }
      if (parts.length === 0) {
        parts.push("Nada listo");
      }
      const clientes =
        clientCount === 1 ? "1 cliente" : `${clientCount} clientes`;
      const pendientes =
        pendingCount === 1
          ? "1 pendiente por generar"
          : `${pendingCount} pendientes por generar`;
      return `${parts.join(" · ")} para ${clientes} · ${pendientes}`;
    },
    onlyRepsInBatch: "Solo comprobantes de pago en esta lista.",
    linkHint:
      "Los archivos se descargan desde el correo (enlace), no van adjuntos.",
    zipTooLargeError:
      "El paquete excede el tamaño de correo. Reenvía en lotes menores o envía documentos individuales.",
    sendingBanner: "Envío en curso. Esta pantalla se actualiza sola.",
    footNote:
      "Destinatarios de este envío se confirman al mandar (lista efímera). Un correo por cliente; no borra contactos del maestro.",
    counts: {
      pendingStamp: "Faltan",
      readyToSend: "Listos",
      readyInvoices: "Facturas",
      readyReps: "Comprobantes",
      alreadySent: "Ya enviados",
      readyBadge: "Listos",
    },
    skippedNote: (count: number) =>
      count === 1
        ? "1 documento ya enviado antes (omitido de este correo)."
        : `${count} documentos ya enviados antes (omitidos de este correo).`,
    alreadySent: {
      title: "Ya enviados en este periodo",
      description:
        "No compite con Mandar. Solo reenvía lo ya despachado.",
      collapsedHint: (count: number) =>
        count === 1 ? "· 1 documento" : `· ${count} documentos`,
      expand: "Ver ya enviados",
      collapse: "Ocultar ya enviados",
      selectAll: "Seleccionar todos",
      clearSelection: "Quitar selección",
      selectClient: "Seleccionar del cliente",
      emptyBucket: "Ningún documento ya enviado en este periodo.",
      emptyInvoices: "Ninguna factura ya enviada en este periodo.",
      emptyReps:
        "No hay comprobantes de pago timbrados en este periodo ya enviados.",
    },
    sections: {
      invoices: "Facturas",
      invoicesAnchor: "Viajes que ya cerraron en este periodo",
      reps: "Comprobantes de pago",
      repsAnchor: "Comprobantes timbrados en este periodo",
      /** @deprecated usar repsAnchor — se conserva por tests legacy de hint. */
      repsPeriodHint: "Comprobantes timbrados en este periodo",
      emptyReadyInvoices: "Ninguna factura lista en este periodo.",
      emptyReadyReps:
        "No hay comprobantes de pago timbrados en este periodo.",
      emptyReadyRepsHint:
        "Si faltan, revisa Cobros / pagos timbrados del cliente.",
    },
    buckets: {
      pendingTitle: "Faltan por generar",
      pendingNote:
        "No se incluyen en este correo. Genera la factura y actualiza la lista.",
      pendingCollapsedSummary: (count: number) =>
        count === 1
          ? "1 pendiente por generar (no va en este correo)"
          : `${count} pendientes por generar (no van en este correo)`,
      expandPending: "Ver pendientes",
      collapsePending: "Ocultar pendientes",
      readyTitle: "Listos para enviar",
      emptyBucket: "Ninguno en este periodo.",
      stampCta: "Generar factura",
      tripFallback: "Viaje",
      invoiceLabel: (number: string) => `Factura ${number}`,
      invoiceFallback: "Sin número de factura",
      repLabel: (folio: string) => `Comprobante de pago · ${folio}`,
      repFallback: "Comprobante de pago",
      clientFallback: (shortId: string) => `Cliente ${shortId}`,
      clientGroup: (name: string, count: number) =>
        `${name} (${count} documento${count === 1 ? "" : "s"})`,
      clientGroupPending: (name: string, count: number) =>
        `${name} (${count} pendiente${count === 1 ? "" : "s"})`,
      recipientsSelected: (selected: number, total: number) =>
        `${selected} de ${total} destinatario${total === 1 ? "" : "s"}`,
      showMoreFolios: (n: number) =>
        n === 1 ? "Ver 1 más" : `Ver las ${n} restantes`,
      showFewerFolios: "Ver menos",
      zeroRecipientsBadge: "Sin destinatarios",
    },
    recipients: {
      title: "Destinatarios de este envío",
      empty:
        "Sin destinatarios. Agrega correo de facturación o contactos que reciban facturas en el cliente.",
      zeroSelected:
        "Marca al menos un destinatario por cliente antes de mandar.",
      hint:
        "Correo de facturación y contactos que reciben facturas. Los cambios solo aplican a este envío; no borra contactos del maestro.",
      sentTitle: "Enviado a",
      failedTitle: "No se pudo enviar a",
      receiptEmpty: "Sin snapshot de destinatarios.",
    },
    confirm: {
      title: "¿Mandar el correo del periodo?",
      emailNote:
        "Se enviará un correo por cliente con Facturas y/o Comprobantes de pago, y un enlace para descargar PDF y XML en un ZIP. No se regeneran los archivos.",
      summaryClients: (n: number) =>
        n === 1 ? "1 cliente" : `${n} clientes`,
      summaryInvoices: (n: number) =>
        n === 1 ? "1 factura" : `${n} facturas`,
      summaryReps: (n: number) =>
        n === 1
          ? "1 comprobante de pago"
          : `${n} comprobantes de pago`,
      summaryRecipients: (n: number) =>
        n === 1 ? "1 destinatario" : `${n} destinatarios`,
      recipientsNote:
        "Ajusta los destinatarios de este envío. No borra contactos del maestro.",
      pendingWarningTitle: "Faltan por generar",
      pendingWarning:
        "Hay facturas pendientes por generar que no se incluirán. Puedes mandar igualmente o generarlas y actualizar la lista.",
      submit: "Mandar el correo",
      cancel: "Cancelar",
      noReady:
        "No hay facturas ni comprobantes de pago listos. Genera al menos uno o actualiza la lista.",
      recipientsRequired:
        "Hay clientes sin destinatarios. Marca al menos un correo por cliente o corrige el maestro del cliente.",
      recipientKeyInvalid:
        "Algún destinatario ya no es válido. Actualiza la lista e inténtalo de nuevo.",
    },
    resendConfirm: {
      title: "¿Reenviar documentos ya enviados?",
      riskNote:
        "No se regeneran el PDF ni el XML. Solo se reenvía el correo con los archivos ya generados. Por defecto estos documentos se omiten del envío normal.",
      emailNote:
        "Se reenviará un correo por cliente solo con los documentos que marcaste y un enlace nuevo para descargar PDF y XML en un ZIP. No se regeneran los archivos.",
      summaryClients: (n: number) =>
        n === 1 ? "1 cliente" : `${n} clientes`,
      summaryInvoices: (n: number) =>
        n === 1 ? "1 factura" : `${n} facturas`,
      summaryReps: (n: number) =>
        n === 1
          ? "1 comprobante de pago"
          : `${n} comprobantes de pago`,
      summaryRecipients: (n: number) =>
        n === 1 ? "1 destinatario" : `${n} destinatarios`,
      recipientsNote:
        "Destinatarios de este envío (solo clientes del reenvío). No borra contactos del maestro.",
      submit: "Confirmar reenvío",
      cancel: "Cancelar",
      zeroSelected:
        "Marca al menos un destinatario por cliente del reenvío antes de confirmar.",
      forceResendInvalid:
        "Algún documento ya no se puede reenviar en este envío. Actualiza la lista e inténtalo de nuevo.",
      cooldown:
        "Espera unos segundos antes de reenviar estos documentos.",
    },
    result: {
      title: "Envío en curso",
      completed: "El envío terminó. Revisa el detalle por cliente.",
      completedWithErrors: (failedClients: number, totalClients: number) =>
        failedClients === 1
          ? `Completado con errores: 1 de ${totalClients} clientes no recibió el correo.`
          : `Completado con errores: ${failedClients} de ${totalClients} clientes no recibieron el correo.`,
      error: "El envío falló",
      itemError: "Error de envío",
      errorHint:
        "Revisa el resultado por cliente o arma un nuevo envío del periodo para reintentar.",
      byClientTitle: "Resultado por cliente",
      byClientDescription:
        "Resumen de a quién se envió el correo y qué documentos se incluyeron.",
      colClient: "Cliente",
      colRecipients: "Destinatarios",
      colFolios: "Documentos",
      colStatus: "Estado",
      statusSent: "Enviado",
      statusFailed: "Fallido",
      statusMixed: "Parcial",
      folioCount: (n: number) =>
        n === 1 ? "1 documento" : `${n} documentos`,
      recipientCount: (n: number) =>
        n === 1 ? "1 destinatario" : `${n} destinatarios`,
      expandFolios: "Ver documentos",
      noReceipts: "Sin detalle de destinatarios para este cliente.",
    },
  },
  toast: {
    runCreated: "Lista para revisar",
    previewUpdated: "Lista actualizada",
    sendConfirmed: "Envío confirmado",
    sendFailedTitle: "No se pudo enviar las facturas",
    cancelled: "Envío cancelado",
    error: "No se pudo completar la operación",
  },
} as const;
