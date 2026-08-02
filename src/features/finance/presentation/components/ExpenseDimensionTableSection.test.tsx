import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ExpenseDimensionTableSection } from "./ExpenseDimensionTableSection";

describe("ExpenseDimensionTableSection", () => {
  it("links readable vehicle labels to unit detail", () => {
    render(
      <MemoryRouter>
        <ExpenseDimensionTableSection
          dimension="vehicle"
          onDimensionChange={vi.fn()}
          rows={[
            {
              key: "11111111-1111-4111-8111-111111111111",
              label: "U-014 · ABC-123-A",
              tripCount: 3,
              totalExpenses: 12000,
              avgExpensePerTrip: 4000,
            },
          ]}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", { name: "Ver detalle de la unidad U-014 · ABC-123-A" }),
    ).toHaveAttribute(
      "href",
      "/vehicles/11111111-1111-4111-8111-111111111111",
    );
  });
});

