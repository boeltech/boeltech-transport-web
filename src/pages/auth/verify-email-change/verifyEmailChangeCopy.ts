/**
 * Copy — confirmación de cambio de correo (`/verify-email-change`).
 */

export const verifyEmailChangeCopy = {
  loading: "Confirmando el cambio de correo…",
  success: {
    title: "Correo actualizado",
    body: "Inicia sesión con tu nuevo correo. Las sesiones anteriores quedaron cerradas.",
    goLogin: "Ir a iniciar sesión",
  },
  error: {
    title: "No se pudo confirmar el cambio",
    fallback:
      "El enlace no es válido, ya se usó o venció. Pide otro desde Mi cuenta.",
    missingToken: "Falta el enlace de confirmación en la dirección.",
    goLogin: "Ir a iniciar sesión",
    requestAnother: "Pedir otro enlace",
  },
} as const;
