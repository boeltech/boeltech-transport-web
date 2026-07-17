import { Info } from "lucide-react";
import { AlertWithIcon } from "@shared/ui/alert";
import { catalogsCopy } from "../copy/catalogsCopy";

interface CatalogGlobalReadOnlyBannerProps {
  variant?: "list" | "detail";
  scope?: "global" | "internal";
  sourceLabel?: string;
  version?: string | null;
}

export function CatalogGlobalReadOnlyBanner({
  variant = "list",
  scope = "global",
  sourceLabel,
  version,
}: CatalogGlobalReadOnlyBannerProps) {
  const copy = catalogsCopy.readOnly;
  const versionLabel = version ?? copy.versionFallback;

  if (variant === "detail") {
    return (
      <AlertWithIcon variant="info" title={copy.bannerTitle}>
        {scope === "internal"
          ? copy.internalBannerDescription(versionLabel)
          : copy.bannerDescription(sourceLabel ?? "regulatoria", versionLabel)}
      </AlertWithIcon>
    );
  }

  const listCopy =
    scope === "internal"
      ? catalogsCopy.internalBanner
      : catalogsCopy.globalBanner;

  return (
    <AlertWithIcon variant="info" title={listCopy.title}>
      <div className="flex gap-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>{listCopy.description}</p>
      </div>
    </AlertWithIcon>
  );
}
