/**
 * Copy — Mi cuenta → Seguridad (MFA + sesiones).
 * Namespace: settings.security.copy.*
 * Referencias: Operate-MiCuenta-Seguridad / DosPasos / Estados (MC7–MC9).
 */

export const securitySettingsCopy = {
  page: {
    title: "Seguridad",
  },
  adminBanner: {
    title: "Recomendado para administradores",
    body: "Tu cuenta puede cambiar usuarios, facturación y el sello digital. Con dos pasos, una contraseña filtrada no basta para entrar.",
  },
  mfa: {
    title: "Autenticación en dos pasos",
    descriptionOff:
      "Después de tu contraseña, tlamx pide un código de 6 dígitos de una app como Google Authenticator, Authy o 1Password.",
    descriptionOn:
      "Cada inicio de sesión pide un código de tu app o uno de recuperación.",
    statusOn: "Activada",
    statusOff: "Desactivada",
    statusLoading: "Cargando…",
    enable: "Activar",
    disable: "Desactivar",
    enabledAt: "Activada el",
    errorTitle: "No pudimos cargar el estado de dos pasos",
    errorBody: "Revisa tu conexión e inténtalo de nuevo.",
    retry: "Reintentar",
  },
  sessions: {
    title: "Sesiones abiertas",
    description:
      "Dispositivos donde tu cuenta sigue abierta. Cierra las que no reconozcas.",
    countLabel: (n: number) => String(n),
    current: "Esta sesión",
    lastUsed: "Último uso",
    lastUsedNow: "Ahora",
    startedAt: (label: string) => `Iniciada el ${label}`,
    unknownDevice: "Dispositivo desconocido",
    revoke: "Cerrar",
    revokeOthers: "Cerrar las demás",
    emptyOthers: "No hay otros dispositivos con tu cuenta abierta.",
    empty: "No hay sesiones activas.",
    loading: "Cargando sesiones…",
    ip: "IP",
    colDevice: "Dispositivo",
    colIp: "IP",
    colLastUsed: "Último uso",
    colActions: "Acciones",
    errorTitle: "No pudimos cargar tus sesiones",
    errorBody: "Revisa tu conexión e inténtalo de nuevo.",
    retry: "Reintentar",
  },
  revokeOthersDialog: {
    title: (n: number) =>
      n === 1
        ? "¿Cerrar la otra sesión?"
        : `¿Cerrar las otras ${n} sesiones?`,
    /** N=1 — etiqueta singular. */
    descriptionSingular: (deviceName: string) =>
      `${deviceName} tendrá que volver a iniciar sesión. Esta sesión sigue abierta.`,
    /** N=2–3 etiquetas distintas — lista natural ya unida. */
    descriptionList: (deviceNames: string) =>
      `${deviceNames} tendrán que volver a iniciar sesión. Esta sesión sigue abierta.`,
    /** N>3 o repeticiones — copy por conteo (sin enumerar). */
    descriptionCount: (n: number) =>
      `Las otras ${n} sesiones tendrán que volver a iniciar sesión. Esta sesión sigue abierta.`,
    cancel: "Cancelar",
    confirm: (n: number) =>
      n === 1 ? "Cerrar 1 sesión" : `Cerrar ${n} sesiones`,
  },
  setupDialog: {
    title: "Activar dos pasos",
    description:
      "Necesitas una app de códigos en tu teléfono: Google Authenticator, Authy o 1Password.",
    stepScan: "1. Escanea el código con la app",
    stepCode: "2. Escribe el código que muestra la app",
    qrAlt: "Código QR para configurar autenticación en dos pasos",
    qrLoading: "Generando código QR…",
    qrError:
      "No se pudo mostrar el código QR. Usa la clave secreta de abajo.",
    cannotScanHint: "¿No puedes escanear? Escribe esta clave en la app:",
    secretLabel: "Clave secreta",
    copySecret: "Copiar",
    secretCopied: "Clave copiada",
    codeLabel: "Código de 6 dígitos",
    cancel: "Cancelar",
    confirm: "Activar",
  },
  recoveryDialog: {
    title: "Guarda tus códigos de recuperación",
    description:
      "Si pierdes el teléfono, entras con uno de estos. Cada código sirve una sola vez.",
    warningTitle: "No los volverás a ver",
    warning:
      "Guárdalos en tu gestor de contraseñas o imprímelos antes de cerrar.",
    copy: "Copiar",
    copied: "Códigos copiados",
    download: "Descargar .txt",
    downloadFilename: "codigos-recuperacion-tlamx.txt",
    done: "Ya los guardé",
  },
  disableDialog: {
    title: "Desactivar dos pasos",
    description:
      "Confirma con tu contraseña y un código de la app (o uno de recuperación).",
    passwordLabel: "Contraseña actual",
    codeLabel: "Código de la app",
    adminWarningTitle: "Tu cuenta quedará solo con contraseña",
    adminWarningBody:
      "Como administrador, recomendamos mantenerla activa.",
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
    othersRevoked: "Sesiones cerradas",
    othersRevokeFailed: "No se pudieron cerrar las demás sesiones",
  },
} as const;
