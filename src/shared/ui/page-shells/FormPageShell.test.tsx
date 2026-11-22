import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { FormPageShell } from "./FormPageShell";

function renderShell(
  header: Parameters<typeof FormPageShell>[0]["header"],
  extras: Partial<Parameters<typeof FormPageShell>[0]> = {},
) {
  return render(
    <MemoryRouter>
      <FormPageShell isLoading={false} header={header} {...extras}>
        <div>contenido</div>
      </FormPageShell>
    </MemoryRouter>,
  );
}

describe("FormPageShell header (NL2/NL4)", () => {
  it("staff: pinta migas y no flecha ni ícono de entidad", () => {
    renderShell({
      crumbs: [
        { label: "Vehículos", to: "/vehicles" },
        { label: "Editar" },
      ],
      title: "Editar vehículo",
    });

    const crumbsNav = screen.getByRole("navigation", { name: "Migas" });
    expect(crumbsNav).toBeInTheDocument();
    expect(within(crumbsNav).getByRole("list")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Vehículos" })).toHaveAttribute(
      "href",
      "/vehicles",
    );
    expect(
      screen.queryByRole("button", { name: /volver/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("W")).not.toBeInTheDocument();
  });

  it("portal: pinta flecha y no migas", () => {
    renderShell({
      variant: "portal",
      backHref: "/portal/invoices",
      backLabel: "Volver al listado",
      title: "Nueva factura",
    });

    expect(
      screen.getByRole("button", { name: "Volver al listado" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Migas" }),
    ).not.toBeInTheDocument();
  });

  it("legacy: flecha + ícono (smoke hasta migrar consumers)", () => {
    renderShell({
      backHref: "/vehicles",
      backLabel: "Volver",
      icon: <span data-testid="entity-icon">W</span>,
      title: "Editar vehículo",
    });

    expect(
      screen.getByRole("button", { name: "Volver" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("entity-icon")).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Migas" }),
    ).not.toBeInTheDocument();
  });
});
