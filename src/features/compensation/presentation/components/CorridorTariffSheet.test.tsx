import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { CorridorTariffSheet } from "./CorridorTariffSheet";
import type { FrequentCityPair, RouteCorridorTariff } from "../../domain/entities";
import { compensationCopy } from "../copy/compensationCopy";

const branchUuid = "11111111-1111-4111-8111-111111111111";

const mockCreateMutate = vi.fn();
const mockUpdateMutate = vi.fn();
let mockCreatePending = false;
let mockUpdatePending = false;
let mockFrequentPairs: FrequentCityPair[] = [];
let mockFrequentLoading = false;

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
  useDebounce: <T,>(value: T) => value,
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
  useFrequentCityPairs: () => ({
    data: mockFrequentPairs,
    isLoading: mockFrequentLoading,
    isFetching: mockFrequentLoading,
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

const frequentPair: FrequentCityPair = {
  originCity: "Guadalajara",
  destinationCity: "Tijuana",
  originState: "Jalisco",
  destinationState: "Baja California",
  tripCount: 8,
  lastUsedAt: "2026-09-20T12:00:00.000Z",
};

async function fillFixedAmount(user: ReturnType<typeof userEvent.setup>, amount: string) {
  const amountField = screen.getByLabelText("Tarifa fija");
  await user.clear(amountField);
  await user.type(amountField, amount);
}

async function fillCreateForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Nombre"), "Nueva ruta");
  await user.type(screen.getByLabelText("Ciudad de origen"), "Guadalajara");
  await user.type(screen.getByLabelText("Ciudad de destino"), "Tijuana");
  await fillFixedAmount(user, "1500");
}

async function openFrequentPicker(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole("combobox", {
      name: compensationCopy.sheet.frequentBlock.triggerAria,
    }),
  );
}

async function selectFrequentPair(
  user: ReturnType<typeof userEvent.setup>,
  pair: FrequentCityPair,
) {
  await openFrequentPicker(user);
  await user.click(
    await screen.findByRole("option", {
      name: compensationCopy.sheet.frequentBlock.applyAria(
        pair.originCity,
        pair.destinationCity,
      ),
    }),
  );
}

describe("CorridorTariffSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreatePending = false;
    mockUpdatePending = false;
    mockFrequentPairs = [];
    mockFrequentLoading = false;
    mockCreateMutate.mockResolvedValue(existingCorridor);
    mockUpdateMutate.mockResolvedValue(existingCorridor);
  });

  it("create: envía payload city_label×2 normalizado", async () => {
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

  it("create: onSuccess recibe el id del corredor creado", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    mockCreateMutate.mockResolvedValueOnce({
      ...existingCorridor,
      id: "cor-created-99",
    });
    renderSheet({ onSuccess });

    await fillCreateForm(user);
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith("cor-created-99");
    });
  });

  it("create: form plano solo ciudad — sin Definir por / branch / capturas", () => {
    renderSheet();

    expect(screen.getByText(compensationCopy.sheet.trayectoSection)).toBeInTheDocument();
    expect(screen.getByText(compensationCopy.sheet.frequentBlock.title)).toBeInTheDocument();
    expect(screen.getByLabelText("Ciudad de origen")).toBeInTheDocument();
    expect(screen.getByLabelText("Ciudad de destino")).toBeInTheDocument();
    expect(screen.queryByText("Definir por")).not.toBeInTheDocument();
    expect(screen.queryByText("Captura manual")).not.toBeInTheDocument();
    expect(screen.queryByText("Origen")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("match-type-select")).not.toBeInTheDocument();
    expect(
      screen.getByText(compensationCopy.sheet.corridorHelp),
    ).toBeInTheDocument();
    expect(compensationCopy.sheet.corridorHelp).not.toMatch(/sucursal/i);
  });

  it("muestra hint de Ruta activa", () => {
    renderSheet();

    expect(
      screen.getByText(
        "Si la desactivas, esta ruta no se aplicará en liquidaciones futuras. Puedes reactivarla después.",
      ),
    ).toBeInTheDocument();
  });

  it("create: rechaza tarifa fija en 0 sin mutar", async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.type(screen.getByLabelText("Nombre"), "Ruta cero");
    await user.type(screen.getByLabelText("Ciudad de origen"), "CDMX");
    await user.type(screen.getByLabelText("Ciudad de destino"), "MTY");
    await fillFixedAmount(user, "0");

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(mockCreateMutate).not.toHaveBeenCalled();
    expect(document.getElementById("corridor-amount-error")).toHaveTextContent(
      "La tarifa debe ser mayor a 0",
    );
  });

  it("create: picker muestra opciones al abrir", async () => {
    mockFrequentPairs = [frequentPair];
    const user = userEvent.setup();
    renderSheet();

    expect(
      screen.queryByRole("option", {
        name: compensationCopy.sheet.frequentBlock.applyAria(
          frequentPair.originCity,
          frequentPair.destinationCity,
        ),
      }),
    ).not.toBeInTheDocument();

    await openFrequentPicker(user);

    expect(
      await screen.findByRole("option", {
        name: compensationCopy.sheet.frequentBlock.applyAria(
          frequentPair.originCity,
          frequentPair.destinationCity,
        ),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(compensationCopy.sheet.frequentBlock.tripCount(frequentPair.tripCount)),
    ).toBeInTheDocument();
  });

  it("create: picker muestra loading dentro del popover", async () => {
    mockFrequentLoading = true;
    mockFrequentPairs = [];
    const user = userEvent.setup();
    renderSheet();

    await openFrequentPicker(user);

    expect(
      await screen.findByText(compensationCopy.sheet.frequentBlock.loading),
    ).toBeInTheDocument();
  });

  it("create: aplica trayecto frecuente sin tocar monto ni notas", async () => {
    mockFrequentPairs = [frequentPair];
    const user = userEvent.setup();
    renderSheet();

    await fillFixedAmount(user, "2200");
    await user.type(screen.getByLabelText("Notas (opcional)"), "nota previa");

    await selectFrequentPair(user, frequentPair);

    expect(screen.getByLabelText("Nombre")).toHaveValue("Guadalajara → Tijuana");
    expect(screen.getByLabelText("Ciudad de origen")).toHaveValue("Guadalajara");
    expect(screen.getByLabelText("Ciudad de destino")).toHaveValue("Tijuana");
    expect(screen.getByLabelText("Tarifa fija")).toHaveValue("2,200.00");
    expect(screen.getByLabelText("Notas (opcional)")).toHaveValue("nota previa");
    expect(
      screen.getByRole("combobox", {
        name: compensationCopy.sheet.frequentBlock.triggerAria,
      }),
    ).toHaveTextContent("Guadalajara → Tijuana");
  });

  it("create: no sobrescribe nombre dirty al aplicar frecuente", async () => {
    mockFrequentPairs = [frequentPair];
    const user = userEvent.setup();
    renderSheet();

    await user.type(screen.getByLabelText("Nombre"), "Mi nombre");
    await selectFrequentPair(user, frequentPair);

    expect(screen.getByLabelText("Nombre")).toHaveValue("Mi nombre");
    expect(screen.getByLabelText("Ciudad de origen")).toHaveValue("Guadalajara");
    expect(screen.getByLabelText("Ciudad de destino")).toHaveValue("Tijuana");
  });

  it("create: muestra empty copy cuando no hay trayectos frecuentes", async () => {
    mockFrequentPairs = [];
    const user = userEvent.setup();
    renderSheet();

    await openFrequentPicker(user);

    expect(
      await screen.findByText(compensationCopy.sheet.frequentBlock.empty),
    ).toBeInTheDocument();
  });

  it("edit city: no muestra bloque de frecuentes", () => {
    renderSheet({ corridor: existingCorridor });

    expect(
      screen.queryByText(compensationCopy.sheet.frequentBlock.title),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Ciudad de origen")).toBeInTheDocument();
  });

  it("edit: soft patch legacy origin-branch omite refs y usa alert operativo", async () => {
    const user = userEvent.setup();
    renderSheet({
      corridor: {
        ...existingCorridor,
        originRefType: "branch",
        originRefValue: branchUuid,
        destinationRefType: "city_label",
        destinationRefValue: "Monterrey",
      },
    });

    expect(
      screen.getByText(compensationCopy.sheet.fields.legacyAlertOriginBranch),
    ).toBeInTheDocument();
    expect(screen.getByTestId("legacy-match-definition")).toBeInTheDocument();
    expect(screen.queryByLabelText("Ciudad de origen")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: compensationCopy.sheet.fields.convertToCity }),
    ).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Nombre"));
    await user.type(screen.getByLabelText("Nombre"), "Nombre soft");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(mockUpdateMutate).toHaveBeenCalledTimes(1);
    });

    const call = mockUpdateMutate.mock.calls[0][0] as {
      id: string;
      payload: Record<string, unknown>;
    };
    expect(call.id).toBe("cor-existing");
    expect(call.payload).toEqual(
      expect.objectContaining({
        name: "Nombre soft",
        fixedAmount: 1500,
        isActive: true,
      }),
    );
    expect(call.payload).not.toHaveProperty("originRefType");
    expect(call.payload).not.toHaveProperty("destinationRefType");
    expect(call.payload).not.toHaveProperty("originRefValue");
    expect(call.payload).not.toHaveProperty("destinationRefValue");
  });

  it("edit: alert dead-match para CP / dest-branch", () => {
    renderSheet({
      corridor: {
        ...existingCorridor,
        originRefType: "postal_code",
        originRefValue: "64000",
        destinationRefType: "branch",
        destinationRefValue: branchUuid,
      },
    });

    expect(
      screen.getByText(compensationCopy.sheet.fields.legacyAlertDeadMatch),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(compensationCopy.sheet.fields.legacyAlertOriginBranch),
    ).not.toBeInTheDocument();
  });

  it("edit: convertir a ciudad envía PATCH con city_label×2", async () => {
    const user = userEvent.setup();
    renderSheet({
      corridor: {
        ...existingCorridor,
        originRefType: "postal_code",
        originRefValue: "64000",
        destinationRefType: "city_label",
        destinationRefValue: "Monterrey",
      },
    });

    await user.click(
      screen.getByRole("button", { name: compensationCopy.sheet.fields.convertToCity }),
    );
    await user.click(
      await screen.findByRole("button", {
        name: compensationCopy.sheet.fields.convertToCityConfirmAction,
      }),
    );

    expect(await screen.findByLabelText("Ciudad de origen")).toBeInTheDocument();
    expect(screen.getByLabelText("Ciudad de destino")).toHaveValue("Monterrey");

    await user.type(screen.getByLabelText("Ciudad de origen"), "Guadalajara");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(mockUpdateMutate).toHaveBeenCalledTimes(1);
    });

    expect(mockUpdateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "cor-existing",
        payload: expect.objectContaining({
          originRefType: "city_label",
          originRefValue: "guadalajara",
          destinationRefType: "city_label",
          destinationRefValue: "monterrey",
          fixedAmount: 1500,
        }),
      }),
    );
  });

  it("duplicado: muestra confirmación y guarda al confirmar", async () => {
    const user = userEvent.setup();
    renderSheet({
      existingCorridors: [existingCorridor],
    });

    await user.type(screen.getByLabelText("Nombre"), "Duplicada");
    await user.type(screen.getByLabelText("Ciudad de origen"), "Ciudad de México");
    await user.type(screen.getByLabelText("Ciudad de destino"), "Monterrey");
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
    await user.type(screen.getByLabelText("Ciudad de origen"), "Ciudad de México");
    await user.type(screen.getByLabelText("Ciudad de destino"), "Monterrey");
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

  it("edit city↔city: hidrata y envía update con refs ciudad", async () => {
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
