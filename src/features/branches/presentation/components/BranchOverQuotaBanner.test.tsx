import { describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { BranchOverQuotaBanner } from "./BranchOverQuotaBanner";
import { branchesCopy } from "../copy/branchesCopy";
import { buildBranchListMeta } from "../../test/branchTestFixtures";

function renderBanner(props: ComponentProps<typeof BranchOverQuotaBanner>) {
  return render(
    <MemoryRouter>
      <BranchOverQuotaBanner {...props} />
    </MemoryRouter>,
  );
}

describe("BranchOverQuotaBanner", () => {
  it("renders over quota message and reconcile action", async () => {
    const user = userEvent.setup();
    const onReconcile = vi.fn();

    renderBanner({
      meta: buildBranchListMeta({
        activeCount: 3,
        maxBranches: 1,
        limitReached: true,
        overQuota: true,
        overQuotaCount: 2,
        requiresRemediation: true,
        planEligibleBranchIds: ["main"],
      }),
      canReconcile: true,
      onReconcile,
    });

    expect(screen.getByText(branchesCopy.overQuota.title)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: branchesCopy.overQuota.adjustAction }));
    expect(onReconcile).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when tenant is within plan", () => {
    const { container } = renderBanner({
      meta: buildBranchListMeta({ overQuota: false }),
    });
    expect(container).toBeEmptyDOMElement();
  });
});
