import type {
  PlatformAutoChargeChipKind,
  PlatformChargeRunAttempt,
  PlatformChargeRunCounts,
  PlatformChargeRunItem,
} from "../../domain/entities";

export function chargeRunNeedsAttention(
  counts: PlatformChargeRunCounts,
): boolean {
  return (
    counts.failed > 0 ||
    counts.requiresAction > 0 ||
    counts.noPaymentMethod > 0
  );
}

/**
 * Chip from latest_attempts (real tries). Skip sin intento = no chip,
 * salvo NO_PAYMENT_METHOD en la corrida visible.
 */
export function resolveAutoChargeChip(args: {
  invoiceId: string;
  latestAttempts: PlatformChargeRunAttempt[];
  runItems?: PlatformChargeRunItem[];
}): PlatformAutoChargeChipKind | null {
  const attempt = args.latestAttempts.find(
    (item) => item.saasInvoiceId === args.invoiceId,
  );
  if (attempt) return attempt.outcome;

  const item = args.runItems?.find(
    (row) => row.saasInvoiceId === args.invoiceId,
  );
  if (item?.skipReason === "NO_PAYMENT_METHOD") {
    return "no_payment_method";
  }
  return null;
}
