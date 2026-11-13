/**
 * API cobro por lote — Sin factura (B2).
 */

import { apiClient } from "@shared/api";
import type {
  CreateOperationalReceiptBatchInput,
  OperationalReceiptBatchCandidatesResult,
  OperationalReceiptBatchDetail,
  OperationalReceiptBatchListResult,
  VoidOperationalReceiptBatchInput,
} from "@features/finance/domain/operationalReceiptBatch";
import {
  mapOperationalReceiptBatchCandidates,
  mapOperationalReceiptBatchDetail,
  mapOperationalReceiptBatchList,
  type ApiOperationalReceiptBatchCandidatesRaw,
  type ApiOperationalReceiptBatchDetailRaw,
} from "./operationalReceiptBatchMappers";

export const operationalReceiptBatchApi = {
  async getCandidates(
    clientId: string,
  ): Promise<OperationalReceiptBatchCandidatesResult> {
    const raw = await apiClient.get<ApiOperationalReceiptBatchCandidatesRaw>(
      `/clients/${clientId}/operational-receipt-batches/candidates`,
    );
    return mapOperationalReceiptBatchCandidates(raw);
  },

  async create(
    clientId: string,
    input: CreateOperationalReceiptBatchInput,
  ): Promise<OperationalReceiptBatchDetail> {
    const body = {
      amount: input.amount,
      paymentInstrument: input.paymentInstrument,
      reference: input.reference ?? null,
      collectedAt: input.collectedAt,
      note: input.note ?? null,
      idempotencyKey: input.idempotencyKey,
      allocations: input.allocations.map((line) => ({
        tripId: line.tripId,
        amount: line.amount,
        expectedPendingAmount: line.expectedPendingAmount,
      })),
    };
    const raw = await apiClient.post<{
      data: ApiOperationalReceiptBatchDetailRaw;
      message?: string;
    }>(`/clients/${clientId}/operational-receipt-batches`, body);
    return mapOperationalReceiptBatchDetail(raw.data);
  },

  async getById(batchId: string): Promise<OperationalReceiptBatchDetail> {
    const raw = await apiClient.get<{
      data: ApiOperationalReceiptBatchDetailRaw;
    }>(`/operational-receipt-batches/${batchId}`);
    return mapOperationalReceiptBatchDetail(raw.data);
  },

  async listByClient(
    clientId: string,
    params?: {
      page?: number;
      limit?: number;
      includeVoided?: boolean;
    },
  ): Promise<OperationalReceiptBatchListResult> {
    const search = new URLSearchParams();
    search.set("page", String(params?.page ?? 1));
    search.set("limit", String(params?.limit ?? 20));
    if (params?.includeVoided === false) {
      search.set("include_voided", "false");
    }
    const raw = await apiClient.get<{
      data: ApiOperationalReceiptBatchDetailRaw[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
      };
    }>(
      `/clients/${clientId}/operational-receipt-batches?${search.toString()}`,
    );
    return mapOperationalReceiptBatchList(raw);
  },

  async void(
    batchId: string,
    input: VoidOperationalReceiptBatchInput,
  ): Promise<OperationalReceiptBatchDetail> {
    const raw = await apiClient.post<{
      data: ApiOperationalReceiptBatchDetailRaw;
      message?: string;
    }>(`/operational-receipt-batches/${batchId}/void`, {
      reason: input.reason,
    });
    return mapOperationalReceiptBatchDetail(raw.data);
  },
};
