import type { QueryClient } from "@tanstack/react-query";
import { financeQueryKeys } from "@features/finance/application";
import { invoiceQueryKeys } from "./invoiceQueryKeys";

/**
 * Invalidación canónica post-mutación de facturas.
 * Incluye raíz finance (listados cartera / cobros / workbenches).
 */
export function invalidateInvoiceQueries(
  queryClient: QueryClient,
  options?: { invoiceId?: string },
): void {
  void queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.lists() });
  if (options?.invoiceId) {
    void queryClient.invalidateQueries({
      queryKey: invoiceQueryKeys.detail(options.invoiceId),
    });
  }
  void queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
}
