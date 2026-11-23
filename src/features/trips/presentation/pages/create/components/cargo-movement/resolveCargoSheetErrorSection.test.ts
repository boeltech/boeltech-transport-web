import { describe, expect, it } from "vitest";

import {
  focusFieldIdForCargoSheetSection,
  resolveCargoSheetErrorSection,
} from "./resolveCargoSheetErrorSection";

describe("resolveCargoSheetErrorSection", () => {
  it("maps product paths to producto", () => {
    expect(
      resolveCargoSheetErrorSection({
        formErrors: { satProductCode: { message: "Requerido" } },
      }),
    ).toBe("producto");
  });

  it("maps quantity paths to cantidades", () => {
    expect(
      resolveCargoSheetErrorSection({
        formErrors: { units: { message: "Requerido" } },
      }),
    ).toBe("cantidades");
  });

  it("maps delivery local errors to donde_va", () => {
    expect(
      resolveCargoSheetErrorSection({
        formErrors: {},
        deliveryStopError: "Selecciona la parada",
      }),
    ).toBe("donde_va");
    expect(
      resolveCargoSheetErrorSection({
        formErrors: {},
        deliveryCoverageError: "Exceso",
      }),
    ).toBe("donde_va");
  });

  it("prefers producto over donde_va in default body order", () => {
    expect(
      resolveCargoSheetErrorSection({
        formErrors: { description: { message: "Falta" } },
        deliveryStopError: "Falta entrega",
      }),
    ).toBe("producto");
  });

  it("prefers donde_va when missingPickup (D-PRD-2)", () => {
    expect(
      resolveCargoSheetErrorSection({
        formErrors: { description: { message: "Falta" } },
        deliveryStopError: "Falta entrega",
        missingPickup: true,
      }),
    ).toBe("donde_va");
  });

  it("maps hazmat / sector to requisitos and insurance / notes", () => {
    expect(
      resolveCargoSheetErrorSection({
        formErrors: { hazardousMaterialCode: { message: "Falta" } },
      }),
    ).toBe("requisitos");
    expect(
      resolveCargoSheetErrorSection({
        formErrors: { aseguraCarga: { message: "Falta" } },
      }),
    ).toBe("seguro");
    expect(
      resolveCargoSheetErrorSection({
        formErrors: { notes: { message: "Falta" } },
      }),
    ).toBe("notas");
  });

  it("returns null when there are no errors", () => {
    expect(resolveCargoSheetErrorSection({ formErrors: {} })).toBeNull();
  });
});

describe("focusFieldIdForCargoSheetSection", () => {
  it("returns pickup focus when missing pickup on donde_va", () => {
    expect(
      focusFieldIdForCargoSheetSection("donde_va", { missingPickup: true }),
    ).toBe("cargo-pickup-stop");
  });

  it("returns first delivery stop when delivery error", () => {
    expect(
      focusFieldIdForCargoSheetSection("donde_va", {
        hasDeliveryStopError: true,
      }),
    ).toBe("cargo-delivery-stop-0");
  });
});
