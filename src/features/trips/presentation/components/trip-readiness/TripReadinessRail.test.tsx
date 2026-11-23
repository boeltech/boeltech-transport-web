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
  { id: "fleet", done: false, group: "schedule" },
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

  it("defaults to secondary emphasis (does not compete with next-step)", () => {
    render(
      <TripReadinessRail status={TripStatus.DRAFT} items={ITEMS} />,
    );
    expect(screen.getByTestId("trip-readiness-rail")).toHaveAttribute(
      "data-emphasis",
      "secondary",
    );
  });

  it("NS4: draft incluye Pedido y grupos schedule + operate con sufijo", () => {
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
    expect(
      screen.getByLabelText(
        `${copy.readiness.operateGroup} · ${copy.readiness.operateHint}`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.readiness.order)).toBeInTheDocument();
    expect(screen.getByText(copy.readiness.route)).toBeInTheDocument();
    expect(screen.getByText(copy.readiness.cargoNeedsPickup)).toBeInTheDocument();
    expect(
      screen.queryByText(copy.readiness.goToTracking),
    ).not.toBeInTheDocument();
  });

  it("NS4: scheduled usa Para iniciar (Paradas, Flota, Kilometraje) + Para completar", () => {
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
    expect(screen.getByText(copy.readiness.startGroup)).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        `${copy.readiness.operateGroup} · ${copy.readiness.operateHintScheduled}`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(copy.readiness.scheduleGroup),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(copy.readiness.arrival)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.readiness.order)).not.toBeInTheDocument();
    expect(screen.getByText(copy.readiness.route)).toBeInTheDocument();
    expect(screen.getByText(copy.readiness.fleet)).toBeInTheDocument();
    expect(screen.getByText(copy.readiness.mileage)).toBeInTheDocument();
    expect(screen.getByText(copy.readiness.cargoNeedsPickup)).toBeInTheDocument();
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

  it("NS5: pendiente clicable; listo no es botón", async () => {
    const user = userEvent.setup();
    const onItemClick = vi.fn();
    render(
      <TripReadinessRail
        status={TripStatus.DRAFT}
        items={ITEMS}
        onItemClick={onItemClick}
        presentation="checklist"
      />,
    );

    const pendingRate = screen.getByRole("button", {
      name: `${copy.readiness.rate}: ${copy.readiness.pending}`,
    });
    expect(pendingRate).toHaveAttribute("data-ready", "false");
    await user.click(pendingRate);
    expect(onItemClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: "rate", tab: "costs" }),
    );

    const doneOrder = screen.getByTestId("trip-readiness-chip-order");
    expect(doneOrder.tagName).toBe("SPAN");
    expect(doneOrder).toHaveAttribute("data-ready", "true");
    expect(
      screen.queryByRole("button", {
        name: `${copy.readiness.order}: ${copy.readiness.done}`,
      }),
    ).not.toBeInTheDocument();
  });

  it("checklist presentation omits standalone card title (F8 / D15)", () => {
    render(
      <TripReadinessRail
        status={TripStatus.DRAFT}
        items={ITEMS}
        presentation="checklist"
      />,
    );

    expect(screen.getByTestId("trip-readiness-checklist")).toBeInTheDocument();
    expect(screen.queryByTestId("trip-readiness-rail")).not.toBeInTheDocument();
    expect(screen.queryByText(copy.readiness.title)).not.toBeInTheDocument();
    expect(screen.getByText(copy.readiness.scheduleGroup)).toBeInTheDocument();
    expect(screen.getByText(copy.readiness.operateGroup)).toBeInTheDocument();
  });
});
