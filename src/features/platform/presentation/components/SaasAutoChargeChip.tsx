import { Badge } from "@shared/ui/badge";
import type { PlatformAutoChargeChipKind } from "../../domain/entities";
import { platformCopy } from "../copy/platformCopy";

interface SaasAutoChargeChipProps {
  kind: PlatformAutoChargeChipKind | null | undefined;
}

function chipVariant(
  kind: PlatformAutoChargeChipKind,
): "success" | "warning" | "destructive" | "info" | "secondary" {
  if (kind === "charged") return "success";
  if (kind === "failed") return "destructive";
  if (kind === "requires_action") return "warning";
  if (kind === "processing") return "info";
  return "secondary";
}

/** D12: chip en Estado. Cero columnas nuevas. */
export function SaasAutoChargeChip({ kind }: SaasAutoChargeChipProps) {
  if (!kind) return null;
  const copy = platformCopy.ar.chargeChip;
  const label =
    kind === "no_payment_method" ? copy.noPaymentMethod : copy[kind];
  return (
    <Badge tone="soft" variant={chipVariant(kind)}>
      {label}
    </Badge>
  );
}
