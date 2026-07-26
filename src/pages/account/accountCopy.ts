/**
 * Copy — Mi cuenta (`/account`).
 * Namespace: account.copy.*
 */

export const accountCopy = {
  page: {
    title: "Mi cuenta",
    backLabel: "Volver al panel",
  },
  tabs: {
    data: "Datos",
    security: "Seguridad",
  },
  personal: {
    title: "Datos personales",
    description:
      "Nombre, apellido y correo asociados a tu usuario en esta organización.",
    firstName: "Nombre",
    lastName: "Apellido",
    email: "Correo electrónico",
    save: "Guardar cambios",
    saving: "Guardando…",
  },
  meta: {
    title: "Información de la cuenta",
    description:
      "Rol, organización y último acceso. Actualiza para sincronizar con el servidor sin guardar el formulario.",
    refresh: "Actualizar datos",
    role: "Rol",
    organization: "Organización",
    subdomain: "Subdominio",
    lastLogin: "Último acceso",
    lastLoginEmpty: "—",
  },
  toast: {
    refreshedTitle: "Datos actualizados",
    refreshedDescription: "Tu información se sincronizó con el servidor.",
    refreshFailedTitle: "No se pudo actualizar",
    savedTitle: "Cambios guardados",
    savedDescription: "Los datos personales se actualizaron correctamente.",
    saveFailedTitle: "No se pudo guardar",
  },
  password: {
    title: "Contraseña",
    description:
      "Actualiza tu contraseña cuando quieras. Al guardar, esta sesión se renueva automáticamente; en otros dispositivos hará falta volver a iniciar sesión.",
    changeCta: "Cambiar contraseña",
    sheetTitle: "Cambiar contraseña",
    sheetDescription:
      "Confirma tu contraseña actual y define una nueva. Esta sesión se mantendrá activa; otras sesiones quedarán invalidadas.",
    current: "Contraseña actual",
    newPassword: "Nueva contraseña",
    confirm: "Confirmar nueva contraseña",
    suggest: "Sugerir contraseña segura",
    cancel: "Cancelar",
    save: "Guardar nueva contraseña",
    saving: "Guardando…",
    match: "Las contraseñas coinciden",
    mismatch: "Las contraseñas no coinciden",
    requirementsLabel: "Requisitos de la nueva contraseña",
    reqMinLength: "Al menos 8 caracteres",
    reqUpper: "Una letra mayúscula",
    reqLower: "Una letra minúscula",
    reqDigit: "Un número",
    suggestedTitle: "Contraseña sugerida",
    suggestedDescription: "Puedes usarla o sustituirla por la que prefieras.",
    updatedTitle: "Contraseña actualizada",
    updatedDescription:
      "Tu sesión en este dispositivo sigue activa con nuevos tokens. En otros dispositivos deberás iniciar sesión de nuevo.",
    failedTitle: "No se pudo cambiar la contraseña",
  },
} as const;
