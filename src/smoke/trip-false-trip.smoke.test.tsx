/**
 * Smoke ADR-0079 — viaje en falso (ingreso sin Carta Porte).
 * Mock de API; no requiere backend ni PAC.
 *
 * Flujo UI: outcome falso → oculta CTA de flete+CP → «Facturar viaje en falso»
 * con `?scope=false_trip` → editor solo servicios → payload `billing_scope=false_trip`.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TripStatus, type Trip } from "@features/trips/domain";
import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";
import { TripInvoiceActions } from "@features/trips/presentation/components/TripInvoiceActions";
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

const TRIP_ID = "550e8400-e29b-41d4-a716-446655440000";

function makeFalseTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: TRIP_ID,
    status: TripStatus.COMPLETED,
    tripCode: "VJ-FALSO-001",
    operationalOutcome: "false_trip",
    invoicing: tripInvoicingFixture({
      canGenerateInvoice: false,
      canGenerateAccessoryInvoice: false,
      canGenerateFalseTripInvoice: true,
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

function FalseTripEditorHarness() {
  const form = useForm<InvoiceFormValues>({
    defaultValues: {
      ...defaultInvoiceFormValues(),
      billing_scope: "false_trip",
      concepts: [],
    },
  });

  return (
    <FormProvider {...form}>
      <InvoiceConceptsEditor
        control={form.control}
        setValue={form.setValue}
        taxRate={0.16}
        billingScope="false_trip"
      />
    </FormProvider>
  );
}

describe("smoke ADR-0079 trip false-trip", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it("oculta CTA de flete+CP y navega a create con scope=false_trip", async () => {
    const user = userEvent.setup();
    render(
      <TestProviders>
        <TripInvoiceActions trip={makeFalseTrip()} presentation="inline" />
      </TestProviders>,
    );

    const cta = screen.getByRole("button", {
      name: tripFiscalCopy.invoiceActions.generateFalseTrip,
    });
    expect(cta).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: tripFiscalCopy.invoiceActions.generateAccessory,
      }),
    ).not.toBeInTheDocument();

    await user.click(cta);
    expect(mockNavigate).toHaveBeenCalledWith(
      `/invoices/new?trip_id=${TRIP_ID}&scope=false_trip`,
    );
  });

  it("no muestra CTA de flete+CP aunque canGenerateInvoice venga true", () => {
    render(
      <TestProviders>
        <TripInvoiceActions
          trip={makeFalseTrip({
            invoicing: tripInvoicingFixture({
              canGenerateInvoice: true,
              canGenerateAccessoryInvoice: true,
              canGenerateFalseTripInvoice: false,
            }),
          })}
          presentation="inline"
        />
      </TestProviders>,
    );

    expect(
      screen.queryByRole("button", {
        name: tripFiscalCopy.invoiceActions.generatePrimary,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: tripFiscalCopy.invoiceActions.generateAccessory,
      }),
    ).not.toBeInTheDocument();
  });

  it("editor false_trip vacío: sin flete y CTA agregar concepto", () => {
    render(
      <TestProviders>
        <FalseTripEditorHarness />
      </TestProviders>,
    );

    expect(screen.getByText(invoicingCopy.concepts.emptyTitle)).toBeInTheDocument();
    expect(
      screen.getByText(invoicingCopy.concepts.table.emptyDescriptionFalseTrip),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: invoicingCopy.concepts.addConcept }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Flete")).not.toBeInTheDocument();
  });

  it("badge Viaje en falso y payload create con billing_scope false_trip", () => {
    render(
      <InvoiceBillingScopeBadge
        scope={resolveInvoiceBillingScope([{ billingScope: "false_trip" }])}
      />,
    );
    expect(screen.getByText(invoicingCopy.billingScope.falseTrip)).toBeInTheDocument();

    const payload: CreateInvoicePayload = {
      tripIds: [TRIP_ID],
      billingScope: "false_trip",
      receiverRfc: "XAXX010101000",
      receiverName: "Cliente Smoke",
      cfdiUsage: "G03",
      receiverTaxRegime: "601",
      receiverPostalCode: "64000",
      paymentForm: "99",
      paymentMethod: "PPD",
      currency: "MXN",
      subtotal: 12500,
      totalTax: 2000,
      total: 14500,
      concepts: [
        {
          conceptType: "service",
          claveProdServ: "78101800",
          claveUnidad: "E48",
          unidad: "Servicio",
          description: "Servicio de desplazamiento — viaje en falso",
          quantity: 1,
          unitPrice: 12500,
          amount: 12500,
          objectImp: "02",
          ivaRate: 0.16,
          retainedIvaRate: 0,
        },
      ],
    };

    expect(toApiCreateInvoice(payload)).toMatchObject({
      trip_ids: [TRIP_ID],
      billing_scope: "false_trip",
    });
    expect(toApiCreateInvoice(payload).concepts?.[0]).toMatchObject({
      concept_type: "service",
    });
    expect(toApiCreateInvoice(payload).concepts?.some((line) => line.concept_type === "flete")).toBe(
      false,
    );
  });

  it("parseCreateInvoicePayload inyecta billing_scope false_trip", () => {
    const values = {
      ...defaultInvoiceFormValues(),
      receiver_rfc: "XAXX010101000",
      receiver_name: "Cliente Smoke",
      receiver_tax_regime: "601",
      receiver_postal_code: "64000",
      subtotal: 12500,
      total_tax: 2000,
      total: 14500,
      concepts: [
        {
          ...defaultFleteConceptFormLine(12500),
          concept_type: "service" as const,
          description: "Servicio de desplazamiento — viaje en falso",
        },
      ],
    };

    const parsed = parseCreateInvoicePayload(values, TRIP_ID, "false_trip");
    expect(parsed.billing_scope).toBe("false_trip");
    expect(parsed.trip_ids).toEqual([TRIP_ID]);
    expect(parsed.concepts?.every((line) => line.concept_type !== "flete")).toBe(true);
  });
});
