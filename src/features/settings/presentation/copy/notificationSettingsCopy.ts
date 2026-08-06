/**
 * Copy de Configuración → Avisos de la empresa (/settings/notifications).
 *
 * Preferencias de tenant que gobiernan qué avisos de documentos por vencer
 * llegan a la campana del equipo. No confundir con el inbox personal
 * (/notifications).
 */

export const notificationSettingsCopy = {
  page: {
    sectionTitle: "Avisos de la empresa",
    title: "Avisos de la empresa",
    description:
      "Define qué avisos ve el equipo en la campana. La campana es personal; esta regla aplica a toda la empresa.",
  },

  nav: {
    label: "Avisos de la empresa",
    description: "Qué avisos ve el equipo en la campana",
  },

  state: {
    loadErrorTitle: "No se pudieron cargar los avisos",
    loadErrorDescription:
      "Revisa tu conexión e inténtalo de nuevo. Si el problema continúa, pide ayuda a quien administra la cuenta.",
    retry: "Reintentar",
  },

  action: {
    cancel: "Cancelar",
    save: "Guardar cambios",
    saving: "Guardando…",
    viewInbox: "Ver avisos en la campana",
  },

  validation: {
    summaryTitle: "Revisa los datos marcados",
    daysRequired: "Indica con cuántos días de anticipación avisar",
    daysMin: "La anticipación mínima es 1 día",
    daysMax: "La anticipación máxima es 365 días",
  },

  documents: {
    title: "Documentos por vencer",
    description:
      "Cuando está activo, la campana avisa con anticipación si vence una licencia, un certificado médico, un seguro o un permiso SCT.",
    toggleLabel: "Avisar documentos por vencer",
    toggleHint:
      "Aplica a toda la empresa: cada persona verá en su campana los avisos que le correspondan.",
    daysLabel: "Días de anticipación",
    daysHint: "Con cuántos días de anticipación aparece el aviso en la campana.",
  },

  inboxLink: {
    hint: "La campana muestra avisos personales. Esta pantalla solo define la regla de la empresa.",
  },

  toast: {
    saved: "Avisos actualizados",
    savedDescription: "Los cambios se guardaron correctamente.",
    saveError: "No se pudieron guardar los cambios",
    saveErrorDescription: "Inténtalo de nuevo en unos momentos.",
  },
} as const;
