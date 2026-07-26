/**
 * Copy — Mi cuenta → Seguridad (MFA + sesiones).
 * Namespace: settings.security.copy.* (también usado en /account/security)
 */

export const securitySettingsCopy = {
  page: {
    title: "Seguridad",
    intro:
      "Protege tu acceso con autenticación en dos pasos y revisa quién tiene sesión abierta.",
  },
  adminBanner: {
    title: "Recomendación para administradores",
    body: "Activa la autenticación en dos pasos en esta cuenta. Reduce el riesgo si alguien obtiene tu contraseña.",
  },
  mfa: {
    title: "Autenticación en dos pasos",
    descriptionOff:
      "Tras tu contraseña, pedirás un código de 6 dígitos de una app authenticator (Google Authenticator, Authy, 1Password, etc.).",
    descriptionOn:
      "Tu cuenta exige un código de la app authenticator (o un código de recuperación) en cada inicio de sesión.",
    statusOn: "Activada",
    statusOff: "Desactivada",
    statusLoading: "Cargando…",
    enable: "Activar",
    disable: "Desactivar",
    enabledAt: "Activada el",
  },
  sessions: {
    title: "Sesiones activas",
    description:
      "Dispositivos con acceso a tu cuenta. Cierra las sesiones que no reconozcas.",
    current: "Esta sesión",
    lastUsed: "Último uso",
    unknownDevice: "Dispositivo desconocido",
    revoke: "Cerrar sesión",
    empty: "No hay otras sesiones activas.",
    loading: "Cargando sesiones…",
    ip: "IP",
  },
  password: {
    title: "Contraseña",
    description:
      "Gestiona tu contraseña en la pestaña Seguridad de Mi cuenta.",
    cta: "Ir a Mi cuenta",
  },
  setupDialog: {
    title: "Configurar autenticación en dos pasos",
    description:
      "Escanea el código QR con tu app authenticator (Google Authenticator, Authy, 1Password, etc.). Luego confirma con un código de 6 dígitos.",
    qrAlt: "Código QR para configurar autenticación en dos pasos",
    qrLoading: "Generando código QR…",
    qrError:
      "No se pudo mostrar el código QR. Usa la clave secreta de abajo.",
    cannotScanHint: "¿No puedes escanear? Introduce la clave manualmente:",
    secretLabel: "Clave secreta",
    copySecret: "Copiar clave",
    secretCopied: "Clave copiada",
    codeLabel: "Código de la app",
    codePlaceholder: "000000",
    cancel: "Cancelar",
    confirm: "Confirmar y activar",
  },
  recoveryDialog: {
    title: "Guarda tus códigos de recuperación",
    description:
      "Solo se muestran una vez. Sin ellos, si pierdes el teléfono podrías quedar fuera de la cuenta.",
    warning:
      "Guárdalos en un lugar seguro (gestor de contraseñas o impresión). Cada código sirve una sola vez.",
    copy: "Copiar códigos",
    copied: "Códigos copiados",
    done: "Ya los guardé",
  },
  disableDialog: {
    title: "Desactivar autenticación en dos pasos",
    description:
      "Confirma con tu contraseña actual y un código de tu app authenticator.",
    passwordLabel: "Contraseña actual",
    codeLabel: "Código de la app",
    codePlaceholder: "000000",
    cancel: "Cancelar",
    confirm: "Desactivar",
  },
  toast: {
    setupFailed: "No se pudo iniciar la configuración",
    enabled: "Autenticación en dos pasos activada",
    invalidCode: "Código incorrecto",
    disableFailed: "No se pudo desactivar",
    disabled: "Autenticación en dos pasos desactivada",
    sessionRevoked: "Sesión cerrada",
    sessionRevokeFailed: "No se pudo cerrar la sesión",
  },
} as const;
