import { describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { ReserveAsignarStep } from "./ReserveAsignarStep";
import {
  defaultWizardFormValues,
  type TripWizardFormValues,
} from "./validation";

vi.mock("./TripAssignmentResourceFields", () => ({
  TripAssignmentResourceFields: () => <div data-testid="assignment-fields" />,
}));

const vehicles = [
  {
    id: "veh-1",
    unitNumber: "U-1",
    licensePlate: "AAA-111",
    type: "Rabón",
    canBeAssigned: true,
    currentMileage: 10_000,
  },
  {
    id: "veh-2",
    unitNumber: "U-2",
    licensePlate: "BBB-222",
    type: "Rabón",
    canBeAssigned: true,
    currentMileage: 55_500,
  },
];

function Harness({
  vehicleId,
  initialStartMileage,
}: {
  vehicleId: string;
  initialStartMileage?: number;
}) {
  const form = useForm<TripWizardFormValues>({
    defaultValues: {
      ...defaultWizardFormValues,
      vehicleId,
      startMileage: initialStartMileage,
    } as TripWizardFormValues,
  });

  useEffect(() => {
    form.setValue("vehicleId", vehicleId);
  }, [form, vehicleId]);

  return (
    <>
      <ReserveAsignarStep
        form={form}
        vehicles={vehicles as never}
        drivers={[]}
        isLoadingVehicles={false}
        isLoadingDrivers={false}
        allowExpiredDocs={false}
        onAllowExpiredDocsChange={() => {}}
      />
      <output data-testid="start-mileage">
        {String(form.watch("startMileage") ?? "null")}
      </output>
    </>
  );
}

function ChangeVehicleHarness() {
  const [vehicleId, setVehicleId] = useState("veh-1");
  return (
    <div>
      <button type="button" onClick={() => setVehicleId("veh-2")}>
        change-vehicle
      </button>
      <Harness vehicleId={vehicleId} initialStartMileage={10_000} />
    </div>
  );
}

describe("ReserveAsignarStep — precarga odómetro", () => {
  it("precarga startMileage desde currentMileage si estaba vacío", async () => {
    const { getByTestId } = render(<Harness vehicleId="veh-1" />);

    await waitFor(() => {
      expect(getByTestId("start-mileage").textContent).toBe("10000");
    });
  });

  it("sobrescribe startMileage al cambiar de unidad (política B)", async () => {
    const { getByTestId, getByRole } = render(<ChangeVehicleHarness />);

    await waitFor(() => {
      expect(getByTestId("start-mileage").textContent).toBe("10000");
    });

    getByRole("button", { name: "change-vehicle" }).click();

    await waitFor(() => {
      expect(getByTestId("start-mileage").textContent).toBe("55500");
    });
  });
});
