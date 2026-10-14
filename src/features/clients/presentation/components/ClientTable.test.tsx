import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClientTable } from "./ClientTable";
import { clientsCopy } from "../copy/clientsCopy";
import type { ClientListItem } from "../../domain";

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
  }),
}));

vi.mock("../../application", () => ({
  useActivateClient: () => ({ mutate: vi.fn(), isPending: false }),
  useDeactivateClient: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteClient: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const client: ClientListItem = {
  id: "c-1",
  clientCode: "CLI-001",
  legalName: "Acme SA de CV",
  tradeName: "Acme",
  taxId: "ACM010101AAA",
  cfdiReceptorProfile: "receptor_cfdi",
  type: "company",
  paymentTerms: "cash",
  creditDays: 0,
  isActive: true,
  primaryContact: null,
};

function renderTable(clients: ClientListItem[] = [client]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ClientTable clients={clients} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ClientTable (F3 D14)", () => {
  it("toma los headers del listado desde clientsCopy.table", () => {
    renderTable();

    const copy = clientsCopy.table;
    expect(screen.getByText(copy.code)).toBeInTheDocument();
    expect(screen.getByText(copy.legalName)).toBeInTheDocument();
    expect(screen.getByText(copy.taxId)).toBeInTheDocument();
    expect(screen.getByText(copy.type)).toBeInTheDocument();
    expect(screen.getByText(copy.payment)).toBeInTheDocument();
    expect(screen.getByText(copy.contact)).toBeInTheDocument();
    expect(screen.getByText(copy.status)).toBeInTheDocument();
  });

  it("con lista vacía no monta empty local (D4)", () => {
    const { container } = renderTable([]);
    expect(container).toBeEmptyDOMElement();
  });
});
