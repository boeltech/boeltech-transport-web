import { describe, expect, it } from "vitest";

import { compensationCopy } from "./compensationCopy";

describe("compensationCopy — F1 tres bolsillos (pago fijo de tarifa)", () => {
  it("allowances + periodo enseñan 1× por pago sin prorrateo", () => {
    expect(compensationCopy.builder.allowancesDescription).toMatch(
      /Montos fijos/i,
    );
    expect(compensationCopy.builder.allowancesDescription).toMatch(
      /se suman al pago/i,
    );
    expect(compensationCopy.builder.inspectorAllowancesHint).toMatch(
      /una vez por liquidación/i,
    );
    expect(compensationCopy.builder.inspectorAllowancesHint).toMatch(
      /no divide el monto/i,
    );
    expect(compensationCopy.sheet.allowancePeriodHint).toMatch(/ritmo del acuerdo/i);
    expect(compensationCopy.sheet.allowancePeriodHint).toMatch(/1× por corte/i);
    expect(compensationCopy.sheet.allowancePeriodHint).toMatch(
      /no se divide por días/i,
    );
  });
});

describe("compensationCopy — F2 clase de ruta", () => {
  it("glosario Foráneo / Local / Transfer / Patio; campo Clase de ruta", () => {
    expect(compensationCopy.builder.routeTypeLabels).toEqual({
      local: "Local",
      long_haul: "Foráneo",
      transfer: "Transfer / Patio",
    });
    expect(compensationCopy.simulation.routeTypes).toEqual({
      local: "Local",
      long_haul: "Foráneo",
      transfer: "Transfer / Patio",
    });
    expect(compensationCopy.builder.routeTypeLabel).toBe("Clase de ruta");
    expect(compensationCopy.simulation.routeTypeLabel).toBe("Clase de ruta");
    expect(compensationCopy.builder.paymentDescription).toMatch(
      /Cada clase de ruta puede tener su propia regla de pago/i,
    );
    expect(compensationCopy.builder.paymentDescription).toMatch(
      /clase elegida al despachar/i,
    );
    expect(JSON.stringify(compensationCopy)).not.toMatch(/Movimiento local/);
    expect(JSON.stringify(compensationCopy)).not.toMatch(/Tipo de viaje/);
  });
});

describe("compensationCopy — precedencia corredor > regla (ADR-0089 D3)", () => {
  it("inspectorPrecedenceHint explains fixed route before class-of-route fallback", () => {
    expect(compensationCopy.builder.inspectorPrecedenceHint).toMatch(
      /ruta con tarifa fija/i,
    );
    expect(compensationCopy.builder.inspectorPrecedenceHint).toMatch(
      /pago por clase de ruta/i,
    );
    expect(compensationCopy.builder.inspectorPrecedenceHint).not.toMatch(/suma/i);
  });
});
