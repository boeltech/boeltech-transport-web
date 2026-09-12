import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@shared/api/interceptors/error-handler";
import type { BillingServiceConcept } from "../../domain/billingServiceConcept.types";
import { billingServiceConceptsCopy } from "../copy/billingServiceConceptsCopy";
import { BillingServiceConceptMasterDetail } from "./BillingServiceConceptMasterDetail";

const copy = billingServiceConceptsCopy;

const refetch = vi.fn();
let hasCreatePermission = true;
let hasUpdatePermission = true;
let hasDeletePermission = true;

const createMutateAsync = vi.fn();
const updateMutateAsync = vi.fn();
const deleteMutateAsync = vi.fn();

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

const sampleService: BillingServiceConcept = {
  id: "svc-1",
  name: "Maniobra",
  description: null,
  claveProdServ: "78121603",
  claveUnidad: "E48",
  unidad: "Servicio",
  defaultUnitPrice: 250,
  objectImp: "03",
  ivaAplica: true,
  retencionAplica: false,
  isActive: true,
  sortOrder: 0,
};

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: (module: string, action: string) => {
      if (module !== "billing_service_concepts") return false;
      if (action === "read") return true;
      if (action === "create") return hasCreatePermission;
      if (action === "update") return hasUpdatePermission;
      if (action === "delete") return hasDeletePermission;
      return false;
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
    mutateAsync: createMutateAsync,
    isPending: false,
  }),
  useUpdateBillingServiceConcept: () => ({
    mutateAsync: updateMutateAsync,
    isPending: false,
  }),
  useDeleteBillingServiceConcept: () => ({
    mutateAsync: deleteMutateAsync,
    isPending: false,
  }),
}));

describe("BillingServiceConceptMasterDetail", () => {
  beforeEach(() => {
    hasCreatePermission = true;
    hasUpdatePermission = true;
    hasDeletePermission = true;
    conceptsQuery = {
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch,
    };
    createMutateAsync.mockReset();
    updateMutateAsync.mockReset();
    deleteMutateAsync.mockReset();
    createMutateAsync.mockResolvedValue({ ...sampleService, id: "svc-new" });
    updateMutateAsync.mockResolvedValue(sampleService);
    deleteMutateAsync.mockResolvedValue(undefined);
  });

  it("muestra empty de alta cuando no hay datos y hay permiso write", () => {
    render(<BillingServiceConceptMasterDetail />);
    expect(screen.getByText(copy.list.emptyTitle)).toBeInTheDocument();
    expect(screen.getByText(copy.list.emptyDescription)).toBeInTheDocument();
    expect(screen.getByText(copy.form.createTitle)).toBeInTheDocument();
  });

  it("no ofrece alta cuando el catálogo está vacío y el rol es solo lectura", () => {
    hasCreatePermission = false;
    hasUpdatePermission = false;
    hasDeletePermission = false;
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

  it("bloquea Guardar con nombre vacío y no llama mutación", async () => {
    const user = userEvent.setup();
    render(<BillingServiceConceptMasterDetail />);

    await user.clear(screen.getByRole("textbox", { name: /Nombre/i }));
    await user.click(screen.getByRole("button", { name: copy.form.save }));

    expect(
      screen.getByText(copy.form.validation.nameRequired),
    ).toBeInTheDocument();
    expect(createMutateAsync).not.toHaveBeenCalled();
    expect(updateMutateAsync).not.toHaveBeenCalled();
  });

  it("crea servicio con objectImp 02 por defecto", async () => {
    const user = userEvent.setup();
    render(<BillingServiceConceptMasterDetail />);

    await user.type(screen.getByRole("textbox", { name: /Nombre/i }), "Estadía");
    await user.click(screen.getByRole("button", { name: copy.form.save }));

    expect(createMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Estadía",
        objectImp: "02",
        claveProdServ: "78121603",
        claveUnidad: "E48",
      }),
    );
  });

  it("al actualizar preserva objectImp del concepto", async () => {
    const user = userEvent.setup();
    conceptsQuery = {
      ...conceptsQuery,
      data: [sampleService],
    };
    render(<BillingServiceConceptMasterDetail />);

    expect(screen.getByText(copy.form.editTitle)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: copy.form.save }));

    expect(updateMutateAsync).toHaveBeenCalledWith({
      id: "svc-1",
      payload: expect.objectContaining({
        name: "Maniobra",
        objectImp: "03",
      }),
    });
    expect(createMutateAsync).not.toHaveBeenCalled();
  });

  it("desactiva tras confirmar el diálogo", async () => {
    const user = userEvent.setup();
    conceptsQuery = {
      ...conceptsQuery,
      data: [sampleService],
    };
    render(<BillingServiceConceptMasterDetail />);

    await user.click(screen.getByRole("button", { name: copy.form.deactivate }));
    expect(screen.getByText(copy.delete.title)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: copy.delete.confirm }));

    expect(deleteMutateAsync).toHaveBeenCalledWith("svc-1");
  });

  it("rol solo lectura: sin Nuevo, Guardar ni Desactivar", () => {
    hasCreatePermission = false;
    hasUpdatePermission = false;
    hasDeletePermission = false;
    conceptsQuery = {
      ...conceptsQuery,
      data: [sampleService],
    };
    render(<BillingServiceConceptMasterDetail />);

    expect(screen.getByText(copy.form.viewTitle)).toBeInTheDocument();
    expect(screen.queryByText(copy.list.add)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.form.save }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.form.deactivate }),
    ).not.toBeInTheDocument();
  });

  it("update sin create: edita existente y no ofrece Nuevo", async () => {
    const user = userEvent.setup();
    hasCreatePermission = false;
    hasUpdatePermission = true;
    hasDeletePermission = false;
    conceptsQuery = {
      ...conceptsQuery,
      data: [sampleService],
    };
    render(<BillingServiceConceptMasterDetail />);

    expect(screen.queryByText(copy.list.add)).not.toBeInTheDocument();
    expect(screen.getByText(copy.form.editTitle)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.form.save }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.form.deactivate }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: copy.form.save }));
    expect(updateMutateAsync).toHaveBeenCalled();
  });

  it("si create falla, permanece en modo alta sin seleccionar id", async () => {
    const user = userEvent.setup();
    createMutateAsync.mockRejectedValueOnce(new Error("network"));
    render(<BillingServiceConceptMasterDetail />);

    await user.type(screen.getByRole("textbox", { name: /Nombre/i }), "Estadía");
    await user.click(screen.getByRole("button", { name: copy.form.save }));

    expect(createMutateAsync).toHaveBeenCalled();
    expect(screen.getByText(copy.form.createTitle)).toBeInTheDocument();
    expect(screen.getByText(copy.list.emptyTitle)).toBeInTheDocument();
  });
});
