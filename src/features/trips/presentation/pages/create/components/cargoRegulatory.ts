export type {
  CargoRegulatoryFlags,
  CargoSectorRequirements,
  MetadataInput,
} from "@boeltech/cfdi-domain";

import {
  extractCargoRegulatoryFlags,
  type CargoSectorRequirements,
} from "@boeltech/cfdi-domain";

export { extractCargoRegulatoryFlags };

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

/**
 * ¿Hay que exigir campos hazmat al validar? (usuario marcó MP o catálogo lo obliga).
 * Para bloquear desmarcar el checkbox en UI, usar solo `requiresHazmat`, no esta función.
 */
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
