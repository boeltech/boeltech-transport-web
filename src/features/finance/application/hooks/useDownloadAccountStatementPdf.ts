import type { AccountStatementTarget } from "../../domain";
import {
  useMutation,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { financeApi } from "@features/finance/infrastructure";

/**
 * Descarga PDF del estado de cuenta por RFC (finance.read).
 * Contrato: GET /finance/account-statement/pdf?client_rfc= | client_id=
 */
export function useDownloadAccountStatementPdf(
  options?: Omit<
    UseMutationOptions<void, Error, AccountStatementTarget>,
    "mutationFn"
  >,
) {
  return useMutation({
    mutationFn: (target: AccountStatementTarget) =>
      financeApi.downloadAccountStatementPdf(target),
    ...options,
  });
}
