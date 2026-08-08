/**
 * Copy del embudo público de activación del admin inicial (ADR-0073).
 * Plano tenant/auth — no PlatformLayout ni storage platform.
 */
export const tenantActivationCopy = {
  verifying: "Validando enlace de activación…",
  invalidTitle: "Activación no disponible",
  invalidCta: "Ir al inicio de sesión",
  validTitle: "Activar acceso",
  validDescription:
    "Confirma para habilitar el inicio de sesión con la contraseña que te entregaron. Este paso no cambia la contraseña.",
  companyLabel: "Empresa",
  emailLabel: "Correo",
  subdomainLabel: "Identificador",
  expiresLabel: "El enlace vence",
  activate: "Activar acceso",
  activating: "Activando…",
  successTitle: "Acceso activado",
  successDescription: (subdomain: string) =>
    subdomain
      ? `Ya puedes iniciar sesión en el ERP con el identificador «${subdomain}» y tu contraseña.`
      : "Ya puedes iniciar sesión en el ERP con tu contraseña.",
  successCta: "Ir al inicio de sesión",
  passwordHint:
    "Usa la contraseña que te entregaron por un canal seguro (no llega en este correo).",
};
