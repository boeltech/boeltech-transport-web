/**
 * Copy de la landing pública (`/welcome`).
 * Namespace: landing.copy.*
 * Alineado a SoT comercial v3.2 (§3.2 núcleo L0, §4 add-ons, §6.6 trial).
 * Handoff Capa 1 (D1–D7): embudo outcome → prueba → precio.
 */
import { BRAND } from "@shared/ui/brand";

export const landingCopy = {
  brand: BRAND.productName,
  brandByline: BRAND.productByline,
  brandTagline: "Operación y facturación para transporte en México",

  nav: {
    product: "Qué incluye",
    pricing: "Precios",
    optionals: "Opcionales",
    login: "Iniciar sesión",
    register: "Probar gratis",
    contactSales: "Contactar ventas",
  },

  hero: {
    /** Solo cuando self-serve está abierto. */
    badgeOpen: "Prueba 14 días · sin tarjeta",
    /** Cuando el registro público está cerrado. */
    badgeClosed: "Alta con acompañamiento comercial",
    title: "Opera y factura tu flota desde el día uno",
    subtitle:
      "Viajes, flota y clientes en un solo lugar — con timbrado fiscal listo para México.",
    ctaPrimaryOpen: "Comenzar prueba gratis",
    ctaPrimaryClosed: "Contactar ventas",
    ctaLogin: "Ya tengo cuenta",
    trialHint:
      "14 días · 15 timbres de prueba · sin tarjeta · cualquier plan Operación",
  },

  preview: {
    windowTitle: `${BRAND.productName} · Viaje y facturación`,
    panelTitle: "Viajes recientes",
    panelHint: "Hoy",
    navItems: [
      "Dashboard",
      "Viajes",
      "Flota",
      "Clientes",
      "Facturación",
      "Reportes",
    ],
    /** Franja compacta: operación + fiscal (no KPIs genéricos). */
    statusStrip: [
      { label: "En ruta", value: "VJ-1042" },
      { label: "Timbrado", value: "CFDI listo" },
    ],
    trips: [
      {
        code: "VJ-1042",
        route: "GDL → MTY",
        status: "En ruta",
        fiscal: "Carta Porte",
      },
      {
        code: "VJ-1038",
        route: "CDMX → QRO",
        status: "Entregado",
        fiscal: "Timbrado",
      },
      {
        code: "VJ-1031",
        route: "TIJ → Hermosillo",
        status: "Programado",
        fiscal: "Pendiente",
      },
      {
        code: "VJ-1024",
        route: "MTY → Saltillo",
        status: "En ruta",
        fiscal: "CFDI + REP",
      },
    ],
  },

  trust: {
    ariaLabel: "Cumplimiento fiscal mexicano",
    items: [
      { label: "CFDI 4.0", hint: "Timbrado fiscal" },
      { label: "Carta Porte 3.1", hint: "Complemento SAT" },
      { label: "REP", hint: "Complementos de pago" },
    ],
  },

  /** Sección única: núcleo L0 (fusiona features + included). */
  product: {
    id: "producto",
    title: "Qué incluye el núcleo operativo",
    subtitle:
      "El mismo alcance en los cuatro planes Operación. La diferencia entre tiers es capacidad (usuarios, sucursales, timbres), no funciones básicas.",
    includedBadge: "Incluido",
    items: [
      {
        title: "Flota",
        description: "Inventario de vehículos y datos operativos de la unidad.",
        bullets: [
          "Catálogo de vehículos",
          "Asignación a viajes",
          "Estatus operativo",
        ],
      },
      {
        title: "Viajes",
        description:
          "Programación, paradas, carga y seguimiento operativo sin depender de un add-on de GPS.",
        bullets: [
          "Wizard de alta",
          "Seguimiento de paradas",
          "Gastos de viaje y aprobaciones",
        ],
      },
      {
        title: "Clientes y personal",
        description:
          "Directorio comercial, conductores y base operativa con roles y permisos.",
        bullets: [
          "Clientes y contactos",
          "Conductores y licencias",
          "7 roles con acceso por permiso",
        ],
      },
      {
        title: "Facturación y finanzas",
        description:
          "Ciclo fiscal mexicano ligado a la operación: timbrar, cobrar y aprobar.",
        bullets: [
          "CFDI 4.0, Carta Porte 3.1 y REP",
          "Hub de aprobaciones",
          "Exposición de crédito (sin bloqueo)",
        ],
      },
    ],
  },

  optionals: {
    id: "opcionales",
    title: "Opcionales",
    subtitle:
      "Módulos de rentabilidad à la carte. Se activan sobre cualquier plan Operación; no forman parte del núcleo incluido.",
    badge: "Opcional",
    items: [
      {
        title: "Combustible",
        description: "Cargas, rendimientos y anomalías (módulo de rentabilidad).",
      },
      {
        title: "Mantenimiento",
        description: "Programa preventivo y correctivo como add-on de flota.",
      },
      {
        title: "Seguimiento GPS",
        description:
          "Tracking móvil avanzado; distinto del seguimiento operativo incluido.",
      },
      {
        title: "Equipo de apoyo en viajes",
        description:
          "Asignación y compensación de personal de apoyo (paywall hasta contratarlo).",
      },
    ],
    footnote:
      "Los precios y disponibilidad de opcionales viven en el catálogo comercial. En la app puedes consultar tu plan en Configuración → Tu plan.",
  },

  pricing: {
    id: "pricing",
    title: "Planes Operación",
    subtitle:
      "Elige capacidad según el tamaño de tu flota. El mismo núcleo en todos los tiers: viajes, flota, clientes y facturación fiscal MX.",
    annualNote: "Pago anual: −15% sobre el precio de lista del plan Operación.",
    optionalsNote:
      "Opcionales y packs se contratan aparte y no incluyen capacidad extra del plan.",
    priceHint: "Precios de lista MXN · sin IVA · prueba 14 días sin tarjeta",
    priceHintClosed: "Precios de lista MXN · sin IVA · alta con ventas",
    familyLabel: "Operación",
    cta: "Empezar prueba gratis",
    ctaSecondary: "Hablar con ventas",
    popularBadge: "Más elegido",
    popularCode: "operacion_crecimiento",
    featureLabels: {
      fleet: "Flota orientativa",
      users: "Usuarios",
      branches: "Sucursales",
      stamps: "Timbres / mes",
      l0: "Núcleo incluido (CFDI, Carta Porte, REP)",
    },
    audiences: {
      operacion_esencial:
        "Para flotas compactas que digitalizan operación y facturan en regla.",
      operacion_crecimiento:
        "Para PyMEs en expansión que necesitan más usuarios, sucursales y timbres.",
      operacion_escala:
        "Para operación multi-sucursal con mayor volumen fiscal y de equipo.",
      operacion_corporativo:
        "Para redes grandes: capacidad abierta y acompañamiento comercial.",
    } as Record<string, string>,
  },

  cta: {
    title: `Prueba ${BRAND.productName} en tu operación`,
    subtitle:
      "Crea tu empresa, opera con el núcleo incluido y factura con reglas fiscales mexicanas. Sin tarjeta para iniciar la prueba.",
    primary: "Crear cuenta y empezar",
    secondary: "Hablar con ventas",
    trialHint: "14 días · 15 timbres · sin tarjeta",
    closedTitle: `¿Listo para operar con ${BRAND.productName}?`,
    closedSubtitle:
      "El registro público está cerrado por ahora. Contáctanos para alta de empresa o inicia sesión si ya tienes cuenta.",
    closedPrimary: "Hablar con ventas",
  },

  footer: {
    product: "Producto",
    legal: "Legal",
    company: "Empresa",
    terms: "Términos de servicio",
    privacy: "Política de privacidad",
    support: "Soporte",
    tagline: "Operación y facturación para transporte en México",
    nameOrigin: `${BRAND.productName} es un producto de ${BRAND.companyName} para operación y facturación de transporte en México.`,
    copyright: (year: number) =>
      `© ${year} ${BRAND.companyName}. Todos los derechos reservados.`,
  },
} as const;
