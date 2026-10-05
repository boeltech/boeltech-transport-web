import { describe, expect, it, vi, beforeEach } from "vitest";
import { fetchOpenTicketCount } from "./useOpenTicketCount";
import { helpCenterApi } from "../infrastructure";

vi.mock("../infrastructure", () => ({
  helpCenterApi: {
    getTickets: vi.fn(),
  },
}));

const getTickets = vi.mocked(helpCenterApi.getTickets);

describe("fetchOpenTicketCount", () => {
  beforeEach(() => {
    getTickets.mockReset();
  });

  it("sums pagination.total from open and in_progress queries", async () => {
    getTickets
      .mockResolvedValueOnce({
        items: [],
        page: 1,
        pageSize: 1,
        total: 3,
        totalPages: 3,
      })
      .mockResolvedValueOnce({
        items: [],
        page: 1,
        pageSize: 1,
        total: 2,
        totalPages: 2,
      });

    await expect(fetchOpenTicketCount()).resolves.toBe(5);

    expect(getTickets).toHaveBeenCalledTimes(2);
    expect(getTickets).toHaveBeenNthCalledWith(1, {
      status: "open",
      page: 1,
      pageSize: 1,
    });
    expect(getTickets).toHaveBeenNthCalledWith(2, {
      status: "in_progress",
      page: 1,
      pageSize: 1,
    });
  });

  it("returns 0 when both totals are zero", async () => {
    getTickets.mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 1,
      total: 0,
      totalPages: 0,
    });

    await expect(fetchOpenTicketCount()).resolves.toBe(0);
  });
});
