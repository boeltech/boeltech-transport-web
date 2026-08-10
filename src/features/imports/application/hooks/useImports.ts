/**
 * React Query hooks — tenant master CSV imports.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  importQueryKeys,
  type ImportEntityType,
  type ImportJobListParams,
  type ImportImplementedEntityType,
  type ImportOptions,
} from "../../domain";
import { importsApi } from "../../infrastructure";

interface MutationCallbacks<TData = unknown, TError = Error> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

export const useImportJobs = (params?: ImportJobListParams) =>
  useQuery({
    queryKey: importQueryKeys.list(params),
    queryFn: () => importsApi.listJobs(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

export const useImportJob = (id: string) =>
  useQuery({
    queryKey: importQueryKeys.detail(id),
    queryFn: () => importsApi.getJob(id),
    enabled: Boolean(id),
  });

export const useImportJobErrors = (id: string, enabled = true) =>
  useQuery({
    queryKey: importQueryKeys.errors(id),
    queryFn: () => importsApi.getJobErrors(id),
    enabled: Boolean(id) && enabled,
  });

export const useDownloadImportTemplate = (
  callbacks?: MutationCallbacks<void>,
) => {
  return useMutation({
    mutationFn: (entityType: ImportEntityType) =>
      importsApi.downloadTemplate(entityType),
    onSuccess: () => {
      callbacks?.onSuccess?.();
    },
    onError: callbacks?.onError,
  });
};

export const useDownloadImportJobErrors = (
  callbacks?: MutationCallbacks<void>,
) => {
  return useMutation({
    mutationFn: (id: string) => importsApi.downloadJobErrors(id),
    onSuccess: () => {
      callbacks?.onSuccess?.();
    },
    onError: callbacks?.onError,
  });
};

export const useValidateImport = (
  callbacks?: MutationCallbacks<
    Awaited<ReturnType<typeof importsApi.validate>>
  >,
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      entityType,
      file,
      options,
    }: {
      entityType: ImportImplementedEntityType;
      file: File;
      options?: Partial<ImportOptions>;
    }) => importsApi.validate(entityType, file, options),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: importQueryKeys.lists() });
      callbacks?.onSuccess?.(result);
    },
    onError: callbacks?.onError,
  });
};

export const useCommitImport = (
  callbacks?: MutationCallbacks<
    Awaited<ReturnType<typeof importsApi.commit>>
  >,
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      options,
    }: {
      id: string;
      options?: Partial<ImportOptions>;
    }) => importsApi.commit(id, options),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: importQueryKeys.lists() });
      qc.invalidateQueries({ queryKey: importQueryKeys.detail(result.id) });
      qc.invalidateQueries({ queryKey: importQueryKeys.errors(result.id) });
      callbacks?.onSuccess?.(result);
    },
    onError: callbacks?.onError,
  });
};
