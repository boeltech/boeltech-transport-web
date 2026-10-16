/**
 * Copy compartido del shell del embudo auth (login / registro / recuperación).
 * Namespace: auth.funnel.copy.*
 * Handoff Capa 1: panel por modo (D1–D4, D7); sin trial fuera de register-open.
 * F1: modos Operate token = panel mínimo (forgot/reset/verify/invite/activate).
 */
import { BRAND } from "@shared/ui/brand";

export const authFunnelCopy = {
  brand: BRAND.productName,
  brandByline: BRAND.productByline,
  brandTagline: "Transporte · CFDI · Carta Porte",

  /** Skip-link → #auth-form (paridad landing / LayoutShell). */
  skipLink: "Saltar al formulario",

  /** Claim corto (login / paneles con marketing). No es h1 de documento. */
  claimTitle: "Opera y factura tu flota desde el día uno",
  claimBody:
    "Viajes, flota y clientes en un solo ERP para transporte en México.",

  /** Trust fiscal (login) — paridad /welcome; sin promesa de trial. */
  trust: {
    ariaLabel: "Cumplimiento fiscal mexicano",
    items: [
      { label: "CFDI 4.0", hint: "Timbrado con tu sello" },
      { label: "Carta Porte 3.1", hint: "Va con el viaje" },
      { label: "REP", hint: "Al registrar el pago" },
    ],
  } as const,

  /** Panel mínimo Operate (sin claim, trust ni preview). */
  forgot: {
    line: "Recupera el acceso a tu empresa de forma segura.",
  },
  reset: {
    line: "Elige una contraseña nueva para volver a iniciar sesión.",
  },
  verify: {
    line: "Confirma tu correo para activar el acceso.",
  },
  invite: {
    line: "Únete a tu empresa con el enlace de invitación.",
  },
  activate: {
    line: "Activa el acceso de administrador de tu empresa.",
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

/** Modo del panel izquierdo según ruta (D1 / F1). */
export type AuthFunnelBrandMode =
  | "login"
  | "forgot"
  | "reset"
  | "verify"
  | "invite"
  | "activate"
  | "register";

/** Rutas con panel de marca mínimo (sin claim, trust ni preview). */
export const AUTH_FUNNEL_MINIMAL_BRAND_MODES: ReadonlySet<AuthFunnelBrandMode> =
  new Set(["forgot", "reset", "verify", "invite", "activate"]);

export function resolveAuthFunnelBrandMode(
  pathname: string,
): AuthFunnelBrandMode {
  if (pathname.startsWith("/register")) return "register";
  if (pathname.startsWith("/forgot-password")) return "forgot";
  if (pathname.startsWith("/reset-password")) return "reset";
  if (pathname.startsWith("/verify-email")) return "verify";
  if (pathname.startsWith("/accept-invitation")) return "invite";
  if (pathname.startsWith("/activate-tenant")) return "activate";
  return "login";
}

export function minimalBrandLine(mode: AuthFunnelBrandMode): string | null {
  if (mode === "forgot") return authFunnelCopy.forgot.line;
  if (mode === "reset") return authFunnelCopy.reset.line;
  if (mode === "verify") return authFunnelCopy.verify.line;
  if (mode === "invite") return authFunnelCopy.invite.line;
  if (mode === "activate") return authFunnelCopy.activate.line;
  return null;
}
