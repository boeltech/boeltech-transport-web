/**
 * Badge de origen de corrida (manual vs programada) — ADR-0083.
 */

import { Badge } from "@shared/ui/badge";
import type { DispatchRunOrigin } from "../../domain/billingDispatchRun.types";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";

interface DispatchRunOriginBadgeProps {
  origin: DispatchRunOrigin;
  className?: string;
}

export function DispatchRunOriginBadge({
  origin,
  className,
}: DispatchRunOriginBadgeProps) {
  if (origin === "scheduled") {
    return (
      <Badge variant="info" tone="soft" className={className}>
        {dispatchRunsCopy.tab.origin.scheduled}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={className}>
      {dispatchRunsCopy.tab.origin.manual}
    </Badge>
  );
}
