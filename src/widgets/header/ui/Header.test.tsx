import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/renderWithProviders";
import { SidebarProvider } from "@/app/providers/SidebarProvider";
import { Header } from "./Header";
import { headerCopy } from "../copy/headerCopy";

vi.mock("@/shared/hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      firstName: "Ana",
      lastName: "Ruiz",
      email: "ana@example.com",
      role: "admin",
      tenant: { name: "Demo" },
    },
    logout: vi.fn(),
  }),
}));

vi.mock("@shared/permissions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@shared/permissions")>()),
  usePermissions: () => ({
    hasPermission: () => true,
    isLoading: false,
    isAuthenticated: true,
    role: "admin",
  }),
}));

vi.mock("@features/notifications", () => ({
  NotificationInboxButton: () => (
    <button type="button">Notificaciones</button>
  ),
}));

vi.mock("@features/help-center", () => ({
  HelpPanelButton: () => <button type="button">Ayuda</button>,
}));

vi.mock("@/shared/ui/theme", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/ui/theme")>();
  return {
    ...actual,
    ThemeCycleButton: () => <button type="button">Tema</button>,
  };
});

const commandMenuSpy = vi.fn();

vi.mock("./GlobalCommandMenu", () => ({
  GlobalCommandMenu: ({
    open,
    onOpenChange,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => {
    commandMenuSpy(open);
    return open ? (
      <div role="dialog" aria-label={headerCopy.commandMenu.title}>
        <button type="button" onClick={() => onOpenChange(false)}>
          Cerrar búsqueda
        </button>
      </div>
    ) : null;
  },
}));

function renderHeader() {
  return renderWithProviders(
    <SidebarProvider>
      <Header />
    </SidebarProvider>,
    { route: "/dashboard" },
  );
}

describe("Header", () => {
  beforeEach(() => {
    commandMenuSpy.mockClear();
    localStorage.clear();
  });

  it("exposes a mobile search button that opens GlobalCommandMenu", async () => {
    const user = userEvent.setup();
    renderHeader();

    const searchTriggers = screen.getAllByRole("button", {
      name: headerCopy.commandMenu.title,
    });
    const lupa = searchTriggers.find((el) => el.className.includes("md:hidden"));
    expect(lupa).toBeTruthy();

    await user.click(lupa!);

    expect(
      screen.getByRole("dialog", { name: headerCopy.commandMenu.title }),
    ).toBeInTheDocument();
  });

  it("uses a solid header without glass/blur utilities", () => {
    const { container } = renderHeader();
    const header = container.querySelector("header");
    expect(header).toBeTruthy();
    expect(header?.className).toContain("bg-background");
    expect(header?.className).not.toMatch(/backdrop-blur/);
    expect(header?.className).toContain("h-14");
  });

  it("renders ⌘K trigger with cool Operate surface (muted + hairline)", () => {
    const { container } = renderHeader();
    expect(container.querySelector("[data-header-search]")).toBeTruthy();
    const triggers = screen.getAllByRole("button", {
      name: headerCopy.commandMenu.title,
    });
    const desktop = triggers.find(
      (el) => el.className.includes("w-56") || el.className.includes("lg:w-64"),
    );
    expect(desktop).toBeTruthy();
    expect(desktop?.className).toContain("h-8");
    expect(desktop?.className).toContain("bg-muted");
    expect(desktop?.className).toContain("border-border");
    expect(desktop?.className).not.toMatch(/hover:bg-accent/);
  });

  it("keeps a dense right action cluster with divider before user menu", () => {
    const { container } = renderHeader();
    const actions = container.querySelector("[data-header-actions]");
    expect(actions).toBeTruthy();
    expect(actions?.className).toContain("gap-0.5");
    expect(
      container.querySelector("[data-header-actions-divider]"),
    ).toBeTruthy();
    expect(container.querySelector("[data-header-user-menu]")).toBeTruthy();

    expect(screen.getByRole("button", { name: "Ayuda" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Notificaciones" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tema" })).toBeInTheDocument();
  });
});
