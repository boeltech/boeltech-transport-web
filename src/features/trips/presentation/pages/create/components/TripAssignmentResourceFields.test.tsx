/**
 * TripAssignmentResourceFields — filtros de flota, docs vencidas y grupos.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import type { ReactElement } from "react";

import { TooltipProvider } from "@shared/ui/tooltip";
import type { AssignableVehicleItem } from "@features/vehicles/domain";
import type { AssignableDriverItem } from "../tripAssignmentDrivers";
import {
  TripAssignmentResourceFields,
  type TripAssignmentResourceFieldsProps,
} from "./TripAssignmentResourceFields";
import {
  defaultWizardFormValues,
  type TripWizardFormValues,
} from "./validation";
import { wizardCopy } from "../../../copy";

const copy = wizardCopy.basicInfo;

beforeAll(() => {
  // Radix Select + jsdom
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});

function vehicle(
  overrides: Partial<AssignableVehicleItem> &
    Pick<AssignableVehicleItem, "id" | "unitNumber" | "licensePlate">,
): AssignableVehicleItem {
  return {
    branchId: "branch-a",
    canBeAssigned: true,
    ...overrides,
  } as AssignableVehicleItem;
}

function driver(
  overrides: Partial<AssignableDriverItem> &
    Pick<AssignableDriverItem, "id" | "displayName" | "employeeId">,
): AssignableDriverItem {
  return {
    branchId: "branch-a",
    canBeAssigned: true,
    ...overrides,
  } as AssignableDriverItem;
}

function renderWithProviders(ui: ReactElement) {
  return render(<TooltipProvider delayDuration={0}>{ui}</TooltipProvider>);
}

function vehicleCombobox() {
  return screen.getByRole("combobox", { name: /Vehículo/ });
}

function driverCombobox() {
  return screen.getByRole("combobox", { name: /Conductor/ });
}

function allowExpiredDocsCheckbox() {
  return screen.getByRole("checkbox", {
    name: (_, element) => element.id === "allowExpiredDocs",
  });
}

function Harness({
  defaultValues,
  ...props
}: Partial<TripAssignmentResourceFieldsProps> & {
  defaultValues?: Partial<TripWizardFormValues>;
}) {
  const form = useForm<TripWizardFormValues>({
    defaultValues: {
      ...defaultWizardFormValues,
      originBranchId: "branch-a",
      ...defaultValues,
    } as TripWizardFormValues,
  });

  return (
    <TripAssignmentResourceFields
      form={form}
      vehicles={props.vehicles ?? []}
      drivers={props.drivers ?? []}
      isLoadingVehicles={props.isLoadingVehicles ?? false}
      isLoadingDrivers={props.isLoadingDrivers ?? false}
      excludedDriverEmployeeIds={props.excludedDriverEmployeeIds}
      idPrefix={props.idPrefix}
    />
  );
}

describe("TripAssignmentResourceFields", () => {
  const vehicles = [
    vehicle({
      id: "veh-a",
      unitNumber: "U-A",
      licensePlate: "AAA-111",
      branchId: "branch-a",
    }),
    vehicle({
      id: "veh-b",
      unitNumber: "U-B",
      licensePlate: "BBB-222",
      branchId: "branch-b",
    }),
    vehicle({
      id: "veh-expired",
      unitNumber: "U-EXP",
      licensePlate: "EXP-333",
      branchId: "branch-a",
      canBeAssigned: false,
      expiredDocsOverridable: true,
      blockReason: "Seguro vencido",
    }),
    vehicle({
      id: "veh-busy",
      unitNumber: "U-BUSY",
      licensePlate: "BSY-444",
      branchId: "branch-a",
      canBeAssigned: false,
      blockReason: "En viaje",
    }),
  ];

  const drivers = [
    driver({
      id: "drv-a",
      displayName: "Conductor A",
      employeeId: "emp-a",
      branchId: "branch-a",
    }),
    driver({
      id: "drv-b",
      displayName: "Conductor B",
      employeeId: "emp-b",
      branchId: "branch-b",
    }),
    driver({
      id: "drv-expired",
      displayName: "Conductor Vencido",
      employeeId: "emp-expired",
      branchId: "branch-a",
      canBeAssigned: false,
      expiredDocsOverridable: true,
      blockReason: "Licencia vencida",
    }),
    driver({
      id: "drv-busy",
      displayName: "Conductor Ocupado",
      employeeId: "emp-busy",
      branchId: "branch-a",
      canBeAssigned: false,
      blockReason: "En viaje",
    }),
  ];

  it("scopes fleet to origin branch by default and expands with Ver toda la flota", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness vehicles={vehicles} drivers={drivers} />);

    expect(screen.getByText(copy.label.showAllFleet)).toBeInTheDocument();
    expect(screen.getByText(copy.hint.fleetBranchFilter)).toBeInTheDocument();

    await user.click(vehicleCombobox());
    let listbox = await screen.findByRole("listbox");
    expect(within(listbox).getByText(/AAA-111/)).toBeInTheDocument();
    expect(within(listbox).queryByText(/BBB-222/)).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("checkbox", { name: copy.label.showAllFleet }));
    expect(
      screen.queryByText(copy.hint.fleetBranchFilter),
    ).not.toBeInTheDocument();

    await user.click(vehicleCombobox());
    listbox = await screen.findByRole("listbox");
    expect(within(listbox).getByText(/AAA-111/)).toBeInTheDocument();
    expect(within(listbox).getByText(/BBB-222/)).toBeInTheDocument();
  });

  it("shows expired-docs opt-in and enables expired group when checked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness vehicles={vehicles} drivers={drivers} />);

    expect(allowExpiredDocsCheckbox()).toBeInTheDocument();

    await user.click(vehicleCombobox());
    let listbox = await screen.findByRole("listbox");
    expect(within(listbox).getByText(copy.state.available)).toBeInTheDocument();
    expect(within(listbox).getByText(copy.state.notAssignable)).toBeInTheDocument();
    expect(
      within(listbox).queryByText(copy.state.withExpiredDocs),
    ).not.toBeInTheDocument();
    const expiredWhileBlocked = within(listbox).getByRole("option", {
      name: /EXP-333/,
    });
    expect(expiredWhileBlocked).toHaveAttribute("data-disabled");
    const busyOption = within(listbox).getByRole("option", {
      name: /BSY-444/,
    });
    expect(busyOption).toHaveAttribute("data-disabled");
    await user.keyboard("{Escape}");

    await user.click(allowExpiredDocsCheckbox());
    await user.click(vehicleCombobox());
    listbox = await screen.findByRole("listbox");
    expect(
      within(listbox).getByText(copy.state.withExpiredDocs),
    ).toBeInTheDocument();
    const expiredSelectable = within(listbox).getByRole("option", {
      name: /EXP-333/,
    });
    expect(expiredSelectable).not.toHaveAttribute("data-disabled");
    expect(within(listbox).getByText("Seguro vencido")).toBeInTheDocument();
    expect(
      within(listbox).getByRole("option", { name: /BSY-444/ }),
    ).toHaveAttribute("data-disabled");
  });

  it("clears expired vehicle selection when allow-expired opt-in is turned off", async () => {
    const user = userEvent.setup();

    function ClearHarness() {
      const form = useForm<TripWizardFormValues>({
        defaultValues: {
          ...defaultWizardFormValues,
          originBranchId: "branch-a",
          vehicleId: "",
        } as TripWizardFormValues,
      });

      return (
        <>
          <TripAssignmentResourceFields
            form={form}
            vehicles={vehicles}
            drivers={drivers}
            isLoadingVehicles={false}
            isLoadingDrivers={false}
          />
          <button
            type="button"
            onClick={() =>
              form.setValue("vehicleId", "veh-expired", {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          >
            set-expired-vehicle
          </button>
          <output data-testid="vehicle-value">{form.watch("vehicleId")}</output>
        </>
      );
    }

    renderWithProviders(<ClearHarness />);

    await user.click(allowExpiredDocsCheckbox());
    await user.click(screen.getByRole("button", { name: "set-expired-vehicle" }));
    expect(screen.getByTestId("vehicle-value")).toHaveTextContent("veh-expired");

    await user.click(allowExpiredDocsCheckbox());
    expect(screen.getByTestId("vehicle-value")).toHaveTextContent("");
  });

  it("excludes support-staff employees from driver select", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Harness
        vehicles={vehicles}
        drivers={drivers}
        excludedDriverEmployeeIds={new Set(["emp-a"])}
      />,
    );

    await user.click(driverCombobox());
    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).queryByText("Conductor A")).not.toBeInTheDocument();
    expect(within(listbox).getByText("Conductor Ocupado")).toBeInTheDocument();
  });
});
