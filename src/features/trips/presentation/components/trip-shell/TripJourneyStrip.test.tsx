import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { TripJourneyStrip } from "./TripJourneyStrip";

const fourPhasesModel = {
  phases: [
    {
      id: "draft" as const,
      label: "Reserva",
      state: "done" as const,
      detail: null,
      stepNumber: 1,
    },
    {
      id: "scheduled" as const,
      label: "Programado",
      state: "done" as const,
      detail: null,
      stepNumber: 2,
    },
    {
      id: "in_progress" as const,
      label: "En ruta",
      state: "upcoming" as const,
      detail: null,
      stepNumber: 3,
    },
    {
      id: "cancelled" as const,
      label: "Cancelado",
      state: "current" as const,
      detail: "10 nov",
      stepNumber: 4,
    },
  ],
  facts: [],
};

describe("TripJourneyStrip", () => {
  it("P2-3: fase Cancelado actual muestra X destructive, no número info", () => {
    render(<TripJourneyStrip model={fourPhasesModel} />);

    const marker = screen.getByTestId("trip-journey-phase-cancelled-current");
    expect(marker).toBeInTheDocument();
    expect(marker).toHaveClass("bg-destructive");
    expect(marker.textContent).not.toMatch(/4/);
  });

  it("P1 rail: conectores son hermanos flex-1 del rail (no stubs en wrapper por fase)", () => {
    render(<TripJourneyStrip model={fourPhasesModel} />);

    const strip = screen.getByTestId("trip-journey-strip");
    const rail = strip.firstElementChild as HTMLElement;
    const connectors = within(strip).getAllByTestId(
      "trip-journey-phase-connector",
    );

    expect(connectors).toHaveLength(3);
    for (const connector of connectors) {
      expect(connector.parentElement).toBe(rail);
      expect(connector).toHaveClass("flex-1");
      expect(connector).toHaveClass("min-w-4");
      expect(connector).toHaveClass("bg-border");
    }
  });

  it("P2: check done usa success-soft del DS", () => {
    render(<TripJourneyStrip model={fourPhasesModel} />);

    const doneMarkers = screen
      .getByTestId("trip-journey-strip")
      .querySelectorAll(".bg-success-soft.text-success-soft-foreground");
    expect(doneMarkers.length).toBeGreaterThanOrEqual(2);
  });
});
