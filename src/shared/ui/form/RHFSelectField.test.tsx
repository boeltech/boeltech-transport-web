import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";

import { RHFSelectField } from "./RHFSelectField";

type FormValues = { midTripPayoutPolicy: string };

function Harness({ initial }: { initial: string }) {
  const { control } = useForm<FormValues>({
    defaultValues: { midTripPayoutPolicy: initial },
  });

  return (
    <RHFSelectField
      control={control}
      name="midTripPayoutPolicy"
      label="Medio viaje"
      options={[
        { value: "split_by_assigned_km", label: "Prorrateo por km asignados" },
        { value: "equal_parts", label: "Partes iguales" },
      ]}
      fieldId="mid-trip-payout-policy"
    />
  );
}

describe("RHFSelectField", () => {
  it("con value vacío muestra el placeholder (no finge la primera opción)", () => {
    render(<Harness initial="" />);

    expect(screen.getByRole("combobox")).toHaveTextContent("Seleccionar");
    expect(
      screen.queryByText("Prorrateo por km asignados"),
    ).not.toBeInTheDocument();
  });

  it("con value válido muestra su label", () => {
    render(<Harness initial="equal_parts" />);

    expect(screen.getByRole("combobox")).toHaveTextContent("Partes iguales");
  });
});
