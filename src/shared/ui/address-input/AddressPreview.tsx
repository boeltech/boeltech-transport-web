import { MapPin } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import type { SavedAddressOption } from "./AddressInput.types";

interface AddressPreviewProps {
  address: SavedAddressOption;
  className?: string;
}

export function AddressPreview({ address, className }: AddressPreviewProps) {
  const addressLine = [
    `${address.street} ${address.exteriorNumber}`.trim(),
    address.interiorNumber ? `Int. ${address.interiorNumber}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  const geoLine = [
    address.neighborhoodName ?? null,
    address.postalCode,
    address.satStateCode,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className={cn("rounded-md border bg-muted/30 p-3 text-sm", className)}>
      <div className="flex items-start gap-2">
        <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
        <div className="space-y-1">
          <p className="font-medium text-foreground">{address.label}</p>
          <p className="text-muted-foreground">{addressLine}</p>
          <p className="text-xs text-muted-foreground">{geoLine}</p>
        </div>
      </div>
    </div>
  );
}
