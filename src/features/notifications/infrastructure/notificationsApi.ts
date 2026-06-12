import { apiClient } from "@shared/api";
import type { ApiSingleResponse } from "@shared/api";
import type {
  ListNotificationsFilters,
  MarkAllNotificationsReadInput,
} from "../domain";
import {
  buildListParams,
  mapListNotificationsResponse,
  mapNotificationItem,
  type ApiListNotificationsResponseRaw,
  type ApiNotificationItemRaw,
} from "./mappers";

const NOTIFICATIONS_ENDPOINT = "/notifications";

export const notificationsApi = {
  list: async (filters: ListNotificationsFilters = {}) => {
    const response = await apiClient.get<ApiListNotificationsResponseRaw>(
      NOTIFICATIONS_ENDPOINT,
      { params: buildListParams(filters) },
    );
    return mapListNotificationsResponse(response);
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<{ data: { count: number } }>(
      `${NOTIFICATIONS_ENDPOINT}/unread-count`,
    );
    return response.data.count;
  },

  markRead: async (id: string) => {
    const response = await apiClient.patch<
      ApiSingleResponse<ApiNotificationItemRaw>
    >(`${NOTIFICATIONS_ENDPOINT}/${id}/read`);
    return mapNotificationItem(response.data);
  },

  markAllRead: async (input: MarkAllNotificationsReadInput = {}) => {
    const response = await apiClient.post<{ data: { updated: number } }>(
      `${NOTIFICATIONS_ENDPOINT}/mark-all-read`,
      {
        source: input.source,
        type: input.type,
      },
    );
    return response.data.updated;
  },

  dismiss: async (id: string) => {
    const response = await apiClient.patch<
      ApiSingleResponse<ApiNotificationItemRaw>
    >(`${NOTIFICATIONS_ENDPOINT}/${id}/dismiss`);
    return mapNotificationItem(response.data);
  },
};
