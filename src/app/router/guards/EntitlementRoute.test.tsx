import { describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { EntitlementRoute } from "./EntitlementRoute";
import type { EntitlementState } from "@features/billing";

const mockUseEntitlement = vi.fn();

vi.mock("@features/billing", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/billing")>();
  return {
    ...actual,
    useEntitlement: (...args: unknown[]) => mockUseEntitlement(...args),
  };
});

function entitlement(state: EntitlementState) {
  return {
    state,
    isSuccess: state !== "loading" && state !== "unknown",
    isLoading: state === "loading",
    isFetching: false,
    isError: false,
  };
}

function renderRoute(state: EntitlementState) {
  mockUseEntitlement.mockReturnValue(entitlement(state));
  return renderWithTheme(
    <Routes>
      <Route
        element={
          <EntitlementRoute
            code="gps_tracking"
            notContracted={<div>presentation-page</div>}
            unavailable={<div>unavailable-page</div>}
          />
        }
      >
        <Route path="/monitoring/fleet" element={<div>fleet-page</div>} />
      </Route>
    </Routes>,
    { route: ["/monitoring/fleet"], resolvedTheme: "light" },
  );
}

describe("EntitlementRoute", () => {
  it("loading → skeleton without outlet", () => {
    renderRoute("loading");
    expect(screen.getByTestId("entitlement-route-loading")).toBeInTheDocument();
    expect(screen.queryByText("fleet-page")).not.toBeInTheDocument();
    expect(mockUseEntitlement).toHaveBeenCalledWith("gps_tracking");
  });

  it("not_contracted → presentation inside scroll region", () => {
    renderRoute("not_contracted");
    expect(
      screen.getByTestId("entitlement-route-not-contracted-scroll"),
    ).toBeInTheDocument();
    expect(screen.getByText("presentation-page")).toBeInTheDocument();
    expect(screen.queryByText("fleet-page")).not.toBeInTheDocument();
  });

  it("unavailable → unavailable page inside scroll region", () => {
    renderRoute("unavailable");
    expect(
      screen.getByTestId("entitlement-route-unavailable-scroll"),
    ).toBeInTheDocument();
    expect(screen.getByText("unavailable-page")).toBeInTheDocument();
    expect(screen.queryByText("fleet-page")).not.toBeInTheDocument();
  });

  it.each(["active", "unknown"] as const)("%s → outlet", (state) => {
    renderRoute(state);
    expect(screen.getByText("fleet-page")).toBeInTheDocument();
  });
});
