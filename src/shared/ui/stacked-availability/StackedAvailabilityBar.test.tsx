import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { StackedAvailabilityBar } from "./StackedAvailabilityBar";

describe("StackedAvailabilityBar", () => {
  it("muestra top libres, leyenda y enlace", () => {
    render(
      <MemoryRouter>
        <StackedAvailabilityBar
          freeCount={4}
          freeCaption="de 18 unidades libres"
          href="/vehicles"
          linkLabel="Unidades ›"
          segments={[
            { id: "free", label: "Libres", count: 4, tone: "free" },
            { id: "trip", label: "En viaje", count: 11, tone: "onTrip" },
            { id: "shop", label: "En taller", count: 2, tone: "maintenance" },
            { id: "off", label: "Baja temporal", count: 1, tone: "idle" },
          ]}
        />
      </MemoryRouter>,
    );

    expect(screen.getAllByText("4").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("de 18 unidades libres")).toBeInTheDocument();
    expect(screen.getByText("Libres")).toBeInTheDocument();
    expect(screen.getByText("En taller")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Unidades ›" })).toHaveAttribute(
      "href",
      "/vehicles",
    );
  });
});
