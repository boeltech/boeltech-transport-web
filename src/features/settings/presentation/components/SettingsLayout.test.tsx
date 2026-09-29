import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SettingsLayout } from "./SettingsLayout";

describe("SettingsLayout", () => {
  it("no usa Configuración como enlace a /settings (redirige a General)", () => {
    render(
      <MemoryRouter>
        <SettingsLayout sectionTitle="Catálogos" hideNav>
          contenido
        </SettingsLayout>
      </MemoryRouter>,
    );

    expect(screen.queryByRole("link", { name: /configuración/i })).toBeNull();
    expect(
      screen.getByRole("navigation", { name: "Configuración" }),
    ).toHaveTextContent("Catálogos");
  });
});
