import { describe, expect, it } from "vitest";
import {
  SETTLEMENTS_ADVANCES_PATH,
  SETTLEMENTS_AGREEMENTS_PATH,
  SETTLEMENTS_CREATE_PATH,
  SETTLEMENTS_LIST_PATH,
  SETTLEMENTS_REGISTRY_PATH,
  resolveLegacySettlementsPath,
  resolveSettlementsListRedirect,
  settlementCreatePath,
  settlementDetailPath,
  settlementsAgreementsPath,
  settlementsAgreementsTabPath,
  settlementsAdvancesPath,
  settlementsRegistryPath,
  settlementsWorkbenchBucketPath,
  resolveOperatorPaymentsHubTab,
  SETTLEMENTS_PENDING_APPROVAL_PATH,
} from "./settlementsRoutes";

describe("settlementsRoutes", () => {
  it("exposes canonical list and create paths", () => {
    expect(SETTLEMENTS_LIST_PATH).toBe("/finance/settlements");
    expect(SETTLEMENTS_CREATE_PATH).toBe("/finance/settlements/new");
    expect(SETTLEMENTS_REGISTRY_PATH).toBe("/finance/settlements/registry");
    expect(SETTLEMENTS_ADVANCES_PATH).toBe("/finance/settlements/advances");
    expect(SETTLEMENTS_PENDING_APPROVAL_PATH).toBe(
      "/finance/settlements/pending-approval",
    );
    expect(SETTLEMENTS_AGREEMENTS_PATH).toBe("/finance/agreements");
  });

  it("builds detail path from id", () => {
    expect(settlementDetailPath("settlement-123")).toBe(
      "/finance/settlements/settlement-123",
    );
  });

  it("builds create path without params", () => {
    expect(settlementCreatePath()).toBe("/finance/settlements/new");
  });

  it("builds create path with query params", () => {
    expect(
      settlementCreatePath({
        employeeId: "emp-1",
        periodStart: "2026-08-01",
        periodEnd: "2026-08-15",
      }),
    ).toBe(
      "/finance/settlements/new?employeeId=emp-1&periodStart=2026-08-01&periodEnd=2026-08-15",
    );
  });

  it("builds agreements path with optional employee filter", () => {
    expect(settlementsAgreementsPath()).toBe("/finance/compensation/templates");
    expect(settlementsAgreementsPath({ employeeId: "emp-1" })).toBe(
      "/finance/compensation/templates?employeeId=emp-1",
    );
    expect(settlementsAgreementsTabPath({ employeeId: "emp-1" })).toBe(
      "/finance/compensation/templates?employeeId=emp-1",
    );
  });

  it("redirects legacy agreements tab query to compensation templates", () => {
    expect(
      resolveSettlementsListRedirect("?tab=agreements&employeeId=emp-1"),
    ).toBe("/finance/compensation/templates?employeeId=emp-1");
    expect(resolveSettlementsListRedirect("?tab=settlements")).toBeNull();
  });

  it("redirects legacy registry and advances query to dedicated paths", () => {
    expect(
      resolveSettlementsListRedirect("?view=registry&tab=settlements"),
    ).toBe("/finance/settlements/registry");
    expect(
      resolveSettlementsListRedirect(
        "?view=registry&tab=settlements&status=approved",
      ),
    ).toBe("/finance/settlements/registry?status=approved");
    expect(resolveSettlementsListRedirect("?tab=advances")).toBe(
      "/finance/settlements/advances",
    );
  });

  it("builds registry, advances and bucket paths", () => {
    expect(settlementsRegistryPath()).toBe("/finance/settlements/registry");
    expect(settlementsRegistryPath({ status: "approved" })).toBe(
      "/finance/settlements/registry?status=approved",
    );
    expect(settlementsAdvancesPath()).toBe("/finance/settlements/advances");
    expect(settlementsWorkbenchBucketPath("payable")).toBe(
      "/finance/settlements?bucket=payable",
    );
  });

  it("resuelve tabs del hub Pagos a operadores", () => {
    expect(resolveOperatorPaymentsHubTab("/finance/settlements")).toBe(
      "por-pagar",
    );
    expect(
      resolveOperatorPaymentsHubTab("/finance/settlements/pending-approval"),
    ).toBe("por-autorizar");
    expect(resolveOperatorPaymentsHubTab("/finance/settlements/advances")).toBe(
      "adelantos",
    );
    expect(
      resolveOperatorPaymentsHubTab("/finance/compensation/templates"),
    ).toBe("como-te-pago");
    expect(
      resolveOperatorPaymentsHubTab("/finance/compensation/corridors"),
    ).toBe("tabla-de-rutas");
  });

  describe("resolveLegacySettlementsPath", () => {
    it("maps legacy list path", () => {
      expect(resolveLegacySettlementsPath("/settlements", "")).toBe(
        "/finance/settlements",
      );
    });

    it("maps legacy list path with search", () => {
      expect(resolveLegacySettlementsPath("/settlements", "?bucket=draft")).toBe(
        "/finance/settlements?bucket=draft",
      );
    });

    it("redirects legacy agreements tab on list path", () => {
      expect(
        resolveLegacySettlementsPath("/settlements", "?tab=agreements"),
      ).toBe("/finance/compensation/templates");
    });

    it("redirects legacy registry query on list path", () => {
      expect(
        resolveLegacySettlementsPath(
          "/settlements",
          "?view=registry&tab=settlements",
        ),
      ).toBe("/finance/settlements/registry");
    });

    it("maps legacy create path with search", () => {
      expect(
        resolveLegacySettlementsPath(
          "/settlements/new",
          "?employeeId=emp-1&periodStart=2026-08-01",
        ),
      ).toBe(
        "/finance/settlements/new?employeeId=emp-1&periodStart=2026-08-01",
      );
    });

    it("maps legacy detail path with search", () => {
      expect(
        resolveLegacySettlementsPath("/settlements/settlement-123", "?foo=bar"),
      ).toBe("/finance/settlements/settlement-123?foo=bar");
    });

    it("falls back to list for unknown legacy path", () => {
      expect(
        resolveLegacySettlementsPath("/settlements/unknown/extra", ""),
      ).toBe("/finance/settlements/unknown/extra");
    });
  });
});
