/**
 * GET /trips/operational-cash-pending — bandeja Efectivo por cobrar.
 * Auth: finance.read (API).
 */

import { apiClient } from "@shared/api";
import type {
  OperationalCashPendingQueryParams,
  OperationalCashPendingResult,
} from "@features/finance/domain/operationalCashPending";
import { OPERATIONAL_CASH_PENDING_PAGE_SIZE } from "@features/finance/domain/operationalCashPending";
import {
  mapOperationalCashPendingResponse,
  type ApiOperationalCashPendingResponseRaw,
} from "./operationalCashPendingMappers";

const ENDPOINT = "/trips/operational-cash-pending";

export const operationalCashPendingApi = {
  async list(
    params: OperationalCashPendingQueryParams = {},
  ): Promise<OperationalCashPendingResult> {
    const search = new URLSearchParams();
    const page = params.page ?? 1;
    const limit = params.limit ?? OPERATIONAL_CASH_PENDING_PAGE_SIZE;
    search.set("page", String(page));
    search.set("limit", String(limit));
    const clientId = params.clientId?.trim();
    if (clientId) {
      search.set("client_id", clientId);
    }
    const raw = await apiClient.get<ApiOperationalCashPendingResponseRaw>(
      `${ENDPOINT}?${search.toString()}`,
    );
    return mapOperationalCashPendingResponse(raw);
  },
};
