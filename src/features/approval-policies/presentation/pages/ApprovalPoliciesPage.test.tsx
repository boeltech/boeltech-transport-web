import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { ApiError } from "@shared/api/interceptors/error-handler";
import type { ApprovalPoliciesOverview, ConceptPolicy } from "../../domain";
import { TEMPLATE_LABELS, approvalPoliciesCopy } from "../copy/approvalPoliciesCopy";
import { ApprovalPoliciesPage } from "./ApprovalPoliciesPage";

const mockApi = vi.hoisted(() => ({
  getOverview: vi.fn(),
  save: vi.fn(),
  reset: vi.fn(),
  listVersions: vi.fn(),
  simulate: vi.fn(),
  listCandidateUsers: vi.fn(),
}));
const mockPermissions = vi.hoisted(() => ({ granted: new Set<string>() }));
const mockToast = vi.hoisted(() => vi.fn());

vi.mock("../../infrastructure/approvalPoliciesApi", () => ({ approvalPoliciesApi: mockApi }));

vi.mock("@shared/permissions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@shared/permissions")>()),
  usePermissions: () => ({
    hasPermission: (module: string, action: string) => mockPermissions.granted.has(`${module}.${action}`),
  }),
}));

vi.mock("@shared/hooks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@shared/hooks")>()),
  useToast: () => ({ toast: mockToast }),
}));

const ceilingStep = { eligibleRoles: ["admin", "manager", "accountant"] as const, eligibleUserIds: [] };

function policy(concept: ConceptPolicy["concept"], overrides: Partial<ConceptPolicy> = {}): ConceptPolicy {
  return {
    concept,
    source: "system_default",
    version: null,
    effectiveFrom: null,
    createdBy: null,
    createdByName: null,
    rules: {
      rulesSchemaVersion: 1,
      tiers: [
        {
          minAmount: 0,
          conditions: {},
          requiresApproval: true,
          steps: [
            {
              eligibleRoles: concept === "disbursement" ? ["admin", "accountant"] : [...ceilingStep.eligibleRoles],
              eligibleUserIds: [],
            },
          ],
        },
      ],
    },
    summary: "Cualquier autorizador",
    pendingRequests: 0,
    voboThresholdMxn: concept === "settlement" ? 0 : null,
    standardVoboThresholdMxn: concept === "settlement" ? 0 : null,
    ...overrides,
  };
}

function overview(editEnabled: boolean, settlement: Partial<ConceptPolicy> = {}): ApprovalPoliciesOverview {
  return {
    editEnabled,
    concepts: [
      policy("driver_advance"),
      policy("trip_expense"),
      policy("settlement", settlement),
      policy("disbursement"),
    ],
  };
}

function renderPage(path = "/settings/approvals") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <ApprovalPoliciesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const sheetCopy = approvalPoliciesCopy.sheet;

const ACTIVE_USERS = [
  { id: "u-admin", fullName: "Ana Admin", role: "admin" },
  { id: "u-mgr", fullName: "Mario Gerente", role: "manager" },
];

async function openSettlementEditorAndSave() {
  const user = userEvent.setup();
  renderPage("/settings/approvals?concept=settlement");
  const dialog = await screen.findByRole("dialog");
  await user.click(within(dialog).getByRole("button", { name: sheetCopy.save }));
  const confirm = await screen.findByRole("alertdialog");
  await user.click(within(confirm).getByRole("button", { name: approvalPoliciesCopy.confirm.confirm }));
  return { user, dialog };
}

describe("ApprovalPoliciesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPermissions.granted = new Set(["approval_policies.read", "approval_policies.update"]);
    mockApi.listCandidateUsers.mockResolvedValue({ users: ACTIVE_USERS, referencedUsers: [] });
  });

  describe("personas designadas con el padrón de candidatos (web#45)", () => {
    const REFERENCED = [
      { id: "u-old", fullName: "Olga Antigua", role: "manager", status: "inactive" },
      { id: "u-pending", fullName: "Paula Pendiente", role: "manager", status: "pending_activation" },
      { id: "u-disp", fullName: "Diego Despacho", role: "dispatcher", status: "active" },
    ];

    function settlementNaming(ids: string[]): ApprovalPoliciesOverview {
      return overview(true, {
        source: "tenant",
        version: 2,
        effectiveFrom: "2026-10-01T00:00:00Z",
        rules: {
          rulesSchemaVersion: 1,
          tiers: [
            {
              minAmount: 0,
              conditions: {},
              requiresApproval: true,
              steps: [{ eligibleRoles: ["admin"], eligibleUserIds: ids }],
            },
          ],
        },
      });
    }

    async function openSettlementStep() {
      renderPage("/settings/approvals?concept=settlement");
      const dialog = await screen.findByRole("dialog");
      return within(dialog).getByTestId("policy-tier-0-step-0");
    }

    beforeEach(() => {
      mockApi.listCandidateUsers.mockResolvedValue({ users: ACTIVE_USERS, referencedUsers: REFERENCED });
    });

    it("referenciado inactivo: chip con nombre y «Inactiva», fuera del conteo de elegibles", async () => {
      mockApi.getOverview.mockResolvedValue(settlementNaming(["u-old"]));
      const step = await openSettlementStep();
      const chip = await within(step).findByTestId("policy-tier-0-step-0-person-u-old");
      expect(chip).toHaveTextContent("Olga Antigua");
      expect(chip).toHaveTextContent(sheetCopy.personState.inactive);
      expect(within(step).getByTestId("policy-tier-0-step-0-eligible")).toHaveTextContent(sheetCopy.eligibleCount(1));
      expect(within(chip).getByRole("button", { name: sheetCopy.removePerson("Olga Antigua") })).toBeInTheDocument();
    });

    it("referenciado pending_activation: chip con nombre y «Sin activar» (web#49)", async () => {
      mockApi.getOverview.mockResolvedValue(settlementNaming(["u-pending"]));
      const step = await openSettlementStep();
      const chip = await within(step).findByTestId("policy-tier-0-step-0-person-u-pending");
      expect(chip).toHaveTextContent("Paula Pendiente");
      expect(chip).toHaveTextContent(sheetCopy.personState.pending_activation);
      expect(chip).not.toHaveTextContent(sheetCopy.personState.inactive);
      expect(within(step).getByTestId("policy-tier-0-step-0-eligible")).toHaveTextContent(
        sheetCopy.eligibleCount(1),
      );
    });

    it("referenciado activo con rol fuera del techo: «Sin permiso para autorizar» (no decide solo por status)", async () => {
      mockApi.getOverview.mockResolvedValue(settlementNaming(["u-disp"]));
      const step = await openSettlementStep();
      const chip = await within(step).findByTestId("policy-tier-0-step-0-person-u-disp");
      expect(chip).toHaveTextContent("Diego Despacho");
      expect(chip).toHaveTextContent(sheetCopy.personState.no_permission);
      expect(within(step).getByTestId("policy-tier-0-step-0-eligible")).toHaveTextContent(sheetCopy.eligibleCount(1));
    });

    it("usuario borrado: chip «Usuario no disponible» que se puede quitar", async () => {
      mockApi.getOverview.mockResolvedValue(settlementNaming(["u-gone"]));
      const user = userEvent.setup();
      const step = await openSettlementStep();
      const chip = await within(step).findByTestId("policy-tier-0-step-0-person-u-gone");
      expect(chip).toHaveTextContent(sheetCopy.personUnavailable);
      expect(chip).not.toHaveTextContent("u-gone");
      await user.click(within(chip).getByRole("button", { name: sheetCopy.removePerson(sheetCopy.personUnavailable) }));
      expect(within(step).queryByTestId("policy-tier-0-step-0-person-u-gone")).not.toBeInTheDocument();
    });

    it("error al cargar personas: alerta con «Reintentar» que vuelve a pedir el padrón", async () => {
      mockApi.getOverview.mockResolvedValue(overview(true));
      mockApi.listCandidateUsers
        .mockRejectedValueOnce(new ApiError("Falla", 500, "INTERNAL"))
        .mockResolvedValueOnce({ users: ACTIVE_USERS, referencedUsers: [] });
      const user = userEvent.setup({ delay: null });
      renderPage("/settings/approvals?concept=settlement");
      const dialog = await screen.findByRole("dialog");
      const alert = await within(dialog).findByTestId("policy-people-error");
      expect(alert).toHaveTextContent(sheetCopy.peopleLoadError);
      expect(within(dialog).queryByRole("button", { name: `${sheetCopy.peopleLabel} · ${sheetCopy.stepTitle(1)}` })).not.toBeInTheDocument();

      await user.click(within(alert).getByRole("button", { name: sheetCopy.peopleRetry }));
      await waitFor(() => expect(mockApi.listCandidateUsers).toHaveBeenCalledTimes(2));
      expect(
        await within(dialog).findByRole("button", { name: `${sheetCopy.peopleLabel} · ${sheetCopy.stepTitle(1)}` }),
      ).toBeInTheDocument();
      expect(within(dialog).queryByTestId("policy-people-error")).not.toBeInTheDocument();
    });

    it("error al cargar personas: chips designados siguen visibles y se pueden quitar (web#49)", async () => {
      mockApi.getOverview.mockResolvedValue(settlementNaming(["u-gone"]));
      mockApi.listCandidateUsers.mockRejectedValue(new ApiError("Falla", 500, "INTERNAL"));
      const user = userEvent.setup({ delay: null });
      renderPage("/settings/approvals?concept=settlement");
      const dialog = await screen.findByRole("dialog");
      expect(await within(dialog).findByTestId("policy-people-error")).toBeInTheDocument();

      const step = within(dialog).getByTestId("policy-tier-0-step-0");
      const chip = await within(step).findByTestId("policy-tier-0-step-0-person-u-gone");
      expect(chip).toHaveTextContent(sheetCopy.personUnavailable);
      expect(
        within(dialog).queryByRole("button", {
          name: `${sheetCopy.peopleLabel} · ${sheetCopy.stepTitle(1)}`,
        }),
      ).not.toBeInTheDocument();

      await user.click(
        within(chip).getByRole("button", {
          name: sheetCopy.removePerson(sheetCopy.personUnavailable),
        }),
      );
      expect(within(step).queryByTestId("policy-tier-0-step-0-person-u-gone")).not.toBeInTheDocument();
    });

    it("sin autorizadores activos: «No hay autorizadores activos» en lugar del selector", async () => {
      mockApi.getOverview.mockResolvedValue(overview(true));
      mockApi.listCandidateUsers.mockResolvedValue({ users: [], referencedUsers: [] });
      renderPage("/settings/approvals?concept=settlement");
      const dialog = await screen.findByRole("dialog");
      expect(await within(dialog).findByTestId("policy-tier-0-step-0-people-empty")).toHaveTextContent(
        sheetCopy.peopleNoneActive,
      );
      expect(within(dialog).getByTestId("policy-tier-0-step-0-eligible")).toHaveTextContent(sheetCopy.eligibleCount(0));
    });
  });

  it("estado estándar: 4 tarjetas con «Usando la regla estándar» y nota de piso", async () => {
    mockApi.getOverview.mockResolvedValue(overview(true));
    renderPage();
    expect(await screen.findByTestId("approval-policy-card-driver_advance")).toBeInTheDocument();
    expect(screen.getAllByText(approvalPoliciesCopy.card.standardText)).toHaveLength(4);
    expect(screen.getAllByText(approvalPoliciesCopy.floorNote.text).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: approvalPoliciesCopy.card.customize })).toHaveLength(4);
  });

  describe("umbral en la tarjeta Liquidaciones (D1/D2)", () => {
    const cardCopy = approvalPoliciesCopy.card;
    const thresholdRules = {
      rulesSchemaVersion: 1 as const,
      tiers: [
        { minAmount: 0, conditions: {}, requiresApproval: false, steps: [] },
        {
          minAmount: 5000,
          conditions: {},
          requiresApproval: true,
          steps: [{ eligibleRoles: [...ceilingStep.eligibleRoles], eligibleUserIds: [] }],
        },
      ],
    };

    it("estándar con umbral $5,000: el texto principal y la línea del umbral muestran el monto", async () => {
      mockApi.getOverview.mockResolvedValue(overview(true, { voboThresholdMxn: 5000, rules: thresholdRules }));
      renderPage();
      const card = await screen.findByTestId("approval-policy-card-settlement");
      expect(
        within(card).getByText("Usando la regla estándar: cualquier autorizador activo, desde $5,000.00"),
      ).toBeInTheDocument();
      expect(within(card).getByTestId("approval-policy-threshold")).toHaveTextContent(
        "Piden autorización los pagos desde $5,000.00.",
      );
      expect(within(card).getByText(cardCopy.manualAdjustmentsNote)).toBeInTheDocument();
      expect(screen.getAllByText(cardCopy.standardText)).toHaveLength(3);
    });

    it("estándar con umbral $0: «Todos los pagos piden autorización»", async () => {
      mockApi.getOverview.mockResolvedValue(overview(true));
      renderPage();
      const card = await screen.findByTestId("approval-policy-card-settlement");
      expect(within(card).getByText(cardCopy.standardText)).toBeInTheDocument();
      expect(within(card).getByTestId("approval-policy-threshold")).toHaveTextContent(
        cardCopy.settlementThresholdZero,
      );
    });

    it("personalizada: conserva el resumen y muestra el umbral que calcula el API", async () => {
      mockApi.getOverview.mockResolvedValue(
        overview(true, {
          source: "tenant",
          version: 3,
          effectiveFrom: "2026-10-01T00:00:00Z",
          summary: "Desde $8,000.00: cualquier autorizador",
          voboThresholdMxn: 8000,
        }),
      );
      renderPage();
      const card = await screen.findByTestId("approval-policy-card-settlement");
      expect(within(card).getByText(cardCopy.customBadge)).toBeInTheDocument();
      expect(within(card).getByText("Desde $8,000.00: cualquier autorizador")).toBeInTheDocument();
      expect(within(card).getByTestId("approval-policy-threshold")).toHaveTextContent(
        cardCopy.settlementThreshold("$8,000.00"),
      );
    });

    it("rev. 0.2: personalizada sin tramo por monto (null) dice que ningún pago pide autorización por monto", async () => {
      mockApi.getOverview.mockResolvedValue(
        overview(true, {
          source: "tenant",
          version: 2,
          effectiveFrom: "2026-10-01T00:00:00Z",
          summary: "Desde $0.00: sin autorización",
          voboThresholdMxn: null,
        }),
      );
      renderPage();
      const card = await screen.findByTestId("approval-policy-card-settlement");
      expect(within(card).getByTestId("approval-policy-threshold")).toHaveTextContent(
        "Ningún pago pide autorización por monto; solo las correcciones manuales.",
      );
      expect(within(card).queryByText(cardCopy.settlementThresholdZero)).not.toBeInTheDocument();
      expect(within(card).getByText(cardCopy.manualAdjustmentsNote)).toBeInTheDocument();
    });

    it("rev. 0.2: si el API no envía el campo (anterior a F1) no muestra línea de umbral", async () => {
      const settlement = policy("settlement");
      delete (settlement as { voboThresholdMxn?: number | null }).voboThresholdMxn;
      mockApi.getOverview.mockResolvedValue({
        editEnabled: true,
        concepts: [policy("driver_advance"), policy("trip_expense"), settlement, policy("disbursement")],
      });
      renderPage();
      const card = await screen.findByTestId("approval-policy-card-settlement");
      expect(within(card).getByText(cardCopy.standardText)).toBeInTheDocument();
      expect(within(card).queryByTestId("approval-policy-threshold")).not.toBeInTheDocument();
    });

    it("rev. 0.2: con umbral null la plantilla «Un autorizador» arranca en $0 (no hay monto que conservar)", async () => {
      const manualOnlyRules = {
        rulesSchemaVersion: 1 as const,
        tiers: [
          { minAmount: 0, conditions: {}, requiresApproval: false, steps: [] },
          {
            minAmount: 1000,
            conditions: { manualAdjustments: true as const },
            requiresApproval: true,
            steps: [{ eligibleRoles: [...ceilingStep.eligibleRoles], eligibleUserIds: [] }],
          },
        ],
      };
      mockApi.getOverview.mockResolvedValue(
        overview(true, {
          source: "tenant",
          version: 2,
          effectiveFrom: "2026-10-01T00:00:00Z",
          rules: manualOnlyRules,
          voboThresholdMxn: null,
        }),
      );
      const user = userEvent.setup();
      renderPage("/settings/approvals?concept=settlement");
      const dialog = await screen.findByRole("dialog");
      await user.click(
        within(dialog).getByRole("button", {
          name: `${sheetCopy.applyTemplate} ${TEMPLATE_LABELS.oneApprover.title}`,
        }),
      );
      expect(within(dialog).queryByTestId("policy-tier-1")).not.toBeInTheDocument();
      expect(
        within(within(dialog).getByTestId("policy-tier-0")).getByRole("checkbox", {
          name: new RegExp(sheetCopy.noApproval),
        }),
      ).not.toBeChecked();
    });

    it("otros conceptos no muestran línea de umbral", async () => {
      mockApi.getOverview.mockResolvedValue(overview(true));
      renderPage();
      const card = await screen.findByTestId("approval-policy-card-driver_advance");
      expect(within(card).queryByTestId("approval-policy-threshold")).not.toBeInTheDocument();
    });

    it("editor: el «Desde» del primer tramo con autorización lleva la ayuda del monto mínimo (D3)", async () => {
      mockApi.getOverview.mockResolvedValue(overview(true, { voboThresholdMxn: 5000, rules: thresholdRules }));
      renderPage("/settings/approvals?concept=settlement");
      const dialog = await screen.findByRole("dialog");
      const amount = within(within(dialog).getByTestId("policy-tier-1")).getByLabelText(sheetCopy.minAmount);
      expect(amount).toHaveAccessibleDescription(sheetCopy.thresholdAmountHint);
      expect(within(within(dialog).getByTestId("policy-tier-0")).getByText(sheetCopy.noApprovalHint)).toBeInTheDocument();
      expect(within(dialog).queryByRole("button", { name: sheetCopy.addNoApprovalTier })).not.toBeInTheDocument();
    });

    it("editor con umbral $0: «No pedir autorización en montos bajos» inserta el tramo base y guarda dos tramos (D4)", async () => {
      mockApi.getOverview.mockResolvedValue(overview(true));
      mockApi.save.mockResolvedValue({
        message: "Regla de autorización guardada",
        data: { ...policy("settlement"), source: "tenant", version: 1, createdBy: "u-admin", warnings: [] },
      });
      const user = userEvent.setup();
      renderPage("/settings/approvals?concept=settlement");
      const dialog = await screen.findByRole("dialog");

      await user.click(within(dialog).getByRole("button", { name: sheetCopy.addNoApprovalTier }));
      expect(
        within(within(dialog).getByTestId("policy-tier-0")).getByRole("checkbox", {
          name: new RegExp(sheetCopy.noApproval),
        }),
      ).toBeChecked();
      const amount = within(within(dialog).getByTestId("policy-tier-1")).getByLabelText(sheetCopy.minAmount);
      await waitFor(() => expect(amount).toHaveFocus());
      expect(within(dialog).queryByRole("button", { name: sheetCopy.addNoApprovalTier })).not.toBeInTheDocument();

      await user.clear(amount);
      await user.type(amount, "3000");
      await user.click(within(dialog).getByRole("button", { name: sheetCopy.save }));
      const confirm = await screen.findByRole("alertdialog");
      await user.click(within(confirm).getByRole("button", { name: approvalPoliciesCopy.confirm.confirm }));

      await waitFor(() => expect(mockApi.save).toHaveBeenCalledTimes(1));
      const { rules } = mockApi.save.mock.calls[0]![0];
      expect(rules.tiers).toHaveLength(2);
      expect(rules.tiers[0]).toEqual({ minAmount: 0, conditions: {}, requiresApproval: false, steps: [] });
      expect(rules.tiers[1]).toMatchObject({ minAmount: 3000, requiresApproval: true });
    });
  });

  describe("confirmación de «Restablecer estándar» (A7, rev. 0.2)", () => {
    const customized: Partial<ConceptPolicy> = {
      source: "tenant",
      version: 2,
      effectiveFrom: "2026-10-01T00:00:00Z",
      voboThresholdMxn: null,
    };

    async function openResetConfirm(concept: ConceptPolicy["concept"] = "settlement") {
      const user = userEvent.setup();
      renderPage(`/settings/approvals?concept=${concept}`);
      const dialog = await screen.findByRole("dialog");
      await user.click(within(dialog).getByRole("button", { name: sheetCopy.reset }));
      return screen.findByRole("alertdialog");
    }

    it("Liquidaciones con estándar $5,000: muestra el monto al que vuelve", async () => {
      mockApi.getOverview.mockResolvedValue(overview(true, { ...customized, standardVoboThresholdMxn: 5000 }));
      const confirm = await openResetConfirm();
      expect(
        within(confirm).getByText("Cualquier autorizador activo firmará los pagos nuevos desde $5,000.00."),
      ).toBeInTheDocument();
    });

    it("Liquidaciones con estándar $0: firmará todos los pagos nuevos", async () => {
      mockApi.getOverview.mockResolvedValue(overview(true, { ...customized, standardVoboThresholdMxn: 0 }));
      const confirm = await openResetConfirm();
      expect(
        within(confirm).getByText("Cualquier autorizador activo firmará todos los pagos nuevos."),
      ).toBeInTheDocument();
    });

    it("Liquidaciones sin el campo del API: texto genérico", async () => {
      mockApi.getOverview.mockResolvedValue(overview(true, { ...customized, standardVoboThresholdMxn: undefined }));
      const confirm = await openResetConfirm();
      expect(within(confirm).getByText(approvalPoliciesCopy.confirm.resetDescription)).toBeInTheDocument();
    });

    it("otros conceptos conservan el texto genérico", async () => {
      mockApi.getOverview.mockResolvedValue({
        editEnabled: true,
        concepts: [
          policy("driver_advance", { source: "tenant", version: 1, effectiveFrom: "2026-10-01T00:00:00Z" }),
          policy("trip_expense"),
          policy("settlement"),
          policy("disbursement"),
        ],
      });
      const confirm = await openResetConfirm("driver_advance");
      expect(within(confirm).getByText(approvalPoliciesCopy.confirm.resetDescription)).toBeInTheDocument();
    });
  });

  it("solo lectura con edit_enabled=false: sin editar, con aviso y simulador disponible", async () => {
    mockApi.getOverview.mockResolvedValue(overview(false));
    mockApi.simulate.mockResolvedValue({ requiresApproval: false, tierIndex: 0, steps: [], violations: [] });
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByTestId("approval-policies-readonly")).toHaveTextContent(
      approvalPoliciesCopy.page.editDisabled,
    );
    expect(screen.queryByRole("button", { name: approvalPoliciesCopy.card.edit })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: approvalPoliciesCopy.card.customize })).not.toBeInTheDocument();
    expect(mockApi.listCandidateUsers).not.toHaveBeenCalled();

    const card = screen.getByTestId("approval-policy-card-settlement");
    await user.click(within(card).getByRole("button", { name: approvalPoliciesCopy.card.view }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByRole("button", { name: sheetCopy.save })).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: approvalPoliciesCopy.simulator.run }));
    await waitFor(() =>
      expect(mockApi.simulate).toHaveBeenCalledWith("settlement", null, expect.objectContaining({ amount: 0 })),
    );
    expect(await within(dialog).findByText(approvalPoliciesCopy.simulator.noApproval)).toBeInTheDocument();
  });

  it("lector sin permiso de edición ve aviso de solo lectura", async () => {
    mockPermissions.granted = new Set(["approval_policies.read"]);
    mockApi.getOverview.mockResolvedValue(overview(true));
    renderPage();
    expect(await screen.findByTestId("approval-policies-readonly")).toHaveTextContent(
      approvalPoliciesCopy.page.readOnlyViewer,
    );
  });

  it("?concept=settlement abre el editor; guardar envía expected_version null en la primera versión", async () => {
    mockApi.getOverview.mockResolvedValue(overview(true));
    mockApi.save.mockResolvedValue({
      message: "Regla de autorización guardada",
      data: { ...policy("settlement"), source: "tenant", version: 1, createdBy: "u-admin", warnings: [] },
    });
    await openSettlementEditorAndSave();
    await waitFor(() => expect(mockApi.save).toHaveBeenCalledTimes(1));
    expect(mockApi.save.mock.calls[0]![0]).toMatchObject({ concept: "settlement", expectedVersion: null });
    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Regla de autorización guardada" })),
    );
  });

  it("422 insatisfacible se muestra en tiers[0].steps[0] y en el resumen", async () => {
    mockApi.getOverview.mockResolvedValue(overview(true));
    mockApi.save.mockRejectedValue(
      new ApiError("No satisfacible", 422, "APPROVAL_POLICY_UNSATISFIABLE", {
        violations: [{ tier_index: 0, step_no: 1, reason: "no_eligible" }],
      }),
    );
    const { dialog } = await openSettlementEditorAndSave();
    const message = approvalPoliciesCopy.validation.noEligible(approvalPoliciesCopy.validation.noEligibleReason);
    const step = await within(dialog).findByTestId("policy-tier-0-step-0");
    expect(within(step).getByText(message)).toHaveAttribute("id", "policy-tier-0-step-0-error");
    expect(step).toHaveAttribute("aria-invalid", "true");
    expect(within(dialog).getByText(sheetCopy.validationTitle)).toBeInTheDocument();
  });

  it("409 de versión muestra alerta con «Recargar regla vigente»", async () => {
    mockApi.getOverview.mockResolvedValue(
      overview(true, { source: "tenant", version: 2, effectiveFrom: "2026-10-01T00:00:00Z" }),
    );
    mockApi.save.mockRejectedValue(
      new ApiError("Alguien más guardó esta regla mientras la editabas; recarga para ver la versión vigente", 409, "APPROVAL_POLICY_VERSION_CONFLICT", {
        current_version: 3,
      }),
    );
    const { user, dialog } = await openSettlementEditorAndSave();
    expect(mockApi.save.mock.calls[0]![0]).toMatchObject({ expectedVersion: 2 });
    const alert = await within(dialog).findByTestId("policy-blocking-alert");
    expect(alert).toHaveTextContent(sheetCopy.conflictTitle);
    const callsBefore = mockApi.getOverview.mock.calls.length;
    await user.click(within(alert).getByRole("button", { name: sheetCopy.reload }));
    await waitFor(() => expect(mockApi.getOverview.mock.calls.length).toBeGreaterThan(callsBefore));
  });
});
