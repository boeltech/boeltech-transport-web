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

  it("renders bulk actions when items are selected", async () => {
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

    expect(screen.getByText("3 seleccionado(s)")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Aprobar seleccionados" }));
    expect(onApproveSelected).toHaveBeenCalledTimes(1);
  });
});
