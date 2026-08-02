/**
 * Miniatura del logo de la empresa.
 *
 * Se usa en el encabezado de la ficha y como preview del control de subida.
 */

import { memo, useState } from "react";
import { Building2 } from "lucide-react";

import { cn } from "@shared/lib/utils/cn";
import { generalSettingsCopy } from "../copy/generalSettingsCopy";

const copy = generalSettingsCopy.logo;

export interface CompanyLogoMarkProps {
  src: string | null;
  className?: string;
  onError?: () => void;
}

export const CompanyLogoMark = memo(function CompanyLogoMark({
  src,
  className,
  onError,
}: CompanyLogoMarkProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div
      className={cn(
        "flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border bg-card",
        className,
      )}
    >
      {showImage ? (
        <img
          src={src ?? undefined}
          alt={copy.previewAlt}
          className="h-full w-full object-contain p-1"
          onError={() => {
            setFailed(true);
            onError?.();
          }}
        />
      ) : (
        <Building2 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      )}
    </div>
  );
});
