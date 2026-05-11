import { extractCargoRegulatoryFlags as extractCargoRegulatoryFlagsShared } from "@boeltech/cfdi-domain";

const TRUTHY_VALUES = new Set(["1", "true", "si", "sí", "yes", "y", "x"]);

export interface CargoSectorRequirements {
  sectorCofepris?: boolean;
  nombreIngredienteActivo?: boolean;
  nomQuimico?: boolean;
  denominacionGenericaProd?: boolean;
  denominacionDistintivaProd?: boolean;
  fabricante?: boolean;
  fechaCaducidad?: boolean;
  loteMedicamento?: boolean;
  formaFarmaceutica?: boolean;
  condicionesEspTransp?: boolean;
  registroSanitarioFolioAutorizacion?: boolean;
  permisoImportacion?: boolean;
  folioImpoVucem?: boolean;
  numCas?: boolean;
  razonSocialEmpImp?: boolean;
  numRegSanPlagCofepris?: boolean;
  datosFabricante?: boolean;
  datosFormulador?: boolean;
  datosMaquilador?: boolean;
  usoAutorizado?: boolean;
}

export interface CargoRegulatoryFlags {
  requiresHazmat: boolean;
  sectorRequirements: CargoSectorRequirements;
}

export const sectorFieldLabels: Record<keyof CargoSectorRequirements, string> = {
  sectorCofepris: "Sector COFEPRIS",
  nombreIngredienteActivo: "Nombre ingrediente activo",
  nomQuimico: "Nombre químico",
  denominacionGenericaProd: "Denominación genérica",
  denominacionDistintivaProd: "Denominación distintiva",
  fabricante: "Fabricante",
  fechaCaducidad: "Fecha de caducidad",
  loteMedicamento: "Lote de medicamento",
  formaFarmaceutica: "Forma farmacéutica",
  condicionesEspTransp: "Condiciones especiales de transporte",
  registroSanitarioFolioAutorizacion: "Registro sanitario / folio de autorización",
  permisoImportacion: "Permiso de importación",
  folioImpoVucem: "Folio importación VUCEM",
  numCas: "Número CAS",
  razonSocialEmpImp: "Razón social empresa importadora",
  numRegSanPlagCofepris: "Registro sanitario plaguicida COFEPRIS",
  datosFabricante: "Datos del fabricante",
  datosFormulador: "Datos del formulador",
  datosMaquilador: "Datos del maquilador",
  usoAutorizado: "Uso autorizado",
};

type MetadataInput = Record<string, unknown> | null | undefined;

function normalizeKey(key: string): string {
  return key.replace(/[_\-\s]/g, "").toLowerCase();
}

function asBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return TRUTHY_VALUES.has(normalized);
}

function readMetadataValue(metadata: MetadataInput, keys: string[]): unknown {
  if (!metadata) return undefined;
  const wanted = new Set(keys.map(normalizeKey));
  const entries = Object.entries(metadata);
  const hit = entries.find(([key]) => wanted.has(normalizeKey(key)));
  return hit?.[1];
}

function readMetadataFlag(metadata: MetadataInput, keys: string[]): boolean {
  const value = readMetadataValue(metadata, keys);
  return asBoolean(value);
}

export function extractCargoRegulatoryFlags(metadata: MetadataInput): CargoRegulatoryFlags {
  const shared = extractCargoRegulatoryFlagsShared(metadata);

  const sectorRequirements: CargoSectorRequirements = {
    sectorCofepris: readMetadataFlag(metadata, ["sector_cofepris", "sectorCofepris"]),
    nombreIngredienteActivo: readMetadataFlag(metadata, [
      "nombre_ingrediente_activo",
      "nombreIngredienteActivo",
    ]),
    nomQuimico: readMetadataFlag(metadata, ["nom_quimico", "nomQuimico"]),
    denominacionGenericaProd: readMetadataFlag(metadata, [
      "denominacion_generica_prod",
      "denominacionGenericaProd",
    ]),
    denominacionDistintivaProd: readMetadataFlag(metadata, [
      "denominacion_distintiva_prod",
      "denominacionDistintivaProd",
    ]),
    fabricante: readMetadataFlag(metadata, ["fabricante"]),
    fechaCaducidad: readMetadataFlag(metadata, ["fecha_caducidad", "fechaCaducidad"]),
    loteMedicamento: readMetadataFlag(metadata, ["lote_medicamento", "loteMedicamento"]),
    formaFarmaceutica: readMetadataFlag(metadata, ["forma_farmaceutica", "formaFarmaceutica"]),
    condicionesEspTransp: readMetadataFlag(metadata, [
      "condiciones_esp_transp",
      "condicionesEspTransp",
    ]),
    registroSanitarioFolioAutorizacion: readMetadataFlag(metadata, [
      "registro_sanitario_folio_autorizacion",
      "registroSanitarioFolioAutorizacion",
    ]),
    permisoImportacion: readMetadataFlag(metadata, ["permiso_importacion", "permisoImportacion"]),
    folioImpoVucem: readMetadataFlag(metadata, ["folio_impo_vucem", "folioImpoVucem"]),
    numCas: readMetadataFlag(metadata, ["num_cas", "numCas"]),
    razonSocialEmpImp: readMetadataFlag(metadata, ["razon_social_emp_imp", "razonSocialEmpImp"]),
    numRegSanPlagCofepris: readMetadataFlag(metadata, [
      "num_reg_san_plag_cofepris",
      "numRegSanPlagCofepris",
    ]),
    datosFabricante: readMetadataFlag(metadata, ["datos_fabricante", "datosFabricante"]),
    datosFormulador: readMetadataFlag(metadata, ["datos_formulador", "datosFormulador"]),
    datosMaquilador: readMetadataFlag(metadata, ["datos_maquilador", "datosMaquilador"]),
    usoAutorizado: readMetadataFlag(metadata, ["uso_autorizado", "usoAutorizado"]),
  };

  const requiresHazmat =
    readMetadataFlag(metadata, [
      "material_peligroso",
      "materialPeligroso",
      "hazardous_material",
      "hazardousMaterial",
      "hazmat",
      "requiere_material_peligroso",
      "requiresHazmat",
    ]) || false;

  return {
    requiresHazmat: shared.requiresHazmat || requiresHazmat,
    sectorRequirements: {
      ...shared.sectorRequirements,
      ...sectorRequirements,
    },
  };
}

export function isHazmatRequired(flags: {
  hazardousMaterial?: boolean;
  requiresHazmat?: boolean;
}): boolean {
  return Boolean(flags.hazardousMaterial || flags.requiresHazmat);
}

function hasValue(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

export function hasAnySectorFieldValue(values: {
  sectorCofepris?: string;
  nombreIngredienteActivo?: string;
  nomQuimico?: string;
  denominacionGenericaProd?: string;
  denominacionDistintivaProd?: string;
  fabricante?: string;
  fechaCaducidad?: string;
  loteMedicamento?: string;
  formaFarmaceutica?: string;
  condicionesEspTransp?: string;
  registroSanitarioFolioAutorizacion?: string;
  permisoImportacion?: string;
  folioImpoVucem?: string;
  numCas?: string;
  razonSocialEmpImp?: string;
  numRegSanPlagCofepris?: string;
  datosFabricante?: string;
  datosFormulador?: string;
  datosMaquilador?: string;
  usoAutorizado?: string;
}): boolean {
  return Object.values(values).some(hasValue);
}

export function getMissingSectorRequiredFields(args: {
  requirements?: CargoSectorRequirements;
  values: Record<keyof CargoSectorRequirements, unknown>;
}): Array<keyof CargoSectorRequirements> {
  const requirements = args.requirements ?? {};
  return (Object.keys(sectorFieldLabels) as Array<keyof CargoSectorRequirements>).filter(
    (field) => requirements[field] && !hasValue(args.values[field]),
  );
}
