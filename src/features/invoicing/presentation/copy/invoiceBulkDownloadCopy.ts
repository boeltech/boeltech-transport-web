/**
 * Namespace: invoicing.copy.bulkDownload.*
 * Copy PRD handoff D1–D6 (descarga masiva CFDI).
 */

export const invoiceBulkDownloadCopy = {
  actionButton: "Descargar CFDI",
  sheet: {
    title: "Descargar facturas",
    description: "Obtén los XML y PDF timbrados en un archivo ZIP.",
  },
  period: {
    label: "Periodo de emisión",
    previous: "Mes anterior",
    current: "Mes actual",
    custom: "Personalizado",
    from: "Mes inicial",
    to: "Mes final",
    maxRange: "El periodo máximo es de 12 meses.",
  },
  client: {
    label: "Cliente (opcional)",
    placeholder: "Todos los clientes",
    none: "Todos los clientes",
  },
  content: {
    label: "Contenido",
    xmlPdf: "XML y PDF",
    xmlOnly: "Solo XML (más rápido)",
  },
  includePayments: "Incluir complementos de pago (REP)",
  includeCancelled: "Incluir facturas canceladas",
  help: "Los borradores y las facturas en timbrado no se incluyen porque aún no tienen XML. Los complementos de pago cancelados no se incluyen.",
  preview: {
    loading: "Calculando…",
    summary: (invoices: number, payments: number) =>
      `Se incluirán ${invoices} facturas y ${payments} complementos de pago.`,
    emptyTitle: "No hay facturas timbradas en este periodo.",
    emptyHint: "Cambia el periodo o el cliente.",
    exceedsLimit: "Son demasiados documentos para una descarga. Acorta el periodo o elige Solo XML.",
  },
  prepare: "Preparar descarga",
  preparing: (done: number, total: number) =>
    `Preparando tu descarga… ${done} de ${total} archivos. Puedes cerrar este panel; te avisaremos en la campana.`,
  queued: "En cola. Empezaremos en unos segundos…",
  downloadZip: "Descargar ZIP",
  downloadPart: (n: number, total: number) => `Descargar parte ${n} de ${total}`,
  expires: (dateLabel: string) => `Vence el ${dateLabel}.`,
  partial: (ok: number, total: number, warnings: number) =>
    `${ok} de ${total} archivos incluidos. ${warnings} con observaciones: revisa indice.csv dentro del ZIP.`,
  error: {
    generic:
      "No pudimos preparar la descarga. Intenta de nuevo; si persiste, contacta a soporte.",
    retry: "Reintentar",
    inProgress:
      "Ya tienes una descarga en preparación. Espera a que termine para iniciar otra.",
    outsidePlan: (earliest: string) =>
      `Tu plan permite descargar desde ${earliest}. Ajusta el periodo.`,
    tooMany:
      "Son demasiados documentos para una descarga. Acorta el periodo o elige Solo XML.",
    empty: "No hay facturas timbradas en este periodo.",
    expired: "Esta descarga venció. Prepárala de nuevo.",
    disabled: "La descarga masiva no está disponible en este momento.",
    notFound: "No encontramos esa descarga.",
    downloadFailed: "No se pudo descargar el archivo. Intenta de nuevo.",
  },
  statusReady: "Tu descarga está lista",
  statusFailed: "La descarga falló",
  newDownload: "Nueva descarga",
  toasts: {
    queued: "Descarga en preparación",
    downloadStarted: "Descarga iniciada",
  },
} as const;
