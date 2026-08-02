import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InvoiceConceptsEditor } from "./InvoiceConceptsEditor";
import type { InvoiceFormValues } from "../validation/invoiceFormSchema";
import { defaultInvoiceFormValues } from "../validation/invoiceFormSchema";

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
