import { apiClient } from "@shared/api";
import type { HelpArticle } from "../domain";
import type { PaginatedTickets, HelpTicketDetail } from "../domain";
import type { HelpProductEvent } from "../domain/helpEvents";
import {
  mapHelpArticleListResponse,
  mapHelpArticleSingleResponse,
  mapTicketListResponse,
  mapTicketDetailResponse,
  type ApiHelpArticleRaw,
  type ApiTicketListResponseRaw,
  type ApiTicketDetailRaw,
} from "./mappers";

const HELP_ENDPOINT = "/help";

export interface HelpArticlesFilters {
  screen?: string;
  q?: string;
  group?: string;
}

export interface HelpTicketsFilters {
  page?: number;
  pageSize?: number;
  status?: string;
}

function buildArticleParams(
  filters: HelpArticlesFilters,
): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.screen) params.screen = filters.screen;
  if (filters.q) params.q = filters.q;
  if (filters.group) params.group = filters.group;
  return params;
}

export const helpCenterApi = {
  getArticles: async (filters: HelpArticlesFilters = {}): Promise<HelpArticle[]> => {
    const response = await apiClient.get<{ data: ApiHelpArticleRaw[] }>(
      `${HELP_ENDPOINT}/articles`,
      { params: buildArticleParams(filters) },
    );
    return mapHelpArticleListResponse(response);
  },

  getArticle: async (id: string): Promise<HelpArticle> => {
    const response = await apiClient.get<{ data: ApiHelpArticleRaw }>(
      `${HELP_ENDPOINT}/articles/${id}`,
    );
    return mapHelpArticleSingleResponse(response);
  },

  // ── Tickets ──────────────────────────────────────────

  createTicket: async (
    formData: FormData,
  ): Promise<{ id: string; message: string }> => {
    const response = await apiClient.post<{
      data: { id: string };
      message: string;
    }>(`${HELP_ENDPOINT}/tickets`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { id: response.data.id, message: response.message };
  },

  getTickets: async (
    filters: HelpTicketsFilters = {},
  ): Promise<PaginatedTickets> => {
    const params: Record<string, string> = {
      page: String(filters.page ?? 1),
      page_size: String(filters.pageSize ?? 20),
    };
    if (filters.status) params.status = filters.status;
    const response = await apiClient.get<ApiTicketListResponseRaw>(
      `${HELP_ENDPOINT}/tickets`,
      { params },
    );
    return mapTicketListResponse(response);
  },

  getTicket: async (id: string): Promise<HelpTicketDetail> => {
    const response = await apiClient.get<{ data: ApiTicketDetailRaw }>(
      `${HELP_ENDPOINT}/tickets/${id}`,
    );
    return mapTicketDetailResponse(response);
  },

  /**
   * Authenticated blob download (Bearer via apiClient).
   * Do not navigate to download_url as a raw href — that omits auth.
   */
  downloadAttachment: async (
    ticketId: string,
    attachmentId: string,
    fileName: string,
  ): Promise<void> => {
    await apiClient.downloadFile(
      `${HELP_ENDPOINT}/tickets/${ticketId}/attachments/${attachmentId}`,
      fileName,
    );
  },

  /**
   * TEC Ola A §5 — `POST /help/events` → 202 `{ data: { accepted: true } }`.
   * Prefer `trackHelpEvent` (application) for fire-and-forget from UI.
   */
  postHelpEvent: async (
    event: HelpProductEvent,
  ): Promise<{ accepted: boolean }> => {
    const response = await apiClient.post<{ data: { accepted: boolean } }>(
      `${HELP_ENDPOINT}/events`,
      event,
    );
    return response.data;
  },
};
