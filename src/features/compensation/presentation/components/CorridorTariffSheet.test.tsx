import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps, ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { CorridorTariffSheet } from "./CorridorTariffSheet";
import type { RouteCorridorTariff } from "../../domain/entities";

const branchUuid = "11111111-1111-4111-8111-111111111111";

const mockCreateMutate = vi.fn();
const mockUpdateMutate = vi.fn();
let mockCreatePending = false;
let mockUpdatePending = false;

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@shared/ui/select", () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string;
    onValueChange: (value: string) => void;
    children: ReactNode;
  }) => (
    <select
      aria-label="match-type-select"
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: ReactNode }) => (
    <option value={value}>{children}</option>
  ),
}));

vi.mock("@shared/ui/branch-async-combobox/BranchAsyncCombobox", () => ({
  BranchAsyncCombobox: ({
    id,
    value,
    onChange,
    placeholder,
  }: {
    id?: string;
    value: string;
    onChange: (branchId: string) => void;
    placeholder?: string;
  }) => (
    <button
      type="button"
      id={id}
      data-testid={id}
      data-value={value}
      onClick={() => onChange(branchUuid)}
    >
      {value ? `branch:${value}` : (placeholder ?? "Selecciona sucursal")}
    </button>
  ),
}));

vi.mock("../../application/hooks", () => ({
  useCreateCorridorTariff: () => ({
    mutateAsync: mockCreateMutate,
    isPending: mockCreatePending,
  }),
  useUpdateCorridorTariff: () => ({
    mutateAsync: mockUpdateMutate,
    isPending: mockUpdatePending,
  }),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function renderSheet(props: Partial<ComponentProps<typeof CorridorTariffSheet>> = {}) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CorridorTariffSheet
          open
          onOpenChange={vi.fn()}
          existingCorridors={[]}
          {...props}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const existingCorridor: RouteCorridorTariff = {
  id: "cor-existing",
  name: "CDMX → MTY",
  originRefType: "city_label",
  originRefValue: "Ciudad de México",
  destinationRefType: "city_label",
  destinationRefValue: "Monterrey",
  fixedAmount: 1500,
  notes: null,
  isActive: true,
};

async function fillFixedAmount(user: ReturnType<typeof userEvent.setup>, amount: string) {
  const amountField = screen.getByLabelText("Tarifa fija");
  await user.clear(amountField);
  await user.type(amountField, amount);
}

async function fillCreateForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Nombre"), "Nueva ruta");
  await user.type(document.getElementById("origin-ref")!, "Guadalajara");
  await user.type(document.getElementById("destination-ref")!, "Tijuana");
  await fillFixedAmount(user, "1500");
}

describe("CorridorTariffSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreatePending = false;
    mockUpdatePending = false;
    mockCreateMutate.mockResolvedValue(existingCorridor);
    mockUpdateMutate.mockResolvedValue(existingCorridor);
  });

  it("create: envía payload normalizado al guardar", async () => {
    const user = userEvent.setup();
    renderSheet();

    await fillCreateForm(user);
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(mockCreateMutate).toHaveBeenCalledTimes(1);
    });

    expect(mockCreateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Nueva ruta",
        originRefType: "city_label",
        originRefValue: "guadalajara",
        destinationRefType: "city_label",
        destinationRefValue: "tijuana",
        fixedAmount: 1500,
        isActive: true,
      }),
    );
  });

  it("create: rechaza tarifa fija en 0 sin mutar", async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.type(screen.getByLabelText("Nombre"), "Ruta cero");
    await user.type(document.getElementById("origin-ref")!, "CDMX");
    await user.type(document.getElementById("destination-ref")!, "MTY");
    await fillFixedAmount(user, "0");

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(mockCreateMutate).not.toHaveBeenCalled();
    expect(document.getElementById("corridor-amount-error")).toHaveTextContent(
      "La tarifa debe ser mayor a 0",
    );
  });

  it("reset refType: al cambiar origen a sucursal limpia el valor previo", async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.type(document.getElementById("origin-ref")!, "Guadalajara");

    const originSection = screen.getByText("Origen").closest("section");
    expect(originSection).not.toBeNull();

    const originSelect = within(originSection!).getByLabelText("match-type-select");
    await user.selectOptions(originSelect, "branch");

    const branchField = screen.getByTestId("origin-ref");
    expect(branchField).toHaveAttribute("data-value", "");
    expect(branchField).toHaveTextContent("Selecciona sucursal");
  });

  it("duplicado: muestra confirmación y guarda al confirmar", async () => {
    const user = userEvent.setup();
    renderSheet({
      existingCorridors: [existingCorridor],
    });

    await user.type(screen.getByLabelText("Nombre"), "Duplicada");
    await user.type(document.getElementById("origin-ref")!, "Ciudad de México");
    await user.clear(document.getElementById("destination-ref")!);
    await user.type(document.getElementById("destination-ref")!, "Monterrey");
    await fillFixedAmount(user, "1500");

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(
      await screen.findByRole("heading", { name: "¿Guardar ruta duplicada?" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Guardar de todos modos" }));

    await waitFor(() => {
      expect(mockCreateMutate).toHaveBeenCalledTimes(1);
    });
  });

  it("duplicado: error API cierra diálogo y muestra Alert en el sheet", async () => {
    mockCreateMutate.mockRejectedValueOnce(new Error("No se pudo guardar la ruta"));
    const user = userEvent.setup();
    renderSheet({
      existingCorridors: [existingCorridor],
    });

    await user.type(screen.getByLabelText("Nombre"), "Duplicada");
    await user.type(document.getElementById("origin-ref")!, "Ciudad de México");
    await user.clear(document.getElementById("destination-ref")!);
    await user.type(document.getElementById("destination-ref")!, "Monterrey");
    await fillFixedAmount(user, "1500");

    await user.click(screen.getByRole("button", { name: "Guardar" }));
    await user.click(await screen.findByRole("button", { name: "Guardar de todos modos" }));

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "¿Guardar ruta duplicada?" }),
      ).not.toBeInTheDocument();
    });

    expect(await screen.findByText("No se pudo guardar la ruta")).toBeInTheDocument();
  });

  it("isSaving: deshabilita Guardar cuando la mutación está pendiente", () => {
    mockCreatePending = true;
    renderSheet();

    expect(screen.getByRole("button", { name: /Guardando/ })).toBeDisabled();
  });

  it("canSave: deshabilita Guardar y muestra aviso sin permiso", () => {
    renderSheet({ canSave: false });

    expect(
      screen.getByText("No tienes permiso para guardar rutas con tarifa fija."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
  });

  it("edit: hidrata y envía update", async () => {
    const user = userEvent.setup();
    renderSheet({ corridor: existingCorridor });

    expect(screen.getByRole("heading", { name: "Editar ruta con tarifa fija" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre")).toHaveValue("CDMX → MTY");

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(mockUpdateMutate).toHaveBeenCalledTimes(1);
    });

    expect(mockUpdateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "cor-existing",
        payload: expect.objectContaining({
          name: "CDMX → MTY",
          originRefType: "city_label",
          originRefValue: "ciudad de méxico",
          destinationRefType: "city_label",
          destinationRefValue: "monterrey",
          fixedAmount: 1500,
          isActive: true,
        }),
      }),
    );
  });
});
