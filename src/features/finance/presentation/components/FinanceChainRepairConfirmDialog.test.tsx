import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FinanceChainRepairConfirmDialog } from "./FinanceChainRepairConfirmDialog";
import { financeCopy } from "../copy";

const copy = financeCopy.cobros.chainRepair;

describe("FinanceChainRepairConfirmDialog", () => {
  it("renders as Dialog with affected labels and inline Alert on error", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <FinanceChainRepairConfirmDialog
        open
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        affectedLabels={["A-1", "A-2"]}
        errorMessage="Detalle del fallo PAC"
      />,
    );

    expect(
      screen.getByRole("heading", { name: copy.title }),
    ).toBeInTheDocument();
    expect(screen.getByText("A-1")).toBeInTheDocument();
    expect(screen.getByText("A-2")).toBeInTheDocument();
    expect(screen.getByText("Detalle del fallo PAC")).toBeInTheDocument();
    expect(
      screen.getByText(financeCopy.cobros.toastError),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: copy.confirm }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
