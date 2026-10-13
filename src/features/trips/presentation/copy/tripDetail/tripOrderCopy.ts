/**
 * Namespace: trips.copy.tripDetail.tripOrder.*
 * Tarjeta «Orden de viaje» (Operación) — documento operativo, no CP31.
 */
export const tripOrderCopy = {
  card: {
    title: "Orden de viaje",
    description: "Documento para el conductor. No es CFDI ni Carta Porte.",
    helpTooltip:
      "También conocida como hoja de ruta. Es el PDF operativo que se entrega al conductor; no sustituye la Carta Porte.",
    empty: {
      title: "Aún no hay orden de viaje",
      description: "Genera el PDF para entregar al conductor.",
    },
    label: {
      version: (n: number) => `Versión ${n}`,
      issuedAt: "Emitida",
      issuedBy: "Por",
      statusAtIssue: "Estado al emitir",
    },
    badge: {
      current: "Vigente",
      outdated: "Desactualizada",
    },
    outdatedHint:
      "El viaje cambió después de esta emisión. Regenera antes de reentregar.",
    action: {
      generate: "Generar orden de viaje",
      download: "Descargar PDF",
      regenerate: "Regenerar orden",
    },
    disabled: {
      draft: "Confirma la reserva y completa ruta y flota para generar la orden.",
      threshold: "Falta unidad, operador u origen/destino.",
      cancelled: "No se puede generar una orden en un viaje cancelado.",
      disabled: "La Orden de viaje no está disponible en este momento.",
    },
    confirmRegenerate: {
      title: "Regenerar orden de viaje",
      description: (nextVersion: number) =>
        `Se creará la versión ${nextVersion}. La anterior queda en historial.`,
      confirm: "Regenerar orden",
      cancel: "Cancelar",
    },
    loadError: "No se pudo cargar la Orden de viaje.",
    retry: "Reintentar",
    downloadError: "No se pudo descargar el PDF.",
  },
  toast: {
    ready: "Orden de viaje lista",
    versionGenerated: (n: number) => `Versión ${n} generada`,
  },
} as const;
