import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { billingServiceConceptsCopy } from "../copy/billingServiceConceptsCopy";
import { BillingServiceConceptMasterDetail } from "./BillingServiceConceptMasterDetail";

const copy = billingServiceConceptsCopy;

const refetch = vi.fn();
let hasCreatePermission = true;
let conceptsQuery: {
  data: unknown;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: typeof refetch;
} = {
  data: [],
  isLoading: false,
  isError: false,
  error: null,
  refetch,
};

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: (module: string, action: string) => {
      if (module === "billing_service_concepts" && action === "create") {
        return hasCreatePermission;
      }
      return module === "billing_service_concepts" && action === "read";
    },
  }),
}));

vi.mock("@features/catalogs", () => ({
  ProductoServicioSearch: ({ value }: { value: string }) => (
    <div data-testid="prod-serv">{value}</div>
  ),
  UnidadMedidaSearch: ({ value }: { value: string }) => (
    <div data-testid="unidad">{value}</div>
  ),
}));

vi.mock("../../application/hooks/useBillingServiceConcepts", () => ({
  useBillingServiceConcepts: () => conceptsQuery,
  useCreateBillingServiceConcept: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateBillingServiceConcept: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteBillingServiceConcept: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

describe("BillingServiceConceptMasterDetail", () => {
  beforeEach(() => {
    hasCreatePermission = true;
    conceptsQuery = {
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch,
    };
  });

  it("muestra empty de alta cuando no hay datos y hay permiso write", () => {
    render(<BillingServiceConceptMasterDetail />);
    expect(screen.getByText(copy.list.emptyTitle)).toBeInTheDocument();
    expect(screen.getByText(copy.list.emptyDescription)).toBeInTheDocument();
    expect(screen.getByText(copy.form.createTitle)).toBeInTheDocument();
  });

  it("no ofrece alta cuando el catálogo está vacío y el rol es solo lectura", () => {
    hasCreatePermission = false;
    render(<BillingServiceConceptMasterDetail />);
    expect(
      screen.getByText(copy.list.emptyReadOnlyDescription),
    ).toBeInTheDocument();
    expect(screen.queryByText(copy.list.add)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.form.createTitle)).not.toBeInTheDocument();
  });

  it("distingue error 403 de empty state", () => {
    conceptsQuery = {
      data: undefined,
      isLoading: false,
      isError: true,
      error: new ApiError("Forbidden", 403, "FORBIDDEN"),
      refetch,
    };
    render(<BillingServiceConceptMasterDetail />);
    expect(screen.getByText(copy.list.forbiddenTitle)).toBeInTheDocument();
    expect(screen.queryByText(copy.list.emptyTitle)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.form.createTitle)).not.toBeInTheDocument();
  });

  it("muestra error genérico con reintentar", () => {
    conceptsQuery = {
      data: undefined,
      isLoading: false,
      isError: true,
      error: new ApiError("Server error", 500),
      refetch,
    };
    render(<BillingServiceConceptMasterDetail />);
    expect(screen.getByText(copy.list.errorTitle)).toBeInTheDocument();
    expect(screen.getByText(copy.list.retry)).toBeInTheDocument();
  });
});
