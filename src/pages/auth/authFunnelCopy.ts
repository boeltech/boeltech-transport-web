/**
 * Copy compartido del shell del embudo auth (login / registro / recuperación).
 * Namespace: auth.funnel.copy.*
 * Handoff Capa 1: panel por modo (D1–D4, D7); sin trial fuera de register-open.
 */
import { BRAND } from "@shared/ui/brand";

export const authFunnelCopy = {
  brand: BRAND.productName,
  brandByline: BRAND.productByline,
  brandTagline: "Transporte · CFDI · Carta Porte",

  /** Claim corto (login / paneles con marketing). No es h1 de documento. */
  claimTitle: "Opera y factura tu flota desde el día uno",
  claimBody:
    "Viajes, flota y clientes en un solo ERP para transporte en México.",

  /** Trust fiscal (login) — sin promesa de trial. */
  trust: {
    ariaLabel: "Cumplimiento fiscal mexicano",
    items: [
      { label: "CFDI 4.0", hint: "Timbrado fiscal" },
      { label: "Carta Porte 3.1", hint: "Complemento SAT" },
      { label: "REP", hint: "Complementos de pago" },
    ],
  } as const,

  /** Panel mínimo forgot (D4). */
  forgot: {
    line: "Recupera el acceso a tu empresa de forma segura.",
  },

  previewLabel: "Vista del producto",
  previewWindowTitle: `${BRAND.productName} · Viaje y facturación`,
  previewListTitle: "Viajes recientes",
  previewStatusStrip: [
    { label: "En ruta", value: "VJ-1042" },
    { label: "Timbrado", value: "CFDI listo" },
  ] as const,
  previewTrips: [
    {
      code: "VJ-1042",
      route: "GDL → MTY",
      status: "En ruta",
      fiscal: "Carta Porte",
    },
    {
      code: "VJ-1038",
      route: "CDMX → QRO",
      status: "Entregado",
      fiscal: "Timbrado",
    },
    {
      code: "VJ-1031",
      route: "TIJ → Hermosillo",
      status: "Programado",
      fiscal: "Pendiente",
    },
  ] as const,

  helpPrefix: "¿Necesitas ayuda?",
  helpLink: "Contactar soporte",
  helpHref: "mailto:soporte@boeltech.com",
  backHome: "Volver al inicio",
  backHomeHref: "/welcome",
  legal: {
    copyright: `© ${new Date().getFullYear()} ${BRAND.companyName}`,
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

/** Modo del panel izquierdo según ruta (D1). */
export type AuthFunnelBrandMode = "login" | "forgot" | "register";

export function resolveAuthFunnelBrandMode(
  pathname: string,
): AuthFunnelBrandMode {
  if (pathname.startsWith("/register")) return "register";
  if (pathname.startsWith("/forgot-password")) return "forgot";
  return "login";
}
