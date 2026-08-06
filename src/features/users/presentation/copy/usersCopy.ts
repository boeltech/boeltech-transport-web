export const usersCopy = {
  list: {
    title: "Usuarios",
    description:
      "Quién tiene acceso a tu empresa y cuántas plazas quedan en tu plan.",
    entityLabelPlural: "usuarios",
    searchPlaceholder: "Buscar por nombre o correo…",
    refreshSuccess: "Lista actualizada",
    primaryAction: "Sumar persona",
    columns: {
      name: "Nombre",
      email: "Correo",
      role: "Rol",
      status: "Estado",
      lastLogin: "Último acceso",
      createdAt: "Alta",
    },
    empty: {
      title: "No hay usuarios",
      filteredTitle: "No se encontraron usuarios",
      filteredDescription: "Prueba ajustando los filtros de búsqueda.",
      description: "Suma a la primera persona de tu equipo.",
      clearFilters: "Quitar filtros",
    },
    filters: {
      statusPlaceholder: "Estado",
      statusAll: "Todos los estados",
      rolePlaceholder: "Rol",
      roleAll: "Todos los roles",
      more: "Más filtros",
      moreHeading: "Filtros por fecha",
      createdHeading: "Fecha de alta",
      lastLoginHeading: "Último acceso",
      from: "Desde",
      to: "Hasta",
      apply: "Aplicar",
      cancel: "Cancelar",
      clearDates: "Limpiar fechas",
      dateButton: "Filtrar por fecha",
      chipStatus: (label: string) => `Estado: ${label}`,
      chipRole: (label: string) => `Rol: ${label}`,
      chipDates: (label: string) => `Fechas: ${label}`,
      rangeBoth: (from: string, to: string) => `${from} - ${to}`,
      rangeFrom: (from: string) => `Desde ${from}`,
      rangeTo: (to: string) => `Hasta ${to}`,
      createdPrefix: (range: string) => `Alta: ${range}`,
      accessPrefix: (range: string) => `Acceso: ${range}`,
    },
    capacity: {
      limited: (active: number, max: number) =>
        `${active} de ${max} usuarios activos`,
      unlimited: (active: number) => `Sin límite (${active} activos)`,
      activeOnly: (active: number) =>
        active === 1
          ? "1 usuario activo"
          : `${active} usuarios activos`,
      limitReachedHint: "Sin plazas libres en tu plan",
      overQuotaHint: (active: number, max: number) =>
        `${active} activos · tu plan incluye ${max}`,
    },
    limitNotice: {
      reachedTitle: "Sin plazas libres en tu plan",
      reachedDescription: (max: number) =>
        `Ya tienes ${max} usuarios activos, el máximo de tu plan. Desactiva una cuenta o amplía el plan para sumar a alguien más.`,
      overQuotaTitle: "Usuarios por encima de tu plan",
      overQuotaDescription: (active: number, max: number) =>
        `Tienes ${active} usuarios activos y tu plan incluye ${max}. Desactiva cuentas de más o amplía el plan.`,
      billingCta: "Ver Tu plan",
    },
  },
  addUser: {
    title: "Sumar persona",
    modes: {
      invite: "Invitar",
      register: "Dar acceso ya",
    },
    inviteDescription:
      "Le enviamos un correo para que active su acceso y elija su contraseña.",
    registerDescription:
      "Creas el acceso ahora con una contraseña. Podrá entrar de inmediato.",
    optionalSection: "Opcional",
    roleHint: "Elige qué podrá hacer en tu empresa.",
    fields: {
      email: "Correo",
      role: "Rol",
      firstName: "Nombre",
      lastName: "Apellido",
      password: "Contraseña",
      passwordHint: "Mayúscula, minúscula y número. O usa «Generar».",
      passwordPlaceholder: "Mínimo 8 caracteres",
    },
    cancel: "Cancelar",
    submitInvite: "Enviar invitación",
    submittingInvite: "Enviando…",
    submitRegister: "Dar acceso",
    submittingRegister: "Guardando…",
    generatePassword: "Generar",
    validationInvite: "Revisa los datos de la invitación",
    validationRegister: "Revisa los datos",
    toasts: {
      inviteSuccess: "Invitación enviada",
      inviteError: "No se pudo enviar la invitación",
      registerSuccess: "Acceso listo",
      registerSuccessDescription: (fullName: string) =>
        `${fullName} ya puede entrar a tu empresa`,
      registerError: "No se pudo dar acceso",
      passwordGenerated: "Contraseña generada",
      passwordGeneratedDescription:
        "Puedes copiarla o cambiarla antes de guardar.",
      passwordCopied: "Contraseña copiada",
      copyFailed: "No se pudo copiar",
    },
  },
  invitations: {
    title: "Invitaciones pendientes",
    description:
      "Correos enviados que aún no se han aceptado. Puedes reenviar el enlace o cancelar la invitación.",
    loading: "Cargando invitaciones…",
    error: "No se pudieron cargar las invitaciones pendientes.",
    columns: {
      email: "Correo",
      role: "Rol",
      expires: "Vence",
      actions: "Acciones",
    },
    resend: "Reenviar invitación",
    cancel: "Cancelar invitación",
    resendError: "No se pudo reenviar",
    cancelError: "No se pudo cancelar",
  },
  limitReached: {
    title: "Sin plazas libres en tu plan",
    description:
      "Tu plan no tiene plazas libres para más usuarios activos. Revisa Tu plan para ampliarlo.",
    descriptionWithLimit: (max: number) =>
      `Tu plan permite hasta ${max} usuarios activos. Revisa Tu plan para ampliarlo.`,
    createDisabled: "Sin plazas libres en tu plan",
    inviteDisabled: "No puedes sumar más personas con tu plan actual.",
  },
  create: {
    title: "Sumar persona",
    subtitle: "Registra a alguien de tu equipo",
    toasts: {
      errorTitle: "No se pudo dar acceso",
      successTitle: "Acceso listo",
      successDescription: (fullName: string) =>
        `${fullName} ya puede entrar a tu empresa`,
    },
  },
  form: {
    createSectionTitle: "Datos de acceso",
    editSectionTitle: "Editar acceso",
    sectionDescription: "Nombre, correo y rol en tu empresa",
    email: "Correo",
    emailCopied: "Correo copiado",
    copyEmailAria: "Copiar correo",
    copyFailed: "No se pudo copiar",
    roleHintCreate: "Elige qué podrá hacer en tu empresa.",
    roleHintEdit:
      "Si bajas el rol, la persona puede perder acceso a algunas pantallas.",
    password: "Contraseña",
    passwordHint:
      "Mayúscula, minúscula y número. O usa «Generar». Podrá cambiarla después.",
    passwordPlaceholder: "Mínimo 8 caracteres",
    generatePassword: "Generar",
    passwordGenerated: "Contraseña generada",
    passwordGeneratedDescription:
      "Puedes copiarla o cambiarla antes de guardar.",
    passwordCopied: "Contraseña copiada",
    validationSummary: "Revisa los datos",
    submitCreate: "Dar acceso",
    submitEdit: "Guardar cambios",
  },
  detail: {
    email: "Correo",
    toasts: {
      statusSuccess: "Usuario actualizado",
      statusError: "Error al actualizar usuario",
    },
  },
  invite: {
    toasts: {
      errorTitle: "No se pudo enviar la invitación",
    },
  },
  status: {
    updateSuccess: "Usuario actualizado",
    updateError: "Error al actualizar usuario",
  },
} as const;
