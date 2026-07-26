/**
 * Copy de login público.
 * Namespace: login.copy.*
 */
export const loginCopy = {
  title: "Iniciar sesión",
  description: "Entra con el identificador de tu empresa y tus credenciales",
  fields: {
    subdomain: "Empresa",
    subdomainHint:
      "Identificador único de tu empresa (el mismo que elegiste al registrarte), sin espacios.",
    subdomainPlaceholder: "mi-empresa",
    email: "Correo electrónico",
    emailPlaceholder: "admin@tuempresa.com",
    password: "Contraseña",
    passwordPlaceholder: "Tu contraseña",
    forgotPassword: "¿Olvidaste tu contraseña?",
  },
  submit: "Entrar",
  submitting: "Entrando…",
  validationSummaryTitle: "Revisa tus credenciales",
  registerPrompt: "¿Aún no tienes cuenta?",
  registerLink: "Crear cuenta de empresa",
  registerClosedHint:
    "El registro público está cerrado. Si te invitaron, usa el enlace del correo o contacta a ventas.",
  sessionExpired:
    "Tu sesión expiró o dejó de ser válida. Vuelve a iniciar sesión para continuar.",
  offline: "Error de conexión. Verifica tu internet.",
  mfa: {
    title: "Verificación en dos pasos",
    description:
      "Ingresa el código de 6 dígitos de tu app de autenticación, o un código de recuperación.",
    codeLabel: "Código",
    codePlaceholder: "000000",
    codeRequired: "Ingresa el código de 6 dígitos.",
    submit: "Verificar",
    submitting: "Verificando…",
    back: "Volver",
  },
} as const;
