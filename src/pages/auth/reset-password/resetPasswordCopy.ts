/**
 * Copy de restablecimiento de contraseña (reset con token).
 * Namespace: resetPassword.copy.*
 */
export const resetPasswordCopy = {
  title: "Nueva contraseña",
  description: "Elige una contraseña segura para volver a entrar a tu empresa",
  fields: {
    password: "Nueva contraseña",
    passwordPlaceholder: "Mínimo 8 caracteres",
    confirmPassword: "Confirmar contraseña",
    confirmPasswordPlaceholder: "Repite tu contraseña",
  },
  submit: "Actualizar contraseña",
  submitting: "Actualizando…",
  validationSummaryTitle: "Revisa tu nueva contraseña",
  loading: "Verificando enlace…",
  invalid: {
    title: "Enlace inválido",
    missingToken: "No se proporcionó un enlace válido",
    fallbackError: "Enlace inválido o expirado",
    requestNew: "Solicitar nuevo enlace",
    backToLogin: "Volver a iniciar sesión",
  },
  success: {
    title: "Contraseña actualizada",
    body: "Tu contraseña se cambió correctamente. Ya puedes iniciar sesión.",
    goLogin: "Iniciar sesión",
  },
} as const;
