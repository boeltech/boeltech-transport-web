/**
 * Agrupación release kit SAT para hub Platform `/platform/catalogs`.
 */

import {
  CatalogTypeCode,
  type CatalogType,
} from "@features/catalogs";

export const PLATFORM_SAT_GROUPS = [
  "geography",
  "cartaPorte",
  "cfdi",
  "other",
] as const;

export type PlatformSatGroupId = (typeof PLATFORM_SAT_GROUPS)[number];

/** Orden de carga recomendado dentro de Geografía. */
const GEO_LOAD_ORDER: readonly string[] = [
  CatalogTypeCode.SAT_ESTADO,
  CatalogTypeCode.SAT_MUNICIPIO,
  CatalogTypeCode.SAT_LOCALIDAD,
  CatalogTypeCode.SAT_COLONIA,
  CatalogTypeCode.SAT_CODIGO_POSTAL,
  CatalogTypeCode.SAT_PAIS,
];

const GROUP_BY_CODE: Record<string, PlatformSatGroupId> = {
  [CatalogTypeCode.SAT_ESTADO]: "geography",
  [CatalogTypeCode.SAT_MUNICIPIO]: "geography",
  [CatalogTypeCode.SAT_LOCALIDAD]: "geography",
  [CatalogTypeCode.SAT_COLONIA]: "geography",
  [CatalogTypeCode.SAT_CODIGO_POSTAL]: "geography",
  [CatalogTypeCode.SAT_PAIS]: "geography",

  [CatalogTypeCode.SAT_CLAVE_PROD_SERV_CP]: "cartaPorte",
  [CatalogTypeCode.SAT_CLAVE_UNIDAD]: "cartaPorte",
  [CatalogTypeCode.SAT_CONFIG_AUTOTRANSPORTE]: "cartaPorte",
  [CatalogTypeCode.SAT_TIPO_PERMISO]: "cartaPorte",
  [CatalogTypeCode.SAT_TIPO_FIGURA]: "cartaPorte",
  [CatalogTypeCode.SAT_MATERIAL_PELIGROSO]: "cartaPorte",
  [CatalogTypeCode.SAT_TIPO_EMBALAJE]: "cartaPorte",
  [CatalogTypeCode.SAT_SUB_TIPO_REM]: "cartaPorte",
  [CatalogTypeCode.SAT_TIPO_CARRO]: "cartaPorte",
  [CatalogTypeCode.SAT_CONTENEDOR]: "cartaPorte",

  [CatalogTypeCode.SAT_FORMA_PAGO]: "cfdi",
  [CatalogTypeCode.SAT_METODO_PAGO]: "cfdi",
  [CatalogTypeCode.SAT_USO_CFDI]: "cfdi",
  [CatalogTypeCode.SAT_REGIMEN_FISCAL]: "cfdi",
  [CatalogTypeCode.SAT_MONEDA]: "cfdi",
};

export function getPlatformSatGroup(typeCode: string): PlatformSatGroupId {
  return GROUP_BY_CODE[typeCode] ?? "other";
}

function geoSortIndex(code: string): number {
  const idx = GEO_LOAD_ORDER.indexOf(code);
  return idx === -1 ? GEO_LOAD_ORDER.length : idx;
}

export function sortPlatformSatTypes(types: CatalogType[]): CatalogType[] {
  return [...types].sort((a, b) => {
    const groupA = PLATFORM_SAT_GROUPS.indexOf(getPlatformSatGroup(a.code));
    const groupB = PLATFORM_SAT_GROUPS.indexOf(getPlatformSatGroup(b.code));
    if (groupA !== groupB) return groupA - groupB;

    if (getPlatformSatGroup(a.code) === "geography") {
      const geoDiff = geoSortIndex(a.code) - geoSortIndex(b.code);
      if (geoDiff !== 0) return geoDiff;
    }

    return (a.name || a.code).localeCompare(b.name || b.code, "es");
  });
}

export function groupPlatformSatTypes(
  types: CatalogType[],
): Array<{ groupId: PlatformSatGroupId; types: CatalogType[] }> {
  const sorted = sortPlatformSatTypes(types);
  const buckets = new Map<PlatformSatGroupId, CatalogType[]>();
  for (const id of PLATFORM_SAT_GROUPS) {
    buckets.set(id, []);
  }
  for (const type of sorted) {
    buckets.get(getPlatformSatGroup(type.code))!.push(type);
  }
  return PLATFORM_SAT_GROUPS.map((groupId) => ({
    groupId,
    types: buckets.get(groupId) ?? [],
  })).filter((g) => g.types.length > 0);
}
