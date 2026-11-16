import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { TripJourneyStrip } from "./TripJourneyStrip";

describe("TripJourneyStrip", () => {
  it("P2-3: fase Cancelado actual muestra X destructive, no número info", () => {
    render(
      <TripJourneyStrip
        model={{
          phases: [
            {
              id: "draft",
              label: "Reserva",
              state: "done",
              detail: null,
              stepNumber: 1,
            },
            {
              id: "scheduled",
              label: "Programado",
              state: "done",
              detail: null,
              stepNumber: 2,
            },
            {
              id: "in_progress",
              label: "En ruta",
              state: "upcoming",
              detail: null,
              stepNumber: 3,
            },
            {
              id: "cancelled",
              label: "Cancelado",
              state: "current",
              detail: "10 nov",
              stepNumber: 4,
            },
          ],
          facts: [],
        }}
      />,
    );

    const marker = screen.getByTestId("trip-journey-phase-cancelled-current");
    expect(marker).toBeInTheDocument();
    expect(marker).toHaveClass("bg-destructive");
    expect(marker.textContent).not.toMatch(/4/);
  });
});
