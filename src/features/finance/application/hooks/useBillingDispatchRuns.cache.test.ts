import { describe, expect, it, vi, beforeEach } from "vitest";

import { useConfirmSendBillingDispatchRun } from "./useBillingDispatchRuns";

const invalidateQueries = vi.fn().mockResolvedValue(undefined);
const setQueryData = vi.fn();
const useMutationMock = vi.fn((config: unknown) => config);
const toast = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: (config: unknown) => useMutationMock(config),
  useQueryClient: () => ({
    invalidateQueries,
    setQueryData,
  }),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast }),
}));

vi.mock("../../infrastructure/billingDispatchRunsApi", () => ({
  confirmSendBillingDispatchRun: vi.fn(),
  createBillingDispatchRun: vi.fn(),
  cancelBillingDispatchRun: vi.fn(),
  previewBillingDispatchRun: vi.fn(),
  fetchBillingDispatchRuns: vi.fn(),
  fetchBillingDispatchRunById: vi.fn(),
  fetchBillingDispatchPeriodPreview: vi.fn(),
}));

vi.mock("@features/invoicing/application", () => ({
  invalidateDispatchLists: vi.fn((qc: { invalidateQueries: typeof invalidateQueries }) => {
    void qc.invalidateQueries({ queryKey: ["invoices", "list"] });
    void qc.invalidateQueries({ queryKey: ["invoices", "dispatch-documents"] });
    void qc.invalidateQueries({ queryKey: ["finance"] });
  }),
}));

describe("useConfirmSendBillingDispatchRun cache (C3)", () => {
  beforeEach(() => {
    invalidateQueries.mockReset();
    invalidateQueries.mockResolvedValue(undefined);
    setQueryData.mockReset();
    useMutationMock.mockClear();
    toast.mockReset();
  });

  it("invalidates Envíos, invoice lists and finance after confirmSend", async () => {
    const mutationConfig = useConfirmSendBillingDispatchRun() as unknown as {
      onSuccess: (run: {
        id: string;
        status: string;
        errorSummary?: string | null;
      }) => void;
    };

    await mutationConfig.onSuccess({
      id: "run-1",
      status: "send_confirmed",
      errorSummary: null,
    });

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["invoices", "dispatch-documents"],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["invoices", "list"],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["finance"],
    });
  });
});
