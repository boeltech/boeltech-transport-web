import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import {
  invoiceBulkDownloadKeys,
  type InvoiceBulkDownloadJob,
} from "@features/invoicing/domain";
import { useInvoiceBulkDownload } from "./useInvoiceBulkDownload";
import { invoiceBulkDownloadApi } from "../../infrastructure/invoiceBulkDownloadApi";

const invalidateNotificationsSpy = vi.fn();

vi.mock("@features/notifications/application/invalidateNotificationsQueries", () => ({
  invalidateNotificationsQueries: (...args: unknown[]) =>
    invalidateNotificationsSpy(...args),
}));

vi.mock("../../infrastructure/invoiceBulkDownloadApi", () => ({
  invoiceBulkDownloadApi: {
    getById: vi.fn(),
    preview: vi.fn(),
    create: vi.fn(),
    listMine: vi.fn(),
    downloadPart: vi.fn(),
  },
}));

vi.mock("@shared/hooks/use-debounce", () => ({
  useDebounce: <T,>(value: T) => value,
}));

vi.mock("@/shared/config/devPolling", () => ({
  devRefetchIntervalFn: () => false,
}));

function makeJob(
  status: InvoiceBulkDownloadJob["status"],
): InvoiceBulkDownloadJob {
  return {
    id: "job-1",
    status,
    periodFrom: "2026-10",
    periodTo: "2026-10",
    receiverRfc: null,
    content: "xml_pdf",
    includePayments: true,
    includeCancelled: false,
    invoiceCount: 1,
    paymentCount: 0,
    filesTotal: 1,
    filesDone: status === "completed" ? 1 : 0,
    warningsCount: 0,
    warnings: [],
    parts: [],
    errorCode: null,
    errorMessage: null,
    createdAt: "2026-11-20T00:00:00.000Z",
    startedAt: "2026-11-20T00:00:30.000Z",
    completedAt: status === "completed" ? "2026-11-20T00:01:00.000Z" : null,
    expiresAt: null,
  };
}

describe("useInvoiceBulkDownload terminal notifications (C6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invalidates notifications when job transitions to terminal", async () => {
    const getById = vi.mocked(invoiceBulkDownloadApi.getById);
    getById.mockResolvedValue(makeJob("processing"));

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () => useInvoiceBulkDownload("job-1", { enabled: true }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.data?.status).toBe("processing");
    });

    await act(async () => {
      queryClient.setQueryData(
        invoiceBulkDownloadKeys.detail("job-1"),
        makeJob("completed"),
      );
    });

    await waitFor(() => {
      expect(result.current.data?.status).toBe("completed");
      expect(invalidateNotificationsSpy).toHaveBeenCalled();
    });
  });
});
