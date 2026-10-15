import { describe, expect, it, vi } from "vitest";
import { Route, Routes, useLocation } from "react-router-dom";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { getPermissionsForRole } from "@shared/permissions/domain/rolePermissions";
import type { Action, Module } from "@shared/permissions/domain/entities";
import type { UserRole } from "@shared/constants/roles";
import { DenyRolesRoute } from "./DenyRolesRoute";
import { ModuleRoute } from "./ModuleRoute";

const mockHasPermission = vi.fn<(module: Module, action: Action) => boolean>();
const mockHasRole = vi.fn<(role: UserRole) => boolean>();
const mockHasAnyRole = vi.fn<(roles: UserRole[]) => boolean>();

vi.mock("@/shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: mockHasPermission,
    hasRole: mockHasRole,
    hasAnyRole: mockHasAnyRole,
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

function renderFleetRoute(
  role: "driver" | "manager" | "client",
  path: "/vehicles" | "/trailers",
) {
  const permissions = new Set(getPermissionsForRole(role));
  mockHasPermission.mockImplementation((module, action) =>
    permissions.has(`${module}.${action}` as `${Module}.${Action}`),
  );
  mockHasRole.mockImplementation((r) => r === role);
  mockHasAnyRole.mockImplementation((roles) => roles.includes(role));

  const module = path === "/vehicles" ? "vehicles" : "trailers";

  return renderWithTheme(
    <>
      <Routes>
        <Route element={<DenyRolesRoute roles={["driver"]} />}>
          <Route element={<ModuleRoute module={module} />}>
            <Route path={path} element={<div>{module}-hub</div>} />
          </Route>
        </Route>
        <Route path="/forbidden" element={<div>forbidden-page</div>} />
      </Routes>
      <LocationProbe />
    </>,
    { route: [path], resolvedTheme: "light" },
  );
}

describe("DenyRolesRoute — fleet portal gate (Ola 9)", () => {
  it.each([
    ["/vehicles", "vehicles"],
    ["/trailers", "trailers"],
  ] as const)("driver cannot enter %s (forbidden)", (path, module) => {
    renderFleetRoute("driver", path);
    expect(screen.getByText("forbidden-page")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/forbidden");
    expect(screen.queryByText(`${module}-hub`)).not.toBeInTheDocument();
  });

  it("manager can enter /vehicles (still has vehicles.read)", () => {
    renderFleetRoute("manager", "/vehicles");
    expect(screen.getByText("vehicles-hub")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/vehicles");
  });

  it("client without vehicles.read still forbidden via ModuleRoute", () => {
    renderFleetRoute("client", "/vehicles");
    expect(screen.getByText("forbidden-page")).toBeInTheDocument();
    expect(screen.queryByText("vehicles-hub")).not.toBeInTheDocument();
  });
});
