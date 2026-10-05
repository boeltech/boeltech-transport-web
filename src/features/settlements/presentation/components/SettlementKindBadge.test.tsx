import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { formatDate } from "@shared/utils/dateUtils";
import { settlementsCopy } from "../copy/settlementsCopy";
import { settlementPeriodLabel } from "../utils/reimbursementLines";
import { SettlementKindBadge } from "./SettlementKindBadge";

describe("SettlementKindBadge", () => {
  it("muestra «Pago de reembolsos» solo en reimbursement_only", () => {
    render(<SettlementKindBadge kind="reimbursement_only" />);
    expect(screen.getByTestId("settlement-kind-badge")).toHaveTextContent(
      settlementsCopy.reimbursements.kindLabel,
    );
  });

  it.each(["regular", null, undefined] as const)("no muestra insignia para %s", (kind) => {
    render(<SettlementKindBadge kind={kind} />);
    expect(screen.queryByTestId("settlement-kind-badge")).not.toBeInTheDocument();
  });
});

describe("settlementPeriodLabel", () => {
  const base = {
    periodStart: "2026-10-01",
    periodEnd: "2026-10-15",
    createdAt: "2026-10-16T18:00:00Z",
  };

  it("pago de reembolsos: fecha de alta en lugar del período", () => {
    expect(settlementPeriodLabel({ ...base, settlementKind: "reimbursement_only" })).toBe(
      formatDate(base.createdAt),
    );
  });

  it("pago regular: rango del período", () => {
    expect(settlementPeriodLabel({ ...base, settlementKind: "regular" })).toBe(
      `${formatDate(base.periodStart)} – ${formatDate(base.periodEnd)}`,
    );
  });
});
