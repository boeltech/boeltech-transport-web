/**
 * Smoke ADR-0074 — import CSV maestros: hub → wizard clients → validate → commit → resultado.
 * Incluye flujo con errores + CTA descargar errores (P0).
 * Mock de importsApi; no requiere backend ni Playwright.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ImportsHubPage } from "@features/imports/presentation/pages/ImportsHubPage";
import { importsCopy } from "@features/imports/presentation/copy/importsCopy";
import type {
  ImportCommitResult,
  ImportJob,
  ImportPreviewResult,
} from "@features/imports/domain";

const mockListJobs = vi.fn();
const mockValidate = vi.fn();
const mockCommit = vi.fn();
const mockDownloadTemplate = vi.fn();
const mockGetJob = vi.fn();
const mockGetJobErrors = vi.fn();
const mockDownloadJobErrors = vi.fn();

vi.mock("@features/imports/infrastructure/importsApi", () => ({
  importsApi: {
    listJobs: (...args: unknown[]) => mockListJobs(...args),
    validate: (...args: unknown[]) => mockValidate(...args),
    commit: (...args: unknown[]) => mockCommit(...args),
    downloadTemplate: (...args: unknown[]) => mockDownloadTemplate(...args),
    getJob: (...args: unknown[]) => mockGetJob(...args),
    getJobErrors: (...args: unknown[]) => mockGetJobErrors(...args),
    downloadJobErrors: (...args: unknown[]) => mockDownloadJobErrors(...args),
  },
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: (module: string, action: string) => {
      if (module === "imports") {
        return action === "read" || action === "execute";
      }
      return true;
    },
    isLoading: false,
    isAuthenticated: true,
    role: "admin",
  }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
  };
});

const NOW = "2026-08-08T12:00:00.000Z";

const emptyList = {
  data: [] as ImportJob[],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
};

const previewResult: ImportPreviewResult = {
  id: "job-1",
  tenantId: "tenant-1",
  entityType: "clients",
  status: "validated",
  originalFilename: "clients.csv",
  fileSha256: "abc",
  rowCount: 1,
  validCount: 1,
  errorCount: 0,
  insertedCount: 0,
  updatedCount: 0,
  skippedCount: 0,
  options: { updateExisting: true, skipErrors: true },
  errorSummary: null,
  createdBy: "user-1",
  validatedAt: NOW,
  committedAt: null,
  createdAt: NOW,
  updatedAt: NOW,
  previewRows: [
    {
      rowNumber: 2,
      isValid: true,
      action: "insert",
      naturalKey: "XAXX010101000",
      data: { tax_id: "XAXX010101000" },
    },
  ],
  errors: [],
  optionsDefaults: { updateExisting: true, skipErrors: true },
};

const previewWithErrors: ImportPreviewResult = {
  ...previewResult,
  id: "job-err",
  rowCount: 3,
  validCount: 1,
  errorCount: 12,
  errors: Array.from({ length: 10 }, (_, i) => ({
    rowNumber: i + 3,
    codes: ["INVALID_RFC"],
    messages: [`RFC inválido ${i + 3}`],
    fields: ["tax_id"],
  })),
};

const commitResult: ImportCommitResult = {
  id: "job-1",
  status: "committed",
  insertedCount: 1,
  updatedCount: 0,
  skippedCount: 0,
  errorCount: 0,
  durationMs: 120,
};

const commitPartial: ImportCommitResult = {
  id: "job-err",
  status: "committed",
  insertedCount: 1,
  updatedCount: 0,
  skippedCount: 0,
  errorCount: 2,
  durationMs: 200,
};

const jobWithErrors: ImportJob = {
  id: "job-hist",
  tenantId: "tenant-1",
  entityType: "clients",
  status: "committed",
  originalFilename: "bad-clients.csv",
  fileSha256: "def",
  rowCount: 5,
  validCount: 3,
  errorCount: 2,
  insertedCount: 3,
  updatedCount: 0,
  skippedCount: 0,
  options: { updateExisting: true, skipErrors: true },
  errorSummary: { sampleCodes: ["INVALID_RFC"] },
  createdBy: "user-1",
  validatedAt: NOW,
  committedAt: NOW,
  createdAt: NOW,
  updatedAt: NOW,
};

function seedMocks() {
  mockListJobs.mockResolvedValue(emptyList);
  mockValidate.mockResolvedValue(previewResult);
  mockCommit.mockResolvedValue(commitResult);
  mockDownloadTemplate.mockResolvedValue(undefined);
  mockDownloadJobErrors.mockResolvedValue(undefined);
}

function renderHub(initialEntry = "/settings/imports") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/settings/imports" element={<ImportsHubPage />} />
          <Route path="/settings/*" element={<ImportsHubPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("imports workflow smoke (ADR-0074)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedMocks();
  });

  it("hub → wizard clients → validate → commit → resultado", async () => {
    const user = userEvent.setup();
    renderHub();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: importsCopy.hub.title }),
      ).toBeInTheDocument();
    });

    expect(mockListJobs).toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: importsCopy.hub.newImport }),
    );

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText(importsCopy.wizard.titleGeneric),
    ).toBeInTheDocument();

    const file = new File(
      ["tax_id,legal_name\nXAXX010101000,Acme SA\n"],
      "clients.csv",
      { type: "text/csv" },
    );
    const fileInput = within(dialog).getByLabelText(
      importsCopy.wizard.upload.chooseFile,
    );
    await user.upload(fileInput, file);

    await user.click(
      within(dialog).getByRole("button", {
        name: importsCopy.wizard.upload.next,
      }),
    );

    await waitFor(() => {
      expect(mockValidate).toHaveBeenCalledWith(
        "clients",
        expect.any(File),
        expect.anything(),
      );
    });

    await waitFor(() => {
      expect(
        within(dialog).getByText(
          importsCopy.wizard.validate.summary(1, 0, 1),
        ),
      ).toBeInTheDocument();
    });

    await user.click(
      within(dialog).getByRole("button", {
        name: importsCopy.wizard.validate.next,
      }),
    );

    await user.click(
      within(dialog).getByRole("button", {
        name: importsCopy.wizard.options.confirm,
      }),
    );

    await waitFor(() => {
      expect(mockCommit).toHaveBeenCalledWith(
        "job-1",
        expect.objectContaining({
          updateExisting: true,
          skipErrors: true,
        }),
      );
    });

    await waitFor(() => {
      expect(
        within(dialog).getByText(importsCopy.wizard.result.successTitle),
      ).toBeInTheDocument();
    });

    expect(
      within(dialog).getByText(
        importsCopy.wizard.result.counts(1, 0, 0, 0),
      ),
    ).toBeInTheDocument();
  });

  it("muestra Descargar errores en validación y llama downloadJobErrors", async () => {
    mockValidate.mockResolvedValue(previewWithErrors);
    const user = userEvent.setup();
    renderHub();

    await user.click(
      await screen.findByRole("button", { name: importsCopy.hub.newImport }),
    );
    const dialog = await screen.findByRole("dialog");

    const file = new File(
      ["tax_id,legal_name\nBAD,Acme\n"],
      "bad.csv",
      { type: "text/csv" },
    );
    await user.upload(
      within(dialog).getByLabelText(importsCopy.wizard.upload.chooseFile),
      file,
    );
    await user.click(
      within(dialog).getByRole("button", {
        name: importsCopy.wizard.upload.next,
      }),
    );

    await waitFor(() => {
      expect(
        within(dialog).getByText(
          importsCopy.wizard.validate.summary(1, 12, 3),
        ),
      ).toBeInTheDocument();
    });

    expect(
      within(dialog).getByText(importsCopy.wizard.validate.moreErrors(2)),
    ).toBeInTheDocument();

    const downloadBtn = within(dialog).getByRole("button", {
      name: importsCopy.wizard.validate.downloadErrors,
    });
    await user.click(downloadBtn);

    await waitFor(() => {
      expect(mockDownloadJobErrors).toHaveBeenCalledWith("job-err");
    });
  });

  it("muestra CTA de descarga en hub cuando el job tiene errores", async () => {
    mockListJobs.mockResolvedValue({
      data: [jobWithErrors],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    const user = userEvent.setup();
    renderHub();

    const downloadBtn = await screen.findByRole("button", {
      name: importsCopy.table.downloadErrorsAria("bad-clients.csv"),
    });
    await user.click(downloadBtn);

    await waitFor(() => {
      expect(mockDownloadJobErrors).toHaveBeenCalledWith("job-hist");
    });
  });

  it("resultado parcial ofrece Descargar errores", async () => {
    mockValidate.mockResolvedValue({
      ...previewWithErrors,
      errorCount: 2,
      errors: previewWithErrors.errors.slice(0, 2),
    });
    mockCommit.mockResolvedValue(commitPartial);
    const user = userEvent.setup();
    renderHub();

    await user.click(
      await screen.findByRole("button", { name: importsCopy.hub.newImport }),
    );
    const dialog = await screen.findByRole("dialog");

    const file = new File(["tax_id\nX\n"], "partial.csv", { type: "text/csv" });
    await user.upload(
      within(dialog).getByLabelText(importsCopy.wizard.upload.chooseFile),
      file,
    );
    await user.click(
      within(dialog).getByRole("button", {
        name: importsCopy.wizard.upload.next,
      }),
    );

    await waitFor(() => {
      expect(
        within(dialog).getByRole("button", {
          name: importsCopy.wizard.validate.next,
        }),
      ).toBeEnabled();
    });

    await user.click(
      within(dialog).getByRole("button", {
        name: importsCopy.wizard.validate.next,
      }),
    );
    await user.click(
      within(dialog).getByRole("button", {
        name: importsCopy.wizard.options.confirm,
      }),
    );

    await waitFor(() => {
      expect(
        within(dialog).getByText(importsCopy.wizard.result.partialTitle),
      ).toBeInTheDocument();
    });

    await user.click(
      within(dialog).getByRole("button", {
        name: importsCopy.wizard.result.downloadErrors,
      }),
    );

    await waitFor(() => {
      expect(mockDownloadJobErrors).toHaveBeenCalledWith("job-err");
    });
  });
});
