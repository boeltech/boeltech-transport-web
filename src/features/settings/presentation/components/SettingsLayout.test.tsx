import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SettingsLayout } from "./SettingsLayout";

describe("SettingsLayout", () => {
  it("enlaza Configuración al hub /settings", () => {
    render(
      <MemoryRouter>
        <SettingsLayout sectionTitle="Catálogos" hideNav>
          contenido
        </SettingsLayout>
      </MemoryRouter>,
    );

    const crumb = screen.getByRole("link", { name: /configuración/i });
    expect(crumb).toHaveAttribute("href", "/settings");
    expect(
      screen.getByRole("navigation", { name: "Configuración" }),
    ).toHaveTextContent("Catálogos");
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
