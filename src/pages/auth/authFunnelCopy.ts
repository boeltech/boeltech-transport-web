/**
 * Copy compartido del shell del embudo auth (login / registro / recuperación).
 * Namespace: auth.funnel.copy.*
 */
export const authFunnelCopy = {
  brand: "Boeltech ERP",
  brandTagline: "Transporte · CFDI · Carta Porte",
  claimTitle: "Opera tu flota con control fiscal desde el día uno",
  claimBody:
    "Viajes, clientes y timbrado en un solo ERP pensado para empresas de transporte en México.",
  highlights: [
    {
      title: "CFDI y Carta Porte",
      body: "Timbrado alineado al SAT, sin herramientas aparte.",
    },
    {
      title: "Prueba sin tarjeta",
      body: "14 días y 15 timbres para validar tu operación.",
    },
    {
      title: "Acceso por roles",
      body: "Tu equipo entra con el permiso que corresponde.",
    },
  ] as const,
  brandFooter: "Diseñado para operación diaria y cumplimiento fiscal.",
  previewLabel: "Vista del producto",
  previewWindowTitle: "Boeltech ERP · Operaciones",
  previewListTitle: "Viajes recientes",
  previewKpis: [
    { label: "En ruta", value: "12" },
    { label: "Timbrados", value: "48" },
    { label: "Flota", value: "26" },
  ] as const,
  previewTrips: [
    { code: "VJ-1042", route: "GDL → MTY", status: "En ruta" },
    { code: "VJ-1038", route: "CDMX → QRO", status: "Entregado" },
    { code: "VJ-1031", route: "TIJ → Hermosillo", status: "Programado" },
  ] as const,
  helpPrefix: "¿Necesitas ayuda?",
  helpLink: "Contactar soporte",
  helpHref: "mailto:soporte@boeltech.com",
  backHome: "Volver al inicio",
  backHomeHref: "/welcome",
  legal: {
    copyright: `© ${new Date().getFullYear()} Boeltech`,
    terms: "Términos",
    termsHref: "/terms",
    privacy: "Privacidad",
    privacyHref: "/privacy",
    separator: "·",
  },
  captchaRequired: "Completa la verificación anti-bot.",
  showPassword: "Mostrar contraseña",
  hidePassword: "Ocultar contraseña",
} as const;
