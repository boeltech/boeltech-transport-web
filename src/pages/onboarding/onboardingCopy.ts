/**
 * Copy del onboarding de producto.
 * Namespace: onboarding.copy.*
 */
export const onboardingCopy = {
  header: {
    title: "Asistente de primer acceso",
    subtitle: "Configura tu experiencia en Boeltech ERP",
    back: "Volver",
    submit: "Finalizar y guardar",
    submitting: "Guardando…",
    stepsAria: "Pasos del onboarding de producto",
  },
  steps: {
    welcome: {
      title: "Bienvenida",
      description: "Tu cuenta en Boeltech ERP",
    },
    preferences: {
      title: "Preferencias",
      description: "Apariencia del sistema",
    },
    plan: {
      title: "Tu plan",
      description: "Prueba, límites y consumo",
    },
    workspace: {
      title: "Tu espacio",
      description: "Qué verás según tu rol",
    },
    review: {
      title: "Confirmar",
      description: "Finalizar asistente",
    },
  },
  welcome: {
    body: (name: string, roleLabel: string) =>
      roleLabel
        ? `Hola, ${name}. Este asistente configura tu primera experiencia: preferencias, una vista de tu plan comercial y el menú según tu rol (${roleLabel}). Al finalizar, no volveremos a mostrarlo en tus próximos accesos.`
        : `Hola, ${name}. Este asistente configura tu primera experiencia: preferencias, una vista de tu plan comercial y el menú según tu rol. Al finalizar, no volveremos a mostrarlo en tus próximos accesos.`,
  },
  preferences: {
    themeLabel: "Apariencia",
    themeHint:
      "Claro, oscuro o según el sistema. Es la misma preferencia del botón de tema en la barra superior.",
  },
  plan: {
    preferredTitle: "Preferencia al registrarte",
    fleetLabel: "Flota declarada",
    fleetNone: "Sin declarar",
    planLabel: "Plan preferido",
    serverTitle: "Estado en el servidor",
    serverBody:
      "El alta pública guarda tu plan y flota declarada, y deja la suscripción en prueba. Consulta Plan y consumo para ver estado, fin de prueba y cupo reales.",
    trialTitle: "Periodo de prueba",
    trialBody:
      "14 días · 15 timbres · sin tarjeta. El detalle vigente de tu tenant (estado En prueba, fechas y cupo) aparece en Plan y consumo.",
    limitsTitle: "Capacidad del plan (lista)",
    ctaSubscription: "Ver plan y consumo",
    ctaHint: "Abre Configuración → Plan y consumo cuando termines el asistente.",
  },
  workspace: {
    body: "El menú lateral muestra solo los módulos que aplican a tu rol: viajes, vehículos, clientes, facturación y más. Si no ves una sección, es porque tu administrador no la ha habilitado para tu perfil.",
    tips: [
      "Usa la búsqueda y los filtros en los listados para trabajar más rápido.",
      "Desde tu perfil puedes actualizar datos de cuenta cuando lo permita la empresa.",
    ],
  },
  review: {
    body: "Al pulsar Finalizar y guardar, registramos en el servidor que completaste el onboarding y podrás usar el tablero y los módulos según tu rol. Este estado se conserva en tus próximos inicios de sesión.",
  },
  toast: {
    successTitle: "Configuración guardada",
    successDescription: "Tu progreso quedó registrado en el servidor.",
    errorTitle: "No se pudo finalizar",
  },
} as const;
