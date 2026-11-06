import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import type { PendingRelationFileFormat } from "@features/finance/domain";
import { financeApi } from "@features/finance/infrastructure";

export interface DownloadPendingRelationInput {
  clientRfc: string;
  format: PendingRelationFileFormat;
  /** Corte `YYYY-MM-DD` devuelto por `format=count`. */
  generatedOn: string;
}

/**
 * Descarga PDF o CSV. El nombre usa `generatedOn`, no la fecha del navegador.
 */
export function useDownloadPendingRelation(
  options?: Omit<
    UseMutationOptions<void, Error, DownloadPendingRelationInput>,
    "mutationFn"
  >,
) {
  return useMutation({
    mutationFn: ({ clientRfc, format, generatedOn }) =>
      financeApi.downloadPendingRelation(clientRfc, format, generatedOn),
    ...options,
  });
}
