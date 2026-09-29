import { useIncomingFrom } from "./listQueueFrom";

export const REPORTS_HUB_PATH = "/reports";

export const REPORTS_WAYFINDING_COPY = {
  backToReports: "Volver a reportes",
} as const;

export function isReportsHubHref(href: string): boolean {
  const path = href.split("?")[0] ?? href;
  return path === REPORTS_HUB_PATH;
}

export function useReportsReturnHref(): string | undefined {
  const incoming = useIncomingFrom();
  if (incoming && isReportsHubHref(incoming)) return incoming;
  return undefined;
}
