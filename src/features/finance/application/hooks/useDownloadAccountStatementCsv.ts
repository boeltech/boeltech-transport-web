import {
  useMutation,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  financeApi,
  type AccountStatementDownloadOptions,
} from "@features/finance/infrastructure";

export interface DownloadAccountStatementCsvInput {
  clientRfc: string;
  options?: AccountStatementDownloadOptions;
}

/**
 * Descarga CSV del estado de cuenta por RFC (finance.read).
 * Contrato: GET /finance/account-statement/csv?client_rfc=
 */
export function useDownloadAccountStatementCsv(
  options?: Omit<
    UseMutationOptions<void, Error, DownloadAccountStatementCsvInput>,
    "mutationFn"
  >,
) {
  return useMutation({
    mutationFn: ({ clientRfc, options: downloadOptions }) =>
      financeApi.downloadAccountStatementCsv(clientRfc, downloadOptions),
    ...options,
  });
}
