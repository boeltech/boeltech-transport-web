import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  TripStatus,
  type Trip,
  type TripRevenueSplit,
} from "@features/trips/domain";
import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";
import { tripFiscalCopy } from "../copy/tripFiscalCopy";
import { TripRevenueSplitSheet } from "./TripRevenueSplitSheet";

const RESERVA_CLIENT_ID = "client-reserva-1";
const RESERVA_CLIENT_NAME = "Cliente Reserva SA";
const OTHER_CLIENT_ID = "client-other";
const OTHER_CLIENT_NAME = "Otro Cliente";

const mockUpsert = vi.fn();

let mockSplitState: {
  data: TripRevenueSplit | null | undefined;
  isLoading: boolean;
  isFetched: boolean;
} = {
  data: null,
  isLoading: false,
  isFetched: true,
};

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
    isLoading: false,
    isAuthenticated: true,
    role: "admin",
  }),
}));

vi.mock("@features/clients/application", () => ({
  useActiveClients: () => ({
    data: [
      {
        id: RESERVA_CLIENT_ID,
        legalName: RESERVA_CLIENT_NAME,
        tradeName: null,
      },
      {
        id: OTHER_CLIENT_ID,
        legalName: OTHER_CLIENT_NAME,
        tradeName: null,
      },
    ],
    isLoading: false,
  }),
}));

vi.mock("@features/trips/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/trips/application")>();
  return {
    ...actual,
    useTripRevenueSplit: () => ({
      data: mockSplitState.data,
      isLoading: mockSplitState.isLoading,
      isFetched: mockSplitState.isFetched,
    }),
    useUpsertTripRevenueSplit: () => ({
      mutateAsync: mockUpsert,
      isPending: false,
    }),
    useDeleteTripRevenueSplit: () => ({
      mutateAsync: vi.fn(),
      isPending: false,
    }),
  };
});

function makeTrip(clientId: string): Trip {
  return {
    id: "trip-1",
    status: TripStatus.SCHEDULED,
    tripCode: "VJ-001",
    clientId,
    operationalOutcome: "standard",
    invoicing: tripInvoicingFixture({
      canGenerateInvoice: true,
      blockReason: null,
    }),
    costs: { baseRate: 10000 },
  } as Trip;
}

function makeDraftSplit(
  overrides: Partial<TripRevenueSplit> = {},
): TripRevenueSplit {
  return {
    id: "split-draft-1",
    tripId: "trip-1",
    status: "draft",
    basisAmount: 10000,
    currency: "MXN",
    notes: null,
    createdAt: "2026-08-22T10:00:00.000Z",
    updatedAt: "2026-08-22T10:00:00.000Z",
    legs: [
      {
        id: "leg-1",
        clientId: RESERVA_CLIENT_ID,
        clientLegalName: RESERVA_CLIENT_NAME,
        clientRfc: "AAA010101AAA",
        sharePercent: 60,
        sortOrder: 0,
        suggestedCartaPorte: false,
        invoiceId: null,
      },
      {
        id: "leg-2",
        clientId: OTHER_CLIENT_ID,
        clientLegalName: OTHER_CLIENT_NAME,
        clientRfc: "BBB010101BBB",
        sharePercent: 40,
        sortOrder: 1,
        suggestedCartaPorte: false,
        invoiceId: null,
      },
    ],
    ...overrides,
  };
}

function renderSheet(trip: Trip) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <TripRevenueSplitSheet trip={trip} open onOpenChange={vi.fn()} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("TripRevenueSplitSheet — precarga cliente de reserva", () => {
  beforeEach(() => {
    mockUpsert.mockReset();
    mockSplitState = {
      data: null,
      isLoading: false,
      isFetched: true,
    };
  });

  it("precarga cliente principal y porción 1 al abrir editor sin acuerdo previo", async () => {
    const user = userEvent.setup();
    renderSheet(makeTrip(RESERVA_CLIENT_ID));

    await user.click(
      screen.getByRole("button", {
        name: tripFiscalCopy.revenueSplit.startCta,
      }),
    );

    expect(screen.getAllByText(RESERVA_CLIENT_NAME).length).toBeGreaterThan(0);
    expect(
      screen.getByText(tripFiscalCopy.revenueSplit.tripClientLabel),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: tripFiscalCopy.revenueSplit.saveAndConfirm }),
    ).toBeInTheDocument();
  });

  it("sin cliente en reserva mantiene porciones vacías", async () => {
    const user = userEvent.setup();
    renderSheet(makeTrip(""));

    await user.click(
      screen.getByRole("button", {
        name: tripFiscalCopy.revenueSplit.startCta,
      }),
    );

    expect(
      screen.getByText(tripFiscalCopy.revenueSplit.legClientPlaceholder(0)),
    ).toBeInTheDocument();
  });
});

describe("TripRevenueSplitSheet — hidratación y validación (H1/H3)", () => {
  beforeEach(() => {
    mockUpsert.mockReset();
    mockSplitState = {
      data: makeDraftSplit(),
      isLoading: false,
      isFetched: true,
    };
  });

  it("no resetea % editado cuando refetch devuelve mismo id/updatedAt", async () => {
    const user = userEvent.setup();
    const trip = makeTrip(RESERVA_CLIENT_ID);
    const { rerender } = renderSheet(trip);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: tripFiscalCopy.revenueSplit.saveAndConfirm }),
      ).toBeInTheDocument();
    });

    const firstShare = screen.getByLabelText(
      tripFiscalCopy.revenueSplit.shareAria(0),
    );
    await user.clear(firstShare);
    await user.type(firstShare, "55");

    mockSplitState = {
      data: makeDraftSplit(),
      isLoading: false,
      isFetched: true,
    };

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    rerender(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <TripRevenueSplitSheet trip={trip} open onOpenChange={vi.fn()} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByLabelText(tripFiscalCopy.revenueSplit.shareAria(0)),
      ).toHaveValue(55);
    });
  });

  it("bloquea Guardar con clientId duplicado y muestra resumen", async () => {
    const user = userEvent.setup();
    mockSplitState = {
      data: makeDraftSplit({
        legs: [
          {
            id: "leg-1",
            clientId: RESERVA_CLIENT_ID,
            clientLegalName: RESERVA_CLIENT_NAME,
            clientRfc: "AAA010101AAA",
            sharePercent: 60,
            sortOrder: 0,
            suggestedCartaPorte: false,
            invoiceId: null,
          },
          {
            id: "leg-2",
            clientId: RESERVA_CLIENT_ID,
            clientLegalName: RESERVA_CLIENT_NAME,
            clientRfc: "AAA010101AAA",
            sharePercent: 40,
            sortOrder: 1,
            suggestedCartaPorte: false,
            invoiceId: null,
          },
        ],
      }),
      isLoading: false,
      isFetched: true,
    };

    renderSheet(makeTrip(RESERVA_CLIENT_ID));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: tripFiscalCopy.revenueSplit.saveAndConfirm }),
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: tripFiscalCopy.revenueSplit.saveAndConfirm }),
    );

    await waitFor(() => {
      expect(
        screen.getAllByText(tripFiscalCopy.revenueSplit.errors.clientDuplicate)
          .length,
      ).toBeGreaterThan(0);
    });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("muestra error en % y no hace PUT cuando sharePercent es inválido", async () => {
    const user = userEvent.setup();
    mockSplitState = {
      data: makeDraftSplit(),
      isLoading: false,
      isFetched: true,
    };

    renderSheet(makeTrip(RESERVA_CLIENT_ID));

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: tripFiscalCopy.revenueSplit.saveAndConfirm,
        }),
      ).toBeInTheDocument();
    });

    const firstShare = screen.getByLabelText(
      tripFiscalCopy.revenueSplit.shareAria(0),
    );
    await user.clear(firstShare);
    await user.type(firstShare, "0");

    await user.click(
      screen.getByRole("button", {
        name: tripFiscalCopy.revenueSplit.saveAndConfirm,
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByLabelText(tripFiscalCopy.revenueSplit.shareAria(0)),
      ).toHaveAttribute("aria-invalid", "true");
    });
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});

describe("TripRevenueSplitSheet — post-cancel C7", () => {
  beforeEach(() => {
    mockUpsert.mockReset();
  });

  it("viaje cancelled + split active con facturas: checklist, sin Cerrar reparto obligatorio", async () => {
    mockSplitState = {
      data: makeDraftSplit({
        status: "active",
        legs: [
          {
            id: "leg-1",
            clientId: RESERVA_CLIENT_ID,
            clientLegalName: RESERVA_CLIENT_NAME,
            clientRfc: "AAA010101AAA",
            sharePercent: 60,
            sortOrder: 0,
            suggestedCartaPorte: false,
            invoiceId: "inv-1",
          },
          {
            id: "leg-2",
            clientId: OTHER_CLIENT_ID,
            clientLegalName: OTHER_CLIENT_NAME,
            clientRfc: "BBB010101BBB",
            sharePercent: 40,
            sortOrder: 1,
            suggestedCartaPorte: false,
            invoiceId: null,
          },
        ],
      }),
      isLoading: false,
      isFetched: true,
    };

    const trip = {
      ...makeTrip(RESERVA_CLIENT_ID),
      status: TripStatus.CANCELLED,
      invoicing: tripInvoicingFixture({
        canGenerateInvoice: false,
        hasActiveSplit: true,
        blockReason: null,
      }),
    } as Trip;

    renderSheet(trip);

    await waitFor(() => {
      expect(
        screen.getByText(tripFiscalCopy.revenueSplit.postCancelActiveTitle),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText(tripFiscalCopy.revenueSplit.postCancelActiveHint),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        new RegExp(tripFiscalCopy.revenueSplit.statusNoInvoiceDoNotIssue),
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: tripFiscalCopy.revenueSplit.escapeCancelActive,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: tripFiscalCopy.revenueSplit.cancelActive,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: tripFiscalCopy.revenueSplit.startCta,
      }),
    ).not.toBeInTheDocument();
  });

  it("viaje cancelled + split already cancelled: estado cerrado, sin CTA cerrar", async () => {
    mockSplitState = {
      data: makeDraftSplit({ status: "cancelled" }),
      isLoading: false,
      isFetched: true,
    };

    const trip = {
      ...makeTrip(RESERVA_CLIENT_ID),
      status: TripStatus.CANCELLED,
      invoicing: tripInvoicingFixture({
        canGenerateInvoice: false,
        hasActiveSplit: false,
        blockReason: null,
      }),
    } as Trip;

    renderSheet(trip);

    await waitFor(() => {
      expect(
        screen.getByText(tripFiscalCopy.revenueSplit.cancelledReadOnlyTitle),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText(tripFiscalCopy.revenueSplit.cancelledChip),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: tripFiscalCopy.revenueSplit.escapeCancelActive,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: tripFiscalCopy.revenueSplit.cancelActive,
      }),
    ).not.toBeInTheDocument();
  });

  it("viaje cancelled + split active sin facturas: escape hatch Cerrar reparto", async () => {
    mockSplitState = {
      data: makeDraftSplit({ status: "active" }),
      isLoading: false,
      isFetched: true,
    };

    const trip = {
      ...makeTrip(RESERVA_CLIENT_ID),
      status: TripStatus.CANCELLED,
      invoicing: tripInvoicingFixture({
        canGenerateInvoice: false,
        hasActiveSplit: true,
        blockReason: null,
      }),
    } as Trip;

    renderSheet(trip);

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: tripFiscalCopy.revenueSplit.escapeCancelActive,
        }),
      ).toBeInTheDocument();
    });
  });
});
