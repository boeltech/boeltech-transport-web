/**
 * Copy del landing /settings (HubPageShell).
 */

export const settingsHubCopy = {
  page: {
    title: "Configuración",
    description:
      "Pon a punto tu empresa, la facturación y las preferencias del equipo.",
  },
  orientation: {
    text: "Empieza por la identidad y los datos para facturar; el resto se configura cuando lo necesites.",
  },
  readiness: {
    ariaLabel: "Preparación de la empresa",
    identityReady: "Lista",
    identityPending: "Falta",
    identityLabel: "identidad",
    billingReady: "Lista",
    billingAttention: "Atención",
    billingPending: "Falta",
    billingLabel: "para facturar",
  },
  guide: {
    title: "Cómo poner a punto la empresa",
    steps: [
      "Completa identidad y domicilio en General",
      "Carga el sello y la numeración en Datos para facturar",
      "Ajusta padrón, autorizaciones y avisos cuando haga falta",
    ],
    storageKey: "settings.hub.guide.collapsed",
  },
  groups: {
    empresa: {
      title: "Empresa",
      description: "Identidad y lugares propios de la compañía",
    },
    facturacion: {
      title: "Facturación y plan",
      description: "Listo para emitir facturas y cupo del plan",
    },
    padron: {
      title: "Padrón y consulta",
      description: "Cargar maestros y consultar valores de referencia",
    },
    gobernanza: {
      title: "Gobernanza y preferencias",
      description: "Quién autoriza, avisos de la campana y widgets de Inicio",
    },
  },
  openSection: "Abrir",
  emptyFiltered:
    "No hay secciones disponibles con tus permisos en este grupo.",
} as const;
