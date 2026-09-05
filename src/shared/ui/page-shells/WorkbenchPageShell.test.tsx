import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import {
  WorkbenchPageShell,
  type WorkbenchBucket,
} from "./WorkbenchPageShell";

function renderShell(
  props: Partial<ComponentProps<typeof WorkbenchPageShell>> = {},
) {
  const onPending = vi.fn();
  const onDraft = vi.fn();
  const buckets: WorkbenchBucket[] = props.buckets ?? [
    {
      id: "pending",
      label: "Pendientes",
      count: 12,
      isActive: true,
      onClick: onPending,
      tone: "warning",
    },
    {
      id: "draft",
      label: "Borradores",
      count: 3,
      isActive: false,
      onClick: onDraft,
    },
    {
      id: "registry",
      label: "Registro",
      count: 280,
      isActive: false,
      onClick: vi.fn(),
      crossLink: {
        href: "/finance/settlements/registry",
        label: "Ir al registro histórico",
      },
    },
  ];

  render(
    <MemoryRouter>
      <WorkbenchPageShell
        title="Liquidaciones"
        description="Prioriza pagos a operadores"
        bucketsAriaLabel="Etapas de liquidaciones"
        renderContent={() => <div>Work surface content</div>}
        {...props}
        buckets={buckets}
      />
    </MemoryRouter>,
  );

  return { onPending, onDraft };
}

describe("WorkbenchPageShell", () => {
  it("renderiza anatomía: header, strip, content", () => {
    renderShell();

    expect(
      screen.getByRole("heading", { level: 1, name: "Liquidaciones" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Prioriza pagos a operadores")).toBeInTheDocument();
    expect(
      screen.getByRole("tablist", { name: "Etapas de liquidaciones" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Work surface content")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Pendientes/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("dispara onClick al seleccionar un bucket", async () => {
    const { onDraft } = renderShell();

    await userEvent.click(screen.getByRole("tab", { name: /Borradores/i }));

    expect(onDraft).toHaveBeenCalledTimes(1);
  });

  it("muestra degraded con enlace al registry", () => {
    renderShell({
      isDegraded: true,
      degradedHref: "/finance/settlements/registry",
      degradedLinkLabel: "Ir al registro",
      degradedMessage: "Endpoint workbench falló",
    });

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Endpoint workbench falló")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ir al registro" }),
    ).toHaveAttribute("href", "/finance/settlements/registry");
  });

  it("renderiza related config como enlace", () => {
    renderShell({
      relatedConfig: {
        label: "Administrar plantillas",
        href: "/finance/compensation",
        description: "Hub de configuración",
      },
    });

    expect(
      screen.getByRole("link", { name: /Administrar plantillas/i }),
    ).toHaveAttribute("href", "/finance/compensation");
    expect(screen.getByText("Hub de configuración")).toBeInTheDocument();
  });

  it("renderiza bucket crossLink como enlace (no tab)", () => {
    renderShell();

    expect(
      screen.getByRole("link", { name: "Ir al registro histórico" }),
    ).toHaveAttribute("href", "/finance/settlements/registry");
    expect(
      screen.queryByRole("tab", { name: /Registro/i }),
    ).not.toBeInTheDocument();
  });

  it("oculta el encabezado del shell cuando showHeader es false", () => {
    render(
      <MemoryRouter>
        <WorkbenchPageShell
          title="Oculto"
          showHeader={false}
          buckets={[
            {
              id: "a",
              label: "A",
              count: 1,
              isActive: true,
              onClick: vi.fn(),
            },
          ]}
          renderContent={() => <div>Surface</div>}
        />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("heading", { level: 1, name: "Oculto" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Surface")).toBeInTheDocument();
  });

  it("renderiza título y descripción del scorecard de awareness", () => {
    renderShell({
      bucketsTitle: "Liquidaciones",
      bucketsDescription: "Etapas del pago a operadores",
    });

    expect(
      screen.getByRole("heading", { level: 2, name: "Liquidaciones" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Etapas del pago a operadores"),
    ).toBeInTheDocument();
  });

  it("renderiza afterAwareness entre el strip y el contenido", () => {
    renderShell({
      afterAwareness: <div>Scorecard Anticipos</div>,
    });

    expect(screen.getByText("Scorecard Anticipos")).toBeInTheDocument();
  });

  it("muestra description opcional en la celda del bucket", () => {
    renderShell({
      buckets: [
        {
          id: "pending",
          label: "Pendientes",
          description: "Operadores por liquidar",
          count: 12,
          isActive: true,
          onClick: vi.fn(),
        },
      ],
    });

    expect(screen.getByText("Operadores por liquidar")).toBeInTheDocument();
  });
});
