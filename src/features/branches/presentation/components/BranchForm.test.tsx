import { describe, expect, it, vi } from "vitest";
import { createRef } from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BranchForm, type BranchFormRef } from "./BranchForm";
import { branchesCopy } from "../copy/branchesCopy";
import { TooltipProvider } from "@shared/ui/tooltip";

vi.mock("@shared/ui/address-input/AddressInput", () => ({
  default: () => <div data-testid="address-input-stub" />,
}));

vi.mock("@shared/ui/address-input/AddressGeolocationPanel", () => ({
  AddressGeolocationPanel: () => (
    <div data-testid="address-geolocation-panel-stub" />
  ),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe("BranchForm wizard step validation", () => {
  it("renders general fields on wizard step 0", () => {
    render(
      <TooltipProvider>
        <BranchForm
          wizardMode
          wizardStepIndex={0}
          onSubmit={vi.fn()}
        />
      </TooltipProvider>,
    );

    expect(screen.getByLabelText(/Código/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre/i)).toBeInTheDocument();
    expect(screen.getAllByText(branchesCopy.form.sections.general.title).length).toBeGreaterThan(0);
  });

  it("fails step 0 validation when required fields are empty", async () => {
    const ref = createRef<BranchFormRef>();

    render(
      <TooltipProvider>
        <BranchForm
          ref={ref}
          wizardMode
          wizardStepIndex={0}
          onSubmit={vi.fn()}
        />
      </TooltipProvider>,
    );

    let valid = true;
    await act(async () => {
      valid = (await ref.current?.triggerStepValidation(0)) ?? true;
    });

    expect(valid).toBe(false);
  });

  it("passes step 0 validation when code and name are filled", async () => {
    const ref = createRef<BranchFormRef>();
    const user = userEvent.setup();

    render(
      <TooltipProvider>
        <BranchForm
          ref={ref}
          wizardMode
          wizardStepIndex={0}
          onSubmit={vi.fn()}
        />
      </TooltipProvider>,
    );

    await user.type(screen.getByLabelText(/Código/i), "QRO-99");
    await user.type(screen.getByLabelText(/Nombre/i), "Sucursal Test");

    let valid = false;
    await act(async () => {
      valid = (await ref.current?.triggerStepValidation(0)) ?? false;
    });

    expect(valid).toBe(true);
  });

  it("renders geocoding section on wizard address step", () => {
    render(
      <TooltipProvider>
        <BranchForm
          wizardMode
          wizardStepIndex={1}
          onSubmit={vi.fn()}
        />
      </TooltipProvider>,
    );

    expect(screen.getByTestId("address-input-stub")).toBeInTheDocument();
    expect(screen.getByTestId("address-geolocation-panel-stub")).toBeInTheDocument();
    expect(screen.getAllByText(/Ubicación en mapa/i).length).toBeGreaterThan(0);
  });
});
