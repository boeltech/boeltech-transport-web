import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/renderWithProviders";
import { SettlementCutWizardPage } from "./SettlementCutWizardPage";

const { previewData, createMutateAsync, mockToast } = vi.hoisted(() => ({
  previewData: {
    current: null as unknown,
  },
  createMutateAsync: vi.fn(),
  mockToast: vi.fn(),
}));

vi.mock("../../application/hooks", async () => {
  const actual = await vi.importActual<typeof import("../../application/hooks")>(
    "../../application/hooks",
  );
  return {
    ...actual,
    useSettlementCutPreview: () => ({
      data: previewData.current,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    }),
    useCreateSettlementCut: () => ({
      isPending: false,
      mutateAsync: createMutateAsync,
    }),
  };
});

vi.mock("@shared/hooks", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...mod,
    useToast: () => ({ toast: mockToast }),
  };
});

const previewFixture = {
  periodStart: "2026-11-03",
  periodEnd: "2026-11-09",
  salaryPeriod: "weekly" as const,
  includeContractors: false,
  eligible: [
    {
      employeeId: "emp-ready",
      employeeFullName: "Juan Pérez",
      employmentType: "employee",
      salaryPeriod: "weekly" as const,
      estimatedNet: 10000,
      estimatedGross: 11000,
      maxAdvanceDeductible: null,
      suggestedAdvanceDeduction: null,
      tripIds: ["t1"],
      warnings: [],
      effect: "includable" as const,
      primaryReason: null,
      periodOverlap: null,
      suggestedPeriodStart: null,
      openAdvancesBalance: 0,
    },
    {
      employeeId: "emp-block",
      employeeFullName: "Sofía Ramos",
      employmentType: "employee",
      salaryPeriod: "weekly" as const,
      estimatedNet: 0,
      estimatedGross: 8000,
      maxAdvanceDeductible: null,
      suggestedAdvanceDeduction: null,
      tripIds: ["t2"],
      warnings: [
        {
          code: "deductions_exceed_capacity" as const,
          message: "Descuentos superan el total",
        },
      ],
      effect: "blocking" as const,
      primaryReason: "deductions_exceed_capacity" as const,
      periodOverlap: null,
      suggestedPeriodStart: null,
      openAdvancesBalance: 9000,
    },
  ],
  excluded: [
    {
      employeeId: "emp-out",
      employeeFullName: "Martín Salas",
      employmentType: "employee",
      salaryPeriod: "weekly" as const,
      estimatedNet: null,
      estimatedGross: null,
      maxAdvanceDeductible: null,
      suggestedAdvanceDeduction: null,
      tripIds: [],
      warnings: [
        {
          code: "no_payable_template" as const,
          message: "Sin tarifa asignada",
        },
      ],
      effect: "excluded" as const,
      primaryReason: "no_payable_template" as const,
      periodOverlap: null,
      suggestedPeriodStart: null,
      openAdvancesBalance: 0,
    },
  ],
  summary: {
    eligibleCount: 2,
    includableCount: 1,
    blockingCount: 1,
    excludedCount: 1,
    estimatedNetTotal: 10000,
    maxRows: 100,
  },
};

function renderWizard() {
  return renderWithProviders(<SettlementCutWizardPage />, {
    route: "/finance/operator-payments/cuts/new",
    path: "/finance/operator-payments/cuts/new",
  });
}

describe("SettlementCutWizardPage (F6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    previewData.current = previewFixture;
    createMutateAsync.mockResolvedValue({
      created: [
        {
          employeeId: "emp-ready",
          settlementId: "set-1",
          settlementNumber: "P-100",
          status: "pending_approval",
          netAmount: 10000,
        },
      ],
      omitted: [],
      idempotentReplay: false,
      message: "1 pago(s) creados correctamente",
    });
  });

  it("muestra Periodo y avanza a Revisar con chips Con aviso por defecto", async () => {
    const user = userEvent.setup();
    renderWizard();

    expect(await screen.findByTestId("cut-step-period")).toBeInTheDocument();
    expect(screen.getByText(/operadores en este periodo/i)).toBeInTheDocument();
    expect(screen.getByTestId("cut-period-eligible-summary")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Incluir contratistas"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Por defecto no entran al corte\. Márcalo solo si también les armamos pago en este ritmo\./i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Fuera = ritmo\/tarifa distinto; no entran al enviar\. Bloqueados entran a Revisar/i,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/opt-in/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/elegibles/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(await screen.findByTestId("cut-step-review")).toBeInTheDocument();
    expect(screen.getByTestId("cut-chip-with_warning")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByText("Sofía Ramos")).toBeInTheDocument();
    expect(screen.getByText("Bloqueado")).toBeInTheDocument();
    expect(screen.getByText(/Fuera de este corte/i)).toBeInTheDocument();
  });

  it("Enviar N solo incluye filas includable (no blocking)", async () => {
    const user = userEvent.setup();
    renderWizard();

    await user.click(await screen.findByRole("button", { name: "Siguiente" }));
    await user.click(await screen.findByTestId("cut-send-n"));

    await waitFor(() => {
      expect(createMutateAsync).toHaveBeenCalled();
    });

    const call = createMutateAsync.mock.calls[0]?.[0];
    expect(call.payload.rows).toEqual([
      { employeeId: "emp-ready", tripIds: ["t1"] },
    ]);
    expect(call.payload.submitForApproval).toBe(true);
    expect(call.idempotencyKey).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    expect(await screen.findByTestId("cut-step-send")).toBeInTheDocument();
    expect(screen.getByText(/P-100/)).toBeInTheDocument();
    expect(screen.getByText(/1 pago creado/i)).toBeInTheDocument();
  });

  it("C29/C30/C31: badge humano, No entraron, sin pie tras create", async () => {
    const user = userEvent.setup();
    renderWizard();

    expect(
      screen.getByRole("heading", { name: /Corte semanal ·/i }),
    ).toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: "Siguiente" }));
    await user.click(await screen.findByTestId("cut-send-n"));

    expect(await screen.findByTestId("cut-step-send")).toBeInTheDocument();
    expect(screen.getByText("En autorización")).toBeInTheDocument();
    expect(screen.queryByText("pending_approval")).not.toBeInTheDocument();

    expect(screen.getByTestId("cut-did-not-enter")).toBeInTheDocument();
    expect(screen.getByText(/No entraron · 2/i)).toBeInTheDocument();
    expect(screen.getByText("Sofía Ramos")).toBeInTheDocument();
    expect(screen.getByText("Martín Salas")).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: "Anterior" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Ir a En autorización/i }),
    ).toBeInTheDocument();
  });

  it("D6: Confirmar sin km incluye fila con acknowledgeZeroKmTrips", async () => {
    const user = userEvent.setup();
    previewData.current = {
      ...previewFixture,
      eligible: [
        previewFixture.eligible[0],
        {
          employeeId: "emp-zero",
          employeeFullName: "Luis Sin Km",
          employmentType: "employee",
          salaryPeriod: "weekly" as const,
          estimatedNet: 1500,
          estimatedGross: 1500,
          maxAdvanceDeductible: null,
          suggestedAdvanceDeduction: null,
          tripIds: ["t-zero"],
          warnings: [
            {
              code: "missing_ack_zero_km" as const,
              message: "Hay viajes sin km",
            },
          ],
          effect: "blocking" as const,
          primaryReason: "missing_ack_zero_km" as const,
          periodOverlap: null,
          suggestedPeriodStart: null,
          openAdvancesBalance: 0,
        },
      ],
      summary: {
        ...previewFixture.summary,
        eligibleCount: 2,
        includableCount: 1,
        blockingCount: 1,
      },
    };

    renderWizard();
    await user.click(await screen.findByRole("button", { name: "Siguiente" }));

    expect(screen.getByText("Falta confirmar km")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    await user.click(await screen.findByTestId("cut-send-n"));
    await waitFor(() => {
      expect(createMutateAsync).toHaveBeenCalled();
    });

    const rows = createMutateAsync.mock.calls[0]?.[0].payload.rows;
    expect(rows).toEqual(
      expect.arrayContaining([
        { employeeId: "emp-ready", tripIds: ["t1"] },
        {
          employeeId: "emp-zero",
          tripIds: ["t-zero"],
          acknowledgeZeroKmTrips: true,
        },
      ]),
    );
  });
});
