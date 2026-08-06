import { describe, expect, it } from "vitest";
import { mapPaginatedUsers, type ApiUserListItemResponse } from "./mappers";

const listItem: ApiUserListItemResponse = {
  id: "user-1",
  email: "ana@empresa.com",
  first_name: "Ana",
  last_name: "Ruiz",
  role: "operator",
  status: "active",
  last_login: null,
  created_at: "2026-01-01T00:00:00.000Z",
};

describe("mapPaginatedUsers", () => {
  it("maps list items and capacity meta from snake_case", () => {
    const mapped = mapPaginatedUsers({
      data: [listItem],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        total_pages: 1,
      },
      meta: {
        active_count: 3,
        max_users: 5,
        limit_reached: false,
        over_quota: false,
        over_quota_count: 0,
      },
    });

    expect(mapped.data).toHaveLength(1);
    expect(mapped.data[0]).toMatchObject({
      id: "user-1",
      firstName: "Ana",
      lastName: "Ruiz",
      email: "ana@empresa.com",
    });
    expect(mapped.meta).toEqual({
      activeCount: 3,
      maxUsers: 5,
      limitReached: false,
      overQuota: false,
      overQuotaCount: 0,
    });
  });

  it("omits meta when API does not send it", () => {
    const mapped = mapPaginatedUsers({
      data: [listItem],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        total_pages: 1,
      },
    });

    expect(mapped.meta).toBeUndefined();
  });
});
