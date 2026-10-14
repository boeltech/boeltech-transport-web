import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClientActions } from "./ClientActions";
import { clientDetailCopy } from "../copy/clientDetailCopy";
import type { ClientListItem } from "../../domain";

type Callbacks = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

const {
  mockDeactivateMutate,
  mockDeleteMutate,
  mockHasPermission,
  callbacks,
} = vi.hoisted(() => ({
  mockDeactivateMutate: vi.fn(),
  mockDeleteMutate: vi.fn(),
  mockHasPermission: vi.fn(),
  callbacks: {
    deactivate: {} as Callbacks,
    delete: {} as Callbacks,
  },
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

vi.mock("../../application", () => ({
  useActivateClient: () => ({ mutate: vi.fn(), isPending: false }),
  useDeactivateClient: (cb: Callbacks) => {
    callbacks.deactivate = cb;
    return { mutate: mockDeactivateMutate, isPending: false };
  },
  useDeleteClient: (cb: Callbacks) => {
    callbacks.delete = cb;
    return { mutate: mockDeleteMutate, isPending: false };
  },
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const actionsCopy = clientDetailCopy.actions;

function buildClient(
  overrides: Partial<ClientListItem> = {},
): ClientListItem {
  return {
    id: "c-1",
    clientCode: "CLI-001",
    legalName: "Acme SA de CV",
    tradeName: "Acme",
    taxId: "ACM010101AAA",
    cfdiReceptorProfile: "receptor_cfdi",
    type: "company",
    paymentTerms: "credit",
    creditDays: 30,
    creditLimit: 100_000,
    isActive: true,
    primaryContact: null,
    ...overrides,
  };
}

function renderButtons(client: ClientListItem = buildClient()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ClientActions client={client} variant="buttons" />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ClientActions lifecycle (D1/D7/D11)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callbacks.deactivate = {};
    callbacks.delete = {};
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        module === "clients" && (action === "update" || action === "delete"),
    );
  });

  it("dropdown de listado no ofrece Activar/Desactivar (D1)", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ClientActions client={buildClient()} variant="dropdown" />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: /abrir menú/i }));

    expect(
      screen.getByRole("menuitem", { name: /ver detalle/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /^editar$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /^eliminar$/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /desactivar/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /activar/i }),
    ).not.toBeInTheDocument();
  });

  it("header: Editar primary; Desactivar outline; Eliminar no sólida primaria (D7)", () => {
    renderButtons();

    const edit = screen.getByRole("button", { name: /^editar$/i });
    const deactivate = screen.getByRole("button", { name: /^desactivar$/i });
    const del = screen.getByRole("button", { name: /^eliminar$/i });

    expect(edit.className).toMatch(/bg-primary|default/);
    expect(deactivate.className).toMatch(/border|outline/);
    expect(del.className).not.toMatch(/bg-destructive(?!\/)/);
    expect(del.className).toMatch(/border|outline|text-destructive/);
  });

  it("muestra Alert inline en Dialog cuando falla desactivar (D11)", async () => {
    const user = userEvent.setup();
    renderButtons();

    await user.click(screen.getByRole("button", { name: /^desactivar$/i }));
    await user.click(
      screen.getByRole("button", { name: actionsCopy.deactivate }),
    );

    expect(mockDeactivateMutate).toHaveBeenCalledWith("c-1");
    callbacks.deactivate.onError?.(new Error("Cliente con viajes activos"));

    expect(
      await screen.findByText(actionsCopy.lifecycleErrorTitle),
    ).toBeInTheDocument();
    expect(screen.getByText("Cliente con viajes activos")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("muestra Alert inline en Dialog cuando falla eliminar (D11)", async () => {
    const user = userEvent.setup();
    renderButtons();

    await user.click(screen.getByRole("button", { name: /^eliminar$/i }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent(actionsCopy.deleteTitle);

    await user.click(
      screen.getByRole("button", { name: actionsCopy.delete }),
    );

    expect(mockDeleteMutate).toHaveBeenCalledWith("c-1");
    callbacks.delete.onError?.(new Error("No se puede eliminar"));

    expect(
      await screen.findByText(actionsCopy.deleteErrorTitle),
    ).toBeInTheDocument();
    expect(screen.getByText("No se puede eliminar")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
