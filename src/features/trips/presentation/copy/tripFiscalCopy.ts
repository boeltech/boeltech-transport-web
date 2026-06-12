export const tripFiscalCopy = {
  fixSheet: {
    title: "Corregir RFC de parada",
    description: (order: number, stopTypeLabel: string, location: string) =>
      `Parada #${order} (${stopTypeLabel}) — ${location}`,
    rfcLabel: "RFC remitente/destinatario",
    rfcInvalid: "Formato SAT inválido",
    nombreLabel: "Nombre (opcional)",
    reasonLabel: "Razón del cambio",
    reasonTooShort: "La razón debe tener al menos 5 caracteres",
    counter: (current: number, max: number) => `${current}/${max}`,
    propagateLabel: "También actualizar el RFC en la dirección guardada del cliente",
    propagateHint: "Evita repetir este error en futuros viajes",
    cancel: "Cancelar",
    submitStamp: "Validar y retimbrar",
    submitSave: "Guardar cambios",
    noPermission: "No tienes permiso para corregir datos fiscales de paradas.",
    successTitle: "Datos fiscales actualizados",
    successClientUpdated:
      "También se actualizó la dirección guardada del cliente",
  },
  pickerSheet: {
    title: "Selecciona la parada a corregir",
    description:
      "El PAC rechazó el timbrado por RFC inválido. Elige la parada que debes corregir.",
    allStopsDescription:
      "El PAC rechazó el timbrado, pero no se identificó la parada automáticamente. Revisa el RFC de cada parada y corrige la que corresponda.",
    fixAction: "Corregir RFC",
    empty: "No hay paradas disponibles en este contexto. Cierra y vuelve a abrir el detalle del viaje o de la factura.",
  },
  preflightSheet: {
    title: "Revisa el RFC de las paradas",
    description:
      "Hay paradas con RFC faltante o con formato inválido. Corrígelas antes de timbrar para evitar gastar un timbre.",
    fixAction: "Corregir RFC",
    reasonMissing: "RFC faltante",
    reasonInvalid: "RFC con formato inválido",
  },
  stamp: {
    errorTitle: "Error al timbrar",
    fixAction: "Corregir RFC",
    invalidRfcDescription: (stopOrder: number | null) =>
      stopOrder != null
        ? `RFC inválido en parada #${stopOrder}.`
        : "RFC inválido en una parada del viaje.",
  },
  chip: {
    invalidRfc: "RFC inválido — Corregir",
  },
} as const;
