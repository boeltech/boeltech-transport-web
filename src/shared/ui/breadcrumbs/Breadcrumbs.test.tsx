import { describe, expect, it, vi, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";

import { TooltipProvider } from "@shared/ui/tooltip";
import { Breadcrumbs } from "./Breadcrumbs";

function renderCrumbs(
  crumbs: Parameters<typeof Breadcrumbs>[0]["crumbs"],
  props?: Partial<Parameters<typeof Breadcrumbs>[0]>,
) {
  return render(
    <MemoryRouter>
      <TooltipProvider>
        <Breadcrumbs crumbs={crumbs} {...props} />
      </TooltipProvider>
    </MemoryRouter>,
  );
}

describe("Breadcrumbs", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza nav/ol; último sin link y con aria-current", () => {
    renderCrumbs([
      { label: "Viajes", to: "/trips" },
      { label: "TRP-1", mono: true },
    ]);

    const nav = screen.getByRole("navigation", { name: "Migas" });
    expect(nav.querySelector("ol")).not.toBeNull();

    const link = screen.getByRole("link", { name: "Viajes" });
    expect(link).toHaveAttribute("href", "/trips");

    const current = screen.getByText("TRP-1");
    expect(current.closest("a")).toBeNull();
    expect(current.closest("[aria-current='page']")).not.toBeNull();
  });

  it("marca chevron como aria-hidden", () => {
    const { container } = renderCrumbs([
      { label: "Clientes", to: "/clients" },
      { label: "Acme" },
    ]);
    const separators = container.querySelectorAll("svg");
    expect(separators.length).toBeGreaterThan(0);
    separators.forEach((svg) => {
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });
  });

  it("recorta a 3 eslabones y avisa en DEV", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    renderCrumbs([
      { label: "A", to: "/a" },
      { label: "B", to: "/b" },
      { label: "C", to: "/c" },
      { label: "D" },
    ]);

    expect(screen.getByRole("link", { name: "A" })).toBeInTheDocument();
    expect(screen.queryByText("B")).toBeNull();
    expect(screen.getByRole("link", { name: "C" })).toBeInTheDocument();
    expect(screen.getByText("D").closest("[aria-current='page']")).not.toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it("trunca nombres largos no-mono", () => {
    const long =
      "Escuela Kemper Urgate de Educación Superior con nombre muy largo";
    renderCrumbs([{ label: "Clientes", to: "/clients" }, { label: long }]);
    const el = screen.getByText(long);
    expect(el.className).toMatch(/truncate/);
    expect(el.className).toMatch(/max-w-\[40ch\]/);
  });

  it("mono no trunca", () => {
    renderCrumbs([
      { label: "Viajes", to: "/trips" },
      { label: "TRP-261118-0001-EXTRA-LARGO", mono: true },
    ]);
    const el = screen.getByText("TRP-261118-0001-EXTRA-LARGO");
    expect(el.className).toMatch(/font-mono/);
    expect(el.className).not.toMatch(/truncate/);
  });
});
