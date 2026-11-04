/**
 * Badge de origen del lote (manual vs automático).
 * `glossary="detail"` = Con confirmar / Sin confirmar (chrome detalle).
 * Default `list` = Manual / Automático (listado periodo).
 */

import { Badge } from "@shared/ui/badge";
import type { DispatchRunOrigin } from "../../domain/billingDispatchRun.types";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";

interface DispatchRunOriginBadgeProps {
  origin: DispatchRunOrigin;
  /** Vocabulario: listado vs chrome del detalle. */
  glossary?: "list" | "detail";
  className?: string;
}

export function DispatchRunOriginBadge({
  origin,
  glossary = "list",
  className,
}: DispatchRunOriginBadgeProps) {
  const label =
    glossary === "detail"
      ? origin === "scheduled"
        ? dispatchRunsCopy.detail.originScheduled
        : dispatchRunsCopy.detail.originManual
      : origin === "scheduled"
        ? dispatchRunsCopy.tab.origin.scheduled
        : dispatchRunsCopy.tab.origin.manual;

  if (origin === "scheduled") {
    return (
      <Badge variant="info" tone="soft" className={className}>
        {label}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
