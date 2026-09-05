import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AddressCatalogOrManualField } from "./AddressCatalogOrManualField";
import { satCatalogComboboxCopy } from "./satCatalogComboboxCopy";

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

type FormShape = {
  satLocalityCode: string;
  localityName: string;
};

describe("AddressCatalogOrManualField", () => {
  it("persists the exact catalog code when selecting among colliding shorts", async () => {
    const user = userEvent.setup();
    let values: FormShape | null = null;

    function Harness() {
      const form = useForm<FormShape>({
        defaultValues: { satLocalityCode: "", localityName: "" },
      });
      values = form.watch();
      return (
        <AddressCatalogOrManualField
          control={form.control}
          namePrefix=""
          codeFieldName="satLocalityCode"
          nameFieldName="localityName"
          options={[
            { code: "QUE-01", name: "Localidad A" },
            { code: "JAL-01", name: "Localidad B" },
          ]}
          label={satCatalogComboboxCopy.locality.label}
          catalogPlaceholder={satCatalogComboboxCopy.locality.catalogPlaceholder}
          catalogSearchPlaceholder={
            satCatalogComboboxCopy.locality.catalogSearchPlaceholder
          }
          catalogAriaLabel={satCatalogComboboxCopy.locality.catalogAriaLabel}
        />
      );
    }

    render(<Harness />);

    await user.click(
      screen.getByRole("combobox", {
        name: satCatalogComboboxCopy.locality.catalogAriaLabel,
      }),
    );
    await user.type(
      screen.getByPlaceholderText(
        satCatalogComboboxCopy.locality.catalogSearchPlaceholder,
      ),
      "Localidad B",
    );
    await user.click(screen.getByText("Localidad B"));

    expect(values?.satLocalityCode).toBe("JAL-01");
    expect(values?.localityName).toBe("Localidad B");
    expect(
      screen.getByRole("combobox", {
        name: satCatalogComboboxCopy.locality.catalogAriaLabel,
      }),
    ).toHaveTextContent("Localidad B");
  });
});
