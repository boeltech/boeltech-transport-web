import { describe, expect, it, vi } from "vitest";
import { Route, Routes, useLocation } from "react-router-dom";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { getPermissionsForRole } from "@shared/permissions/domain/rolePermissions";
import type { Action, Module } from "@shared/permissions/domain/entities";
import { ModuleRoute } from "./ModuleRoute";

const mockHasPermission = vi.fn<(module: Module, action: Action) => boolean>();

vi.mock("@/shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: mockHasPermission,
    isLoading: false,
    isAuthenticated: true,
  }),
}));

function LocationProbe() {
  const location = useLocation();
  return (
    <div data-testid="location">{`${location.pathname}${location.search}`}</div>
  );
}

function renderReportsRoute(role: "client" | "driver" | "manager") {
  const permissions = new Set(getPermissionsForRole(role));
  mockHasPermission.mockImplementation((module, action) =>
    permissions.has(`${module}.${action}` as `${Module}.${Action}`),
  );

  return renderWithTheme(
    <>
      <Routes>
        <Route element={<ModuleRoute module="reports" />}>
          <Route path="/reports" element={<div>reports-hub</div>} />
        </Route>
        <Route path="/forbidden" element={<div>forbidden-page</div>} />
      </Routes>
      <LocationProbe />
    </>,
    { route: ["/reports"], resolvedTheme: "light" },
  );
}

describe("ModuleRoute — reports portal gate (Ola 8)", () => {
  it.each(["client", "driver"] as const)(
    "%s cannot enter /reports (forbidden)",
    (role) => {
      renderReportsRoute(role);
      expect(screen.getByText("forbidden-page")).toBeInTheDocument();
      expect(screen.getByTestId("location")).toHaveTextContent("/forbidden");
      expect(screen.queryByText("reports-hub")).not.toBeInTheDocument();
    },
  );

  it("manager can enter /reports", () => {
    renderReportsRoute("manager");
    expect(screen.getByText("reports-hub")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/reports");
  });
});
