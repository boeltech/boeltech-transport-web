import { describe, expect, it } from "vitest";

import { costsCopy } from "../copy/tripDetail/costsCopy";
import { pickCostsStatusBannerCopy } from "./pickCostsStatusBannerCopy";

const operatorBanners = {
  isOperator: true,
  pendingExpenseCount: 0,
  canApproveExpenses: false,
  expenseWindowOpen: false,
  expenseWindowClosed: false,
  tripStatus: "in_progress",
  manageHint: true,
  marginCritical: false,
};

const staffBanners = {
  ...operatorBanners,
  isOperator: false,
};

describe("pickCostsStatusBannerCopy", () => {
  it("operator pending nombra admin/gerente/contador y no abre bandeja", () => {
    const banner = pickCostsStatusBannerCopy({
      ...operatorBanners,
      pendingExpenseCount: 2,
    });
    expect(banner?.kind).toBe("pending");
    expect(banner?.body).toBe(costsCopy.alert.pendingApprovalBodyOperator);
    expect(banner?.body).toMatch(/admin/i);
    expect(banner?.body).toMatch(/gerente/i);
    expect(banner?.body).toMatch(/contador/i);
    expect(banner?.body).not.toMatch(/bandeja|Apruebe aquí|\bAprobar\b/i);
  });

  it("operator post-cierre no dice registrar tardíos ni eliminar", () => {
    const open = pickCostsStatusBannerCopy({
      ...operatorBanners,
      tripStatus: "completed",
      expenseWindowOpen: true,
    });
    expect(open?.kind).toBe("postCloseOpen");
    expect(open?.body).toBe(costsCopy.hint.postCloseWindowOperator);
    expect(open?.body).toMatch(/editar|revisión/i);
    expect(open?.body).toMatch(/admin|gerente|contador/i);
    expect(open?.body).not.toMatch(/registrar gastos tardíos/i);
    expect(open?.body).not.toMatch(/eliminar/i);

    const closed = pickCostsStatusBannerCopy({
      ...operatorBanners,
      tripStatus: "completed",
      expenseWindowClosed: true,
    });
    expect(closed?.kind).toBe("postCloseClosed");
    expect(closed?.body).toBe(costsCopy.hint.postCloseWindowClosedOperator);
    expect(closed?.body).toMatch(/solo lectura/i);
    expect(closed?.body).not.toMatch(/\bSAT\b|reabrir/i);
  });

  it("operator en curso y margen no mencionan tarifa, efectivo ni Facturado", () => {
    const inProgress = pickCostsStatusBannerCopy(operatorBanners);
    expect(inProgress?.kind).toBe("inProgress");
    expect(inProgress?.body).toBe(costsCopy.hint.inProgressOperator);
    expect(inProgress?.body).toMatch(/Agregar de ruta/i);
    expect(inProgress?.body).not.toMatch(/tarifa|efectivo|Facturado/i);

    const margin = pickCostsStatusBannerCopy({
      ...operatorBanners,
      tripStatus: "scheduled",
      manageHint: false,
      marginCritical: true,
    });
    expect(margin?.kind).toBe("marginCritical");
    expect(margin?.body).toBe(costsCopy.alert.marginCriticalBodyOperator);
    expect(margin?.body).not.toMatch(/tarifa|efectivo|Facturado/i);
  });

  it("admin/manager/accountant conservan copy actual de post-cierre y en curso", () => {
    const open = pickCostsStatusBannerCopy({
      ...staffBanners,
      tripStatus: "completed",
      expenseWindowOpen: true,
    });
    expect(open?.body).toBe(costsCopy.hint.postCloseWindow);
    expect(open?.body).toMatch(/registrar gastos tardíos/i);

    const inProgress = pickCostsStatusBannerCopy(staffBanners);
    expect(inProgress?.body).toBe(costsCopy.hint.inProgress);
    expect(inProgress?.body).toMatch(/tarifa/i);

    const pending = pickCostsStatusBannerCopy({
      ...staffBanners,
      pendingExpenseCount: 1,
    });
    expect(pending?.body).toBe(costsCopy.alert.pendingApprovalBody);
  });
});
