import { describe, expect, it } from "vitest";

import { canvasCopy } from "./canvasCopy";

describe("canvasCopy", () => {
  it("usa sentence case y un CTA Reservar en el canvas", () => {
    expect(canvasCopy.page.title).toBe("Reservar viaje");
    expect(canvasCopy.submit.label).toBe("Reservar viaje");
    expect(canvasCopy.columns.pedido).toBe("Pedido");
    expect(canvasCopy.columns.flota).toBe("Flota");
  });

  it("renombra el colapsable sin colisión con Confirmar reserva (PD3)", () => {
    expect(canvasCopy.confirmLater.title).toBe("Opcional ahora");
    expect(canvasCopy.confirmLater.title).not.toMatch(/confirmar/i);
    expect(canvasCopy.confirmLater.hint).toMatch(/no hace falta para reservar/i);
    expect(canvasCopy.confirmLater.hint).not.toMatch(/confirmar reserva/i);
  });

  it("declara el estimado interno (D9) sin cotización al cliente", () => {
    expect(canvasCopy.estimate.disclaimer).toMatch(/no es precio al cliente/i);
    expect(canvasCopy.estimate.disclaimer).toMatch(/percances no incluidos/i);
    expect(canvasCopy.estimate.doesNotBlock).toMatch(/no bloquea reservar/i);
    expect(canvasCopy.estimate.compactLine("$1")).toMatch(/no es precio al cliente/i);
    const estimateCopy = JSON.stringify(canvasCopy.estimate);
    expect(estimateCopy).not.toMatch(/cotizaci[oó]n al cliente/i);
  });

  it("mantiene hint de corredor corto en superficie y detalle en hintDetail (PD5)", () => {
    expect(canvasCopy.corridor.hint.length).toBeLessThanOrEqual(72);
    expect(canvasCopy.corridor.hint).toMatch(/paradas/i);
    expect(canvasCopy.corridor.hintDetail).toMatch(/paradas/i);
    expect(canvasCopy.corridor.hintDetail).toMatch(/no copia flota/i);
    expect(canvasCopy.corridor.hintDetail).toMatch(/no es tarifa de pago/i);
    expect(canvasCopy.corridor.empty).toMatch(/ciudades/i);
  });
});
