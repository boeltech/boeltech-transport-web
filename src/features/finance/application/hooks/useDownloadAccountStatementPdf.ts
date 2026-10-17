import {
  useMutation,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { financeApi } from "@features/finance/infrastructure";

/**
 * Descarga PDF del estado de cuenta por RFC (finance.read).
 * Contrato: GET /finance/account-statement/pdf?client_rfc=
 */
export function useDownloadAccountStatementPdf(
  options?: Omit<UseMutationOptions<void, Error, string>, "mutationFn">,
) {
  return useMutation({
    mutationFn: (clientRfc: string) =>
      financeApi.downloadAccountStatementPdf(clientRfc),
    ...options,
  });
}
