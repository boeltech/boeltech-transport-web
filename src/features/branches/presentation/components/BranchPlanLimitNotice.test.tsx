import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { BranchPlanLimitNotice } from "./BranchPlanLimitNotice";
import { branchesCopy } from "../copy/branchesCopy";
import { buildBranchListMeta } from "../../test/branchTestFixtures";

describe("BranchPlanLimitNotice", () => {
  it("avisa al llegar al tope con enlace a Plan y consumo", () => {
    render(
      <MemoryRouter initialEntries={["/branches"]}>
        <BranchPlanLimitNotice
          meta={buildBranchListMeta({
            activeCount: 3,
            maxBranches: 3,
            limitReached: true,
            overQuota: false,
          })}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(branchesCopy.limitReached.title)).toBeInTheDocument();
    expect(
      screen.getByText(branchesCopy.limitReached.descriptionWithLimit(3)),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: branchesCopy.limitReached.billingCta }),
    ).toHaveAttribute("href", "/settings/subscription");
  });

  it("navega a Tu plan con state.from y fromLabel (H-U09-N02)", async () => {
    const user = userEvent.setup();

    function SubscriptionProbe() {
      const location = useLocation();
      return (
        <pre data-testid="subscription-state">
          {JSON.stringify(location.state)}
        </pre>
      );
    }

    render(
      <MemoryRouter initialEntries={["/branches"]}>
        <Routes>
          <Route
            path="/branches"
            element={
              <BranchPlanLimitNotice
                meta={buildBranchListMeta({
                  activeCount: 3,
                  maxBranches: 3,
                  limitReached: true,
                  overQuota: false,
                })}
              />
            }
          />
          <Route
            path="/settings/subscription"
            element={<SubscriptionProbe />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("link", {
        name: branchesCopy.limitReached.billingCta,
      }),
    );

    expect(screen.getByTestId("subscription-state")).toHaveTextContent(
      '"from":"/branches"',
    );
    expect(screen.getByTestId("subscription-state")).toHaveTextContent(
      '"fromLabel":"Sucursales"',
    );
  });

  it("no se muestra con plazas libres", () => {
    const { container } = render(
      <MemoryRouter>
        <BranchPlanLimitNotice
          meta={buildBranchListMeta({
            activeCount: 2,
            maxBranches: 5,
            limitReached: false,
            overQuota: false,
          })}
        />
      </MemoryRouter>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("no se muestra en sobrecupo (lo cubre BranchOverQuotaBanner)", () => {
    const { container } = render(
      <MemoryRouter>
        <BranchPlanLimitNotice
          meta={buildBranchListMeta({
            activeCount: 5,
            maxBranches: 3,
            limitReached: true,
            overQuota: true,
          })}
        />
      </MemoryRouter>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
