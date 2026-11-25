import {
  useMutation,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  financeApi,
  type AccountStatementDownloadOptions,
} from "@features/finance/infrastructure";
import type { AccountStatementTarget } from "../../domain";

export interface DownloadAccountStatementCsvInput {
  target: AccountStatementTarget;
  options?: AccountStatementDownloadOptions;
}

/**
 * Descarga CSV del estado de cuenta de un cliente (finance.read).
 * Contrato: GET /finance/account-statement/csv?client_rfc= | client_id=
 */
export function useDownloadAccountStatementCsv(
  options?: Omit<
    UseMutationOptions<void, Error, DownloadAccountStatementCsvInput>,
    "mutationFn"
  >,
) {
  return useMutation({
    mutationFn: ({ target, options: downloadOptions }) =>
      financeApi.downloadAccountStatementCsv(target, downloadOptions),
    ...options,
  });
}
