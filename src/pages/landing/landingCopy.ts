/**
 * Copy de la landing pública (`/welcome`).
 * Namespace: landing.copy.*
 * Alineado a SoT comercial v5 motriz (bandas Micro/Pequeña/Mediana/Grande).
 * Handoff Capa 1 (D1–D12): embudo outcome → prueba → precio.
 */
import { BRAND } from "@shared/ui/brand";

export const landingCopy = {
  brand: BRAND.productName,
  brandByline: BRAND.productByline,
  brandTagline: "Operación y facturación para transporte en México",
  skipLink: "Saltar al contenido",

  nav: {
    product: "Qué incluye",
    pricing: "Precios",
    optionals: "Opcionales",
    login: "Iniciar sesión",
    register: "Probar gratis",
    contactSales: "Contactar ventas",
  },

  hero: {
    /** @deprecated No renderizar: la prueba vive en `trialHint`. */
    badgeOpen: "Prueba 14 días · sin tarjeta",
    /** Cuando el registro público está cerrado. */
    badgeClosed: "Alta con acompañamiento comercial",
    title: "Opera tu flota desde el primer día",
    subtitle:
      "Viajes, flota y clientes en un solo lugar. Factura en México cuando cargues tu sello (CSD).",
    ctaPrimaryOpen: "Probar gratis",
    ctaPrimaryClosed: "Contactar ventas",
    ctaLogin: "Ya tengo cuenta",
    trialHint:
      "14 días · 15 timbres de prueba · sin tarjeta · empiezas en Operación Micro",
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
    ariaLabel: "Facturación fiscal mexicana",
    items: [
      { label: "CFDI 4.0", hint: "Timbrado CFDI" },
      { label: "Carta Porte 3.1", hint: "Complemento de traslado" },
      { label: "REP", hint: "Complemento de pagos" },
    ],
  },

  /** Sección única: núcleo L0 (fusiona features + included). */
  product: {
    id: "producto",
    title: "Qué incluye el núcleo operativo",
    subtitle:
      "El mismo alcance en los cuatro planes Operación. La diferencia entre bandas es capacidad (motrizes, usuarios, sucursales e historial), no funciones básicas.",
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
          "Alta de viaje por pasos",
          "Seguimiento de paradas",
          "Gastos de viaje y aprobaciones",
          "Equipo de apoyo y su compensación",
        ],
      },
      {
        title: "Clientes y personal",
        description:
          "Directorio comercial, conductores y base operativa con roles y permisos.",
        bullets: [
          "Clientes y contactos",
          "Conductores y licencias",
          "Roles y permisos para oficina, patio y finanzas",
        ],
      },
      {
        title: "Facturación y finanzas",
        description:
          "Ciclo fiscal mexicano ligado a la operación: timbrar, cobrar y aprobar.",
        bullets: [
          "CFDI 4.0, Carta Porte 3.1 y REP",
          "Aprobaciones de gastos y operación",
          "Exposición de crédito (sin bloqueo)",
        ],
      },
    ],
  },

  optionals: {
    id: "opcionales",
    title: "Opcionales",
    subtitle:
      "Módulos que se contratan aparte, sobre cualquier plan Operación. Aún no están en disponibilidad general.",
    badge: "En preparación",
    items: [
      {
        title: "Combustible",
        description:
          "Controla cargas, rendimientos y anomalías. Aún no se contrata.",
      },
      {
        title: "Mantenimiento",
        description:
          "Programa el preventivo y el correctivo de tus unidades. Aún no se contrata.",
      },
      {
        title: "Seguimiento GPS",
        description:
          "Rastreo móvil avanzado, aparte del seguimiento de paradas ya incluido. Aún no se contrata.",
      },
    ],
    footnote:
      "Los opcionales se contratan aparte, sobre cualquier plan Operación. Cuando estén disponibles, el detalle de tu cuenta estará en Configuración → Tu plan.",
  },

  pricing: {
    id: "pricing",
    title: "Planes Operación",
    subtitle:
      "Pagas por motriz. Cada banda incluye cupo de usuarios, sucursales e historial consultable — sin cargo fijo de cuenta.",
    /** Footnote suave: sin promesa de descuento anual como SoT. */
    annualNote: "¿Facturación anual? Consulta con ventas.",
    optionalsNote:
      "Opcionales y packs se contratan aparte y no incluyen capacidad extra del plan.",
    optionalsLink: "Ver opcionales",
    priceHint:
      "Precios MXN por motriz · mes · sin IVA · sin cargo fijo de cuenta · prueba 14 días sin tarjeta",
    priceHintClosed:
      "Precios MXN por motriz · mes · sin IVA · sin cargo fijo de cuenta · alta con ventas",
    familyLabel: "Operación",
    cta: "Probar gratis",
    /** Grande / cotización: no vender «prueba» como si hubiera P de lista. */
    ctaQuote: "Solicitar cotización",
    ctaSecondary: "Hablar con ventas",
    popularBadge: "Más elegido",
    popularCode: "operacion_pequena",
    featureLabels: {
      fleet: "Motrices (rango de la banda)",
      users: "Usuarios",
      branches: "Sucursales",
      stamps: "Timbres / motriz",
      history: "Historial",
      l0: "Núcleo incluido (CFDI, Carta Porte, REP)",
    },
    audiences: {
      operacion_micro:
        "1 a 5 motrices: digitalizas viajes y facturas sin un cargo fijo extra.",
      operacion_pequena: "6 a 30 motrices: más usuarios, sucursales e historial.",
      operacion_mediana: "31 a 100 motrices: varias sucursales y más equipo.",
      operacion_grande: "Más de 100 motrices: precio y cupos a medida.",
    } as Record<string, string>,
  },

  cta: {
    title: `Prueba ${BRAND.productName} en tu operación`,
    subtitle:
      "Crea tu empresa, opera con el núcleo incluido y factura con reglas fiscales mexicanas. Sin tarjeta para iniciar la prueba.",
    primary: "Crear cuenta — es gratis",
    secondary: "Hablar con ventas",
    trialHint: "14 días · 15 timbres · sin tarjeta",
    closedTitle: `¿Listo para operar con ${BRAND.productName}?`,
    closedSubtitle:
      "El alta de empresa la hace el equipo comercial. Si ya tienes cuenta, inicia sesión.",
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
    copyright: (year: number) =>
      `© ${year} ${BRAND.companyName}. Todos los derechos reservados.`,
  },
} as const;
