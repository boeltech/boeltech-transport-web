/**
 * Smoke ADR-0099 — Reglas de autorización configurables (F5 · SDD §4.4).
 *
 * AP-1…AP-12 del dictamen QA F7 (C.4.1): estado estándar, plantillas,
 * insatisfacibles, simulador, historial, restablecer, conflicto de versión,
 * interruptor apagado, permisos con la matriz real, guardia de huérfanos
 * en usuarios y entrada desde el hub de Pagos a operadores.
 * AP-13 (addendum ADR-0099-A): el umbral de VoBo se ve en la tarjeta y se
 * edita solo como «Desde» de la regla de Liquidaciones.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { ROLE_LABELS, type UserRole } from "@shared/constants/roles";
import { checkPermission, getPermissionsForRole } from "@shared/permissions";
import { formatDate } from "@shared/utils/dateUtils";
import {
  formatPolicyAmount,
  getConceptCeilingRoles,
  type ApprovalConcept,
  type ApprovalPoliciesOverview,
  type ApprovalRules,
  type ConceptPolicy,
  type PolicyCandidateUser,
} from "@features/approval-policies/domain";
import {
  TEMPLATE_LABELS,
  approvalPoliciesCopy,
} from "@features/approval-policies/presentation/copy/approvalPoliciesCopy";
import { ApprovalPoliciesPage } from "@features/approval-policies/presentation/pages/ApprovalPoliciesPage";
import { approvalsQueryKeys } from "@features/approvals/application/approvalsQueryKeys";
import { settlementsQueryKeys } from "@features/settlements/application/settlementsQueryKeys";
import { OperatorPaymentsHubLayout } from "@features/settlements/presentation/components/OperatorPaymentsHubLayout";
import { settlementsCopy } from "@features/settlements/presentation/copy/settlementsCopy";
import { SettingsNavTabs } from "@features/settings/presentation/components/SettingsNavTabs";
import { SettingsRoutes } from "@features/settings/presentation/routes";
import { UsersListPage } from "@features/users/presentation/pages/UsersListPage";
import { UserEditPage } from "@features/users/presentation/pages/UserEditPage";

const { mockPoliciesApi, mockSession, mockToast, mockApiGet, mockApiPatch, mockApiPut } = vi.hoisted(() => ({
  mockPoliciesApi: {
    getOverview: vi.fn(),
    save: vi.fn(),
    reset: vi.fn(),
    listVersions: vi.fn(),
    simulate: vi.fn(),
    listCandidateUsers: vi.fn(),
  },
  mockSession: { role: "admin" as string, userId: "u-admin" },
  mockToast: vi.fn(),
  mockApiGet: vi.fn(),
  mockApiPatch: vi.fn(),
  mockApiPut: vi.fn(),
}));

vi.mock("@features/approval-policies/infrastructure/approvalPoliciesApi", () => ({
  approvalPoliciesApi: mockPoliciesApi,
}));

// Permisos reales por rol: misma matriz que `PermissionProvider`.
vi.mock("@shared/permissions/application/usePermissions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/permissions/application/usePermissions")>();
  const { checkPermission: check } = await import("@shared/permissions/domain/rules");
  const { getPermissionsForRole: permissionsFor } = await import("@shared/permissions/domain/rolePermissions");
  const allowed = (module: string, action: string) =>
    check(mockSession.role as never, permissionsFor(mockSession.role as never), module as never, action as never)
      .allowed;
  return {
    ...actual,
    usePermissions: () => ({
      hasPermission: allowed,
      can: allowed,
      canAll: () => true,
      canAny: () => true,
      hasRole: (role: string) => role === mockSession.role,
      hasAnyRole: (roles: string[]) => roles.includes(mockSession.role),
      role: mockSession.role,
      isLoading: false,
      isAuthenticated: true,
    }),
  };
});

vi.mock("@features/auth", () => ({
  useAuth: () => ({
    user: { id: mockSession.userId, fullName: "Usuario Smoke", role: mockSession.role },
    isAuthenticated: true,
  }),
}));

vi.mock("@shared/hooks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@shared/hooks")>()),
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("@shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/api")>();
  return {
    ...actual,
    apiClient: { ...actual.apiClient, get: mockApiGet, patch: mockApiPatch, put: mockApiPut },
  };
});

vi.mock("@features/users/presentation/components/PendingInvitationsPanel", () => ({
  PendingInvitationsPanel: () => null,
}));

vi.mock("@features/users/presentation/components/AddUserSheet", () => ({
  AddUserSheet: () => null,
}));

vi.mock("@features/users/presentation/components/UserForm", () => ({
  UserForm: ({
    user,
    onSubmit,
  }: {
    user: { firstName: string; lastName: string; email: string };
    onSubmit: (values: Record<string, unknown>) => void;
  }) => (
    <button
      type="button"
      onClick={() =>
        onSubmit({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: "dispatcher",
        })
      }
    >
      Guardar usuario (stub)
    </button>
  ),
}));

const copy = approvalPoliciesCopy;
const sheetCopy = copy.sheet;
const EFFECTIVE_FROM = "2026-10-02T15:00:00.000Z";
const AUTHOR = "Gerardo Méndez";

const CANDIDATES: PolicyCandidateUser[] = [
  { id: "u-admin", fullName: "Ana Admin", role: "admin" },
  { id: "u-mgr", fullName: "Mario Gerente", role: "manager" },
  { id: "u-acc", fullName: "Carla Contadora", role: "accountant" },
];

function ceilingRules(concept: ApprovalConcept): ApprovalRules {
  return {
    rulesSchemaVersion: 1,
    tiers: [
      {
        minAmount: 0,
        conditions: {},
        requiresApproval: true,
        steps: [{ eligibleRoles: getConceptCeilingRoles(concept), eligibleUserIds: [] }],
      },
    ],
  };
}

/** Liquidaciones con umbral VoBo vigente de $5,000 (SDD §3.10). */
function settlementThresholdRules(threshold = 5000): ApprovalRules {
  return {
    rulesSchemaVersion: 1,
    tiers: [
      { minAmount: 0, conditions: {}, requiresApproval: false, steps: [] },
      {
        minAmount: threshold,
        conditions: {},
        requiresApproval: true,
        steps: [{ eligibleRoles: getConceptCeilingRoles("settlement"), eligibleUserIds: [] }],
      },
    ],
  };
}

function policy(concept: ApprovalConcept, overrides: Partial<ConceptPolicy> = {}): ConceptPolicy {
  return {
    concept,
    source: "system_default",
    version: null,
    effectiveFrom: null,
    createdBy: null,
    createdByName: null,
    rules: ceilingRules(concept),
    summary: "Desde $0.00: cualquier autorizador",
    pendingRequests: 0,
    voboThresholdMxn: concept === "settlement" ? 0 : null,
    standardVoboThresholdMxn: concept === "settlement" ? 0 : null,
    ...overrides,
  };
}

const PENDING: Record<ApprovalConcept, number> = {
  driver_advance: 6,
  trip_expense: 0,
  settlement: 2,
  disbursement: 1,
};

function overview(
  editEnabled = true,
  overrides: Partial<Record<ApprovalConcept, Partial<ConceptPolicy>>> = {},
): ApprovalPoliciesOverview {
  const concepts: ApprovalConcept[] = ["driver_advance", "trip_expense", "settlement", "disbursement"];
  return {
    editEnabled,
    concepts: concepts.map((concept) =>
      policy(concept, { pendingRequests: PENDING[concept], ...overrides[concept] }),
    ),
  };
}

/** El overview se relee tras guardar; cada test controla su estado actual. */
let currentOverview: ApprovalPoliciesOverview;

function setOverview(next: ApprovalPoliciesOverview) {
  currentOverview = next;
}

function setRole(role: UserRole, userId = `u-${role}`) {
  mockSession.role = role;
  mockSession.userId = userId;
}

function createClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
}

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

function renderApp(path: string, routes: ReactNode, client = createClient()) {
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>{routes}</Routes>
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return client;
}

function renderPoliciesPage(path = "/settings/approvals", client?: QueryClient) {
  return renderApp(path, <Route path="/settings/approvals" element={<ApprovalPoliciesPage />} />, client);
}

async function openEditor(user: ReturnType<typeof userEvent.setup>, concept: ApprovalConcept) {
  const card = await screen.findByTestId(`approval-policy-card-${concept}`);
  const trigger =
    within(card).queryByRole("button", { name: copy.card.customize }) ??
    within(card).getByRole("button", { name: copy.card.edit });
  await user.click(trigger);
  return screen.findByRole("dialog");
}

async function applyTemplate(
  user: ReturnType<typeof userEvent.setup>,
  dialog: HTMLElement,
  id: keyof typeof TEMPLATE_LABELS,
) {
  await user.click(
    within(dialog).getByRole("button", { name: `${sheetCopy.applyTemplate} ${TEMPLATE_LABELS[id].title}` }),
  );
}

async function saveAndConfirm(user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement) {
  await user.click(within(dialog).getByRole("button", { name: sheetCopy.save }));
  const confirm = await screen.findByRole("alertdialog");
  return {
    confirm,
    accept: () => user.click(within(confirm).getByRole("button", { name: copy.confirm.confirm })),
  };
}

function roleCheckbox(scope: HTMLElement, role: UserRole, stepNo: number) {
  return within(scope).getByRole("checkbox", { name: `${ROLE_LABELS[role]} · ${sheetCopy.stepTitle(stepNo)}` });
}

function savedFrom(concept: ApprovalConcept, rules: ApprovalRules, version: number) {
  return {
    message: copy.toasts.saved,
    data: {
      concept,
      source: "tenant" as const,
      version,
      effectiveFrom: EFFECTIVE_FROM,
      createdBy: "u-admin",
      rules,
      summary: "Desde $0.00: Gerente o Contador · Desde $20,000.00: Administrador",
      warnings: [],
    },
  };
}

describe("Smoke ADR-0099 F7: Reglas de autorización (AP-1…AP-13)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setRole("admin", "u-admin");
    setOverview(overview());
    mockPoliciesApi.getOverview.mockImplementation(async () => currentOverview);
    mockPoliciesApi.listCandidateUsers.mockResolvedValue({ users: CANDIDATES, referencedUsers: [] });
  });

  it("AP-1. Estado estándar: 4 tarjetas estándar, pendientes 6/0/2/1, nota del piso y sin autor", async () => {
    renderPoliciesPage();

    expect(await screen.findByTestId("approval-policy-card-driver_advance")).toBeInTheDocument();
    expect(screen.getAllByText(copy.card.standardText)).toHaveLength(4);
    expect(screen.getAllByText(copy.floorNote.text).length).toBeGreaterThan(0);

    expect(within(screen.getByTestId("approval-policy-card-driver_advance")).getByText(copy.card.pending(6))).toBeInTheDocument();
    expect(within(screen.getByTestId("approval-policy-card-trip_expense")).queryByText(/solicitud/)).not.toBeInTheDocument();
    expect(within(screen.getByTestId("approval-policy-card-settlement")).getByText(copy.card.pending(2))).toBeInTheDocument();
    expect(within(screen.getByTestId("approval-policy-card-disbursement")).getByText(copy.card.pending(1))).toBeInTheDocument();

    expect(screen.queryByText(/Vigente desde/)).not.toBeInTheDocument();
    expect(screen.queryByText(new RegExp(AUTHOR))).not.toBeInTheDocument();
  });

  it("AP-2. «Por monto»: precarga tramos, confirma con 6 pendientes, guarda con expected_version null y la tarjeta muestra v1 con autor", async () => {
    const user = userEvent.setup();
    mockPoliciesApi.save.mockImplementation(async ({ concept, rules }: { concept: ApprovalConcept; rules: ApprovalRules }) => {
      setOverview(
        overview(true, {
          driver_advance: {
            source: "tenant",
            version: 1,
            effectiveFrom: EFFECTIVE_FROM,
            createdBy: "u-admin",
            createdByName: AUTHOR,
            rules,
            summary: "Desde $0.00: Gerente o Contador · Desde $20,000.00: Administrador",
          },
        }),
      );
      return savedFrom(concept, rules, 1);
    });
    renderPoliciesPage();

    const dialog = await openEditor(user, "driver_advance");
    await applyTemplate(user, dialog, "byAmount");

    const ceiling = getConceptCeilingRoles("driver_advance");
    const lowerTier = within(dialog).getByTestId("policy-tier-0");
    const highTier = within(dialog).getByTestId("policy-tier-1");
    for (const role of ceiling) {
      if (role === "admin") {
        expect(roleCheckbox(lowerTier, role, 1)).not.toBeChecked();
        expect(roleCheckbox(highTier, role, 1)).toBeChecked();
      } else {
        expect(roleCheckbox(lowerTier, role, 1)).toBeChecked();
        expect(roleCheckbox(highTier, role, 1)).not.toBeChecked();
      }
    }
    expect((within(highTier).getByLabelText(sheetCopy.minAmount) as HTMLInputElement).value).toContain("20,000");

    const { confirm, accept } = await saveAndConfirm(user, dialog);
    expect(within(confirm).getByText(copy.confirm.description(6))).toBeInTheDocument();
    expect(copy.confirm.description(6)).toBe(
      "Aplica a solicitudes nuevas. Las 6 pendientes siguen con la regla anterior",
    );
    await accept();

    await waitFor(() => expect(mockPoliciesApi.save).toHaveBeenCalledTimes(1));
    const payload = mockPoliciesApi.save.mock.calls[0]![0];
    expect(payload).toMatchObject({ concept: "driver_advance", expectedVersion: null });
    expect(payload.rules.tiers).toHaveLength(2);
    expect(payload.rules.tiers[0]).toMatchObject({
      minAmount: 0,
      requiresApproval: true,
      steps: [{ eligibleRoles: ceiling.filter((role) => role !== "admin") }],
    });
    expect(payload.rules.tiers[1]).toMatchObject({
      minAmount: 20000,
      requiresApproval: true,
      steps: [{ eligibleRoles: ["admin"] }],
    });

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const card = screen.getByTestId("approval-policy-card-driver_advance");
    expect(
      await within(card).findByText(copy.card.meta(1, formatDate(EFFECTIVE_FROM), AUTHOR)),
    ).toBeInTheDocument();
    expect(within(card).getByText(new RegExp(`v1 · .* · ${AUTHOR}`))).toBeInTheDocument();
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: copy.toasts.saved }));
  });

  it("AP-3. Doble firma con una sola persona: contador previo y 422 ubicado en tramo 2 · paso 2 sin cerrar el sheet", async () => {
    const user = userEvent.setup();
    mockPoliciesApi.listCandidateUsers.mockResolvedValue({
      users: [
        { id: "u-admin", fullName: "Ana Admin", role: "admin" },
        { id: "u-mgr", fullName: "Mario Gerente", role: "manager" },
      ],
      referencedUsers: [],
    });
    mockPoliciesApi.save.mockRejectedValue(
      new ApiError("La regla no se puede cumplir con el equipo actual", 422, "APPROVAL_POLICY_UNSATISFIABLE", {
        violations: [{ tier_index: 1, step_no: 2, reason: "double_sign_needs_two_people" }],
      }),
    );
    renderPoliciesPage();

    const dialog = await openEditor(user, "trip_expense");
    await applyTemplate(user, dialog, "doubleSign");
    const highTier = within(dialog).getByTestId("policy-tier-1");
    await user.click(roleCheckbox(highTier, "manager", 1));
    await user.click(roleCheckbox(highTier, "manager", 2));

    expect(within(dialog).getByTestId("policy-tier-1-step-0-eligible")).toHaveTextContent(sheetCopy.eligibleCount(1));
    expect(within(dialog).getByTestId("policy-tier-1-step-1-eligible")).toHaveTextContent(sheetCopy.eligibleCount(1));
    expect(within(highTier).getAllByText(sheetCopy.singleEligibleWarning)).toHaveLength(2);

    const { accept } = await saveAndConfirm(user, dialog);
    await accept();
    await waitFor(() => expect(mockPoliciesApi.save).toHaveBeenCalledTimes(1));

    const message = copy.validation.doubleSign(1);
    expect(message).toBe("La doble firma necesita dos personas distintas; hoy hay 1");
    const step = await within(dialog).findByTestId("policy-tier-1-step-1");
    await waitFor(() => expect(within(step).getByText(message)).toHaveAttribute("id", "policy-tier-1-step-1-error"));
    expect(step).toHaveAttribute("aria-invalid", "true");
    expect(within(dialog).getByText(sheetCopy.validationTitle)).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("AP-4. 422 `no_eligible` en el tramo 2 marca solo ese paso", async () => {
    const user = userEvent.setup();
    mockPoliciesApi.save.mockRejectedValue(
      new ApiError("No satisfacible", 422, "APPROVAL_POLICY_UNSATISFIABLE", {
        violations: [{ tier_index: 1, step_no: 1, reason: "no_eligible" }],
      }),
    );
    renderPoliciesPage();

    const dialog = await openEditor(user, "trip_expense");
    await user.click(within(dialog).getByRole("button", { name: sheetCopy.addTier }));
    expect(within(dialog).getByTestId("policy-tier-1")).toBeInTheDocument();

    const { accept } = await saveAndConfirm(user, dialog);
    await accept();

    const message = copy.validation.noEligible(copy.validation.noEligibleReason);
    const target = await within(dialog).findByTestId("policy-tier-1-step-0");
    await waitFor(() => expect(within(target).getByText(message)).toHaveAttribute("id", "policy-tier-1-step-0-error"));
    expect(target).toHaveAttribute("aria-invalid", "true");
    const base = within(dialog).getByTestId("policy-tier-0-step-0");
    expect(base).toHaveAttribute("aria-invalid", "false");
    expect(within(base).queryByText(message)).not.toBeInTheDocument();
  });

  it("AP-5. Simulador: el borrador envía `rules`, la regla vigente `rules: null`; muestra tramo y nombres por paso", async () => {
    const user = userEvent.setup();
    mockPoliciesApi.simulate.mockResolvedValueOnce({
      requiresApproval: true,
      tierIndex: 1,
      steps: [
        { stepNo: 1, eligible: [{ userId: "u-mgr", fullName: "Mario Gerente", role: "manager" }] },
        { stepNo: 2, eligible: [] },
      ],
      violations: [{ tierIndex: 1, stepNo: 2, reason: "no_eligible" }],
    });
    renderPoliciesPage();

    const dialog = await openEditor(user, "driver_advance");
    await applyTemplate(user, dialog, "byAmount");
    await user.click(within(dialog).getByRole("button", { name: copy.simulator.title }));
    await user.type(within(dialog).getByLabelText(copy.simulator.amount), "25000");
    await user.click(within(dialog).getByRole("button", { name: copy.simulator.run }));

    await waitFor(() => expect(mockPoliciesApi.simulate).toHaveBeenCalledTimes(1));
    const [concept, rules, facts] = mockPoliciesApi.simulate.mock.calls[0]!;
    expect(concept).toBe("driver_advance");
    expect(rules).not.toBeNull();
    expect((rules as ApprovalRules).tiers).toHaveLength(2);
    expect(facts).toMatchObject({ amount: 25000 });

    const result = await within(dialog).findByTestId("policy-simulation-result");
    expect(within(result).getByText(copy.simulator.tierApplied(2))).toBeInTheDocument();
    expect(within(result).getByText(copy.simulator.stepLine(1, 2))).toBeInTheDocument();
    expect(within(result).getByText(`Mario Gerente (${ROLE_LABELS.manager})`)).toBeInTheDocument();
    expect(within(result).getByText(copy.simulator.stepLine(2, 2))).toBeInTheDocument();
    expect(within(result).getByText(copy.simulator.nobody)).toBeInTheDocument();
    expect(within(result).getByText(copy.simulator.violationsTitle)).toBeInTheDocument();
    expect(within(result).getByText(copy.simulator.violationNoEligible(2))).toBeInTheDocument();
    expect(within(result).getByTestId("policy-sim-step-2-violation")).toBeInTheDocument();
    expect(mockPoliciesApi.save).not.toHaveBeenCalled();
  });

  it("AP-5b. Simulador sobre la regla vigente (solo lectura) envía `rules: null`", async () => {
    const user = userEvent.setup();
    setRole("manager");
    mockPoliciesApi.simulate.mockResolvedValueOnce({
      requiresApproval: true,
      tierIndex: 0,
      steps: [{ stepNo: 1, eligible: [{ userId: "u-admin", fullName: "Ana Admin", role: "admin" }] }],
      violations: [],
    });
    renderPoliciesPage();

    const card = await screen.findByTestId("approval-policy-card-settlement");
    await user.click(within(card).getByRole("button", { name: copy.card.view }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: copy.simulator.run }));

    await waitFor(() =>
      expect(mockPoliciesApi.simulate).toHaveBeenCalledWith("settlement", null, expect.objectContaining({ amount: 0 })),
    );
    const result = await within(dialog).findByTestId("policy-simulation-result");
    expect(within(result).getByText(copy.simulator.tierApplied(1))).toBeInTheDocument();
    expect(within(result).getByText(copy.simulator.stepLine(1, 1))).toBeInTheDocument();
    expect(within(result).getByText(`Ana Admin (${ROLE_LABELS.admin})`)).toBeInTheDocument();
  });

  it("AP-6. Historial: v3 / v2 restablecida / v1 con autor y diff", async () => {
    const user = userEvent.setup();
    setOverview(
      overview(true, {
        trip_expense: { source: "tenant", version: 3, effectiveFrom: EFFECTIVE_FROM, createdByName: AUTHOR },
      }),
    );
    mockPoliciesApi.listVersions.mockResolvedValue({
      items: [
        {
          version: 3,
          effectiveFrom: EFFECTIVE_FROM,
          createdBy: "u-admin",
          createdByName: AUTHOR,
          source: "tenant",
          diffSummary: [{ field: "min_amount", tierIndex: 1, stepNo: null, from: 15000, to: 20000 }],
        },
        {
          version: 2,
          effectiveFrom: "2026-09-20T15:00:00.000Z",
          createdBy: "u-admin2",
          createdByName: "Ana Admin",
          source: "system_default_reset",
          diffSummary: [{ field: "tiers_count", tierIndex: null, stepNo: null, from: 2, to: 1 }],
        },
        {
          version: 1,
          effectiveFrom: "2026-09-01T15:00:00.000Z",
          createdBy: "u-admin",
          createdByName: AUTHOR,
          source: "tenant",
          diffSummary: [],
        },
      ],
      page: 1,
      totalPages: 1,
      total: 3,
    });
    renderPoliciesPage();

    const card = await screen.findByTestId("approval-policy-card-trip_expense");
    await user.click(within(card).getByRole("button", { name: copy.card.history }));
    const sheet = await screen.findByRole("dialog");
    await waitFor(() => expect(mockPoliciesApi.listVersions).toHaveBeenCalledWith("trip_expense", 1));

    const items = await within(sheet).findAllByRole("listitem");
    const entries = items.filter((item) => /^v\d/.test(item.textContent ?? ""));
    expect(entries).toHaveLength(3);
    const [v3, v2, v1] = entries as [HTMLElement, HTMLElement, HTMLElement];

    expect(within(v3).getByText(copy.versions.version(3))).toBeInTheDocument();
    expect(v3).toHaveTextContent(copy.versions.by(AUTHOR));
    expect(
      within(v3).getByText(
        `${copy.versions.tier(2)}: ${formatPolicyAmount(15000)} → ${formatPolicyAmount(20000)}`,
      ),
    ).toBeInTheDocument();

    expect(within(v2).getByText(copy.versions.version(2))).toBeInTheDocument();
    expect(within(v2).getByText(copy.versions.resetSource)).toBeInTheDocument();
    expect(v2).toHaveTextContent(copy.versions.by("Ana Admin"));
    expect(within(v2).getByText(copy.versions.tiersCount(2, 1))).toBeInTheDocument();

    expect(within(v1).getByText(copy.versions.version(1))).toBeInTheDocument();
    expect(v1).toHaveTextContent(copy.versions.by(AUTHOR));
    expect(within(v1).getByText(copy.versions.noChanges)).toBeInTheDocument();
    expect(within(v1).queryByText(copy.versions.resetSource)).not.toBeInTheDocument();
  });

  it("AP-7. Restablecer: confirma, POST reset con la versión vigente, vuelve a estándar e invalida bandeja y umbral", async () => {
    const user = userEvent.setup();
    setOverview(
      overview(true, {
        settlement: {
          source: "tenant",
          version: 2,
          effectiveFrom: EFFECTIVE_FROM,
          createdByName: AUTHOR,
          summary: "Desde $0.00: Administrador",
        },
      }),
    );
    mockPoliciesApi.reset.mockImplementation(async () => {
      setOverview(
        overview(true, {
          settlement: { source: "system_default_reset", version: 3, effectiveFrom: EFFECTIVE_FROM, createdByName: AUTHOR },
        }),
      );
      return { message: copy.toasts.reset, data: savedFrom("settlement", ceilingRules("settlement"), 3).data };
    });
    const client = createClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");
    renderPoliciesPage("/settings/approvals", client);

    const card = await screen.findByTestId("approval-policy-card-settlement");
    expect(within(card).getByText(copy.card.customBadge)).toBeInTheDocument();
    const dialog = await openEditor(user, "settlement");
    await user.click(within(dialog).getByRole("button", { name: sheetCopy.reset }));
    const confirm = await screen.findByRole("alertdialog");
    expect(within(confirm).getByText(copy.confirm.resetTitle)).toBeInTheDocument();
    await user.click(within(confirm).getByRole("button", { name: copy.confirm.resetConfirm }));

    await waitFor(() => expect(mockPoliciesApi.reset).toHaveBeenCalledWith("settlement", 2));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: copy.toasts.reset }));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: approvalsQueryKeys.all });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: settlementsQueryKeys.settings() });

    await waitFor(() =>
      expect(within(screen.getByTestId("approval-policy-card-settlement")).getByText(copy.card.standardBadge)).toBeInTheDocument(),
    );
  });

  it("AP-8. 409 de versión: alerta «Recargar regla vigente» que relee el overview", async () => {
    const user = userEvent.setup();
    setOverview(overview(true, { settlement: { source: "tenant", version: 2, effectiveFrom: EFFECTIVE_FROM } }));
    mockPoliciesApi.save.mockRejectedValue(
      new ApiError(
        "Alguien más guardó esta regla mientras la editabas; recarga para ver la versión vigente",
        409,
        "APPROVAL_POLICY_VERSION_CONFLICT",
        { current_version: 3 },
      ),
    );
    renderPoliciesPage();

    const dialog = await openEditor(user, "settlement");
    const { accept } = await saveAndConfirm(user, dialog);
    await accept();

    await waitFor(() => expect(mockPoliciesApi.save).toHaveBeenCalledTimes(1));
    expect(mockPoliciesApi.save.mock.calls[0]![0]).toMatchObject({ expectedVersion: 2 });
    const alert = await within(dialog).findByTestId("policy-blocking-alert");
    expect(alert).toHaveTextContent(sheetCopy.conflictTitle);
    const callsBefore = mockPoliciesApi.getOverview.mock.calls.length;
    await user.click(within(alert).getByRole("button", { name: sheetCopy.reload }));
    await waitFor(() => expect(mockPoliciesApi.getOverview.mock.calls.length).toBeGreaterThan(callsBefore));
    expect(mockPoliciesApi.save).toHaveBeenCalledTimes(1);
  });

  describe("AP-9. Interruptor de edición apagado", () => {
    it("sin editar, plantillas ni restablecer; con aviso y simulador activo", async () => {
      const user = userEvent.setup();
      setOverview(overview(false, { settlement: { source: "tenant", version: 2, effectiveFrom: EFFECTIVE_FROM } }));
      mockPoliciesApi.simulate.mockResolvedValue({ requiresApproval: false, tierIndex: 0, steps: [], violations: [] });
      renderPoliciesPage();

      expect(await screen.findByTestId("approval-policies-readonly")).toHaveTextContent(copy.page.editDisabled);
      expect(screen.queryByRole("button", { name: copy.card.edit })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: copy.card.customize })).not.toBeInTheDocument();
      expect(mockPoliciesApi.listCandidateUsers).not.toHaveBeenCalled();

      const card = screen.getByTestId("approval-policy-card-settlement");
      await user.click(within(card).getByRole("button", { name: copy.card.view }));
      const dialog = await screen.findByRole("dialog");
      expect(within(dialog).queryByRole("button", { name: sheetCopy.save })).not.toBeInTheDocument();
      expect(within(dialog).queryByRole("button", { name: sheetCopy.reset })).not.toBeInTheDocument();
      expect(within(dialog).queryByText(sheetCopy.templatesTitle)).not.toBeInTheDocument();

      await user.click(within(dialog).getByRole("button", { name: copy.simulator.run }));
      await waitFor(() => expect(mockPoliciesApi.simulate).toHaveBeenCalledWith("settlement", null, expect.anything()));
      expect(await within(dialog).findByText(copy.simulator.noApproval)).toBeInTheDocument();
    });

    it("PUT 403 con overview aún habilitado: alerta en el sheet, sin cerrar y con guardar bloqueado", async () => {
      const user = userEvent.setup();
      mockPoliciesApi.save.mockRejectedValue(
        new ApiError(copy.page.editDisabled, 403, "APPROVAL_POLICIES_EDIT_DISABLED"),
      );
      renderPoliciesPage();

      const dialog = await openEditor(user, "settlement");
      const { accept } = await saveAndConfirm(user, dialog);
      await accept();

      const alert = await within(dialog).findByTestId("policy-blocking-alert");
      expect(alert).toHaveTextContent(sheetCopy.editDisabledTitle);
      expect(within(dialog).getByRole("button", { name: sheetCopy.save })).toBeDisabled();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(mockPoliciesApi.save).toHaveBeenCalledTimes(1);
    });

    it("PUT 403 y el overview releído viene apagado: el sheet sigue abierto en lectura y la página avisa, sin reintento", async () => {
      const user = userEvent.setup();
      mockPoliciesApi.save.mockImplementation(async () => {
        setOverview(overview(false));
        throw new ApiError(copy.page.editDisabled, 403, "APPROVAL_POLICIES_EDIT_DISABLED");
      });
      renderPoliciesPage();

      const dialog = await openEditor(user, "settlement");
      const { accept } = await saveAndConfirm(user, dialog);
      await accept();

      expect(await screen.findByTestId("approval-policies-readonly")).toHaveTextContent(copy.page.editDisabled);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      await waitFor(() =>
        expect(within(screen.getByRole("dialog")).queryByRole("button", { name: sheetCopy.save })).not.toBeInTheDocument(),
      );
      expect(mockPoliciesApi.save).toHaveBeenCalledTimes(1);
    });
  });

  describe("AP-10. Permisos con la matriz real", () => {
    it("matriz: admin edita; manager y accountant solo leen; dispatcher y operator sin acceso", () => {
      const can = (role: UserRole, action: "read" | "update") =>
        checkPermission(role, getPermissionsForRole(role), "approval_policies", action).allowed;
      expect(can("admin", "update")).toBe(true);
      for (const role of ["manager", "accountant"] as const) {
        expect(can(role, "read")).toBe(true);
        expect(can(role, "update")).toBe(false);
      }
      for (const role of ["dispatcher", "operator"] as const) {
        expect(can(role, "read")).toBe(false);
      }
    });

    it.each(["manager", "accountant"] as const)("%s ve la pestaña y la página en solo lectura", async (role) => {
      setRole(role);
      renderApp(
        "/settings/approvals",
        <>
          <Route
            path="/settings/*"
            element={
              <>
                <SettingsNavTabs />
                <SettingsRoutes />
              </>
            }
          />
          <Route path="/forbidden" element={<div>forbidden-page</div>} />
        </>,
      );

      const tabs = screen.getAllByRole("link", { name: "Reglas de autorización" });
      expect(tabs.length).toBeGreaterThan(0);
      for (const tab of tabs) expect(tab).toHaveAttribute("href", "/settings/approvals");
      expect(await screen.findByTestId("approval-policies-readonly", {}, { timeout: 5000 })).toHaveTextContent(
        copy.page.readOnlyViewer,
      );
      expect(screen.queryByRole("button", { name: copy.card.customize })).not.toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: copy.card.view })).toHaveLength(4);
      expect(mockPoliciesApi.listCandidateUsers).not.toHaveBeenCalled();
    });

    it.each(["dispatcher", "operator"] as const)("%s no ve la pestaña y la ruta lo manda a /forbidden", async (role) => {
      setRole(role);
      renderApp(
        "/settings/approvals",
        <>
          <Route
            path="/settings/*"
            element={
              <>
                <SettingsNavTabs />
                <SettingsRoutes />
              </>
            }
          />
          <Route path="/forbidden" element={<div>forbidden-page</div>} />
        </>,
      );

      expect(await screen.findByText("forbidden-page")).toBeInTheDocument();
      expect(screen.getByTestId("location")).toHaveTextContent("/forbidden");
      expect(mockPoliciesApi.getOverview).not.toHaveBeenCalled();
    });

    it.each(["dispatcher", "operator"] as const)("%s: SettingsNavTabs omite «Reglas de autorización»", (role) => {
      setRole(role);
      renderApp("/settings/general", <Route path="/settings/*" element={<SettingsNavTabs />} />);
      expect(screen.getByLabelText("Secciones de configuración")).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Reglas de autorización" })).not.toBeInTheDocument();
    });
  });

  describe("AP-11. Guardia de huérfanos al cambiar usuarios", () => {
    const orphanError = () =>
      new ApiError(
        "Este cambio deja pasos de una regla de autorización sin nadie que pueda firmarlos",
        409,
        "APPROVAL_POLICY_ORPHAN_GUARD",
        { violations: [{ concept: "settlement", policy_version: 2, tier_index: 1, step_no: 2, reason: "no_eligible" }] },
      );
    const apiUser = {
      id: "u-mgr",
      tenant_id: "t-1",
      email: "mario@empresa.mx",
      first_name: "Mario",
      last_name: "Gerente",
      role: "manager",
      status: "active",
      last_login: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      created_by: null,
      updated_by: null,
      created_by_name: null,
      updated_by_name: null,
    };

    beforeEach(() => {
      mockApiGet.mockImplementation(async (url: string) => {
        if (url === "/users") {
          return { data: [apiUser], pagination: { page: 1, limit: 10, total: 1, total_pages: 1 } };
        }
        if (url === "/users/u-mgr") return { data: apiUser };
        return { data: [] };
      });
    });

    function renderUsersList() {
      renderApp("/users", <Route path="/users" element={<UsersListPage />} />);
    }

    async function deactivateFromList(user: ReturnType<typeof userEvent.setup>) {
      await screen.findAllByText("mario@empresa.mx");
      await user.click(screen.getAllByRole("button", { name: "Acciones" })[0]!);
      await user.click(await screen.findByRole("menuitem", { name: /Desactivar usuario/ }));
      const statusDialog = await screen.findByRole("alertdialog");
      await user.click(within(statusDialog).getByRole("button", { name: "Confirmar" }));
    }

    it("UsersListPage: Confirmar → 409 → «Continuar de todos modos» reenvía con confirm_policy_orphan", async () => {
      const user = userEvent.setup();
      mockApiPatch.mockRejectedValueOnce(orphanError()).mockResolvedValueOnce({ data: { ...apiUser, status: "inactive" } });
      renderUsersList();

      await deactivateFromList(user);
      const orphan = await screen.findByRole("alertdialog", { name: copy.orphan.title });
      expect(within(orphan).getByText(copy.orphan.line("Liquidaciones", 2, 2))).toBeInTheDocument();
      expect(mockApiPatch).toHaveBeenCalledTimes(1);
      expect(mockApiPatch.mock.calls[0]).toEqual(["/users/u-mgr/status", { status: "inactive" }]);

      await user.click(within(orphan).getByRole("button", { name: copy.orphan.confirm }));
      await waitFor(() => expect(mockApiPatch).toHaveBeenCalledTimes(2));
      expect(mockApiPatch.mock.calls[1]).toEqual([
        "/users/u-mgr/status",
        { status: "inactive", confirm_policy_orphan: true },
      ]);
    });

    it("UsersListPage: «Cancelar» no hace segunda llamada", async () => {
      const user = userEvent.setup();
      mockApiPatch.mockRejectedValueOnce(orphanError());
      renderUsersList();

      await deactivateFromList(user);
      const orphan = await screen.findByRole("alertdialog", { name: copy.orphan.title });
      await user.click(within(orphan).getByRole("button", { name: copy.orphan.cancel }));
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      expect(mockApiPatch).toHaveBeenCalledTimes(1);
    });

    it("UserEditPage: cambio de rol con 409 reenvía con confirm_policy_orphan al confirmar", async () => {
      const user = userEvent.setup();
      mockApiPatch.mockRejectedValueOnce(orphanError()).mockResolvedValueOnce({ data: { ...apiUser, role: "dispatcher" } });
      renderApp(
        "/users/u-mgr/edit",
        <>
          <Route path="/users/:id/edit" element={<UserEditPage />} />
          <Route path="/users/:id" element={<div>user-detail</div>} />
        </>,
      );

      await user.click(await screen.findByRole("button", { name: "Guardar usuario (stub)" }));
      const orphan = await screen.findByRole("alertdialog", { name: copy.orphan.title });
      expect(mockApiPatch).toHaveBeenCalledTimes(1);
      expect(mockApiPatch.mock.calls[0]![0]).toBe("/users/u-mgr");
      expect(mockApiPatch.mock.calls[0]![1]).not.toHaveProperty("confirm_policy_orphan");

      await user.click(within(orphan).getByRole("button", { name: copy.orphan.confirm }));
      await waitFor(() => expect(mockApiPatch).toHaveBeenCalledTimes(2));
      expect(mockApiPatch.mock.calls[1]![0]).toBe("/users/u-mgr");
      expect(mockApiPatch.mock.calls[1]![1]).toMatchObject({ role: "dispatcher", confirm_policy_orphan: true });
      expect(await screen.findByText("user-detail")).toBeInTheDocument();
    });

    it("UserEditPage: «Cancelar» no hace segunda llamada", async () => {
      const user = userEvent.setup();
      mockApiPatch.mockRejectedValueOnce(orphanError());
      renderApp("/users/u-mgr/edit", <Route path="/users/:id/edit" element={<UserEditPage />} />);

      await user.click(await screen.findByRole("button", { name: "Guardar usuario (stub)" }));
      const orphan = await screen.findByRole("alertdialog", { name: copy.orphan.title });
      await user.click(within(orphan).getByRole("button", { name: copy.orphan.cancel }));
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      expect(mockApiPatch).toHaveBeenCalledTimes(1);
    });
  });

  it("AP-12. Hub → /settings/approvals?concept=settlement con editor abierto; el primer guardado conserva el umbral como tramo sin autorización", async () => {
    const user = userEvent.setup();
    setOverview(
      overview(true, { settlement: { rules: settlementThresholdRules(5000), voboThresholdMxn: 5000 } }),
    );
    mockPoliciesApi.save.mockImplementation(async ({ concept, rules }: { concept: ApprovalConcept; rules: ApprovalRules }) =>
      savedFrom(concept, rules, 1),
    );
    renderApp(
      "/finance/settlements",
      <>
        <Route element={<OperatorPaymentsHubLayout />}>
          <Route path="/finance/settlements" element={<div>por-pagar</div>} />
        </Route>
        <Route path="/settings/approvals" element={<ApprovalPoliciesPage />} />
      </>,
    );

    await user.click(await screen.findByRole("button", { name: settlementsCopy.hub.approvalPoliciesAction }));
    expect(screen.getByTestId("location")).toHaveTextContent("/settings/approvals?concept=settlement");
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(sheetCopy.titleEdit("Liquidaciones"))).toBeInTheDocument();

    const baseTier = within(dialog).getByTestId("policy-tier-0");
    expect(within(baseTier).getByRole("checkbox", { name: new RegExp(sheetCopy.noApproval) })).toBeChecked();

    await applyTemplate(user, dialog, "byAmount");
    expect(within(within(dialog).getByTestId("policy-tier-0")).getByRole("checkbox", { name: new RegExp(sheetCopy.noApproval) })).toBeChecked();

    const { confirm, accept } = await saveAndConfirm(user, dialog);
    expect(within(confirm).getByText(copy.confirm.description(2))).toBeInTheDocument();
    await accept();

    await waitFor(() => expect(mockPoliciesApi.save).toHaveBeenCalledTimes(1));
    const payload = mockPoliciesApi.save.mock.calls[0]![0];
    expect(payload).toMatchObject({ concept: "settlement", expectedVersion: null });
    expect(payload.rules.tiers[0]).toEqual({ minAmount: 0, conditions: {}, requiresApproval: false, steps: [] });
    expect(payload.rules.tiers[1]).toMatchObject({ minAmount: 5000, requiresApproval: true });
    expect(payload.rules.tiers[2]).toMatchObject({ minAmount: 20000, steps: [{ eligibleRoles: ["admin"] }] });
  });

  it("AP-13. Umbral solo en la regla: estándar $5,000 en la tarjeta → editar el «Desde» a $8,000 → PUT con dos tramos, Personalizada v1 e invalida settings de liquidaciones", async () => {
    const user = userEvent.setup();
    setOverview(
      overview(true, { settlement: { rules: settlementThresholdRules(5000), voboThresholdMxn: 5000 } }),
    );
    mockPoliciesApi.save.mockImplementation(async ({ concept, rules }: { concept: ApprovalConcept; rules: ApprovalRules }) => {
      setOverview(
        overview(true, {
          settlement: {
            source: "tenant",
            version: 1,
            effectiveFrom: EFFECTIVE_FROM,
            createdByName: AUTHOR,
            rules,
            summary: "Desde $0.00: sin autorización · Desde $8,000.00: cualquier autorizador",
            voboThresholdMxn: 8000,
          },
        }),
      );
      return savedFrom(concept, rules, 1);
    });
    const client = createClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");
    renderPoliciesPage("/settings/approvals", client);

    const card = await screen.findByTestId("approval-policy-card-settlement");
    expect(within(card).getByText(copy.card.standardBadge)).toBeInTheDocument();
    expect(within(card).getByText(copy.card.standardTextWithThreshold(formatPolicyAmount(5000)))).toBeInTheDocument();
    expect(within(card).getByTestId("approval-policy-threshold")).toHaveTextContent(
      copy.card.settlementThreshold(formatPolicyAmount(5000)),
    );

    const dialog = await openEditor(user, "settlement");
    const amount = within(within(dialog).getByTestId("policy-tier-1")).getByLabelText(sheetCopy.minAmount);
    expect(amount).toHaveAccessibleDescription(sheetCopy.thresholdAmountHint);
    await user.clear(amount);
    await user.type(amount, "8000");

    const { accept } = await saveAndConfirm(user, dialog);
    await accept();

    await waitFor(() => expect(mockPoliciesApi.save).toHaveBeenCalledTimes(1));
    const payload = mockPoliciesApi.save.mock.calls[0]![0];
    expect(payload).toMatchObject({ concept: "settlement", expectedVersion: null });
    expect(payload.rules.tiers).toHaveLength(2);
    expect(payload.rules.tiers[0]).toEqual({ minAmount: 0, conditions: {}, requiresApproval: false, steps: [] });
    expect(payload.rules.tiers[1]).toMatchObject({ minAmount: 8000, requiresApproval: true });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: settlementsQueryKeys.settings() });
    expect(mockApiPatch).not.toHaveBeenCalled();

    await waitFor(() => {
      const updated = screen.getByTestId("approval-policy-card-settlement");
      expect(within(updated).getByText(copy.card.customBadge)).toBeInTheDocument();
      expect(within(updated).getByTestId("approval-policy-threshold")).toHaveTextContent(
        copy.card.settlementThreshold(formatPolicyAmount(8000)),
      );
    });
    expect(within(screen.getByTestId("approval-policy-card-settlement")).getByText(/^v1 · /)).toBeInTheDocument();
  });

  describe("AP-14. Padrón de candidatos sin tope de 100 (web#45)", () => {
    const peopleTrigger = (scope: HTMLElement, stepNo = 1) =>
      within(scope).getByRole("button", { name: `${sheetCopy.peopleLabel} · ${sheetCopy.stepTitle(stepNo)}` });

    it("150 candidatos con «Zulema» al final: se busca, se elige y el PUT la incluye en eligible_user_ids", async () => {
      const user = userEvent.setup();
      const { approvalPoliciesApi: realApi } = await vi.importActual<
        typeof import("@features/approval-policies/infrastructure/approvalPoliciesApi")
      >("@features/approval-policies/infrastructure/approvalPoliciesApi");
      const roles = ["admin", "manager", "accountant"] as const;
      const apiUsers = [
        ...Array.from({ length: 149 }, (_, i) => ({
          id: `u-${String(i + 1).padStart(3, "0")}`,
          full_name: `Persona ${String(i + 1).padStart(3, "0")}`,
          role: roles[i % roles.length],
        })),
        { id: "u-zulema", full_name: "Zulema Zapata", role: "accountant" },
      ];
      mockApiGet.mockImplementation(async (url: string) =>
        url === "/approval-policies/candidates" ? { data: { users: apiUsers } } : { data: [] },
      );
      mockApiPut.mockImplementation(async (url: string, body: { rules: unknown }) => ({
        message: copy.toasts.saved,
        data: {
          concept: url.split("/").pop(),
          source: "tenant",
          version: 1,
          effective_from: EFFECTIVE_FROM,
          created_by: "u-admin",
          rules: body.rules,
          summary: "x",
          warnings: [],
        },
      }));
      mockPoliciesApi.listCandidateUsers.mockImplementation(realApi.listCandidateUsers);
      mockPoliciesApi.save.mockImplementation(realApi.save);
      renderPoliciesPage();

      const dialog = await openEditor(user, "driver_advance");
      const step = within(dialog).getByTestId("policy-tier-0-step-0");
      await waitFor(() =>
        expect(within(step).getByTestId("policy-tier-0-step-0-eligible")).toHaveTextContent(
          sheetCopy.eligibleCount(150),
        ),
      );
      expect(mockApiGet).toHaveBeenCalledWith("/approval-policies/candidates");

      await user.click(peopleTrigger(step));
      expect(await screen.findAllByRole("option")).toHaveLength(150);
      await user.type(screen.getByPlaceholderText(sheetCopy.peopleSearch), "Zulema");
      await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(1));
      await user.click(screen.getByRole("option", { name: /Zulema Zapata/ }));
      await user.keyboard("{Escape}");
      expect(within(step).getByTestId("policy-tier-0-step-0-person-u-zulema")).toHaveTextContent("Zulema Zapata");

      const { accept } = await saveAndConfirm(user, dialog);
      await accept();

      await waitFor(() => expect(mockApiPut).toHaveBeenCalledTimes(1));
      const [url, body] = mockApiPut.mock.calls[0]! as [string, { eligible_user_ids: string[] }];
      expect(url).toBe("/approval-policies/driver_advance");
      expect(body.eligible_user_ids).toContain("u-zulema");
    });

    it("versión vigente que nombra a un suspendido: chip con nombre, se puede quitar y no cuenta como elegible", async () => {
      const user = userEvent.setup();
      setOverview(
        overview(true, {
          settlement: {
            source: "tenant",
            version: 2,
            effectiveFrom: EFFECTIVE_FROM,
            rules: {
              rulesSchemaVersion: 1,
              tiers: [
                {
                  minAmount: 0,
                  conditions: {},
                  requiresApproval: true,
                  steps: [{ eligibleRoles: ["admin"], eligibleUserIds: ["u-susp"] }],
                },
              ],
            },
          },
        }),
      );
      mockPoliciesApi.listCandidateUsers.mockResolvedValue({
        users: CANDIDATES,
        referencedUsers: [{ id: "u-susp", fullName: "Sergio Suspendido", role: "manager", status: "suspended" }],
      });
      mockPoliciesApi.save.mockImplementation(async ({ concept, rules }: { concept: ApprovalConcept; rules: ApprovalRules }) =>
        savedFrom(concept, rules, 3),
      );
      renderPoliciesPage();

      const dialog = await openEditor(user, "settlement");
      const step = within(dialog).getByTestId("policy-tier-0-step-0");
      const chip = await within(step).findByTestId("policy-tier-0-step-0-person-u-susp");
      expect(chip).toHaveTextContent("Sergio Suspendido");
      expect(chip).toHaveTextContent(sheetCopy.personState.suspended);
      expect(within(step).getByTestId("policy-tier-0-step-0-eligible")).toHaveTextContent(sheetCopy.eligibleCount(1));

      await user.click(within(chip).getByRole("button", { name: sheetCopy.removePerson("Sergio Suspendido") }));
      expect(within(step).queryByTestId("policy-tier-0-step-0-person-u-susp")).not.toBeInTheDocument();
      expect(within(step).getByTestId("policy-tier-0-step-0-eligible")).toHaveTextContent(sheetCopy.eligibleCount(1));

      const { accept } = await saveAndConfirm(user, dialog);
      await accept();
      await waitFor(() => expect(mockPoliciesApi.save).toHaveBeenCalledTimes(1));
      const payload = mockPoliciesApi.save.mock.calls[0]![0];
      expect(payload).toMatchObject({ concept: "settlement", expectedVersion: 2 });
      expect(payload.rules.tiers[0].steps[0]).toEqual({ eligibleRoles: ["admin"], eligibleUserIds: [] });
    });
  });
});
