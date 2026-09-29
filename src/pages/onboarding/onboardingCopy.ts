/**
 * Copy del onboarding de producto.
 * Namespace: onboarding.copy.*
 * Paso plan (founder): A = sin funnel (invitación/plataforma); B = preferencia en sesión.
 */
import { BRAND } from "@shared/ui/brand";
import type { OnboardingFamily } from "./onboardingFamily";

export const onboardingCopy = {
  header: {
    title: "Primeros pasos",
    subtitle: `Prepara tu cuenta en ${BRAND.productName}`,
    back: "Volver",
    submitFounder: "Ir a Datos para facturar",
    submitHouse: (house: string) => `Ir a ${house}`,
    submitting: "Guardando…",
    stepsAria: "Pasos de bienvenida",
  },
  houses: {
    admin: "Datos para facturar",
    founder: "Datos para facturar",
    manager: "Viajes",
    dispatcher: "Viajes",
    operator: "Viajes",
    accountant: "Por facturar",
    driver: "Mis viajes",
    client: "Mis envíos",
  },
  steps: {
    welcome: {
      title: "Bienvenida",
      description: `Tu cuenta en ${BRAND.productName}`,
    },
    preferences: {
      title: "Apariencia",
      description: "Claro, oscuro o el de tu computadora",
    },
    plan: {
      title: "Tu plan",
      descriptionA: "Dónde consultarlo",
      descriptionB: "Tu prueba de 14 días",
    },
    handshake: {
      title: "Listo",
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
    founderBody: (name: string) =>
      `Hola, ${name}. En un momento eliges cómo se ve la pantalla y te decimos dónde consultar el plan de la empresa. Al terminar te llevamos a Datos para facturar, para cargar la información con la que tu empresa factura a sus clientes. Estos pasos no vuelven a aparecer.`,
  },
  handshake: {
    dispatcher: {
      title: (name: string) => `${name}, tu día empieza en Viajes`,
      body: "Ahí reservas e inicias los viajes. No es la lista de facturas ni la de usuarios.",
    },
    operator: {
      title: (name: string) => `${name}, cargas los gastos en Viajes`,
      body: "Ahí cargas casetas, combustible y extras. Tu trabajo no es reservar ni facturar.",
    },
    manager: {
      title: (name: string) => `${name}, empiezas en Viajes`,
      body: "Ahí organizas los viajes, las unidades y los conductores. No es la lista de facturas ni la de usuarios.",
    },
    accountant: {
      title: (name: string) => `${name}, empiezas en Por facturar`,
      body: "Ahí facturas los viajes que ya están listos. No es donde se organizan los viajes ni la lista de usuarios.",
    },
    driver: {
      title: (name: string) => `${name}, empiezas en Mis viajes`,
      body: "Ahí inicias y completas los viajes que te asignaron. No reservas ni cargas gastos.",
    },
    client: {
      title: (name: string) => `${name}, empiezas en Mis envíos`,
      body: "Ahí consultas el estado de tus envíos. No los creas ni los mueves.",
    },
    admin: {
      title: (name: string) => `${name}, empiezas en Datos para facturar`,
      body: "Ahí cargas la información con la que la empresa factura a sus clientes. No es la lista de viajes ni la de usuarios.",
    },
  },
  preferences: {
    themeLabel: "Apariencia",
    themeHint:
      "Claro, oscuro o el mismo que tu computadora. Después lo cambias con el botón de tema, arriba a la derecha.",
  },
  plan: {
    assignedTitle: "El plan de tu empresa",
    assignedParagraphs: [
      "El plan ya quedó asignado al crear la empresa. Aquí no se elige ni se cambia.",
      "Para ver el nombre del plan, los folios para facturar (timbres) y lo que hay por pagar, entra después a Configuración → Tu plan.",
      `El siguiente paso es Datos para facturar: son los datos de la empresa para emitir facturas a tus clientes, no el plan que le pagas a ${BRAND.productName}.`,
    ],
    assignedFooter: "Al continuar, vamos a Datos para facturar.",
    trialTitle: "Estás en periodo de prueba",
    trialBody:
      "Tienes 14 días y 15 folios para facturar (timbres). No pedimos tarjeta. El recuento y la fecha de fin están en Configuración → Tu plan.",
    preferenceTitle: "Lo que indicaste al registrarte",
    preferenceBody: (planName: string) =>
      `Elegiste ${planName} como referencia. La prueba arranca con Operación Micro. Eso no es el cobro final; el detalle vigente está en Tu plan.`,
    fleetIndicated: (label: string) => `Flota que indicaste: ${label}`,
    ctaSubscription: "Ver Tu plan",
    ctaHint:
      "Puedes abrir Tu plan ahora o, al terminar, ir a Datos para facturar.",
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
    successTitle: "Listo",
    successDescription: "Ya no verás estos pasos la próxima vez que entres.",
    errorTitle: "No se pudo guardar",
  },
} as const;

export function resolveOnboardingHandshake(
  role: string | null | undefined,
  name: string,
): { title: string; body: string } {
  const slots = onboardingCopy.handshake;
  switch (role) {
    case "dispatcher":
      return { title: slots.dispatcher.title(name), body: slots.dispatcher.body };
    case "operator":
      return { title: slots.operator.title(name), body: slots.operator.body };
    case "manager":
      return { title: slots.manager.title(name), body: slots.manager.body };
    case "accountant":
      return { title: slots.accountant.title(name), body: slots.accountant.body };
    case "driver":
      return { title: slots.driver.title(name), body: slots.driver.body };
    case "client":
      return { title: slots.client.title(name), body: slots.client.body };
    case "admin":
      return { title: slots.admin.title(name), body: slots.admin.body };
    default:
      return { title: slots.dispatcher.title(name), body: slots.dispatcher.body };
  }
}

export function resolveOnboardingHouseLabel(
  role: string | null | undefined,
  family?: OnboardingFamily,
): string {
  if (family === "founder") {
    return onboardingCopy.houses.founder;
  }

  switch (role) {
    case "admin":
      return onboardingCopy.houses.admin;
    case "accountant":
      return onboardingCopy.houses.accountant;
    case "driver":
      return onboardingCopy.houses.driver;
    case "client":
      return onboardingCopy.houses.client;
    default:
      return onboardingCopy.houses.manager;
  }
}
