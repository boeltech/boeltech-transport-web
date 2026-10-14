/**
 * F3 — D11: temas/copy de consulta intactos; CTAs shell en sentence case.
 */
import { describe, expect, it } from "vitest";

import {
  CATALOG_THEMES,
  catalogThemeCopy,
} from "./catalogDirectory";
import { catalogsCopy } from "./catalogsCopy";

describe("catalogsCopy F3 (D11)", () => {
  it("conserva temas del directorio (títulos y descripciones)", () => {
    expect([...CATALOG_THEMES]).toEqual([
      "billing",
      "cartaPorte",
      "addresses",
      "operation",
      "other",
    ]);
    expect(catalogThemeCopy.billing.title).toBe("Facturación");
    expect(catalogThemeCopy.cartaPorte.title).toBe("Viajes y carta porte");
    expect(catalogThemeCopy.addresses.title).toBe("Direcciones");
    expect(catalogThemeCopy.operation.title).toBe("Tu operación");
    expect(catalogThemeCopy.other.title).toBe("Otros");
    expect(catalogThemeCopy.billing.description).toMatch(/facturas/i);
    expect(catalogThemeCopy.cartaPorte.description).toMatch(/mercancía/i);
  });

  it("conserva copy de consulta (shell + solo lectura)", () => {
    expect(catalogsCopy.page.title).toBe("Valores de referencia");
    expect(catalogsCopy.page.description).toMatch(/Consulta los valores/i);
    expect(catalogsCopy.readOnlyNotice.listTitle).toBe(
      "Estos valores son de solo consulta",
    );
    expect(catalogsCopy.readOnlyNotice.detailTitle).toBe(
      "Este catálogo es de solo consulta",
    );
    expect(catalogsCopy.detail.back).toBe("Volver a catálogos");
  });

  it("usa sentence case en CTAs y títulos de mutación visibles", () => {
    const visibles = [
      catalogsCopy.page.title,
      catalogsCopy.detail.addRecord,
      catalogsCopy.detail.clearSearch,
      catalogsCopy.state.loadErrorRetry,
      catalogsCopy.itemForm.createTitle,
      catalogsCopy.itemForm.editTitle,
      catalogsCopy.itemForm.save,
      catalogsCopy.itemForm.cancel,
      catalogsCopy.itemActions.edit,
      catalogsCopy.itemActions.delete,
      catalogsCopy.deleteConfirm.title,
      catalogsCopy.deleteConfirm.confirm,
    ];
    for (const text of visibles) {
      expect(text).not.toBe(text.toUpperCase());
      // Sin Title Case tipo "Agregar Registro" / "Nuevo Registro"
      expect(text).not.toMatch(
        /\b(Agregar|Nuevo|Editar|Eliminar|Limpiar|Volver|Reintentar)\s+[A-ZÁÉÍÓÚÑÜ]/,
      );
    }
  });
});
