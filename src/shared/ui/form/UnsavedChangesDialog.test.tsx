import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UnsavedChangesDialog } from "./UnsavedChangesDialog";
import { UNSAVED_CHANGES_COPY } from "@shared/hooks/useUnsavedChangesGuard";

describe("UnsavedChangesDialog (controlled)", () => {
  it("renders copy and wires confirm / dismiss", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onDismiss = vi.fn();

    render(
      <UnsavedChangesDialog
        open
        onConfirm={onConfirm}
        onDismiss={onDismiss}
      />,
    );

    expect(
      screen.getByRole("alertdialog", { name: UNSAVED_CHANGES_COPY.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(UNSAVED_CHANGES_COPY.description),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: UNSAVED_CHANGES_COPY.confirmLabel }),
    );
    expect(onConfirm).toHaveBeenCalledTimes(1);

    onDismiss.mockClear();
    render(
      <UnsavedChangesDialog
        open
        onConfirm={onConfirm}
        onDismiss={onDismiss}
      />,
    );
    await user.click(
      screen.getByRole("button", {
        name: UNSAVED_CHANGES_COPY.keepEditingLabel,
      }),
    );
    expect(onDismiss).toHaveBeenCalled();
  });
});
