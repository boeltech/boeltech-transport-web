import { describe, expect, it } from "vitest";

import { costsCopy } from "./costsCopy";

describe("costsCopy — F1 tres bolsillos (Del operador)", () => {
  it("empty Indirect enseña gasto / anticipo / pago fijo y no nombra «viáticos» como canal", () => {
    const teaching = [
      costsCopy.state.emptyIndirectEditable,
      costsCopy.hint.indirectChannels,
    ].join("\n");

    expect(teaching).toMatch(/gasto del viaje/i);
    expect(teaching).toMatch(/Anticipos/i);
    expect(teaching).toMatch(/Pago fijo de tarifa/i);
    expect(teaching).toMatch(/Comprobante sin adelanto/i);
    expect(teaching).not.toMatch(/\bviáticos\b/i);
    expect(costsCopy.state.emptyIndirectEditable).toMatch(/no aquí/i);
  });
});
