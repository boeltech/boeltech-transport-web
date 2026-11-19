import { describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";

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
    expect(list.className).toMatch(/\bbg-muted\b/);
    expect(list.className).not.toMatch(/bg-primary/);
    expect(list.className).not.toMatch(/overflow-x-auto/);
    // TEC-2: default trackFit="hug" — sin min-w-full
    expect(list.className).not.toMatch(/min-w-full/);

    const inactive = screen.getByRole("link", { name: /Seguridad/i });
    expect(inactive).not.toHaveAttribute("aria-current");
    expect(inactive.className).toMatch(/hover:bg-background\/40/);
  });

  it('trackFit="stretch" reaplica min-w-full en el nav', () => {
    render(
      <MemoryRouter initialEntries={["/account"]}>
        <Routes>
          <Route
            path="*"
            element={
              <RouteTabsNav
                aria-label="Mi cuenta"
                trackFit="stretch"
                items={[
                  { id: "data", to: "/account", end: true, label: "Datos" },
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

    const list = screen.getByRole("navigation", { name: /Mi cuenta/i });
    expect(list.className).toMatch(/min-w-full/);
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

  it("count 0 no pinta pastilla; signal expone aria-label", () => {
    render(
      <MemoryRouter initialEntries={["/trips/t1"]}>
        <Routes>
          <Route
            path="*"
            element={
              <RouteTabsNav
                aria-label="Secciones"
                items={[
                  {
                    id: "summary",
                    to: "/trips/t1",
                    end: true,
                    label: "Resumen",
                    count: 0,
                  },
                  {
                    id: "cargo",
                    to: "/trips/t1/cargo",
                    label: "Cargas",
                    count: 4,
                    signal: "attention",
                    signalLabel: "Cargas con incidencia",
                  },
                ]}
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    const summary = screen.getByRole("link", { name: /^Resumen$/i });
    expect(summary.textContent).toBe("Resumen");
    expect(summary.querySelector(".font-mono")).toBeNull();

    expect(screen.getByText("4")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Cargas con incidencia" }),
    ).toBeInTheDocument();
  });

  it("no acepta ni renderiza icon (contrato NL5)", () => {
    render(
      <MemoryRouter initialEntries={["/account"]}>
        <Routes>
          <Route
            path="*"
            element={
              <RouteTabsNav
                aria-label="Mi cuenta"
                items={[
                  { id: "data", to: "/account", end: true, label: "Datos" },
                ]}
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: /Datos/i });
    expect(link.querySelector("svg")).toBeNull();
  });
});
