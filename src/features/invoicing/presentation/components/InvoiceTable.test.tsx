import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";

import type { InvoiceListItem } from "@features/invoicing/domain";
import { InvoiceTable } from "./InvoiceTable";

function renderWithProviders(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

function listInvoice(
  overrides: Partial<InvoiceListItem> = {},
): InvoiceListItem {
  return {
    id: "inv-1",
    tenantId: "tenant-1",
    serie: "A",
    folio: 100,
    cfdiUuid: null,
    receiverRfc: "XAXX010101000",
    receiverName: "Cliente Demo SA",
    issuedAt: "2026-05-17T10:00:00.000Z",
    paymentForm: "03",
    paymentMethod: "PUE",
    currency: "MXN",
    subtotal: 1000,
    totalTax: 160,
    total: 1160,
    status: "draft",
    satCancellationStatus: "none",
    satCancellationMessage: null,
    stampedAt: null,
    dispatchSentAt: null,
    tripCount: 0,
    tripCodes: [],
    totalPaid: 0,
    balanceDue: 1160,
    createdAt: "2026-05-01T00:00:00.000Z",
    createdByName: null,
    ...overrides,
  };
}

describe("InvoiceTable", () => {
  it("muestra día civil México en Fecha para emisión vespertina (no día UTC)", () => {
    // 09/09/2026 20:00 America/Mexico_City = 2026-09-10T02:00:00.000Z
    renderWithProviders(
      <InvoiceTable
        invoices={[
          listInvoice({ issuedAt: "2026-09-10T02:00:00.000Z" }),
        ]}
        isLoading={false}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByText(/09 sep 2026/i)).toBeInTheDocument();
    expect(screen.queryByText(/10 sep 2026/i)).not.toBeInTheDocument();
  });
});
