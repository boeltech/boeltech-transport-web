import { describe, expect, it, vi } from "vitest";
import { createRef } from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BranchForm, type BranchFormRef } from "./BranchForm";
import { branchesCopy } from "../copy/branchesCopy";
import { buildBranch } from "../../test/branchTestFixtures";
import { TooltipProvider } from "@shared/ui/tooltip";
import type { LocationFieldProps, LocationValue } from "@shared/ui/location";

vi.mock("@shared/ui/address-input/AddressInput", () => ({
  default: () => <div data-testid="address-input-stub" />,
}));

vi.mock("@shared/ui/address-input/AddressGeolocationPanel", () => ({
  AddressGeolocationPanel: () => (
    <div data-testid="address-geolocation-panel-stub" />
  ),
}));

vi.mock("@shared/ui/location", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/ui/location")>();
  return {
    ...actual,
    LocationField: ({ value, onChange }: LocationFieldProps) => (
      <div data-testid="location-field-stub">
        <span data-testid="location-card-title">
          {value?.locationName?.trim() || "empty"}
        </span>
        <span data-testid="location-card-accuracy">
          {value?.geocodingAccuracy ?? "none"}
        </span>
        <button
          type="button"
          data-testid="location-confirm-usar"
          onClick={() => {
            const next: LocationValue = {
              locationName: "Sucursal Los Arcos",
              street: "Boulevard Bernardo Quintana Arrioja",
              exteriorNumber: "12",
              postalCode: "76022",
              satCountryCode: "MEX",
              satStateCode: "22",
              satMunicipalityCode: "014",
              latitude: 20.59,
              longitude: -100.39,
              geocodingAccuracy: "approximate",
            };
            onChange(next);
          }}
        >
          Usar
        </button>
      </div>
    ),
  };
});

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

    expect(screen.getByTestId("location-field-stub")).toBeInTheDocument();
    expect(screen.getByTestId("address-input-stub")).toBeInTheDocument();
    expect(screen.getByTestId("address-geolocation-panel-stub")).toBeInTheDocument();
    expect(screen.getAllByText(/Ubicación en mapa/i).length).toBeGreaterThan(0);
  });

  it("shows LocationSheet locationName on card after Usar", async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider>
        <BranchForm wizardMode wizardStepIndex={1} onSubmit={vi.fn()} />
      </TooltipProvider>,
    );

    expect(screen.getByTestId("location-card-title")).toHaveTextContent("empty");

    await user.click(screen.getByTestId("location-confirm-usar"));

    await waitFor(() => {
      expect(screen.getByTestId("location-card-title")).toHaveTextContent(
        "Sucursal Los Arcos",
      );
    });
    expect(screen.getByTestId("location-card-accuracy")).toHaveTextContent(
      "approximate",
    );
  });
});

describe("BranchForm edit layout", () => {
  it("muestra tres secciones operativas sin card de notas aparte", () => {
    render(
      <TooltipProvider>
        <BranchForm branch={buildBranch()} onSubmit={vi.fn()} onCancel={vi.fn()} />
      </TooltipProvider>,
    );

    expect(
      screen.getByText(branchesCopy.form.sections.general.editTitle),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(branchesCopy.form.sections.contact.title).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(branchesCopy.form.sections.address.editTitle),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(branchesCopy.form.fields.notes.label)).toBeInTheDocument();
    expect(screen.getByLabelText(branchesCopy.form.fields.isMain.label)).toBeInTheDocument();
  });

  it("hydrates locationName from branch address into Location card", () => {
    render(
      <TooltipProvider>
        <BranchForm
          branch={buildBranch({
            name: "Sucursal Centro",
            address: {
              ...buildBranch().address,
              locationName: "Patio Los Arcos",
            },
          })}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      </TooltipProvider>,
    );

    expect(screen.getByTestId("location-card-title")).toHaveTextContent(
      "Patio Los Arcos",
    );
  });
});
