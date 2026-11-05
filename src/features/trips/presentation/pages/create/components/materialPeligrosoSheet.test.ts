import { classifyMaterialPeligrosoCatalogRequirement } from "@boeltech/cfdi-domain";
import { describe, expect, it } from "vitest";

import { cargoCopy } from "../../../copy/wizard/cargoCopy";
import {
  materialPeligrosoSheetHint,
  materialPeligrosoSwitchLock,
} from "./materialPeligrosoSheet";

const hint = cargoCopy.sheet.hint;

describe("material peligroso en el sheet de mercancía", () => {
  it("clasifica la marca del catálogo sin colapsar 0,1 a 1", () => {
    expect(
      classifyMaterialPeligrosoCatalogRequirement({ material_peligroso: "0" }),
    ).toBe("omit");
    expect(
      classifyMaterialPeligrosoCatalogRequirement({ material_peligroso: "0,1" }),
    ).toBe("declare_optional");
    expect(
      classifyMaterialPeligrosoCatalogRequirement({ material_peligroso: "1" }),
    ).toBe("declare_required_si");
    expect(classifyMaterialPeligrosoCatalogRequirement(null)).toBe("unknown");
    expect(classifyMaterialPeligrosoCatalogRequirement({})).toBe("unknown");
  });

  it("usa el texto literal de cada marca", () => {
    expect(materialPeligrosoSheetHint("omit", true)).toBe(
      "Esta clave no declara material peligroso. El atributo no va en la Carta Porte.",
    );
    expect(materialPeligrosoSheetHint("declare_optional", false)).toBe(
      'Puede ser o no ser material peligroso. Si no lo es, la Carta Porte lleva MaterialPeligroso="No".',
    );
    expect(materialPeligrosoSheetHint("declare_optional", true)).toBe(
      'La Carta Porte llevará MaterialPeligroso="Sí". Capture la clave y el embalaje.',
    );
    expect(materialPeligrosoSheetHint("declare_required_si", false)).toBe(
      hint.hazmatRequired,
    );
    expect(materialPeligrosoSheetHint("unknown", false)).toBe(
      "Esta clave todavía no tiene la marca de material peligroso en el catálogo. No se podrá timbrar hasta que el catálogo la tenga.",
    );
  });

  it("no ofrece No en marca 0 ni trata 0,1 como si el atributo se omitiera", () => {
    expect(materialPeligrosoSheetHint("omit", false)).not.toMatch(/"No"/);
    expect(materialPeligrosoSheetHint("declare_required_si", true)).not.toMatch(
      /"No"/,
    );
    expect(materialPeligrosoSheetHint("declare_optional", false)).not.toMatch(
      /no va/i,
    );
    expect(hint.hazmatRequired).not.toMatch(/obliga a declararla así/);
  });

  it("fija el interruptor solo en marca 0 y marca 1", () => {
    expect(materialPeligrosoSwitchLock("omit")).toBe("off");
    expect(materialPeligrosoSwitchLock("declare_required_si")).toBe("on");
    expect(materialPeligrosoSwitchLock("declare_optional")).toBeNull();
    expect(materialPeligrosoSwitchLock("unknown")).toBeNull();
    expect(materialPeligrosoSwitchLock(null)).toBeNull();
  });
});