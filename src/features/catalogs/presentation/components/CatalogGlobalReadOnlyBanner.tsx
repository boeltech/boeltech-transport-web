import { Info } from "lucide-react";

import { DetailAlertCard } from "@shared/ui/data-display";
import { catalogsCopy } from "../copy/catalogsCopy";

interface CatalogGlobalReadOnlyBannerProps {
  variant?: "list" | "detail";
  scope?: "global" | "internal";
  /** Quién publica el catálogo (solo en variant="detail" con scope global). */
  sourceLabel?: string;
}

export function CatalogGlobalReadOnlyBanner({
  variant = "list",
  scope = "global",
  sourceLabel,
}: CatalogGlobalReadOnlyBannerProps) {
  const copy = catalogsCopy.readOnlyNotice;

  if (variant === "detail") {
    return (
      <DetailAlertCard
        severity="info"
        icon={<Info className="h-5 w-5" aria-hidden />}
        title={copy.detailTitle}
      >
        <p>
          {scope === "internal"
            ? copy.detailInternalDescription
            : copy.detailOfficialDescription(
                sourceLabel ?? catalogsCopy.publisher.sat,
              )}
        </p>
      </DetailAlertCard>
    );
  }

  return (
    <DetailAlertCard
      severity="info"
      icon={<Info className="h-5 w-5" aria-hidden />}
      title={copy.listTitle}
    >
      <p>{copy.listDescription}</p>
    </DetailAlertCard>
  );
}
