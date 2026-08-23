/**
 * Smoke ADR-0081 — prorrateo multi-RFC (trip revenue split).
 * Mock de API; no requiere backend ni PAC.
 *
 * Flujo UI: split activo 60/40 → CTAs por cliente en menú Facturación
 * → `/invoices/new?trip_id=&scope=split_share&leg_id=` (+ attach_carta_porte)
 * → editor con flete → badge Reparto del flete → payload billing_scope=split_share.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  TripStatus,
  type Trip,
  type TripRevenueSplit,
} from "@features/trips/domain";
import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";
import { TripInvoiceActions } from "@features/trips/presentation/components/TripInvoiceActions";
import { TripRevenueSplitSheet } from "@features/trips/presentation/components/TripRevenueSplitSheet";
import { InvoiceConceptsEditor } from "@features/invoicing/presentation/components/InvoiceConceptsEditor";
import {
  InvoiceBillingScopeBadge,
  resolveInvoiceBillingScope,
} from "@features/invoicing/presentation/components/InvoiceBillingScopeBadge";
import { toApiCreateInvoice } from "@features/invoicing/infrastructure/mappers";
import type { CreateInvoicePayload } from "@features/invoicing/domain";
import {
  defaultFleteConceptFormLine,
  defaultInvoiceFormValues,
  parseCreateInvoicePayload,
  type InvoiceFormValues,
} from "@features/invoicing/presentation/validation/invoiceFormSchema";
import { tripFiscalCopy } from "@features/trips/presentation/copy/tripFiscalCopy";
import { invoicingCopy } from "@features/invoicing/presentation/copy/invoicingCopy";

const mockNavigate = vi.fn();

const TRIP_ID = "550e8400-e29b-41d4-a716-446655440081";
const LEG_A = "11111111-1111-4111-8111-111111111111";
const LEG_B = "22222222-2222-4222-8222-222222222222";
const CLIENT_A = "Cliente A SA";
const CLIENT_B = "Cliente B SA";
const RFC_A = "AAA010101AAA";
const RFC_B = "BBB010101BBB";

const mockSplit: TripRevenueSplit = {
  id: "split-smoke-1",
  tripId: TRIP_ID,
  status: "active",
  basisAmount: 10000,
  currency: "MXN",
  notes: null,
  legs: [
    {
      id: LEG_A,
      clientId: "client-a",
      clientLegalName: "Cliente A SA",
      clientRfc: RFC_A,
      sharePercent: 60,
      sortOrder: 0,
      suggestedCartaPorte: true,
      invoiceId: null,
    },
    {
      id: LEG_B,
      clientId: "client-b",
      clientLegalName: "Cliente B SA",
      clientRfc: RFC_B,
      sharePercent: 40,
      sortOrder: 1,
      suggestedCartaPorte: false,
      invoiceId: null,
    },
  ],
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
};

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
    isLoading: false,
    isAuthenticated: true,
    role: "admin",
  }),
}));

vi.mock("@features/settings/application/hooks/useBillingServiceConcepts", () => ({
  useBillingServiceConcepts: () => ({ data: [], isLoading: false }),
}));

vi.mock("@features/trips/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/trips/application")>();
  return {
    ...actual,
    useTripRevenueSplit: () => ({
      data: mockSplit,
      isLoading: false,
      isError: false,
      error: null,
    }),
    useUpsertTripRevenueSplit: () => ({
      mutateAsync: vi.fn(),
      isPending: false,
    }),
    useDeleteTripRevenueSplit: () => ({
      mutateAsync: vi.fn(),
      isPending: false,
    }),
  };
});

vi.mock("@features/clients/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/clients/application")>();
  return {
    ...actual,
    useActiveClients: () => ({ data: [], isLoading: false }),
  };
});

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
  };
});

function expectedSplitHref(legId: string, attachCartaPorte: boolean): string {
  const params = new URLSearchParams({
    trip_id: TRIP_ID,
    scope: "split_share",
    leg_id: legId,
  });
  if (attachCartaPorte) params.set("attach_carta_porte", "1");
  return `/invoices/new?${params.toString()}`;
}

function makeSplitTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: TRIP_ID,
    status: TripStatus.COMPLETED,
    tripCode: "VJ-SPLIT-001",
    clientId: "client-a",
    costs: { baseRate: 10000 },
    invoicing: tripInvoicingFixture({
      canGenerateInvoice: false,
      canGenerateAccessoryInvoice: false,
      canGenerateFalseTripInvoice: false,
      hasActiveSplit: true,
      splitLegsInvoiced: 0,
      splitLegsTotal: 2,
      canGenerateSplitShareInvoice: true,
      cartaPorteAttached: false,
    }),
    ...overrides,
  } as Trip;
}

function TestProviders({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

function SplitShareEditorHarness() {
  const form = useForm<InvoiceFormValues>({
    defaultValues: {
      ...defaultInvoiceFormValues(),
      billing_scope: "split_share",
      concepts: [defaultFleteConceptFormLine(6000)],
    },
  });

  return (
    <FormProvider {...form}>
      <InvoiceConceptsEditor
        control={form.control}
        setValue={form.setValue}
        taxRate={0.16}
        billingScope="split_share"
      />
    </FormProvider>
  );
}

describe("smoke ADR-0081 trip revenue split", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it("headerMenu: CTAs 60/40 navegan a create con scope=split_share&leg_id (+ CP en cliente A)", async () => {
    const user = userEvent.setup();
    render(
      <TestProviders>
        <TripInvoiceActions trip={makeSplitTrip()} presentation="headerMenu" />
      </TestProviders>,
    );

    await user.click(
      screen.getByRole("button", {
        name: new RegExp(tripFiscalCopy.invoiceActions.menuLabel, "i"),
      }),
    );

    const ctaA = await screen.findByRole("menuitem", {
      name: tripFiscalCopy.invoiceActions.generateSplitShare(CLIENT_A),
    });
    const ctaB = screen.getByRole("menuitem", {
      name: tripFiscalCopy.invoiceActions.generateSplitShare(CLIENT_B),
    });
    expect(ctaA).toBeInTheDocument();
    expect(ctaB).toBeInTheDocument();

    expect(
      screen.queryByRole("menuitem", {
        name: tripFiscalCopy.invoiceActions.generatePrimary,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", {
        name: tripFiscalCopy.invoiceActions.generateFalseTrip,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", {
        name: tripFiscalCopy.invoiceActions.generateAccessory,
      }),
    ).not.toBeInTheDocument();

    await user.click(ctaA);
    expect(mockNavigate).toHaveBeenCalledWith(expectedSplitHref(LEG_A, true));

    mockNavigate.mockReset();
    await user.click(
      screen.getByRole("button", {
        name: new RegExp(tripFiscalCopy.invoiceActions.menuLabel, "i"),
      }),
    );
    await user.click(
      await screen.findByRole("menuitem", {
        name: tripFiscalCopy.invoiceActions.generateSplitShare(CLIENT_B),
      }),
    );
    expect(mockNavigate).toHaveBeenCalledWith(expectedSplitHref(LEG_B, false));
  });

  it("sheet reparto: lista clientes read-only sin CTAs de facturar en banda", () => {
    render(
      <TestProviders>
        <TripRevenueSplitSheet
          trip={makeSplitTrip()}
          open
          onOpenChange={() => undefined}
        />
      </TestProviders>,
    );

    expect(screen.getByText(/60%/)).toBeInTheDocument();
    expect(screen.getByText(/40%/)).toBeInTheDocument();
    expect(screen.getByText(CLIENT_A)).toBeInTheDocument();
    expect(screen.getByText(CLIENT_B)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", {
        name: tripFiscalCopy.invoiceActions.generateSplitShare(CLIENT_A),
      }),
    ).not.toBeInTheDocument();
  });

  it("editor split_share: permite flete (≠ accesoria / viaje en falso)", () => {
    render(
      <TestProviders>
        <SplitShareEditorHarness />
      </TestProviders>,
    );

    expect(screen.getAllByText("Flete").length).toBeGreaterThan(0);
    expect(
      screen.queryByText(invoicingCopy.concepts.emptyTitle),
    ).not.toBeInTheDocument();
  });

  it("badge Flete prorrateado distinto de Servicios adicionales y Viaje en falso; payload split_share + leg + CP", () => {
    const { rerender } = render(
      <InvoiceBillingScopeBadge
        scope={resolveInvoiceBillingScope([{ billingScope: "split_share" }])}
      />,
    );
    expect(
      screen.getByText(invoicingCopy.billingScope.splitShare),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(invoicingCopy.billingScope.accessory),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(invoicingCopy.billingScope.falseTrip),
    ).not.toBeInTheDocument();

    rerender(
      <InvoiceBillingScopeBadge
        scope={resolveInvoiceBillingScope([{ billingScope: "accessory" }])}
      />,
    );
    expect(
      screen.getByText(invoicingCopy.billingScope.accessory),
    ).toBeInTheDocument();

    rerender(
      <InvoiceBillingScopeBadge
        scope={resolveInvoiceBillingScope([{ billingScope: "false_trip" }])}
      />,
    );
    expect(
      screen.getByText(invoicingCopy.billingScope.falseTrip),
    ).toBeInTheDocument();

    const payloadWithCp: CreateInvoicePayload = {
      tripIds: [TRIP_ID],
      billingScope: "split_share",
      splitLegId: LEG_A,
      attachCartaPorte: true,
      receiverRfc: RFC_A,
      receiverName: "Cliente A SA",
      cfdiUsage: "G03",
      receiverTaxRegime: "601",
      receiverPostalCode: "64000",
      paymentForm: "99",
      paymentMethod: "PPD",
      currency: "MXN",
      subtotal: 6000,
      totalTax: 960,
      total: 6960,
      concepts: [
        {
          conceptType: "flete",
          claveProdServ: "78101800",
          claveUnidad: "E48",
          unidad: "Servicio",
          description: "Flete porción A",
          quantity: 1,
          unitPrice: 6000,
          amount: 6000,
          objectImp: "02",
          ivaRate: 0.16,
          retainedIvaRate: 0,
        },
      ],
    };

    expect(toApiCreateInvoice(payloadWithCp)).toMatchObject({
      trip_ids: [TRIP_ID],
      billing_scope: "split_share",
      split_leg_id: LEG_A,
      attach_carta_porte: true,
    });
    expect(toApiCreateInvoice(payloadWithCp).concepts?.[0]).toMatchObject({
      concept_type: "flete",
    });

    const payloadNoCp: CreateInvoicePayload = {
      ...payloadWithCp,
      splitLegId: LEG_B,
      attachCartaPorte: false,
      receiverRfc: RFC_B,
      receiverName: "Cliente B SA",
      subtotal: 4000,
      totalTax: 640,
      total: 4640,
      concepts: [
        {
          ...payloadWithCp.concepts![0],
          unitPrice: 4000,
          amount: 4000,
          description: "Flete porción B",
        },
      ],
    };
    expect(toApiCreateInvoice(payloadNoCp)).toMatchObject({
      billing_scope: "split_share",
      split_leg_id: LEG_B,
      attach_carta_porte: false,
    });
  });

  it("parseCreateInvoicePayload inyecta billing_scope split_share + split_leg_id + attach", () => {
    const values = {
      ...defaultInvoiceFormValues(),
      receiver_rfc: RFC_A,
      receiver_name: "Cliente A SA",
      receiver_tax_regime: "601",
      receiver_postal_code: "64000",
      subtotal: 6000,
      total_tax: 960,
      total: 6960,
      concepts: [defaultFleteConceptFormLine(6000)],
    };

    const parsed = parseCreateInvoicePayload(values, TRIP_ID, "split_share", {
      splitLegId: LEG_A,
      attachCartaPorte: true,
    });
    expect(parsed.billing_scope).toBe("split_share");
    expect(parsed.trip_ids).toEqual([TRIP_ID]);
    expect(parsed.split_leg_id).toBe(LEG_A);
    expect(parsed.attach_carta_porte).toBe(true);
    expect(parsed.concepts?.some((line) => line.concept_type === "flete")).toBe(
      true,
    );
  });

  it("con split activo no ofrece CTA primary/false_trip; accessory solo si flag", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <TestProviders>
        <TripInvoiceActions trip={makeSplitTrip()} presentation="headerMenu" />
      </TestProviders>,
    );

    await user.click(
      screen.getByRole("button", {
        name: new RegExp(tripFiscalCopy.invoiceActions.menuLabel, "i"),
      }),
    );
    expect(
      screen.queryByRole("menuitem", {
        name: tripFiscalCopy.invoiceActions.generatePrimary,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", {
        name: tripFiscalCopy.invoiceActions.generateFalseTrip,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", {
        name: tripFiscalCopy.invoiceActions.generateAccessory,
      }),
    ).not.toBeInTheDocument();

    await user.keyboard("{Escape}");

    rerender(
      <TestProviders>
        <TripInvoiceActions
          trip={makeSplitTrip({
            invoicing: tripInvoicingFixture({
              canGenerateInvoice: false,
              canGenerateAccessoryInvoice: true,
              canGenerateFalseTripInvoice: false,
              hasActiveSplit: true,
              splitLegsInvoiced: 0,
              splitLegsTotal: 2,
              canGenerateSplitShareInvoice: true,
              cartaPorteAttached: false,
            }),
          })}
          presentation="headerMenu"
        />
      </TestProviders>,
    );

    const menuTriggers = screen.getAllByRole("button", {
      name: new RegExp(tripFiscalCopy.invoiceActions.menuLabel, "i"),
    });
    await user.click(menuTriggers[0]!);
    expect(
      await screen.findByRole("menuitem", {
        name: tripFiscalCopy.invoiceActions.generateAccessory,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", {
        name: tripFiscalCopy.invoiceActions.generateSplitShare(CLIENT_A),
      }),
    ).toBeInTheDocument();
  });
});
