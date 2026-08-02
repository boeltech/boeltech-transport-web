import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ComponentProps } from "react";
import { BranchDetailLocationMap } from "./BranchDetailLocationMap";
import { branchesCopy } from "../copy/branchesCopy";
import { GEOLOCATED_BRANCH_COORDS } from "../../test/branchTestFixtures";

const { mockMapboxToken } = vi.hoisted(() => ({
  mockMapboxToken: { value: "pk.test-token" },
}));

vi.mock("@shared/config", () => ({
  config: {
    geolocation: {
      get mapboxPublicToken() {
        return mockMapboxToken.value;
      },
    },
  },
}));

vi.mock("@shared/ui/address-input/AddressGeolocationMap", () => ({
  AddressGeolocationMap: () => <div data-testid="branch-location-map" />,
}));

function renderMap(props: ComponentProps<typeof BranchDetailLocationMap>) {
  return render(
    <MemoryRouter>
      <BranchDetailLocationMap {...props} />
    </MemoryRouter>,
  );
}

describe("BranchDetailLocationMap", () => {
  beforeEach(() => {
    mockMapboxToken.value = "pk.test-token";
  });

  it("renders read-only map when coordinates and token are available", async () => {
    renderMap({
      latitude: GEOLOCATED_BRANCH_COORDS.latitude,
      longitude: GEOLOCATED_BRANCH_COORDS.longitude,
      geolocationPending: false,
    });

    expect(screen.getByText(branchesCopy.detail.map.title)).toBeInTheDocument();
    expect(
      screen.getByText(branchesCopy.detail.map.confirmedLabel),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `${GEOLOCATED_BRANCH_COORDS.latitude.toFixed(6)}, ${GEOLOCATED_BRANCH_COORDS.longitude.toFixed(6)}`,
      ),
    ).toBeInTheDocument();

    expect(await screen.findByTestId("branch-location-map")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: branchesCopy.detail.map.openExternal }),
    ).toHaveAttribute(
      "href",
      `https://www.google.com/maps?q=${GEOLOCATED_BRANCH_COORDS.latitude},${GEOLOCATED_BRANCH_COORDS.longitude}`,
    );
  });

  it("renders placeholder and edit CTA when coordinates are missing", () => {
    renderMap({
      latitude: null,
      longitude: null,
      geolocationPending: true,
      editHref: "/branches/branch-1/edit",
      canEdit: true,
    });

    expect(
      screen.getByText(branchesCopy.detail.map.noCoordinates),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: branchesCopy.detail.map.completeLocationCta,
      }),
    ).toHaveAttribute("href", "/branches/branch-1/edit");
    expect(screen.queryByTestId("branch-location-map")).not.toBeInTheDocument();
  });

  it("hides edit CTA without update permission", () => {
    renderMap({
      latitude: null,
      longitude: null,
      geolocationPending: true,
      editHref: "/branches/branch-1/edit",
      canEdit: false,
    });

    expect(
      screen.queryByRole("link", {
        name: branchesCopy.detail.map.completeLocationCta,
      }),
    ).not.toBeInTheDocument();
  });

  it("shows map unavailable message and coordinates text when token is missing", () => {
    mockMapboxToken.value = "";

    renderMap({
      latitude: GEOLOCATED_BRANCH_COORDS.latitude,
      longitude: GEOLOCATED_BRANCH_COORDS.longitude,
      geolocationPending: false,
    });

    expect(
      screen.getByText(branchesCopy.detail.map.mapUnavailable),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `${GEOLOCATED_BRANCH_COORDS.latitude.toFixed(6)}, ${GEOLOCATED_BRANCH_COORDS.longitude.toFixed(6)}`,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("branch-location-map")).not.toBeInTheDocument();
  });
});
