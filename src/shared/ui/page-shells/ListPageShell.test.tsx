import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ListPageShell } from "./ListPageShell";

const emptyState = {
  icon: <span aria-hidden>∅</span>,
  title: "No se encontraron vehículos",
  description: "Comienza agregando tu primer vehículo",
};

describe("ListPageShell", () => {
  it("table-mode: una card; empty dentro; summary+pagination en pie; toolbar fuera", () => {
    const { container } = render(
      <ListPageShell
        title="Vehículos"
        entityLabelPlural="vehículos"
        isLoading={false}
        items={[]}
        pagination={{ page: 1, totalPages: 3, total: 0, limit: 10 }}
        onPageChange={vi.fn()}
        toolbar={{
          search: { value: "", onChange: vi.fn(), placeholder: "Buscar..." },
        }}
        emptyState={emptyState}
        renderTable={() => <div data-testid="table-slot">tabla</div>}
      />,
    );

    expect(screen.getByPlaceholderText("Buscar...")).toBeInTheDocument();
    // EmptyState title + ListingResultsSummary (total 0) share copy
    expect(
      screen.getAllByText("No se encontraron vehículos").length,
    ).toBeGreaterThanOrEqual(2);
    expect(screen.queryByTestId("table-slot")).not.toBeInTheDocument();

    const card = container.querySelector(".rounded-xl.border.bg-card");
    expect(card).toBeTruthy();
    expect(card!.querySelector(".border-t")).toBeTruthy();
    expect(card!.textContent).toContain("No se encontraron vehículos");
    expect(card!.textContent).toContain("Comienza agregando tu primer vehículo");

    // T8: no Primera/Última; current page secondary when pages > 1
    expect(screen.queryByRole("button", { name: "Primera" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Última" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1" }).className).toMatch(
      /bg-secondary/,
    );

    // Toolbar search is outside the results card
    const search = screen.getByPlaceholderText("Buscar...");
    expect(card!.contains(search)).toBe(false);
  });

  it("table-mode con items: renderTable dentro de la card + pie", () => {
    const { container } = render(
      <ListPageShell
        title="Vehículos"
        entityLabelPlural="vehículos"
        isLoading={false}
        items={[{ id: "1" }]}
        pagination={{ page: 1, totalPages: 2, total: 12, limit: 10 }}
        onPageChange={vi.fn()}
        emptyState={emptyState}
        renderTable={() => <div data-testid="table-slot">tabla</div>}
      />,
    );

    const card = container.querySelector(".rounded-xl.border.bg-card");
    expect(card).toBeTruthy();
    expect(screen.getByTestId("table-slot")).toBeInTheDocument();
    expect(card!.contains(screen.getByTestId("table-slot"))).toBe(true);
    expect(card!.textContent).toMatch(/Mostrando/);
    expect(screen.getByText(/Página 1 de 2/)).toBeInTheDocument();
  });
});
