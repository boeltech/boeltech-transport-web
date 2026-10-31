import { describe, expect, it } from "vitest";
import { compensationCopy } from "./compensationCopy";

describe("compensationCopy — F2 claridad piloto (tarifa / asignación)", () => {
  it("Nueva tarifa aclara qué cubre y que el sueldo no se captura ahí", () => {
    expect(compensationCopy.presets.subtitleDescription).toMatch(/sueldo/i);
    expect(compensationCopy.presets.subtitleDescription).toMatch(/Empleados/i);
    expect(compensationCopy.presets.subtitleDescription).toMatch(
      /no se captura aquí/i,
    );
    expect(compensationCopy.sheet.templateCreateHelp).toMatch(/sueldo/i);
    expect(compensationCopy.sheet.templateCreateHelp).toMatch(/Empleados/i);
    expect(compensationCopy.templates.description).toMatch(/Empleados/i);
  });

  it("toast post-asignación: estado vigente|programada + CTA Armar pago", () => {
    const { toasts } = compensationCopy;
    expect(toasts.batchSuccessCurrent(1)).toMatch(/vigente/i);
    expect(toasts.batchSuccessScheduled(1)).toMatch(/programada/i);
    expect(toasts.batchSuccessArmarPago).toBe("Armar pago");
    expect(toasts.batchPartialArmarPago).toMatch(/Armar pago/i);
  });
});
