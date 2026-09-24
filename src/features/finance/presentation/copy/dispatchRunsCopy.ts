import type { DispatchRunStatus } from "../../domain/billingDispatchRun.types";

export const dispatchRunsCopy = {
  workbench: {
    title: "Envío de facturas",
    description:
      "Envía, reenvía y supervisa las facturas timbradas que se entregan por correo.",
    bucketsAriaLabel: "Etapas del envío de facturas",
    buckets: {
      pending: "Pendientes",
      sent: "Enviadas",
      history: "Historial",
    },
    bucketDescriptions: {
      pending: "Cola de facturas por enviar o reenviar",
      sent: "Facturas ya entregadas por correo",
      history: "Corridas del periodo y envío automático",
    },
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
        title: "Todas las facturas timbradas ya fueron enviadas",
        description:
          "No hay facturas pendientes de envío por correo. Revisa las enviadas o el historial.",
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
          "Cuando envíes facturas timbradas desde Pendientes, aparecerán aquí para consultar o reenviar.",
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
        "Se enviará un correo por cliente con la lista de facturas y un enlace para descargar PDF y XML en un ZIP. No se retimbra ni se regeneran los archivos. El envío se procesa en segundo plano.",
      resendWarning:
        "Estas facturas ya se enviaron antes. Reenviar puede duplicar el correo en la bandeja del cliente y genera un enlace nuevo. No se regenera el PDF ni el XML y no se vuelve a timbrar.",
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
          ? "Encolando envío…"
          : `Encolando cliente ${current} de ${total}…`,
      confirm: "Confirmar envío",
      confirmResend: "Confirmar reenvío",
      cancel: "Cancelar",
      close: "Cerrar",
      submitting: "Encolando…",
      nothingSendable:
        "No hay facturas listas para enviar. Agrega destinatarios o marca al menos un correo por cliente.",
      resultTitle: "Resultado del encolado",
      resultOk: "Encolado",
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
        return `Envío encolado · ${facturas} · ${clientes}`;
      },
      toastQueuedResend: (invoiceCount: number, clientCount: number) => {
        const facturas =
          invoiceCount === 1
            ? "1 factura"
            : `${invoiceCount} facturas`;
        const clientes =
          clientCount === 1 ? "1 cliente" : `${clientCount} clientes`;
        return `Reenvío encolado · ${facturas} · ${clientes}`;
      },
      toastPartial: (okClients: number, failClients: number) =>
        `Encolado parcial: ${okClients} cliente${okClients === 1 ? "" : "s"} en cola, ${failClients} con error. Revisa el detalle.`,
      toastAllFailed: "No se pudo encolar el envío a ningún cliente",
    },
  },
  tab: {
    title: "Historial de envíos",
    subtitle:
      "Archivo de corridas: reintentos, fallos, envío automático y supervisión.",
    /** CTA hacia la cola de pendientes del workbench unificado. */
    sendWizardCta: "Ir a pendientes",
    sendWizardHref: "/finance/dispatch?tab=pending",
    /** Acción del archivo (digest por esquema / periodo) — solo en tab Historial. */
    executeCta: "Preparar envío del periodo",
    entityLabelPlural: "envíos",
    loadError: "Error al cargar el historial de envíos",
    filters: {
      statusPlaceholder: "Estado",
      schemePlaceholder: "Esquema de facturación",
      all: "Todos",
      chipStatus: (label: string) => `Estado: ${label}`,
      chipScheme: (name: string) => `Esquema: ${name}`,
    },
    empty: {
      title: "No hay envíos en el historial",
      description:
        "Aquí verás las corridas manuales y automáticas. El envío diario de facturas está en Pendientes; el periodo por esquema queda como opción secundaria.",
      settingsLink: "Configura los esquemas de facturación en Configuración",
      withFilters:
        "No hay envíos con los filtros actuales. Prueba otro estado o esquema de facturación.",
      clearFilters: "Limpiar filtros",
      onboardingTitle: "Antes del primer envío",
      onboardingSteps: [
        {
          label: "Crea un esquema de facturación en Configuración",
          href: "/settings/billing-schemes",
          linkLabel: "Ir a esquemas",
        },
        {
          label: "Asigna el esquema a tus clientes y revisa correos de facturación",
          href: "/clients",
          linkLabel: "Ir a clientes",
        },
        {
          label: "Envía facturas desde Pendientes (job diario)",
          href: "/finance/dispatch?tab=pending",
          linkLabel: "Ir a pendientes",
        },
      ] as const,
    },
    table: {
      period: "Periodo",
      scheme: "Esquema de facturación",
      origin: "Origen",
      status: "Estado",
      createdAt: "Creada",
    },
    origin: {
      manual: "Manual",
      scheduled: "Automática",
    },
    createDialog: {
      title: "Preparar envío del periodo",
      description:
        "Arma una corrida por esquema para revisar el periodo y enviar un correo por cliente (digest). El envío diario de facturas está en Pendientes.",
      schemeLabel: "Esquema de facturación",
      schemeHint:
        "Define cada cuánto se agrupan las facturas (semanal, cortes del mes o mensual).",
      schemeSummaryLabel: "Resumen del esquema",
      submit: "Preparar lista",
      cancel: "Cancelar",
      noSchemes: "No hay esquemas de facturación activos.",
      settingsLink: "Configura uno en Ajustes",
    },
  },
  status: {
    draft: "Borrador",
    previewed: "Lista preparada",
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
    title: "Detalle del envío",
    schemeTypeLabel: (name: string) => `Esquema de facturación: ${name}`,
    originScheduled: "Automática",
    originManual: "Manual",
    periodClosedTrips: (start: string, end: string) =>
      `Viajes cerrados entre ${start} y ${end}`,
    refreshPreview: "Actualizar lista",
    cancelRun: "Cancelar envío",
    sendCta: "Enviar facturas",
    resendCta: "Reenviar seleccionadas",
    backToList: "Volver al historial",
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
    attachmentsHint:
      "Clientes con más de 4 facturas en este envío recibirán un archivo ZIP con todos los PDF y XML.",
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
        "No se incluyen en este correo. Son trabajo de timbrado aparte: genera la factura y actualiza la lista.",
      pendingCollapsedSummary: (count: number) =>
        count === 1
          ? "1 pendiente por generar (no va en este correo)"
          : `${count} pendientes por generar (no van en este correo)`,
      expandPending: "Ver pendientes",
      collapsePending: "Ocultar pendientes",
      readyTitle: "Listas para enviar",
      emptyBucket: "Ninguno en este periodo.",
      stampCta: "Generar factura",
      tripLabel: (shortId: string) => `Viaje ${shortId}`,
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
        "Se enviará un correo por cliente con los archivos fiscales (PDF y XML) adjuntos. Clientes con muchas facturas recibirán un ZIP.",
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
        "No se regeneran el PDF ni el XML y no se vuelve a timbrar. Solo se reenvía el correo con los archivos ya generados. Por defecto estas facturas se omiten del envío normal.",
      emailNote:
        "Se reenviará un correo por cliente solo con las facturas que marcaste, con PDF/XML adjuntos (o ZIP si hay muchas).",
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
        "Revisa el resultado por cliente o prepara un nuevo envío del periodo para reintentar.",
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
    runCreated: "Lista preparada",
    previewUpdated: "Lista actualizada",
    sendConfirmed: "Envío confirmado",
    sendFailedTitle: "No se pudo enviar las facturas",
    cancelled: "Envío cancelado",
    error: "No se pudo completar la operación",
  },
} as const;
