import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
  fetchAllBranchesForExport,
  useExportBranches,
} from "./useExportBranches";
import { buildBranchListItem } from "../../test/branchTestFixtures";
import { branchesCopy } from "../../presentation/copy/branchesCopy";
import { getBranchExportHeaders } from "../utils/branchExportHelpers";

const mockGetAll = vi.fn();
const mockDownloadCsv = vi.fn();
const mockToast = vi.fn();

vi.mock("../../infrastructure/branchesApi", () => ({
  branchesApi: {
    getAll: (...args: unknown[]) => mockGetAll(...args),
  },
}));

vi.mock("@shared/utils/exportCsv", () => ({
  downloadCsv: (...args: unknown[]) => mockDownloadCsv(...args),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe("fetchAllBranchesForExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("paginates through all pages preserving filters and sort", async () => {
    const page1Item = buildBranchListItem({ id: "page-1", code: "P1" });
    const page2Item = buildBranchListItem({ id: "page-2", code: "P2" });

    mockGetAll
      .mockResolvedValueOnce({
        data: [page1Item],
        pagination: { page: 1, limit: 100, total: 2, totalPages: 2 },
        meta: { activeCount: 2, maxBranches: 3, limitReached: false },
      })
      .mockResolvedValueOnce({
        data: [page2Item],
        pagination: { page: 2, limit: 100, total: 2, totalPages: 2 },
        meta: { activeCount: 2, maxBranches: 3, limitReached: false },
      });

    const result = await fetchAllBranchesForExport({
      page: 1,
      limit: 10,
      filters: { isActive: true, search: "QRO" },
      sort: { field: "name", direction: "asc" },
    });

    expect(result).toHaveLength(2);
    expect(mockGetAll).toHaveBeenCalledTimes(2);
    expect(mockGetAll.mock.calls[0]?.[0]).toMatchObject({
      page: 1,
      limit: 100,
      filters: { isActive: true, search: "QRO" },
      sort: { field: "name", direction: "asc" },
    });
    expect(mockGetAll.mock.calls[1]?.[0]).toMatchObject({ page: 2, limit: 100 });
  });
});

describe("useExportBranches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows empty toast when there are no branches to export", async () => {
    mockGetAll.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 100, total: 0, totalPages: 1 },
      meta: { activeCount: 0, maxBranches: 3, limitReached: false },
    });

    const { result } = renderHook(() => useExportBranches());

    await act(async () => {
      await result.current.exportBranches({ page: 1, limit: 10 });
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: branchesCopy.list.export.toast.empty,
      variant: "destructive",
    });
    expect(mockDownloadCsv).not.toHaveBeenCalled();
  });

  it("downloads CSV and shows success toast", async () => {
    const branch = buildBranchListItem();
    mockGetAll.mockResolvedValue({
      data: [branch],
      pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
      meta: { activeCount: 1, maxBranches: 3, limitReached: false },
    });

    const { result } = renderHook(() => useExportBranches());

    await act(async () => {
      await result.current.exportBranches({ page: 1, limit: 10 });
    });

    await waitFor(() => {
      expect(mockDownloadCsv).toHaveBeenCalled();
    });

    const [, headers] = mockDownloadCsv.mock.calls[0] ?? [];
    expect(headers).toEqual(getBranchExportHeaders());
    expect(mockToast).toHaveBeenCalledWith({
      title: branchesCopy.list.export.toast.success,
      variant: "success",
    });
  });
});
