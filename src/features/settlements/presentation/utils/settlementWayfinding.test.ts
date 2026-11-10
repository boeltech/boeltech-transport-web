import { describe, expect, it } from "vitest";
import { settlementsCopy } from "../copy/settlementsCopy";
import {
  isSafeSettlementReturnHref,
  isSettlementCreateHref,
  resolveSettlementBackHref,
  resolveSettlementWayfindingBackLabel,
} from "./settlementWayfinding";

const actions = settlementsCopy.actions;

describe("settlementWayfinding", () => {
  it("acepta colas internas y rechaza el alta", () => {
    expect(isSafeSettlementReturnHref("/finance/operator-payments?bucket=payable")).toBe(
      true,
    );
    expect(
      isSafeSettlementReturnHref("/finance/operator-payments?bucket=approval"),
    ).toBe(true);
    expect(isSafeSettlementReturnHref("/finance/approvals?type=internal_staff_compensation")).toBe(
      true,
    );
    expect(isSafeSettlementReturnHref("/finance/operator-payments/new")).toBe(false);
    expect(isSafeSettlementReturnHref("/trips")).toBe(false);
  });

  it("detecta href del alta para return desde Tarifas / empleado", () => {
    expect(isSettlementCreateHref("/finance/operator-payments/new")).toBe(true);
    expect(
      isSettlementCreateHref(
        "/finance/operator-payments/new?employeeId=emp-1&periodStart=2026-08-01&periodEnd=2026-08-15",
      ),
    ).toBe(true);
    expect(isSettlementCreateHref("/finance/operator-payments")).toBe(false);
  });

  it("resuelve href de vuelta o cae a Por pagar", () => {
    expect(
      resolveSettlementBackHref("/finance/operator-payments?bucket=approval"),
    ).toBe("/finance/operator-payments?bucket=approval");
    expect(
      resolveSettlementBackHref(
        "/finance/operator-payments?bucket=approval&driverId=emp-1",
      ),
    ).toBe("/finance/operator-payments?bucket=approval&employeeId=emp-1");
    expect(resolveSettlementBackHref("/finance/operator-payments/new")).toBe(
      "/finance/operator-payments",
    );
    expect(resolveSettlementBackHref(undefined)).toBe("/finance/operator-payments");
  });

  it("label según la cola", () => {
    expect(
      resolveSettlementWayfindingBackLabel("/finance/operator-payments?bucket=draft"),
    ).toBe(actions.backToWorkbench);
    expect(
      resolveSettlementWayfindingBackLabel(
        "/finance/operator-payments?bucket=approval",
      ),
    ).toBe(actions.backToPendingApproval);
    expect(
      resolveSettlementWayfindingBackLabel(
        "/finance/operator-payments?bucket=approval",
      ),
    ).toBe(actions.backToPendingApproval);
    expect(
      resolveSettlementWayfindingBackLabel("/finance/operator-payments?bucket=closed"),
    ).toBe(actions.backToRegistry);
    expect(
      resolveSettlementWayfindingBackLabel("/finance/operator-payments/advances"),
    ).toBe(actions.backToAdvances);
    expect(
      resolveSettlementWayfindingBackLabel(
        "/finance/approvals?type=internal_staff_compensation",
      ),
    ).toBe(actions.backToApprovals);
    expect(resolveSettlementWayfindingBackLabel("/finance/compensation")).toBe(
      actions.backToAgreements,
    );
    expect(
      resolveSettlementWayfindingBackLabel(
        "/finance/operator-payments/tariffs?employeeId=emp-1",
      ),
    ).toBe(actions.backToAgreements);
    expect(
      resolveSettlementWayfindingBackLabel("/finance/agreements"),
    ).toBe(actions.backToAgreements);
  });
});
