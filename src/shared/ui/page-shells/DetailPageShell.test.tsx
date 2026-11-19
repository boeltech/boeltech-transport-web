import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DetailPageShell } from "./DetailPageShell";

function renderShell(
  header: Parameters<typeof DetailPageShell>[0]["header"],
  extras: Partial<Parameters<typeof DetailPageShell>[0]> = {},
) {
  return render(
    <MemoryRouter>
      <DetailPageShell isLoading={false} header={header} {...extras}>
        <div>contenido</div>
      </DetailPageShell>
    </MemoryRouter>,
  );
}

describe("DetailPageShell F3 header", () => {
  it("staff: pinta migas y no flecha ni ícono de entidad", () => {
    renderShell({
      crumbs: [
        { label: "Vehículos", to: "/vehicles" },
        { label: "U-01", mono: true },
      ],
      title: "U-01",
    });

    expect(
      screen.getByRole("navigation", { name: "Migas" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Vehículos" })).toHaveAttribute(
      "href",
      "/vehicles",
    );
    expect(
      screen.queryByRole("button", { name: /volver/i }),
    ).not.toBeInTheDocument();
  });

  it("portal: pinta flecha y no migas", () => {
    renderShell({
      variant: "portal",
      backHref: "/portal/trips",
      backLabel: "Volver al listado",
      title: "Viaje",
    });

    expect(
      screen.getByRole("button", { name: "Volver al listado" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Migas" }),
    ).not.toBeInTheDocument();
  });

  it("avatar solo con src real (48 px)", () => {
    renderShell({
      crumbs: [{ label: "Clientes", to: "/clients" }, { label: "ACME" }],
      title: "ACME",
      avatar: { src: "https://example.com/logo.png", alt: "Logo ACME" },
    });

    const img = screen.getByRole("img", { name: "Logo ACME" });
    expect(img).toHaveAttribute("src", "https://example.com/logo.png");
    expect(img).toHaveAttribute("width", "48");
    expect(img).toHaveAttribute("height", "48");
  });

  it("tabs: label string + count/signal", () => {
    renderShell(
      {
        crumbs: [{ label: "Módulo", to: "/x" }, { label: "Actual" }],
        title: "Detalle",
      },
      {
        tabs: {
          defaultValue: "a",
          items: [
            {
              value: "a",
              label: "Datos",
              content: <div>panel a</div>,
            },
            {
              value: "b",
              label: "Documentos",
              count: 2,
              signal: "attention",
              content: <div>panel b</div>,
            },
          ],
        },
        children: undefined,
      },
    );

    expect(screen.getByRole("tab", { name: /Datos/ })).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /atención/i })).toBeInTheDocument();
  });
});
