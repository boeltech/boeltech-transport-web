/**
 * Copy de la landing pública (`/welcome`).
 * Namespace: landing.copy.*
 * Alineado a SoT comercial v5 motriz (bandas Micro/Pequeña/Mediana/Grande).
 * Handoff Capa 1 (D1–D12): embudo outcome → prueba → precio.
 * Pedido 2026-10-26: FAQ/CTA honestos (PD2–PD3), beats dueño (PD4).
 * D5′: sin ICP 1–30 en hero (no excluir flotas grandes).
 */
import { BRAND } from "@shared/ui/brand";

export type LandingFaqItem = {
  question: string;
  answer: string;
  linkHref?: string;
  linkLabel?: string;
};

export const landingCopy = {
  brand: BRAND.productName,
  brandByline: BRAND.productByline,
  brandTagline: "Operación y facturación para transporte en México",
  skipLink: "Saltar al contenido",

  nav: {
    /** Ancla #evidencia — label corto «Cómo funciona». */
    product: "Cómo funciona",
    pricing: "Precios",
    /** Chrome / footer / cierre — mismo wording en welcome (no «Iniciar sesión»). */
    login: "Ya tengo cuenta",
    register: "Probar gratis",
    contactSales: "Contactar ventas",
    /** F1 navs: menú secciones bajo breakpoint md */
    menuOpen: "Abrir menú",
    menuClose: "Cerrar menú",
    sectionsLabel: "Secciones",
  },

  hero: {
    /** @deprecated No renderizar: la prueba vive en `trialHint`. */
    badgeOpen: "Prueba 14 días · sin tarjeta",
    /** Cuando el registro público está cerrado (bajo el CTA del hero). */
    badgeClosed: "Te damos de alta con el equipo de ventas.",
    title: "Opera tu flota y factura en México.",
    subtitle:
      "Viajes, unidades y clientes en un solo lugar. Facturas con tu CSD cuando la operación lo pida.",
    /** Solo precios/cierre/sticky si self-serve open; el hero usa siempre `ctaPrimaryClosed`. */
    ctaPrimaryOpen: "Probar gratis",
    /** Primario del hero (siempre, mientras self-serve esté off). */
    ctaPrimaryClosed: "Contactar ventas",
    /** @deprecated Login vive en chrome (`nav.login`); no en el bloque CTA del hero. */
    ctaLogin: "Ya tengo cuenta",
    trialHint:
      "14 días · 15 timbres de prueba · sin tarjeta · empiezas en Operación Micro",
  },

  stickyCta: {
    pricingLink: "Ver precios",
    ariaLabel: "Acciones rápidas",
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
      { label: "CFDI 4.0", hint: "Con tu CSD" },
      { label: "Carta Porte 3.1", hint: "Sale con el viaje" },
      { label: "REP", hint: "Al registrar el pago" },
    ],
  },

  /**
   * Beats de evidencia (tabs + panel). Orden: Flota → Viajes → Clientes → Facturación.
   * @deprecated id `#producto` — usar `evidence.id` (`#evidencia`).
   */
  product: {
    id: "producto",
    /** @deprecated UI usa `evidence.title`. */
    title: "Cómo funciona en tu patio",
    /** @deprecated UI usa `evidence.subtitle`. */
    subtitle:
      "Las mismas funciones en todos los planes. Lo que cambia con el tamaño de flota son los cupos (motrices, usuarios, sucursales), no lo que puedes hacer.",
    items: [
      {
        title: "Flota",
        benefitTitle: "Tus unidades bajo control",
        description:
          "Unidades listas para asignar: datos de la motriz y estatus en un solo lugar.",
        bullets: [
          "Catálogo de vehículos",
          "Asignación a viajes",
          "Estatus de la unidad",
        ],
        /** Índice en preview.navItems para resaltar el mock (fallback). */
        previewNavIndex: 2,
        /** Crop A3 — `public/commercial/product/…` */
        previewAssetId: "product-preview-fleet" as const,
      },
      {
        title: "Viajes",
        benefitTitle: "El viaje, de punta a punta",
        description:
          "Del alta al seguimiento en patio, sin depender de un GPS aparte.",
        bullets: [
          "Alta de viaje",
          "Paradas y seguimiento",
          "Gastos y aprobaciones",
        ],
        previewNavIndex: 1,
        previewAssetId: "product-preview-trips" as const,
      },
      {
        title: "Clientes",
        benefitTitle: "Quién te contrata, claro",
        description:
          "Clientes y contactos listos para operar el viaje y preparar el cobro.",
        bullets: [
          "Clientes y contactos",
          "Datos para cotizar y facturar",
          "Historial de viajes por cliente",
        ],
        previewNavIndex: 3,
        previewAssetId: "product-preview-clients" as const,
      },
      {
        title: "Facturación",
        benefitTitle: "Del viaje al CFDI",
        description:
          "Timbrar y cobrar ligado al viaje, con tu CSD cuando lo cargues.",
        bullets: [
          "CFDI, Carta Porte y REP",
          "Cobros ligados al viaje",
          "Crédito del cliente a la vista",
        ],
        previewNavIndex: 4,
        previewAssetId: "product-preview-billing" as const,
      },
    ],
  },

  /** Evidencia con tabs; copy de beats = product.items. */
  evidence: {
    id: "evidencia",
    title: "Cómo funciona en tu patio",
    subtitle:
      "Las mismas funciones en todos los planes. Lo que cambia con el tamaño de flota son los cupos (motrices, usuarios, sucursales), no lo que puedes hacer.",
    tablistLabel: "Áreas del producto",
    pauseLabel: "Pausar recorrido",
    playLabel: "Reanudar recorrido",
  },

  optionals: {
    id: "opcionales",
    title: "Más adelante, sobre el mismo núcleo",
    subtitle:
      "El núcleo operativo ya está en tu plan. Combustible, mantenimiento y GPS se contratan aparte cuando estén disponibles.",
    /** Leyenda única a nivel sección (no por celda). Sentence-case patio. */
    badge: "En preparación",
    items: [
      {
        title: "Combustible",
        description:
          "Controla costos, rendimientos y anomalías. Aún no se contrata.",
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
    /** F3 D8: voz patio (capacidad de flota), no catálogo SaaS. */
    title: "Planes según el tamaño de tu flota",
    subtitle:
      "Pagas por motriz al mes, sin cargo fijo de cuenta. Mismo núcleo operativo en todos los planes; cambian cupos y precio.",
    /** Cue Micro/Pequeña (PD5 / D5) sin ocultar Mediana/Grande. */
    focusCue: "Ideal para flotas Micro y Pequeña (1–30 motrices).",
    /**
     * Footnote de sección (D6): anual + opcionales se renderizan juntos.
     * Sin promesa de descuento anual como SoT.
     */
    annualNote: "¿Facturación anual? Consulta con ventas.",
    optionalsNote:
      "Opcionales y packs se contratan aparte; no suman capacidad a la banda.",
    optionalsLink: "Ver opcionales",
    priceHint:
      "Precios MXN por motriz · mes · sin IVA · sin cargo fijo de cuenta · prueba 14 días sin tarjeta",
    priceHintClosed: "MXN · por motriz · mes · sin IVA · alta con ventas",
    /** @deprecated Eyebrow no-match usa rango de flota (unitsLabel → motrices). */
    familyLabel: "Operación",
    cta: "Probar gratis",
    /** Grande / cotización: no vender «prueba» como si hubiera P de lista. */
    ctaQuote: "Solicitar cotización",
    ctaSecondary: "Hablar con ventas",
    popularBadge: "Más elegido",
    popularCode: "operacion_pequena",
    featureLabels: {
      fleet: "Motrices",
      users: "Usuarios",
      branches: "Sucursales",
      stamps: "Timbres / motriz",
      history: "Historial",
      /** @deprecated Ya no se renderiza en cards de pricing. */
      l0: "Núcleo incluido",
    },
    audiences: {
      operacion_micro: "Viajes y factura sin cargo fijo extra.",
      operacion_pequena: "Más usuarios, sucursales e historial.",
      operacion_mediana: "Varias sucursales y más equipo.",
      operacion_grande: "Precio y cupos a medida.",
    } as Record<string, string>,
    /** Selector: solo highlight UI; no muta precios SoT. */
    fleetSelector: {
      label: "¿Cuántas motrices operas?",
      hint: "Motriz = unidad tractora. Es la unidad de cobro del plan.",
      /**
       * Cue bajo el selector. `{name}` = shortName del plan match
       * (Micro / Pequeña / Mediana / Grande).
       */
      matchCueTemplate: "Tu plan: {name}",
      options: [
        {
          id: "1-5",
          label: "1–5",
          planCode: "operacion_micro",
        },
        {
          id: "6-30",
          label: "6–30",
          planCode: "operacion_pequena",
        },
        {
          id: "31-100",
          label: "31–100",
          planCode: "operacion_mediana",
        },
        {
          id: "101+",
          label: "101+",
          planCode: "operacion_grande",
        },
      ],
      /** Default: banda «Más elegido». */
      defaultOptionId: "6-30",
    },
  },

  faq: {
    id: "faq",
    title: "Preguntas frecuentes",
    /** Siempre visibles (PD3). */
    items: [
      {
        question: "¿Necesito CSD el día 1?",
        answer:
          "No. Opera primero con el núcleo incluido. Factura en México cuando cargues tu sello (CSD).",
      },
      {
        question: "¿Qué es una motriz?",
        answer:
          "Una motriz es el tractocamión o vehículo motriz que opera viajes. No cuenta remolques ni dollies. El plan se cobra por motriz al mes.",
      },
      {
        question: "¿Hay cargo fijo de cuenta?",
        answer: "No. Pagas por motriz; sin cargo fijo de cuenta.",
      },
      {
        question: "¿Combustible, GPS o mantenimiento están incluidos?",
        answer:
          "No. Son opcionales aparte y aún no están en disponibilidad general.",
        linkHref: "#opcionales",
        linkLabel: "Ver opcionales",
      },
    ] as const satisfies readonly LandingFaqItem[],
    /**
     * Solo si `registrationOpen` (PD2/PD3). Insertar tras CSD para conservar orden histórico.
     */
    trialItems: [
      {
        question: "¿Qué incluye la prueba?",
        answer:
          "14 días · sin tarjeta · 15 timbres de prueba · empiezas en Operación Micro.",
      },
      {
        question: "¿Qué pasa al día 15?",
        answer:
          "Habla con ventas para continuar en un plan Operación. La prueba no se convierte sola en un plan de pago.",
      },
    ] as const satisfies readonly LandingFaqItem[],
  },

  cta: {
    title: `Prueba ${BRAND.productName} en tu operación`,
    subtitle:
      "Crea tu empresa, opera con el núcleo incluido y factura con reglas fiscales mexicanas. Sin tarjeta para iniciar la prueba.",
    primary: "Probar gratis",
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

/** FAQ visible según self-serve: sin ítems de prueba cuando el registro está cerrado. */
export function getLandingFaqItems(
  registrationOpen: boolean,
): LandingFaqItem[] {
  const always = landingCopy.faq.items as unknown as LandingFaqItem[];
  if (!registrationOpen) return [...always];
  const trial = landingCopy.faq.trialItems as unknown as LandingFaqItem[];
  return [always[0]!, ...trial, ...always.slice(1)];
}
