import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { ApiError } from "@shared/api/interceptors/error-handler";
import type { ApprovalPoliciesOverview, ConceptPolicy } from "../../domain";
import { approvalPoliciesCopy } from "../copy/approvalPoliciesCopy";
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
    mockApi.listCandidateUsers.mockResolvedValue([
      { id: "u-admin", fullName: "Ana Admin", role: "admin" },
      { id: "u-mgr", fullName: "Mario Gerente", role: "manager" },
    ]);
  });

  it("estado estándar: 4 tarjetas con «Usando la regla estándar» y nota de piso", async () => {
    mockApi.getOverview.mockResolvedValue(overview(true));
    renderPage();
    expect(await screen.findByTestId("approval-policy-card-driver_advance")).toBeInTheDocument();
    expect(screen.getAllByText(approvalPoliciesCopy.card.standardText)).toHaveLength(4);
    expect(screen.getAllByText(approvalPoliciesCopy.floorNote.text).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: approvalPoliciesCopy.card.customize })).toHaveLength(4);
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
