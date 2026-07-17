/**
 * Smoke OP-L0.9 — exposición de crédito: detalle cliente + wizard Costos (sin bloqueo).
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";

import type { ClientCreditSummary } from "@features/clients/domain/entities";
import { ClientDetailCommercialTab } from "@features/clients/presentation/components/ClientDetailCommercialTab";
import { CostsStep } from "@features/trips/presentation/pages/create/components/CostsStep";
import {
  defaultWizardFormValues,
  type TripWizardFormValues,
} from "@features/trips/presentation/pages/create/components/validation";
import { getPaymentTermsConfig } from "@features/clients/presentation/config/clientConfig";
import { CreditCard } from "lucide-react";
import { creditExposureCopy } from "@shared/ui/data-display/creditExposureCopy";

const mockUseClientCreditSummary = vi.fn();

vi.mock("@features/clients/application", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/clients/application")>();
  return {
    ...actual,
    useClientCreditSummary: (...args: unknown[]) => mockUseClientCreditSummary(...args),
  };
});

vi.mock("@features/vehicles/application", () => ({
  useVehicle: () => ({ data: undefined }),
}));

const OK_SUMMARY: ClientCreditSummary = {
  clientId: "client-1",
  paymentTerms: "credit",
  creditDays: 30,
  creditLimit: 100_000,
  breakdown: { invoiced: 45_000, unbilled: 12_000, pendingDraft: 3_000 },
  totalExposure: 60_000,
  availableCredit: 40_000,
  utilizationPct: 0.6,
  status: "ok",
  nextInvoiceDueAt: "2026-07-15",
};

const EXCEEDED_SUMMARY: ClientCreditSummary = {
  ...OK_SUMMARY,
  totalExposure: 120_000,
  availableCredit: 0,
  utilizationPct: 1.2,
  status: "exceeded",
};

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

function CostsStepHarness({
  clientId,
  baseRate,
}: {
  clientId: string;
  baseRate: number;
}) {
  const form = useForm<TripWizardFormValues>({
    defaultValues: {
      ...defaultWizardFormValues,
      clientId,
      baseRate,
      cfdiDocumentIntent: "ingreso",
    } as TripWizardFormValues,
  });
  const expensesFieldArray = useFieldArray({
    control: form.control,
    name: "expenses",
  });

  return <CostsStep form={form} expensesFieldArray={expensesFieldArray} />;
}

describe("credit exposure workflow smoke (OP-L0.9)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseClientCreditSummary.mockReturnValue({
      data: OK_SUMMARY,
      isLoading: false,
      isError: false,
    });
  });

  it("detalle comercial muestra barra y breakdown de crédito", async () => {
    const paymentConfig = getPaymentTermsConfig("credit");
    render(
      <TestProviders>
        <ClientDetailCommercialTab
          client={{
            id: "client-1",
            tenantId: "tenant-1",
            clientCode: "C-001",
            type: "company",
            legalName: "Acme Transport",
            taxId: "ACM010101AAA",
            taxRegime: "601",
            paymentTerms: "credit",
            creditDays: 30,
            creditLimit: 100_000,
            isActive: true,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          }}
          paymentConfig={paymentConfig}
          PaymentIcon={CreditCard}
        />
      </TestProviders>,
    );

    expect(screen.getByText(creditExposureCopy.title)).toBeInTheDocument();
    expect(screen.getByText(creditExposureCopy.breakdown.invoiced)).toBeInTheDocument();
    expect(screen.getByText(creditExposureCopy.breakdown.unbilled)).toBeInTheDocument();
    expect(mockUseClientCreditSummary).toHaveBeenCalledWith("client-1");
  });

  it("wizard Costos muestra panel compacto y aviso sin bloqueo cuando excede límite", async () => {
    mockUseClientCreditSummary.mockReturnValue({
      data: EXCEEDED_SUMMARY,
      isLoading: false,
      isError: false,
    });

    render(
      <TestProviders>
        <CostsStepHarness clientId="client-1" baseRate={12_500} />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(screen.getByText(creditExposureCopy.statusLabel.exceeded)).toBeInTheDocument();
    });

    expect(mockUseClientCreditSummary).toHaveBeenCalled();
    expect(
      screen.getByText(creditExposureCopy.wizardWarning.exceeded, { exact: false }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /bloquear/i })).not.toBeInTheDocument();
  });
});
