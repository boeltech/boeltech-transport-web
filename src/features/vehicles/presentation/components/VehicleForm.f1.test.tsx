import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { VehicleForm } from "./VehicleForm";
import { vehiclesCopy } from "../copy/vehiclesCopy";

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({ hasPermission: () => false }),
}));

vi.mock("@features/branches", () => ({
  BranchStatus: { ACTIVE: "active" },
  useBranches: () => ({ data: { data: [] } }),
}));

vi.mock("@features/catalogs", () => ({
  CatalogTypeCode: {
    SAT_TIPO_PERMISO: "sat_tipo_permiso",
    SAT_CONFIG_AUTOTRANSPORTE: "sat_config_autotransporte",
  },
  TipoPermisoSelect: () => <div />,
  ConfigAutotransporteSelect: () => <div />,
  useCatalogOptions: () => ({ data: [], isLoading: false }),
}));

function renderForm(wizardStepIndex = 0) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <VehicleForm
          onSubmit={vi.fn()}
          wizardMode
          wizardStepIndex={wizardStepIndex}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const fc = vehiclesCopy.form;

describe("VehicleForm wizard F1 (D3/D8/D9)", () => {
  it("revisión muestra campos clave antes de crear", () => {
    renderForm(3);

    const reviewHeading = screen.getByRole("heading", {
      name: fc.section.review.title,
    });
    const reviewCard = reviewHeading.closest(".rounded-xl");
    expect(reviewCard).toBeInstanceOf(HTMLElement);
    const scope = within(reviewCard as HTMLElement);

    for (const label of [
      fc.label.reviewUnit,
      fc.label.reviewPlate,
      fc.label.reviewBrandModel,
      fc.label.reviewType,
      fc.label.reviewBranch,
      fc.label.reviewMileage,
      fc.label.reviewRc,
      fc.label.reviewSct,
      fc.label.reviewConfig,
      fc.label.reviewPeso,
    ]) {
      expect(scope.getByText(label)).toBeInTheDocument();
    }
  });

  it("capacidades van en paso docs con hint opcional (sin 5.º paso)", () => {
    renderForm(1);
    expect(screen.getByText(fc.section.capacities.title)).toBeInTheDocument();
    expect(
      screen.getByText(fc.section.capacities.optionalHint),
    ).toBeInTheDocument();
    expect(vehiclesCopy.form.create.wizard.steps).toHaveLength(4);
  });

  it("seguros opcionales (medio ambiente) arrancan colapsados", () => {
    renderForm(2);
    const trigger = screen.getByRole("button", {
      name: new RegExp(fc.section.cartaPorte.optionalInsuranceLabel, "i"),
    });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByPlaceholderText(fc.placeholder.optionalInsurer),
    ).not.toBeInTheDocument();
  });
});
