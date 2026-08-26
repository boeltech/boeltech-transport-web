import type { DispatchRunStatus } from "../../domain/billingDispatchRun.types";

export const dispatchRunsCopy = {
  tab: {
    title: "Envío de facturas",
    subtitle:
      "Revisa las facturas del periodo y envíalas por correo. Un correo por cliente.",
    executeCta: "Preparar envío",
    entityLabelPlural: "envíos",
    loadError: "Error al cargar envíos de facturas",
    filters: {
      statusPlaceholder: "Estado",
      schemePlaceholder: "Tipo de envío",
      all: "Todos",
      chipStatus: (label: string) => `Estado: ${label}`,
      chipScheme: (name: string) => `Tipo de envío: ${name}`,
    },
    empty: {
      title: "No hay envíos recientes",
      description:
        "Prepara un envío para revisar las facturas del periodo y enviarlas por correo a tus clientes.",
      settingsLink: "Configura los tipos de envío en Configuración",
      withFilters:
        "No hay envíos con los filtros actuales. Prueba otro estado o tipo de envío.",
      clearFilters: "Limpiar filtros",
      onboardingTitle: "Antes del primer envío",
      onboardingSteps: [
        {
          label: "Crea un tipo de envío en esquemas de facturación",
          href: "/settings/billing-schemes",
          linkLabel: "Ir a esquemas",
        },
        {
          label: "Asigna el esquema a tus clientes y revisa correos de facturación",
          href: "/clients",
          linkLabel: "Ir a clientes",
        },
        {
          label: "Prepara el envío del periodo desde este listado",
          href: null,
          linkLabel: null,
        },
      ] as const,
    },
    table: {
      period: "Periodo",
      scheme: "Tipo de envío",
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
      schemeLabel: "Tipo de envío",
      schemeHint:
        "Define cada cuánto se agrupan las facturas (semanal, quincenal, mensual).",
      submit: "Preparar lista",
      cancel: "Cancelar",
      noSchemes: "No hay tipos de envío activos.",
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
    title: "Envío de facturas",
    schemeTypeLabel: (name: string) => `Tipo de envío: ${name}`,
    originScheduled: "Automática",
    originManual: "Manual",
    periodClosedTrips: (start: string, end: string) =>
      `Viajes cerrados entre ${start} y ${end}`,
    refreshPreview: "Actualizar lista",
    cancelRun: "Cancelar envío",
    sendCta: "Enviar facturas",
    resendCta: "Reenviar seleccionadas",
    backToList: "Volver al listado",
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
