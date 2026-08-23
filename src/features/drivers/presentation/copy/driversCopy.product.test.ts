/**
 * Producto P11–P17 — readiness ATF y léxico operativo del detalle de conductor.
 */
import { describe, expect, it } from "vitest";
import { driversCopy } from "./driversCopy";

describe("driversCopy.detail product handoff (Capa 1 → 3, P11–P17)", () => {
  it("tab Perfil (no Conductor) y trio documental en stats (P12/P14)", () => {
    expect(driversCopy.detail.tab.driver).toBe("Perfil");
    expect(driversCopy.detail.stat.federalLicense.title).toMatch(/federal/i);
    expect(driversCopy.detail.stat.stateLicense.title).toMatch(/estatal/i);
    expect(driversCopy.detail.stat.medical.title).toMatch(/médico/i);
    expect(driversCopy.detail.stat.vigency.missing).toBe("Sin registrar");
    expect(driversCopy.detail.stat.vigency.notApplicable).toBe("No aplica");
  });

  it("chips jurisdicción sin Ambas (P16)", () => {
    expect(driversCopy.detail.jurisdiction.both).toBe("Federal + estatal");
    expect(driversCopy.detail.jurisdiction.stateOnly).toBe("Solo estatal");
    expect(driversCopy.detail.jurisdiction.federal).toBe("Federal");
    expect(driversCopy.list.jurisdiction.both).toBe("Federal + estatal");
    expect(driversCopy.list.jurisdiction.state).toBe("Solo estatal");
  });

  it("copy de lectura sin NumLicencia; form conserva P3 (P17)", () => {
    const detailBlob = JSON.stringify(driversCopy.detail);
    expect(detailBlob).not.toMatch(/NumLicencia/i);
    expect(driversCopy.detail.section.licenseFederal.description).not.toMatch(
      /Carta Porte/i,
    );
    expect(driversCopy.detail.label.federalLicenseCategory).toBe(
      "Categoría (A–F)",
    );
    expect(driversCopy.form.section.licenseFederal.description).toMatch(
      /NumLicencia/,
    );
  });

  it("alerta documental tiene CTA a documentación (P15)", () => {
    expect(driversCopy.detail.alert.viewDocuments).toMatch(/documentación/i);
  });
});
