/**
 * Directorio de catálogos: agrupación temática, ejemplos de contenido y
 * propósito operativo por tipo.
 *
 * El API no expone ninguno de estos tres datos, así que viven aquí como copy
 * curado. Un tipo que no esté mapeado cae en el grupo "other" y se muestra sin
 * ejemplos ni propósito, sin romper la pantalla.
 */

import { CatalogTypeCode } from "../../domain";

// ============================================================================
// TEMAS
// ============================================================================

/** Orden de aparición de las secciones en el listado. */
export const CATALOG_THEMES = [
  "billing",
  "cartaPorte",
  "addresses",
  "operation",
  "other",
] as const;

export type CatalogTheme = (typeof CATALOG_THEMES)[number];

export const catalogThemeCopy: Record<
  CatalogTheme,
  { title: string; description: string }
> = {
  billing: {
    title: "Facturación",
    description:
      "Valores que se imprimen en tus facturas y complementos de pago.",
  },
  cartaPorte: {
    title: "Viajes y carta porte",
    description:
      "Valores para declarar la mercancía, el equipo y a quién conduce.",
  },
  addresses: {
    title: "Direcciones",
    description: "Valores geográficos para domicilios, paradas y rutas.",
  },
  operation: {
    title: "Tu operación",
    description:
      "Valores con los que el sistema clasifica tu flota, tus gastos y tus viajes.",
  },
  other: {
    title: "Otros",
    description: "Valores que no pertenecen a los grupos anteriores.",
  },
};

// ============================================================================
// ENTRADAS POR CATÁLOGO
// ============================================================================

interface CatalogDirectoryEntry {
  theme: CatalogTheme;
  /** Para qué sirve el catálogo, en lenguaje operativo. */
  purpose: string;
  /** Ejemplos reales de su contenido: alimentan la búsqueda y la tarjeta. */
  examples: readonly string[];
}

const catalogDirectory: Record<string, CatalogDirectoryEntry> = {
  // Facturación
  [CatalogTypeCode.SAT_FORMA_PAGO]: {
    theme: "billing",
    purpose: "Cómo te pagó el cliente.",
    examples: ["Efectivo", "Transferencia electrónica", "Tarjeta de crédito"],
  },
  [CatalogTypeCode.SAT_METODO_PAGO]: {
    theme: "billing",
    purpose: "Si la factura se liquida de una vez o en parcialidades.",
    examples: ["Pago en una sola exhibición", "Pago en parcialidades"],
  },
  [CatalogTypeCode.SAT_USO_CFDI]: {
    theme: "billing",
    purpose: "El uso que tu cliente le dará a la factura.",
    examples: ["Gastos en general", "Adquisición de mercancías", "Por definir"],
  },
  [CatalogTypeCode.SAT_REGIMEN_FISCAL]: {
    theme: "billing",
    purpose:
      "Regímenes con los que puede estar registrada una empresa o una persona.",
    examples: ["Régimen general de ley", "Régimen simplificado de confianza"],
  },
  [CatalogTypeCode.SAT_MONEDA]: {
    theme: "billing",
    purpose: "Monedas en las que puedes facturar.",
    examples: ["Peso mexicano", "Dólar estadounidense", "Euro"],
  },
  [CatalogTypeCode.SAT_CLAVE_PROD_SERV]: {
    theme: "billing",
    purpose:
      "Claves de producto o servicio CFDI para conceptos de factura y defaults de facturación.",
    examples: [
      "Transporte de carga por carretera",
      "Servicios de manipulación de carga",
    ],
  },

  // Viajes y carta porte
  [CatalogTypeCode.SAT_CLAVE_PROD_SERV_CP]: {
    theme: "cartaPorte",
    purpose: "Claves con las que se declara qué mercancía transportas.",
    examples: ["Cemento", "Abarrotes", "Refrigeradores", "Ganado"],
  },
  [CatalogTypeCode.SAT_CLAVE_UNIDAD]: {
    theme: "cartaPorte",
    purpose: "Unidades en las que declaras la cantidad de la mercancía.",
    examples: ["Tonelada", "Kilogramo", "Litro", "Pieza"],
  },
  [CatalogTypeCode.SAT_CONFIG_AUTOTRANSPORTE]: {
    theme: "cartaPorte",
    purpose: "Configuraciones de vehículo que puedes declarar en un viaje.",
    examples: ["Tractocamión", "Camión unitario", "Full"],
  },
  [CatalogTypeCode.SAT_TIPO_PERMISO]: {
    theme: "cartaPorte",
    purpose: "Permisos de transporte que puedes registrar para una unidad.",
    examples: ["Carga general federal", "Materiales y residuos peligrosos"],
  },
  [CatalogTypeCode.SAT_TIPO_FIGURA]: {
    theme: "cartaPorte",
    purpose: "Rol de las personas que intervienen en el traslado.",
    examples: ["Operador", "Propietario", "Arrendatario", "Notificado"],
  },
  [CatalogTypeCode.SAT_MATERIAL_PELIGROSO]: {
    theme: "cartaPorte",
    purpose: "Sustancias que deben declararse como material peligroso.",
    examples: ["Gasolina", "Diésel", "Gas LP", "Pinturas"],
  },
  [CatalogTypeCode.SAT_TIPO_EMBALAJE]: {
    theme: "cartaPorte",
    purpose: "Formas de embalaje para mercancía peligrosa.",
    examples: ["Tambor", "Caja", "Costal", "Bidón"],
  },
  [CatalogTypeCode.SAT_SUB_TIPO_REM]: {
    theme: "cartaPorte",
    purpose: "Tipos de remolque y semirremolque que puedes declarar.",
    examples: ["Caja seca", "Plataforma", "Tolva", "Tanque"],
  },
  [CatalogTypeCode.SAT_TIPO_CARRO]: {
    theme: "cartaPorte",
    purpose: "Tipos de carro para traslados por vía férrea.",
    examples: ["Góndola", "Tolva", "Plataforma", "Furgón"],
  },
  [CatalogTypeCode.SAT_CONTENEDOR]: {
    theme: "cartaPorte",
    purpose: "Tipos de contenedor para traslados marítimos.",
    examples: ["Contenedor seco", "Contenedor refrigerado", "Plataforma"],
  },

  // Direcciones
  [CatalogTypeCode.SAT_ESTADO]: {
    theme: "addresses",
    purpose: "Estados de la República disponibles al capturar un domicilio.",
    examples: ["Jalisco", "Nuevo León", "Ciudad de México"],
  },
  [CatalogTypeCode.SAT_MUNICIPIO]: {
    theme: "addresses",
    purpose: "Municipios y alcaldías disponibles para cada estado.",
    examples: ["Guadalajara", "Monterrey", "Zapopan"],
  },
  [CatalogTypeCode.SAT_LOCALIDAD]: {
    theme: "addresses",
    purpose: "Localidades reconocidas dentro de un municipio.",
    examples: ["Ciudad Juárez", "San Pedro Garza García"],
  },
  [CatalogTypeCode.SAT_COLONIA]: {
    theme: "addresses",
    purpose: "Colonias asociadas a cada código postal.",
    examples: ["Centro", "Del Valle", "Providencia"],
  },
  [CatalogTypeCode.SAT_CODIGO_POSTAL]: {
    theme: "addresses",
    purpose: "Códigos postales del país, con su estado y municipio.",
    examples: ["44100", "64000", "03100"],
  },
  [CatalogTypeCode.SAT_PAIS]: {
    theme: "addresses",
    purpose: "Países disponibles para domicilios y datos fiscales.",
    examples: ["México", "Estados Unidos", "Canadá"],
  },

  // Tu operación
  [CatalogTypeCode.VEHICLE_TYPE]: {
    theme: "operation",
    purpose: "Cómo se clasifica cada unidad de tu flota.",
    examples: ["Tractocamión", "Camioneta", "Remolque"],
  },
  [CatalogTypeCode.EXPENSE_CATEGORY]: {
    theme: "operation",
    purpose: "Cómo se clasifican los gastos que registras en un viaje.",
    examples: ["Combustible", "Casetas", "Mantenimiento", "Hospedaje"],
  },
  [CatalogTypeCode.TRIP_STATUS]: {
    theme: "operation",
    purpose: "Las etapas por las que pasa un viaje.",
    examples: ["Programado", "En ruta", "Entregado"],
  },
  [CatalogTypeCode.STOP_TYPE]: {
    theme: "operation",
    purpose: "Qué se hace en cada parada de la ruta.",
    examples: ["Carga", "Descarga", "Paso"],
  },
  [CatalogTypeCode.CARGO_STATUS]: {
    theme: "operation",
    purpose: "Las etapas por las que pasa la carga de un viaje.",
    examples: ["Pendiente", "En tránsito", "Entregada"],
  },
  [CatalogTypeCode.DOCUMENT_TYPE]: {
    theme: "operation",
    purpose: "Documentos que puedes adjuntar a una unidad o a una persona.",
    examples: ["Licencia", "Póliza de seguro", "Tarjeta de circulación"],
  },
};

// ============================================================================
// HELPERS
// ============================================================================

export function getCatalogTheme(typeCode: string): CatalogTheme {
  return catalogDirectory[typeCode]?.theme ?? "other";
}

export function getCatalogExamples(typeCode: string): readonly string[] {
  return catalogDirectory[typeCode]?.examples ?? [];
}

export function getCatalogPurpose(typeCode: string): string | null {
  return catalogDirectory[typeCode]?.purpose ?? null;
}
