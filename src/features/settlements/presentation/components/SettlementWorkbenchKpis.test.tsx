import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { SettlementWorkbenchSummary } from "../../domain/entities";
import { SettlementWorkbenchKpis } from "./SettlementWorkbenchKpis";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.workbench.kpis;

const summary: SettlementWorkbenchSummary = {
  pending: 2,
  draft: 0,
  approval: 1,
  payable: 3,
  closed: 0,
  openAdvances: 4,
  approvalAgingDaysMax: 2,
  advancesDeductibleEstimate: 12_000,
  kpis: {
    toArm: { count: 2, amount: 39_818 },
    inApproval: { count: 1, amount: 5_000 },
    authorizedUnpaid: { count: 3, amount: 13_971 },
    advancesToDeduct: { count: 4, amount: 12_000 },
  },
};

describe("SettlementWorkbenchKpis PM-04", () => {
  it("muestra solo atajos de atención (no espeja Por armar / Por pagar)", () => {
    render(<SettlementWorkbenchKpis summary={summary} />);

    expect(screen.getByTestId("settlement-workbench-kpis")).toHaveAttribute(
      "aria-label",
      copy.ariaLabel,
    );
    expect(screen.getByTestId("settlement-kpi-in_approval")).toBeInTheDocument();
    expect(
      screen.getByTestId("settlement-kpi-advances_to_deduct"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("settlement-kpi-to_arm")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("settlement-kpi-authorized_unpaid"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(copy.toArm.label)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.authorizedUnpaid.label)).not.toBeInTheDocument();
  });
});
