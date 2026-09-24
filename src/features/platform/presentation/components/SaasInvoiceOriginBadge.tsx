import { Badge } from "@shared/ui/badge";
import type { PlatformSaasInvoiceOrigin } from "../../domain/entities";
import { platformCopy } from "../copy/platformCopy";

interface SaasInvoiceOriginBadgeProps {
  origin?: PlatformSaasInvoiceOrigin;
}

/** D6: badge secundario. Sin filtro por origen. */
export function SaasInvoiceOriginBadge({ origin }: SaasInvoiceOriginBadgeProps) {
  if (origin !== "auto_period_issue") return null;
  const copy = platformCopy.ar.origin;
  return (
    <Badge tone="soft" variant="secondary" title={copy.autoHint}>
      {copy.auto}
    </Badge>
  );
}
