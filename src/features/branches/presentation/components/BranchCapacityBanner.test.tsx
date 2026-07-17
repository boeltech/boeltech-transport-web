import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BranchCapacityBanner } from "./BranchCapacityBanner";
import { branchesCopy } from "../copy/branchesCopy";
import { buildBranchListMeta } from "../../test/branchTestFixtures";

describe("BranchCapacityBanner", () => {
  it("renders limited capacity label", () => {
    render(<BranchCapacityBanner meta={buildBranchListMeta({ activeCount: 2, maxBranches: 3 })} />);

    expect(
      screen.getByText(branchesCopy.list.capacity.limited(2, 3)),
    ).toBeInTheDocument();
  });

  it("renders unlimited capacity label", () => {
    render(
      <BranchCapacityBanner
        meta={buildBranchListMeta({ activeCount: 5, maxBranches: null })}
      />,
    );

    expect(
      screen.getByText(branchesCopy.list.capacity.unlimited(5)),
    ).toBeInTheDocument();
  });

  it("shows limit reached hint when plan cap is reached", () => {
    render(
      <BranchCapacityBanner
        meta={buildBranchListMeta({
          activeCount: 3,
          maxBranches: 3,
          limitReached: true,
        })}
      />,
    );

    expect(
      screen.getByText(branchesCopy.list.capacity.limitReachedHint),
    ).toBeInTheDocument();
  });

  it("shows over quota hint when active branches exceed plan", () => {
    render(
      <BranchCapacityBanner
        meta={buildBranchListMeta({
          activeCount: 3,
          maxBranches: 1,
          limitReached: true,
          overQuota: true,
          overQuotaCount: 2,
          requiresRemediation: true,
        })}
      />,
    );

    expect(
      screen.getByText(branchesCopy.list.capacity.overQuotaHint(3, 1)),
    ).toBeInTheDocument();
  });

  it("renders nothing without meta", () => {
    const { container } = render(<BranchCapacityBanner />);
    expect(container).toBeEmptyDOMElement();
  });
});
