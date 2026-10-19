import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { formatDate } from "@shared/utils/dateUtils";
import { TemplateAssignmentBatchSheet } from "./TemplateAssignmentBatchSheet";
import type {
  BatchAssignmentConflict,
  BatchAssignmentPreview,
  BatchAssignmentResult,
  BatchTemplateAssignmentPayload,
  TemplateAssignment,
} from "../../domain/entities";

const FERNANDO = "11111111-1111-4111-8111-111111111111";
const ANA = "22222222-2222-4222-8222-222222222222";
const LUIS = "33333333-3333-4333-8333-333333333333";
const TEMPLATE_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OLD_TEMPLATE_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const OLD_ASSIGNMENT_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const UUID_PREFIXES = ["11111111", "22222222", "33333333", "aaaaaaaa", "bbbbbbbb", "cccccccc"];

const { mockBatchMutate, mockUsePreview, mockToast, combobox } = vi.hoisted(() => ({
  mockBatchMutate: vi.fn(),
  mockUsePreview: vi.fn(),
  mockToast: vi.fn(),
  combobox: { nextSelection: [] as string[] },
}));

vi.mock("@shared/utils/dateUtils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/utils/dateUtils")>();
  return {
    ...actual,
    getTodayString: () => "2026-09-01",
  };
});

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("@shared/ui/employee-async-combobox", () => ({
  EmployeeAsyncCombobox: ({
    value,
    onChange,
  }: {
    value: string[];
    onChange: (ids: string[]) => void;
  }) => (
    <div>
      <div data-testid="selected-ids" data-ids={value.join(",")} />
      <button type="button" onClick={() => onChange(combobox.nextSelection)}>
        Seleccionar operador
      </button>
    </div>
  ),
}));

vi.mock("../../application/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../application/hooks")>();
  return {
    isBatchPreviewPayloadReady: actual.isBatchPreviewPayloadReady,
    useBatchCreateTemplateAssignments: () => ({
      mutateAsync: mockBatchMutate,
      isPending: false,
    }),
    useBatchAssignmentPreview: (
      payload: BatchTemplateAssignmentPayload,
      options: { enabled?: boolean },
    ) => mockUsePreview(payload, options),
  };
});

/** Caso Fernando (criterio 1): anterior cerrada que empieza el mismo día que la nueva. */
const fernandoConflict: BatchAssignmentConflict = {
  employeeId: FERNANDO,
  code: "OVERLAPPING_ACTIVE_ASSIGNMENT",
  message: "Mensaje de la API",
  reason: "previous_starts_on_or_after",
  employeeFullName: "Fernando Ruiz",
  existingAssignmentId: OLD_ASSIGNMENT_ID,
  existingTemplateId: OLD_TEMPLATE_ID,
  existingTemplateName: "Foráneo",
  existingTemplateVersion: 1,
  existingEffectiveFrom: "2026-09-01",
  existingEffectiveTo: "2026-09-30",
  closePreviousOn: null,
  suggestedEffectiveFrom: "2026-10-01",
};

const fernandoCloseDisabled: BatchAssignmentConflict = {
  ...fernandoConflict,
  reason: "overlap_close_disabled",
  existingEffectiveFrom: "2026-08-01",
  existingEffectiveTo: null,
  closePreviousOn: "2026-08-31",
  suggestedEffectiveFrom: null,
};

function previewOf(overrides: Partial<BatchAssignmentPreview> = {}) {
  return {
    data: {
      wouldCreateCount: 0,
      wouldSkipCount: 0,
      employees: [],
      conflicts: [],
      closures: [],
      ...overrides,
    } satisfies BatchAssignmentPreview,
    isError: false,
  };
}

function createdAssignment(employeeId: string): TemplateAssignment {
  return {
    id: `asg-${employeeId}`,
    employeeId,
    templateId: TEMPLATE_ID,
    effectiveFrom: "2026-09-01",
    effectiveTo: null,
    isActive: true,
  };
}

function batchResult(created: string[], conflicts: BatchAssignmentConflict[]): BatchAssignmentResult {
  return {
    createdCount: created.length,
    skippedCount: conflicts.length,
    conflicts,
    created: created.map(createdAssignment),
  };
}

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

type SheetProps = Partial<Parameters<typeof TemplateAssignmentBatchSheet>[0]>;

function renderSheet(props: SheetProps = {}) {
  const callbacks = {
    onOpenChange: vi.fn(),
    onAssignmentsCreated: vi.fn(),
    onSuccess: vi.fn(),
  };
  const view = render(
    <TemplateAssignmentBatchSheet open templateId={TEMPLATE_ID} {...callbacks} {...props} />,
    { wrapper },
  );
  return { ...view, ...callbacks };
}

function selectedIds(): string[] {
  const raw = screen.getByTestId("selected-ids").getAttribute("data-ids") ?? "";
  return raw ? raw.split(",") : [];
}

function lastPreviewPayload(): BatchTemplateAssignmentPayload {
  return mockUsePreview.mock.calls.at(-1)![0] as BatchTemplateAssignmentPayload;
}

function expectNoUuidFragments() {
  const text = document.body.textContent ?? "";
  for (const prefix of UUID_PREFIXES) expect(text).not.toContain(prefix);
}

describe("TemplateAssignmentBatchSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePreview.mockReturnValue({ data: undefined, isError: false });
    combobox.nextSelection = [];
  });

  it("(a) criterio 1: el caso real muestra nombre, tarifa con versión, fechas y el botón", () => {
    mockUsePreview.mockReturnValue(previewOf({ conflicts: [fernandoConflict] }));
    renderSheet({ initialEmployeeIds: [FERNANDO] });

    const preview = screen.getByTestId("batch-preview-conflicts");
    expect(within(preview).getByText("Revisa antes de confirmar")).toBeInTheDocument();
    expect(within(preview).getByText("Fernando Ruiz")).toBeInTheDocument();
    expect(
      within(preview).getByText(
        `Ya tiene una asignación en Foráneo versión 1 del ${formatDate("2026-09-01")} al ${formatDate("2026-09-30")}. Esa asignación empieza el mismo día o después que la nueva, así que no se puede cerrar antes de que empiece.`,
      ),
    ).toBeInTheDocument();
    expect(
      within(preview).getByText(
        `Para que cobre con esta versión al terminar esa asignación, vuelve a asignar desde el ${formatDate("2026-10-01")}. Si esta versión debe aplicar desde el ${formatDate("2026-09-01")}, primero desactiva su asignación en Foráneo versión 1.`,
      ),
    ).toBeInTheDocument();
    expect(
      within(preview).getByRole("button", {
        name: `Asignar a Fernando Ruiz desde el ${formatDate("2026-10-01")}`,
      }),
    ).toBeInTheDocument();
    expect(within(preview).queryByText(/Ir a su asignación/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar asignación" })).toBeEnabled();
  });

  it("D18: con enlace conectado, lo muestra con su ayuda y entrega selección y fecha", async () => {
    const user = userEvent.setup();
    const onOpenBlockingAssignment = vi.fn();
    mockUsePreview.mockReturnValue(previewOf({ conflicts: [fernandoConflict] }));
    renderSheet({ initialEmployeeIds: [FERNANDO, ANA], onOpenBlockingAssignment });

    const preview = screen.getByTestId("batch-preview-conflicts");
    expect(
      within(preview).getByText(
        "Se cerrará esta asignación masiva. Podrás volver con los mismos operadores y fecha.",
      ),
    ).toBeInTheDocument();
    await user.click(
      within(preview).getByRole("button", { name: "Ir a su asignación en Foráneo versión 1" }),
    );

    expect(onOpenBlockingAssignment).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "other-template",
        assignmentId: OLD_ASSIGNMENT_ID,
        templateId: OLD_TEMPLATE_ID,
      }),
      { employeeIds: [FERNANDO, ANA], effectiveFrom: "2026-09-01" },
    );
    expect(mockBatchMutate).not.toHaveBeenCalled();
  });

  it("(b) criterio 3: el botón de salida deja solo a ese operador y cambia «Vigente desde» sin llamar al lote", async () => {
    const user = userEvent.setup();
    mockUsePreview.mockReturnValue(previewOf({ conflicts: [fernandoConflict] }));
    renderSheet({ initialEmployeeIds: [FERNANDO, ANA] });

    await user.click(
      screen.getByRole("button", {
        name: `Asignar a Fernando Ruiz desde el ${formatDate("2026-10-01")}`,
      }),
    );

    expect(selectedIds()).toEqual([FERNANDO]);
    expect(screen.getByRole("button", { name: /Vigente desde/i })).toHaveTextContent(
      formatDate("2026-10-01"),
    );
    expect(lastPreviewPayload()).toMatchObject({
      employeeIds: [FERNANDO],
      effectiveFrom: "2026-10-01",
    });
    expect(mockBatchMutate).not.toHaveBeenCalled();
  });

  it("(c) criterio 4: 2 de 3 → aviso, selección = bloqueado, refresca sin cierre en cascada", async () => {
    const user = userEvent.setup();
    mockUsePreview.mockReturnValue(previewOf({ conflicts: [fernandoConflict] }));
    const result = batchResult([ANA, LUIS], [fernandoConflict]);
    mockBatchMutate.mockResolvedValue(result);
    const { onAssignmentsCreated, onSuccess, onOpenChange } = renderSheet({
      initialEmployeeIds: [FERNANDO, ANA, LUIS],
    });

    await user.click(screen.getByRole("button", { name: "Confirmar asignación" }));

    const notice = await screen.findByTestId("batch-assignment-result");
    expect(within(notice).getByText("Se asignaron 2 de 3 operadores")).toBeInTheDocument();
    expect(
      within(notice).getByText(
        "Corrige lo siguiente y vuelve a confirmar; solo se intentará con estos operadores.",
      ),
    ).toBeInTheDocument();
    expect(within(notice).getByText("Fernando Ruiz")).toBeInTheDocument();
    expect(notice.className).toContain("warning");
    expect(selectedIds()).toEqual([FERNANDO]);
    expect(onAssignmentsCreated).toHaveBeenCalledWith(result);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(mockToast).toHaveBeenCalledWith({
      title: "Se asignaron 2 de 3 operadores",
      description: "Revisa en el panel por qué se omitieron los demás.",
      variant: "warning",
    });
    expect(screen.queryByTestId("batch-preview-conflicts")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Descartar aviso" }));
    expect(screen.queryByTestId("batch-assignment-result")).not.toBeInTheDocument();
  });

  it("(d) ninguno asignado → aviso destructive y sin callbacks", async () => {
    const user = userEvent.setup();
    mockBatchMutate.mockResolvedValue(batchResult([], [fernandoConflict]));
    const { onAssignmentsCreated, onSuccess } = renderSheet({ initialEmployeeIds: [FERNANDO] });

    await user.click(screen.getByRole("button", { name: "Confirmar asignación" }));

    const notice = await screen.findByTestId("batch-assignment-result");
    expect(within(notice).getByText("No se asignó ningún operador")).toBeInTheDocument();
    expect(notice.className).toContain("destructive");
    expect(onAssignmentsCreated).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith({
      title: "No se asignó ningún operador",
      description: "Revisa el motivo en el panel.",
      variant: "error",
    });
  });

  it("(e) todos asignados → toast, cierre y onSuccess", async () => {
    const user = userEvent.setup();
    const result = batchResult([FERNANDO, ANA], []);
    mockBatchMutate.mockResolvedValue(result);
    const { onAssignmentsCreated, onSuccess, onOpenChange } = renderSheet({
      initialEmployeeIds: [FERNANDO, ANA],
    });

    await user.click(screen.getByRole("button", { name: "Confirmar asignación" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onAssignmentsCreated).toHaveBeenCalledWith(result);
    expect(mockToast).toHaveBeenCalledWith({ title: "Asignación completada", variant: "success" });
    expect(screen.queryByTestId("batch-assignment-result")).not.toBeInTheDocument();
  });

  it("(f) criterio 5: «Marcar cierre de la anterior» marca la casilla y la vista previa muestra el cierre", async () => {
    const user = userEvent.setup();
    mockUsePreview.mockImplementation((payload: BatchTemplateAssignmentPayload) =>
      payload.closePreviousAssignment
        ? previewOf({
            closures: [
              {
                employeeId: FERNANDO,
                employeeFullName: "Fernando Ruiz",
                assignmentId: OLD_ASSIGNMENT_ID,
                templateId: OLD_TEMPLATE_ID,
                templateName: "Foráneo",
                templateVersion: 1,
                effectiveFrom: "2026-08-01",
                effectiveTo: null,
                closeTo: "2026-08-31",
              },
            ],
          })
        : previewOf({ conflicts: [fernandoCloseDisabled] }),
    );
    renderSheet({ initialEmployeeIds: [FERNANDO], onOpenBlockingAssignment: vi.fn() });

    const checkbox = screen.getByRole("checkbox", {
      name: "Cerrar asignación anterior al iniciar la nueva",
    });
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();

    const preview = screen.getByTestId("batch-preview-conflicts");
    expect(
      within(preview).getByText(
        `Marca “Cerrar asignación anterior al iniciar la nueva” para que se cierre el ${formatDate("2026-08-31")}, o cambia las fechas para que no se crucen.`,
      ),
    ).toBeInTheDocument();
    expect(within(preview).queryByText(/Ir a su asignación/)).not.toBeInTheDocument();

    await user.click(within(preview).getByRole("button", { name: "Marcar cierre de la anterior" }));

    expect(checkbox).toBeChecked();
    expect(mockBatchMutate).not.toHaveBeenCalled();
    expect(screen.queryByTestId("batch-preview-conflicts")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        `Se cerrará la asignación anterior de 1 operador el ${formatDate("2026-08-31")}.`,
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ver detalle" }));
    expect(
      screen.getByText(`Fernando Ruiz — Foráneo versión 1, desde el ${formatDate("2026-08-01")}`),
    ).toBeInTheDocument();
  });

  it("(g) criterio 7: ningún fragmento de UUID en vista previa ni en resultado", async () => {
    const user = userEvent.setup();
    const unnamed: BatchAssignmentConflict = {
      employeeId: LUIS,
      code: "OVERLAPPING_ACTIVE_ASSIGNMENT",
    };
    mockUsePreview.mockReturnValue(previewOf({ conflicts: [fernandoConflict, unnamed] }));
    mockBatchMutate.mockResolvedValue(batchResult([ANA], [fernandoConflict, unnamed]));
    renderSheet({ initialEmployeeIds: [FERNANDO, ANA, LUIS] });

    expect(screen.getByText("Operador sin nombre")).toBeInTheDocument();
    expectNoUuidFragments();

    await user.click(screen.getByRole("button", { name: "Confirmar asignación" }));
    await screen.findByTestId("batch-assignment-result");
    expectNoUuidFragments();
  });

  it("(h) re-render con un arreglo nuevo de los mismos ids no reinicia la selección", async () => {
    const user = userEvent.setup();
    const { rerender, onOpenChange, onAssignmentsCreated, onSuccess } = renderSheet({
      initialEmployeeIds: [FERNANDO, ANA],
    });
    const rerenderWith = (initialEmployeeIds: string[]) =>
      rerender(
        <TemplateAssignmentBatchSheet
          open
          templateId={TEMPLATE_ID}
          initialEmployeeIds={initialEmployeeIds}
          onOpenChange={onOpenChange}
          onAssignmentsCreated={onAssignmentsCreated}
          onSuccess={onSuccess}
        />,
      );

    combobox.nextSelection = [LUIS];
    await user.click(screen.getByRole("button", { name: "Seleccionar operador" }));
    expect(selectedIds()).toEqual([LUIS]);

    rerenderWith([FERNANDO, ANA]);
    expect(selectedIds()).toEqual([LUIS]);

    rerenderWith([ANA]);
    await waitFor(() => expect(selectedIds()).toEqual([ANA]));
  });

  it("si la vista previa falla, avisa con una línea tenue y deja confirmar", () => {
    mockUsePreview.mockReturnValue({ data: undefined, isError: true });
    renderSheet({ initialEmployeeIds: [FERNANDO] });

    expect(screen.getByText("No se pudo verificar; puedes confirmar igual")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar asignación" })).toBeEnabled();
  });

  it("oculta la vista previa conservada cuando ya no aplica (sin operadores)", () => {
    mockUsePreview.mockReturnValue(previewOf({ conflicts: [fernandoConflict] }));
    renderSheet();

    expect(screen.queryByTestId("batch-preview-conflicts")).not.toBeInTheDocument();
  });

  it("initialEffectiveFrom gana sobre el inicio del pago", () => {
    renderSheet({
      initialEffectiveFrom: "2026-10-01",
      paymentPeriodStart: "2026-09-09",
      paymentPeriodEnd: "2026-09-26",
    });

    expect(screen.getByRole("button", { name: /Vigente desde/i })).toHaveTextContent(
      formatDate("2026-10-01"),
    );
  });

  it("usa periodStart del pago como vigencia por defecto y avisa si no cubre el período", async () => {
    const user = userEvent.setup();
    renderSheet({ paymentPeriodStart: "2026-09-09", paymentPeriodEnd: "2026-09-26" });

    expect(screen.getByText(/Para cubrir el pago del/i)).toBeInTheDocument();
    const fromField = screen.getByRole("button", { name: /Vigente desde/i });
    expect(fromField).toHaveTextContent(formatDate("2026-09-09"));

    await user.click(fromField);
    await user.click(screen.getByRole("button", { name: "29" }));

    expect(
      await screen.findByText(/Esta vigencia no cubre el período del pago/i),
    ).toBeInTheDocument();
  });
});
