import { describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { User } from "lucide-react";

import { RouteTabsNav } from "./RouteTabsNav";

describe("RouteTabsNav", () => {
  it("marca activo con estilo soft (no primary filled) y aria-current", () => {
    render(
      <MemoryRouter initialEntries={["/account"]}>
        <Routes>
          <Route
            path="*"
            element={
              <RouteTabsNav
                aria-label="Mi cuenta"
                items={[
                  {
                    id: "data",
                    to: "/account",
                    end: true,
                    label: "Datos",
                    icon: User,
                  },
                  {
                    id: "security",
                    to: "/account/security",
                    label: "Seguridad",
                  },
                ]}
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    const active = screen.getByRole("link", { name: /Datos/i });
    expect(active).toHaveAttribute("aria-current", "page");
    expect(active.className).toMatch(/bg-background/);
    expect(active.className).toMatch(/shadow-sm/);
    expect(active.className).toMatch(/ring-1/);
    expect(active.className).not.toMatch(/bg-primary/);

    const list = screen.getByRole("navigation", { name: /Mi cuenta/i });
    expect(list.className).toMatch(/border-border/);
    expect(list.className).not.toMatch(/bg-primary/);

    const inactive = screen.getByRole("link", { name: /Seguridad/i });
    expect(inactive).not.toHaveAttribute("aria-current");
    expect(inactive.className).toMatch(/hover:bg-background\/60/);
  });

  it("respeta end: no activa el tab padre en subruta", () => {
    render(
      <MemoryRouter initialEntries={["/account/security"]}>
        <Routes>
          <Route
            path="*"
            element={
              <RouteTabsNav
                aria-label="Mi cuenta"
                items={[
                  {
                    id: "data",
                    to: "/account",
                    end: true,
                    label: "Datos",
                  },
                  {
                    id: "security",
                    to: "/account/security",
                    label: "Seguridad",
                  },
                ]}
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", { name: /Datos/i }),
    ).not.toHaveAttribute("aria-current");
    expect(
      screen.getByRole("link", { name: /Seguridad/i }),
    ).toHaveAttribute("aria-current", "page");
  });
});
