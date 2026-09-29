import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { billingSchemesCopy } from "../copy/billingSchemesCopy";
import { BillingSchemesCompactCard } from "./BillingSchemesCompactCard";

const mockHasPermission = vi.fn();

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("../../application/hooks/useBillingSchemes", () => ({
  useBillingSchemes: () => ({
    data: [],
    isLoading: false,
    isError: false,
  }),
  useCreateBillingScheme: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateBillingScheme: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteBillingScheme: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

function renderCard() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <BillingSchemesCompactCard />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("BillingSchemesCompactCard", () => {
  beforeEach(() => {
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        module === "invoices" && (action === "read" || action === "update"),
    );
  });

  it("muestra frecuencias, empty y atajo a clientes", () => {
    renderCard();

    expect(
      screen.getByText(billingSchemesCopy.page.title),
    ).toBeInTheDocument();
    expect(
      screen.getByText(billingSchemesCopy.list.emptyDescription),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: billingSchemesCopy.page.clientsCta }),
    ).toHaveAttribute("href", "/clients");
    expect(
      screen.getAllByRole("button", { name: billingSchemesCopy.list.add })
        .length,
    ).toBeGreaterThan(0);
  });

  it("accountant sin update no ve el alta", () => {
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        module === "invoices" && action === "read",
    );
    renderCard();

    expect(
      screen.queryByRole("button", { name: billingSchemesCopy.list.add }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(billingSchemesCopy.page.title),
    ).toBeInTheDocument();
  });
});
