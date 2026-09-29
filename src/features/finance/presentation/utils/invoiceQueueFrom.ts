import { useLocation } from "react-router-dom";

/** `location.state.from` = cola actual (pathname + query). */
export function useInvoiceQueueFromState(): { from: string } {
  const { pathname, search } = useLocation();
  return { from: `${pathname}${search}` };
}
