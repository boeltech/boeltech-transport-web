/**
 * Host deep-link `?batch=<uuid>` en ficha cliente (PRD A1–A4).
 * Vive fuera de la card de saldo: monta aunque la card haga `return null`.
 */

import { useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import {
  OPERATIONAL_RECEIPT_BATCH_PARAM,
} from "@features/finance/application";
import { OperationalReceiptBatchSheet } from "@features/finance/presentation/components";

/** UUID canónico (RFC 4122 variant/version bits). */
const BATCH_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseBatchId(raw: string | null): string | null {
  if (!raw) return null;
  return BATCH_ID_RE.test(raw) ? raw : null;
}

export interface ClientOperationalReceiptBatchDeepLinkHostProps {
  /** Fuerza tab Datos al aterrizar con `?batch=` (A3). */
  onBatchPresent?: () => void;
}

export function ClientOperationalReceiptBatchDeepLinkHost({
  onBatchPresent,
}: ClientOperationalReceiptBatchDeepLinkHostProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get(OPERATIONAL_RECEIPT_BATCH_PARAM);
  const batchId = parseBatchId(raw);

  useEffect(() => {
    if (raw != null && batchId == null) {
      setSearchParams(
        (prev) => {
          if (!prev.has(OPERATIONAL_RECEIPT_BATCH_PARAM)) return prev;
          const next = new URLSearchParams(prev);
          next.delete(OPERATIONAL_RECEIPT_BATCH_PARAM);
          return next;
        },
        { replace: true },
      );
    }
  }, [raw, batchId, setSearchParams]);

  useEffect(() => {
    if (batchId) onBatchPresent?.();
  }, [batchId, onBatchPresent]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) return;
      setSearchParams(
        (prev) => {
          if (!prev.has(OPERATIONAL_RECEIPT_BATCH_PARAM)) return prev;
          const next = new URLSearchParams(prev);
          next.delete(OPERATIONAL_RECEIPT_BATCH_PARAM);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return (
    <OperationalReceiptBatchSheet
      batchId={batchId}
      open={Boolean(batchId)}
      onOpenChange={handleOpenChange}
    />
  );
}
