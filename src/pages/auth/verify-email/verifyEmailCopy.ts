/**
 * Copy — verificación de correo (`/verify-email`).
 * Namespace: verifyEmail.copy.*
 * F1 Operate: StatusBlock; éxito → login primero; panel solo si hay sesión.
 */
export const verifyEmailCopy = {
  loading: "Verificando enlace…",
  success: {
    title: "Correo verificado",
    body: "Tu correo quedó verificado. Ya puedes iniciar sesión.",
    goLogin: "Iniciar sesión",
    goDashboard: "Ir al panel",
  },
  error: {
    title: "No se pudo verificar",
    missingToken: "Este enlace no es válido o está incompleto.",
    fallback:
      "No se pudo verificar el enlace. Solicita uno nuevo o inicia sesión.",
    goLogin: "Ir al inicio de sesión",
  },
} as const;
