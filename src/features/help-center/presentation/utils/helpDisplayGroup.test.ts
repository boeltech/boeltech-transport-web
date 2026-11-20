import { describe, expect, it } from "vitest";
import {
  resolveHelpDisplayGroup,
  sortHelpGroupKeys,
} from "./helpDisplayGroup";

describe("resolveHelpDisplayGroup (P-V1 A)", () => {
  it("remaps the five article ids from the V5 handoff", () => {
    expect(resolveHelpDisplayGroup("liquidar-viaje", "finanzas")).toBe(
      "pagos_operadores",
    );
    expect(
      resolveHelpDisplayGroup("registrar-anticipo-operador", "finanzas"),
    ).toBe("pagos_operadores");
    expect(resolveHelpDisplayGroup("esquema-compensacion", "finanzas")).toBe(
      "pagos_operadores",
    );
    expect(resolveHelpDisplayGroup("comparar-sucursales", "reportes")).toBe(
      "administracion",
    );
    expect(resolveHelpDisplayGroup("cuenta-seguridad", "administracion")).toBe(
      "tu_cuenta",
    );
  });

  it("maps legacy viajes → operacion", () => {
    expect(resolveHelpDisplayGroup("seguir-viaje", "viajes")).toBe("operacion");
  });

  it("keeps unknown groups as-is", () => {
    expect(resolveHelpDisplayGroup("facturar-viaje", "facturacion")).toBe(
      "facturacion",
    );
  });
});

describe("sortHelpGroupKeys", () => {
  it("orders by menu + Tu cuenta last among known keys", () => {
    expect(
      sortHelpGroupKeys([
        "tu_cuenta",
        "facturacion",
        "operacion",
        "pagos_operadores",
        "concepto_fiscal",
      ]),
    ).toEqual([
      "operacion",
      "facturacion",
      "pagos_operadores",
      "tu_cuenta",
      "concepto_fiscal",
    ]);
  });
});
