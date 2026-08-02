import { describe, expect, it } from "vitest";

import {
  SECTOR_FIELDS,
  splitSectorFieldsByRequirement,
} from "./cargoRequirementFields";

describe("splitSectorFieldsByRequirement", () => {
  it("deja todos los campos como opcionales cuando el catálogo no exige nada", () => {
    const { required, optional } = splitSectorFieldsByRequirement(undefined);

    expect(required).toEqual([]);
    expect(optional).toHaveLength(SECTOR_FIELDS.length);
  });

  it("solo expone como exigidos los campos marcados por el catálogo", () => {
    const { required, optional } = splitSectorFieldsByRequirement({
      numCas: true,
      fechaCaducidad: true,
    });

    expect(required).toEqual(["fechaCaducidad", "numCas"]);
    expect(optional).toHaveLength(SECTOR_FIELDS.length - 2);
    expect(optional).not.toContain("numCas");
  });

  it("ignora banderas en false", () => {
    const { required } = splitSectorFieldsByRequirement({
      numCas: false,
      fabricante: true,
    });

    expect(required).toEqual(["fabricante"]);
  });

  it("conserva el orden de captura del catálogo", () => {
    const { required } = splitSectorFieldsByRequirement({
      usoAutorizado: true,
      sectorCofepris: true,
    });

    expect(required).toEqual(["sectorCofepris", "usoAutorizado"]);
  });
});
