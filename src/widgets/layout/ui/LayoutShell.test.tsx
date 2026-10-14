import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/renderWithProviders";
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
}));

vi.mock("@features/help-center", () => ({
  HelpPanelProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe("LayoutShell", () => {
  it("exposes skip link to #contenido and a single desktop aside landmark", () => {
    renderWithProviders(
      <SidebarProvider>
        <LayoutShell />
      </SidebarProvider>,
      { route: "/dashboard" },
    );

    const skip = screen.getByRole("link", { name: "Saltar al contenido" });
    expect(skip).toHaveAttribute("href", "#contenido");

    const main = document.getElementById("contenido");
    expect(main?.tagName).toBe("MAIN");

    const asides = document.querySelectorAll("aside");
    expect(asides).toHaveLength(1);
  });
});
