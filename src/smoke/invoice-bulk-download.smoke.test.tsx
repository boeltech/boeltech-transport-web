/**
 * Smoke ADR-0104 — descarga masiva CFDI (F4 UI).
 * Mock de hooks/API; no requiere backend ni worker.
 * Cubre: abrir → preview → crear → progreso → listo → descargar; 409; deep link.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { FinanceInvoicesPage } from "@features/finance/presentation/pages/FinanceInvoicesPage";
import { invoiceBulkDownloadCopy } from "@features/invoicing/presentation/copy/invoiceBulkDownloadCopy";
import type { InvoiceBulkDownloadJob } from "@features/invoicing/domain";
import { NOTIFICATION_TYPE_CONFIG } from "@features/notifications/presentation/config/notificationTypeConfig";
import { NOTIFICATION_SOURCE_LABELS } from "@features/notifications/presentation/copy/notificationsCopy";
import {
  NOTIFICATION_SOURCES,
  NOTIFICATION_TYPES,
} from "@features/notifications/domain";

const mocks = vi.hoisted(() => {
  const jobListeners = new Set<() => void>();
  return {
    hasPermission: vi.fn((module: string, action: string) => {
      if (module === "invoices" && action === "execute") return true;
      return false;
    }),
    role: "accountant" as string,
    previewData: {
      invoiceCount: 10,
      cancelledCount: 0,
      paymentCount: 1,
      filesTotal: 21,
      exceedsLimit: false,
      limits: { maxMonths: 12, maxDocuments: 3000 },
      earliestAllowedPeriod: null as string | null,
    },
    createMutateAsync: vi.fn(),
    downloadMutate: vi.fn(),
    jobById: null as InvoiceBulkDownloadJob | null,
    jobLoading: false,
    jobListeners,
    setJobById(job: InvoiceBulkDownloadJob | null) {
      this.jobById = job;
      for (const listener of jobListeners) listener();
    },
  };
});

vi.mock("@features/auth", () => ({
  useAuth: () => ({ user: { role: mocks.role } }),
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: mocks.hasPermission,
    isLoading: false,
    isAuthenticated: true,
    role: mocks.role,
    can: () => true,
    hasRole: () => true,
  }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...mod,
    useToast: () => ({ toast: vi.fn() }),
    useQueryErrorToast: () => undefined,
  };
});

vi.mock("@features/trips", () => ({
  InvoiceableTripPickerSheet: () => null,
}));

vi.mock("@features/invoicing", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/invoicing")>();
  return {
    ...actual,
    canShowInvoiceFromTripCta: () => false,
  };
});

vi.mock("@features/clients/application", () => ({
  useActiveClients: () => ({ data: [], isLoading: false }),
}));

vi.mock("@features/finance/application", () => ({
  isFinanceAnalyticsEnabled: () => false,
  useFinanceInvoicesList: () => ({
    data: {
      data: [],
      pagination: { page: 1, totalPages: 1, total: 0, limit: 10 },
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  }),
  useFinanceSummary: () => ({ data: undefined, isLoading: false }),
  useFinanceListingFilters: () => ({
    search: "",
    page: 1,
    filters: { bucket: "" },
    searchProps: { value: "", onChange: vi.fn(), placeholder: "" },
    activeChips: [],
    hasFilters: false,
    setFilter: vi.fn(),
    setPage: vi.fn(),
    clearAll: vi.fn(),
  }),
}));

vi.mock("@features/invoicing/application/hooks/useInvoiceBulkDownload", () => ({
  useInvoiceBulkDownloadPreview: () => ({
    data: mocks.previewData,
    isFetching: false,
    isError: false,
    error: null,
  }),
  useCreateInvoiceBulkDownload: () => ({
    mutateAsync: mocks.createMutateAsync,
    isPending: false,
  }),
  getBulkDownloadInProgressActiveId: (error: unknown) => {
    const e = error as { code?: string; details?: { active_id?: string } };
    if (e?.code === "BULK_DOWNLOAD_IN_PROGRESS" && e.details?.active_id) {
      return e.details.active_id;
    }
    return null;
  },
  useInvoiceBulkDownload: () => {
    const [, setTick] = useState(0);
    useEffect(() => {
      const listener = () => setTick((n) => n + 1);
      mocks.jobListeners.add(listener);
      return () => {
        mocks.jobListeners.delete(listener);
      };
    }, []);
    return {
      data: mocks.jobById,
      isLoading: mocks.jobLoading,
      isError: false,
      error: null,
    };
  },
  invalidateNotificationsAfterBulkDownloadTerminal: vi.fn(),
  useMyInvoiceBulkDownloads: () => ({ data: [], isLoading: false }),
  useDownloadInvoiceBulkDownloadPart: () => ({
    mutate: mocks.downloadMutate,
    isPending: false,
  }),
}));

function queuedJob(id: string): InvoiceBulkDownloadJob {
  return {
    id,
    status: "queued",
    periodFrom: "2026-09",
    periodTo: "2026-09",
    receiverRfc: null,
    content: "xml_pdf",
    includePayments: true,
    includeCancelled: false,
    invoiceCount: 10,
    paymentCount: 1,
    filesTotal: 21,
    filesDone: 0,
    warningsCount: 0,
    warnings: [],
    parts: [],
    errorCode: null,
    errorMessage: null,
    createdAt: "2026-10-11T00:00:00.000Z",
    startedAt: null,
    completedAt: null,
    expiresAt: null,
  };
}

function completedJob(id: string): InvoiceBulkDownloadJob {
  return {
    ...queuedJob(id),
    status: "completed",
    filesDone: 21,
    parts: [
      {
        part: 1,
        fileName: "CFDI_X_2026-09.zip",
        bytes: 1000,
        fileCount: 21,
      },
    ],
    completedAt: "2026-10-11T00:05:00.000Z",
    expiresAt: "2026-10-18T00:05:00.000Z",
  };
}

function TestProviders({
  children,
  initialEntry = "/finance/invoices",
}: {
  children: ReactNode;
  initialEntry?: string;
}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/finance/invoices" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("smoke invoice-bulk-download", () => {
  beforeEach(() => {
    mocks.role = "accountant";
    mocks.hasPermission.mockImplementation((module: string, action: string) => {
      if (module === "invoices" && action === "execute") return true;
      return false;
    });
    mocks.previewData = {
      invoiceCount: 10,
      cancelledCount: 0,
      paymentCount: 1,
      filesTotal: 21,
      exceedsLimit: false,
      limits: { maxMonths: 12, maxDocuments: 3000 },
      earliestAllowedPeriod: null,
    };
    mocks.createMutateAsync.mockReset();
    mocks.downloadMutate.mockReset();
    mocks.setJobById(null);
    mocks.jobLoading = false;
  });

  it("tipos de notificación son exhaustivos", () => {
    for (const type of NOTIFICATION_TYPES) {
      expect(NOTIFICATION_TYPE_CONFIG[type]).toBeDefined();
    }
    for (const source of NOTIFICATION_SOURCES) {
      expect(NOTIFICATION_SOURCE_LABELS[source]).toBeDefined();
    }
  });

  it("admin ve Descargar CFDI; client no", () => {
    const { unmount } = render(
      <TestProviders>
        <FinanceInvoicesPage />
      </TestProviders>,
    );
    expect(
      screen.getByRole("button", { name: invoiceBulkDownloadCopy.actionButton }),
    ).toBeInTheDocument();
    unmount();

    mocks.role = "client";
    mocks.hasPermission.mockReturnValue(false);
    render(
      <TestProviders>
        <FinanceInvoicesPage />
      </TestProviders>,
    );
    expect(
      screen.queryByRole("button", {
        name: invoiceBulkDownloadCopy.actionButton,
      }),
    ).not.toBeInTheDocument();
  });

  it("flujo: abrir → preview → preparar → progreso → listo → descargar", async () => {
    const user = userEvent.setup();
    const jobId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    mocks.createMutateAsync.mockImplementation(async () => {
      mocks.setJobById(queuedJob(jobId));
      return mocks.jobById!;
    });

    render(
      <TestProviders>
        <FinanceInvoicesPage />
      </TestProviders>,
    );

    await user.click(
      screen.getByRole("button", { name: invoiceBulkDownloadCopy.actionButton }),
    );

    const sheet = await screen.findByRole("dialog");
    expect(
      within(sheet).getByText(invoiceBulkDownloadCopy.sheet.title),
    ).toBeInTheDocument();
    expect(
      within(sheet).getByText(
        invoiceBulkDownloadCopy.preview.summary(10, 1),
      ),
    ).toBeInTheDocument();

    await user.click(
      within(sheet).getByRole("button", {
        name: invoiceBulkDownloadCopy.prepare,
      }),
    );

    await waitFor(() => {
      expect(mocks.createMutateAsync).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(
        screen.getByText(invoiceBulkDownloadCopy.queued),
      ).toBeInTheDocument();
    });

    act(() => {
      mocks.setJobById(completedJob(jobId));
    });

    await waitFor(() => {
      expect(
        screen.getByText(invoiceBulkDownloadCopy.statusReady),
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", {
        name: invoiceBulkDownloadCopy.downloadZip,
      }),
    );
    expect(mocks.downloadMutate).toHaveBeenCalledWith(
      expect.objectContaining({ id: jobId, part: 1 }),
    );
  });

  it("409 lleva al job activo", async () => {
    const user = userEvent.setup();
    const activeId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    mocks.createMutateAsync.mockRejectedValue({
      code: "BULK_DOWNLOAD_IN_PROGRESS",
      details: { active_id: activeId },
      message: "en curso",
    });
    mocks.setJobById(queuedJob(activeId));

    render(
      <TestProviders>
        <FinanceInvoicesPage />
      </TestProviders>,
    );

    await user.click(
      screen.getByRole("button", { name: invoiceBulkDownloadCopy.actionButton }),
    );
    const sheet = await screen.findByRole("dialog");
    await user.click(
      within(sheet).getByRole("button", {
        name: invoiceBulkDownloadCopy.prepare,
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(invoiceBulkDownloadCopy.queued),
      ).toBeInTheDocument();
    });
  });

  it("deep link ?download= abre Sheet en modo estado", async () => {
    const jobId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
    mocks.setJobById(completedJob(jobId));

    render(
      <TestProviders initialEntry={`/finance/invoices?download=${jobId}`}>
        <FinanceInvoicesPage />
      </TestProviders>,
    );

    const sheet = await screen.findByRole("dialog");
    expect(
      within(sheet).getByText(invoiceBulkDownloadCopy.statusReady),
    ).toBeInTheDocument();
    expect(
      within(sheet).getByRole("button", {
        name: invoiceBulkDownloadCopy.downloadZip,
      }),
    ).toBeInTheDocument();

    await userEvent.click(
      within(sheet).getByRole("button", {
        name: invoiceBulkDownloadCopy.downloadZip,
      }),
    );
    expect(mocks.downloadMutate).toHaveBeenCalledWith(
      expect.objectContaining({ id: jobId, part: 1 }),
    );
  });
});
