/**
 * Miniatura del logo de la empresa en el encabezado de la ficha.
 *
 * Compacta a propósito: identifica la empresa junto al título sin competir
 * con él. El preview de trabajo (más grande) vive en CompanyLogoField.
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
        "flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted/40 sm:h-16 sm:w-16",
        className,
      )}
    >
      {showImage ? (
        <img
          src={src ?? undefined}
          alt={copy.previewAlt}
          className="h-full w-full object-contain p-1.5"
          onError={() => {
            setFailed(true);
            onError?.();
          }}
        />
      ) : (
        <Building2
          className="h-6 w-6 text-muted-foreground"
          aria-hidden="true"
        />
      )}
    </div>
  );
});
