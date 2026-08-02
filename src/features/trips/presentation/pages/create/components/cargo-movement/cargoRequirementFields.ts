import {
  sectorFieldLabels,
  type CargoSectorRequirements,
} from "../cargoRegulatory";

export type SectorFieldName = keyof CargoSectorRequirements;

/** Orden de captura de los datos sectoriales (mismo conjunto que el paquete). */
export const SECTOR_FIELDS = Object.keys(
  sectorFieldLabels,
) as SectorFieldName[];

export interface SectorFieldGroups {
  /** Exigidos por el catálogo del producto: siempre visibles. */
  required: SectorFieldName[];
  /** El resto: solo tras «Agregar más datos de este producto». */
  optional: SectorFieldName[];
}

/**
 * Separa los datos sectoriales entre los que el catálogo exige y los demás.
 * La obligatoriedad la decide `sectorRequirements` (extraído del paquete de
 * dominio); aquí solo se decide qué se pinta.
 */
export function splitSectorFieldsByRequirement(
  requirements?: CargoSectorRequirements,
): SectorFieldGroups {
  const required: SectorFieldName[] = [];
  const optional: SectorFieldName[] = [];

  for (const field of SECTOR_FIELDS) {
    if (requirements?.[field]) required.push(field);
    else optional.push(field);
  }

  return { required, optional };
}
