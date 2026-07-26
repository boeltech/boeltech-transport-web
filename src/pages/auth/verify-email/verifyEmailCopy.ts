/**
 * Copy — verificación de correo (`/verify-email`).
 * Namespace: verifyEmail.copy.*
 */
export const verifyEmailCopy = {
  title: "Verificación de correo",
  description: "Confirmamos tu dirección para completar el registro",
  loading: "Verificando enlace…",
  success: {
    title: "Correo verificado",
    body: "Tu correo quedó verificado. Ya puedes continuar en el panel.",
    goDashboard: "Ir al panel",
  },
  error: {
    title: "No se pudo verificar",
    missingToken: "Este enlace no es válido o está incompleto.",
    fallback: "No se pudo verificar el enlace. Solicita uno nuevo o inicia sesión.",
    goLogin: "Ir al inicio de sesión",
  },
} as const;
