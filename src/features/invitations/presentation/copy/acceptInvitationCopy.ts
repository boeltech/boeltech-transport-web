/**
 * Copy — aceptar invitación (`/accept-invitation`).
 * Namespace: acceptInvitation.copy.*
 * F1 Operate: paridad reset (StatusBlock + password a11y); éxito → login sin auto-nav.
 */
export const acceptInvitationCopy = {
  title: "Aceptar invitación",
  descriptionFallback: "Completa tus datos y define una contraseña.",
  descriptionWithTenant: (tenantName: string) =>
    `Te invitaron a ${tenantName}. Completa tus datos y define una contraseña.`,
  loading: "Validando invitación…",
  fields: {
    firstName: "Nombre",
    firstNamePlaceholder: "Tu nombre",
    lastName: "Apellido",
    lastNamePlaceholder: "Tus apellidos",
    password: "Contraseña",
    passwordPlaceholder: "Mínimo 8 caracteres",
    confirmPassword: "Confirmar contraseña",
    confirmPasswordPlaceholder: "Repite tu contraseña",
    rolePrefix: "Rol:",
  },
  submit: "Crear cuenta y continuar",
  submitting: "Creando cuenta…",
  validationSummaryTitle: "Revisa tus datos",
  submitErrorTitle: "No se pudo crear la cuenta",
  backToLogin: "Volver a iniciar sesión",
  invalid: {
    title: "Invitación no disponible",
    missingToken: "No se proporcionó un enlace válido",
    goLogin: "Ir al inicio de sesión",
  },
  success: {
    title: "Cuenta creada",
    body: "Tu cuenta quedó lista. Ya puedes iniciar sesión en tu empresa.",
    goLogin: "Iniciar sesión",
  },
} as const;
