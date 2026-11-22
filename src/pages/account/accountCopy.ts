/**
 * Copy — Mi cuenta (`/account`).
 * Namespace: account.copy.*
 * Referencias: Operate-MiCuenta-Datos / Cambios / Estados (MC1–MC6).
 */

export const accountCopy = {
  page: {
    title: "Mi cuenta",
    tabsAriaLabel: "Mi cuenta",
  },
  tabs: {
    data: "Datos",
    security: "Seguridad",
    securityAttention: "Activa la autenticación en dos pasos",
  },
  personal: {
    title: "Datos personales",
    description: "Nombre y apellido con los que apareces en tlamx.",
    firstName: "Nombre",
    lastName: "Apellido",
    save: "Guardar cambios",
    saving: "Guardando…",
    discard: "Descartar",
    dirtyFirstName: "Cambiaste el nombre",
    dirtyLastName: "Cambiaste el apellido",
    dirtyBoth: "Cambiaste el nombre y el apellido",
  },
  email: {
    title: "Correo para iniciar sesión",
    descriptionVerified:
      "Con este correo y el código de empresa entras a tlamx; también recibe los enlaces para recuperar tu contraseña.",
    descriptionUnverified:
      "Confírmalo desde el enlace que te enviamos a este correo.",
    badgeVerified: "Verificado",
    badgeUnverified: "Sin verificar",
    changeCta: "Cambiar correo",
    resendVerification: "Reenviar enlace",
    confirmVerification: "Ya lo confirmé",
    resendVerificationSending: "Enviando…",
    confirmVerificationChecking: "Comprobando…",
    pendingTitle: (pendingEmail: string) =>
      `Cambio pendiente a ${pendingEmail}`,
    pendingBody: (expiresLabel: string) =>
      `Abre el enlace que enviamos a ese correo; vence ${expiresLabel}.`,
    pendingResend: "Reenviar enlace",
    pendingCancel: "Cancelar cambio",
    pendingResending: "Reenviando…",
    pendingCanceling: "Cancelando…",
  },
  emailSheet: {
    title: "Cambiar correo",
    description:
      "Te enviaremos un enlace al correo nuevo. Hasta que lo abras, sigues entrando con el actual.",
    currentEmail: "Correo actual",
    newEmail: "Correo nuevo",
    currentPassword: "Contraseña actual",
    passwordHint: "Para confirmar que eres tú.",
    cancel: "Cancelar",
    submit: "Enviar enlace",
    submitting: "Enviando…",
    sentTitle: (email: string) => `Revisa ${email}`,
    sentBody:
      "Abre el enlace que te enviamos para terminar el cambio. Vence en 24 horas.",
    sentAlertTitle: "Tu correo aún no cambia",
    sentAlertBody: (currentEmail: string) =>
      `Mientras tanto entras con ${currentEmail}. Si el enlace vence, el cambio se descarta.`,
    sentDone: "Listo",
    sentResend: "Reenviar enlace",
  },
  access: {
    title: "Tu acceso",
    description: "Lo administra quien gestiona Usuarios en tu empresa.",
    organization: "Empresa",
    companyCode: "Código de empresa",
    role: "Rol",
    lastLogin: "Último acceso",
    lastLoginEmpty: "—",
  },
  securityCard: {
    title: "Seguridad",
    mfaOff: "Tu cuenta no pide código de dos pasos.",
    mfaOn: "Tu cuenta pide código de dos pasos.",
    mfaLoading: "Consultando el estado de dos pasos…",
    goSecurity: "Ir a Seguridad",
  },
  toast: {
    savedTitle: "Cambios guardados",
    savedDescription: "Los datos personales se actualizaron correctamente.",
    saveFailedTitle: "No se pudo guardar",
    emailChangeSentTitle: "Enlace enviado",
    emailChangeSentDescription:
      "Revisa el correo nuevo y abre el enlace para terminar el cambio.",
    emailChangeFailedTitle: "No se pudo solicitar el cambio",
    emailChangeResentTitle: "Enlace reenviado",
    emailChangeCanceledTitle: "Cambio cancelado",
    emailChangeCancelFailedTitle: "No se pudo cancelar",
    verificationResentTitle: "Enlace reenviado",
    verificationStillPending: "Aún no vemos la confirmación. Revisa tu bandeja.",
    verificationConfirmedTitle: "Correo verificado",
  },
  password: {
    title: "Contraseña",
    description:
      "Al cambiarla, esta sesión sigue abierta y las demás se cierran.",
    changeCta: "Cambiar contraseña",
    sheetTitle: "Cambiar contraseña",
    sheetDescription:
      "Esta sesión sigue abierta; en tus otros dispositivos tendrás que volver a entrar.",
    current: "Contraseña actual",
    newPassword: "Contraseña nueva",
    confirm: "Confirmar contraseña nueva",
    suggest: "Sugerir contraseña segura",
    cancel: "Cancelar",
    save: "Guardar contraseña",
    saving: "Guardando…",
    match: "Las contraseñas coinciden",
    mismatch: "Las contraseñas no coinciden",
    requirementsLabel: "Requisitos de la contraseña nueva",
    reqMinLength: "8 caracteres o más",
    reqUpper: "Una mayúscula",
    reqLower: "Una minúscula",
    reqDigit: "Un número",
    suggestedTitle: "Contraseña sugerida",
    suggestedDescription: "Puedes usarla o sustituirla por la que prefieras.",
    updatedTitle: "Contraseña actualizada",
    updatedDescription:
      "Tu sesión en este dispositivo sigue activa. En otros dispositivos deberás iniciar sesión de nuevo.",
    failedTitle: "No se pudo cambiar la contraseña",
  },
} as const;
