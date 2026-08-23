/**
 * Producto D2–D5 — alcance post-import y léxico sin “listo para timbrar”.
 */
import { describe, expect, it } from "vitest";
import { IMPORT_IMPLEMENTED_ENTITY_TYPES } from "../../domain";
import { IMPORT_TEMPLATE_GUIDES } from "./importTemplateGuide";
import { importsCopy } from "./importsCopy";

describe("importsCopy product handoff (Capa 1 → 3)", () => {
  it("hub ancla padrón operable ≠ timbrable uniforme (D8)", () => {
    expect(importsCopy.hub.description.toLowerCase()).toMatch(/timbrar/);
    expect(importsCopy.hub.description.toLowerCase()).toMatch(/padrón|asignar/);
  });

  it("preview usa válidas, no listas (D3)", () => {
    expect(importsCopy.wizard.validate.valid).toBe("Válida");
    expect(importsCopy.wizard.validate.summary(1, 0, 1)).toContain("válidas");
    expect(importsCopy.wizard.validate.summary(1, 0, 1)).not.toMatch(/listas/i);
    expect(importsCopy.table.resultSummary({
      status: "validated",
      validCount: 2,
      errorCount: 1,
      insertedCount: 0,
      updatedCount: 0,
      rowCount: 3,
    })).toContain("válidas");
  });

  it("resultado define alcance y CTAs por entidad (D2)", () => {
    for (const entity of IMPORT_IMPLEMENTED_ENTITY_TYPES) {
      const scope = importsCopy.wizard.result.scope[entity];
      expect(scope.persisted.length).toBeGreaterThan(10);
      expect(scope.operable.length).toBeGreaterThan(10);
      expect(scope.actions.length).toBeGreaterThan(0);
      expect(scope.actions.length).toBeLessThanOrEqual(3);
    }
    expect(importsCopy.wizard.result.scope.employees.gap).toMatch(/RFC/i);
    expect(importsCopy.wizard.result.scope.vehicles.gap).toMatch(/remolque/i);
    expect(
      importsCopy.wizard.result.scope.vehicles.actions.some(
        (a) => a.href === "/trailers",
      ),
    ).toBe(true);
  });

  it("guía vehículos no captura remolques en CSV (D4)", () => {
    const headers = IMPORT_TEMPLATE_GUIDES.vehicles.columns.map((c) => c.header);
    expect(headers.some((h) => h.startsWith("remolque_"))).toBe(false);
    expect(IMPORT_TEMPLATE_GUIDES.vehicles.intro.toLowerCase()).toMatch(
      /remolque/,
    );
  });

  it("guía empleados/conductores aclara RFC (D5)", () => {
    const rfc = IMPORT_TEMPLATE_GUIDES.employees.columns.find(
      (c) => c.header === "rfc",
    );
    expect(rfc?.tip.toLowerCase()).toMatch(/opcional|padrón/);
    expect(rfc?.tip.toLowerCase()).toMatch(/timbrar|carta porte/);
    expect(IMPORT_TEMPLATE_GUIDES.drivers.intro.toLowerCase()).toMatch(/rfc/);
  });

  it("guía conductores usa columnas federal/estatal ADR-0080", () => {
    const headers = IMPORT_TEMPLATE_GUIDES.drivers.columns.map((c) => c.header);
    expect(headers).toContain("federal_license_number");
    expect(headers).toContain("federal_license_category");
    expect(headers).toContain("federal_license_expiry");
    expect(headers).toContain("state_license_number");
    expect(headers).toContain("state_license_expiry");
    expect(headers).toContain("state_issuing_state");
    expect(headers).not.toContain("license_number");
    expect(headers).not.toContain("license_type");
    expect(IMPORT_TEMPLATE_GUIDES.drivers.intro.toLowerCase()).toMatch(/sict|federal/);
    expect(IMPORT_TEMPLATE_GUIDES.drivers.scenarios?.length).toBe(3);
    expect(
      IMPORT_TEMPLATE_GUIDES.drivers.scenarios?.map((s) => s.title),
    ).toEqual(
      expect.arrayContaining(["Solo federal", "Solo estatal", "Ambas"]),
    );
    expect(IMPORT_TEMPLATE_GUIDES.drivers.intro.toLowerCase()).toMatch(
      /grupo a medias/,
    );
  });
});
