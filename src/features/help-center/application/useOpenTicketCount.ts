import { useQuery } from "@tanstack/react-query";
import { helpCenterApi } from "../infrastructure";
import { helpCenterQueryKeys } from "./helpCenterQueryKeys";

/**
 * N = tickets with status `open` OR `in_progress`.
 * Two lightweight list calls (page_size=1) and sum of pagination.total.
 */
export async function fetchOpenTicketCount(): Promise<number> {
  const [open, inProgress] = await Promise.all([
    helpCenterApi.getTickets({ status: "open", page: 1, pageSize: 1 }),
    helpCenterApi.getTickets({
      status: "in_progress",
      page: 1,
      pageSize: 1,
    }),
  ]);
  return open.total + inProgress.total;
}

export function useOpenTicketCount(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: helpCenterQueryKeys.ticketOpenCount(),
    queryFn: fetchOpenTicketCount,
    enabled: options?.enabled ?? true,
  });
}
