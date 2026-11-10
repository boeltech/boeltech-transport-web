import { describe, expect, it } from "vitest";
import {
  LEGACY_FINANCE_SETTLEMENTS_ADVANCES_PATH,
  LEGACY_FINANCE_SETTLEMENTS_PATH,
  LEGACY_FINANCE_SETTLEMENTS_PENDING_APPROVAL_PATH,
  LEGACY_FINANCE_SETTLEMENTS_REGISTRY_PATH,
  OPERATOR_PAYMENTS_BASE_PATH,
  SETTLEMENTS_ADVANCES_PATH,
  SETTLEMENTS_CREATE_PATH,
  SETTLEMENTS_LIST_PATH,
  SETTLEMENTS_OPERATORS_PATH,
  resolveLegacySettlementsPath,
  resolveSettlementsListRedirect,
  settlementCreatePath,
  settlementDetailPath,
  settlementsAdvancesPath,
  settlementsAgreementsPath,
  settlementsPendingApprovalPath,
  settlementsRegistryPath,
  settlementsWorkbenchBucketPath,
} from "./settlementsRoutes";
import { COMPENSATION_TEMPLATES_PATH } from "@features/compensation/application";

describe("settlementsRoutes (F2 canónicas)", () => {
  it("expone paths canónicos bajo /finance/operator-payments", () => {
    expect(OPERATOR_PAYMENTS_BASE_PATH).toBe("/finance/operator-payments");
    expect(SETTLEMENTS_LIST_PATH).toBe("/finance/operator-payments");
    expect(SETTLEMENTS_CREATE_PATH).toBe("/finance/operator-payments/new");
    expect(SETTLEMENTS_ADVANCES_PATH).toBe(
      "/finance/operator-payments/advances",
    );
    expect(SETTLEMENTS_OPERATORS_PATH).toBe(
      "/finance/operator-payments/operators",
    );
  });

  it("arma detail y create con query", () => {
    expect(settlementDetailPath("settlement-123")).toBe(
      "/finance/operator-payments/settlement-123",
    );
    expect(settlementCreatePath()).toBe("/finance/operator-payments/new");
    expect(
      settlementCreatePath({
        employeeId: "emp-1",
        periodStart: "2026-08-01",
        periodEnd: "2026-08-15",
      }),
    ).toBe(
      "/finance/operator-payments/new?employeeId=emp-1&periodStart=2026-08-01&periodEnd=2026-08-15",
    );
  });

  it("apunta acuerdos/tarifas al listado canónico", () => {
    expect(settlementsAgreementsPath()).toBe(COMPENSATION_TEMPLATES_PATH);
    expect(settlementsAgreementsPath({ employeeId: "emp-1" })).toBe(
      `${COMPENSATION_TEMPLATES_PATH}?employeeId=emp-1`,
    );
  });

  it("registry = Pagados (closed) y pending-approval = approval", () => {
    expect(settlementsRegistryPath()).toBe(
      "/finance/operator-payments?bucket=closed",
    );
    expect(settlementsPendingApprovalPath()).toBe(
      "/finance/operator-payments?bucket=approval",
    );
    expect(settlementsWorkbenchBucketPath("payable")).toBe(
      "/finance/operator-payments?bucket=payable",
    );
    expect(settlementsAdvancesPath()).toBe(
      "/finance/operator-payments/advances",
    );
  });

  it("redirige query legacy del listado", () => {
    expect(resolveSettlementsListRedirect("?view=registry")).toBe(
      "/finance/operator-payments?bucket=closed",
    );
    expect(resolveSettlementsListRedirect("?tab=advances")).toBe(
      "/finance/operator-payments/advances",
    );
    expect(resolveSettlementsListRedirect("?tab=agreements")).toBe(
      COMPENSATION_TEMPLATES_PATH,
    );
  });

  it("redirige /finance/settlements/* y /settlements/* sin 404", () => {
    expect(resolveLegacySettlementsPath(LEGACY_FINANCE_SETTLEMENTS_PATH, "")).toBe(
      SETTLEMENTS_LIST_PATH,
    );
    expect(
      resolveLegacySettlementsPath(LEGACY_FINANCE_SETTLEMENTS_ADVANCES_PATH, ""),
    ).toBe(SETTLEMENTS_ADVANCES_PATH);
    expect(
      resolveLegacySettlementsPath(
        LEGACY_FINANCE_SETTLEMENTS_REGISTRY_PATH,
        "",
      ),
    ).toBe("/finance/operator-payments?bucket=closed");
    expect(
      resolveLegacySettlementsPath(
        LEGACY_FINANCE_SETTLEMENTS_PENDING_APPROVAL_PATH,
        "",
      ),
    ).toBe("/finance/operator-payments?bucket=approval");
    expect(
      resolveLegacySettlementsPath("/finance/settlements/new", ""),
    ).toBe(SETTLEMENTS_CREATE_PATH);
    expect(
      resolveLegacySettlementsPath("/finance/settlements/abc", "?foo=1"),
    ).toBe("/finance/operator-payments/abc?foo=1");
    expect(resolveLegacySettlementsPath("/settlements", "")).toBe(
      SETTLEMENTS_LIST_PATH,
    );
    expect(resolveLegacySettlementsPath("/settlements/xyz", "")).toBe(
      "/finance/operator-payments/xyz",
    );
  });
});
