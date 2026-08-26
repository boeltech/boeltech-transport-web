import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import {
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PERSONA_MORAL_RETAINED_IVA_RATE } from "@boeltech/cfdi-domain";
import { InvoiceConceptsEditor } from "./InvoiceConceptsEditor";
import type { InvoiceFormValues } from "../validation/invoiceFormSchema";
import {
  defaultFleteConceptFormLine,
  defaultInvoiceFormValues,
} from "../validation/invoiceFormSchema";

vi.mock("@features/settings/application/hooks/useBillingServiceConcepts", () => ({
  useBillingServiceConcepts: () => ({ data: [], isLoading: false }),
}));

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

function AmountsProbe() {
  const { control } = useFormContext<InvoiceFormValues>();
  const retainedTax = useWatch({ control, name: "retained_tax" });
  const fleteRate = useWatch({
    control,
    name: "concepts.0.retained_iva_rate",
  });
  const serviceRate = useWatch({
    control,
    name: "concepts.1.retained_iva_rate",
  });
  return (
    <>
      <span data-testid="retained-tax">{String(retainedTax ?? "")}</span>
      <span data-testid="flete-rate">{String(fleteRate ?? "")}</span>
      <span data-testid="service-rate">{String(serviceRate ?? "")}</span>
    </>
  );
}

function PmMultiConceptHarness() {
  const form = useForm<InvoiceFormValues>({
    defaultValues: {
      ...defaultInvoiceFormValues(),
      retention_required: true,
      concepts: [
        defaultFleteConceptFormLine(10_000, {
          ivaAplica: true,
          retencionAplica: false,
        }),
        {
          ...defaultFleteConceptFormLine(1_500, {
            ivaAplica: true,
            retencionAplica: false,
          }),
          concept_type: "service",
          description: "Maniobras",
          clave_prod_serv: "78101801",
        },
      ],
    },
  });

  return (
    <FormProvider {...form}>
      <InvoiceConceptsEditor
        control={form.control}
        setValue={form.setValue}
        taxRate={0.16}
        retentionRequired
      />
      <AmountsProbe />
    </FormProvider>
  );
}

describe("InvoiceConceptsEditor accessory mode (ADR-0068)", () => {
  it("shows accessory empty state and add-concept CTA without flete row", () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        <AccessoryEditorHarness />
      </QueryClientProvider>,
    );

    expect(screen.getByText("Sin conceptos")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Agregar concepto/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Flete")).not.toBeInTheDocument();
  });
});

describe("InvoiceConceptsEditor PM multi-concepto", () => {
  it("syncs flete to 4% and retains only flete when service has 0%", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        <PmMultiConceptHarness />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("flete-rate")).toHaveTextContent(
        String(PERSONA_MORAL_RETAINED_IVA_RATE),
      );
    });
    expect(screen.getByTestId("service-rate")).toHaveTextContent("0");
    expect(screen.getByTestId("retained-tax")).toHaveTextContent("400");
  });
});
