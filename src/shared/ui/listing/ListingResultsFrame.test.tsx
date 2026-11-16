import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ListingResultsFrame } from "./ListingResultsFrame";

describe("ListingResultsFrame", () => {
  it("envuelve children en card T1", () => {
    const { container } = render(
      <ListingResultsFrame entityLabelPlural="vehículos">
        <div data-testid="body">tabla</div>
      </ListingResultsFrame>,
    );

    const card = container.querySelector(".rounded-xl.border.bg-card.shadow-sm");
    expect(card).toBeTruthy();
    expect(card!.contains(screen.getByTestId("body"))).toBe(true);
    expect(card!.textContent).toContain("tabla");
    expect(screen.queryByText(/Mostrando/)).not.toBeInTheDocument();
  });

  it("sin pagination o total 0 → sin pie (empty sin summary dual)", () => {
    const { rerender, container } = render(
      <ListingResultsFrame entityLabelPlural="vehículos">
        <div>empty</div>
      </ListingResultsFrame>,
    );
    expect(container.querySelector(".border-t")).toBeNull();

    rerender(
      <ListingResultsFrame
        entityLabelPlural="vehículos"
        pagination={{ page: 1, totalPages: 1, total: 0, limit: 25 }}
        onPageChange={vi.fn()}
      >
        <div>No se encontraron vehículos</div>
      </ListingResultsFrame>,
    );
    expect(container.querySelector(".border-t")).toBeNull();
    expect(screen.queryByText(/Mostrando/)).not.toBeInTheDocument();
    // Solo el empty del children — no un segundo «No se encontraron» del pie
    expect(screen.getAllByText("No se encontraron vehículos")).toHaveLength(1);
  });

  it("total > 0 → pie con summary; controles solo si totalPages > 1 y onPageChange", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    const { rerender, container } = render(
      <ListingResultsFrame
        entityLabelPlural="pagos"
        pagination={{ page: 1, totalPages: 1, total: 3, limit: 25 }}
      >
        <div>rows</div>
      </ListingResultsFrame>,
    );

    const footer = container.querySelector(".border-t");
    expect(footer).toBeTruthy();
    expect(screen.getByText(/Mostrando/)).toBeInTheDocument();
    expect(footer!.textContent).toMatch(/de\s*3\s*pagos/);
    expect(screen.queryByRole("button", { name: "Siguiente" })).not.toBeInTheDocument();

    rerender(
      <ListingResultsFrame
        entityLabelPlural="pagos"
        pagination={{ page: 1, totalPages: 2, total: 30, limit: 25 }}
        onPageChange={onPageChange}
      >
        <div>rows</div>
      </ListingResultsFrame>,
    );

    expect(screen.getByText(/Página 1 de 2/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("totalPages > 1 sin onPageChange → summary sin controles", () => {
    render(
      <ListingResultsFrame
        entityLabelPlural="operadores"
        pagination={{ page: 1, totalPages: 3, total: 40, limit: 25 }}
      >
        <div>rows</div>
      </ListingResultsFrame>,
    );

    expect(screen.getByText(/Mostrando/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Siguiente" })).not.toBeInTheDocument();
  });
});
