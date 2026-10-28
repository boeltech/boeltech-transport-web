import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderWithTheme } from "@/test/renderWithTheme";
import { PlatformShell } from "../layout/PlatformShell";
import { opsCopy } from "./opsCopy";

vi.mock("./platformConsoleV1", () => ({
  isPlatformConsoleV1Enabled: () => true,
}));

vi.mock("../providers/PlatformAuthProvider", () => ({
  PlatformAuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  usePlatformAuth: () => ({
    user: {
      id: "u1",
      email: "owner@test.com",
      firstName: "Owner",
      lastName: "Test",
      platformRole: "platform_owner" as const,
      scope: "platform" as const,
      mfaEnabled: true,
    },
    token: "at",
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
  }),
}));

vi.mock("../providers/PlatformMfaEnrollmentGate", () => ({
  PlatformMfaEnrollmentGate: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <>{children}</>,
}));

vi.mock("../../infrastructure/platformApi", () => ({
  platformApi: {
    listTenants: vi.fn().mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
    }),
  },
}));

describe("PlatformOpsShell (F3 D4 chrome)", () => {
  it("renders ops shell with Hoy nav and ERP isolation link", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    renderWithTheme(
      <QueryClientProvider client={client}>
        <Routes>
          <Route element={<PlatformShell />}>
            <Route
              path="/platform"
              element={<div data-testid="page">hoy</div>}
            />
          </Route>
          <Route path="/login" element={<div>erp</div>} />
        </Routes>
      </QueryClientProvider>,
      { route: ["/platform"] },
    );

    expect(screen.getByTestId("platform-ops-shell")).toBeInTheDocument();
    expect(screen.getByTestId("ops-portal-root")).toHaveAttribute(
      "id",
      "ops-portal-root",
    );
    expect(screen.getByTestId("platform-ops-shell")).toHaveAttribute(
      "data-ops-shell",
      "true",
    );
    expect(screen.getByTestId("platform-ops-shell")).toHaveAttribute(
      "data-ops-theme",
    );
    // Rail usa `hidden lg:flex`; en jsdom no hay breakpoint lg → display:none.
    const rail = screen.getByTestId("platform-ops-rail");
    expect(rail).toHaveAttribute("aria-label", "Navegación Ops");
    expect(
      screen.getByRole("complementary", {
        name: "Navegación Ops",
        hidden: true,
      }),
    ).toBe(rail);
    expect(
      screen.getByRole("link", { name: opsCopy.nav.hoy, hidden: true }),
    ).toHaveAttribute("href", "/platform");
    expect(
      screen.getByRole("link", { name: opsCopy.nav.erpLink, hidden: true }),
    ).toHaveAttribute("href", "/login");
    expect(
      screen.getByRole("button", { name: opsCopy.cmdk.trigger }),
    ).toBeInTheDocument();

    const brand = screen.getByTestId("ops-brand-mark");
    expect(brand).not.toHaveAttribute("aria-label");
    expect(brand).toHaveTextContent(opsCopy.wordmark);
    expect(brand).toHaveTextContent(opsCopy.monogram);
    expect(screen.queryByText(/^Ops$/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: opsCopy.theme.trigger }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("ops-theme-toggle")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByTestId("ops-nav-menu"));
    const sheet = screen.getByTestId("ops-sheet-content");
    expect(sheet).toHaveAttribute("data-side", "left");
    expect(
      within(sheet).getByRole("link", { name: opsCopy.nav.hoy }),
    ).toHaveAttribute("href", "/platform");
    expect(
      within(sheet).getByRole("link", { name: opsCopy.nav.erpLink }),
    ).toHaveAttribute("href", "/login");
  });
});
