import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ExpenseDimensionTableSection } from "./ExpenseDimensionTableSection";

const uuid = "11111111-1111-4111-8111-111111111111";

function renderSection(
  dimension: "vehicle" | "driver" | "client" | "route",
  rows: Array<{
    key: string;
    label: string;
    tripCount?: number;
    totalExpenses?: number;
    avgExpensePerTrip?: number;
  }>,
) {
  return render(
    <MemoryRouter>
      <ExpenseDimensionTableSection
        dimension={dimension}
        onDimensionChange={vi.fn()}
        rows={rows.map((row) => ({
          tripCount: 3,
          totalExpenses: 12000,
          avgExpensePerTrip: 4000,
          ...row,
        }))}
      />
    </MemoryRouter>,
  );
}

describe("ExpenseDimensionTableSection", () => {
  it("links readable vehicle labels to unit detail when key is UUID", () => {
    renderSection("vehicle", [
      { key: uuid, label: "U-014 · ABC-123-A" },
    ]);

    expect(
      screen.getByRole("heading", {
        name: "¿Dónde se concentra el gasto de viaje?",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ver detalle de la unidad U-014 · ABC-123-A" }),
    ).toHaveAttribute("href", `/vehicles/${uuid}`);
  });

  it("links operator rows to driver detail when key is UUID", () => {
    renderSection("driver", [{ key: uuid, label: "Juan Pérez" }]);

    expect(
      screen.getByRole("link", { name: "Ver detalle del operador Juan Pérez" }),
    ).toHaveAttribute("href", `/drivers/${uuid}`);
  });

  it("links client rows to client detail when key is UUID", () => {
    renderSection("client", [{ key: uuid, label: "Acme SA de CV" }]);

    expect(
      screen.getByRole("link", { name: "Ver detalle del cliente Acme SA de CV" }),
    ).toHaveAttribute("href", `/clients/${uuid}`);
  });

  it("keeps non-UUID client keys as plain text", () => {
    renderSection("client", [{ key: "unassigned", label: "Sin cliente" }]);

    expect(screen.getByText("Sin cliente")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("never links route dimension rows", () => {
    renderSection("route", [
      { key: "Monterrey -> CDMX", label: "Monterrey -> CDMX" },
    ]);

    expect(screen.getByText("Monterrey -> CDMX")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
