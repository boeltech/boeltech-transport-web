import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { SettlementBulkBar } from "./SettlementBulkBar";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.workbench.bulkBar;

function renderBar(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("SettlementBulkBar F7", () => {
  it("payable: habilita Registrar N cuando hay onRegisterBatch", async () => {
    const user = userEvent.setup();
    const onRegister = vi.fn();
    renderBar(
      <SettlementBulkBar
        mode="payable"
        selectedCount={3}
        selectedTotal={3000}
        withoutClabeCount={1}
        onRegisterBatch={onRegister}
      />,
    );

    expect(screen.getByText(copy.selected(3))).toBeInTheDocument();
    expect(screen.getByText(copy.cashNote(1))).toBeInTheDocument();
    expect(
      screen.getByTestId("settlement-bulk-clabe-employees-link"),
    ).toHaveAttribute("href", "/employees");
    expect(
      screen.getByRole("link", { name: copy.completeClabeInEmployees }),
    ).toBeInTheDocument();
    const btn = screen.getByTestId("settlement-bulk-register");
    expect(btn).toBeEnabled();
    await user.click(btn);
    expect(onRegister).toHaveBeenCalled();
  });

  it("approval: Autorizar N / Rechazar", async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    const onReject = vi.fn();
    renderBar(
      <SettlementBulkBar
        mode="approval"
        selectedCount={2}
        selectedTotal={2000}
        onApproveBatch={onApprove}
        onRejectBatch={onReject}
      />,
    );

    expect(screen.getByTestId("settlement-bulk-bar")).toHaveAttribute(
      "data-mode",
      "approval",
    );
    await user.click(screen.getByTestId("settlement-bulk-approve"));
    await user.click(screen.getByTestId("settlement-bulk-reject"));
    expect(onApprove).toHaveBeenCalled();
    expect(onReject).toHaveBeenCalled();
  });
});
