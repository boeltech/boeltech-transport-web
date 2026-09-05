import { type ComponentProps } from "react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HubPageShell } from "./HubPageShell";

function renderHub(
  props: Partial<ComponentProps<typeof HubPageShell>> = {},
) {
  return render(
    <MemoryRouter initialEntries={["/hub/a"]}>
      <HubPageShell title="Módulo de prueba" {...props}>
        {props.children ?? <div>Contenido del tab</div>}
      </HubPageShell>
    </MemoryRouter>,
  );
}

describe("HubPageShell", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders title, description and children (v1 compat)", () => {
    renderHub({ description: "Bajada del módulo" });

    expect(
      screen.getByRole("heading", { name: "Módulo de prueba" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Bajada del módulo")).toBeInTheDocument();
    expect(screen.getByText("Contenido del tab")).toBeInTheDocument();
  });

  it("renders orientation text and operational link", () => {
    renderHub({
      orientation: {
        text: "Los esquemas se usan al liquidar.",
        link: { label: "Ir a liquidaciones", href: "/finance/settlements/new" },
      },
    });

    expect(
      screen.getByText(/Los esquemas se usan al liquidar/),
    ).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Ir a liquidaciones" });
    expect(link).toHaveAttribute("href", "/finance/settlements/new");
  });

  it("renders nav tabs as links with active tab", () => {
    renderHub({
      activeNavId: "a",
      nav: [
        { id: "a", label: "Esquemas", href: "/hub/a" },
        { id: "b", label: "Rutas", href: "/hub/b" },
      ],
    });

    const nav = screen.getByRole("tablist", { name: "Secciones del módulo" });
    expect(within(nav).getByRole("tab", { name: "Esquemas" })).toHaveAttribute(
      "href",
      "/hub/a",
    );
    expect(within(nav).getByRole("tab", { name: "Rutas" })).toHaveAttribute(
      "href",
      "/hub/b",
    );
  });

  it("renders guide steps and toggles open state", async () => {
    const user = userEvent.setup();
    renderHub({
      guide: {
        title: "Cómo empezar",
        steps: ["Paso uno", "Paso dos"],
        defaultOpen: true,
      },
    });

    expect(screen.getByText("Paso uno")).toBeInTheDocument();
    expect(screen.getByText("Paso dos")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Cómo empezar/i }));
    expect(screen.queryByText("Paso uno")).not.toBeInTheDocument();
  });

  it("persists guide collapsed state when storageKey is set", async () => {
    const user = userEvent.setup();
    const storageKey = "test-hub-guide-collapsed";

    const { unmount } = renderHub({
      guide: {
        title: "Guía",
        steps: ["A"],
        defaultOpen: true,
        storageKey,
      },
    });

    await user.click(screen.getByRole("button", { name: /Guía/i }));
    expect(window.localStorage.getItem(storageKey)).toBe("true");
    unmount();

    renderHub({
      guide: {
        title: "Guía",
        steps: ["A"],
        defaultOpen: true,
        storageKey,
      },
    });

    expect(screen.queryByText("A")).not.toBeInTheDocument();
  });

  it("renders primary and secondary launch actions", () => {
    const onSecondary = vi.fn();
    renderHub({
      primaryActions: [
        { id: "new", label: "Nuevo", href: "/hub/new" },
      ],
      secondaryActions: [
        {
          id: "help",
          label: "Ayuda",
          variant: "outline",
          onClick: onSecondary,
        },
      ],
    });

    expect(screen.getByRole("link", { name: "Nuevo" })).toHaveAttribute(
      "href",
      "/hub/new",
    );
    expect(screen.getByRole("button", { name: "Ayuda" })).toBeInTheDocument();
  });

  it("does not render readiness strip without items (F5 compat)", () => {
    const { unmount } = renderHub();
    expect(
      screen.queryByTestId("hub-readiness-strip"),
    ).not.toBeInTheDocument();
    unmount();

    renderHub({ readiness: [] });
    expect(
      screen.queryByTestId("hub-readiness-strip"),
    ).not.toBeInTheDocument();
  });

  it("renders readiness chips with status tones", () => {
    renderHub({
      readinessAriaLabel: "Estado del módulo",
      readiness: [
        { id: "a", label: "esquemas activos", value: 3, status: "ok" },
        { id: "b", label: "sin reglas", value: 1, status: "warn" },
        { id: "c", label: "asignaciones", value: 0, status: "empty" },
        { id: "d", label: "rutas con tarifa", value: 2, status: "info" },
      ],
    });

    const strip = screen.getByRole("list", { name: "Estado del módulo" });
    expect(within(strip).getAllByRole("listitem")).toHaveLength(4);
    expect(strip.querySelector('[data-status="ok"]')).toBeInTheDocument();
    expect(strip.querySelector('[data-status="warn"]')).toBeInTheDocument();
    expect(strip.querySelector('[data-status="empty"]')).toBeInTheDocument();
    expect(strip.querySelector('[data-status="info"]')).toBeInTheDocument();
    expect(screen.getByText("esquemas activos")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders readiness chip as link when href is set", () => {
    renderHub({
      readiness: [
        {
          id: "templates",
          label: "esquemas activos",
          value: 2,
          status: "ok",
          href: "/hub/templates",
        },
      ],
    });

    const link = screen.getByRole("link", { name: "2 esquemas activos" });
    expect(link).toHaveAttribute("href", "/hub/templates");
  });

  it("renders readiness chip as button when onClick is set", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderHub({
      readiness: [
        {
          id: "assign",
          label: "asignaciones vigentes",
          value: 0,
          status: "empty",
          onClick,
        },
      ],
    });

    await user.click(
      screen.getByRole("button", { name: "0 asignaciones vigentes" }),
    );
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("places guide before nav tabs", () => {
    renderHub({
      guide: {
        title: "Cómo empezar",
        steps: ["Paso uno"],
        defaultOpen: true,
      },
      activeNavId: "a",
      nav: [
        { id: "a", label: "Esquemas", href: "/hub/a" },
        { id: "b", label: "Rutas", href: "/hub/b" },
      ],
    });

    const guide = screen.getByRole("button", { name: /Cómo empezar/i });
    const nav = screen.getByRole("tablist", { name: "Secciones del módulo" });
    expect(
      guide.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("renders relatedConfig link and description at the foot", () => {
    renderHub({
      relatedConfig: {
        label: "Ir a liquidaciones",
        href: "/finance/settlements/new",
        description: "Al liquidar se usa el esquema asignado al operador.",
      },
    });

    const link = screen.getByRole("link", { name: /Ir a liquidaciones/i });
    expect(link).toHaveAttribute("href", "/finance/settlements/new");
    expect(
      screen.getByText("Al liquidar se usa el esquema asignado al operador."),
    ).toBeInTheDocument();
  });

  it("places readiness strip before orientation", () => {
    const { container } = renderHub({
      readiness: [
        { id: "a", label: "esquemas", value: 1, status: "ok" },
      ],
      orientation: { text: "Texto de orientación." },
    });

    const strip = screen.getByTestId("hub-readiness-strip");
    const orientation = screen.getByText("Texto de orientación.");
    const root = container.firstElementChild;
    expect(root).toBeTruthy();
    const children = Array.from(root!.children);
    expect(children.indexOf(strip)).toBeGreaterThanOrEqual(0);
    expect(children.indexOf(orientation)).toBeGreaterThanOrEqual(0);
    expect(children.indexOf(strip)).toBeLessThan(children.indexOf(orientation));
  });
});
