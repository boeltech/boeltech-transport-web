import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import type { TripCargo, TripStop } from "@features/trips/domain";
import { tripDetailCopy } from "../../copy";
import { TripDetailCargoMasterDetail } from "./TripDetailCargoMasterDetail";

vi.mock("@shared/hooks", () => ({
  useMediaQuery: () => false,
}));

const copy = tripDetailCopy.cargo;

const orderedStops = [
  {
    id: "st-1",
    stopType: ["origin", "pickup"],
    address: "Bodega",
    city: "MTY",
    locationName: "Origen",
    sequenceOrder: 0,
  },
  {
    id: "st-2",
    stopType: ["destination"],
    address: "Cliente",
    city: "GDL",
    locationName: "Destino",
    sequenceOrder: 1,
  },
] as TripStop[];

const cargo = {
  id: "cargo-1",
  description: "Tarimas de acero",
  status: "pending",
  weight: 200,
  weightInKg: 200,
  units: 4,
  hazardousMaterial: false,
  movements: [
    {
      id: "mov-1",
      stopId: "st-1",
      stopIndex: 0,
      movementType: "pickup",
      completedAt: null,
      notes: null,
    },
  ],
} as TripCargo;

describe("TripDetailCargoMasterDetail — delete RBAC (F3)", () => {
  it("shows Eliminar when canDeleteCargo is true", () => {
    render(
      <TripDetailCargoMasterDetail
        cargos={[cargo]}
        orderedStops={orderedStops}
        canEditStructural
        canDeleteCargo
        onAddCargo={vi.fn()}
        onEditCargo={vi.fn()}
        onRemoveCargo={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: copy.action.removeCargo }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.action.editCargo }),
    ).toBeInTheDocument();
  });

  it("hides Eliminar when canEditStructural without canDeleteCargo", () => {
    render(
      <TripDetailCargoMasterDetail
        cargos={[cargo]}
        orderedStops={orderedStops}
        canEditStructural
        canDeleteCargo={false}
        onAddCargo={vi.fn()}
        onEditCargo={vi.fn()}
        onRemoveCargo={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: copy.action.editCargo }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.action.removeCargo }),
    ).not.toBeInTheDocument();
  });

  it("hides Edit and Eliminar when structural edit is off", () => {
    render(
      <TripDetailCargoMasterDetail
        cargos={[cargo]}
        orderedStops={orderedStops}
        canEditStructural={false}
        canDeleteCargo={false}
        onAddCargo={vi.fn()}
        onEditCargo={vi.fn()}
        onRemoveCargo={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: copy.action.editCargo }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.action.removeCargo }),
    ).not.toBeInTheDocument();
  });
});

describe("TripDetailCargoMasterDetail — Falta entrega alert (F4/F5)", () => {
  const twoUnloadStops = [
    ...orderedStops,
    {
      id: "st-3",
      stopType: ["waypoint", "delivery"],
      address: "Escala",
      city: "QRO",
      locationName: "Escala entrega",
      sequenceOrder: 2,
    },
  ] as TripStop[];

  const cargoWithDelivery = {
    ...cargo,
    movements: [
      ...cargo.movements!,
      {
        id: "mov-2",
        stopId: "st-2",
        stopIndex: 1,
        movementType: "delivery",
        completedAt: null,
        notes: null,
      },
    ],
  } as TripCargo;

  it("hides alert and Sin entrega badge when delivery is persisted (1 unload, F5)", () => {
    render(
      <TripDetailCargoMasterDetail
        cargos={[cargoWithDelivery]}
        orderedStops={orderedStops}
        canEditStructural
        canDeleteCargo
        canAppendCargo
        onAddCargo={vi.fn()}
        onEditCargo={vi.fn()}
        onRemoveCargo={vi.fn()}
        onGoToRoute={vi.fn()}
      />,
    );

    expect(
      screen.queryByText(copy.alert.noDeliveryTitle),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(copy.state.missingDelivery, { exact: true }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(copy.format.routeSummary("#1 Origen", "#2 Destino")),
    ).toBeInTheDocument();
  });

  it("with 1 unload residual gap does not offer Corregir carga; offers Agregar carga / Ir a Ruta", () => {
    const onAddCargo = vi.fn();
    const onGoToRoute = vi.fn();
    render(
      <TripDetailCargoMasterDetail
        cargos={[cargo]}
        orderedStops={orderedStops}
        canEditStructural
        canDeleteCargo
        canAppendCargo
        onAddCargo={onAddCargo}
        onEditCargo={vi.fn()}
        onRemoveCargo={vi.fn()}
        onGoToRoute={onGoToRoute}
      />,
    );

    expect(screen.getByText(copy.alert.noDeliveryTitle)).toBeInTheDocument();
    expect(
      screen.getByText((content) =>
        content.includes("sistema la registra en destino"),
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.action.fixFirstCargo }),
    ).not.toBeInTheDocument();
    // Header + CTA del alert (no vender solo Editar).
    expect(
      screen.getAllByRole("button", { name: copy.action.addCargo }).length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      screen.getByRole("button", { name: copy.action.goToRoute }),
    ).toBeInTheDocument();
  });

  it("with ≥2 unload and no delivery offers Corregir carga (F3/F4 intact)", () => {
    render(
      <TripDetailCargoMasterDetail
        cargos={[cargo]}
        orderedStops={twoUnloadStops}
        canEditStructural
        canDeleteCargo
        canAppendCargo
        onAddCargo={vi.fn()}
        onEditCargo={vi.fn()}
        onRemoveCargo={vi.fn()}
        onGoToRoute={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/1 carga no tiene entrega planificada/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(copy.alert.noDeliveryBodySingleUnload(1)),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.action.fixFirstCargo }),
    ).toBeInTheDocument();
  });
});
