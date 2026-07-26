/**
 * Copy de recuperación de contraseña (forgot).
 * Namespace: forgotPassword.copy.*
 */
export const forgotPasswordCopy = {
  title: "Recuperar contraseña",
  description:
    "Te enviaremos un enlace seguro. Sin cargos ni cambios en tu cuenta.",
  fields: {
    subdomain: "Empresa",
    subdomainPlaceholder: "mi-empresa",
    subdomainHint:
      "El mismo identificador «Empresa» que usas al iniciar sesión (no el nombre comercial).",
    useSavedSubdomain: (subdomain: string) => `Usar empresa: ${subdomain}`,
    email: "Correo electrónico",
    emailPlaceholder: "admin@tuempresa.com",
  },
  submit: "Enviar enlace",
  submitting: "Enviando…",
  validationSummaryTitle: "Revisa los datos del formulario",
  backToLogin: "Volver a iniciar sesión",
  success: {
    title: "Revisa tu correo",
    body: "Si el correo está registrado en tu empresa, recibirás instrucciones para restablecer la contraseña. Revisa también spam o promociones.",
    devHint:
      "En desarrollo: si no llega el correo, revisa la consola del servidor de API (entrega de correo).",
  },
} as const;
