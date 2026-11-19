import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SettingsLayout } from "./SettingsLayout";

describe("SettingsLayout", () => {
  it("con sectionTitle: Breadcrumbs Configuración › sección (sin engrane)", () => {
    render(
      <MemoryRouter>
        <SettingsLayout sectionTitle="Catálogos" hideNav>
          contenido
        </SettingsLayout>
      </MemoryRouter>,
    );

    const crumb = screen.getByRole("link", { name: /configuración/i });
    expect(crumb).toHaveAttribute("href", "/settings");
    expect(screen.getByRole("navigation", { name: "Migas" })).toHaveTextContent(
      "Catálogos",
    );
    expect(document.querySelector("svg.lucide-settings")).toBeNull();
  });

  it("raíz sin sectionTitle: sin migas", () => {
    render(
      <MemoryRouter>
        <SettingsLayout hideNav title="Configuración">
          contenido
        </SettingsLayout>
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("navigation", { name: "Migas" }),
    ).not.toBeInTheDocument();
  });

  it("usa region (no main anidado) y tipografía DS en el h1", () => {
    render(
      <MemoryRouter>
        <SettingsLayout sectionTitle="Catálogos" hideNav title="Catálogos">
          contenido
        </SettingsLayout>
      </MemoryRouter>,
    );

    expect(document.querySelector("main")).toBeNull();
    expect(
      screen.getByRole("region", { name: "Catálogos" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveClass(
      "font-bold",
    );
  });
});
