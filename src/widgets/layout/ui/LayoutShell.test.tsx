import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  createMemoryRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/test/createTestQueryClient";
import { SidebarProvider } from "@/app/providers/SidebarProvider";
import { LayoutShell } from "./LayoutShell";

vi.mock("@widgets/sidebar", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@widgets/sidebar")>();
  return {
    ...actual,
    Sidebar: () => <div data-testid="sidebar-desktop">Sidebar</div>,
    MobileSidebar: () => null,
  };
});

vi.mock("@widgets/header", () => ({
  Header: () => <header>Header</header>,
}));

vi.mock("@features/auth", () => ({
  EmailVerificationBanner: () => null,
  // DemoDataBanner (F2) mounts in LayoutShell and calls useAuth.
  useAuth: () => ({ isAuthenticated: false, user: null }),
}));

vi.mock("@features/help-center", () => ({
  HelpPanelProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

function renderLayoutShell(initialEntry: string) {
  const router = createMemoryRouter(
    [
      {
        element: (
          <SidebarProvider>
            <LayoutShell />
          </SidebarProvider>
        ),
        children: [
          {
            path: "/dashboard",
            element: <div data-testid="dashboard-outlet">Dashboard</div>,
          },
          {
            path: "/monitoring/fleet",
            handle: { flush: true },
            element: <div data-testid="fleet-outlet">Mapa</div>,
          },
        ],
      },
    ],
    { initialEntries: [initialEntry] },
  );

  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("LayoutShell", () => {
  it("exposes skip link to #contenido and a single desktop aside landmark", () => {
    renderLayoutShell("/dashboard");

    const skip = screen.getByRole("link", { name: "Saltar al contenido" });
    expect(skip).toHaveAttribute("href", "#contenido");

    const main = document.getElementById("contenido");
    expect(main?.tagName).toBe("MAIN");

    const asides = document.querySelectorAll("aside");
    expect(asides).toHaveLength(1);

    const content = screen.getByTestId("layout-content");
    expect(content.className).toMatch(/px-/);
    expect(content.querySelector(".max-w-7xl")).toBeTruthy();
  });

  it("applies flush content when route handle.flush is true", () => {
    renderLayoutShell("/monitoring/fleet");

    expect(screen.getByTestId("layout-content-flush")).toBeInTheDocument();
    expect(screen.queryByTestId("layout-content")).not.toBeInTheDocument();
    expect(document.querySelector(".max-w-7xl")).toBeNull();
    expect(screen.getByTestId("fleet-outlet")).toBeInTheDocument();
  });
});
