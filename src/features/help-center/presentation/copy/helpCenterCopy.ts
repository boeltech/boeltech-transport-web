export const helpCenterCopy = {
  panel: {
    title: "Ayuda",
    searchPlaceholder: "Buscar en ayuda…",
    forThisScreen: "Para esta pantalla",
    frequentArticles: "Artículos frecuentes",
    noResults: "No se encontraron artículos.",
    noScreenArticles: "No hay artículos específicos para esta pantalla.",
    /** N=0 → «Mis tickets»; N>0 → «Mis tickets (N)» (solo open + in_progress). */
    myTickets: (n = 0) => (n > 0 ? `Mis tickets (${n})` : "Mis tickets"),
    viewAllArticles: "Ver todos los artículos",
    notFoundAnswer: "¿No encontraste respuesta?",
    sendTicket: "Enviar un ticket",
    contactByEmail: "Contactar por correo",
    viewFullArticle: "Ver artículo completo",
    moreSteps: "Hay más pasos en el artículo completo",
    didntSolve: "¿No resolvió tu problema?",
  },
  index: {
    title: "Ayuda",
    description: "Guías y artículos para operar día a día",
    entityLabel: "artículos",
    emptyTitle: "Sin artículos",
    emptyDescription: "No hay artículos de ayuda disponibles.",
    searchNoResults: "No se encontraron artículos para tu búsqueda.",
  },
  detail: {
    backLabel: "Ayuda",
    stepsSection: "Pasos",
    problemSection: "Si no funciona",
    sendTicketAboutThis: "Enviar un ticket sobre esto",
    groupLabel: "Grupo",
    notFoundTitle: "Artículo no encontrado",
    notFoundDescription:
      "El artículo que buscas no existe o no está disponible para tu rol.",
    notFoundAction: "Volver a Ayuda",
  },
  /** PRD Ola A §F / TEC §5.5 — feedback «¿Te sirvió?» */
  feedback: {
    question: "¿Te sirvió este artículo?",
    yes: "Sí",
    no: "No",
    thanks: "Gracias",
    sendTicketAboutThis: "Enviar un ticket sobre esto",
    problemLink: "Si no funciona",
  },
  /** PRD Ola A §F / TEC §4 — superficies A2 (empty + ⌘K) */
  surfaces: {
    viewHelp: "Ver ayuda",
    commandGroup: "Ayuda",
  },
  /** PRD Ola A §F / TEC §3 — spotlight A1 */
  spotlight: {
    cta: "Muéstrame dónde",
    done: "Listo",
    unavailable: "No está disponible en esta vista",
    sendTicket: "Enviar un ticket sobre esto",
    showProblem: "Si no funciona",
  },

  groups: {
    facturacion: "Facturación",
    viajes: "Viajes",
    operacion: "Operación",
    comercial: "Comercial",
    finanzas: "Finanzas",
    reportes: "Reportes",
    portales: "Portales",
    concepto_fiscal: "Conceptos de factura",
    administracion: "Administración",
  } as Record<string, string>,
  aria: {
    openHelp: "Ayuda",
  },
  // ── Tickets ──────────────────────────────────────────
  tickets: {
    title: "Mis tickets",
    description: "Tickets de soporte que has enviado",
    emptyTitle: "Sin tickets",
    emptyDescription: "No has enviado ningún ticket aún.",
    columns: {
      description: "Descripción",
      article: "Artículo",
      status: "Estado",
      date: "Fecha",
    },
  },
  /** UI pausa cuando VITE_HELP_TICKETS_ENABLED=false (escape = mailto). */
  ticketsPaused: {
    title: "Tickets de soporte temporalmente no disponibles.",
    description:
      "Mientras tanto, escribe a soporte por correo; incluye la pantalla donde estabas.",
    deepLink:
      "El envío de tickets está pausado mientras actualizamos las guías…",
    panelHint:
      "Estamos mejorando las guías. Mientras tanto, escríbenos por correo.",
    backToHelp: "Volver a Ayuda",
  },
  ticketDetail: {
    title: "Detalle del ticket",
    backLabel: "Mis tickets",
    contextSection: "Contexto",
    pageLabel: "Página",
    articleLabel: "Artículo",
    roleLabel: "Rol",
    messageSection: "Mensaje",
    attachmentsSection: "Adjuntos",
    download: "Descargar",
    downloadError: "No se pudo descargar el archivo. Intenta de nuevo.",
    notFoundTitle: "Ticket no encontrado",
    notFoundDescription: "El ticket no existe o no tienes acceso.",
    notFoundAction: "Volver a Mis tickets",
  },
  createTicket: {
    title: "Nuevo ticket",
    contextSection: "Contexto",
    companyLabel: "Empresa",
    pageLabel: "Página",
    articleLabel: "Artículo",
    bodyLabel: "Descripción",
    bodyPlaceholder: "Describe tu consulta o problema…",
    bodyMinChars: "Mínimo 10 caracteres",
    attachmentLabel: "Adjunto (opcional)",
    attachmentDrop: "Arrastra o selecciona un archivo",
    attachmentAccepted: "PDF o imagen (JPEG, PNG, WebP). Máx. 10 MB.",
    attachmentTooLarge: "El archivo excede 10 MB.",
    attachmentInvalidType: "Solo se permiten imágenes (JPEG, PNG, WebP) o PDF.",
    remove: "Quitar",
    submit: "Enviar ticket",
    submitting: "Enviando…",
    errorCreate: "Error al crear el ticket",
  },
  status: {
    open: "Abierto",
    in_progress: "En curso",
    resolved: "Resuelto",
  } as Record<string, string>,
} as const;
