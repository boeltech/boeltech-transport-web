import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/renderWithProviders";
import { resetAuthMock, setMockAuthUser } from "@/test/mocks/auth";
import { grantPermissions } from "@/test/mocks/permissions";
import { mockToast } from "@/test/mocks/toast";
import { SettlementActions } from "./SettlementActions";
import type { DriverSettlement } from "../../domain/entities";
import type { ApprovalBlock, SelfApprovalPolicy } from "@features/approvals";
import { ApiError } from "@shared/api/interceptors/error-handler";

Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => undefined;
Element.prototype.releasePointerCapture ??= () => undefined;

function makeApproval(overrides: Partial<ApprovalBlock> = {}): ApprovalBlock {
  return {
    flowStatus: "in_progress",
    stepCurrent: 1,
    stepsTotal: 1,
    pendingFor: { roles: ["manager"], users: [] },
    signedSteps: [],
    routedBy: {
      tierIndex: null,
      minAmount: null,
      matchedConditions: [],
      policyVersion: null,
      lazy: false,
    },
    canAct: true,
    cannotActReason: null,
    escalated: false,
    reapproval: null,
    returned: null,
    ...overrides,
  };
}

const mockApproveSettlement = vi.fn();
const mockRejectSettlement = vi.fn();
const mockSubmitSettlement = vi.fn();
const mockCancelSettlement = vi.fn();
const mockReturnSettlement = vi.fn();
interface SettingsQueryState {
  data:
    | { voboThresholdMxn: number; activeApproverCount: number; activeExecutorCount: number }
    | undefined;
  isSuccess: boolean;
  isLoading: boolean;
  isError: boolean;
}
const mockSettingsQuery = vi.fn<() => SettingsQueryState>(() => ({
  data: { voboThresholdMxn: 0, activeApproverCount: 2, activeExecutorCount: 2 },
  isSuccess: true,
  isLoading: false,
  isError: false,
}));

vi.mock("@shared/permissions", async () =>
  (await import("@/test/mocks/permissions")).permissionsModuleMock(),
);

vi.mock("@features/auth", async () =>
  (await import("@/test/mocks/auth")).authModuleMock(),
);

vi.mock("@shared/hooks", async () =>
  (await import("@/test/mocks/toast")).toastHooksMock(),
);

vi.mock("../../application/hooks/useSettlementSettings", () => ({
  useSettlementSettings: () => mockSettingsQuery(),
}));

vi.mock("../../infrastructure/settlementsApi", () => ({
  settlementsApi: {
    approveSettlement: (...args: unknown[]) => mockApproveSettlement(...args),
    rejectSettlement: (...args: unknown[]) => mockRejectSettlement(...args),
    submitSettlement: (...args: unknown[]) => mockSubmitSettlement(...args),
    cancelSettlement: (...args: unknown[]) => mockCancelSettlement(...args),
    returnSettlement: (...args: unknown[]) => mockReturnSettlement(...args),
  },
}));

const mockSelfApprovalPolicy = vi.fn<() => SelfApprovalPolicy | undefined>();

vi.mock("@features/approvals", async () => ({
  ...(await import("@features/approvals/testing/selfApprovalTestModule")),
  invalidateApprovalsRelatedQueries: vi.fn(),
  useSelfApprovalPolicy: () => ({ data: mockSelfApprovalPolicy() }),
}));

function makePolicy(
  overrides: Partial<Record<keyof SelfApprovalPolicy, boolean>> = {},
): SelfApprovalPolicy {
  const entry = (allowed = false) => ({
    allowed,
    activeCounterpartCount: allowed ? 0 : 1,
  });
  return {
    advanceApprove: entry(overrides.advanceApprove),
    advanceDisburse: entry(overrides.advanceDisburse),
    settlementApprove: entry(overrides.settlementApprove),
    settlementDisburse: entry(overrides.settlementDisburse),
    tripExpenseApprove: entry(overrides.tripExpenseApprove),
  };
}

const sampleSettlement: DriverSettlement = {
  id: "set-1",
  tenantId: "tenant-1",
  settlementNumber: "LIQ-202608-0001",
  settlementKind: "regular",
  employeeId: "emp-1",
  employeeFullName: "Pedro Infante",
  agreementSnapshot: { currency: "MXN" },
  periodStart: "2026-08-01",
  periodEnd: "2026-08-15",
  status: "pending_approval",
  totalTripsCommission: 2500,
  totalBaseSalary: 0,
  totalReimbursableExpenses: 0,
  totalBonuses: 0,
  totalAdvancesDeducted: 0,
  totalOtherDeductions: 0,
  grossAmount: 2500,
  netAmount: 2500,
  currency: "MXN",
  submittedBy: "user-creator-123",
  disbursedAt: null,
  disbursedBy: null,
  disbursementMethod: null,
  disbursementReference: null,
  approvedAt: null,
  approvedBy: null,
  rejectionReason: null,
  notes: null,
  createdAt: "2026-08-15T10:00:00Z",
  updatedAt: "2026-08-15T10:00:00Z",
};

const draftSettlement: DriverSettlement = {
  ...sampleSettlement,
  status: "draft",
  submittedBy: null,
};

describe("SettlementActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSettingsQuery.mockReturnValue({
      data: { voboThresholdMxn: 0, activeApproverCount: 2, activeExecutorCount: 2 },
      isSuccess: true,
      isLoading: false,
      isError: false,
    });
    grantPermissions(["settlements.update", "settlements.execute"]);
    resetAuthMock();
    setMockAuthUser({ id: "user-approver-999" });
    mockSelfApprovalPolicy.mockReturnValue(makePolicy());
  });

  it("muestra autorizar/rechazar cuando el revisor no es el solicitante", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SettlementActions settlement={sampleSettlement} onView={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: /abrir menú de acciones/i }));
    expect(screen.getByText("Autorizar")).toBeInTheDocument();
    expect(screen.getByText("Rechazar")).toBeInTheDocument();
    expect(screen.queryByText("Enviar a autorización")).not.toBeInTheDocument();
  });

  it("ADR-0098 blocked_own: el solicitante ve «Enviada por ti» deshabilitado en el menú", async () => {
    setMockAuthUser({ id: "user-creator-123" });
    const user = userEvent.setup();
    renderWithProviders(
      <SettlementActions settlement={sampleSettlement} onView={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: /abrir menú de acciones/i }));
    const ownRow = screen.getByRole("menuitem", { name: /Enviada por ti/i });
    expect(ownRow).toHaveAttribute("aria-disabled", "true");
    expect(ownRow).toHaveTextContent(/Debe autorizarla otra persona/i);
    expect(screen.queryByText("Autorizar")).not.toBeInTheDocument();
    expect(screen.queryByText("Rechazar")).not.toBeInTheDocument();
  });

  it("ADR-0098 blocked_own: falla cerrado si la política no cargó", async () => {
    mockSelfApprovalPolicy.mockReturnValue(undefined);
    setMockAuthUser({ id: "user-creator-123" });
    renderWithProviders(
      <SettlementActions variant="buttons" settlement={sampleSettlement} />,
    );

    expect(screen.getByText("Enviada por ti")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Autorizar$/i })).not.toBeInTheDocument();
  });

  it("ADR-0098 self_confirm: el admin único autoriza lo propio tras confirmar", async () => {
    mockSelfApprovalPolicy.mockReturnValue(makePolicy({ settlementApprove: true }));
    setMockAuthUser({ id: "user-creator-123" });
    mockApproveSettlement.mockResolvedValue({ ...sampleSettlement, status: "approved" });
    const user = userEvent.setup();
    renderWithProviders(
      <SettlementActions settlement={sampleSettlement} onView={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: /abrir menú de acciones/i }));
    expect(screen.queryByText("Enviada por ti")).not.toBeInTheDocument();
    await user.click(screen.getByText("Autorizar"));
    expect(
      await screen.findByText("¿Autorizar tu propia solicitud?"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Tú enviaste este pago/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sí, autorizar" }));
    expect(mockApproveSettlement).toHaveBeenCalledWith("set-1");
  });

  it("ADR-0098 self_confirm: el ejecutor único ve Registrar pago con aviso de autoacción", async () => {
    mockSelfApprovalPolicy.mockReturnValue(makePolicy({ settlementDisburse: true }));
    setMockAuthUser({ id: "user-creator-123" });
    const user = userEvent.setup();
    renderWithProviders(
      <SettlementActions
        variant="buttons"
        onDisburse={vi.fn()}
        settlement={{
          ...sampleSettlement,
          status: "approved",
          createdBy: "user-creator-123",
          submittedBy: "user-creator-123",
        }}
      />,
    );

    expect(screen.queryByText("Enviada por ti")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Registrar pago/i }));
    expect(
      await screen.findByText("¿Registrar el pago de tu propia solicitud?"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Tú registraste este pago/i)).toBeInTheDocument();
  });

  it("ADR-0098: la política ignora los conteos de settings", () => {
    mockSettingsQuery.mockReturnValue({
      data: { voboThresholdMxn: 0, activeApproverCount: 1, activeExecutorCount: 1 },
      isSuccess: true,
      isLoading: false,
      isError: false,
    });
    setMockAuthUser({ id: "user-creator-123" });
    renderWithProviders(
      <SettlementActions variant="buttons" settlement={sampleSettlement} />,
    );

    expect(screen.getByText("Enviada por ti")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Autorizar$/i })).not.toBeInTheDocument();
  });

  it("muestra Enviar a autorización en borrador que lo requiere", () => {
    renderWithProviders(
      <SettlementActions
        variant="buttons"
        settlement={{
          ...draftSettlement,
          voboRequired: true,
          createdBy: "user-creator-123",
        }}
      />,
    );

    expect(screen.getByRole("button", { name: /Enviar a autorización/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Enviar para autorización/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Registrar pago/i }),
    ).not.toBeInTheDocument();
  });

  it("draft en menú muestra Enviar a autorización y Cancelar pago", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SettlementActions settlement={draftSettlement} onView={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: /abrir menú de acciones/i }));
    expect(screen.getByText("Enviar a autorización")).toBeInTheDocument();
    expect(screen.getByText("Cancelar pago…")).toBeInTheDocument();
    expect(screen.queryByText("Rechazar")).not.toBeInTheDocument();
  });

  describe("cancelar pago sin dispersar", () => {
    const approvedSettlement: DriverSettlement = {
      ...sampleSettlement,
      status: "approved",
      approval: null,
    };

    const renderActions = (settlement: DriverSettlement) => {
      const onActionComplete = vi.fn();
      renderWithProviders(
        <SettlementActions
          settlement={settlement}
          onView={vi.fn()}
          onActionComplete={onActionComplete}
        />,
      );
      return { onActionComplete };
    };

    it("autorizado: exige motivo y lo envía con el estado esperado", async () => {
      const user = userEvent.setup();
      mockCancelSettlement.mockResolvedValue({ ...approvedSettlement, status: "cancelled" });
      const { onActionComplete } = renderActions(approvedSettlement);

      await user.click(screen.getByRole("button", { name: /abrir menú de acciones/i }));
      await user.click(screen.getByText("Cancelar pago…"));

      expect(screen.getByText("Si ya entregaste el efectivo, no canceles.")).toBeInTheDocument();
      expect(screen.getByText(/Se anula la autorización y los anticipos/)).toBeInTheDocument();

      const confirmButton = screen.getByRole("button", { name: "Sí, cancelar pago" });
      expect(confirmButton).toBeDisabled();
      await user.click(screen.getByRole("checkbox", { name: /Confirmo que este pago no se ha entregado/ }));
      expect(confirmButton).toBeEnabled();

      await user.click(confirmButton);
      expect(screen.getByText("El motivo debe tener al menos 5 caracteres")).toBeInTheDocument();
      expect(mockCancelSettlement).not.toHaveBeenCalled();

      await user.type(screen.getByLabelText("Motivo"), "Incluir reembolso aprobado tarde");
      await user.click(confirmButton);

      await waitFor(() =>
        expect(mockCancelSettlement).toHaveBeenCalledWith("set-1", {
          reason: "Incluir reembolso aprobado tarde",
          expectedStatus: "approved",
        }),
      );
      await waitFor(() => expect(onActionComplete).toHaveBeenCalled());
    });

    it("borrador: confirma sin motivo", async () => {
      const user = userEvent.setup();
      mockCancelSettlement.mockResolvedValue({ ...draftSettlement, status: "cancelled" });
      renderActions(draftSettlement);

      await user.click(screen.getByRole("button", { name: /abrir menú de acciones/i }));
      await user.click(screen.getByText("Cancelar pago…"));
      expect(screen.queryByLabelText("Motivo")).not.toBeInTheDocument();
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
      expect(screen.queryByText("Si ya entregaste el efectivo, no canceles.")).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Sí, cancelar pago" }));

      await waitFor(() =>
        expect(mockCancelSettlement).toHaveBeenCalledWith("set-1", {
          reason: undefined,
          expectedStatus: "draft",
        }),
      );
    });

    it("error del API se muestra dentro del diálogo", async () => {
      const user = userEvent.setup();
      mockCancelSettlement.mockRejectedValue(
        new ApiError("La liquidación cambió de estado", 409, "SETTLEMENT_NOT_MUTABLE"),
      );
      renderActions(approvedSettlement);

      await user.click(screen.getByRole("button", { name: /abrir menú de acciones/i }));
      await user.click(screen.getByText("Cancelar pago…"));
      await user.click(screen.getByRole("checkbox", { name: /Confirmo que este pago no se ha entregado/ }));
      await user.type(screen.getByLabelText("Motivo"), "Incluir reembolso aprobado tarde");
      await user.click(screen.getByRole("button", { name: "Sí, cancelar pago" }));

      expect(await screen.findByText("La liquidación cambió de estado")).toBeInTheDocument();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("dispersado: no ofrece Cancelar pago", async () => {
      const user = userEvent.setup();
      renderActions({ ...approvedSettlement, status: "disbursed" });

      await user.click(screen.getByRole("button", { name: /abrir menú de acciones/i }));
      expect(screen.queryByText("Cancelar pago…")).not.toBeInTheDocument();
    });
  });

  it("oculta Registrar pago al maker en bypass (borrador sin VoBo)", () => {
    setMockAuthUser({ id: "user-creator-123" });
    renderWithProviders(
      <SettlementActions
        variant="buttons"
        settlement={{
          ...draftSettlement,
          voboRequired: false,
          createdBy: "user-creator-123",
        }}
      />,
    );

    expect(screen.getByText("Enviada por ti")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Registrar pago/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Enviar a autorización/i })).not.toBeInTheDocument();
  });

  it("permite Registrar pago desde borrador bypass si no es el maker", () => {
    renderWithProviders(
      <SettlementActions
        variant="buttons"
        settlement={{
          ...draftSettlement,
          voboRequired: false,
          createdBy: "user-creator-123",
        }}
      />,
    );

    expect(screen.getByRole("button", { name: /Registrar pago/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Enviar a autorización/i })).not.toBeInTheDocument();
  });

  it("oculta Registrar pago al maker en Autorizado", () => {
    setMockAuthUser({ id: "user-creator-123" });
    renderWithProviders(
      <SettlementActions
        variant="buttons"
        settlement={{
          ...sampleSettlement,
          status: "approved",
          createdBy: "user-creator-123",
          submittedBy: "user-creator-123",
        }}
      />,
    );

    expect(screen.getByText("Enviada por ti")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Registrar pago/i }),
    ).not.toBeInTheDocument();
  });

  it("aviso de umbral no bloquea CTAs cuando falla la lectura de settings", () => {
    mockSettingsQuery.mockReturnValue({
      data: undefined,
      isSuccess: false,
      isLoading: false,
      isError: true,
    });
    renderWithProviders(
      <SettlementActions
        variant="buttons"
        settlement={{
          ...sampleSettlement,
          status: "approved",
          createdBy: "user-creator-123",
          submittedBy: "user-creator-123",
        }}
      />,
    );

    expect(screen.getByRole("button", { name: /Registrar pago/i })).toBeInTheDocument();
    expect(
      screen.getByText(/No pudimos leer la regla de autorización de liquidaciones/i),
    ).toBeInTheDocument();
  });

  describe("F6c (ADR-0099 / ADR-0085 E10)", () => {
    const withApproval = (overrides: Partial<ApprovalBlock> = {}): DriverSettlement => ({
      ...sampleSettlement,
      approvalRevision: "rev-7",
      approval: makeApproval(overrides),
    });

    it("«Devolver para corregir» pide motivo y envía guardas", async () => {
      const user = userEvent.setup();
      mockReturnSettlement.mockResolvedValueOnce({ ...sampleSettlement, status: "draft" });
      renderWithProviders(
        <SettlementActions variant="buttons" settlement={withApproval()} />,
      );

      await user.click(screen.getByRole("button", { name: /Devolver para corregir/i }));
      await user.type(await screen.findByLabelText(/^motivo$/i), "Falta el bono de puntualidad");
      await user.click(screen.getByRole("button", { name: "Devolver" }));

      await waitFor(() => {
        expect(mockReturnSettlement).toHaveBeenCalledWith(
          "set-1",
          expect.objectContaining({
            reason: "Falta el bono de puntualidad",
            guards: { expectedStep: 1, expectedRevision: "rev-7" },
          }),
        );
      });
      expect(mockToast.toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Pago devuelto para corregir" }),
      );
    });

    it("Rechazar vive en ⋯ y usa el Sheet con guardas", async () => {
      const user = userEvent.setup();
      mockRejectSettlement.mockResolvedValueOnce({ ...sampleSettlement, status: "rejected" });
      renderWithProviders(
        <SettlementActions variant="buttons" settlement={withApproval()} />,
      );

      expect(screen.queryByRole("button", { name: /^Rechazar$/i })).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /Más acciones/i }));
      await user.click(await screen.findByRole("menuitem", { name: /Rechazar/i }));
      await user.type(
        await screen.findByLabelText(/razón del rechazo/i),
        "El periodo no corresponde a este operador",
      );
      await user.click(screen.getByRole("button", { name: "Rechazar" }));

      await waitFor(() => {
        expect(mockRejectSettlement).toHaveBeenCalledWith(
          "set-1",
          "El periodo no corresponde a este operador",
          { expectedStep: 1, expectedRevision: "rev-7" },
        );
      });
    });

    it("una guarda (409) al autorizar avisa, recarga y no reintenta", async () => {
      const user = userEvent.setup();
      mockApproveSettlement.mockRejectedValueOnce(
        Object.assign(new Error("stale"), { code: "APPROVAL_STEP_CHANGED" }),
      );
      renderWithProviders(
        <SettlementActions variant="buttons" settlement={withApproval()} />,
      );

      await user.click(screen.getByRole("button", { name: /Autorizar/i }));
      await user.click(await screen.findByRole("button", { name: /Sí, autorizar pago/i }));

      await waitFor(() => {
        expect(mockToast.toast).toHaveBeenCalledWith(expect.objectContaining({ variant: "warning" }));
      });
      expect(mockApproveSettlement).toHaveBeenCalledTimes(1);
      expect(mockApproveSettlement).toHaveBeenCalledWith("set-1", {
        expectedStep: 1,
        expectedRevision: "rev-7",
      });
    });

    it("tope de descuentos: el 422 al autorizar cierra y avisa con el texto del API", async () => {
      const user = userEvent.setup();
      const apiMessage =
        "Los descuentos superan lo que el operador ganó en este corte. Devuelve la liquidación a borrador para ajustar los anticipos.";
      mockApproveSettlement.mockRejectedValueOnce(
        new ApiError(apiMessage, 422, "SETTLEMENT_DEDUCTIONS_EXCEED_GROSS", {
          path: ["advances_to_apply"],
        }),
      );
      renderWithProviders(
        <SettlementActions variant="buttons" settlement={withApproval()} />,
      );

      await user.click(screen.getByRole("button", { name: /Autorizar/i }));
      await user.click(await screen.findByRole("button", { name: /Sí, autorizar pago/i }));

      await waitFor(() => {
        expect(mockToast.toast).toHaveBeenCalledWith({
          title: "Los descuentos superan lo ganado",
          description: apiMessage,
          variant: "error",
        });
      });
    });

    it("D5: la confirmación de autorizar dice «Ya estaba autorizado» (diff vacío: sin lista)", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <SettlementActions
          variant="buttons"
          settlement={withApproval({
            reapproval: {
              invalidatedAt: "2026-10-02T20:10:00.000Z",
              previousInstanceId: "inst-0",
              previousStatus: "approved",
              changes: [],
            },
          })}
        />,
      );

      await user.click(screen.getByRole("button", { name: /Autorizar/i }));
      expect(await screen.findByRole("alertdialog")).toHaveTextContent(
        "Ya estaba autorizado; se corrigió y requiere nueva firma.",
      );
    });

    it("«Corregir» aparece solo con onCorrect y en estados corregibles", async () => {
      const user = userEvent.setup();
      const onCorrect = vi.fn();
      const { rerender } = renderWithProviders(
        <SettlementActions
          variant="buttons"
          settlement={{ ...sampleSettlement, status: "approved" }}
          onCorrect={onCorrect}
        />,
      );

      await user.click(screen.getByRole("button", { name: "Corregir" }));
      expect(onCorrect).toHaveBeenCalledTimes(1);

      rerender(
        <SettlementActions
          variant="buttons"
          settlement={{ ...sampleSettlement, status: "disbursed" }}
          onCorrect={onCorrect}
        />,
      );
      expect(screen.queryByRole("button", { name: "Corregir" })).not.toBeInTheDocument();
    });

    it("devuelta en menú: «Reenviar sin cambios» en lugar de «Enviar a autorización»", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <SettlementActions
          settlement={{
            ...draftSettlement,
            approval: makeApproval({ flowStatus: "returned", stepCurrent: null, canAct: false }),
          }}
          onView={vi.fn()}
        />,
      );

      await user.click(screen.getByRole("button", { name: /Abrir menú de acciones/i }));
      expect(screen.getByText("Reenviar sin cambios")).toBeInTheDocument();
      expect(screen.queryByText("Enviar a autorización")).not.toBeInTheDocument();
    });
  });
});
