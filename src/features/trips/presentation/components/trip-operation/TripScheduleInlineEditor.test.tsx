import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TripStatus, type Trip } from "@features/trips/domain";
import { operationCopy } from "../../copy";
import { TripScheduleInlineEditor } from "./TripScheduleInlineEditor";

vi.mock("@features/trips/application", () => ({
  useUpdateTrip: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
  useReplaceTripStops: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: "trip-1",
    tenantId: "tenant-1",
    tripCode: "VJ-001",
    status: TripStatus.DRAFT,
    scheduledDeparture: new Date("2026-05-28T08:00:00.000Z"),
    scheduledArrival: new Date("2026-05-28T18:00:00.000Z"),
    updatedAt: new Date("2026-05-28T07:00:00.000Z"),
    actualDeparture: null,
    actualArrival: null,
    mileage: { start: 100_000, end: null },
    ...overrides,
  } as Trip;
}

describe("TripScheduleInlineEditor", () => {
  it("keeps draft when trip updatedAt changes but schedule fields are unchanged", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <TripScheduleInlineEditor trip={makeTrip()} readOnly={false} />,
    );

    await user.click(screen.getAllByRole("button", { name: "Mañana 08:00" })[0]!);

    expect(
      screen.getByRole("button", { name: operationCopy.action.saveSchedule }),
    ).toBeInTheDocument();

    rerender(
      <TripScheduleInlineEditor
        trip={makeTrip({
          updatedAt: new Date("2026-05-28T12:00:00.000Z"),
        })}
        readOnly={false}
      />,
    );

    expect(
      screen.getByRole("button", { name: operationCopy.action.saveSchedule }),
    ).toBeInTheDocument();
  });
});
