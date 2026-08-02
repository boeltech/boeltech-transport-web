/**
 * Smoke ADR-0068 — multifactura por viaje (flete + accesoria).
 * Mock de API; no requiere backend ni PAC.
 *
 * Flujo UI: primaria existente → CTA «Facturar servicios adicionales»
 * → editor accesorio sin flete → payload `billing_scope=accessory`.
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
import { TripFiscalSection } from "@features/trips/presentation/components/TripFiscalSection";
import { InvoiceConceptsEditor } from "@features/invoicing/presentation/components/InvoiceConceptsEditor";
import {
  InvoiceBillingScopeBadge,
  resolveInvoiceBillingScope,
} from "@features/invoicing/presentation/components/InvoiceBillingScopeBadge";
import { toApiCreateInvoice } from "@features/invoicing/infrastructure/mappers";
import type { CreateInvoicePayload } from "@features/invoicing/domain";
import {
  defaultInvoiceFormValues,
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

const TRIP_ID = "trip-smoke-multi-1";
const PRIMARY_INVOICE_ID = "inv-primary-1";
const ACCESSORY_INVOICE_ID = "inv-acc-1";

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: TRIP_ID,
    status: TripStatus.COMPLETED,
    tripCode: "VJ-SMOKE-001",
    invoicing: tripInvoicingFixture({
      hasActiveInvoice: true,
      hasActivePrimaryInvoice: true,
      canGenerateInvoice: false,
      canGenerateAccessoryInvoice: true,
      invoiceId: PRIMARY_INVOICE_ID,
      invoiceFolio: "A-100",
      invoiceStatus: "stamped",
      accessoryInvoices: [
        {
          id: ACCESSORY_INVOICE_ID,
          folio: "A-101",
          status: "draft",
          total: 1500,
        },
      ],
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

function AccessoryEditorHarness() {
  const form = useForm<InvoiceFormValues>({
    defaultValues: {
      ...defaultInvoiceFormValues(),
      concepts: [],
    },
  });

  return (
    <FormProvider {...form}>
      <InvoiceConceptsEditor
        control={form.control}
        setValue={form.setValue}
        taxRate={0.16}
        billingScope="accessory"
      />
    </FormProvider>
  );
}

describe("smoke ADR-0068 trip multi-invoice", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it("muestra CTA accesoria y navega a create con scope=accessory", async () => {
    const user = userEvent.setup();
    render(
      <TestProviders>
        <TripInvoiceActions trip={makeTrip()} presentation="inline" />
      </TestProviders>,
    );

    const cta = screen.getByRole("button", {
      name: tripFiscalCopy.invoiceActions.generateAccessory,
    });
    expect(cta).toBeInTheDocument();

    await user.click(cta);
    expect(mockNavigate).toHaveBeenCalledWith(
      `/invoices/new?trip_id=${TRIP_ID}&scope=accessory`,
    );
  });

  it("no muestra CTA accesoria sin canGenerateAccessoryInvoice", () => {
    render(
      <TestProviders>
        <TripInvoiceActions
          trip={makeTrip({
            invoicing: tripInvoicingFixture({
              hasActiveInvoice: true,
              hasActivePrimaryInvoice: true,
              canGenerateInvoice: false,
              canGenerateAccessoryInvoice: false,
              invoiceId: PRIMARY_INVOICE_ID,
              invoiceFolio: "A-100",
              invoiceStatus: "stamped",
            }),
          })}
          presentation="inline"
        />
      </TestProviders>,
    );

    expect(
      screen.queryByRole("button", {
        name: tripFiscalCopy.invoiceActions.generateAccessory,
      }),
    ).not.toBeInTheDocument();
  });

  it("lista primaria + accesoria en sección fiscal del viaje", () => {
    render(
      <TestProviders>
        <TripFiscalSection trip={makeTrip()} />
      </TestProviders>,
    );

    expect(
      screen.getByText(tripFiscalCopy.invoicesSection.compactTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tripFiscalCopy.invoicesSection.folio("A-100")),
    ).toBeInTheDocument();
    expect(screen.getByText(/2 facturas/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: tripFiscalCopy.invoicesSection.openInvoice,
      }),
    ).toHaveAttribute("href", `/invoices/${PRIMARY_INVOICE_ID}`);
  });

  it("editor accesorio vacío: sin flete y CTA agregar concepto", () => {
    render(
      <TestProviders>
        <AccessoryEditorHarness />
      </TestProviders>,
    );

    expect(screen.getByText(invoicingCopy.concepts.emptyTitle)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: invoicingCopy.concepts.addConcept }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Flete")).not.toBeInTheDocument();
  });

  it("badge Accesoria y payload create con billing_scope accessory", () => {
    render(
      <InvoiceBillingScopeBadge
        scope={resolveInvoiceBillingScope([{ billingScope: "accessory" }])}
      />,
    );
    expect(screen.getByText(invoicingCopy.billingScope.accessory)).toBeInTheDocument();

    const payload: CreateInvoicePayload = {
      tripIds: [TRIP_ID],
      billingScope: "accessory",
      receiverRfc: "XAXX010101000",
      receiverName: "Cliente Smoke",
      cfdiUsage: "G03",
      receiverTaxRegime: "601",
      receiverPostalCode: "64000",
      paymentForm: "99",
      paymentMethod: "PPD",
      currency: "MXN",
      subtotal: 1500,
      totalTax: 240,
      total: 1740,
      concepts: [
        {
          conceptType: "service",
          claveProdServ: "78101800",
          claveUnidad: "E48",
          unidad: "Servicio",
          description: "Maniobras",
          quantity: 1,
          unitPrice: 1500,
          amount: 1500,
          objectImp: "02",
          ivaRate: 0.16,
          retainedIvaRate: 0,
        },
      ],
    };

    expect(toApiCreateInvoice(payload)).toMatchObject({
      trip_ids: [TRIP_ID],
      billing_scope: "accessory",
    });
    expect(toApiCreateInvoice(payload).concepts?.[0]).toMatchObject({
      concept_type: "service",
    });
  });
});
