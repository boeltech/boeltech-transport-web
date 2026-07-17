import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BranchReconcilePlanSheet } from "./BranchReconcilePlanSheet";
import { branchesCopy } from "../copy/branchesCopy";
import { buildBranchListMeta } from "../../test/branchTestFixtures";
import { branchesApi } from "../../infrastructure";
import type { BranchReconcilePreview } from "../../domain";

vi.mock("../../infrastructure", () => ({
  branchesApi: {
    getReconcilePreview: vi.fn(),
    reconcilePlan: vi.fn(),
  },
}));

const mockedApi = vi.mocked(branchesApi);

const QRO = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const MTY = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const AGU = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

function buildPreview(): BranchReconcilePreview {
  return {
    capacity: buildBranchListMeta({
      activeCount: 3,
      maxBranches: 1,
      limitReached: true,
      overQuota: true,
      overQuotaCount: 2,
      requiresRemediation: true,
      planEligibleBranchIds: [QRO],
    }),
    branches: [
      {
        id: QRO,
        code: "QRO-01",
        name: "Querétaro",
        isMain: true,
        employeeCount: 0,
        isPlanEligible: true,
        preselected: true,
      },
      {
        id: MTY,
        code: "MTY-01",
        name: "Monterrey",
        isMain: false,
        employeeCount: 0,
        isPlanEligible: false,
        preselected: false,
      },
      {
        id: AGU,
        code: "AGU-01",
        name: "Aguascalientes",
        isMain: false,
        employeeCount: 0,
        isPlanEligible: false,
        preselected: false,
      },
    ],
  };
}

function renderSheet() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BranchReconcilePlanSheet open onOpenChange={() => {}} />
    </QueryClientProvider>,
  );
}

const copy = branchesCopy.overQuota.sheet;

describe("BranchReconcilePlanSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.getReconcilePreview.mockResolvedValue({ data: buildPreview() });
    mockedApi.reconcilePlan.mockResolvedValue({
      data: buildBranchListMeta({ overQuota: false }),
    });
  });

  it("lets the user keep a non-main branch without the main checkbox getting stuck", async () => {
    const user = userEvent.setup();
    renderSheet();

    const qroRow = (await screen.findByText("QRO-01 — Querétaro")).closest("label");
    const mtyRow = screen.getByText("MTY-01 — Monterrey").closest("label");
    expect(qroRow).not.toBeNull();
    expect(mtyRow).not.toBeNull();

    // La matriz viene preseleccionada y su checkbox NO está bloqueado.
    const qroCheckbox = within(qroRow as HTMLElement).getByRole("checkbox");
    expect(qroCheckbox).toBeEnabled();
    expect(qroCheckbox).toBeChecked();

    // Al elegir MTY, la matriz se deselecciona pero sigue habilitada.
    await user.click(within(mtyRow as HTMLElement).getByRole("checkbox"));

    expect(within(mtyRow as HTMLElement).getByText(copy.keepBadge)).toBeInTheDocument();
    expect(
      within(mtyRow as HTMLElement).getByText(copy.newMainBadge),
    ).toBeInTheDocument();
    expect(qroCheckbox).toBeEnabled();
    expect(qroCheckbox).not.toBeChecked();

    // Y puede volver a seleccionarse (bug corregido).
    await user.click(qroCheckbox);
    expect(qroCheckbox).toBeChecked();
  });

  it("sends the kept branch as the new main branch on confirm", async () => {
    const user = userEvent.setup();
    renderSheet();

    const mtyRow = (await screen.findByText("MTY-01 — Monterrey")).closest("label");
    await user.click(within(mtyRow as HTMLElement).getByRole("checkbox"));

    await user.click(screen.getByRole("button", { name: copy.confirm }));

    await waitFor(() => {
      expect(mockedApi.reconcilePlan).toHaveBeenCalledWith({
        keepBranchIds: [MTY],
        mainBranchId: MTY,
        employeeReassignments: [],
      });
    });
  });
});
