import { useCallback, useState } from "react";
import { useToast } from "@shared/hooks";
import { downloadCsv } from "@shared/utils/exportCsv";
import type { BranchQueryParams } from "../../domain";
import { branchesApi } from "../../infrastructure";
import { branchesCopy } from "../../presentation/copy/branchesCopy";
import {
  getBranchExportHeaders,
  mapBranchesToCsvRows,
} from "../utils/branchExportHelpers";

const EXPORT_PAGE_LIMIT = 100;

function nowDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function fetchAllBranchesForExport(
  params: BranchQueryParams,
): Promise<Awaited<ReturnType<typeof branchesApi.getAll>>["data"]> {
  const items: Awaited<ReturnType<typeof branchesApi.getAll>>["data"] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const result = await branchesApi.getAll({
      ...params,
      page,
      limit: EXPORT_PAGE_LIMIT,
    });
    items.push(...result.data);
    totalPages = result.pagination.totalPages;
    page += 1;
  }

  return items;
}

export function useExportBranches() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const exportBranches = useCallback(
    async (params: BranchQueryParams) => {
      setIsExporting(true);
      try {
        const branches = await fetchAllBranchesForExport(params);

        if (branches.length === 0) {
          toast({
            title: branchesCopy.list.export.toast.empty,
            variant: "destructive",
          });
          return;
        }

        downloadCsv(
          `${branchesCopy.list.export.filePrefix}-${nowDateKey()}.csv`,
          getBranchExportHeaders(),
          mapBranchesToCsvRows(branches),
        );

        toast({
          title: branchesCopy.list.export.toast.success,
          variant: "success",
        });
      } catch (error) {
        toast({
          title: branchesCopy.list.export.toast.error,
          description: error instanceof Error ? error.message : undefined,
          variant: "destructive",
        });
      } finally {
        setIsExporting(false);
      }
    },
    [toast],
  );

  return { exportBranches, isExporting };
}
