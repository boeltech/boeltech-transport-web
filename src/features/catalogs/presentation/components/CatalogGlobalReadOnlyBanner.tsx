import { AlertWithIcon } from "@shared/ui/alert";
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
      <AlertWithIcon variant="info" title={copy.detailTitle}>
        {scope === "internal"
          ? copy.detailInternalDescription
          : copy.detailOfficialDescription(
              sourceLabel ?? catalogsCopy.publisher.sat,
            )}
      </AlertWithIcon>
    );
  }

  return (
    <AlertWithIcon variant="info" title={copy.listTitle}>
      {copy.listDescription}
    </AlertWithIcon>
  );
}
