import { describe, expect, it } from "vitest";
import { settlementsCopy } from "../copy/settlementsCopy";
import {
  isSafeSettlementReturnHref,
  resolveSettlementBackHref,
  resolveSettlementWayfindingBackLabel,
} from "./settlementWayfinding";

const actions = settlementsCopy.actions;

describe("settlementWayfinding", () => {
  it("acepta colas internas y rechaza el alta", () => {
    expect(isSafeSettlementReturnHref("/finance/settlements?bucket=payable")).toBe(
      true,
    );
    expect(
      isSafeSettlementReturnHref("/finance/settlements/pending-approval"),
    ).toBe(true);
    expect(isSafeSettlementReturnHref("/finance/approvals?type=internal_staff_compensation")).toBe(
      true,
    );
    expect(isSafeSettlementReturnHref("/finance/settlements/new")).toBe(false);
    expect(isSafeSettlementReturnHref("/trips")).toBe(false);
  });

  it("resuelve href de vuelta o cae a Por pagar", () => {
    expect(
      resolveSettlementBackHref("/finance/settlements/pending-approval"),
    ).toBe("/finance/settlements/pending-approval");
    expect(resolveSettlementBackHref("/finance/settlements/new")).toBe(
      "/finance/settlements",
    );
    expect(resolveSettlementBackHref(undefined)).toBe("/finance/settlements");
  });

  it("label según la cola", () => {
    expect(
      resolveSettlementWayfindingBackLabel("/finance/settlements?bucket=draft"),
    ).toBe(actions.backToWorkbench);
    expect(
      resolveSettlementWayfindingBackLabel(
        "/finance/settlements/pending-approval",
      ),
    ).toBe(actions.backToPendingApproval);
    expect(
      resolveSettlementWayfindingBackLabel("/finance/settlements/registry"),
    ).toBe(actions.backToRegistry);
    expect(
      resolveSettlementWayfindingBackLabel("/finance/settlements/advances"),
    ).toBe(actions.backToAdvances);
    expect(
      resolveSettlementWayfindingBackLabel(
        "/finance/approvals?type=internal_staff_compensation",
      ),
    ).toBe(actions.backToApprovals);
    expect(resolveSettlementWayfindingBackLabel("/finance/compensation")).toBe(
      actions.backToList,
    );
  });
});
