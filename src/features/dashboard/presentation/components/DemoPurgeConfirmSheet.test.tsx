import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DEMO_PURGE_CONFIRM } from "../../domain/types";
import { dashboardCopy } from "../copy/dashboardCopy";
import { DemoPurgeConfirmSheet } from "./DemoPurgeConfirmSheet";

const mutate = vi.fn();

vi.mock("../../application/hooks/useDemoSeed", () => ({
  usePurgeDemoSeed: () => ({
    mutate,
    isPending: false,
  }),
}));

vi.mock("@shared/hooks/useToast", () => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

const copy = dashboardCopy.demoSeed;

describe("DemoPurgeConfirmSheet", () => {
  it("exige PURGE_DEMO antes de habilitar el submit", async () => {
    const user = userEvent.setup();
    mutate.mockReset();

    render(
      <DemoPurgeConfirmSheet open onOpenChange={vi.fn()} />,
    );

    const submit = screen.getByRole("button", { name: copy.purgeSubmit });
    expect(submit).toBeDisabled();

    await user.type(
      screen.getByLabelText(copy.purgeConfirmLabel),
      DEMO_PURGE_CONFIRM,
    );
    expect(submit).toBeEnabled();

    await user.click(submit);
    expect(mutate).toHaveBeenCalled();
  });
});
