import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AnyModuleRoute } from "./AnyModuleRoute";

const hasPermission = vi.fn();

vi.mock("@/shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission,
    isLoading: false,
    isAuthenticated: true,
  }),
}));

function renderRoute(path = "/fleet/documents") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          element={<AnyModuleRoute modules={["vehicles", "drivers"]} />}
        >
          <Route path="/fleet/documents" element={<div>board-ok</div>} />
        </Route>
        <Route path="/forbidden" element={<div>forbidden</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AnyModuleRoute", () => {
  it("allows access when user has vehicles.read", () => {
    hasPermission.mockImplementation(
      (module: string, action: string) =>
        module === "vehicles" && action === "read",
    );
    renderRoute();
    expect(screen.getByText("board-ok")).toBeInTheDocument();
  });

  it("allows access when user has only drivers.read", () => {
    hasPermission.mockImplementation(
      (module: string, action: string) =>
        module === "drivers" && action === "read",
    );
    renderRoute();
    expect(screen.getByText("board-ok")).toBeInTheDocument();
  });

  it("redirects to forbidden when neither module is readable", () => {
    hasPermission.mockReturnValue(false);
    renderRoute();
    expect(screen.getByText("forbidden")).toBeInTheDocument();
  });
});
