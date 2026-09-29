import type { DispatchRunStatus } from "../../domain/billingDispatchRun.types";

export const dispatchRunsCopy = {
  workbench: {
    title: "Envío de facturas",
    description:
      "Mandar por correo las facturas ya emitidas. Puedes mandar ahora o armar el lote del periodo.",
    bucketsAriaLabel: "Etapas del envío de facturas",
    armPeriodCta: "Armar envío del periodo",
    buckets: {
      pending: "Pendientes",
      sent: "Enviadas",
      period: "Por periodo",
    },
    bucketDescriptions: {
      pending: "Facturas por mandar o reenviar",
      sent: "Ya se mandaron por correo",
      period: "Lotes agrupados · un correo por cliente",
    },
    periodLinkAria: "Ver envíos del periodo",
    pending: {
      searchPlaceholder: "Buscar por folio o cliente…",
      entityLabelPlural: "facturas",
      loadError: "Error al cargar las facturas pendientes de envío",
      selectAllAria: "Seleccionar todas las facturas de esta página",
      selectInvoice: (folio: string) => `Seleccionar factura ${folio}`,
      columns: {
        invoice: "Factura",
        client: "Cliente",
        issuedAt: "Fecha",
        total: "Total",
        trips: "Viajes",
        note: "Nota",
      },
      badges: {
        autoFail: "Envío auto falló",
        autoCutoff: "Automático al corte",
      },
      selectedHint: "Puedes seleccionar facturas de distintos clientes.",
      sendCta: (count: number) =>
        count === 1 ? "Enviar 1 factura" : `Enviar ${count} facturas`,
      empty: {
        title: "Todas las facturas ya emitidas ya fueron enviadas",
        description:
          "No hay facturas pendientes de envío por correo. Revisa las enviadas o Por periodo.",
        ctaSent: "Ver facturas enviadas",
        noResultsTitle: "Sin resultados",
        withFilters:
          "No hay pendientes con la búsqueda actual. Prueba otro folio o cliente.",
        clearFilters: "Limpiar búsqueda",
      },
    },
    /** Cola Enviadas del workbench (F4). */
    sent: {
      searchPlaceholder: "Buscar por folio o cliente…",
      entityLabelPlural: "facturas",
      loadError: "Error al cargar las facturas enviadas",
      selectAllAria: "Seleccionar todas las facturas de esta página",
      selectInvoice: (folio: string) => `Seleccionar factura ${folio}`,
      rowActionsAria: (folio: string) => `Acciones de factura ${folio}`,
      columns: {
        invoice: "Factura",
        client: "Cliente",
        issuedAt: "Fecha emisión",
        sentAt: "Enviada el",
        total: "Total",
        origin: "Origen",
        trips: "Viajes",
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
      selectedHint: "Puedes seleccionar facturas de distintos clientes.",
      resendCta: (count: number) =>
        count === 1 ? "Reenviar 1 factura" : `Reenviar ${count} facturas`,
      empty: {
        title: "Aún no hay facturas enviadas por correo",
        description:
          "Cuando mandes facturas ya emitidas desde Pendientes, aparecerán aquí para consultar o reenviar.",
        ctaPending: "Ir a pendientes",
        noResultsTitle: "Sin resultados",
        withFilters:
          "No hay enviadas con los filtros actuales. Prueba otra búsqueda o periodo.",
        clearFilters: "Limpiar filtros",
      },
    },
    /** Sheet de confirmación multi-cliente (F3 → F4′ async + link). */
    confirmSheet: {
      title: "Confirmar envío",
      titleResend: "Confirmar reenvío",
      description:
        "Se enviará un correo por cliente con la lista de facturas y un enlace para descargar PDF y XML en un ZIP. No se regeneran los archivos. El envío se procesa en segundo plano.",
      resendWarning:
        "Estas facturas ya se enviaron antes. Reenviar puede duplicar el correo en la bandeja del cliente y genera un enlace nuevo. No se regenera el PDF ni el XML.",
      /** P12 — hint único (sin umbral >4). */
      linkHint:
        "Los archivos se descargan desde el correo (enlace), no van adjuntos.",
      summary: (invoiceCount: number, clientCount: number) => {
        const facturas =
          invoiceCount === 1
            ? "1 factura"
            : `${invoiceCount} facturas`;
        const clientes =
          clientCount === 1 ? "1 cliente" : `${clientCount} clientes`;
        return `${facturas} · ${clientes}`;
      },
      groupTotal: (amountLabel: string) => `Total ${amountLabel}`,
      groupFolioCount: (n: number) =>
        n === 1 ? "1 factura" : `${n} facturas`,
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
        "No hay facturas listas para enviar. Agrega destinatarios o marca al menos un correo por cliente.",
      resultTitle: "Resultado",
      resultOk: "Preparado",
      resultFail: "Error",
      resultSkipped: "Omitido",
      /** P13 — ack inmediato; no afirmar «enviadas». */
      toastQueued: (invoiceCount: number, clientCount: number) => {
        const facturas =
          invoiceCount === 1
            ? "1 factura"
            : `${invoiceCount} facturas`;
        const clientes =
          clientCount === 1 ? "1 cliente" : `${clientCount} clientes`;
        return `Correo preparado · ${facturas} · ${clientes}`;
      },
      toastQueuedResend: (invoiceCount: number, clientCount: number) => {
        const facturas =
          invoiceCount === 1
            ? "1 factura"
            : `${invoiceCount} facturas`;
        const clientes =
          clientCount === 1 ? "1 cliente" : `${clientCount} clientes`;
        return `Reenvío preparado · ${facturas} · ${clientes}`;
      },
      toastPartial: (okClients: number, failClients: number) =>
        `Parcial: ${okClients} cliente${okClients === 1 ? "" : "s"} preparados, ${failClients} con error. Revisa el detalle.`,
      toastAllFailed: "No se pudo preparar el envío a ningún cliente",
    },
  },
  tab: {
    title: "Envíos del periodo",
    subtitle:
      "Revisa el lote, confirma y manda un correo por cliente. No genera facturas nuevas.",
    executeCta: "Armar envío del periodo",
    backToWorkbench: "Volver a envíos",
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
          label: "Crea una frecuencia aquí.",
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
        "Se arma el último corte ya cerrado de esa frecuencia. No es el periodo en curso y las fechas no se eligen a mano.",
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
  itemStatus: {
    listed: "En lista",
    skipped: "Omitido",
    queued: "En cola",
    sent: "Enviado",
    failed: "Fallido",
  },
  detail: {
    titleFallback: "Envío del periodo",
    titleCalendar: (inclusiveStart: string, inclusiveEnd: string) =>
      `Envío ${inclusiveStart}–${inclusiveEnd}`,
    titleEvent: (hours: number) => `Envío de las últimas ${hours} h`,
    subtitleClosedCut: (schemeName: string) =>
      `Último corte cerrado · ${schemeName}`,
    periodCalendar: (
      inclusiveStart: string,
      inclusiveEnd: string,
      cutDate: string,
    ) =>
      `Viajes que cerraron del ${inclusiveStart} al ${inclusiveEnd}. El ${cutDate} es el día del corte y no entra.`,
    periodEvent: (hours: number) =>
      `Viajes que cerraron en las últimas ${hours} horas, hasta ahora.`,
    datesFixedNote: "Las fechas las fija la frecuencia; no se pueden cambiar.",
    schemeTypeLabel: (name: string) => `Frecuencia de envío: ${name}`,
    originScheduled: "Automático",
    originManual: "Manual",
    refreshPreview: "Actualizar lista",
    cancelRun: "Cancelar envío",
    sendCta: "Enviar facturas",
    resendCta: "Reenviar seleccionadas",
    moreActions: "Más",
    backToList: "Volver a envíos del periodo",
    backToWorkbench: "Volver a envíos",
    backToInvoice: "Volver a la factura",
    decisionSummary: (
      readyCount: number,
      clientCount: number,
      pendingCount: number,
    ) => {
      const facturas =
        readyCount === 1 ? "1 factura lista" : `${readyCount} facturas listas`;
      const clientes =
        clientCount === 1 ? "1 cliente" : `${clientCount} clientes`;
      const pendientes =
        pendingCount === 1
          ? "1 pendiente por generar"
          : `${pendingCount} pendientes por generar`;
      return `${facturas} para ${clientes} · ${pendientes}`;
    },
    linkHint:
      "Los archivos se descargan desde el correo (enlace), no van adjuntos.",
    zipTooLargeError:
      "El paquete de facturas excede el tamaño de correo. Reenvía en lotes menores o envía facturas individuales.",
    sendingBanner: "Envío en curso. Esta pantalla se actualiza sola.",
    counts: {
      pendingStamp: "Faltan por generar",
      readyToSend: "Listas para enviar",
      alreadySent: "Ya enviadas",
    },
    skippedNote: (count: number) =>
      count === 1
        ? "1 factura ya enviada en envíos anteriores (omitida de este envío)."
        : `${count} facturas ya enviadas en envíos anteriores (omitidas de este envío).`,
    alreadySent: {
      title: "Ya enviadas",
      description:
        "Facturas de este periodo que ya se enviaron antes. Quedan fuera del envío normal; puedes reenviar el correo si lo necesitas.",
      selectAll: "Seleccionar todas",
      clearSelection: "Quitar selección",
      selectClient: "Seleccionar del cliente",
      emptyBucket: "Ninguna factura ya enviada en este periodo.",
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
      readyTitle: "Listas para enviar",
      emptyBucket: "Ninguno en este periodo.",
      stampCta: "Generar factura",
      tripFallback: "Viaje",
      invoiceLabel: (number: string) => `Factura ${number}`,
      invoiceFallback: "Sin número de factura",
      clientFallback: (shortId: string) => `Cliente ${shortId}`,
      clientGroup: (name: string, count: number) =>
        `${name} (${count} factura${count === 1 ? "" : "s"})`,
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
      title: "Destinatarios del correo",
      empty:
        "Sin destinatarios. Agrega correo de facturación o contactos que reciban facturas en el cliente.",
      zeroSelected:
        "Marca al menos un destinatario por cliente antes de enviar.",
      sentTitle: "Enviado a",
      failedTitle: "No se pudo enviar a",
      receiptEmpty: "Sin snapshot de destinatarios.",
    },
    confirm: {
      title: "¿Enviar facturas por correo?",
      emailNote:
        "Se enviará un correo por cliente con la lista de facturas y un enlace para descargar PDF y XML en un ZIP. No se regeneran los archivos.",
      summaryClients: (n: number) =>
        n === 1 ? "1 cliente" : `${n} clientes`,
      summaryInvoices: (n: number) =>
        n === 1 ? "1 factura" : `${n} facturas`,
      summaryRecipients: (n: number) =>
        n === 1 ? "1 destinatario" : `${n} destinatarios`,
      recipientsNote:
        "Revisa y ajusta los destinatarios en la lista antes de confirmar. Los cambios solo aplican a este envío.",
      pendingWarningTitle: "Faltan por generar",
      pendingWarning:
        "Hay facturas pendientes por generar que no se incluirán en este envío. Puedes confirmar igualmente o generarlas y actualizar la lista.",
      submit: "Confirmar y enviar",
      cancel: "Cancelar",
      noReady:
        "No hay facturas listas para enviar. Genera al menos una o actualiza la lista.",
      recipientsRequired:
        "Hay clientes sin destinatarios. Marca al menos un correo por cliente o corrige el maestro del cliente.",
      recipientKeyInvalid:
        "Algún destinatario ya no es válido. Actualiza la lista e inténtalo de nuevo.",
    },
    resendConfirm: {
      title: "¿Reenviar facturas ya enviadas?",
      riskNote:
        "No se regeneran el PDF ni el XML. Solo se reenvía el correo con los archivos ya generados. Por defecto estas facturas se omiten del envío normal.",
      emailNote:
        "Se reenviará un correo por cliente solo con las facturas que marcaste y un enlace nuevo para descargar PDF y XML en un ZIP. No se regeneran los archivos.",
      summaryClients: (n: number) =>
        n === 1 ? "1 cliente" : `${n} clientes`,
      summaryInvoices: (n: number) =>
        n === 1 ? "1 factura" : `${n} facturas`,
      summaryRecipients: (n: number) =>
        n === 1 ? "1 destinatario" : `${n} destinatarios`,
      recipientsNote:
        "Se usan los destinatarios marcados en la lista (solo clientes del reenvío). Los cambios solo aplican a este envío.",
      submit: "Confirmar reenvío",
      cancel: "Cancelar",
      zeroSelected:
        "Marca al menos un destinatario por cliente del reenvío antes de confirmar.",
      forceResendInvalid:
        "Alguna factura ya no se puede reenviar en este envío. Actualiza la lista e inténtalo de nuevo.",
      cooldown:
        "Espera unos segundos antes de reenviar estas facturas.",
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
        "Resumen de a quién se envió el correo y qué facturas se incluyeron.",
      colClient: "Cliente",
      colRecipients: "Destinatarios",
      colFolios: "Facturas",
      colStatus: "Estado",
      statusSent: "Enviado",
      statusFailed: "Fallido",
      statusMixed: "Parcial",
      folioCount: (n: number) =>
        n === 1 ? "1 factura" : `${n} facturas`,
      recipientCount: (n: number) =>
        n === 1 ? "1 destinatario" : `${n} destinatarios`,
      expandFolios: "Ver facturas",
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
