import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { trackingCopy } from "../../copy";
import { CloseTrackingIncidentSheet } from "./CloseTrackingIncidentSheet";

const mutate = vi.fn();

vi.mock("@features/trips/application", () => ({
  useCloseTrackingIncident: () => ({ mutate, isPending: false }),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("./trackingIdempotency", () => ({
  createTrackingIdempotencyKey: () =>
    "22222222-2222-4222-8222-222222222222",
}));

describe("CloseTrackingIncidentSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exige nota de cierre y no llama mutate sin ella", () => {
    render(
      <CloseTrackingIncidentSheet
        tripId="trip-1"
        open
        onOpenChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: trackingCopy.sheet.closeIncidentTitle,
      }),
    ).toBeInTheDocument();
    expect(trackingCopy.sheet.closeIncidentDescription).not.toMatch(
      /resuelto|borrar|elimin/i,
    );
    expect(trackingCopy.action.closeIncident).not.toMatch(/resolver/i);

    fireEvent.click(
      screen.getByRole("button", { name: trackingCopy.action.closeIncident }),
    );

    expect(
      screen.getByText(trackingCopy.sheet.closeIncidentNotesRequired),
    ).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("envía notes + occurredAt + idempotencyKey al confirmar", () => {
    render(
      <CloseTrackingIncidentSheet
        tripId="trip-1"
        open
        onOpenChange={vi.fn()}
      />,
    );

    fireEvent.change(
      screen.getByLabelText(trackingCopy.sheet.closeIncidentNotesLabel),
      { target: { value: "  Asistencia en sitio; unidad continúa  " } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: trackingCopy.action.closeIncident }),
    );

    expect(mutate).toHaveBeenCalledTimes(1);
    const payload = mutate.mock.calls[0]?.[0];
    expect(payload.tripId).toBe("trip-1");
    expect(payload.input.notes).toBe("Asistencia en sitio; unidad continúa");
    expect(payload.input.idempotencyKey).toBe(
      "22222222-2222-4222-8222-222222222222",
    );
    expect(typeof payload.input.occurredAt).toBe("string");
    expect(payload.input.occurredAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
