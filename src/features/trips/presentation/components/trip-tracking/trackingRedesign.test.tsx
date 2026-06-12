import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  CargoStatus,
  StopType,
  TripStatus,
  type TripCargo,
  type TripStop,
} from "@features/trips/domain";

import { CargoActionInline } from "./CargoActionInline";
import { StopActionInline } from "./StopActionInline";
import {
  CARGO_TRANSITION_COPY,
  STOP_TRANSITION_COPY,
} from "./transitionCopy";
import { resolveTrackingPrimaryAction } from "./trackingNextAction";
import { TripTrackingStopsCargosMasterDetail } from "./TripTrackingStopsCargosMasterDetail";

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useMediaQuery: vi.fn(() => false),
  };
});

const STOP_DEFAULTS = {
  tenantId: "tenant-1",
  tripId: "trip-1",
  addressId: null,
  clientId: null,
  clientAddressId: null,
  address: "",
  city: "",
  state: null,
  postalCode: null,
  latitude: null,
  longitude: null,
  locationName: null,
  contactName: null,
  contactPhone: null,
  estimatedArrival: null,
  actualArrival: null,
  estimatedDeparture: null,
  actualDeparture: null,
  status: "pending" as const,
  notes: null,
  idUbicacion: null,
  rfcRemitenteDestinatario: null,
  distanceFromPreviousKm: null,
  distanceSource: null,
} as const;

function stop(
  overrides: Partial<TripStop> & Pick<TripStop, "id" | "sequenceOrder" | "stopType">,
): TripStop {
  return { ...STOP_DEFAULTS, ...overrides } as TripStop;
}

function cargo(
  overrides: Partial<TripCargo> & Pick<TripCargo, "id">,
): TripCargo {
  const { id, ...rest } = overrides;
  return {
    id,
    tenantId: "tenant-1",
    tripId: "trip-1",
    clientId: "client-1",
    description: "Zapatos",
    productType: null,
    weight: 120,
    volume: null,
    units: 10,
    declaredValue: null,
    aseguraCarga: null,
    polizaCarga: null,
    rate: 0,
    currency: "MXN",
    movements: [],
    status: CargoStatus.PENDING,
    pickedUpAt: null,
    deliveredAt: null,
    notes: null,
    specialInstructions: null,
    satProductCode: null,
    satProductDescription: null,
    satUnitCode: null,
    satUnitName: null,
    weightInKg: null,
    dimensions: null,
    hazardousMaterial: null,
    requiresHazmat: false,
    hazardousMaterialCode: null,
    packagingType: null,
    packagingDescription: null,
    ...rest,
  } as TripCargo;
}

const defaultProps = {
  getCargoStatusVariant: () => "outline" as const,
  onCargoAction: vi.fn(),
};

describe("trackingNextAction", () => {
  const origin = stop({
    id: "s1",
    sequenceOrder: 1,
    stopType: [StopType.ORIGIN],
  });
  const waypoint = stop({
    id: "s2",
    sequenceOrder: 2,
    stopType: [StopType.WAYPOINT],
  });
  const destination = stop({
    id: "s3",
    sequenceOrder: 3,
    stopType: [StopType.DESTINATION],
  });

  it("prioriza dispatch cuando está programado", () => {
    const action = resolveTrackingPrimaryAction(TripStatus.SCHEDULED, [origin, waypoint]);
    expect(action.kind).toBe("dispatch");
    expect(action.transitionText).toBe(STOP_TRANSITION_COPY.dispatch);
  });

  it("prioriza llegada a origen tras dispatch", () => {
    const action = resolveTrackingPrimaryAction(TripStatus.IN_PROGRESS, [
      origin,
      waypoint,
      destination,
    ]);
    expect(action.kind).toBe("arrive");
    expect(action.stop?.id).toBe("s1");
    expect(action.transitionText).toBe(STOP_TRANSITION_COPY.arrive);
  });

  it("prioriza salida de origen tras llegada en origen", () => {
    const action = resolveTrackingPrimaryAction(TripStatus.IN_PROGRESS, [
      {
        ...origin,
        actualArrival: new Date("2026-01-01T09:00:00Z"),
        status: "in_progress",
      },
      waypoint,
      destination,
    ]);
    expect(action.kind).toBe("depart_origin");
    expect(action.transitionText).toBe(STOP_TRANSITION_COPY.departOrigin);
  });

  it("prioriza llegada a escala tras salida de origen", () => {
    const action = resolveTrackingPrimaryAction(TripStatus.IN_PROGRESS, [
      {
        ...origin,
        actualArrival: new Date("2026-01-01T09:00:00Z"),
        actualDeparture: new Date("2026-01-01T10:00:00Z"),
        status: "completed",
      },
      waypoint,
      destination,
    ]);
    expect(action.kind).toBe("arrive");
    expect(action.stop?.id).toBe("s2");
  });

  it("prioriza cierre en destino cuando el itinerario está completo salvo trip_arrived", () => {
    const action = resolveTrackingPrimaryAction(TripStatus.IN_PROGRESS, [
      {
        ...origin,
        actualArrival: new Date("2026-01-01T09:00:00Z"),
        actualDeparture: new Date("2026-01-01T10:00:00Z"),
        status: "completed",
      },
      {
        ...waypoint,
        actualArrival: new Date("2026-01-01T11:00:00Z"),
        actualDeparture: new Date("2026-01-01T11:30:00Z"),
        status: "completed",
      },
      {
        ...destination,
        actualArrival: new Date("2026-01-01T12:00:00Z"),
        status: "completed",
      },
    ]);
    expect(action.kind).toBe("close");
    expect(action.transitionText).toBe(STOP_TRANSITION_COPY.close);
  });

  it("muestra cargo_blocked cuando origen tiene cargas pendientes tras llegada", () => {
    const originArrived = {
      ...origin,
      actualArrival: new Date("2026-01-01T09:00:00Z"),
      status: "in_progress" as const,
    };
    const pendingCargo = cargo({
      id: "c1",
      movements: [
        {
          id: "m1",
          movementType: "pickup",
          stopId: "s1",
          stopIndex: 1,
          completedAt: null,
          weight: null,
          units: null,
          notes: null,
        },
      ],
    });
    const action = resolveTrackingPrimaryAction(
      TripStatus.IN_PROGRESS,
      [originArrived, waypoint, destination],
      [pendingCargo],
    );
    expect(action.kind).toBe("cargo_blocked");
    expect(action.stop?.id).toBe("s1");
  });
});

describe("StopActionInline", () => {
  it("renderiza label, transición y aria-describedby", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <StopActionInline
        label="Registrar salida — Parada 2 · Escala"
        action="depart"
        onClick={onClick}
      />,
    );

    expect(screen.getByText(STOP_TRANSITION_COPY.depart)).toBeInTheDocument();
    const button = screen.getByRole("button", {
      name: /Registrar salida/,
    });
    expect(button).toHaveAttribute(
      "aria-describedby",
      expect.stringMatching(/./),
    );

    await user.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe("CargoActionInline", () => {
  it("renderiza acción de entrega con transición explícita", () => {
    render(
      <CargoActionInline action="deliver" onClick={() => undefined} />,
    );

    expect(screen.getByText(CARGO_TRANSITION_COPY.deliver)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Entregar/i })).toBeInTheDocument();
  });
});

describe("TripTrackingStopsCargosMasterDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const origin = stop({
    id: "s1",
    sequenceOrder: 1,
    stopType: [StopType.ORIGIN],
    locationName: "Bodega QRO",
  });
  const waypoint = stop({
    id: "s2",
    sequenceOrder: 2,
    stopType: [StopType.WAYPOINT],
    locationName: "Escala MTY",
  });
  const destination = stop({
    id: "s3",
    sequenceOrder: 3,
    stopType: [StopType.DESTINATION],
    locationName: "Cliente CDMX",
  });

  it("renderiza filas de paradas con contador de cargas", () => {
    const cargos = [
      cargo({
        id: "c1",
        movements: [
          {
            id: "m1",
            movementType: "pickup",
            stopId: "s1",
            stopIndex: 1,
            completedAt: null,
            weight: null,
            units: null,
            notes: null,
          },
        ],
      }),
    ];

    render(
      <TripTrackingStopsCargosMasterDetail
        {...defaultProps}
        stops={[origin, waypoint, destination]}
        tripStatus={TripStatus.IN_PROGRESS}
        cargos={cargos}
      />,
    );

    expect(screen.getByText("Paradas y cargas")).toBeInTheDocument();
    expect(screen.getAllByText("1 carga").length).toBeGreaterThan(0);
    expect(screen.getByText("Zapatos")).toBeInTheDocument();
  });

  it("preselecciona la parada objetivo y muestra acción de llegada", () => {
    render(
      <TripTrackingStopsCargosMasterDetail
        {...defaultProps}
        stops={[origin, waypoint, destination]}
        tripStatus={TripStatus.IN_PROGRESS}
        cargos={[]}
        onArrive={vi.fn()}
      />,
    );

    expect(screen.getAllByText("Objetivo actual").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /Registrar llegada/i }),
    ).toBeInTheDocument();
  });

  it("al seleccionar otra parada muestra sus cargas vinculadas", async () => {
    const user = userEvent.setup();
    const cargos = [
      cargo({
        id: "c1",
        description: "Alimento",
        movements: [
          {
            id: "m2",
            movementType: "pickup",
            stopId: "s2",
            stopIndex: 2,
            completedAt: null,
            weight: null,
            units: null,
            notes: null,
          },
        ],
      }),
    ];

    render(
      <TripTrackingStopsCargosMasterDetail
        {...defaultProps}
        stops={[
          {
            ...origin,
            actualArrival: new Date("2026-01-01T09:00:00Z"),
            actualDeparture: new Date("2026-01-01T10:00:00Z"),
            status: "completed",
          },
          waypoint,
          destination,
        ]}
        tripStatus={TripStatus.IN_PROGRESS}
        cargos={cargos}
      />,
    );

    const masterButtons = screen.getAllByRole("button");
    const originRow = masterButtons.find((button) =>
      /Parada 1/i.test(button.textContent ?? ""),
    );
    const escalaRow = masterButtons.find((button) =>
      /Parada 2/i.test(button.textContent ?? ""),
    );
    expect(originRow).toBeDefined();
    expect(escalaRow).toBeDefined();

    await user.click(originRow!);
    expect(screen.queryByText("Alimento")).not.toBeInTheDocument();

    await user.click(escalaRow!);
    expect(screen.getByText("Alimento")).toBeInTheDocument();
  });

  it("deshabilita acciones de carga antes de registrar llegada en la parada", () => {
    const cargos = [
      cargo({
        id: "c1",
        movements: [
          {
            id: "m1",
            movementType: "pickup",
            stopId: "s1",
            stopIndex: 1,
            completedAt: null,
            weight: null,
            units: null,
            notes: null,
          },
        ],
      }),
    ];

    render(
      <TripTrackingStopsCargosMasterDetail
        {...defaultProps}
        stops={[origin, waypoint, destination]}
        tripStatus={TripStatus.IN_PROGRESS}
        cargos={cargos}
      />,
    );

    expect(screen.getByRole("button", { name: /Recoger/i })).toBeDisabled();
  });

  it("dispara onCargoAction al usar CargoActionInline con parada activa", async () => {
    const user = userEvent.setup();
    const onCargoAction = vi.fn();
    const cargos = [
      cargo({
        id: "c1",
        movements: [
          {
            id: "m1",
            movementType: "pickup",
            stopId: "s1",
            stopIndex: 1,
            completedAt: null,
            weight: null,
            units: null,
            notes: null,
          },
        ],
      }),
    ];

    render(
      <TripTrackingStopsCargosMasterDetail
        {...defaultProps}
        onCargoAction={onCargoAction}
        stops={[
          {
            ...origin,
            actualArrival: new Date("2026-01-01T09:00:00Z"),
            status: "in_progress",
          },
          waypoint,
          destination,
        ]}
        tripStatus={TripStatus.IN_PROGRESS}
        cargos={cargos}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Recoger/i }));
    expect(onCargoAction).toHaveBeenCalledWith("c1", "pickup");
  });

  it("dispara onDepartOrigin desde la parada objetivo", async () => {
    const user = userEvent.setup();
    const onDepartOrigin = vi.fn();

    render(
      <TripTrackingStopsCargosMasterDetail
        {...defaultProps}
        stops={[
          {
            ...origin,
            actualArrival: new Date("2026-01-01T09:00:00Z"),
            status: "in_progress",
          },
          waypoint,
          destination,
        ]}
        tripStatus={TripStatus.IN_PROGRESS}
        cargos={[]}
        onDepartOrigin={onDepartOrigin}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /Salida de origen/i }),
    );
    expect(onDepartOrigin).toHaveBeenCalledOnce();
  });
});
