/**
 * Remolques reserved/on_trip no se ofrecen como libres al armar otra reserva.
 */
import { beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { MemoryRouter } from "react-router-dom";

import type { AssignableTrailerItem } from "@features/trailers";
import { TrailerStatus, TRAILER_STATUS_LABELS } from "@features/trailers";
import type { AssignableVehicleItem } from "@features/vehicles/domain";
import { wizardCopy } from "../../../copy";
import {
  defaultWizardFormValues,
  type TripWizardFormValues,
} from "./validation";
import { TripTrailerAssignmentFields } from "./TripTrailerAssignmentFields";

const copy = wizardCopy.basicInfo;
const AVAILABLE_ID = "trl-available";
const RESERVED_ID = "trl-reserved";
const VEHICLE_SR_ID = "veh-sr";

const assignableTrailers: AssignableTrailerItem[] = [
  {
    id: AVAILABLE_ID,
    tenantId: "tenant-1",
    licensePlate: "ABC123A",
    satSubTipoRemCode: "CTR003",
    status: TrailerStatus.AVAILABLE,
    branchId: null,
    isActive: true,
    notes: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    createdBy: null,
    updatedBy: null,
    canBeAssigned: true,
  },
  {
    id: RESERVED_ID,
    tenantId: "tenant-1",
    licensePlate: "12MN4P6",
    satSubTipoRemCode: "CTR003",
    status: TrailerStatus.RESERVED,
    branchId: null,
    isActive: true,
    notes: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    createdBy: null,
    updatedBy: null,
    canBeAssigned: false,
    blockReason: TRAILER_STATUS_LABELS[TrailerStatus.RESERVED],
  },
];

vi.mock("@features/trailers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/trailers")>();
  return {
    ...actual,
    useAssignableTrailers: () => ({
      data: assignableTrailers,
      isLoading: false,
    }),
    CreateTrailerSheet: () => null,
  };
});

beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});

function vehicleSr(): AssignableVehicleItem {
  return {
    id: VEHICLE_SR_ID,
    unitNumber: "U-200",
    licensePlate: "JAL5679",
    satConfigAutotransporteCode: "T3S2",
    canBeAssigned: true,
  } as AssignableVehicleItem;
}

function Harness({
  trailers = [],
}: {
  trailers?: TripWizardFormValues["trailers"];
}) {
  const form = useForm<TripWizardFormValues>({
    defaultValues: {
      ...defaultWizardFormValues,
      vehicleId: VEHICLE_SR_ID,
      trailers,
    } as TripWizardFormValues,
  });
  return (
    <MemoryRouter>
      <TripTrailerAssignmentFields form={form} vehicles={[vehicleSr()]} />
    </MemoryRouter>
  );
}

describe("TripTrailerAssignmentFields", () => {
  it("lists reserved trailers as not assignable on a new reserve", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("combobox", { name: /Remolque 1/ }));
    const list = await screen.findByRole("listbox");

    expect(
      within(list).getByRole("option", {
        name: copy.format.trailerOption("ABC123A", "CTR003"),
      }),
    ).not.toHaveAttribute("data-disabled");
    expect(
      within(list).getByRole("option", {
        name: new RegExp("12MN4P6"),
      }),
    ).toHaveAttribute("data-disabled");
    expect(within(list).getByText(copy.state.notAssignable)).toBeInTheDocument();
    expect(
      within(list).getByText(TRAILER_STATUS_LABELS[TrailerStatus.RESERVED]),
    ).toBeInTheDocument();
  });

  it("keeps the trailer already assigned to this trip selectable", async () => {
    const user = userEvent.setup();
    render(
      <Harness trailers={[{ trailerId: RESERVED_ID, position: 1 }]} />,
    );

    await user.click(screen.getByRole("combobox", { name: /Remolque 1/ }));
    const list = await screen.findByRole("listbox");
    expect(
      within(list).getByRole("option", {
        name: copy.format.trailerOption("12MN4P6", "CTR003"),
      }),
    ).not.toHaveAttribute("data-disabled");
  });
});
