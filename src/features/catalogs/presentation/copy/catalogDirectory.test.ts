import { describe, expect, it } from "vitest";

import { CatalogTypeCode } from "../../domain";
import {
  CATALOG_THEMES,
  catalogThemeCopy,
  getCatalogExamples,
  getCatalogPurpose,
  getCatalogTheme,
} from "./catalogDirectory";

describe("catalogDirectory", () => {
  it("asigna tema, propósito y ejemplos a todos los tipos conocidos", () => {
    for (const typeCode of Object.values(CatalogTypeCode)) {
      expect(getCatalogTheme(typeCode)).not.toBe("other");
      expect(getCatalogPurpose(typeCode)).toBeTruthy();
      expect(getCatalogExamples(typeCode).length).toBeGreaterThan(0);
    }
  });

  it("degrada a 'Otros' sin ejemplos ante un tipo que el API agregue después", () => {
    expect(getCatalogTheme("sat_catalogo_futuro")).toBe("other");
    expect(getCatalogExamples("sat_catalogo_futuro")).toEqual([]);
    expect(getCatalogPurpose("sat_catalogo_futuro")).toBeNull();
  });

  it("deja 'Otros' al final del orden de secciones", () => {
    expect(CATALOG_THEMES[CATALOG_THEMES.length - 1]).toBe("other");
    expect(catalogThemeCopy.other.title).toBe("Otros");
  });
});
