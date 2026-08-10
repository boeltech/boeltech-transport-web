import { beforeEach, describe, expect, it, vi } from "vitest";
import { importQueryKeys } from "../../domain";

const invalidateQueries = vi.fn();
const useMutationMock = vi.fn((config: unknown) => config);
const useQueryMock = vi.fn((config: unknown) => config);

vi.mock("@tanstack/react-query", () => ({
  useQuery: (config: unknown) => useQueryMock(config),
  useMutation: (config: unknown) => useMutationMock(config),
  useQueryClient: () => ({ invalidateQueries }),
}));

vi.mock("../../infrastructure", () => ({
  importsApi: {
    listJobs: vi.fn(),
    getJob: vi.fn(),
    getJobErrors: vi.fn(),
    downloadTemplate: vi.fn(),
    downloadJobErrors: vi.fn(),
    validate: vi.fn(),
    commit: vi.fn(),
  },
}));

import { importsApi } from "../../infrastructure";
import {
  useCommitImport,
  useDownloadImportJobErrors,
  useImportJobs,
  useValidateImport,
} from "./useImports";

describe("useImportJobs", () => {
  beforeEach(() => {
    useQueryMock.mockClear();
  });

  it("uses list query key with params", () => {
    const params = { entityType: "clients" as const, page: 1, limit: 20 };
    useImportJobs(params);

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: importQueryKeys.list(params),
      }),
    );
  });
});

describe("useValidateImport", () => {
  beforeEach(() => {
    useMutationMock.mockClear();
    invalidateQueries.mockClear();
  });

  it("invalidates job lists on success", () => {
    const mutation = useValidateImport() as unknown as {
      onSuccess?: (data: unknown) => void;
      mutationFn: typeof importsApi.validate;
    };

    expect(mutation.mutationFn).toBeDefined();
    mutation.onSuccess?.({ id: "job-1" });

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: importQueryKeys.lists(),
    });
  });

  it("accepts Ola B entityType employees in mutationFn args", async () => {
    const file = new File(["tax_id\n"], "employees.csv", { type: "text/csv" });
    vi.mocked(importsApi.validate).mockResolvedValueOnce({
      id: "job-emp",
    } as Awaited<ReturnType<typeof importsApi.validate>>);

    const mutation = useValidateImport() as unknown as {
      mutationFn: (args: {
        entityType: "employees";
        file: File;
      }) => Promise<unknown>;
    };

    await mutation.mutationFn({ entityType: "employees", file });

    expect(importsApi.validate).toHaveBeenCalledWith(
      "employees",
      file,
      undefined,
    );
  });
});

describe("useCommitImport", () => {
  beforeEach(() => {
    useMutationMock.mockClear();
    invalidateQueries.mockClear();
  });

  it("invalidates list, detail and errors on success", () => {
    const mutation = useCommitImport() as unknown as {
      onSuccess?: (data: { id: string }) => void;
    };

    mutation.onSuccess?.({ id: "job-42" });

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: importQueryKeys.lists(),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: importQueryKeys.detail("job-42"),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: importQueryKeys.errors("job-42"),
    });
  });
});

describe("useDownloadImportJobErrors", () => {
  beforeEach(() => {
    useMutationMock.mockClear();
  });

  it("wires mutationFn to importsApi.downloadJobErrors", async () => {
    vi.mocked(importsApi.downloadJobErrors).mockResolvedValueOnce(undefined);

    const mutation = useDownloadImportJobErrors() as unknown as {
      mutationFn: (id: string) => Promise<void>;
    };

    await mutation.mutationFn("job-99");

    expect(importsApi.downloadJobErrors).toHaveBeenCalledWith("job-99");
  });
});
