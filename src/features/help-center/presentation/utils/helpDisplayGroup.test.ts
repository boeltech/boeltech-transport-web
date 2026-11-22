import { describe, expect, it } from "vitest";
import { sortHelpGroupKeys } from "./helpDisplayGroup";

describe("sortHelpGroupKeys", () => {
  it("orders by menu + monitoreo/portales + Tu cuenta among known keys", () => {
    expect(
      sortHelpGroupKeys([
        "tu_cuenta",
        "portales",
        "facturacion",
        "monitoreo",
        "operacion",
        "pagos_operadores",
        "concepto_fiscal",
      ]),
    ).toEqual([
      "operacion",
      "monitoreo",
      "facturacion",
      "pagos_operadores",
      "portales",
      "tu_cuenta",
      "concepto_fiscal",
    ]);
  });
});
