/**
 * Copy de la landing pública (`/welcome`).
 * Namespace: landing.copy.*
 * Alineado a SoT comercial v3.2 (§3.2 núcleo L0, §4 add-ons, §6.6 trial).
 */
export const landingCopy = {
  brand: "Boeltech ERP",
  brandTagline: "Operación y facturación para transporte en México",

  nav: {
    features: "Características",
    included: "Incluido",
    pricing: "Precios",
    addons: "Add-ons",
    login: "Iniciar sesión",
    register: "Probar gratis",
    contactSales: "Contactar ventas",
  },

  hero: {
    badge: "Prueba 14 días · sin tarjeta",
    title: "Opera y factura tu flota con CFDI y Carta Porte desde el día uno",
    subtitle:
      "Viajes, flota, clientes y timbrado fiscal (CFDI 4.0, Carta Porte 3.1 y REP) en un solo ERP para transporte en México.",
    ctaPrimary: "Comenzar prueba gratis",
    ctaSecondary: "Ya tengo cuenta",
    trialHint:
      "14 días · 15 timbres de prueba · sin tarjeta · cualquier plan Operación",
  },

  preview: {
    windowTitle: "Boeltech ERP · Operaciones",
    listTitle: "Viajes recientes",
    listHint: "Hoy",
    navItems: [
      "Dashboard",
      "Viajes",
      "Flota",
      "Clientes",
      "Facturación",
      "Reportes",
    ],
    kpis: [
      { label: "En ruta", value: "12", delta: "+8%" },
      { label: "Timbrados", value: "48", delta: "+12%" },
      { label: "Flota", value: "26", delta: "+2" },
      { label: "Sucursales", value: "3", delta: "OK" },
    ],
    trips: [
      { code: "VJ-1042", route: "GDL → MTY", status: "En ruta" },
      { code: "VJ-1038", route: "CDMX → QRO", status: "Entregado" },
      { code: "VJ-1031", route: "TIJ → Hermosillo", status: "Programado" },
      { code: "VJ-1024", route: "MTY → Saltillo", status: "En ruta" },
    ],
  },

  trust: {
    ariaLabel: "Capacidades del núcleo operativo",
    items: [
      { label: "CFDI 4.0", hint: "Timbrado fiscal" },
      { label: "Carta Porte 3.1", hint: "Complemento SAT" },
      { label: "REP", hint: "Complementos de pago" },
      { label: "7 roles RBAC", hint: "Acceso por permiso" },
    ],
  },

  features: {
    id: "features",
    title: "Todo lo que incluye el núcleo operativo",
    subtitle:
      "El mismo alcance en los cuatro planes Operación. La diferencia entre tiers es capacidad (usuarios, sucursales, timbres), no funciones básicas.",
    items: [
      {
        title: "Seguimiento operativo",
        description:
          "Paradas, eventos de viaje y estado de la operación sin depender de un add-on de GPS.",
      },
      {
        title: "Control de acceso",
        description:
          "Roles y permisos granulares para despacho, finanzas, operación y administración.",
      },
      {
        title: "Reportes operativos",
        description:
          "Dashboard y reportes básicos para decidir con datos de tu operación diaria.",
      },
      {
        title: "Facturación fiscal MX",
        description:
          "CFDI 4.0, Carta Porte 3.1, REP, sustitución y cobranza multi-factura.",
      },
    ],
  },

  included: {
    id: "included",
    title: "Módulos incluidos en tu plan",
    subtitle:
      "Digitaliza la operación y factura en regla. Los módulos de rentabilidad se contratan aparte.",
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
        description: "Programación, paradas, carga y seguimiento operativo.",
        bullets: [
          "Wizard de alta",
          "Seguimiento de paradas",
          "Gastos de viaje y aprobaciones",
        ],
      },
      {
        title: "Clientes y personal",
        description: "Directorio comercial y base operativa de personas.",
        bullets: [
          "Clientes y contactos",
          "Conductores y licencias",
          "Empleados (directorio HR base)",
        ],
      },
      {
        title: "Facturación y finanzas",
        description: "Ciclo fiscal y control de gastos ligadas a la operación.",
        bullets: [
          "CFDI + Carta Porte + REP",
          "Hub de aprobaciones",
          "Exposición de crédito (sin bloqueo)",
        ],
      },
    ],
  },

  addons: {
    id: "addons",
    title: "Add-ons opcionales",
    subtitle:
      "Módulos de negocio à la carte o en packs. Se activan sobre cualquier plan Operación; no forman parte del núcleo incluido.",
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
      "Los precios y disponibilidad de add-ons viven en el catálogo comercial. En la app puedes consultar tu plan en Configuración → Plan y consumo.",
  },

  pricing: {
    id: "pricing",
    title: "Planes Operación",
    subtitle:
      "Elige capacidad según el tamaño de tu flota. El mismo núcleo en todos los tiers: viajes, flota, clientes y facturación fiscal MX.",
    annualNote: "Pago anual: −15% sobre el precio de lista del plan Operación.",
    addonsNote:
      "Add-ons y packs se contratan aparte y no incluyen capacidad extra del plan.",
    priceHint: "Precios de lista MXN · sin IVA · prueba 14 días sin tarjeta",
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
    title: "Prueba Boeltech en tu operación",
    subtitle:
      "Crea tu empresa, opera con el núcleo incluido y factura con reglas fiscales mexicanas. Sin tarjeta para iniciar la prueba.",
    primary: "Crear cuenta y empezar",
    secondary: "Hablar con ventas",
    trialHint: "14 días · 15 timbres · sin tarjeta",
    closedTitle: "¿Listo para operar con Boeltech?",
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
    copyright: (year: number) =>
      `© ${year} Boeltech. Todos los derechos reservados.`,
  },
} as const;
