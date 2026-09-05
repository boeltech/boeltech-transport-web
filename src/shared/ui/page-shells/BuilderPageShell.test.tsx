import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import {
  BuilderPageShell,
  type BuilderFooterAction,
  type BuilderSection,
} from "./BuilderPageShell";

const SECTIONS: BuilderSection[] = [
  { id: "identity", label: "Identidad", status: "complete" },
  { id: "payment", label: "Pago", status: "partial" },
  { id: "review", label: "Revisar", status: "empty" },
];

function renderShell(
  props: Partial<ComponentProps<typeof BuilderPageShell>> = {},
) {
  const onSectionChange = props.onSectionChange ?? vi.fn();
  const onDiscard = vi.fn();
  const onSave = vi.fn();

  const footerActions: BuilderFooterAction[] = props.footerActions ?? [
    {
      id: "discard",
      label: "Descartar",
      variant: "outline",
      onClick: onDiscard,
    },
    {
      id: "save",
      label: "Guardar",
      onClick: onSave,
    },
  ];

  render(
    <MemoryRouter>
      <BuilderPageShell
        title="Esquema demo"
        backHref="/hub"
        backLabel="Volver al hub"
        sections={SECTIONS}
        activeSectionId="identity"
        onSectionChange={onSectionChange}
        renderCanvas={(sectionId) => (
          <div>Canvas: {sectionId}</div>
        )}
        renderInspector={() => <div>Inspector content</div>}
        footerActions={footerActions}
        sectionsAriaLabel="Secciones del esquema"
        {...props}
      />
    </MemoryRouter>,
  );

  return { onSectionChange, onDiscard, onSave };
}

describe("BuilderPageShell", () => {
  it("renderiza anatomía: header, canvas, inspector y footer", () => {
    renderShell();

    expect(
      screen.getByRole("heading", { level: 1, name: "Esquema demo" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Volver al hub/i }),
    ).toHaveAttribute("href", "/hub");
    expect(screen.getByText("Canvas: identity")).toBeInTheDocument();
    expect(screen.getByText("Inspector content")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Descartar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeInTheDocument();
    expect(
      screen.getByRole("tabpanel", { name: "Identidad" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Identidad" }),
    ).toBeInTheDocument();
  });

  it("expone landmarks de navegación de secciones", () => {
    renderShell();

    const navs = screen.getAllByRole("tablist", {
      name: "Secciones del esquema",
    });
    expect(navs.length).toBeGreaterThanOrEqual(1);

    expect(
      screen.getByTestId("builder-section-nav-desktop"),
    ).toHaveClass("hidden", "lg:flex", "rounded-lg", "border");
    expect(
      screen.getByTestId("builder-section-nav-mobile"),
    ).toHaveClass("lg:hidden");
    expect(
      screen.getByTestId("builder-inspector-desktop"),
    ).toHaveClass("hidden", "lg:block");
  });

  it("dispara onSectionChange al seleccionar una sección", async () => {
    const { onSectionChange } = renderShell();

    const desktopNav = screen.getByTestId("builder-section-nav-desktop");
    await userEvent.click(
      within(desktopNav).getByRole("tab", { name: /Pago/i }),
    );

    expect(onSectionChange).toHaveBeenCalledWith("payment");
  });

  it("ejecuta callbacks de footer actions", async () => {
    const { onDiscard, onSave } = renderShell();

    await userEvent.click(screen.getByRole("button", { name: "Descartar" }));
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("marca la sección activa con aria-selected", () => {
    renderShell({ activeSectionId: "payment" });

    const desktopNav = screen.getByTestId("builder-section-nav-desktop");
    expect(
      within(desktopNav).getByRole("tab", { name: /Pago/i }),
    ).toHaveAttribute("aria-selected", "true");
    expect(
      within(desktopNav).getByRole("tab", { name: /Identidad/i }),
    ).toHaveAttribute("aria-selected", "false");
  });

  it("permite colapsar el inspector en desktop", async () => {
    renderShell();

    expect(screen.getByTestId("builder-inspector-desktop")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Ocultar resumen" }),
    );

    expect(
      screen.queryByTestId("builder-inspector-desktop"),
    ).not.toBeInTheDocument();
  });

  it("navega secciones con teclado en el tablist", async () => {
    const { onSectionChange } = renderShell();

    const desktopNav = screen.getByTestId("builder-section-nav-desktop");
    const identityTab = within(desktopNav).getByRole("tab", {
      name: /Identidad/i,
    });
    identityTab.focus();
    await userEvent.keyboard("{ArrowDown}");

    expect(onSectionChange).toHaveBeenCalledWith("payment");
  });

  it("renderiza banner bajo el header", () => {
    renderShell({
      banner: <div>Error de guardado</div>,
    });

    expect(screen.getByText("Error de guardado")).toBeInTheDocument();
  });

  it("renderiza description bajo el título", () => {
    renderShell({
      description: "Subtítulo del esquema",
    });

    expect(screen.getByText("Subtítulo del esquema")).toBeInTheDocument();
  });

  it("abre el inspector móvil desde el botón Resumen", async () => {
    renderShell();

    const openButtons = screen.getAllByRole("button", { name: "Resumen" });
    await userEvent.click(openButtons[0]!);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByRole("heading", { name: "Resumen" }),
    ).toBeInTheDocument();
  });

  it("funciona sin inspector", () => {
    render(
      <MemoryRouter>
        <BuilderPageShell
          title="Sin inspector"
          backHref="/hub"
          sections={SECTIONS}
          activeSectionId="identity"
          onSectionChange={vi.fn()}
          renderCanvas={() => <div>Only canvas</div>}
          footerActions={[]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Only canvas")).toBeInTheDocument();
    expect(
      screen.queryByTestId("builder-inspector-desktop"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Resumen" }),
    ).not.toBeInTheDocument();
  });
});
