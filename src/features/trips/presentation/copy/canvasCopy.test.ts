import { describe, expect, it } from "vitest";

import { canvasCopy } from "./canvasCopy";

describe("canvasCopy", () => {
  it("usa sentence case y un CTA Reservar en el canvas", () => {
    expect(canvasCopy.page.title).toBe("Reservar viaje");
    expect(canvasCopy.submit.label).toBe("Reservar viaje");
    expect(canvasCopy.columns.pedido).toBe("Pedido");
    expect(canvasCopy.columns.flota).toBe("Flota");
  });

  it("declara el estimado interno (D9) sin cotización al cliente", () => {
    expect(canvasCopy.estimate.disclaimer).toMatch(/no es precio al cliente/i);
    expect(canvasCopy.estimate.disclaimer).toMatch(/percances no incluidos/i);
    expect(canvasCopy.estimate.doesNotBlock).toMatch(/no bloquea reservar/i);
    expect(canvasCopy.estimate.compactLine("$1")).toMatch(/no es precio al cliente/i);
    const estimateCopy = JSON.stringify(canvasCopy.estimate);
    expect(estimateCopy).not.toMatch(/cotizaci[oó]n al cliente/i);
  });

  it("explica que el corredor clona paradas y no copia flota", () => {
    expect(canvasCopy.corridor.hint).toMatch(/paradas/i);
    expect(canvasCopy.corridor.hint).toMatch(/no copia flota/i);
    expect(canvasCopy.corridor.empty).toMatch(/ciudades/i);
  });
});
