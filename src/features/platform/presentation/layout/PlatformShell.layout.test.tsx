import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import {
  SIDEBAR_COLLAPSED_WIDTH_PX,
  SIDEBAR_WIDTH_PX,
} from "@widgets/sidebar";
import { renderWithTheme } from "@/test/renderWithTheme";
import { PlatformShell } from "./PlatformShell";
import { platformNavItemClassName } from "./platformNavItemStyles";
import { platformCopy } from "../copy/platformCopy";

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
  PlatformMfaEnrollmentGate: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

function renderPlatformAt(path: string) {
  return renderWithTheme(
    <Routes>
      <Route element={<PlatformShell />}>
        <Route
          path="/platform"
          element={<div data-testid="page">dashboard</div>}
        />
        <Route
          path="/platform/tenants"
          element={<div data-testid="page">tenants</div>}
        />
      </Route>
      <Route path="/login" element={<div data-testid="erp-login">erp</div>} />
    </Routes>,
    { route: [path] },
  );
}

describe("PlatformShell layout (F1 chrome + isolation)", () => {
  it("keeps DS sidebar widths (240 / 56) and solid h-14 header", () => {
    renderPlatformAt("/platform/tenants");

    expect(SIDEBAR_WIDTH_PX).toBe(240);
    expect(SIDEBAR_COLLAPSED_WIDTH_PX).toBe(56);

    const nav = screen.getByRole("navigation", {
      name: "Navegación de plataforma",
    });
    const aside = nav.closest("aside");
    expect(aside).toBeTruthy();
    expect(aside).toHaveStyle({ width: `${SIDEBAR_WIDTH_PX}px` });

    const header = screen.getByRole("banner");
    expect(header.className).toMatch(/\bh-14\b/);
    expect(header.className).toMatch(/\bbg-background\b/);
    expect(header.className).not.toMatch(/backdrop-blur/);
    expect(header.className).toMatch(/lg:left-\[240px\]/);
  });

  it("marks active nav with sidebar tokens (not primary/10)", () => {
    renderPlatformAt("/platform/tenants");

    const tenantsLinks = screen.getAllByRole("link", {
      name: platformCopy.nav.tenants,
    });
    const activeLinks = tenantsLinks.filter(
      (link) => link.getAttribute("aria-current") === "page",
    );
    expect(activeLinks.length).toBeGreaterThanOrEqual(1);
    for (const tenantsLink of activeLinks) {
      expect(tenantsLink.className).toMatch(/bg-sidebar-accent/);
      expect(tenantsLink.className).toMatch(/text-sidebar-foreground/);
      expect(tenantsLink.className).not.toMatch(/text-sidebar-primary/);
      expect(tenantsLink.className).not.toMatch(/bg-primary\/10/);
    }

    const activeClasses = platformNavItemClassName({ isActive: true });
    expect(activeClasses).toContain("bg-sidebar-accent");
    expect(activeClasses).toContain("text-sidebar-foreground");
    expect(activeClasses).not.toContain("text-sidebar-primary");
    expect(activeClasses).not.toContain("bg-primary/10");
  });

  it("routes ERP exit links to /login (D1 isolation)", () => {
    renderPlatformAt("/platform");

    const erpLinks = screen.getAllByRole("link", {
      name: platformCopy.nav.erpLink,
    });
    // Mobile drawer keeps an ERP link in the tree; desktop uses a footer button.
    expect(erpLinks.length).toBeGreaterThanOrEqual(1);
    for (const link of erpLinks) {
      expect(link).toHaveAttribute("href", "/login");
    }

    const desktopNav = screen.getByRole("navigation", {
      name: "Navegación de plataforma",
    });
    const sidebar = desktopNav.closest("aside");
    expect(sidebar).toBeTruthy();
    const erpButton = within(sidebar as HTMLElement).getByRole("button", {
      name: platformCopy.nav.erpLink,
    });
    expect(erpButton).toBeInTheDocument();
  });

  it("renders outlet content without AppLayout chrome markers", () => {
    renderPlatformAt("/platform");

    expect(screen.getByTestId("page")).toHaveTextContent("dashboard");
    expect(screen.getByRole("main")).toHaveAttribute(
      "id",
      "contenido-platform",
    );
    // ERP LayoutShell skip-target / email banner must not appear.
    expect(document.getElementById("contenido")).toBeNull();
    expect(
      screen.queryByText(/verificar|verification/i),
    ).not.toBeInTheDocument();
  });
});
