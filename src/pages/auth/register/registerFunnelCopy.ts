/**
 * Copy del embudo de registro self-serve.
 * Namespace: register.funnel.copy.*
 * SoT v5 motriz — preferencia orientativa; alta real inicia en Micro.
 */
export const registerFunnelCopy = {
  /** Única mención de trial en viewport (panel / mobile stepper). D5 */
  trialHint: "Prueba gratis 14 días · 15 timbres · sin tarjeta",

  panel: {
    progressLabel: "Registro",
    progressTitle: "Crea el espacio de tu empresa",
    progressHint: "Cuatro pasos cortos. Menos de cinco minutos.",
    stepOf: (current: number, total: number) => `Paso ${current} de ${total}`,
  },

  steps: {
    company: {
      title: "Tu empresa",
      shortLabel: "Empresa",
      description: "Nombre comercial e identificador para iniciar sesión",
      panelHint: "Cómo te reconocerán al entrar al ERP",
    },
    plan: {
      title: "Plan y flota",
      shortLabel: "Plan",
      description:
        "Preferencia orientativa según el tamaño de tu operación",
      panelHint: "Cupos y precio por motriz — la preferencia no compra el plan",
    },
    admin: {
      title: "Administrador",
      shortLabel: "Admin",
      description:
        "Datos del usuario administrador. Usa un correo permanente (no temporal).",
      panelHint: "Tu usuario principal con correo permanente",
    },
    confirm: {
      title: "Confirmar",
      shortLabel: "Confirmar",
      description: "Revisa los datos y crea tu cuenta",
      panelHint: "Revisa y activa tu periodo de prueba",
    },
  },

  progressAria: "Pasos del registro",

  company: {
    nameLabel: "Nombre de la empresa",
    namePlaceholder: "Mi empresa de transporte",
    nameHint: "Nombre comercial que verán tus usuarios en el ERP.",
    subdomainLabel: "Empresa",
    subdomainPlaceholder: "mi-empresa",
    subdomainHint:
      "Solo minúsculas, números y guiones. Será el campo «Empresa» al iniciar sesión.",
    subdomainAvailable: "Disponible",
    subdomainUnavailable: "Este identificador no está disponible.",
    subdomainUseSuggestion: (suggestion: string) => `Usar ${suggestion}`,
  },

  plan: {
    fleetLabel: "¿Cuántas unidades operas?",
    fleetPlaceholder: "Opcional — tip de plan",
    fleetNone: "Sin declarar (plan Micro por defecto)",
    fleetHint:
      "Rangos orientativos del catálogo comercial. No bloquean una preferencia distinta.",
    planLabel: "Plan preferido",
    planHint:
      "Preferencia orientativa: exploras cupos y precio por motriz. La banda de cobro la fija tu flota activa (Q_fact). El alta self-serve inicia en prueba con Operación Micro.",
    recommendedBadge: "Recomendado",
    orientativeBadge: "Orientativo",
    previewTitle: "Resumen orientativo",
    priceListLabel: "Precio por motriz",
    capacityLabel: "Capacidad",
    trialNote: "Incluye prueba: 14 días · 15 timbres · sin tarjeta",
    priceNote:
      "Sin IVA · sin fee · la preferencia no compra el plan; el cobro real depende de tu flota (Q_fact) al salir de prueba",
  },

  admin: {
    firstNameLabel: "Nombre",
    firstNamePlaceholder: "Tu nombre",
    lastNameLabel: "Apellido",
    lastNamePlaceholder: "Tus apellidos",
    emailLabel: "Correo electrónico",
    emailPlaceholder: "admin@tuempresa.com",
    passwordLabel: "Contraseña",
    passwordPlaceholder: "Mínimo 8 caracteres",
    confirmPasswordLabel: "Confirmar contraseña",
    confirmPasswordPlaceholder: "Repite tu contraseña",
  },

  confirm: {
    company: "Empresa",
    admin: "Administrador",
    plan: "Preferencia comercial",
    fleet: "Flota declarada",
    fleetNone: "Sin declarar",
    preferredPlan: "Plan preferido",
    serverNote:
      "Guardamos tu preferencia de plan y la flota declarada. El alta inicia en periodo de prueba con Operación Micro. La banda de cobro la fija tu flota activa (Q_fact); la preferencia es solo orientativa.",
    acceptTerms: "Acepto los términos y condiciones",
    termsPrefix: "Al registrarte aceptas nuestros",
    terms: "términos de servicio",
    and: "y",
    privacy: "política de privacidad",
  },

  validation: {
    summaryTitle: "Revisa los datos de este paso",
    subdomainTaken: "Elige otro identificador de empresa o usa la sugerencia.",
  },

  actions: {
    continue: "Continuar",
    back: "Atrás",
    create: "Crear cuenta",
    creating: "Creando…",
  },

  closed: {
    title: "Registro público cerrado",
    description:
      "Por ahora no aceptamos altas por cuenta propia. Si ya tienes invitación, ábrela desde tu correo. Para una cuenta nueva, contacta a Boeltech.",
    contact: "Contactar ventas",
    contactHref: "mailto:ventas@boeltech.com",
    login: "Iniciar sesión",
    home: "Volver al inicio",
  },

  loginPrompt: "¿Ya tienes cuenta?",
  loginLink: "Iniciar sesión",
} as const;
