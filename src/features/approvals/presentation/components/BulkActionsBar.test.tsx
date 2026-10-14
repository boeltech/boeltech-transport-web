import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BulkActionsBar } from "./BulkActionsBar";

describe("BulkActionsBar", () => {
  it("does not render when nothing is selected", () => {
    const { container } = render(
      <BulkActionsBar
        selectedCount={0}
        maxSelection={50}
        canUpdate
        onApproveSelected={vi.fn()}
        onRejectSelected={vi.fn()}
        onClearSelection={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders sticky bulk actions with short approve label when items are selected", async () => {
    const user = userEvent.setup();
    const onApproveSelected = vi.fn();

    render(
      <BulkActionsBar
        selectedCount={3}
        maxSelection={50}
        canUpdate
        onApproveSelected={onApproveSelected}
        onRejectSelected={vi.fn()}
        onClearSelection={vi.fn()}
      />,
    );

    const bar = screen.getByTestId("approvals-bulk-actions-bar");
    expect(bar.className).toMatch(/sticky/);
    expect(screen.getByText("3 seleccionado(s)")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Aprobar" }));
    expect(onApproveSelected).toHaveBeenCalledTimes(1);
  });
});
