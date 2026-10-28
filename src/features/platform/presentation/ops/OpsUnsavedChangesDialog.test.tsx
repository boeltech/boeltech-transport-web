import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Blocker } from "react-router-dom";
import { renderWithTheme } from "@/test/renderWithTheme";
import { UNSAVED_CHANGES_COPY } from "@shared/hooks/useUnsavedChangesGuard";
import { OpsUnsavedChangesDialog } from "./OpsUnsavedChangesDialog";

describe("OpsUnsavedChangesDialog", () => {
  it("renders Ops dialog kit (no ERP AlertDialog) when blocked", () => {
    const blocker = {
      state: "blocked",
      reset: vi.fn(),
      proceed: vi.fn(),
    } as unknown as Blocker;

    renderWithTheme(
      <div data-ops-shell="true" className="platform-ops">
        <OpsUnsavedChangesDialog blocker={blocker} />
      </div>,
    );

    const dialog = screen.getByTestId("ops-unsaved-changes-dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("role", "dialog");
    expect(dialog.className).toContain("ops-dialog-content");
    expect(
      screen.getByRole("heading", { name: UNSAVED_CHANGES_COPY.title }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("calls proceed on confirm leave", async () => {
    const user = userEvent.setup();
    const proceed = vi.fn();
    const blocker = {
      state: "blocked",
      reset: vi.fn(),
      proceed,
    } as unknown as Blocker;

    renderWithTheme(
      <div data-ops-shell="true" className="platform-ops">
        <OpsUnsavedChangesDialog blocker={blocker} />
      </div>,
    );

    await user.click(
      screen.getByRole("button", {
        name: UNSAVED_CHANGES_COPY.confirmLabel,
      }),
    );
    expect(proceed).toHaveBeenCalledTimes(1);
  });
});
