import { useQuery } from "@tanstack/react-query";
import { helpCenterApi } from "../infrastructure";
import { helpCenterQueryKeys } from "./helpCenterQueryKeys";

export function useHelpTicket(id: string) {
  return useQuery({
    queryKey: helpCenterQueryKeys.ticket(id),
    queryFn: () => helpCenterApi.getTicket(id),
    enabled: !!id,
  });
}
