import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { LayoutDashboard, CheckSquare } from "lucide-react";
import { renderWithProviders } from "@/test/renderWithProviders";
import { SidebarProvider } from "@/app/providers/SidebarProvider";
import { Sidebar } from "./Sidebar";
import type { NavGroup } from "../model/types";

const navigationFixture: NavGroup[] = [
  {
    id: "main",
    title: "Operación",
    items: [
      {
        id: "dashboard",
        label: "Inicio",
        path: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        id: "finance-approvals",
        label: "Aprobaciones",
        path: "/finance/approvals",
        icon: CheckSquare,
        badge: 3,
      },
    ],
  },
];

const isItemActive = vi.fn((item: { path: string }) => item.path === "/dashboard");

vi.mock("../model/useNavigationWithBadges", () => ({
  useNavigationWithBadges: () => ({
    navigation: navigationFixture,
    isItemActive,
  }),
}));

function renderSidebar(options?: { collapsed?: boolean; route?: string }) {
  return renderWithProviders(
    <SidebarProvider defaultCollapsed={options?.collapsed ?? false}>
      <Sidebar />
    </SidebarProvider>,
    { route: options?.route ?? "/dashboard" },
  );
}

describe("Sidebar", () => {
  beforeEach(() => {
    isItemActive.mockImplementation(
      (item: { path: string }) => item.path === "/dashboard",
    );
    localStorage.clear();
  });

  it("marks the active link with aria-current, neutral type, and amber rail", () => {
    renderSidebar();

    const active = screen.getByRole("link", { name: /Inicio/i });
    expect(active).toHaveAttribute("aria-current", "page");
    expect(active.className).toContain("text-sidebar-foreground");
    expect(active.className).not.toContain("text-sidebar-primary");
    expect(active.className).toContain("bg-sidebar-accent");
    expect(active.className).not.toContain("bg-primary/10");
    expect(active.querySelector(".bg-sidebar-primary")).toBeTruthy();
  });

  it("keeps brand teal mark + onInk wordmark on ink (auth/login parity)", () => {
    const { container } = renderSidebar();

    const brandLink = screen.getByRole("link", {
      name: /Ir al dashboard de/i,
    });
    expect(brandLink.querySelector(".text-primary")).toBeTruthy();
    expect(brandLink.querySelector(".text-palette-brand-on-ink")).toBeTruthy();
    expect(
      brandLink.querySelector(".text-palette-brand-on-ink"),
    ).toHaveTextContent("tlamx");
    expect(brandLink.querySelector(".text-primary-foreground")).toBeNull();
    // Sidebar stays flat ink — no landing CTA amber on the brand row.
    expect(container.querySelector(".landing-cta-amber")).toBeNull();
  });

  it("keeps teal brand mark when collapsed (not current/ink-only)", () => {
    renderSidebar({ collapsed: true, route: "/trips" });

    const brandLink = screen.getByRole("link", {
      name: /Ir al dashboard de/i,
    });
    expect(brandLink.querySelector(".text-primary")).toBeTruthy();
    expect(brandLink.querySelector(".text-primary-foreground")).toBeNull();
    expect(brandLink.querySelector(".text-palette-brand-on-ink")).toBeNull();
  });

  it("renders group labels in sentence-case (no uppercase tracking)", () => {
    renderSidebar();

    const label = screen.getByText("Operación");
    expect(label.className).not.toMatch(/uppercase/);
    expect(label.className).toContain("text-sidebar-foreground/60");
  });

  it("shows a collapsed badge over the icon (not only in tooltip)", () => {
    isItemActive.mockReturnValue(false);
    renderSidebar({ collapsed: true, route: "/trips" });

    const approvals = screen.getByRole("link", { name: /Aprobaciones/i });
    expect(approvals).toBeInTheDocument();
    // Contador 3 → pill numérico visible en el ícono
    expect(approvals.textContent).toMatch(/3/);
    expect(approvals.querySelector(".bg-destructive")).toBeTruthy();
  });
});
