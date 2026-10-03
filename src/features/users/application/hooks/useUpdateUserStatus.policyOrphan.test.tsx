import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@shared/api/interceptors/error-handler";
import {
  PolicyOrphanConfirmDialog,
  approvalPoliciesCopy,
} from "@features/approval-policies/presentation";
import { usePolicyOrphanConfirmation } from "@features/approval-policies/application";
import { useUpdateUserStatus } from "./useUsers";

const mockPatch = vi.hoisted(() => vi.fn());
const mockOnError = vi.hoisted(() => vi.fn());

vi.mock("@shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/api")>();
  return { ...actual, apiClient: { ...actual.apiClient, patch: mockPatch } };
});

const okResponse = {
  data: {
    id: "u-1",
    email: "ana@test.mx",
    first_name: "Ana",
    last_name: "López",
    role: "manager",
    status: "inactive",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
  },
};

/** Mismo cableado que UsersListPage / UserDetailPage (ADR-0099 D12). */
function Harness() {
  const orphan = usePolicyOrphanConfirmation();
  const mutation = useUpdateUserStatus({
    onError: (error, variables) => {
      const retry = () =>
        mutation.mutate({ ...variables, data: { ...variables.data, confirmPolicyOrphan: true } });
      if (orphan.intercept(error, retry)) return;
      mockOnError(error);
    },
  });
  return (
    <>
      <button type="button" onClick={() => mutation.mutate({ id: "u-1", data: { status: "inactive" } })}>
        Desactivar
      </button>
      <PolicyOrphanConfirmDialog {...orphan.dialog} pending={mutation.isPending} />
    </>
  );
}

function renderHarness() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Harness />
    </QueryClientProvider>,
  );
}

describe("guard de huérfanos al desactivar un usuario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra el detalle y reenvía con confirm_policy_orphan solo al confirmar", async () => {
    mockPatch
      .mockRejectedValueOnce(
        new ApiError(
          "Este cambio deja pasos de una regla de autorización sin nadie que pueda firmarlos",
          409,
          "APPROVAL_POLICY_ORPHAN_GUARD",
          {
            violations: [{ concept: "settlement", policy_version: 2, tier_index: 1, step_no: 2, reason: "no_eligible" }],
          },
        ),
      )
      .mockResolvedValueOnce(okResponse);
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByRole("button", { name: "Desactivar" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText(approvalPoliciesCopy.orphan.line("Liquidaciones", 2, 2))).toBeInTheDocument();
    expect(mockPatch).toHaveBeenCalledTimes(1);
    expect(mockPatch.mock.calls[0]![1]).toEqual({ status: "inactive" });
    expect(mockOnError).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: approvalPoliciesCopy.orphan.confirm }));
    await waitFor(() => expect(mockPatch).toHaveBeenCalledTimes(2));
    expect(mockPatch.mock.calls[1]![0]).toBe("/users/u-1/status");
    expect(mockPatch.mock.calls[1]![1]).toEqual({ status: "inactive", confirm_policy_orphan: true });
  });

  it("cancelar no reenvía", async () => {
    mockPatch.mockRejectedValueOnce(
      new ApiError("x", 409, "APPROVAL_POLICY_ORPHAN_GUARD", { violations: [] }),
    );
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByRole("button", { name: "Desactivar" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: approvalPoliciesCopy.orphan.cancel }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(mockPatch).toHaveBeenCalledTimes(1);
  });
});
