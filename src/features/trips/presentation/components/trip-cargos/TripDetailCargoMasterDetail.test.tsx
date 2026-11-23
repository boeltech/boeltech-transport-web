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
    expect(screen.getAllByText("#1 Origen").length).toBeGreaterThan(0);
    expect(screen.getAllByText("#2 Destino").length).toBeGreaterThan(0);
  });

  it("aliases pending as Planeada in draft/scheduled (Q9e)", () => {
    render(
      <TripDetailCargoMasterDetail
        cargos={[cargo]}
        orderedStops={orderedStops}
        tripStatus="draft"
        canEditStructural
        canDeleteCargo
        onAddCargo={vi.fn()}
        onEditCargo={vi.fn()}
        onRemoveCargo={vi.fn()}
      />,
    );

    // Badge de estado de carga (Q9e) — no el «Pendiente» de hito recogida/entrega.
    expect(screen.getAllByText(copy.state.planned).length).toBeGreaterThan(0);
    const statusBadges = screen.getAllByTitle(copy.hint.statusInTracking);
    expect(
      statusBadges.some((el) => el.textContent === copy.state.planned),
    ).toBe(true);
    expect(
      statusBadges.some((el) => el.textContent === "Pendiente"),
    ).toBe(false);
  });

  it("shows Q6 Atención fiscal hint only when appendMarksFiscalAttention", () => {
    const { rerender } = render(
      <TripDetailCargoMasterDetail
        cargos={[cargo]}
        orderedStops={orderedStops}
        canEditStructural={false}
        canAppendCargo
        showAppendOnlyBanner
        appendMarksFiscalAttention
        onAddCargo={vi.fn()}
        onEditCargo={vi.fn()}
        onRemoveCargo={vi.fn()}
      />,
    );

    expect(screen.getByText(copy.hint.appendOnlyBanner)).toBeInTheDocument();
    expect(
      screen.getByText(copy.hint.appendFiscalAttentionHint),
    ).toBeInTheDocument();

    rerender(
      <TripDetailCargoMasterDetail
        cargos={[cargo]}
        orderedStops={orderedStops}
        canEditStructural={false}
        canAppendCargo
        showAppendOnlyBanner
        appendMarksFiscalAttention={false}
        onAddCargo={vi.fn()}
        onEditCargo={vi.fn()}
        onRemoveCargo={vi.fn()}
      />,
    );

    expect(
      screen.queryByText(copy.hint.appendFiscalAttentionHint),
    ).not.toBeInTheDocument();
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

  it("with ≥2 unload and no delivery offers Indicar entrega (F5d-c)", () => {
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
      screen.getByText(copy.alert.noDeliveryTitleMultiUnload),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/1 carga no tiene entrega planificada/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(copy.alert.noDeliveryBodySingleUnload(1)),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.action.indicateDelivery }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.action.fixFirstCargo }),
    ).not.toBeInTheDocument();
  });
});

describe("TripDetailCargoMasterDetail — under-allocated deliveries (F7)", () => {
  const partialCargo = {
    ...cargo,
    weight: 21_000,
    weightInKg: 21_000,
    units: 21,
    movements: [
      ...cargo.movements!,
      {
        id: "mov-2",
        stopId: "st-2",
        stopIndex: 1,
        movementType: "delivery",
        weight: 10_000,
        units: 10,
        completedAt: null,
        notes: null,
      },
    ],
  } as TripCargo;

  it("shows soft alert with remainder and Corregir carga (draft/scheduled F7)", () => {
    const onEditCargo = vi.fn();
    render(
      <TripDetailCargoMasterDetail
        cargos={[partialCargo]}
        orderedStops={orderedStops}
        canEditStructural
        canDeleteCargo
        onAddCargo={vi.fn()}
        onEditCargo={onEditCargo}
        onRemoveCargo={vi.fn()}
      />,
    );

    expect(
      screen.getByText(copy.alert.underAllocatedTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText((content) =>
        content.includes("Puedes guardar y completar después"),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.action.fixFirstCargo }),
    ).toBeInTheDocument();
  });

  it("F7c mid-trip: under-allocation visible without Corregir; mid-trip body", () => {
    render(
      <TripDetailCargoMasterDetail
        cargos={[partialCargo]}
        orderedStops={orderedStops}
        canEditStructural={false}
        canAppendCargo
        showAppendOnlyBanner
        canDeleteCargo={false}
        onAddCargo={vi.fn()}
        onEditCargo={vi.fn()}
        onRemoveCargo={vi.fn()}
      />,
    );

    expect(
      screen.getByText(copy.alert.underAllocatedTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText((content) =>
        content.includes(
          "En ruta no se puede corregir la carga existente; solo puedes agregar cargas nuevas",
        ),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText((content) =>
        content.includes("Faltan 11,000 kg / 11 uds"),
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText((content) =>
        content.includes("Puedes guardar y completar después"),
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.action.fixFirstCargo }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(copy.hint.appendOnlyBanner)).toBeInTheDocument();
  });

  it("does not show under-allocation alert when there are 0 deliveries (F5a)", () => {
    render(
      <TripDetailCargoMasterDetail
        cargos={[cargo]}
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
      screen.queryByText(copy.alert.underAllocatedTitle),
    ).not.toBeInTheDocument();
  });
});
