import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { AddressSearchListItem } from "@shared/ui/address-picker/types";

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
  geolocationPending: false,
  isPrimary: false,
  isActive: true,
  isCartaPorteReady: true,
};

vi.mock("@shared/ui/address-picker", () => ({
  AddressPicker: ({
    onSelect,
    label,
    defaultOwnerTypes,
  }: {
    onSelect: (item: AddressSearchListItem) => void;
    label?: string;
    defaultOwnerTypes?: string[];
  }) => (
    <div>
      <button type="button" onClick={() => onSelect(pickerItem)}>
        {label}
      </button>
      <span data-testid="owner-types">{defaultOwnerTypes?.join(",")}</span>
    </div>
  ),
}));

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
    expect(onPick).toHaveBeenCalledWith("origin", pickerItem);
    expect(screen.getByTestId("owner-types")).toHaveTextContent(
      "client,branch,tenant",
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
});
