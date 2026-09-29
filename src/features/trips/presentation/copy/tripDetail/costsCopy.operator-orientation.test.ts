import { describe, expect, it } from "vitest";

import { costsCopy } from "./costsCopy";

const operatorBannerCopy = [
  costsCopy.alert.pendingApprovalBodyOperator,
  costsCopy.hint.postCloseWindowOperator,
  costsCopy.hint.postCloseWindowClosedOperator,
  costsCopy.hint.inProgressOperator,
  costsCopy.alert.marginCriticalBodyOperator,
].join("\n");

describe("costsCopy — orientación operator (D10–D12)", () => {
  it("pending nombra admin/gerente/contador y no invita a la bandeja", () => {
    expect(costsCopy.alert.pendingApprovalBodyOperator).toMatch(/admin/i);
    expect(costsCopy.alert.pendingApprovalBodyOperator).toMatch(/gerente/i);
    expect(costsCopy.alert.pendingApprovalBodyOperator).toMatch(/contador/i);
    expect(costsCopy.alert.pendingApprovalBodyOperator).not.toMatch(
      /bandeja|Apruebe aquí|Aprobar/i,
    );
  });

  it("post-cierre operator no promete alta tardía ni eliminar", () => {
    expect(costsCopy.hint.postCloseWindowOperator).toMatch(/editar|revisión/i);
    expect(costsCopy.hint.postCloseWindowOperator).not.toMatch(
      /registrar gastos tardíos/i,
    );
    expect(costsCopy.hint.postCloseWindowOperator).not.toMatch(/eliminar/i);
    expect(costsCopy.hint.postCloseWindowClosedOperator).toMatch(/solo lectura/i);
    expect(costsCopy.hint.postCloseWindowClosedOperator).not.toMatch(
      /\bSAT\b|reabrir/i,
    );
  });

  it("banners operator no mencionan tarifa, efectivo ni Facturado", () => {
    expect(operatorBannerCopy).not.toMatch(/tarifa|efectivo|Facturado/i);
    expect(costsCopy.hint.inProgress).toMatch(/tarifa/i);
    expect(costsCopy.hint.postCloseWindow).toMatch(/tardíos/i);
  });
});
