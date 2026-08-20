import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TripStatus } from "@features/trips/domain";
import { tripDetailCopy } from "../../copy";
import type { TripReadinessItem } from "../../hooks/useTripReadiness";
import { TripReadinessRail } from "./TripReadinessRail";

const copy = tripDetailCopy.shell;

const ITEMS: TripReadinessItem[] = [
  { id: "order", done: true, group: "schedule" },
  { id: "fleet", done: true, group: "schedule" },
  { id: "departure", done: true, group: "schedule", tab: "overview" },
  { id: "arrival", done: false, group: "schedule", tab: "overview" },
  { id: "rate", done: false, group: "schedule", tab: "costs" },
  { id: "mileage", done: true, group: "schedule", tab: "overview" },
  { id: "route", done: false, group: "operate", tab: "route" },
  { id: "cargo", done: false, group: "operate", tab: "route" },
];

describe("TripReadinessRail", () => {
  it("does not render when the trip is in progress", () => {
    const { container } = render(
      <TripReadinessRail status={TripStatus.IN_PROGRESS} items={ITEMS} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders schedule and timbrar groups in draft", () => {
    render(
      <TripReadinessRail
        status={TripStatus.DRAFT}
        items={ITEMS}
        clientName="Acme"
        originCity="CDMX"
        destinationCity="MTY"
      />,
    );

    expect(screen.getByTestId("trip-readiness-rail")).toBeInTheDocument();
    expect(screen.getByText(copy.readiness.title)).toBeInTheDocument();
    expect(screen.getByText(copy.readiness.scheduleGroup)).toBeInTheDocument();
    expect(screen.getByText(copy.readiness.operateGroup)).toBeInTheDocument();
    expect(screen.queryByText(copy.readiness.hint)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.readiness.operateHint)).not.toBeInTheDocument();
    expect(
      screen.getByText(
        copy.readiness.missingToSchedule("Acme", "CDMX → MTY", "Llegada, Tarifa"),
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(copy.readiness.order)).not.toBeInTheDocument();
    expect(screen.getByText(copy.readiness.route)).toBeInTheDocument();
    expect(screen.getByText(copy.readiness.cargoNeedsPickup)).toBeInTheDocument();
    expect(
      screen.queryByText(copy.readiness.goToTracking),
    ).not.toBeInTheDocument();
  });

  it("renders scheduled rail without schedule group and with route blocking start", () => {
    const onGoToTracking = vi.fn();
    render(
      <TripReadinessRail
        status={TripStatus.SCHEDULED}
        items={ITEMS}
        clientName="Acme"
        originCity="CDMX"
        destinationCity="MTY"
        onGoToTracking={onGoToTracking}
      />,
    );

    expect(screen.getByText(copy.readiness.titleScheduled)).toBeInTheDocument();
    expect(
      screen.getByText(copy.readiness.missingToStart("Acme", "CDMX → MTY")),
    ).toBeInTheDocument();
    expect(screen.queryByText(copy.readiness.hintScheduled)).not.toBeInTheDocument();
    expect(
      screen.queryByText(copy.readiness.operateHintScheduled),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(copy.readiness.scheduleGroup),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(copy.readiness.arrival)).not.toBeInTheDocument();
    expect(screen.getByText(copy.readiness.route)).toBeInTheDocument();
    expect(screen.getByText(copy.readiness.cargoNeedsPickup)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.readiness.goToTracking }),
    ).toBeInTheDocument();
  });

  it("tells the operator they can start when scheduled and route is ready", () => {
    const items = ITEMS.map((item) =>
      item.id === "route" ? { ...item, done: true, tab: "route" as const } : item,
    );
    render(
      <TripReadinessRail
        status={TripStatus.SCHEDULED}
        items={items}
        clientName="Acme"
        originCity="CDMX"
        destinationCity="MTY"
      />,
    );

    expect(
      screen.getByText(copy.readiness.readyToStart("Acme", "CDMX → MTY")),
    ).toBeInTheDocument();
  });

  it("calls onGoToTracking from scheduled rail", async () => {
    const user = userEvent.setup();
    const onGoToTracking = vi.fn();
    render(
      <TripReadinessRail
        status={TripStatus.SCHEDULED}
        items={ITEMS}
        onGoToTracking={onGoToTracking}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: copy.readiness.goToTracking }),
    );
    expect(onGoToTracking).toHaveBeenCalledOnce();
  });

  it("calls onItemClick for paradas and tarifa", async () => {
    const user = userEvent.setup();
    const onItemClick = vi.fn();
    render(
      <TripReadinessRail
        status={TripStatus.DRAFT}
        items={ITEMS}
        onItemClick={onItemClick}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: `${copy.readiness.route}: ${copy.readiness.pending}`,
      }),
    );
    expect(onItemClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: "route", tab: "route" }),
    );

    await user.click(
      screen.getByRole("button", {
        name: `${copy.readiness.rate}: ${copy.readiness.pending}`,
      }),
    );
    expect(onItemClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: "rate", tab: "costs" }),
    );
  });
});
