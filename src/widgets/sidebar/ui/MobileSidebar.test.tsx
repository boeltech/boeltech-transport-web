import { useEffect, type ReactNode } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { LayoutDashboard } from "lucide-react";
import { renderWithProviders } from "@/test/renderWithProviders";
import { SidebarProvider, useSidebar } from "@/app/providers/SidebarProvider";
import { MobileSidebar } from "./MobileSidebar";
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
    ],
  },
];

vi.mock("../model/useNavigationWithBadges", () => ({
  useNavigationWithBadges: () => ({
    navigation: navigationFixture,
    isItemActive: (item: { path: string }) => item.path === "/dashboard",
  }),
}));

function OpenMobileOnMount({ children }: { children: ReactNode }) {
  const { openMobile } = useSidebar();
  useEffect(() => {
    openMobile();
  }, [openMobile]);
  return <>{children}</>;
}

function renderMobileSidebar() {
  return renderWithProviders(
    <SidebarProvider>
      <OpenMobileOnMount>
        <MobileSidebar />
      </OpenMobileOnMount>
    </SidebarProvider>,
    { route: "/dashboard" },
  );
}

describe("MobileSidebar", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("keeps brand teal mark + onInk wordmark on ink (auth/login parity)", () => {
    renderMobileSidebar();

    const brandLink = screen.getByRole("link", {
      name: /Ir al dashboard de/i,
    });
    expect(brandLink.querySelector(".text-primary")).toBeTruthy();
    expect(brandLink.querySelector(".text-palette-brand-on-ink")).toBeTruthy();
    expect(
      brandLink.querySelector(".text-palette-brand-on-ink"),
    ).toHaveTextContent("tlamx");
    expect(brandLink.querySelector(".text-primary-foreground")).toBeNull();
  });

  it("marks the active link with neutral type and amber rail (desktop parity)", () => {
    renderMobileSidebar();

    const active = screen.getByRole("link", { name: /Inicio/i });
    expect(active).toHaveAttribute("aria-current", "page");
    expect(active.className).toContain("text-sidebar-foreground");
    expect(active.className).not.toContain("text-sidebar-primary");
    expect(active.className).toContain("bg-sidebar-accent");
    expect(active.querySelector(".bg-sidebar-primary")).toBeTruthy();
  });
});
