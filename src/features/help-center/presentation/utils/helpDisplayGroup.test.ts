import { describe, expect, it } from "vitest";
import {
  resolveHelpDisplayGroup,
  sortHelpGroupKeys,
} from "./helpDisplayGroup";

describe("resolveHelpDisplayGroup (P-V1 A)", () => {
  it("no remapea ids U07 (group viene de datos)", () => {
    expect(resolveHelpDisplayGroup("liquidar-viaje", "finanzas")).toBe(
      "finanzas",
    );
    expect(
      resolveHelpDisplayGroup("registrar-anticipo-operador", "finanzas"),
    ).toBe("finanzas");
    expect(resolveHelpDisplayGroup("esquema-compensacion", "finanzas")).toBe(
      "finanzas",
    );
    expect(
      resolveHelpDisplayGroup("liquidar-viaje", "pagos_operadores"),
    ).toBe("pagos_operadores");
  });

  it("remaps article ids de otras unidades", () => {
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
