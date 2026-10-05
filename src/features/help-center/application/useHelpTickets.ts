import { useQuery } from "@tanstack/react-query";
import { helpCenterApi, type HelpTicketsFilters } from "../infrastructure";
import { helpCenterQueryKeys } from "./helpCenterQueryKeys";

export function useHelpTickets(filters: HelpTicketsFilters = {}) {
  return useQuery({
    queryKey: helpCenterQueryKeys.tickets(
      filters as Record<string, unknown>,
    ),
    queryFn: () => helpCenterApi.getTickets(filters),
  });
}
