import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ApprovalBlock } from "../../domain";
import { approvalsCopy } from "../copy/approvalsCopy";
import { ReturnedAlert } from "./ReturnedAlert";

const copy = approvalsCopy.flow;

const returnedApproval: Pick<ApprovalBlock, "returned"> = {
  returned: {
    reason: "Falta comprobante",
    reasonCode: "missing_receipt",
    returnedBy: "user-ana",
    returnedByName: "Ana López",
    returnedAt: "2026-10-01T12:00:00.000Z",
  },
};

describe("ReturnedAlert", () => {
  it("renderiza título y resumen sin CTA", () => {
    render(<ReturnedAlert approval={returnedApproval} />);

    expect(screen.getByText(copy.returnedAlertTitle)).toBeInTheDocument();
    expect(screen.getByText(/Falta comprobante/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("pasa el CTA por el slot action de DetailAlertCard", () => {
    render(
      <ReturnedAlert
        approval={returnedApproval}
        action={<button type="button">{copy.correctAndResubmit}</button>}
      />,
    );

    expect(
      screen.getByRole("button", { name: copy.correctAndResubmit }),
    ).toBeInTheDocument();
  });
});
