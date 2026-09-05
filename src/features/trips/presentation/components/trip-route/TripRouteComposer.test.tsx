import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { AddressSearchListItem } from "@shared/ui/address-picker/types";
import type { LocationValue } from "@shared/ui/location";

import { tripDetailCopy } from "../../copy";
import {
  TripRouteComposer,
  TripRouteSlotCapture,
} from "./TripRouteComposer";
import {
  buildRouteMasterRows,
  ROUTE_SLOT_ORIGIN_ID,
} from "./tripRouteDetailHelpers";

const copy = tripDetailCopy.route;

const pickerItem: AddressSearchListItem = {
  id: "11111111-1111-4111-8111-111111111111",
  ownerType: "client",
  ownerId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  ownerLabel: "Cliente Alpha",
  addressType: "shipping",
  locationName: "Bodega Alpha",
  street: "Av Cliente",
  exteriorNumber: "1",
  postalCode: "44100",
  satStateCode: "JAL",
  satMunicipalityCode: "039",
  neighborhoodName: null,
  satNeighborhoodCode: null,
  latitude: 20.67,
  longitude: -103.35,
  geocodingAccuracy: null,
  geolocationPending: false,
  isPrimary: false,
  isActive: true,
  isCartaPorteReady: true,
};

vi.mock("@shared/ui/location", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/ui/location")>();
  return {
    ...actual,
    LocationField: ({
      onChange,
      label,
      ownerTypes,
      value,
    }: {
      onChange: (value: LocationValue | null) => void;
      label?: string;
      ownerTypes?: string[];
      value?: LocationValue | null;
    }) => (
      <div>
        <button
          type="button"
          onClick={() => onChange(actual.locationValueFromInternal(pickerItem))}
        >
          {label}
        </button>
        <span data-testid="owner-types">{ownerTypes?.join(",")}</span>
        <span data-testid="location-value">
          {value?.locationName?.trim() || "empty"}
        </span>
      </div>
    ),
  };
});

describe("TripRouteComposer", () => {
  it("shows origin and destination master rows with city hints and no SAT form", () => {
    const rows = buildRouteMasterRows({
      waypoints: [],
      originCityHint: "Guadalajara",
      destinationCityHint: "Monterrey",
    });
    render(
      <TripRouteComposer
        rows={rows}
        selectedId={ROUTE_SLOT_ORIGIN_ID}
        onSelect={vi.fn()}
        onAddWaypoint={vi.fn()}
      />,
    );

    expect(screen.getByText(copy.composer.originSlot)).toBeInTheDocument();
    expect(screen.getByText(copy.composer.destinationSlot)).toBeInTheDocument();
    expect(screen.getByText(copy.composer.cityHint("Guadalajara"))).toBeInTheDocument();
    expect(screen.getByText(copy.composer.cityHint("Monterrey"))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.action.addWaypoint })).toBeInTheDocument();
    expect(screen.queryByText(/código postal/i)).not.toBeInTheDocument();
  });

  it("hides add waypoint in read-only", () => {
    const rows = buildRouteMasterRows({
      waypoints: [],
      originCityHint: "Guadalajara",
      destinationCityHint: "Monterrey",
    });
    render(
      <TripRouteComposer
        rows={rows}
        selectedId={ROUTE_SLOT_ORIGIN_ID}
        onSelect={vi.fn()}
        onAddWaypoint={vi.fn()}
        readOnly
      />,
    );

    expect(screen.queryByRole("button", { name: copy.action.addWaypoint })).not.toBeInTheDocument();
  });
});

describe("TripRouteSlotCapture", () => {
  it("calls onPick when a catalog address is chosen", async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    render(
      <TripRouteSlotCapture
        category="origin"
        onPick={onPick}
        onCompleteLabel={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: `${copy.composer.originSlot}: ${copy.composer.pickerLabel}`,
      }),
    );
    expect(onPick).toHaveBeenCalledWith(
      "origin",
      expect.objectContaining({
        id: pickerItem.id,
        ownerType: "client",
        ownerId: pickerItem.ownerId,
        locationName: "Bodega Alpha",
        street: "Av Cliente",
        postalCode: "44100",
      }),
    );
    expect(screen.getByTestId("owner-types")).toHaveTextContent(
      "client,branch,tenant",
    );
  });

  it("does not PUT a waypoint until operation is confirmed", async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    render(
      <TripRouteSlotCapture
        category="waypoint"
        onPick={onPick}
        onCompleteLabel={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: `${copy.composer.waypointSlot}: ${copy.composer.pickerLabel}`,
      }),
    );
    expect(onPick).not.toHaveBeenCalled();
    expect(
      screen.getByText(copy.composer.waypointOperationQuestion),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: copy.composer.waypointOperationConfirm }),
    );
    expect(onPick).not.toHaveBeenCalled();
    expect(
      screen.getByText(copy.composer.waypointOperationRequired),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("checkbox", {
        name: copy.composer.waypointOperationPickup,
      }),
    );
    await user.click(
      screen.getByRole("button", { name: copy.composer.waypointOperationConfirm }),
    );
    expect(onPick).toHaveBeenCalledWith(
      "waypoint",
      expect.objectContaining({ id: pickerItem.id }),
      { pickup: true, delivery: false },
    );
  });

  it("omits branch on destination and keeps tenant", () => {
    render(
      <TripRouteSlotCapture
        category="destination"
        onPick={vi.fn()}
        onCompleteLabel={vi.fn()}
      />,
    );

    expect(screen.getByTestId("owner-types")).toHaveTextContent("client,tenant");
    expect(screen.getByTestId("owner-types")).not.toHaveTextContent("branch");
  });

  it("does not persist a label-only name; Completar domicilio opens the hatch", async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    const onCompleteLabel = vi.fn();
    render(
      <TripRouteSlotCapture
        category="origin"
        onPick={onPick}
        onCompleteLabel={onCompleteLabel}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: copy.composer.labelHatchToggle }),
    );
    await user.type(
      screen.getByLabelText(copy.composer.labelPlaceholder, {
        selector: "#trip-route-composer-origin-label",
      }),
      "Patio norte",
    );
    expect(onPick).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: copy.action.completeAddress }),
    );
    expect(onCompleteLabel).toHaveBeenCalledWith("origin", "Patio norte");
    expect(onPick).not.toHaveBeenCalled();
  });

  it("starts empty on destination after an origin pick when remounted with key", async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    const { rerender } = render(
      <TripRouteSlotCapture
        key="origin"
        category="origin"
        onPick={onPick}
        onCompleteLabel={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: `${copy.composer.originSlot}: ${copy.composer.pickerLabel}`,
      }),
    );
    expect(screen.getByTestId("location-value")).toHaveTextContent("Bodega Alpha");

    rerender(
      <TripRouteSlotCapture
        key="destination"
        category="destination"
        onPick={onPick}
        onCompleteLabel={vi.fn()}
      />,
    );

    expect(screen.getByTestId("location-value")).toHaveTextContent("empty");
    expect(
      screen.getByRole("button", {
        name: `${copy.composer.destinationSlot}: ${copy.composer.pickerLabel}`,
      }),
    ).toBeInTheDocument();
  });

  it("seeds LocationField from pending draft for the active slot", () => {
    render(
      <TripRouteSlotCapture
        key="origin"
        category="origin"
        seedItem={pickerItem}
        onPick={vi.fn()}
        onCompleteLabel={vi.fn()}
      />,
    );

    expect(screen.getByTestId("location-value")).toHaveTextContent("Bodega Alpha");
  });
});
