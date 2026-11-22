import { describe, expect, it, vi } from "vitest";
import type { QueryClient } from "@tanstack/react-query";

import { clientQueryKeys } from "@features/clients/domain";
import { financeQueryKeys } from "@features/finance/domain";
import { invalidateOperationalReceiptBatchSurface } from "./useOperationalReceiptBatch";

describe("invalidateOperationalReceiptBatchSurface (ola5 C4)", () => {
  it("invalidates client detail when clientId is known", async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);
    const queryClient = { invalidateQueries } as unknown as QueryClient;

    await invalidateOperationalReceiptBatchSurface(queryClient, {
      clientId: "client-orb-1",
      tripIds: [],
    });

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: clientQueryKeys.detail("client-orb-1"),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: financeQueryKeys.operationalReceiptBatchesRoot(),
    });
  });

  it("invalidates client details prefix when clientId is missing", async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);
    const queryClient = { invalidateQueries } as unknown as QueryClient;

    await invalidateOperationalReceiptBatchSurface(queryClient, {
      tripIds: [],
    });

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: clientQueryKeys.details(),
    });
  });
});
